const encoder = new TextEncoder();

function decodeHex(value) {
  if (!/^[a-f\d]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function verifyStripeWebhookSignature(
  payload,
  signatureHeader,
  secret,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!payload || !signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestampValue = parts.find(([key]) => key === "t")?.[1];
  const timestamp = Number(timestampValue);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  if (!Number.isInteger(timestamp) || signatures.length === 0 || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)));
  return signatures.some((signature) => {
    const candidate = decodeHex(signature);
    return candidate ? constantTimeEqual(expected, candidate) : false;
  });
}
