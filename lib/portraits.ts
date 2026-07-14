import ashleyData from "@/content/generated/portraits/ashley.json";
import maternityData from "@/content/generated/portraits/maternity.json";
import type { Collection, Photo } from "@/lib/catalog";

export type PortraitCollection = Pick<Collection, "slug" | "title" | "note" | "featured" | "coverImageId" | "images">;

export const portraitCollections = [
  ashleyData as PortraitCollection,
  maternityData as PortraitCollection,
].sort((left, right) => left.title.localeCompare(right.title));

export function getPortraitCollection(slug: string) {
  return portraitCollections.find((collection) => collection.slug === slug);
}

export function getPortraitPhoto(collectionSlug: string, photoId: string): Photo | undefined {
  return getPortraitCollection(collectionSlug)?.images.find((photo) => photo.id === photoId);
}

export function getPortraitCover(collection: PortraitCollection) {
  return collection.images.find((photo) => photo.id === collection.coverImageId) ?? collection.images[0];
}
