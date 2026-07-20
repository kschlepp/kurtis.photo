import { inquiryApiCopy } from "@/content/email-copy";
import { inquiryConfig, siteConfig } from "@/content/site-config";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: inquiryApiCopy.notConfigured }, { status: 503 });
  }
  const input = await request.json() as Record<string, unknown>;
  if (input.website) return Response.json({ ok: true });
  if (!input.consent || inquiryConfig.requiredFields.some((field) => typeof input[field] !== "string" || !input[field].trim())) {
    return Response.json({ error: inquiryApiCopy.requiredFields }, { status: 400 });
  }
  const email = String(input.email).trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: inquiryApiCopy.invalidEmail }, { status: 400 });

  const data = Object.fromEntries(inquiryConfig.fields.map((field) => [field, escapeHtml(typeof input[field] === "string" ? input[field].trim() : "")])) as Record<(typeof inquiryConfig.fields)[number], string>;
  const sender = process.env.RESEND_FROM ?? inquiryConfig.defaultSender;
  const owner = process.env.INQUIRY_TO ?? siteConfig.email;
  const messages = [
    {
      from: sender,
      to: [owner],
      reply_to: email,
      subject: inquiryApiCopy.ownerSubject(data),
      html: inquiryApiCopy.ownerHtml(data),
    },
    {
      from: sender,
      to: [email],
      reply_to: owner,
      subject: inquiryApiCopy.visitorSubject,
      html: inquiryApiCopy.visitorHtml(data),
    },
  ];

  const results = await Promise.all(messages.map((message) => fetch(inquiryConfig.resendApiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  })));
  if (results.some((result) => !result.ok)) return Response.json({ error: inquiryApiCopy.deliveryError }, { status: 502 });
  return Response.json({ ok: true });
}
