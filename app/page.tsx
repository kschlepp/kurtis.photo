/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlacesMap } from "@/components/places-map";
import { collections, getCover } from "@/lib/catalog";

export default function Home() {
  const featuredCollection = collections.find((collection) => collection.featured) ?? collections[0];
  const cover = getCover(featuredCollection);
  return (
    <main>
      <div className="page-shell home-shell">
        <SiteHeader />
        <section className="home-hero">
          <div className="hero-image">
            <img src={cover.variants["2400"]} alt={cover.alt} />
            <div className="hero-scrim" />
            <div className="hero-copy">
              <p className="eyebrow">Kurtis Schlepp · San Diego, California</p>
              <h1>Photos that take me back.</h1>
              <p className="lede">Travel, streets, landscapes, and people—collected in the moments that made them feel like something.</p>
              <div className="button-row">
                <Link className="button button-light" href="/places">Explore places</Link>
                <Link className="button button-on-image" href="/inquire">Let’s take some photos</Link>
              </div>
            </div>
            <Link className="image-caption" href={`/places/${featuredCollection.slug}`}>
              <em>{featuredCollection.title}</em><small>{featuredCollection.location}</small><b>↗</b>
            </Link>
          </div>
        </section>
        <section className="featured-section" aria-labelledby="featured-title">
          <div className="section-heading">
            <p className="eyebrow">From the archive</p>
            <h2 id="featured-title">A few from {featuredCollection.title}.</h2>
            <p>A small sequence from a place that has stayed with me.</p>
          </div>
          <div className="feature-grid">
            {featuredCollection.images.slice(0, 3).map((photo) => (
              <Link key={photo.id} className="feature-image" href={`/places/${featuredCollection.slug}/${photo.id}`}>
                <img src={photo.variants["1600"]} alt={photo.alt} loading="lazy" />
              </Link>
            ))}
          </div>
          <Link className="inline-link" href={`/places/${featuredCollection.slug}`}>See the full collection <span>↗</span></Link>
        </section>
        <section className="places-teaser">
          <div className="places-teaser-copy">
            <p className="eyebrow">Places, near and far</p>
            <h2>Find a place, then wander.</h2>
            <p>A growing collection of places, with an alphabetical index and an interactive map to explore.</p>
            <Link className="inline-link" href="/places">Browse places <span>↗</span></Link>
          </div>
          <PlacesMap />
        </section>
        <section className="portrait-cta">
          <p className="eyebrow">Portraits</p>
          <h2>Let’s make some photos together.</h2>
          <p>Natural, directed, or a little of both. Based in San Diego and available throughout the county.</p>
          <Link className="button button-ink" href="/inquire">Let’s take some photos</Link>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
