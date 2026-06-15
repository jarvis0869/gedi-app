const KEY = process.env.EXPO_PUBLIC_SERPAPI_KEY!;
const CACHE_TTL = 15 * 60 * 1000;

let cache: { data: EventCard[]; ts: number } | null = null;

export interface EventCard {
  id: string;
  type: 'event';
  source: 'serpapi';
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  thumbnail: string;
  ticket_info?: string;
  url?: string;
}

export async function fetchSerpEvents(): Promise<EventCard[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  if (!KEY) return [];

  const query = encodeURIComponent('events in Hauz Khas Village Delhi this week');
  const url = `https://serpapi.com/search.json?engine=google_events&q=${query}&hl=en&gl=in&api_key=${KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const json = await res.json();

  if (json.error) throw new Error(`SerpAPI: ${json.error}`);

  const raw: any[] = json.events_results ?? [];
  const events: EventCard[] = raw
    .filter((e) => e.title)
    .map((e, i) => {
      const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      return {
        id: `serp-${i}-${slug}`,
        type: 'event' as const,
        source: 'serpapi' as const,
        title: e.title,
        date: e.date?.start_date ?? '',
        time: e.date?.when ?? '',
        venue: e.venue?.name ?? e.address?.[0] ?? 'Hauz Khas Village',
        description: e.description ?? '',
        thumbnail: e.thumbnail ?? '',
        ticket_info: e.ticket_info?.[0]?.source ?? '',
        url: e.link ?? '',
      };
    });

  cache = { data: events, ts: Date.now() };
  return events;
}

export function invalidateSerpCache() {
  cache = null;
}
