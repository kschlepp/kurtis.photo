/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { type CSSProperties, useCallback, useState } from "react";
import { PrintConfigurator } from "@/components/cart";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { routes, siteConfig } from "@/content/site-config";
import { siteCopy } from "@/content/site-copy";
import { formatPhotoName, type Collection, type Photo, type PrintSelection } from "@/lib/catalog";

type PrintCatalogItem = {
  photo: Photo;
  selection: PrintSelection;
};

export type PrintCatalogGroup = {
  collection: Pick<Collection, "slug" | "title">;
  items: PrintCatalogItem[];
};

export function PrintCatalog({ groups }: { groups: PrintCatalogGroup[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const close = useCallback(() => setActiveKey(null), []);
  const activeItem = groups
    .flatMap((group) => group.items.map((item) => ({ ...item, collection: group.collection })))
    .find(({ collection, photo }) => `${collection.slug}-${photo.id}` === activeKey);

  return (
    <>
      <section className="print-catalog" aria-label={siteCopy.prints.availableLabel}>
        {groups.map(({ collection, items }, groupIndex) => (
          <section className="print-collection" key={collection.slug}>
            <header className="print-collection-heading">
              <h2>{collection.title}</h2>
              <span>{siteCopy.prints.photoCount(items.length)}</span>
            </header>
            <div className="print-collection-grid">
              {items.map(({ selection, photo }, index) => {
                const title = selection.title ?? formatPhotoName(collection, photo);
                const itemKey = `${collection.slug}-${photo.id}`;
                const aspectRatio = photo.width / photo.height;
                const tileStyle = {
                  "--print-ratio": aspectRatio,
                  "--print-basis": `${aspectRatio * siteConfig.printCatalogLayout.targetRowHeight}px`,
                  "--print-max-width": `${aspectRatio * siteConfig.printCatalogLayout.maximumRowHeight}px`,
                  "--print-orphan-max-width": `${aspectRatio * siteConfig.printCatalogLayout.orphanRowHeight}px`,
                } as CSSProperties;
                return (
                  <button
                    aria-label={siteCopy.prints.enlargeLabel(title)}
                    className="print-catalog-tile"
                    key={itemKey}
                    onClick={() => setActiveKey(itemKey)}
                    style={tileStyle}
                    type="button"
                  >
                    <img
                      alt={photo.alt}
                      loading={groupIndex === 0 && index < 3 ? "eager" : "lazy"}
                      src={photo.variants[siteConfig.imageVariants.display]}
                    />
                  </button>
                );
              })}
            </div>
            <Link className="inline-link print-collection-link" href={routes.place(collection.slug)}>{siteCopy.prints.originalCollection} <span>↗</span></Link>
          </section>
        ))}
      </section>
      {activeItem ? (
        <PhotoLightbox
          alt={activeItem.photo.alt}
          description={activeItem.selection.note}
          detailsAside={<PrintConfigurator collectionSlug={activeItem.collection.slug} photo={activeItem.photo} />}
          eyebrow={activeItem.collection.title}
          onClose={close}
          src={activeItem.photo.variants[siteConfig.imageVariants.full]}
          title={activeItem.selection.title ?? formatPhotoName(activeItem.collection, activeItem.photo)}
        />
      ) : null}
    </>
  );
}
