"use client";

/* eslint-disable @next/next/no-img-element */

import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import Link from "next/link";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { collections, getCover } from "@/lib/catalog";

type CountryTopology = Topology<{ countries: GeometryCollection }>;

type MapTransform = { scale: number; x: number; y: number };
type MapPoint = { x: number; y: number };
type DragState = { pointerId: number; point: MapPoint; transform: MapTransform };
type PinchState = { distance: number; midpoint: MapPoint; transform: MapTransform };

const topology = worldAtlas as unknown as CountryTopology;
const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
const mapWidth = 1000;
const mapHeight = 520;
const minimumZoom = 1;
const maximumZoom = 8;
const initialTransform: MapTransform = { scale: 1, x: 0, y: 0 };

function distanceBetween(left: MapPoint, right: MapPoint) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function midpointBetween(left: MapPoint, right: MapPoint): MapPoint {
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
}

export function PlacesMap() {
  const mapRef = useRef<SVGSVGElement>(null);
  const touchPoints = useRef(new Map<number, MapPoint>());
  const pinch = useRef<PinchState | null>(null);
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

  const zoomBy = (point: MapPoint, factor: number) => {
    setTransform((previous) => {
      const scale = Math.min(maximumZoom, Math.max(minimumZoom, previous.scale * factor));
      const worldX = (point.x - previous.x) / previous.scale;
      const worldY = (point.y - previous.y) / previous.scale;
      return { scale, x: point.x - worldX * scale, y: point.y - worldY * scale };
    });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleTrackpadPinch = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const point = pointFor(event.clientX, event.clientY);
      if (point) zoomBy(point, Math.exp(-event.deltaY * 0.01));
    };

    map.addEventListener("wheel", handleTrackpadPinch, { passive: false });
    return () => map.removeEventListener("wheel", handleTrackpadPinch);
  });

  const startPinch = () => {
    const points = [...touchPoints.current.values()];
    if (points.length !== 2) return;
    pinch.current = {
      distance: distanceBetween(points[0], points[1]),
      midpoint: midpointBetween(points[0], points[1]),
      transform,
    };
    setDrag(null);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element | null)?.closest("[data-map-pin]")) return;
    const point = pointFor(event.clientX, event.clientY);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.pointerType === "touch") {
      touchPoints.current.set(event.pointerId, point);
      if (touchPoints.current.size === 2) startPinch();
      return;
    }

    setDrag({ pointerId: event.pointerId, point, transform });
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const point = pointFor(event.clientX, event.clientY);
    if (!point) return;

    if (event.pointerType === "touch" && touchPoints.current.has(event.pointerId)) {
      touchPoints.current.set(event.pointerId, point);
      const currentPinch = pinch.current;
      const points = [...touchPoints.current.values()];
      if (currentPinch && points.length === 2) {
        const distance = distanceBetween(points[0], points[1]);
        if (distance === 0 || currentPinch.distance === 0) return;
        const midpoint = midpointBetween(points[0], points[1]);
        const scale = Math.min(
          maximumZoom,
          Math.max(minimumZoom, currentPinch.transform.scale * (distance / currentPinch.distance)),
        );
        const worldX = (currentPinch.midpoint.x - currentPinch.transform.x) / currentPinch.transform.scale;
        const worldY = (currentPinch.midpoint.y - currentPinch.transform.y) / currentPinch.transform.scale;
        setTransform({ scale, x: midpoint.x - worldX * scale, y: midpoint.y - worldY * scale });
      }
      return;
    }

    if (!drag || drag.pointerId !== event.pointerId) return;
    setTransform({
      ...drag.transform,
      x: drag.transform.x + point.x - drag.point.x,
      y: drag.transform.y + point.y - drag.point.y,
    });
  };

  const finishDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch") {
      touchPoints.current.delete(event.pointerId);
      pinch.current = null;
      return;
    }
    if (drag?.pointerId === event.pointerId) setDrag(null);
  };

  const zoomAtCenter = (factor: number) => zoomBy(
    { x: mapWidth / 2, y: mapHeight / 2 },
    factor,
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
          ref={mapRef}
          role="application"
          aria-label="Interactive map of photography collections. Drag to explore and pinch to zoom."
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
