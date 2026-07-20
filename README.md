# kurtis.photo

Personal photography by Kurtis Schlepp: places, portraits, print ordering, and
a small publishing workflow designed around local high-resolution exports.

## Local development

Requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

The private preview runs at `http://localhost:3000`.

## Editing site content and settings

The application keeps editable content and tunable settings out of page and
component implementations:

- `content/site-copy.ts` contains public page, navigation, accessibility, cart,
  and legal copy.
- `content/email-copy.ts` contains inquiry-email and API response copy.
- `content/site-config.ts` contains identity, contact details, routes, image
  variants, navigation, commerce, inquiry, and integration settings.
- `content/globe-config.ts` contains globe camera, zoom, animation, clustering,
  lighting, and MapLibre presentation values.
- `app/theme.css` contains the complete color palette and semantic color tokens.
- `app/globals.css` remains the designated home for layout and responsive style
  rules; it consumes the tokens from `app/theme.css`.

Photo and collection content remains in `content/generated/`, while the curated
print catalog remains in `content/prints.json`.

## Photo workflow

Keep high-resolution JPEG exports in `photo-intake/places/<collection>/`.
That directory is ignored by Git and is never deployed.

```bash
npm run photos:prepare -- yosemite
```

The command:

- reads selected JPEGs in capture-date order;
- writes editable collection data to `content/generated/yosemite.json`;
- creates 768px, 1600px, and 2400px public JPEGs under `public/media/`;
- removes all embedded metadata from those public copies; and
- gives every public derivative a content-hashed URL.

Edit the generated JSON when you want to change a title, image order, print
availability, a rights-review flag, alt text, a collection note, or a featured
status. The original `printSource` remains local-only and points back to the
high-resolution file used for fulfillment.

After the Sites deployment creates an R2 bucket, upload only the prepared
derivatives:

```bash
R2_BUCKET=<bucket-name> npm run photos:upload -- yosemite
```

The media worker reads those images from the `MEDIA` R2 binding in production.
Local development falls back to `public/media/` automatically.

Portrait sessions live in `photo-intake/portraits/<session>/`. Prepare each
session through the portrait workflow, then upload its public media folder:

```bash
npm run portraits:prepare -- <session-slug>
R2_BUCKET=<bucket-name> npm run photos:upload -- portrait-<session-slug>
```

Portrait derivatives have no embedded metadata, opaque public filenames, and
no camera, capture-date, or original-filename data in their manifest. They
default to review-required / not-for-sale.

## Services and secrets

Copy `.env.example` to `.env.local` and add values only when you are ready to
test each service:

- Stripe test key for hosted Checkout
- Resend key for inquiry delivery and confirmation email
- R2 bucket name for image uploads
- Cloudflare Web Analytics token for privacy-friendly page-view reporting

Use Stripe test mode until business setup, sales-tax registration, product tax
settings, and shipping rates are ready for live orders.

## Verification

```bash
npm run build
npm test
npm run lint
```
