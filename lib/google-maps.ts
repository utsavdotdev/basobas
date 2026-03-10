const GOOGLE_MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.google.com",
  "google.com",
  "maps.google.com",
]);

const COORDINATE_PRECISION = 6;

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const parseCoordinatePair = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parts = value.split(",").map((segment) => Number(segment.trim()));
  if (parts.length < 2) {
    return null;
  }

  const [latitude, longitude] = parts;
  return isValidCoordinate(latitude, longitude) ? { latitude, longitude } : null;
};

export const normalizeGoogleMapsUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const isKnownGoogleMapsHost =
      GOOGLE_MAPS_HOSTS.has(host) ||
      host.endsWith(".google.com") ||
      host.endsWith(".app.goo.gl");

    if (!isKnownGoogleMapsHost) {
      return null;
    }

    if (
      (host === "google.com" || host.endsWith(".google.com")) &&
      !url.pathname.toLowerCase().includes("/maps") &&
      !url.searchParams.has("q") &&
      !url.searchParams.has("place_id")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

export const buildGoogleMapsUrlFromCoordinates = (
  latitude: number,
  longitude: number,
) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  const normalizedLatitude = latitude.toFixed(COORDINATE_PRECISION);
  const normalizedLongitude = longitude.toFixed(COORDINATE_PRECISION);

  return `https://www.google.com/maps/search/?api=1&query=${normalizedLatitude},${normalizedLongitude}`;
};

export const extractCoordinatesFromGoogleMapsUrl = (value: string) => {
  const normalizedUrl = normalizeGoogleMapsUrl(value);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const url = new URL(normalizedUrl);
    const queryCoordinates =
      parseCoordinatePair(url.searchParams.get("query")) ??
      parseCoordinatePair(url.searchParams.get("q"));

    if (queryCoordinates) {
      return queryCoordinates;
    }

    const pathCoordinates = url.pathname.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    );

    if (!pathCoordinates) {
      return null;
    }

    const latitude = Number(pathCoordinates[1]);
    const longitude = Number(pathCoordinates[2]);
    return isValidCoordinate(latitude, longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
};

export const buildGoogleMapsEmbedUrl = (
  latitude: number,
  longitude: number,
) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  const normalizedLatitude = latitude.toFixed(COORDINATE_PRECISION);
  const normalizedLongitude = longitude.toFixed(COORDINATE_PRECISION);

  return `https://www.google.com/maps?q=${normalizedLatitude},${normalizedLongitude}&z=17&output=embed`;
};
