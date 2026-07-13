import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, printOptions } from "@/lib/catalog";

export const metadata = { title: "Print info" };

export default function PrintInfoPage() {
  return <main><div className="page-shell"><SiteHeader />
    <section className="page-intro"><p className="eyebrow">Print details</p><h1>Made to spend time with.</h1><p>Photographs offered through the Prints page are unframed lustre prints. Kurtis signs the back by hand with the photograph’s title or location and year.</p></section>
    <section className="print-information"><div><p className="eyebrow">Sizes & pricing</p><h2>Chosen to respect the photograph.</h2><p>Each print only offers sizes that preserve its original composition. Panoramas may include a white border so nothing is cropped.</p><ul className="price-list">{printOptions.map((option) => <li key={option.id}><span>{option.label}</span><strong>{formatPrice(option.price)}</strong></li>)}</ul></div><div><p className="eyebrow">Fulfillment</p><h2>A few practical details.</h2><ul className="detail-list"><li>U.S. shipping only, calculated at checkout.</li><li>Made to order; please allow 7–14 business days before shipment.</li><li>Replacements for damaged or incorrect orders. Made-to-order prints are otherwise final sale.</li><li>Questions before ordering? Email ks@kurtis.photo.</li></ul></div></section>
    <SiteFooter />
  </div></main>;
}
