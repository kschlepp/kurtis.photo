/* eslint-disable @next/next/no-img-element */
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";

export const metadata = { title: siteCopy.about.metadataTitle };

export default function AboutPage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="about-copy"><div className="about-heading"><p className="eyebrow">{siteCopy.about.eyebrow}</p><h1>{siteCopy.about.title}</h1></div><div className="about-story">{siteCopy.about.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    <figure className="about-photo">
      <img
        {...siteConfig.aboutPhoto}
        alt={siteCopy.about.photoAlt}
      />
      <figcaption>{siteCopy.about.photoCaption}</figcaption>
    </figure>
    <section className="about-contact"><p className="eyebrow">{siteCopy.about.contactEyebrow}</p><a href={siteConfig.emailHref}>{siteConfig.email}</a><p>{siteCopy.about.instagramLabel} <span>{siteConfig.instagram}</span> <small>{siteCopy.about.instagramStatus}</small></p></section>
    <SiteFooter />
  </div></main>;
}
