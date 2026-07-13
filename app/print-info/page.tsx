import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, printOptions } from "@/lib/catalog";
import Link from "next/link";

export const metadata = { title: "Print info" };

export default async function PrintInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const orderReceived = order === "received";

  return <main><div className="page-shell"><SiteHeader />
    {orderReceived ? (
      <section className="order-confirmation" aria-live="polite">
        <p className="eyebrow">Order received</p>
        <h1>Thanks for bringing a moment home.</h1>
        <p className="lede">Your payment went through, and I’ll get your print ready. It’s made to order and usually ships within 7–14 business days. I’ll follow up by email if anything needs your attention.</p>
        <Link className="button button-ink" href="/places">Keep exploring</Link>
      </section>
    ) : (
      <section className="page-intro"><p className="eyebrow">Prints</p><h1>Made to spend time with.</h1><p>Every available photograph is offered as an unsigned open-edition, unframed lustre print. Kurtis signs the back by hand with the photograph’s title or location and year.</p></section>
    )}
    <section className="print-information"><div><p className="eyebrow">Sizes & pricing</p><h2>Chosen to respect the photograph.</h2><p>Each image only offers sizes that preserve its original composition. Panoramas may include a white border so nothing is cropped.</p><ul className="price-list">{printOptions.map((option) => <li key={option.id}><span>{option.label}</span><strong>{formatPrice(option.price)}</strong></li>)}</ul></div><div><p className="eyebrow">Fulfillment</p><h2>A few practical details.</h2><ul className="detail-list"><li>U.S. shipping only, calculated at checkout.</li><li>Made to order; please allow 7–14 business days before shipment.</li><li>Replacements for damaged or incorrect orders. Made-to-order prints are otherwise final sale.</li><li>Questions before ordering? Email ks@kurtis.photo.</li></ul></div></section>
    <SiteFooter />
  </div></main>;
}
