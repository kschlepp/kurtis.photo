/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPortraitCover, portraitCollections } from "@/lib/portraits";

export const metadata = { title: "Portraits" };

export default function PortraitsPage() {
  const leadCollection = portraitCollections[0];
  const leadCover = getPortraitCover(leadCollection);

  return <main><div className="page-shell"><SiteHeader />
    <section className="portrait-hero">
      <Link className="portrait-hero-image" href={`/portraits/${leadCollection.slug}`} aria-label={`View ${leadCollection.title} portrait session`}>
        <img src={leadCover.variants["1600"]} alt={`Portrait from ${leadCollection.title}`} />
        <span>{leadCollection.title} <b>↗</b></span>
      </Link>
      <div className="portrait-hero-copy"><p className="eyebrow">Portraits by Kurtis</p><h1>People, as they are.</h1><p>I like a mix: a little direction when it helps, space to be yourselves when it matters more. Individuals, couples, families, engagements, proposals, and headshots.</p><Link className="button button-ink" href="/inquire">Let’s take some photos</Link></div>
    </section>
    <section className="portrait-archive" aria-labelledby="portrait-archive-title"><div className="section-heading"><div><p className="eyebrow">Recent sessions</p><h2 id="portrait-archive-title">A few people I’ve had the pleasure to photograph.</h2></div><p>Each session is edited with its own pace, light, and place in mind.</p></div><div className="portrait-session-grid">{portraitCollections.map((collection) => { const cover = getPortraitCover(collection); return <Link className="portrait-session-card" href={`/portraits/${collection.slug}`} key={collection.slug}><div className="portrait-session-image"><img src={cover.variants["768"]} alt={`Cover photograph from ${collection.title}`} /></div><div><h3>{collection.title}</h3><span>{String(collection.images.length).padStart(2, "0")} photographs</span></div></Link>; })}</div></section>
    <section className="portrait-details"><div><p className="eyebrow">How it works</p><h2>Start with a note.</h2><p>Tell me what you’re picturing, where it might happen, and the pace you want. Every session is quoted individually.</p><Link className="inline-link" href="/inquire">Tell me what you have in mind <span>↗</span></Link></div><div><p className="eyebrow">Based in San Diego</p><h2>Available across the county.</h2><p>Have something farther away in mind? I’m happy to travel; additional travel costs may apply.</p></div></section>
    <SiteFooter />
  </div></main>;
}
