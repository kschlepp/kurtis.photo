import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="about-copy"><div className="about-heading"><p className="eyebrow">About Kurtis</p><h1>Trying to hold on to how a moment felt.</h1></div><div className="about-story"><p>My wife’s photography made me want to try making some photographs of my own. Since then, the camera has become a way of carrying a trip home with me.</p><p>When I go back through a set of photos, I want to feel pulled right back into the air, the light, and the slightly strange feeling of being somewhere new. That’s what I’m looking for when I make them.</p><p>I’m Kurtis Schlepp, a photographer and software engineer based in San Diego. This is a growing collection of the places and people I’ve been lucky enough to spend time with.</p></div></section>
    <section className="about-contact"><p className="eyebrow">Say hello</p><a href="mailto:ks@kurtis.photo">ks@kurtis.photo</a><p>Instagram: <span>@kurtis.photo.sd</span> <small>coming soon</small></p></section>
    <SiteFooter />
  </div></main>;
}
