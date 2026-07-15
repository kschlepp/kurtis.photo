"use client";

/* eslint-disable @next/next/no-img-element */

import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import worldAtlas from "world-atlas/countries-110m.json";

export type GlobePlace = {
  slug: string;
  title: string;
  location: string;
  note: string | null;
  photoCount: number;
  coordinates: { latitude: number; longitude: number };
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

type CountryTopology = Topology<{ countries: GeometryCollection }>;
type PlaceProperties = { slug: string; title: string };

const topology = worldAtlas as unknown as CountryTopology;
const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
const worldView = { center: [-18, 24] as [number, number], zoom: 1.08 };
const emptyPoints: FeatureCollection<Point, PlaceProperties> = { type: "FeatureCollection", features: [] };

function worldPadding() {
  return { top: 0, right: 0, bottom: window.matchMedia("(max-width: 780px)").matches ? 92 : 138, left: 0 };
}

function localLight(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  const daylight = (Math.cos(((hour - 12) / 12) * Math.PI) + 1) / 2;
  const azimuth = (hour * 15) % 360;
  const polar = 78 - daylight * 43;
  return {
    daylight,
    night: 1 - daylight,
    position: [1.5, azimuth, polar] as [number, number, number],
    ocean: daylight > 0.42 ? "#dfe7e7" : "#aebdc1",
    land: daylight > 0.42 ? "#d9d3c8" : "#b8b4ae",
  };
}

function placeFeature(place: GlobePlace): Feature<Point, PlaceProperties> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [place.coordinates.longitude, place.coordinates.latitude],
    },
    properties: { slug: place.slug, title: place.title },
  };
}

function makeGlobeStyle(places: GlobePlace[], date = new Date()): StyleSpecification {
  const light = localLight(date);
  const placePoints: FeatureCollection<Point, PlaceProperties> = {
    type: "FeatureCollection",
    features: places.map(placeFeature),
  };

  return {
    version: 8,
    projection: { type: "globe" },
    sources: {
      countries: { type: "geojson", data: countries },
      places: {
        type: "geojson",
        data: placePoints,
        cluster: true,
        clusterMaxZoom: 3,
        clusterRadius: 34,
      },
      "selected-place": { type: "geojson", data: emptyPoints },
    },
    layers: [
      {
        id: "ocean",
        type: "background",
        paint: { "background-color": light.ocean },
      },
      {
        id: "country-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": light.land,
          "fill-opacity": 0.98,
        },
      },
      {
        id: "place-clusters-ring",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "rgba(248, 247, 242, 0.88)",
          "circle-radius": ["step", ["get", "point_count"], 16, 8, 19, 20, 23],
          "circle-blur": 0.08,
        },
      },
      {
        id: "place-clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#c98e7e",
          "circle-radius": ["step", ["get", "point_count"], 11, 8, 14, 20, 17],
          "circle-stroke-color": "#f8f7f2",
          "circle-stroke-width": 1.5,
        },
      },
      {
        id: "place-pins",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#c98e7e",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5.5, 4, 8],
          "circle-stroke-color": "#f8f7f2",
          "circle-stroke-width": 2,
        },
      },
      {
        id: "selected-place-halo",
        type: "circle",
        source: "selected-place",
        paint: {
          "circle-color": "rgba(248, 247, 242, 0.84)",
          "circle-radius": 15,
          "circle-blur": 0.12,
        },
      },
      {
        id: "selected-place-pin",
        type: "circle",
        source: "selected-place",
        paint: {
          "circle-color": "#356d8c",
          "circle-radius": 9,
          "circle-stroke-color": "#f8f7f2",
          "circle-stroke-width": 2.5,
        },
      },
    ],
    sky: {
      "sky-color": light.ocean,
      "horizon-color": "#c6d1d2",
      "fog-color": "#c6d1d2",
      "sky-horizon-blend": 0.35,
      "horizon-fog-blend": 0.35,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.32, 5, 0.08],
    },
    light: { anchor: "map", position: light.position, color: "#eee8dc", intensity: 0.28 },
  } as StyleSpecification;
}

