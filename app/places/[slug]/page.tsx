import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCollection, getCover } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};
  const cover = getCover(collection);
  return {
    title: collection.title,
    description: collection.note ?? `Photographs made in ${collection.location} by Kurtis Schlepp.`,
    openGraph: { images: [{ url: cover.variants["1600"], alt: cover.alt }] },
    twitter: { card: "summary_large_image", images: [cover.variants["1600"]] },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  return (
    <main><div className="page-shell">
      <SiteHeader />
      <section className="collection-intro">
        <div><p className="eyebrow">{collection.location}</p><h1>{collection.title}</h1></div>
        <p>{collection.note ?? `A collection of photographs made in ${collection.location}.`}</p>
      </section>
      <PhotoGallery collection={collection} />
      <SiteFooter />
    </div></main>
  );
}
