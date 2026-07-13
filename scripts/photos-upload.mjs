#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [collectionSlug] = process.argv.slice(2);
const bucket = process.env.R2_BUCKET;
const startFrom = process.env.R2_UPLOAD_FROM ?? null;
const maxUploadAttempts = 3;

if (!collectionSlug || !/^[a-z0-9-]+$/.test(collectionSlug)) {
  console.error("Usage: R2_BUCKET=<bucket-name> npm run photos:upload -- <collection-slug>");
  process.exit(1);
}

if (!bucket) {
  console.error("Set R2_BUCKET to the Cloudflare R2 bucket name before uploading.");
  process.exit(1);
}

const mediaDirectory = path.join(root, "public", "media", collectionSlug);
const files = (await readdir(mediaDirectory))
  .filter((filename) => /\.(jpe?g)$/i.test(filename))
  .filter((filename) => !startFrom || filename.localeCompare(startFrom) >= 0)
  .sort((left, right) => left.localeCompare(right));

if (files.length === 0) {
  console.error(`No prepared JPEG files found in ${mediaDirectory}. Run photos:prepare first.`);
  process.exit(1);
}

async function uploadObject(localFile, objectKey) {
  for (let attempt = 1; attempt <= maxUploadAttempts; attempt += 1) {
    try {
      await execFileAsync(path.join(root, "node_modules", ".bin", "wrangler"), [
        "r2", "object", "put", `${bucket}/${objectKey}`,
        "--file", localFile,
        "--content-type", "image/jpeg",
        "--remote",
      ], { stdio: "inherit" });
      return;
    } catch (error) {
      if (attempt === maxUploadAttempts) throw error;
      console.warn(`Upload failed for ${objectKey}; retrying (${attempt}/${maxUploadAttempts}).`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

if (startFrom) {
  console.log(`Resuming ${collectionSlug} at ${startFrom}.`);
}

for (const filename of files) {
  const localFile = path.join(mediaDirectory, filename);
  const objectKey = `${collectionSlug}/${filename}`;
  await uploadObject(localFile, objectKey);
}

console.log(`Uploaded ${files.length} public image variants for ${collectionSlug}.`);
