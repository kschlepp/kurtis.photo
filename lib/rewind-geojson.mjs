export function signedRingArea(ring) {
  let area = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    area += ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return area / 2;
}

function rewindPolygon(polygon) {
  return polygon.map((ring, index) => {
    const area = signedRingArea(ring);
    const hasCorrectWinding = index === 0 ? area > 0 : area < 0;
    return hasCorrectWinding ? ring : [...ring].reverse();
  });
}

export function rewindLandPolygons(collection) {
  return {
    ...collection,
    features: collection.features.map((landFeature) => {
      if (landFeature.geometry?.type !== "MultiPolygon") return landFeature;
      return {
        ...landFeature,
        geometry: {
          ...landFeature.geometry,
          coordinates: landFeature.geometry.coordinates.map(rewindPolygon),
        },
      };
    }),
  };
}

// world-atlas cuts polygons at the antimeridian by "stitching" rings with segments
// that jump straight from lon -180 to +180. In planar lon/lat space those stitches
// are world-spanning horizontal edges, which MapLibre's tiling turns into huge
// misfilled blocks and thin land-colored bands circling the globe. Split each ring
// at the jumps into per-side rings closed along the antimeridian (or, for a ring
// that genuinely wraps every longitude like Antarctica, closed over the pole).
const POLE_CLOSURE_LATITUDE = 86;

function isAntimeridianJump(a, b) {
  return Math.abs(b[0] - a[0]) > 180;
}

function poleClosure(fromLon, toLon, poleLat) {
  const points = [[fromLon, poleLat]];
  const direction = Math.sign(toLon - fromLon);
  let lon = fromLon;
  while (Math.abs(toLon - lon) > 170) {
    lon += direction * 170;
    points.push([lon, poleLat]);
  }
  points.push([toLon, poleLat]);
  return points;
}

function splitRingAtJumps(ring) {
  const points = ring.slice(0, ring.length - 1);
  const jumpAfter = points.map((point, index) => isAntimeridianJump(point, points[(index + 1) % points.length]));
  if (!jumpAfter.some(Boolean)) return [ring];

  const firstJump = jumpAfter.indexOf(true);
  const rotated = [...points.slice(firstJump + 1), ...points.slice(0, firstJump + 1)];
  const arcs = [];
  let arc = [];
  for (let index = 0; index < rotated.length; index++) {
    arc.push(rotated[index]);
    if (index === rotated.length - 1 || isAntimeridianJump(rotated[index], rotated[index + 1])) {
      arcs.push(arc);
      arc = [];
    }
  }

  const rings = [];
  for (const points of arcs) {
    if (points.length < 3) continue;
    const start = points[0];
    const end = points[points.length - 1];
    if (isAntimeridianJump(end, start)) {
      const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
      const poleLat = meanLat < 0 ? -POLE_CLOSURE_LATITUDE : POLE_CLOSURE_LATITUDE;
      rings.push([...points, ...poleClosure(end[0], start[0], poleLat), start]);
    } else {
      rings.push([...points, start]);
    }
  }
  return rings;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function splitPolygonAtJumps(polygon) {
  const exteriors = splitRingAtJumps(polygon[0]);
  const holes = polygon.slice(1).flatMap(splitRingAtJumps);
  if (exteriors.length === 1) return [[exteriors[0], ...holes]];
  const groups = exteriors.map((exterior) => [exterior]);
  for (const hole of holes) {
    const target = groups.find((group) => pointInRing(hole[0], group[0]));
    (target ?? groups[0]).push(hole);
  }
  return groups;
}

export function splitAntimeridianPolygons(collection) {
  return {
    ...collection,
    features: collection.features.map((landFeature) => {
      if (landFeature.geometry?.type !== "MultiPolygon") return landFeature;
      return {
        ...landFeature,
        geometry: {
          ...landFeature.geometry,
          coordinates: landFeature.geometry.coordinates.flatMap(splitPolygonAtJumps),
        },
      };
    }),
  };
}

const MAX_SEGMENT_DEGREES = 2;

function densifyRing(ring, maxSegmentDegrees = MAX_SEGMENT_DEGREES) {
  const out = [];
  for (let index = 0; index < ring.length; index++) {
    const [x0, y0] = ring[index];
    out.push([x0, y0]);
    if (index === ring.length - 1) break;
    const [x1, y1] = ring[index + 1];
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / maxSegmentDegrees);
    for (let step = 1; step < steps; step++) {
      out.push([x0 + ((x1 - x0) * step) / steps, y0 + ((y1 - y0) * step) / steps]);
    }
  }
  return out;
}

// MapLibre's globe fill subdivides each polygon onto the sphere, but long, sparsely
// vertexed edges (this atlas is simplified to 110m resolution) leave visible hairline
// cracks where the subdivision grid can't bend a single straight edge to the curvature.
// Adding intermediate vertices along every edge gives it enough points to bend cleanly.
export function densifyLandPolygons(collection) {
  return {
    ...collection,
    features: collection.features.map((landFeature) => {
      if (landFeature.geometry?.type !== "MultiPolygon") return landFeature;
      return {
        ...landFeature,
        geometry: {
          ...landFeature.geometry,
          coordinates: landFeature.geometry.coordinates.map((polygon) => polygon.map((ring) => densifyRing(ring))),
        },
      };
    }),
  };
}
