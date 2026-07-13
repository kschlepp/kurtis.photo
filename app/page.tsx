/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PlacesMap } from "@/components/places-map";
import { collections, getCover } from "@/lib/catalog";

export default function Home() {
  const yosemite = collections[0];
  const cover = getCover(yosemite);
  return (
    <main>
      <div className="page-shell home-shell">
        <SiteHeader />
        <section className="home-hero">
          <div className="hero-copy">
            <p className="eyebrow">Kurtis Schlepp · San Diego, California</p>
            <h1>Photos that take me back.</h1>
            <p className="lede">Travel, streets, landscapes, and people—collected in the moments that made them feel like something.</p>
            <div className="button-row">
              <Link className="button button-ink" href="/places">Explore places</Link>
              <Link className="button button-outline" href="/inquire">Let’s take some photos</Link>
            </div>
          </div>
          <Link className="hero-image" href={`/places/${yosemite.slug}`}>
            <img src={cover.variants["2400"]} alt={cover.alt} />
            <span className="image-caption"><em>{yosemite.title}</em><small>{yosemite.location}</small></span>
          </Link>
        </section>
        <section className="featured-section" aria-labelledby="featured-title">
          <div className="section-heading">
            <p className="eyebrow">Featured place</p>
            <h2 id="featured-title">Yosemite, in late fall.</h2>
            <p>Golden trees, cold granite, and a few days that stayed with me.</p>
          </div>
          <div className="feature-grid">
            {yosemite.images.slice(0, 3).map((photo) => (
              <Link key={photo.id} className="feature-image" href={`/places/${yosemite.slug}/${photo.id}`}>
                <img src={photo.variants["1600"]} alt={photo.alt} loading="lazy" />
              </Link>
            ))}
          </div>
          <Link className="inline-link" href={`/places/${yosemite.slug}`}>See the full collection <span>↗</span></Link>
        </section>
        <section className="places-teaser">
          <div>
            <p className="eyebrow">Places, near and far</p>
            <h2>An archive built one trip at a time.</h2>
            <p>There’s one place here now. The rest will appear as the archive grows, always with an alphabetical index and a map view to wander through.</p>
            <Link className="inline-link" href="/places">Browse places <span>↗</span></Link>
          </div>
          <PlacesMap compact />
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
