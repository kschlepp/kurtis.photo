import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Portraits" };

export default function PortraitsPage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="page-intro portrait-intro"><p className="eyebrow">Portraits by Kurtis</p><h1>People, as they are.</h1><p>I like a mix: a little direction when it helps, space to be yourselves when it matters more. Individual portraits, couples, families, engagements, proposals, and headshots.</p><Link className="button button-ink" href="/inquire">Let’s take some photos</Link></section>
    <section className="portrait-details"><div><p className="eyebrow">How it works</p><h2>Start with a note.</h2><p>Tell me what you’re picturing, where it might happen, and the pace you want. Every session is quoted individually.</p></div><div><p className="eyebrow">Based in San Diego</p><h2>Available across the county.</h2><p>Have something farther away in mind? I’m happy to travel; additional travel costs may apply.</p></div></section>
    <section className="quiet-panel"><p>Recent portrait sessions are being selected for this archive. In the meantime, the best way to see whether we’d be a good fit is to get in touch.</p><Link className="inline-link" href="/inquire">Tell me what you have in mind <span>↗</span></Link></section>
    <SiteFooter />
  </div></main>;
}
