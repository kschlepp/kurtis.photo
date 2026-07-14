/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPhotoName } from "@/lib/catalog";
import { getPortraitCollection, getPortraitPhoto } from "@/lib/portraits";

export default async function PortraitPhotoPage({ params }: { params: Promise<{ slug: string; photoId: string }> }) {
  const { slug, photoId } = await params;
  const collection = getPortraitCollection(slug);
  const photo = getPortraitPhoto(slug, photoId);
  if (!collection || !photo) notFound();

  const index = collection.images.findIndex((image) => image.id === photo.id);
  const previous = collection.images[(index - 1 + collection.images.length) % collection.images.length];
  const next = collection.images[(index + 1) % collection.images.length];

  return <main><div className="page-shell"><SiteHeader />
    <section className="photo-page portrait-photo-page"><Link className="inline-link" href={`/portraits/${collection.slug}`}>← Back to {collection.title}</Link><img className="photo-page-image" src={photo.variants["2400"]} alt={photo.alt} /><div className="photo-page-details"><div><p className="eyebrow">Portrait session</p><h1>{formatPhotoName(collection, photo)}</h1></div></div><nav className="photo-pagination" aria-label="Photo navigation"><Link href={`/portraits/${collection.slug}/${previous.id}`}>← Previous</Link><Link href={`/portraits/${collection.slug}`}>All photographs</Link><Link href={`/portraits/${collection.slug}/${next.id}`}>Next →</Link></nav></section>
    <SiteFooter />
  </div></main>;
}
