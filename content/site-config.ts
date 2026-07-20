export const routes = {
  home: "/",
  places: "/places",
  portraits: "/portraits",
  prints: "/prints",
  printInfo: "/print-info",
  about: "/about",
  inquire: "/inquire",
  privacy: "/privacy",
  terms: "/terms",
  inquireApi: "/api/inquire",
  checkoutApi: "/api/checkout",
  place: (slug: string) => `/places/${slug}`,
  photo: (collectionSlug: string, photoId: string) => `/places/${collectionSlug}/${photoId}`,
  portrait: (slug: string) => `/portraits/${slug}`,
  portraitPhoto: (collectionSlug: string, photoId: string) => `/portraits/${collectionSlug}/${photoId}`,
} as const;

export const siteConfig = {
  locale: "en-US",
  language: "en",
  brandName: "kurtis.photo",
  ownerName: "Kurtis Schlepp",
  location: "San Diego",
  email: "ks@kurtis.photo",
  instagram: "@kurtis.photo.sd",
  canonicalOrigin: "https://kurtis.photo",
  emailHref: "mailto:ks@kurtis.photo",
  socialImage: {
    url: "/og.png",
    width: 1200,
    height: 630,
  },
  icons: [
    { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    { url: "/favicon.ico", sizes: "any" },
  ],
  aboutPhoto: {
    src: "/media/about/about-kurtis-and-wife-09afc6095bda-1600.jpg",
    srcSet: "/media/about/about-kurtis-and-wife-09afc6095bda-768.jpg 512w, /media/about/about-kurtis-and-wife-09afc6095bda-1600.jpg 1066w, /media/about/about-kurtis-and-wife-09afc6095bda-2400.jpg 1600w",
    sizes: "(max-width: 780px) calc(100vw - 32px), min(760px, 70vw)",
    width: 1600,
    height: 2400,
  },
  imageVariants: {
    thumbnail: "768",
    display: "1600",
    full: "2400",
  },
  countPadLength: 2,
  analytics: {
    scriptUrl: "https://static.cloudflareinsights.com/beacon.min.js",
  },
} as const;

export const navigation = [
  { href: routes.home, label: "Places" },
  { href: routes.portraits, label: "Portraits" },
  { href: routes.prints, label: "Prints" },
  { href: routes.about, label: "About" },
] as const;

export const commerceConfig = {
  storageKey: "kurtis-photo-cart",
  maxQuantity: 10,
  aspectRatioTolerance: 0.07,
  displayCurrency: "USD",
  stripeCurrency: "usd",
  stripeApiUrl: "https://api.stripe.com/v1/checkout/sessions",
  stripeTaxCode: "txcd_99999999",
  allowedShippingCountry: "US",
  orderQueryKey: "order",
  receivedOrderValue: "received",
  shipping: {
    flat: { amount: 700, label: "Flat print shipping" },
    tube: { amount: 1500, label: "Tube shipping" },
  },
  printOptions: [
    { id: "4x6", label: "4 × 6 in", ratio: 1.5, price: 1000, shippingClass: "flat" },
    { id: "5x7", label: "5 × 7 in", ratio: 1.4, price: 1200, shippingClass: "flat" },
    { id: "8x10", label: "8 × 10 in", ratio: 1.25, price: 2000, shippingClass: "flat" },
    { id: "8x12", label: "8 × 12 in", ratio: 1.5, price: 2200, shippingClass: "flat" },
    { id: "11x14", label: "11 × 14 in", ratio: 1.273, price: 3200, shippingClass: "flat" },
    { id: "12x18", label: "12 × 18 in", ratio: 1.5, price: 4800, shippingClass: "tube" },
    { id: "16x20", label: "16 × 20 in", ratio: 1.25, price: 7000, shippingClass: "tube" },
    { id: "16x24", label: "16 × 24 in", ratio: 1.5, price: 8000, shippingClass: "tube" },
    { id: "20x30", label: "20 × 30 in", ratio: 1.5, price: 12000, shippingClass: "tube" },
  ],
} as const;

export const inquiryConfig = {
  fields: ["name", "email", "shootType", "date", "location", "budget", "message"],
  requiredFields: ["name", "email", "shootType", "message"],
  shootTypes: [
    "Individual portrait",
    "Couples session",
    "Family session",
    "Engagement or proposal",
    "Headshots",
    "Something else",
  ],
  resendApiUrl: "https://api.resend.com/emails",
  defaultSender: "kurtis.photo <hello@updates.kurtis.photo>",
} as const;
