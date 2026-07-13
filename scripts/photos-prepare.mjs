#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [collectionSlug] = process.argv.slice(2);

if (!collectionSlug) {
  console.error("Usage: npm run photos:prepare -- <collection-slug>");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(collectionSlug)) {
  console.error("Collection slugs may contain lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const sourceDirectory = path.join(root, "photo-intake", "places", collectionSlug);
const publicDirectory = path.join(root, "public", "media", collectionSlug);
const workDirectory = path.join(root, ".photo-work", collectionSlug);
const manifestDirectory = path.join(root, "content", "generated");
const imageSizes = [768, 1600, 2400];
const jpegtran = "/opt/homebrew/bin/jpegtran";

function parseSipsMetadata(stdout) {
  const valueFor = (property) => {
    const match = stdout.match(new RegExp(`\\n\\s*${property}:\\s*(.+)`));
    const value = match?.[1]?.trim();
    return value && value !== "<nil>" ? value : null;
  };

  return {
    width: Number(valueFor("pixelWidth")),
    height: Number(valueFor("pixelHeight")),
    cameraMake: valueFor("make"),
    cameraBody: valueFor("model"),
    captureDate: valueFor("creation"),
  };
}

function publicId(filename) {
  return path.basename(filename, path.extname(filename)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function run(command, args) {
  await execFileAsync(command, args, { maxBuffer: 10 * 1024 * 1024 });
}

async function inspect(sourcePath) {
  const { stdout } = await execFileAsync("sips", [
    "-g", "pixelWidth",
    "-g", "pixelHeight",
    "-g", "make",
    "-g", "model",
    "-g", "creation",
    sourcePath,
  ]);
  return parseSipsMetadata(stdout);
}

async function contentHash(sourcePath) {
  const contents = await readFile(sourcePath);
  return createHash("sha256").update(contents).digest("hex").slice(0, 12);
}

async function createVariant(sourcePath, assetKey, longestEdge) {
  const temporaryPath = path.join(workDirectory, `${assetKey}-${longestEdge}.jpg`);
  const outputPath = path.join(publicDirectory, `${assetKey}-${longestEdge}.jpg`);

  await run("sips", [
    "-Z", String(longestEdge),
    "-s", "format", "jpeg",
    "-s", "formatOptions", "82",
    sourcePath,
    "--out", temporaryPath,
  ]);

  await run(jpegtran, [
    "-copy", "none",
    "-optimize",
    "-outfile", outputPath,
    temporaryPath,
  ]);

  return `/media/${collectionSlug}/${assetKey}-${longestEdge}.jpg`;
}

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });
await mkdir(workDirectory, { recursive: true });
await mkdir(manifestDirectory, { recursive: true });

const files = (await readdir(sourceDirectory))
  .filter((filename) => /\.(jpe?g)$/i.test(filename))
  .sort((left, right) => left.localeCompare(right));

if (files.length === 0) {
  console.error(`No JPEG files found in ${sourceDirectory}`);
  process.exit(1);
}

const images = [];
for (const [index, filename] of files.entries()) {
  const sourcePath = path.join(sourceDirectory, filename);
  const id = publicId(filename);
  const hash = await contentHash(sourcePath);
  const assetKey = `${id}-${hash}`;
  const metadata = await inspect(sourcePath);
  const variants = {};

  for (const size of imageSizes) {
    variants[String(size)] = await createVariant(sourcePath, assetKey, size);
  }

  images.push({
    id,
    title: null,
    alt: `${collectionSlug.replace(/-/g, " ")} photograph ${index + 1}`,
    sourceFile: filename,
    printSource: filename,
    assetKey,
    order: index + 1,
    sellable: true,
    releaseStatus: "not-applicable",
    width: metadata.width,
    height: metadata.height,
    variants,
    metadata: {
      cameraMake: metadata.cameraMake,
      cameraBody: metadata.cameraBody,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
      captureDate: metadata.captureDate,
    },
  });
}

const manifest = {
  slug: collectionSlug,
  title: "Yosemite '25",
  location: "Yosemite National Park, California",
  note: null,
  featured: true,
  coverImageId: images.find((image) => image.width / image.height > 1.6)?.id ?? images[0].id,
  coordinates: { latitude: 37.8651, longitude: -119.5383 },
  images,
};

await writeFile(
  path.join(manifestDirectory, `${collectionSlug}.json`),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

await rm(workDirectory, { recursive: true, force: true });
console.log(`Prepared ${images.length} photographs for ${collectionSlug}.`);
