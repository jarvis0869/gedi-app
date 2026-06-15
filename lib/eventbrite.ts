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

export async function fetchEventbriteEvents(): Promise<EventbriteCard[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  if (!TOKEN) return [];

  // Search by lat/lng near HKV
  const url = [
    'https://www.eventbriteapi.com/v3/events/search/',
    '?location.latitude=28.5535',
    '&location.longitude=77.2018',
    '&location.within=5km',
    '&expand=venue,ticket_availability,logo',
    '&status=live',
    '&sort_by=date',
  ].join('');

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Eventbrite HTTP ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(`Eventbrite: ${json.error_description ?? json.error}`);

  const raw: any[] = json.events ?? [];
  const events: EventbriteCard[] = raw
    .filter((e) => e.name?.text)
    .map((e) => ({
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
    }));

  cache = { data: events, ts: Date.now() };
  return events;
}

export function invalidateEventbriteCache() {
  cache = null;
}
