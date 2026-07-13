/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PrintConfigurator } from "@/components/cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPhotoName, getAvailablePrints } from "@/lib/catalog";

export const metadata = { title: "Prints" };

export default async function PrintsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const orderReceived = order === "received";
  const prints = getAvailablePrints();

  return (
    <main><div className="page-shell">
      <SiteHeader />
      {orderReceived ? (
        <section className="order-confirmation" aria-live="polite">
          <p className="eyebrow">Order received</p>
          <h1>Thanks for bringing a moment home.</h1>
          <p className="lede">Your payment went through, and I’ll get your print ready. It’s made to order and usually ships within 7–14 business days. I’ll follow up by email if anything needs your attention.</p>
          <Link className="button button-ink" href="/places">Keep exploring</Link>
        </section>
      ) : (
        <section className="page-intro print-intro">
          <p className="eyebrow">Prints</p>
          <h1>A few photographs for the wall.</h1>
          <p>Available occasionally, selected from the places and moments that have stayed with me.</p>
        </section>
      )}
      {prints.length === 0 ? (
        <section className="print-empty">
          <p className="eyebrow">For now</p>
          <h2>Nothing is for sale right now.</h2>
          <p>I’m keeping this collection small on purpose. A few photographs will appear here when the moment feels right.</p>
          <Link className="inline-link" href="/places">Explore the archive <span>↗</span></Link>
        </section>
      ) : (
        <section className="print-grid" aria-label="Available prints">
          {prints.map(({ selection, collection, photo }) => (
            <article className="print-card" key={`${collection.slug}-${photo.id}`}>
              <Link className="print-card-image" href={`/places/${collection.slug}/${photo.id}`}>
                <img src={photo.variants["1600"]} alt={photo.alt} />
              </Link>
              <p className="eyebrow">{collection.title}</p>
              <h2>{selection.title ?? formatPhotoName(collection, photo)}</h2>
              {selection.note ? <p className="print-card-note">{selection.note}</p> : null}
              <PrintConfigurator collectionSlug={collection.slug} photo={photo} />
              <Link className="inline-link" href={`/places/${collection.slug}`}>View original collection <span>↗</span></Link>
            </article>
          ))}
        </section>
      )}
      <SiteFooter />
    </div></main>
  );
}
