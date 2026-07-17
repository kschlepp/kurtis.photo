import ashleyData from "@/content/generated/portraits/ashley.json";
import familyData from "@/content/generated/portraits/family.json";
import maternityData from "@/content/generated/portraits/maternity.json";
import newbornData from "@/content/generated/portraits/newborn.json";
import type { Collection, Photo } from "@/lib/catalog";

export type PortraitCollection = Pick<Collection, "slug" | "title" | "note" | "featured" | "coverImageId" | "images">;

export const portraitCollections = [
  ashleyData as PortraitCollection,
  familyData as PortraitCollection,
  maternityData as PortraitCollection,
  newbornData as PortraitCollection,
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
