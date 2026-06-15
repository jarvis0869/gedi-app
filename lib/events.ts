const SERPAPI_KEY = process.env.SERPAPI_KEY;
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

  const query = encodeURIComponent('events in Hauz Khas Village Delhi this week');
  const url = `https://serpapi.com/search.json?engine=google_events&q=${query}&api_key=${SERPAPI_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  const rawEvents = json.events_results || [];
  const events: EventCard[] = rawEvents.map((e: any, i: number) => ({
    id: `serp-${i}-${e.title?.replace(/\s+/g, '-').toLowerCase()}`,
    type: 'event' as const,
    source: 'serpapi' as const,
    title: e.title || '',
    date: e.date?.start_date || '',
    time: e.date?.when || '',
    venue: e.venue?.name || e.address?.[0] || 'Hauz Khas Village',
    description: e.description || '',
    thumbnail: e.thumbnail || '',
    ticket_info: e.ticket_info?.[0]?.source || '',
    url: e.link || '',
  }));

  cache = { data: events, ts: Date.now() };
  return events;
}
