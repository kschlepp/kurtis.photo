import { siteConfig } from "@/content/site-config";

type InquiryEmailData = Record<"name" | "email" | "shootType" | "date" | "location" | "budget" | "message", string>;
type OrderEmailItem = { photograph: string; size: string; quantity: number; unitPrice: string };
type OrderEmailData = {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderEmailItem[];
  total: string;
  orderReference: string;
  dashboardUrl: string;
};
const notSpecified = "Not specified";

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function orderItemsHtml(items: OrderEmailItem[]) {
  return `<ul>${items.map((item) => `<li><strong>${escapeEmailHtml(item.photograph)}</strong> — ${escapeEmailHtml(item.size)} × ${item.quantity} (${escapeEmailHtml(item.unitPrice)} each)</li>`).join("")}</ul>`;
}

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
  tooManyItems: "Your cart contains too many different print selections.",
} as const;

export const orderApiCopy = {
  notConfigured: "Order fulfillment is not configured.",
  invalidSignature: "Invalid Stripe signature.",
  invalidEvent: "Invalid Stripe event.",
  unavailableOrder: "The Stripe order could not be retrieved.",
  invalidOrder: "The order did not contain valid print details.",
  deliveryError: "The order emails could not be delivered.",
  updateError: "The order notification status could not be saved.",
  ownerSubject: (data: OrderEmailData) => `New print order ${data.orderReference} from ${data.customerName}`,
  ownerHtml: (data: OrderEmailData) => `<h1>New print order</h1><p><strong>Order:</strong> ${escapeEmailHtml(data.orderReference)}</p><p><strong>Customer:</strong> ${escapeEmailHtml(data.customerName)} (${escapeEmailHtml(data.customerEmail)})</p>${orderItemsHtml(data.items)}<p><strong>Total paid:</strong> ${escapeEmailHtml(data.total)}</p><p><strong>Ship to:</strong><br>${escapeEmailHtml(data.shippingAddress).replace(/\n/g, "<br>")}</p><p><a href="${escapeEmailHtml(data.dashboardUrl)}">Open this payment in Stripe</a></p>`,
  customerSubject: (data: OrderEmailData) => `Your kurtis.photo print order ${data.orderReference}`,
  customerHtml: (data: OrderEmailData) => `<p>Thanks for your order, ${escapeEmailHtml(data.customerName)}.</p>${orderItemsHtml(data.items)}<p><strong>Total paid:</strong> ${escapeEmailHtml(data.total)}</p><p>Your print is made to order and usually ships within 7–14 business days. I’ll email you if anything needs your attention.</p><p>—Kurtis</p>`,
} as const;
