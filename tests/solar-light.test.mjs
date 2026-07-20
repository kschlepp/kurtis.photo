import assert from "node:assert/strict";
import test from "node:test";
import {
  geographicPointToMapLibreLightPosition,
  solarLightPosition,
  subsolarPoint,
} from "../lib/solar-light.mjs";

const radiansPerDegree = Math.PI / 180;

function mapLibreRendererSunVector([, azimuthal, polar]) {
  const adjustedAzimuthal = (azimuthal + 90) * radiansPerDegree;
  const polarRadians = polar * radiansPerDegree;
  return {
    x: -Math.cos(adjustedAzimuthal) * Math.sin(polarRadians),
    y: -Math.sin(adjustedAzimuthal) * Math.sin(polarRadians),
    z: -Math.cos(polarRadians),
  };
}

function geographicEarthVector({ longitude, latitude }) {
  const longitudeRadians = longitude * radiansPerDegree;
  const latitudeRadians = latitude * radiansPerDegree;
  return {
    x: Math.sin(longitudeRadians) * Math.cos(latitudeRadians),
    y: Math.sin(latitudeRadians),
    z: Math.cos(longitudeRadians) * Math.cos(latitudeRadians),
  };
}

function assertVectorClose(actual, expected, tolerance = 1e-12) {
  for (const axis of ["x", "y", "z"]) {
    assert.ok(Math.abs(actual[axis] - expected[axis]) < tolerance, `${axis}: ${actual[axis]} != ${expected[axis]}`);
  }
}

test("converts geographic sunlight to MapLibre's globe-light coordinate system", () => {
  for (const point of [
    { longitude: 0, latitude: 0 },
    { longitude: -115.87, latitude: 20.76 },
    { longitude: 139.7, latitude: -23.44 },
    { longitude: -45, latitude: 65 },
  ]) {
    const position = geographicPointToMapLibreLightPosition(point);
    assertVectorClose(mapLibreRendererSunVector(position), geographicEarthVector(point));
  }
});

test("tracks the northern summer subsolar latitude and longitude", () => {
  const point = subsolarPoint(new Date("2026-07-20T19:49:47Z"));
  assert.ok(Math.abs(point.latitude - 20.76) < 0.1);
  assert.ok(Math.abs(point.longitude - -115.87) < 0.1);
});

test("handles leap years in the solar-position approximation", () => {
  const beforeLeapDay = subsolarPoint(new Date("2024-02-28T12:00:00Z"));
  const afterLeapDay = subsolarPoint(new Date("2024-03-01T12:00:00Z"));
  assert.ok(afterLeapDay.latitude > beforeLeapDay.latitude);
  assert.ok(afterLeapDay.latitude - beforeLeapDay.latitude < 1);
});

test("returns finite MapLibre light angles at equinox noon", () => {
  const position = solarLightPosition(new Date("2026-03-20T12:00:00Z"));
  assert.ok(position.every(Number.isFinite));
});
