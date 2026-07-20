/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PrintConfigurator } from "@/components/cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { commerceConfig, routes, siteConfig } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";
import { formatPhotoName, getAvailablePrints } from "@/lib/catalog";

export const metadata = { title: siteCopy.prints.metadataTitle };

export default async function PrintsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const orderReceived = order === commerceConfig.receivedOrderValue;
  const prints = getAvailablePrints();

  return (
    <main><div className="page-shell">
      <SiteHeader />
      {orderReceived ? (
        <section className="order-confirmation" aria-live="polite">
          <p className="eyebrow">{siteCopy.prints.confirmationEyebrow}</p>
          <h1>{siteCopy.prints.confirmationTitle}</h1>
          <p className="lede">{siteCopy.prints.confirmationBody}</p>
          <Link className="button button-ink" href={routes.places}>{siteCopy.prints.confirmationAction}</Link>
        </section>
      ) : (
        <section className="page-intro print-intro">
          <p className="eyebrow">{siteCopy.prints.eyebrow}</p>
          <h1>{siteCopy.prints.title}</h1>
          <p>{siteCopy.prints.introduction}</p>
        </section>
      )}
      {prints.length === 0 ? (
        <section className="print-empty">
          <p className="eyebrow">{siteCopy.prints.emptyEyebrow}</p>
          <h2>{siteCopy.prints.emptyTitle}</h2>
          <p>{siteCopy.prints.emptyBody}</p>
          <Link className="inline-link" href={routes.places}>{siteCopy.prints.emptyAction} <span>↗</span></Link>
        </section>
      ) : (
        <section className="print-grid" aria-label={siteCopy.prints.availableLabel}>
          {prints.map(({ selection, collection, photo }) => (
            <article className="print-card" key={`${collection.slug}-${photo.id}`}>
              <Link className="print-card-image" href={routes.photo(collection.slug, photo.id)}>
                <img src={photo.variants[siteConfig.imageVariants.display]} alt={photo.alt} />
              </Link>
              <p className="eyebrow">{collection.title}</p>
              <h2>{selection.title ?? formatPhotoName(collection, photo)}</h2>
              {selection.note ? <p className="print-card-note">{selection.note}</p> : null}
              <PrintConfigurator collectionSlug={collection.slug} photo={photo} />
              <Link className="inline-link" href={routes.place(collection.slug)}>{siteCopy.prints.originalCollection} <span>↗</span></Link>
            </article>
          ))}
        </section>
      )}
      <SiteFooter />
    </div></main>
  );
}
