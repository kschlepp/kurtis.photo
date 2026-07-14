import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders kurtis.photo", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>kurtis\.photo<\/title>/i);
  assert.match(html, /Things I saw along the way\./);
  assert.match(html, /Yosemite/);
  assert.match(html, /Explore places/);
  assert.match(html, /Photo index/);
  assert.match(html, /href="\/">Places<\/a>/);
  assert.doesNotMatch(html, /From the archive|Find a place, then wander/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps a photo-led archive behind the globe home", async () => {
  const response = await render("/places");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Explore the globe/);
  assert.match(html, /All places/);
  assert.match(html, /Cover photograph from Yosemite/);
  assert.doesNotMatch(html, /Follow the pins/);
});

test("keeps the archive separate from the curated Prints page", async () => {
  const response = await render("/prints");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Nothing is for sale right now\./);
  assert.doesNotMatch(html, /Add print/i);
});

test("leads the portraits page with photography", async () => {
  const response = await render("/portraits");
  assert.equal(response.status, 200);

  const html = await response.text();
  const image = html.indexOf("portrait-hero-image");
  const heading = html.indexOf("People, as they are.");
  assert.ok(image >= 0 && heading >= 0 && image < heading);
  assert.match(html, /Portrait from/);
  assert.doesNotMatch(html, /Have a person, occasion, or loose idea/);
});
