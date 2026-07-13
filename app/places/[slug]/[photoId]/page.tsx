/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintConfigurator } from "@/components/cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { displayDate, formatPhotoName, getCollection, getPhoto } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; photoId: string }> }): Promise<Metadata> {
  const { slug, photoId } = await params;
  const collection = getCollection(slug);
  const photo = getPhoto(slug, photoId);
  if (!collection || !photo) return {};
  const title = formatPhotoName(collection, photo);
  return {
    title,
    description: `${collection.location} — a photograph by Kurtis Schlepp.`,
    openGraph: { images: [{ url: photo.variants["1600"], alt: photo.alt }] },
    twitter: { card: "summary_large_image", images: [photo.variants["1600"]] },
  };
}

export default async function PhotoPage({ params }: { params: Promise<{ slug: string; photoId: string }> }) {
  const { slug, photoId } = await params;
  const collection = getCollection(slug);
  const photo = getPhoto(slug, photoId);
  if (!collection || !photo) notFound();
  const index = collection.images.findIndex((item) => item.id === photo.id);
  const previous = collection.images[(index - 1 + collection.images.length) % collection.images.length];
  const next = collection.images[(index + 1) % collection.images.length];
  return <main><div className="page-shell">
    <SiteHeader />
    <article className="photo-page">
      <img className="photo-page-image" src={photo.variants["2400"]} alt={photo.alt} />
      <div className="photo-page-details"><div><p className="eyebrow">{collection.location}</p><h1>{formatPhotoName(collection, photo)}</h1><p className="metadata-line">{[photo.metadata.cameraMake, photo.metadata.cameraBody].filter(Boolean).join(" ")}{displayDate(photo.metadata.captureDate) ? ` · ${displayDate(photo.metadata.captureDate)}` : ""}</p></div><PrintConfigurator collectionSlug={collection.slug} photo={photo} /></div>
      <nav className="photo-pagination" aria-label="Photo navigation"><Link href={`/places/${collection.slug}/${previous.id}`}>← Previous</Link><Link href={`/places/${collection.slug}`}>All photographs</Link><Link href={`/places/${collection.slug}/${next.id}`}>Next →</Link></nav>
    </article>
    <SiteFooter />
  </div></main>;
}
