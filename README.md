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
