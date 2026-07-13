import { formatPrintName, getCollection, getPhoto, getPrintOptionForPhoto } from "@/lib/catalog";

type RequestedLine = { collectionSlug?: unknown; photoId?: unknown; sizeId?: unknown; quantity?: unknown };

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: "Checkout is not configured yet. Add the Stripe test key when you are ready to test purchases." }, { status: 503 });
  }

  const payload = await request.json() as { lines?: RequestedLine[] };
  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return Response.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const form = new URLSearchParams({
    mode: "payment",
    "automatic_tax[enabled]": "true",
    "allow_promotion_codes": "true",
    "shipping_address_collection[allowed_countries][0]": "US",
    success_url: `${new URL(request.url).origin}/prints?order=received`,
    cancel_url: `${new URL(request.url).origin}/places`,
  });

  let largestShippingClass: "flat" | "tube" = "flat";
  for (const [index, requested] of payload.lines.entries()) {
    if (typeof requested.collectionSlug !== "string" || typeof requested.photoId !== "string" || typeof requested.sizeId !== "string") {
      return Response.json({ error: "One cart item is invalid." }, { status: 400 });
    }
    const quantity = Number(requested.quantity);
    const collection = getCollection(requested.collectionSlug);
    const photo = getPhoto(requested.collectionSlug, requested.photoId);
    const option = photo && getPrintOptionForPhoto(requested.collectionSlug, photo, requested.sizeId);
    if (!collection || !photo || !option || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return Response.json({ error: "One cart item is no longer available." }, { status: 400 });
    }
    if (option.shippingClass === "tube") largestShippingClass = "tube";
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(option.price));
    form.set(`line_items[${index}][price_data][product_data][name]`, `${collection.title} — ${formatPrintName(collection, photo)}`);
    form.set(`line_items[${index}][price_data][product_data][tax_code]`, "txcd_99999999");
    form.set(`line_items[${index}][quantity]`, String(quantity));
  }

  const shippingAmount = largestShippingClass === "tube" ? 1500 : 700;
  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][display_name]", largestShippingClass === "tube" ? "Tube shipping" : "Flat print shipping");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shippingAmount));
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const result = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !result.url) {
    return Response.json({ error: result.error?.message ?? "Stripe could not create a checkout session." }, { status: 502 });
  }
  return Response.json({ url: result.url });
}
