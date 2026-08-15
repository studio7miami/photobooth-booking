import { matchKnownVenues } from "@/config/venues";

export type PlaceSuggestion = { description: string };

const cache = new Map<string, { at: number; results: PlaceSuggestion[] }>();
const TTL_MS = 5 * 60 * 1000;

const PHOTON_URL = "https://photon.komoot.io/api/";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Studio7Miami-PhotoboothBooking/1.0 (https://studio7.miami)";

/** Florida bounding box: minLon, minLat, maxLon, maxLat */
const FL_BBOX = "-87.634896,24.396308,-79.974307,31.001056";
const MIAMI = { lat: "25.7617", lon: "-80.1918" };

const inFlorida = (address?: string) =>
  Boolean(address && /,\s*(FL|Florida)\b/i.test(address));

function readCache(key: string) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.results;
}

function writeCache(key: string, results: PlaceSuggestion[]) {
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), results });
}

type PhotonProps = {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  district?: string;
  locality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
};

function formatPhoton(props: PhotonProps): string {
  const street = [props.housenumber, props.street].filter(Boolean).join(" ");
  const city = props.city || props.locality || props.district;
  const state = props.state === "Florida" ? "FL" : props.state;
  const parts = [props.name && props.name !== street ? props.name : "", street, city, state, props.postcode]
    .map((part) => part?.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.includes(part)) unique.push(part);
  }
  if (unique.length >= 2) {
    const [first, ...rest] = unique;
    return `${first} — ${rest.join(", ")}`;
  }
  return unique.join(", ");
}

async function photonSearch(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lat: MIAMI.lat,
    lon: MIAMI.lon,
    bbox: FL_BBOX,
    limit: "8",
    lang: "en",
  });
  const res = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`Photon search failed [${res.status}]: ${await res.text()}`);
    return [];
  }
  const json = (await res.json()) as { features?: Array<{ properties?: PhotonProps }> };
  return (json.features ?? [])
    .map((f) => formatPhoton(f.properties ?? {}))
    .filter((description) => description && inFlorida(description))
    .filter((description, i, all) => all.indexOf(description) === i)
    .slice(0, 5)
    .map((description) => ({ description }));
}

export async function lookupPlaces(query: string): Promise<PlaceSuggestion[]> {
  const key = query.toLowerCase();
  const cached = readCache(key);
  if (cached) return cached;

  const known = matchKnownVenues(query).map((description) => ({ description }));

  try {
    const remote = await photonSearch(query);
    const seen = new Set(known.map((item) => item.description.toLowerCase()));
    const merged = [...known];
    for (const item of remote) {
      if (seen.has(item.description.toLowerCase())) continue;
      seen.add(item.description.toLowerCase());
      merged.push(item);
    }
    const results = merged.slice(0, 5);
    writeCache(key, results);
    return results;
  } catch (error) {
    console.error("Places search failed", error);
    return known;
  }
}

export async function lookupRegion(query: string): Promise<PlaceSuggestion[]> {
  const key = `region:${query.toLowerCase()}`;
  const cached = readCache(key);
  if (cached) return cached;

  const isZip = /^\d{5}(-\d{4})?$/.test(query.trim());
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "us",
    limit: "5",
  });
  if (isZip) {
    params.set("postalcode", query.trim().slice(0, 5));
    params.set("state", "Florida");
  } else {
    params.set("q", `${query.trim()}, Florida, USA`);
  }

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`Geocode fallback failed [${res.status}]: ${await res.text()}`);
    return [];
  }

  const json = (await res.json()) as Array<{ display_name?: string }>;
  const results = (Array.isArray(json) ? json : [])
    .map((r) => ({ description: r.display_name ?? "" }))
    .filter((r) => r.description && inFlorida(r.description))
    .slice(0, 5);

  writeCache(key, results);
  return results;
}
