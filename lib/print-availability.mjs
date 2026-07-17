export function printSelectionKey(collectionSlug, photoId) {
  return `${collectionSlug}:${photoId}`;
}

export function getSellablePhotoKeys(selections) {
  return new Set(
    selections
      .filter((selection) => selection.available)
      .map((selection) => printSelectionKey(selection.collectionSlug, selection.photoId)),
  );
}
