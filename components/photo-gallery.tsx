/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { routes, siteConfig } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";
import { displayDate, formatPhotoName, type Collection } from "@/lib/catalog";

type GalleryCollection = Pick<Collection, "slug" | "title" | "images"> & { location?: string };

export function PhotoGallery({
  collection,
  basePath = routes.places,
  showMetadata = true,
}: {
  collection: GalleryCollection;
  basePath?: string;
  showMetadata?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : collection.images[activeIndex];

  useEffect(() => {
    const onPopState = () => setActiveIndex(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function open(index: number) {
    window.history.pushState({}, "", `${basePath}/${collection.slug}/${collection.images[index].id}`);
    setActiveIndex(index);
  }

  function close() {
    window.history.replaceState({}, "", `${basePath}/${collection.slug}`);
    setActiveIndex(null);
  }

  function move(direction: -1 | 1) {
    if (activeIndex === null) return;
    const nextIndex = (activeIndex + direction + collection.images.length) % collection.images.length;
    window.history.replaceState({}, "", `${basePath}/${collection.slug}/${collection.images[nextIndex].id}`);
    setActiveIndex(nextIndex);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <div className="photo-grid">
        {collection.images.map((photo, index) => (
          <button className="photo-tile" key={photo.id} type="button" onClick={() => open(index)}>
            <img src={photo.variants[siteConfig.imageVariants.display]} alt={photo.alt} loading={index > 1 ? "lazy" : "eager"} />
            <span>{formatPhotoName(collection, photo)}</span>
          </button>
        ))}
      </div>
      {activePhoto && activeIndex !== null && (
        <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={formatPhotoName(collection, activePhoto)}>
          <div className="viewer-topbar">
            <span>{String(activeIndex + 1).padStart(siteConfig.countPadLength, "0")} / {String(collection.images.length).padStart(siteConfig.countPadLength, "0")}</span>
            <button className="text-button" type="button" onClick={close}>{siteCopy.gallery.close}</button>
          </div>
          <div className="viewer-main">
            <img src={activePhoto.variants[siteConfig.imageVariants.full]} alt={activePhoto.alt} />
          </div>
          <nav aria-label={siteCopy.accessibility.photoNavigation} className="viewer-controls">
            <button className="viewer-step" type="button" onClick={() => move(-1)} aria-label={siteCopy.gallery.previousLabel}>{siteCopy.common.previous}</button>
            <button className="viewer-step" type="button" onClick={() => move(1)} aria-label={siteCopy.gallery.nextLabel}>{siteCopy.common.next}</button>
          </nav>
          <div className="viewer-details">
            <div>
              {showMetadata && collection.location ? <p className="eyebrow">{collection.location}</p> : null}
              <h2>{formatPhotoName(collection, activePhoto)}</h2>
              {showMetadata ? <p className="metadata-line">
                {[activePhoto.metadata.cameraMake, activePhoto.metadata.cameraBody].filter(Boolean).join(" ")}
                {displayDate(activePhoto.metadata.captureDate) ? ` · ${displayDate(activePhoto.metadata.captureDate)}` : ""}
              </p> : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
