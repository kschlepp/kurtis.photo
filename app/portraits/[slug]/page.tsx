import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPortraitCollection, getPortraitCover } from "@/lib/portraits";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getPortraitCollection(slug);
  if (!collection) return {};
  const cover = getPortraitCover(collection);
  return {
    title: collection.title,
    description: collection.note ?? `Portrait photographs by Kurtis Schlepp.`,
    openGraph: { images: [{ url: cover.variants["1600"], alt: cover.alt }] },
    twitter: { card: "summary_large_image", images: [cover.variants["1600"]] },
  };
}

export default async function PortraitCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getPortraitCollection(slug);
  if (!collection) notFound();

  return <main><div className="page-shell"><SiteHeader />
    <section className="collection-intro portrait-collection-intro"><div><p className="eyebrow">Portrait session</p><h1>{collection.title}</h1></div><p>{collection.note ?? "A portrait session by Kurtis Schlepp."}</p></section>
    <PhotoGallery collection={collection} basePath="/portraits" showMetadata={false} />
    <SiteFooter />
  </div></main>;
}
