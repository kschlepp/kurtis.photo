"use client";

/* eslint-disable @next/next/no-img-element */

import type { Feature, FeatureCollection, Geometry, MultiLineString, Point } from "geojson";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from "maplibre-gl";
import worldCountries from "world-atlas/countries-50m.json";
import worldAtlas from "world-atlas/land-50m.json";
import { densifyLandPolygons, rewindLandPolygons, splitAntimeridianPolygons } from "@/lib/rewind-geojson.mjs";

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

type LandTopology = Topology<{ land: GeometryCollection }>;
type CountriesTopology = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
type PlaceProperties = { slug: string; title: string };
type ClusterMarker = { marker: MapLibreMarker; element: HTMLSpanElement };

const topology = worldAtlas as unknown as LandTopology;
const countriesTopology = worldCountries as unknown as CountriesTopology;
const land = rewindLandPolygons(
  densifyLandPolygons(
    splitAntimeridianPolygons(feature(topology, topology.objects.land) as FeatureCollection<Geometry>),
  ),
) as FeatureCollection<Geometry>;
const countryBorders: MultiLineString = mesh(
  countriesTopology,
  countriesTopology.objects.countries,
  (left, right) => left !== right,
) as MultiLineString;
const worldView = { center: [-18, 24] as [number, number], zoom: 1.08 };
const maxGlobeZoom = 9.5;
const selectedPlaceZoom = 9.2;
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
    ocean: daylight > 0.42 ? "#bbdde7" : "#789ba6",
    land: daylight > 0.42 ? "#eedbb8" : "#aaa59a",
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

function isOnVisibleHemisphere(center: { lat: number; lng: number }, coordinates: [number, number]) {
  const radians = Math.PI / 180;
  const centerLatitude = center.lat * radians;
  const pointLatitude = coordinates[1] * radians;
  const longitudeDelta = (coordinates[0] - center.lng) * radians;
  const cosineDistance = Math.sin(centerLatitude) * Math.sin(pointLatitude)
    + Math.cos(centerLatitude) * Math.cos(pointLatitude) * Math.cos(longitudeDelta);
  return cosineDistance > 0.025;
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
      land: { type: "geojson", data: land },
      "country-borders": { type: "geojson", data: countryBorders },
      places: {
        type: "geojson",
        data: placePoints,
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 24,
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
        id: "land-fill",
        type: "fill",
        source: "land",
        paint: {
          "fill-color": light.land,
          "fill-opacity": 0.98,
        },
      },
      {
        id: "country-borders",
        type: "line",
        source: "country-borders",
        paint: {
          "line-color": "#84999a",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 5, 0.72],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.45, 5, 0.9],
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
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5.5, 4, 7.5, 9.5, 5.5],
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
      "horizon-color": "#d6edf1",
      "fog-color": "#d6edf1",
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
  const clusterMarkersRef = useRef(new Map<number, ClusterMarker>());
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
    map.stop();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = place
      ? {
          center: [place.coordinates.longitude, place.coordinates.latitude] as [number, number],
          zoom: Math.max(map.getZoom(), selectedPlaceZoom),
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
    const clusterMarkers = clusterMarkersRef.current;

    async function initializeMap() {
      const container = mapContainerRef.current;
      if (!container) return;

      try {
        const { Map: MapConstructor, Marker } = await import("maplibre-gl");
        if (cancelled) return;
        instance = new MapConstructor({
          container,
          style: makeGlobeStyle(places, new Date()),
          center: worldView.center,
          zoom: worldView.zoom,
          minZoom: 0,
          maxZoom: maxGlobeZoom,
          pitch: 0,
          bearing: 0,
          dragPan: true,
          scrollZoom: true,
          touchZoomRotate: true,
          cooperativeGestures: false,
          attributionControl: false,
          renderWorldCopies: false,
          canvasContextAttributes: { antialias: true, powerPreference: "high-performance" },
        });
        mapRef.current = instance;
        instance.setPadding(worldPadding());

        const updateClusterMarkers = () => {
          if (!instance?.isStyleLoaded()) return;
          const center = instance.getCenter();
          const seen = new Set<number>();
          for (const cluster of instance.querySourceFeatures("places")) {
            const clusterId = cluster.properties?.cluster_id;
            const count = cluster.properties?.point_count;
            if (typeof clusterId !== "number" || typeof count !== "number" || seen.has(clusterId)) continue;
            if (cluster.geometry.type !== "Point") continue;
            const coordinates = cluster.geometry.coordinates as [number, number];
            if (!isOnVisibleHemisphere(center, coordinates)) continue;
            seen.add(clusterId);
            const existing = clusterMarkers.get(clusterId);
            if (existing) {
              existing.element.textContent = String(count);
              existing.marker.setLngLat(coordinates);
              continue;
            }
            const element = document.createElement("span");
            element.className = "globe-cluster-count";
            element.textContent = String(count);
            element.setAttribute("aria-hidden", "true");
            const marker = new Marker({ element, anchor: "center" }).setLngLat(coordinates).addTo(instance);
            clusterMarkers.set(clusterId, { marker, element });
          }
          for (const [clusterId, { marker }] of clusterMarkers) {
            if (seen.has(clusterId)) continue;
            marker.remove();
            clusterMarkers.delete(clusterId);
          }
        };

        instance.on("load", () => {
          if (cancelled || !instance) return;
          setMapReady(true);

          const updateLighting = () => {
            if (!instance) return;
            const light = localLight();
            setNightShade(light.night);
            instance.setPaintProperty("ocean", "background-color", light.ocean);
            instance.setPaintProperty("land-fill", "fill-color", light.land);
            instance.setSky({
              "sky-color": light.ocean,
              "horizon-color": light.daylight > 0.42 ? "#d6edf1" : "#668993",
              "fog-color": light.daylight > 0.42 ? "#d6edf1" : "#668993",
              "sky-horizon-blend": 0.35,
              "horizon-fog-blend": 0.35,
              "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.32, 5, 0.08],
            });
            instance.setLight({ anchor: "map", position: light.position, color: "#eee8dc", intensity: 0.28 });
          };
          updateLighting();
          lightingTimer = setInterval(updateLighting, 5 * 60 * 1000);
          instance.on("render", updateClusterMarkers);

          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const opensOnPlace = new URLSearchParams(window.location.search).has("place");
          if (!reducedMotion && !opensOnPlace) {
            instance.jumpTo({ center: [145, 18], zoom: 0.92, bearing: 0, pitch: 0 });
            instance.easeTo({
              ...worldView,
              padding: worldPadding(),
              duration: 6200,
              easing: (progress) => 1 - Math.pow(1 - progress, 3),
              essential: false,
            });
          }

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
      for (const { marker } of clusterMarkers.values()) marker.remove();
      clusterMarkers.clear();
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
    map.stop();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zoom = Math.min(maxGlobeZoom, Math.max(0, map.getZoom() + amount));
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
        <div aria-hidden="true" className="globe-time-shade" style={{ opacity: nightShade * 0.16 }} />
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
            <small>Larger pins group nearby places—select one to zoom in. Scroll or pinch to zoom.</small>
          </div>
        )}
      </div>
    </section>
  );
}
