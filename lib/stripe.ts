import { commerceConfig, siteConfig } from "@/content/site-config";
import { formatPrice, formatPrintName, getCollection, getPhoto, getPrintOptionForPhoto } from "@/lib/catalog";

export type CheckoutOrderItem = {
  collectionSlug: string;
  photoId: string;
  sizeId: string;
  quantity: number;
  photograph: string;
  size: string;
  unitPrice: string;
};

export type StripeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type StripeCheckoutSession = {
  id: string;
  livemode?: boolean;
  payment_status?: string;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    address?: StripeAddress | null;
  } | null;
  shipping_details?: { name?: string | null; address?: StripeAddress | null } | null;
  collected_information?: {
    shipping_details?: { name?: string | null; address?: StripeAddress | null } | null;
  } | null;
};

export function serializeCheckoutItem(item: Pick<CheckoutOrderItem, "collectionSlug" | "photoId" | "sizeId" | "quantity">) {
  return JSON.stringify({ c: item.collectionSlug, p: item.photoId, s: item.sizeId, q: item.quantity });
}

export function getCheckoutOrderItems(session: StripeCheckoutSession): CheckoutOrderItem[] {
  const metadata = session.metadata ?? {};
  const count = Number(metadata[commerceConfig.checkoutItemCountMetadataKey]);
  if (!Number.isInteger(count) || count < 1 || count > commerceConfig.maxDistinctItems) return [];

  return Array.from({ length: count }, (_, index) => {
    try {
      const raw = metadata[`${commerceConfig.checkoutItemMetadataPrefix}${index}`];
      const item = JSON.parse(raw) as { c?: unknown; p?: unknown; s?: unknown; q?: unknown };
      if (typeof item.c !== "string" || typeof item.p !== "string" || typeof item.s !== "string") return null;
      const quantity = Number(item.q);
      const collection = getCollection(item.c);
      const photo = getPhoto(item.c, item.p);
      const option = photo && getPrintOptionForPhoto(item.c, photo, item.s);
      if (!collection || !photo || !option || !Number.isInteger(quantity) || quantity < 1 || quantity > commerceConfig.maxQuantity) return null;
      return {
        collectionSlug: item.c,
        photoId: item.p,
        sizeId: item.s,
        quantity,
        photograph: formatPrintName(collection, photo),
        size: option.label,
        unitPrice: formatPrice(option.price),
      };
    } catch {
      return null;
    }
  }).filter((item): item is CheckoutOrderItem => Boolean(item));
}

export function getShippingDetails(session: StripeCheckoutSession) {
  return session.collected_information?.shipping_details ?? session.shipping_details ?? {
    name: session.customer_details?.name,
    address: session.customer_details?.address,
  };
}

export function formatStripeAddress(address?: StripeAddress | null) {
  if (!address) return "Not provided";
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(", ").replace(/, ([^,]+)$/, " $1");
  return [address.line1, address.line2, cityLine, address.country].filter(Boolean).join("\n") || "Not provided";
}

export function formatStripeTotal(session: StripeCheckoutSession) {
  if (typeof session.amount_total !== "number") return "See Stripe";
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: (session.currency ?? commerceConfig.stripeCurrency).toUpperCase(),
  }).format(session.amount_total / 100);
}

export function getStripeDashboardOrderUrl(session: StripeCheckoutSession) {
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const modePath = session.livemode ? "" : "test/";
  return paymentIntent
    ? `https://dashboard.stripe.com/${modePath}payments/${encodeURIComponent(paymentIntent)}`
    : `https://dashboard.stripe.com/${modePath}payments`;
}

export async function retrieveCheckoutSession(sessionId: string, secret = process.env.STRIPE_SECRET_KEY) {
  if (!secret || !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  const response = await fetch(`${commerceConfig.stripeApiBaseUrl}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return await response.json() as StripeCheckoutSession;
}

export async function isVerifiedPaidCheckout(sessionId: string) {
  const session = await retrieveCheckoutSession(sessionId);
  return Boolean(
    session?.payment_status === "paid" &&
    session.metadata?.[commerceConfig.checkoutSiteMetadataKey] === siteConfig.brandName,
  );
}

export async function markFulfillmentEmailSent(sessionId: string, secret: string) {
  const form = new URLSearchParams({
    [`metadata[${commerceConfig.fulfillmentMetadataKey}]`]: "true",
  });
  const response = await fetch(`${commerceConfig.stripeApiBaseUrl}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  return response.ok;
}
