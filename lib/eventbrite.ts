const TOKEN = process.env.EXPO_PUBLIC_EVENTBRITE_TOKEN!;
const CACHE_TTL = 15 * 60 * 1000;

let cache: { data: EventbriteCard[]; ts: number } | null = null;

export interface EventbriteCard {
  id: string;
  type: 'event';
  source: 'eventbrite';
  title: string;
  description: string;
  start: string;
  end: string;
  venue: string;
  venue_address?: string;
  logo: string;
  url: string;
  is_free: boolean;
  ticket_price?: string;
}

function mapEvent(e: any): EventbriteCard {
  return {
    id: `eb-${e.id}`,
    type: 'event' as const,
    source: 'eventbrite' as const,
    title: e.name.text,
    description: e.description?.text ?? '',
    start: e.start?.local ?? '',
    end: e.end?.local ?? '',
    venue: e.venue?.name ?? 'Hauz Khas Village',
    venue_address: e.venue?.address?.localized_address_display,
    logo: e.logo?.url ?? e.logo?.original?.url ?? '',
    url: e.url ?? '',
    is_free: !!e.is_free,
    ticket_price: e.ticket_availability?.minimum_ticket_price?.display,
  };
}

async function ebFetch(url: string, headers: HeadersInit): Promise<any[]> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Eventbrite HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Eventbrite: ${json.error_description ?? json.error}`);
  return json.events ?? [];
}

export async function fetchEventbriteEvents(): Promise<EventbriteCard[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  if (!TOKEN) return [];

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  const EXPAND = 'venue,ticket_availability,logo';

  // HKV geo search — 5 km radius, 50 results
  const hkvUrl = [
    'https://www.eventbriteapi.com/v3/events/search/',
    '?location.latitude=28.5535',
    '&location.longitude=77.2018',
    '&location.within=5km',
    '&page_size=50',
    `&expand=${EXPAND}`,
    '&status=live',
    '&sort_by=date',
  ].join('');

  // Delhi nightlife keyword search — 20 km radius, 50 results
  const nightlifeUrl = [
    'https://www.eventbriteapi.com/v3/events/search/',
    '?location.latitude=28.6139',
    '&location.longitude=77.2090',
    '&location.within=20km',
    '&q=nightlife',
    '&page_size=50',
    `&expand=${EXPAND}`,
    '&status=live',
    '&sort_by=date',
  ].join('');

  const [r1, r2] = await Promise.allSettled([
    ebFetch(hkvUrl, headers),
    ebFetch(nightlifeUrl, headers),
  ]);

  if (r1.status === 'rejected' && r2.status === 'rejected') {
    throw new Error(`Eventbrite: ${(r1.reason as Error)?.message}`);
  }

  const raw1: any[] = r1.status === 'fulfilled' ? r1.value : [];
  const raw2: any[] = r2.status === 'fulfilled' ? r2.value : [];

  // Dedupe by raw Eventbrite event ID before mapping
  const seenIds = new Set<string>();
  const merged: any[] = [];
  for (const e of [...raw1, ...raw2]) {
    if (e.name?.text && !seenIds.has(e.id)) {
      seenIds.add(e.id);
      merged.push(e);
    }
  }

  const events = merged.map(mapEvent);
  cache = { data: events, ts: Date.now() };
  return events;
}

export function invalidateEventbriteCache() {
  cache = null;
}
