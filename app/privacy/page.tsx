import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <main><div className="page-shell"><SiteHeader /><article className="legal-copy"><p className="eyebrow">Privacy</p><h1>Privacy, in plain language.</h1><p>kurtis.photo collects the information you submit through the portrait inquiry form—your name, email address, and project details—only to respond to your request. It is not sold or used for marketing lists.</p><p>Checkout information is collected and processed by Stripe. This site uses privacy-focused Cloudflare Web Analytics to understand aggregate page and photo views; it does not build visitor profiles.</p><p>Questions about privacy can be sent to ks@kurtis.photo.</p></article><SiteFooter /></div></main>;
}
