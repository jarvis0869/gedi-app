const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const HKV_LAT = 28.5535;
const HKV_LNG = 77.2018;
const RADIUS = 1500;
const NEARBY_CACHE_TTL = 5 * 60 * 1000;
const DETAIL_CACHE_TTL = 10 * 60 * 1000;

let nearbyCache: { data: PlaceCard[]; ts: number } | null = null;
const detailCache = new Map<string, { data: any; ts: number }>();

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
  opening_hours?: { open_now: boolean; weekday_text?: string[] };
  reviews?: { author_name: string; rating: number; text: string }[];
  lat: number;
  lng: number;
}

export async function fetchNearbyPlaces(): Promise<PlaceCard[]> {
  if (nearbyCache && Date.now() - nearbyCache.ts < NEARBY_CACHE_TTL) return nearbyCache.data;

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${HKV_LAT},${HKV_LNG}&radius=${RADIUS}&type=restaurant|bar|cafe&key=${GOOGLE_PLACES_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${json.status}`);
  }

  const results = json.results || [];
  const places: PlaceCard[] = results.map((p: any) => ({
    id: p.place_id,
    type: 'place' as const,
    name: p.name,
    place_id: p.place_id,
    photos: (p.photos || []).slice(0, 6).map(
      (ph: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_PLACES_KEY}`
    ),
    rating: p.rating || 0,
    price_level: p.price_level || 0,
    categories: p.types || [],
    vicinity: p.vicinity || '',
    opening_hours: p.opening_hours,
    lat: p.geometry?.location?.lat || HKV_LAT,
    lng: p.geometry?.location?.lng || HKV_LNG,
  }));

  nearbyCache = { data: places, ts: Date.now() };
  return places;
}

export async function fetchPlaceDetails(placeId: string) {
  const cached = detailCache.get(placeId);
  if (cached && Date.now() - cached.ts < DETAIL_CACHE_TTL) return cached.data;

  const fields = 'name,rating,price_level,formatted_address,opening_hours,photos,reviews,geometry,types,formatted_phone_number,website';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') throw new Error(`Place details error: ${json.status}`);

  detailCache.set(placeId, { data: json.result, ts: Date.now() });
  return json.result;
}

export function getPhotoUrl(photoRef: string, maxWidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_PLACES_KEY}`;
}
