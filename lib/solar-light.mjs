const millisecondsPerDay = 86_400_000;
const degreesPerRadian = 180 / Math.PI;
const radiansPerDegree = Math.PI / 180;

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

/**
 * Approximate the point on Earth where the Sun is directly overhead.
 * The equation-of-time and declination coefficients follow NOAA's
 * fractional-year solar-position approximation.
 */
export function subsolarPoint(date = new Date()) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const currentDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = (currentDay - startOfYear) / millisecondsPerDay;
  const daysInYear = isLeapYear(date.getUTCFullYear()) ? 366 : 365;
  const fractionalYear = (2 * Math.PI / daysInYear) * (dayOfYear - 1 + (utcHour - 12) / 24);
  const equationOfTime = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(fractionalYear)
    - 0.032077 * Math.sin(fractionalYear)
    - 0.014615 * Math.cos(2 * fractionalYear)
    - 0.040849 * Math.sin(2 * fractionalYear)
  );
  const declination = 0.006918
    - 0.399912 * Math.cos(fractionalYear)
    + 0.070257 * Math.sin(fractionalYear)
    - 0.006758 * Math.cos(2 * fractionalYear)
    + 0.000907 * Math.sin(2 * fractionalYear)
    - 0.002697 * Math.cos(3 * fractionalYear)
    + 0.00148 * Math.sin(3 * fractionalYear);

  return {
    longitude: ((180 - (utcHour * 60 + equationOfTime) / 4 + 540) % 360) - 180,
    latitude: declination * degreesPerRadian,
  };
}

/**
 * Convert a geographic sun direction into MapLibre's light-position angles.
 * MapLibre's globe renderer negates its spherical light vector before applying
 * the globe camera transform, so geographic longitude/latitude cannot be used
 * directly as its azimuthal and polar angles.
 */
export function geographicPointToMapLibreLightPosition(point, radius = 1.5) {
  const longitude = point.longitude * radiansPerDegree;
  const latitude = point.latitude * radiansPerDegree;
  const cosLatitude = Math.cos(latitude);
  const earthVector = {
    x: Math.sin(longitude) * cosLatitude,
    y: Math.sin(latitude),
    z: Math.cos(longitude) * cosLatitude,
  };
  const azimuthal = normalizeDegrees(Math.atan2(earthVector.x, -earthVector.y) * degreesPerRadian);
  const polar = Math.acos(Math.max(-1, Math.min(1, -earthVector.z))) * degreesPerRadian;

  return [radius, azimuthal, polar];
}

export function solarLightPosition(date = new Date(), radius = 1.5) {
  return geographicPointToMapLibreLightPosition(subsolarPoint(date), radius);
}
