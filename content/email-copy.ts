import { siteConfig } from "@/content/site-config";

type InquiryEmailData = Record<"name" | "email" | "shootType" | "date" | "location" | "budget" | "message", string>;
const notSpecified = "Not specified";

export const inquiryApiCopy = {
  notConfigured: "Inquiries are not configured yet. Add the Resend key when you are ready to test the form.",
  requiredFields: "Please complete the required fields.",
  invalidEmail: "Please enter a valid email address.",
  notSpecified,
  deliveryError: `Your note could not be delivered. Please email ${siteConfig.email} instead.`,
  ownerSubject: (data: InquiryEmailData) => `New ${data.shootType} inquiry from ${data.name}`,
  ownerHtml: (data: InquiryEmailData) => `<h1>New photography inquiry</h1><p><strong>From:</strong> ${data.name} (${data.email})</p><p><strong>Type:</strong> ${data.shootType}</p><p><strong>Date:</strong> ${data.date || notSpecified}</p><p><strong>Location:</strong> ${data.location || notSpecified}</p><p><strong>Budget:</strong> ${data.budget || notSpecified}</p><p><strong>Note:</strong><br>${data.message.replace(/\n/g, "<br>")}</p>`,
  visitorSubject: "I got your note — kurtis.photo",
  visitorHtml: (data: InquiryEmailData) => `<p>Thanks for reaching out, ${data.name}.</p><p>I got your note and will be in touch soon.</p><p>—Kurtis</p>`,
} as const;

export const checkoutApiCopy = {
  notConfigured: "Checkout is not configured yet. Add the Stripe test key when you are ready to test purchases.",
  emptyCart: "Your cart is empty.",
  invalidItem: "One cart item is invalid.",
  unavailableItem: "One cart item is no longer available.",
  stripeError: "Stripe could not create a checkout session.",
} as const;
