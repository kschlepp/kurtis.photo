function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Inquiries are not configured yet. Add the Resend key when you are ready to test the form." }, { status: 503 });
  }
  const input = await request.json() as Record<string, unknown>;
  const fields = ["name", "email", "shootType", "date", "location", "budget", "message"] as const;
  const requiredFields = ["name", "email", "shootType", "message"] as const;
  if (input.website) return Response.json({ ok: true });
  if (!input.consent || requiredFields.some((field) => typeof input[field] !== "string" || !input[field].trim())) {
    return Response.json({ error: "Please complete the required fields." }, { status: 400 });
  }
  const email = String(input.email).trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  const data = Object.fromEntries(fields.map((field) => [field, escapeHtml(typeof input[field] === "string" ? input[field].trim() : "")]));
  const sender = process.env.RESEND_FROM ?? "kurtis.photo <hello@updates.kurtis.photo>";
  const owner = process.env.INQUIRY_TO ?? "ks@kurtis.photo";
  const messages = [
    {
      from: sender,
      to: [owner],
      reply_to: email,
      subject: `New ${data.shootType} inquiry from ${data.name}`,
      html: `<h1>New photography inquiry</h1><p><strong>From:</strong> ${data.name} (${data.email})</p><p><strong>Type:</strong> ${data.shootType}</p><p><strong>Date:</strong> ${data.date || "Not specified"}</p><p><strong>Location:</strong> ${data.location || "Not specified"}</p><p><strong>Budget:</strong> ${data.budget || "Not specified"}</p><p><strong>Note:</strong><br>${data.message.replace(/\n/g, "<br>")}</p>`,
    },
    {
      from: sender,
      to: [email],
      reply_to: owner,
      subject: "I got your note — kurtis.photo",
      html: `<p>Thanks for reaching out, ${data.name}.</p><p>I got your note and will be in touch soon.</p><p>—Kurtis</p>`,
    },
  ];

  const results = await Promise.all(messages.map((message) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  })));
  if (results.some((result) => !result.ok)) return Response.json({ error: "Your note could not be delivered. Please email ks@kurtis.photo instead." }, { status: 502 });
  return Response.json({ ok: true });
}
