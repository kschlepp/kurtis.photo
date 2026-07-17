/* eslint-disable @next/next/no-img-element */
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="about-copy"><div className="about-heading"><p className="eyebrow">About Kurtis</p><h1>Trying to hold on to how a moment felt.</h1></div><div className="about-story"><p>My wife’s photography made me want to try making some photographs of my own. Since then, the camera has become a way of carrying a trip home with me.</p><p>When I go back through a set of photos, I want to feel pulled right back into the air, the light, and the slightly strange feeling of being somewhere new. That’s what I’m looking for when I make them.</p><p>I’m Kurtis Schlepp, a photographer and software engineer based in San Diego. This is a growing collection of the places and people I’ve been lucky enough to spend time with.</p></div></section>
    <figure className="about-photo">
      <img
        src="/media/about/about-kurtis-and-wife-09afc6095bda-1600.jpg"
        srcSet="/media/about/about-kurtis-and-wife-09afc6095bda-768.jpg 512w, /media/about/about-kurtis-and-wife-09afc6095bda-1600.jpg 1066w, /media/about/about-kurtis-and-wife-09afc6095bda-2400.jpg 1600w"
        sizes="(max-width: 780px) calc(100vw - 32px), min(760px, 70vw)"
        width="1600"
        height="2400"
        alt="Kurtis and his wife smiling together"
      />
      <figcaption>Kurtis and his wife, whose photography started all of this.</figcaption>
    </figure>
    <section className="about-contact"><p className="eyebrow">Say hello</p><a href="mailto:ks@kurtis.photo">ks@kurtis.photo</a><p>Instagram: <span>@kurtis.photo.sd</span> <small>coming soon</small></p></section>
    <SiteFooter />
  </div></main>;
}
