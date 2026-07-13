"use client";

import { FormEvent, useState } from "react";

const initialState = {
  name: "",
  email: "",
  shootType: "",
  date: "",
  location: "",
  budget: "",
  message: "",
  consent: false,
  website: "",
};

export function InquiryForm() {
  const [values, setValues] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/inquire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your note could not be sent.");
      setStatus("sent");
      setValues(initialState);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Your note could not be sent.");
    }
  }

  function change(name: keyof typeof initialState, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  if (status === "sent") {
    return <div className="form-success"><p className="eyebrow">Message received</p><h2>Thanks for reaching out.</h2><p>I got your note and will be in touch soon. —Kurtis</p></div>;
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <label className="honeypot" aria-hidden="true">Website<input value={values.website} onChange={(event) => change("website", event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      <label>Name<input required value={values.name} onChange={(event) => change("name", event.target.value)} /></label>
      <label>Email<input required type="email" value={values.email} onChange={(event) => change("email", event.target.value)} /></label>
      <label>What are you planning?
        <select required value={values.shootType} onChange={(event) => change("shootType", event.target.value)}>
          <option value="">Choose one</option>
          <option>Individual portrait</option><option>Couples session</option><option>Family session</option><option>Engagement or proposal</option><option>Headshots</option><option>Something else</option>
        </select>
      </label>
      <label>Ideal date or timeframe<input value={values.date} onChange={(event) => change("date", event.target.value)} placeholder="Whenever the light is right" /></label>
      <label>Location<input value={values.location} onChange={(event) => change("location", event.target.value)} placeholder="San Diego, or somewhere farther" /></label>
      <label>Approximate budget<input value={values.budget} onChange={(event) => change("budget", event.target.value)} placeholder="Optional" /></label>
      <label className="field-wide">Tell me more<textarea required rows={6} value={values.message} onChange={(event) => change("message", event.target.value)} /></label>
      <label className="checkbox field-wide"><input required type="checkbox" checked={values.consent} onChange={(event) => change("consent", event.target.checked)} /> I’m happy for Kurtis to use this information to respond to my photography request.</label>
      {error && <p className="form-error field-wide">{error}</p>}
      <button className="button button-ink field-wide" disabled={status === "sending"} type="submit">{status === "sending" ? "Sending…" : "Send inquiry"}</button>
    </form>
  );
}
