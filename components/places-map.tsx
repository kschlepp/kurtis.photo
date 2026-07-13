"use client";

/* eslint-disable @next/next/no-img-element */

import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import Link from "next/link";
import { type PointerEvent, type WheelEvent, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { collections, getCover } from "@/lib/catalog";

type CountryTopology = Topology<{ countries: GeometryCollection }>;

type MapTransform = { scale: number; x: number; y: number };
type MapPoint = { x: number; y: number };
type DragState = { pointerId: number; point: MapPoint; transform: MapTransform };

const topology = worldAtlas as unknown as CountryTopology;
const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
const mapWidth = 1000;
const mapHeight = 520;
const minimumZoom = 1;
const maximumZoom = 8;
const initialTransform: MapTransform = { scale: 1, x: 0, y: 0 };

export function PlacesMap() {
  const mapRef = useRef<SVGSVGElement>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    collections.find((collection) => collection.featured)?.slug ?? collections[0]?.slug ?? null,
  );
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [transform, setTransform] = useState<MapTransform>(initialTransform);
  const [drag, setDrag] = useState<DragState | null>(null);
  const selected = collections.find((collection) => collection.slug === selectedSlug);
  const selectedCover = selected ? getCover(selected) : null;
  const { countryPaths, pins } = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([mapWidth, mapHeight], {
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

  const pointFor = (clientX: number, clientY: number): MapPoint | null => {
    const map = mapRef.current;
    if (!map) return null;
    const point = map.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = map.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  };

  const zoomAt = (point: MapPoint, targetScale: number) => {
    setTransform((previous) => {
      const scale = Math.min(maximumZoom, Math.max(minimumZoom, targetScale));
      const worldX = (point.x - previous.x) / previous.scale;
      const worldY = (point.y - previous.y) / previous.scale;
      return { scale, x: point.x - worldX * scale, y: point.y - worldY * scale };
    });
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const point = pointFor(event.clientX, event.clientY);
    if (point) zoomAt(point, transform.scale * (event.deltaY > 0 ? 0.8 : 1.25));
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element | null)?.closest("[data-map-pin]")) return;
    const point = pointFor(event.clientX, event.clientY);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, point, transform });
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = pointFor(event.clientX, event.clientY);
    if (!point) return;
    setTransform({
      ...drag.transform,
      x: drag.transform.x + point.x - drag.point.x,
      y: drag.transform.y + point.y - drag.point.y,
    });
  };

  const finishDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (drag?.pointerId === event.pointerId) setDrag(null);
  };

  const zoomAtCenter = (factor: number) => zoomAt(
    { x: mapWidth / 2, y: mapHeight / 2 },
    transform.scale * factor,
  );
  const pinScale = 1 / transform.scale;

  return (
    <div className="places-map">
      <div className="places-map-canvas">
        <div className="places-map-controls" aria-label="Map controls">
          <button aria-label="Zoom in" onClick={() => zoomAtCenter(1.45)} type="button">+</button>
          <button aria-label="Zoom out" onClick={() => zoomAtCenter(1 / 1.45)} type="button">−</button>
          <button aria-label="Reset map position" className="places-map-reset" onClick={() => setTransform(initialTransform)} type="button">Reset</button>
        </div>
        <svg
          className="places-map-geometry"
          onPointerCancel={finishDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onWheel={handleWheel}
          ref={mapRef}
          role="application"
          aria-label="Interactive map of photography collections. Drag to explore and use the mouse wheel to zoom."
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            {countryPaths.map((country) => <path className="places-map-country" key={country.id} d={country.d} />)}
            {pins.map(({ collection, x, y }) => {
              const labelVisible = selectedSlug === collection.slug || hoveredSlug === collection.slug;
              return (
                <g
                  className={`places-map-pin${selectedSlug === collection.slug ? " is-selected" : ""}`}
                  key={collection.slug}
                  transform={`translate(${x} ${y}) scale(${pinScale})`}
                >
                  <circle
                    aria-label={`Show ${collection.title}`}
                    aria-pressed={selectedSlug === collection.slug}
                    className="places-map-pin-control"
                    data-map-pin
                    onBlur={() => setHoveredSlug(null)}
                    onClick={() => setSelectedSlug(collection.slug)}
                    onFocus={() => setHoveredSlug(collection.slug)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedSlug(collection.slug);
                      }
                    }}
                    onMouseEnter={() => setHoveredSlug(collection.slug)}
                    onMouseLeave={() => setHoveredSlug(null)}
                    r="8"
                    role="button"
                    tabIndex={0}
                  />
                  {labelVisible && <text x="0" y="-15">{collection.title}</text>}
                </g>
              );
            })}
          </g>
        </svg>
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
