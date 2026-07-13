import { InquiryForm } from "@/components/inquiry-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Let’s take some photos" };

export default function InquirePage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="inquiry-intro"><p className="eyebrow">Portrait inquiry</p><h1>Let’s take some photos.</h1><p>Start wherever you are. A loose idea is plenty.</p><a href="mailto:ks@kurtis.photo">Or email me directly at ks@kurtis.photo</a></section>
    <InquiryForm />
    <SiteFooter />
  </div></main>;
}
