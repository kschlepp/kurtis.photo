import { checkoutApiCopy } from "@/content/email-copy";
import { commerceConfig, routes, siteConfig } from "@/content/site-config";
import { formatPrintName, getCollection, getPhoto, getPrintOptionForPhoto } from "@/lib/catalog";
import { serializeCheckoutItem } from "@/lib/stripe";

type RequestedLine = { collectionSlug?: unknown; photoId?: unknown; sizeId?: unknown; quantity?: unknown };

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: checkoutApiCopy.notConfigured }, { status: 503 });
  }

  const payload = await request.json() as { lines?: RequestedLine[] };
  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return Response.json({ error: checkoutApiCopy.emptyCart }, { status: 400 });
  }
  if (payload.lines.length > commerceConfig.maxDistinctItems) {
    return Response.json({ error: checkoutApiCopy.tooManyItems }, { status: 400 });
  }

  const form = new URLSearchParams({
    mode: "payment",
    "automatic_tax[enabled]": "true",
    "allow_promotion_codes": "true",
    "shipping_address_collection[allowed_countries][0]": commerceConfig.allowedShippingCountry,
    success_url: `${new URL(request.url).origin}${routes.prints}?${commerceConfig.checkoutSessionQueryKey}={CHECKOUT_SESSION_ID}`,
    cancel_url: `${new URL(request.url).origin}${routes.prints}`,
    [`metadata[${commerceConfig.checkoutSiteMetadataKey}]`]: siteConfig.brandName,
    [`metadata[${commerceConfig.checkoutItemCountMetadataKey}]`]: String(payload.lines.length),
  });

  let largestShippingClass: "flat" | "tube" = "flat";
  for (const [index, requested] of payload.lines.entries()) {
    if (typeof requested.collectionSlug !== "string" || typeof requested.photoId !== "string" || typeof requested.sizeId !== "string") {
      return Response.json({ error: checkoutApiCopy.invalidItem }, { status: 400 });
    }
    const quantity = Number(requested.quantity);
    const collection = getCollection(requested.collectionSlug);
    const photo = getPhoto(requested.collectionSlug, requested.photoId);
    const option = photo && getPrintOptionForPhoto(requested.collectionSlug, photo, requested.sizeId);
    if (!collection || !photo || !option || !Number.isInteger(quantity) || quantity < 1 || quantity > commerceConfig.maxQuantity) {
      return Response.json({ error: checkoutApiCopy.unavailableItem }, { status: 400 });
    }
    if (option.shippingClass === "tube") largestShippingClass = "tube";
    form.set(`line_items[${index}][price_data][currency]`, commerceConfig.stripeCurrency);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(option.price));
    form.set(`line_items[${index}][price_data][product_data][name]`, `${formatPrintName(collection, photo)} — ${option.label}`);
    form.set(`line_items[${index}][price_data][product_data][tax_code]`, commerceConfig.stripeTaxCode);
    form.set(`line_items[${index}][quantity]`, String(quantity));
    form.set(
      `metadata[${commerceConfig.checkoutItemMetadataPrefix}${index}]`,
      serializeCheckoutItem({ collectionSlug: collection.slug, photoId: photo.id, sizeId: option.id, quantity }),
    );
  }

  const shipping = commerceConfig.shipping[largestShippingClass];
  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][display_name]", shipping.label);
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shipping.amount));
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", commerceConfig.stripeCurrency);

  const stripeResponse = await fetch(`${commerceConfig.stripeApiBaseUrl}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const result = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !result.url) {
    return Response.json({ error: result.error?.message ?? checkoutApiCopy.stripeError }, { status: 502 });
  }
  return Response.json({ url: result.url });
}
