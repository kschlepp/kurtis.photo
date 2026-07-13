import yosemiteData from "@/content/generated/yosemite.json";
import printsData from "@/content/prints.json";

export type ImageMetadata = {
  cameraMake: string | null;
  cameraBody: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: string | null;
  captureDate: string | null;
};

export type Photo = {
  id: string;
  title: string | null;
  alt: string;
  sourceFile: string;
  printSource: string;
  order: number;
  sellable: boolean;
  releaseStatus: "not-applicable" | "released" | "review-required";
  width: number;
  height: number;
  variants: Record<string, string>;
  metadata: ImageMetadata;
};

export type Collection = {
  slug: string;
  title: string;
  location: string;
  note: string | null;
  featured: boolean;
  coverImageId: string;
  coordinates: { latitude: number; longitude: number };
  images: Photo[];
};

export type PrintOption = {
  id: string;
  label: string;
  ratio: number;
  price: number;
  shippingClass: "flat" | "tube";
};

export type PrintSelection = {
  collectionSlug: string;
  photoId: string;
  available: boolean;
  title?: string | null;
  note?: string | null;
  sizeIds?: string[];
  priceOverrides?: Record<string, number>;
};

type PrintsData = { items: PrintSelection[] };

export const collections = [yosemiteData as Collection].sort((left, right) =>
  left.title.localeCompare(right.title),
);

export const printOptions: PrintOption[] = [
  { id: "4x6", label: '4 × 6 in', ratio: 1.5, price: 1000, shippingClass: "flat" },
  { id: "5x7", label: '5 × 7 in', ratio: 1.4, price: 1200, shippingClass: "flat" },
  { id: "8x10", label: '8 × 10 in', ratio: 1.25, price: 2000, shippingClass: "flat" },
  { id: "8x12", label: '8 × 12 in', ratio: 1.5, price: 2200, shippingClass: "flat" },
  { id: "11x14", label: '11 × 14 in', ratio: 1.273, price: 3200, shippingClass: "flat" },
  { id: "12x18", label: '12 × 18 in', ratio: 1.5, price: 4800, shippingClass: "tube" },
  { id: "16x20", label: '16 × 20 in', ratio: 1.25, price: 7000, shippingClass: "tube" },
  { id: "16x24", label: '16 × 24 in', ratio: 1.5, price: 8000, shippingClass: "tube" },
  { id: "20x30", label: '20 × 30 in', ratio: 1.5, price: 12000, shippingClass: "tube" },
];

export const printSelections = (printsData as PrintsData).items;

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function getPhoto(collectionSlug: string, photoId: string) {
  return getCollection(collectionSlug)?.images.find((photo) => photo.id === photoId);
}

export function getPrintSelection(collectionSlug: string, photoId: string) {
  return printSelections.find(
    (selection) => selection.collectionSlug === collectionSlug && selection.photoId === photoId,
  );
}

export function getAvailablePrints() {
  return printSelections.flatMap((selection) => {
    if (!selection.available) return [];
    const collection = getCollection(selection.collectionSlug);
    const photo = getPhoto(selection.collectionSlug, selection.photoId);
    return collection && photo ? [{ selection, collection, photo }] : [];
  });
}

export function getCover(collection: Collection) {
  return collection.images.find((photo) => photo.id === collection.coverImageId) ?? collection.images[0];
}

export function formatPhotoName(collection: Collection, photo: Photo) {
  return photo.title ?? `${collection.title.replace(/['’]\\d+$/, "")} No. ${String(photo.order).padStart(2, "0")}`;
}

export function formatPrintName(collection: Collection, photo: Photo) {
  return getPrintSelection(collection.slug, photo.id)?.title ?? formatPhotoName(collection, photo);
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function compatiblePrintOptions(photo: Photo) {
  const ratio = Math.max(photo.width, photo.height) / Math.min(photo.width, photo.height);
  return printOptions.filter((option) => Math.abs(option.ratio - ratio) < 0.07);
}

export function getPrintOptionsForPhoto(collectionSlug: string, photo: Photo) {
  const selection = getPrintSelection(collectionSlug, photo.id);
  if (!selection?.available) return [];
  const allowedSizeIds = selection.sizeIds ? new Set(selection.sizeIds) : null;
  return compatiblePrintOptions(photo)
    .filter((option) => !allowedSizeIds || allowedSizeIds.has(option.id))
    .map((option) => {
      const override = selection.priceOverrides?.[option.id];
      return typeof override === "number" && Number.isInteger(override) && override >= 0
        ? { ...option, price: override }
        : option;
    });
}

export function getPrintOptionForPhoto(collectionSlug: string, photo: Photo, sizeId: string) {
  return getPrintOptionsForPhoto(collectionSlug, photo).find((option) => option.id === sizeId);
}

export function displayDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, "$1-$2-$3"));
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(parsed);
}