function updatePlaceQuery(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("place", slug);
  else url.searchParams.delete("place");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

export function GlobeExplorer({ places }: { places: GlobePlace[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initializedUrlRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nightShade, setNightShade] = useState(0);

  const placeBySlug = useMemo(
    () => new Map(places.map((place) => [place.slug, place])),
    [places],
  );
  const selectedPlace = selectedSlug ? placeBySlug.get(selectedSlug) ?? null : null;
  const visiblePlaces = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return places;
    return places.filter((place) => (place.title + " " + place.location).toLocaleLowerCase().includes(query));
  }, [filter, places]);

  const moveCamera = useCallback((map: MapLibreMap, place: GlobePlace | null) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = place
      ? {
          center: [place.coordinates.longitude, place.coordinates.latitude] as [number, number],
          zoom: Math.min(Math.max(map.getZoom(), 2.85), 3.5),
          bearing: 0,
          pitch: 0,
        }
      : { ...worldView, padding: worldPadding(), bearing: 0, pitch: 0 };

    if (reducedMotion) map.jumpTo(camera);
    else map.easeTo({ ...camera, duration: place ? 1050 : 850, essential: false });
  }, []);

  const choosePlace = useCallback((slug: string) => {
    if (!placeBySlug.has(slug)) return;
    setSelectedSlug(slug);
    if (window.matchMedia("(max-width: 780px)").matches) setSheetOpen(false);
  }, [placeBySlug]);

  const clearSelection = useCallback(() => {
    if (!selectedSlug && mapRef.current) moveCamera(mapRef.current, null);
    setSelectedSlug(null);
    setSheetOpen(false);
  }, [moveCamera, selectedSlug]);

  useEffect(() => {
    const fromUrl = () => {
      const slug = new URLSearchParams(window.location.search).get("place");
      setSelectedSlug(slug && placeBySlug.has(slug) ? slug : null);
    };
    fromUrl();
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
  }, [placeBySlug]);

  useEffect(() => {
    if (!initializedUrlRef.current) {
      initializedUrlRef.current = true;
      return;
    }
    updatePlaceQuery(selectedSlug);
  }, [selectedSlug]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelection]);

  useEffect(() => {
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    let lightingTimer: ReturnType<typeof setInterval> | null = null;

    async function initializeMap() {
      const container = mapContainerRef.current;
      if (!container) return;

      try {
        const { Map: MapConstructor } = await import("maplibre-gl");
        if (cancelled) return;
        instance = new MapConstructor({
          container,
          style: makeGlobeStyle(places, new Date()),
          center: worldView.center,
          zoom: worldView.zoom,
          minZoom: 0,
          maxZoom: 5.25,
          pitch: 0,
          bearing: 0,
          cooperativeGestures: false,
          attributionControl: false,
          renderWorldCopies: false,
          canvasContextAttributes: { antialias: true, powerPreference: "high-performance" },
        });
        mapRef.current = instance;
        instance.setPadding(worldPadding());

        instance.on("load", () => {
          if (cancelled || !instance) return;
          setMapReady(true);

          const updateLighting = () => {
            if (!instance) return;
            const light = localLight();
            setNightShade(light.night);
            instance.setPaintProperty("ocean", "background-color", light.ocean);
            instance.setPaintProperty("country-fill", "fill-color", light.land);
            instance.setSky({
              "sky-color": light.ocean,
              "horizon-color": light.daylight > 0.42 ? "#c6d1d2" : "#899b9f",
              "fog-color": light.daylight > 0.42 ? "#c6d1d2" : "#899b9f",
              "sky-horizon-blend": 0.35,
              "horizon-fog-blend": 0.35,
              "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.32, 5, 0.08],
            });
            instance.setLight({ anchor: "map", position: light.position, color: "#eee8dc", intensity: 0.28 });
          };
          updateLighting();
          lightingTimer = setInterval(updateLighting, 5 * 60 * 1000);

          instance.on("click", "place-pins", (event) => {
            const slug = event.features?.[0]?.properties?.slug;
            if (typeof slug === "string") choosePlace(slug);
          });
          instance.on("click", "selected-place-pin", (event) => {
            const slug = event.features?.[0]?.properties?.slug;
            if (typeof slug === "string") choosePlace(slug);
          });
          instance.on("click", "place-clusters", async (event) => {
            if (!instance) return;
            const cluster = event.features?.[0];
            const clusterId = cluster?.properties?.cluster_id;
            if (typeof clusterId !== "number" || cluster?.geometry.type !== "Point") return;
            const source = instance.getSource("places") as GeoJSONSource;
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const center = cluster.geometry.coordinates as [number, number];
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reducedMotion) instance.jumpTo({ center, zoom });
            else instance.easeTo({ center, zoom, duration: 700, essential: false });
          });

          for (const layer of ["place-pins", "place-clusters", "selected-place-pin"]) {
            instance.on("mouseenter", layer, () => { if (instance) instance.getCanvas().style.cursor = "pointer"; });
            instance.on("mouseleave", layer, () => { if (instance) instance.getCanvas().style.cursor = "grab"; });
          }
        });
        instance.on("error", (event) => {
          if (event.error) console.error("Globe map error", event.error);
        });
      } catch (error) {
        console.error("Globe map could not start", error);
        if (!cancelled) setMapFailed(true);
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      if (lightingTimer) clearInterval(lightingTimer);
      instance?.remove();
      mapRef.current = null;
    };
  }, [choosePlace, places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource("selected-place") as GeoJSONSource;
    source.setData(selectedPlace ? placeFeature(selectedPlace) : emptyPoints);
    moveCamera(map, selectedPlace);
  }, [mapReady, moveCamera, selectedPlace]);

  const zoomBy = (amount: number) => {
    const map = mapRef.current;
    if (!map) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zoom = Math.min(5.25, Math.max(0, map.getZoom() + amount));
    if (reducedMotion) map.jumpTo({ zoom });
    else map.easeTo({ zoom, duration: 300, essential: false });
  };

  return (
    <section className={"globe-explorer" + (sheetOpen ? " is-sheet-open" : "")} aria-labelledby="globe-title">
      <aside className={"globe-sidebar" + (sheetOpen ? " is-open" : "")}>
        <button
          aria-expanded={sheetOpen}
          className="globe-sheet-toggle"
          onClick={() => setSheetOpen((open) => !open)}
          type="button"
        >
          <span><b>Explore places</b><small>{String(places.length).padStart(2, "0")} collections</small></span>
          <span aria-hidden="true">{sheetOpen ? "↓" : "↑"}</span>
        </button>
        <div className="globe-sidebar-intro">
          <p className="eyebrow">Kurtis Schlepp · San Diego</p>
          <h1 id="globe-title">Things I saw along the way.</h1>
          <p>Travel, streets, and landscapes—organized by the places where I found them.</p>
        </div>
        <div className="globe-list-heading">
          <label htmlFor="place-filter">Places</label>
          <span>{String(visiblePlaces.length).padStart(2, "0")} shown</span>
        </div>
        <input
          className="globe-place-filter"
          id="place-filter"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter the archive"
          type="search"
          value={filter}
        />
        <nav className="globe-place-list" aria-label="Photography collections by place">
          {visiblePlaces.map((place) => (
            <button
              aria-pressed={selectedSlug === place.slug}
              className={"globe-place-row" + (selectedSlug === place.slug ? " is-selected" : "")}
              key={place.slug}
              onClick={() => choosePlace(place.slug)}
              type="button"
            >
              <span><strong>{place.title}</strong><small>{place.location}</small></span>
              <span>{String(place.photoCount).padStart(2, "0")}</span>
            </button>
          ))}
          {visiblePlaces.length === 0 ? <p className="globe-no-results">No places match that search.</p> : null}
        </nav>
        <div className="globe-sidebar-links">
          <Link href="/places">Photo index <span>↗</span></Link>
          <Link href="/inquire">Let’s take some photos <span>↗</span></Link>
        </div>
      </aside>

      <div className="globe-stage">
        <div
          aria-label="Interactive globe of photography collections. Drag to rotate, pinch to zoom, or choose a place from the list."
          className="globe-map"
          ref={mapContainerRef}
          role="region"
        />
        <div aria-hidden="true" className="globe-time-shade" style={{ opacity: nightShade * 0.26 }} />
        {!mapReady && !mapFailed ? <div className="globe-loading"><span /><p>Drawing the world…</p></div> : null}
        {mapFailed ? (
          <div className="globe-fallback">
            <p className="eyebrow">Map unavailable</p>
            <h2>The archive is still open.</h2>
            <p>This browser could not render the globe. Choose any place from the list or open the photo index.</p>
            <Link className="button button-ink" href="/places">Browse photographs</Link>
          </div>
        ) : null}

        <div className="globe-controls" aria-label="Globe controls">
          <button disabled={!mapReady} onClick={() => zoomBy(0.8)} type="button" aria-label="Zoom in">+</button>
          <button disabled={!mapReady} onClick={() => zoomBy(-0.8)} type="button" aria-label="Zoom out">−</button>
          <button disabled={!mapReady} onClick={clearSelection} type="button">Reset</button>
        </div>

        {selectedPlace ? (
          <article aria-live="polite" className="globe-photo-card">
            <Link className="globe-photo-card-link" href={"/places/" + selectedPlace.slug} aria-label={`Open ${selectedPlace.title} collection`}>
              <img src={selectedPlace.cover.src} alt={selectedPlace.cover.alt} />
              <div>
                <p className="eyebrow">Selected place</p>
                <h2>{selectedPlace.title}</h2>
                <p className="globe-card-location">{selectedPlace.location}</p>
                {selectedPlace.note ? <p>{selectedPlace.note}</p> : <p>{selectedPlace.photoCount} photographs from this place.</p>}
                <span className="inline-link">Open collection <span>↗</span></span>
              </div>
            </Link>
            <button aria-label="Close selected place" className="globe-card-close" onClick={clearSelection} type="button">×</button>
          </article>
        ) : (
          <div className="globe-instructions">
            <p className="eyebrow">The archive, geographically</p>
            <p>Drag to rotate. Select a pin or choose a place from the list.</p>
            <small>Scroll or pinch to zoom. Use two fingers on touch screens.</small>
          </div>
        )}
      </div>
    </section>
  );
}
