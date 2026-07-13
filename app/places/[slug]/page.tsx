import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCollection } from "@/lib/catalog";

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
