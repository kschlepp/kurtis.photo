"use client";

import { FormEvent, useState } from "react";
import { inquiryConfig, routes } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";

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
      const response = await fetch(routes.inquireApi, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? siteCopy.inquiry.error);
      setStatus("sent");
      setValues(initialState);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : siteCopy.inquiry.error);
    }
  }

  function change(name: keyof typeof initialState, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  if (status === "sent") {
    return <div className="form-success"><p className="eyebrow">{siteCopy.inquiry.successEyebrow}</p><h2>{siteCopy.inquiry.successTitle}</h2><p>{siteCopy.inquiry.successBody}</p></div>;
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <label className="honeypot" aria-hidden="true">{siteCopy.inquiry.fields.website}<input value={values.website} onChange={(event) => change("website", event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      <label>{siteCopy.inquiry.fields.name}<input required value={values.name} onChange={(event) => change("name", event.target.value)} /></label>
      <label>{siteCopy.inquiry.fields.email}<input required type="email" value={values.email} onChange={(event) => change("email", event.target.value)} /></label>
      <label>{siteCopy.inquiry.fields.shootType}
        <select required value={values.shootType} onChange={(event) => change("shootType", event.target.value)}>
          <option value="">{siteCopy.inquiry.fields.shootTypePlaceholder}</option>
          {inquiryConfig.shootTypes.map((shootType) => <option key={shootType}>{shootType}</option>)}
        </select>
      </label>
      <label>{siteCopy.inquiry.fields.date}<input value={values.date} onChange={(event) => change("date", event.target.value)} placeholder={siteCopy.inquiry.fields.datePlaceholder} /></label>
      <label>{siteCopy.inquiry.fields.location}<input value={values.location} onChange={(event) => change("location", event.target.value)} placeholder={siteCopy.inquiry.fields.locationPlaceholder} /></label>
      <label>{siteCopy.inquiry.fields.budget}<input value={values.budget} onChange={(event) => change("budget", event.target.value)} placeholder={siteCopy.inquiry.fields.budgetPlaceholder} /></label>
      <label className="field-wide">{siteCopy.inquiry.fields.message}<textarea required rows={6} value={values.message} onChange={(event) => change("message", event.target.value)} /></label>
      <label className="checkbox field-wide"><input required type="checkbox" checked={values.consent} onChange={(event) => change("consent", event.target.checked)} /> {siteCopy.inquiry.fields.consent}</label>
      {error && <p className="form-error field-wide">{error}</p>}
      <button className="button button-ink field-wide" disabled={status === "sending"} type="submit">{status === "sending" ? siteCopy.inquiry.sending : siteCopy.inquiry.submit}</button>
    </form>
  );
}
