/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routes, siteConfig } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";
import { getPortraitCover, portraitCollections } from "@/lib/portraits";

export const metadata = { title: siteCopy.portraits.metadataTitle };

export default function PortraitsPage() {
  const leadCollection = portraitCollections[0];
  const leadCover = getPortraitCover(leadCollection);

  return <main><div className="page-shell"><SiteHeader />
    <section className="portrait-hero">
      <Link className="portrait-hero-image" href={routes.portrait(leadCollection.slug)} aria-label={siteCopy.portraits.viewSession(leadCollection.title)}>
        <img src={leadCover.variants[siteConfig.imageVariants.display]} alt={siteCopy.portraits.portraitAlt(leadCollection.title)} />
        <span>{leadCollection.title} <b>↗</b></span>
      </Link>
      <div className="portrait-hero-copy"><p className="eyebrow">{siteCopy.portraits.heroEyebrow}</p><h1>{siteCopy.portraits.heroTitle}</h1><p>{siteCopy.portraits.heroBody}</p><Link className="button button-ink" href={routes.inquire}>{siteCopy.portraits.heroAction}</Link></div>
    </section>
    <section className="portrait-archive" aria-labelledby="portrait-archive-title"><div className="section-heading"><div><p className="eyebrow">{siteCopy.portraits.recentEyebrow}</p><h2 id="portrait-archive-title">{siteCopy.portraits.archiveTitle}</h2></div><p>{siteCopy.portraits.archiveBody}</p></div><div className="portrait-session-grid">{portraitCollections.map((collection) => { const cover = getPortraitCover(collection); return <Link className="portrait-session-card" href={routes.portrait(collection.slug)} key={collection.slug}><div className="portrait-session-image"><img src={cover.variants[siteConfig.imageVariants.thumbnail]} alt={siteCopy.common.coverAlt(collection.title)} /></div><div><h3>{collection.title}</h3><span>{siteCopy.common.photographs(collection.images.length)}</span></div></Link>; })}</div></section>
    <section className="portrait-details"><div><p className="eyebrow">{siteCopy.portraits.processEyebrow}</p><h2>{siteCopy.portraits.processTitle}</h2><p>{siteCopy.portraits.processBody}</p><Link className="inline-link" href={routes.inquire}>{siteCopy.portraits.processAction} <span>↗</span></Link></div><div><p className="eyebrow">{siteCopy.portraits.locationEyebrow}</p><h2>{siteCopy.portraits.locationTitle}</h2><p>{siteCopy.portraits.locationBody}</p></div></section>
    <SiteFooter />
  </div></main>;
}
