"use client";

/* eslint-disable @next/next/no-img-element */

import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { collections, getCover } from "@/lib/catalog";

type PlacesMapProps = {
  compact?: boolean;
};

type CountryTopology = Topology<{ countries: GeometryCollection }>;

type CanvasSize = { width: number; height: number };

const topology = worldAtlas as unknown as CountryTopology;
const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;

export function PlacesMap({ compact = false }: PlacesMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    compact ? collections.find((collection) => collection.featured)?.slug ?? collections[0]?.slug ?? null : null,
  );
  const selected = collections.find((collection) => collection.slug === selectedSlug);
  const selectedCover = selected ? getCover(selected) : null;
  const { countryPaths, pins } = useMemo(() => {
    const width = 1000;
    const height = 520;
    const projection = geoNaturalEarth1().fitSize([width, height], {
      type: "Sphere",
    });
    const path = geoPath(projection);

    return {
      countryPaths: countries.features.map((country, index) => ({
        id: String(country.id ?? index),
        d: path(country) ?? "",
      })),
      pins: collections.flatMap((collection) => {
        const point = projection([collection.coordinates.longitude, collection.coordinates.latitude]);
        return point ? [{ collection, x: point[0], y: point[1] }] : [];
      }),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    updateCanvasSize();

    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const getPinPosition = (x: number, y: number) => {
    if (!canvasSize || canvasSize.width === 0 || canvasSize.height === 0) {
      return { left: `${(x / 1000) * 100}%`, top: `${(y / 520) * 100}%` };
    }

    const scale = Math.min(canvasSize.width / 1000, canvasSize.height / 520);
    const horizontalInset = (canvasSize.width - 1000 * scale) / 2;
    const verticalInset = (canvasSize.height - 520 * scale) / 2;

    return {
      left: `${((horizontalInset + x * scale) / canvasSize.width) * 100}%`,
      top: `${((verticalInset + y * scale) / canvasSize.height) * 100}%`,
    };
  };

  return (
    <div className={`places-map${compact ? " places-map-compact" : ""}`}>
      <div className="places-map-canvas" ref={canvasRef}>
        <svg
          aria-hidden="true"
          className="places-map-geometry"
          focusable="false"
          viewBox="0 0 1000 520"
        >
          {countryPaths.map((country) => <path key={country.id} d={country.d} />)}
        </svg>
        {pins.map(({ collection, x, y }) => (
          <button
            aria-label={`Show ${collection.title}`}
            aria-pressed={selectedSlug === collection.slug}
            className={`places-map-pin${selectedSlug === collection.slug ? " is-selected" : ""}`}
            key={collection.slug}
            onClick={() => setSelectedSlug(collection.slug)}
            style={getPinPosition(x, y)}
            type="button"
          >
            <span>{collection.title.replace(/['’]\d+$/, "")}</span>
          </button>
        ))}
      </div>
      <div aria-live="polite" className="places-map-preview">
        {selected && selectedCover ? (
          <>
            <img alt="" src={selectedCover.variants["768"]} />
            <div>
              <p className="eyebrow">Selected place</p>
              <h3>{selected.title}</h3>
              <p>{selected.location}</p>
              <p>{selected.note ?? `A small collection of ${selected.images.length} photographs.`}</p>
              <Link className="inline-link" href={`/places/${selected.slug}`}>Open collection <span>↗</span></Link>
            </div>
          </>
        ) : (
          <div className="places-map-empty">
            <p className="eyebrow">Map view</p>
            <p>Select a pin to preview that collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
