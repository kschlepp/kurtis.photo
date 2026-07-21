import assert from "node:assert/strict";
import test from "node:test";
import { verifyStripeWebhookSignature } from "../lib/stripe-signature.mjs";

async function sign(payload, secret, timestamp) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

test("verifies Stripe webhook signatures against the untouched request body", async () => {
  const payload = JSON.stringify({ id: "evt_checkout", type: "checkout.session.completed" });
  const secret = "whsec_test_secret";
  const timestamp = 1_800_000_000;
  const signature = await sign(payload, secret, timestamp);

  assert.equal(
    await verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${signature}`, secret, 300, timestamp + 10),
    true,
  );
  assert.equal(
    await verifyStripeWebhookSignature(`${payload} `, `t=${timestamp},v1=${signature}`, secret, 300, timestamp + 10),
    false,
  );
});

test("rejects stale Stripe webhook signatures", async () => {
  const payload = "{}";
  const secret = "whsec_test_secret";
  const timestamp = 1_800_000_000;
  const signature = await sign(payload, secret, timestamp);

  assert.equal(
    await verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${signature}`, secret, 300, timestamp + 301),
    false,
  );
});
