import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return <main><div className="page-shell"><SiteHeader /><article className="legal-copy"><p className="eyebrow">Terms</p><h1>A few ground rules.</h1><p>All photographs on kurtis.photo are copyrighted by Kurtis Schlepp. Website images are provided for viewing and sharing through their original links, not for downloading, reproduction, or commercial use without permission.</p><p>Print orders are made to order. Pricing, availability, and compatible print sizes may change as the archive grows. Shipping is currently limited to the United States.</p><p>Portrait pricing and project details are confirmed individually before work begins.</p></article><SiteFooter /></div></main>;
}
