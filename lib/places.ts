const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!;
const BASE = 'https://maps.googleapis.com/maps/api/place';

export const HKV = { lat: 28.5535, lng: 77.2018 };
const RADIUS = 1500;
const NEARBY_TTL = 5 * 60 * 1000;
const DETAIL_TTL = 10 * 60 * 1000;

let nearbyCache: { data: PlaceCard[]; ts: number } | null = null;
const detailCache = new Map<string, { data: PlaceDetail; ts: number }>();

export interface PlaceCard {
  id: string;
  type: 'place';
  name: string;
  place_id: string;
  photos: string[];
  rating: number;
  price_level: number;
  categories: string[];
  vicinity: string;
  opening_hours?: { open_now: boolean };
  lat: number;
  lng: number;
}

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

export interface PlaceDetail extends PlaceCard {
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  hours_text?: string[];
  reviews: Review[];
}

async function gFetch(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${json.status} — ${json.error_message || ''}`);
  }
  return json;
}

function photoUrl(ref: string, maxWidth = 800): string {
  return `${BASE}/photo?maxwidth=${maxWidth}&photoreference=${ref}&key=${KEY}`;
}

function mapPlace(p: any): PlaceCard {
  return {
    id: p.place_id,
    type: 'place',
    name: p.name,
    place_id: p.place_id,
    photos: (p.photos ?? []).slice(0, 8).map((ph: any) => photoUrl(ph.photo_reference)),
    rating: p.rating ?? 0,
    price_level: p.price_level ?? 0,
    categories: p.types ?? [],
    vicinity: p.vicinity ?? '',
    opening_hours: p.opening_hours ? { open_now: !!p.opening_hours.open_now } : undefined,
    lat: p.geometry?.location?.lat ?? HKV.lat,
    lng: p.geometry?.location?.lng ?? HKV.lng,
  };
}

export async function fetchNearbyPlaces(): Promise<PlaceCard[]> {
  if (nearbyCache && Date.now() - nearbyCache.ts < NEARBY_TTL) {
    return nearbyCache.data;
  }

  const types = ['restaurant', 'bar', 'cafe'];
  const results = await Promise.all(
    types.map((type) =>
      gFetch(
        `${BASE}/nearbysearch/json?location=${HKV.lat},${HKV.lng}&radius=${RADIUS}&type=${type}&key=${KEY}`
      ).then((j) => j.results ?? []).catch(() => [])
    )
  );

  // Merge and deduplicate by place_id
  const seen = new Set<string>();
  const merged: PlaceCard[] = [];
  for (const batch of results) {
    for (const p of batch) {
      if (!seen.has(p.place_id)) {
        seen.add(p.place_id);
        merged.push(mapPlace(p));
      }
    }
  }

  // Sort by rating desc, then by distance
  merged.sort((a, b) => {
    const rDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (Math.abs(rDiff) > 0.3) return rDiff;
    const dA = Math.hypot(a.lat - HKV.lat, a.lng - HKV.lng);
    const dB = Math.hypot(b.lat - HKV.lat, b.lng - HKV.lng);
    return dA - dB;
  });

  nearbyCache = { data: merged, ts: Date.now() };
  return merged;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetail> {
  const hit = detailCache.get(placeId);
  if (hit && Date.now() - hit.ts < DETAIL_TTL) return hit.data;

  const fields = [
    'place_id', 'name', 'rating', 'price_level',
    'formatted_address', 'formatted_phone_number', 'website',
    'opening_hours', 'photos', 'reviews', 'geometry', 'types', 'vicinity',
  ].join(',');

  const json = await gFetch(`${BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${KEY}`);
  const r = json.result;

  const detail: PlaceDetail = {
    ...mapPlace({ ...r, place_id: placeId }),
    formatted_address: r.formatted_address ?? '',
    formatted_phone_number: r.formatted_phone_number,
    website: r.website,
    hours_text: r.opening_hours?.weekday_text,
    reviews: (r.reviews ?? []).slice(0, 5).map((rv: any) => ({
      author_name: rv.author_name,
      rating: rv.rating,
      text: rv.text,
      relative_time_description: rv.relative_time_description,
    })),
    // override photos with full detail photo refs
    photos: (r.photos ?? []).slice(0, 10).map((ph: any) => photoUrl(ph.photo_reference, 1200)),
  };

  detailCache.set(placeId, { data: detail, ts: Date.now() });
  return detail;
}

export function getPhotoUrl(ref: string, maxWidth = 800) {
  return photoUrl(ref, maxWidth);
}

export function invalidateNearbyCache() {
  nearbyCache = null;
}
