/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { displayDate, formatPhotoName, type Collection } from "@/lib/catalog";

export function PhotoGallery({ collection }: { collection: Collection }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : collection.images[activeIndex];

  useEffect(() => {
    const onPopState = () => setActiveIndex(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function open(index: number) {
    window.history.pushState({}, "", `/places/${collection.slug}/${collection.images[index].id}`);
    setActiveIndex(index);
  }

  function close() {
    window.history.replaceState({}, "", `/places/${collection.slug}`);
    setActiveIndex(null);
  }

  function move(direction: -1 | 1) {
    if (activeIndex === null) return;
    const nextIndex = (activeIndex + direction + collection.images.length) % collection.images.length;
    window.history.replaceState({}, "", `/places/${collection.slug}/${collection.images[nextIndex].id}`);
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
            <img src={photo.variants["1600"]} alt={photo.alt} loading={index > 1 ? "lazy" : "eager"} />
            <span>{formatPhotoName(collection, photo)}</span>
          </button>
        ))}
      </div>
      {activePhoto && activeIndex !== null && (
        <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={formatPhotoName(collection, activePhoto)}>
          <div className="viewer-topbar">
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(collection.images.length).padStart(2, "0")}</span>
            <button className="text-button" type="button" onClick={close}>Close</button>
          </div>
          <div className="viewer-main">
            <img src={activePhoto.variants["2400"]} alt={activePhoto.alt} />
          </div>
          <nav aria-label="Photo navigation" className="viewer-controls">
            <button className="viewer-step" type="button" onClick={() => move(-1)} aria-label="Previous photograph">← Previous</button>
            <button className="viewer-step" type="button" onClick={() => move(1)} aria-label="Next photograph">Next →</button>
          </nav>
          <div className="viewer-details">
            <div>
              <p className="eyebrow">{collection.location}</p>
              <h2>{formatPhotoName(collection, activePhoto)}</h2>
              <p className="metadata-line">
                {[activePhoto.metadata.cameraMake, activePhoto.metadata.cameraBody].filter(Boolean).join(" ")}
                {displayDate(activePhoto.metadata.captureDate) ? ` · ${displayDate(activePhoto.metadata.captureDate)}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
