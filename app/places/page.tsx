/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { collections, getCover } from "@/lib/catalog";

export const metadata = { title: "Places" };

export default function PlacesPage() {
  return (
    <main><div className="page-shell">
      <SiteHeader />
      <section className="page-intro places-intro">
        <p className="eyebrow">The archive</p>
        <h1>Places</h1>
        <p>Locations, light, and the small details that keep a trip from feeling far away.</p>
        <Link className="button button-outline" href="/">Explore the globe</Link>
      </section>
      <section className="index-section" aria-labelledby="index-title">
        <div className="index-header"><p className="eyebrow">Alphabetical archive</p><h2 id="index-title">All places</h2><span>{String(collections.length).padStart(2, "0")} currently published</span></div>
        <div className="place-archive-grid">
          {collections.map((collection) => {
            const cover = getCover(collection);
            const ratio = cover.width / cover.height;
            const layout = ratio > 2 ? "is-panoramic" : ratio > 1.15 ? "is-landscape" : "is-portrait";
            return <Link href={`/places/${collection.slug}`} className={`place-archive-card ${layout}`} key={collection.slug}>
              <div className="place-archive-image"><img src={cover.variants["768"]} alt={`Cover photograph from ${collection.title}`} /></div>
              <div className="place-archive-copy"><h3>{collection.title}</h3><div><span>{collection.location}</span><em>{String(collection.images.length).padStart(2, "0")} photographs</em></div></div>
            </Link>;
          })}
        </div>
      </section>
      <SiteFooter />
    </div></main>
  );
}
