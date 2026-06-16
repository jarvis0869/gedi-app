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

function mapSerpResults(raw: any[], qIdx: number): EventCard[] {
  return (raw ?? [])
    .filter((e: any) => e.title)
    .map((e: any, i: number) => {
      const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      return {
        id: `serp-${qIdx}-${i}-${slug}`,
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
}

async function serpFetch(query: string): Promise<any[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(
    `https://serpapi.com/search.json?engine=google_events&q=${q}&hl=en&gl=in&api_key=${KEY}`
  );
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`SerpAPI: ${json.error}`);
  return json.events_results ?? [];
}

export async function fetchSerpEvents(): Promise<EventCard[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  if (!KEY) return [];

  const [r1, r2] = await Promise.allSettled([
    serpFetch('events in Hauz Khas Village Delhi this week'),
    serpFetch('things to do Hauz Khas Village Delhi this weekend'),
  ]);

  if (r1.status === 'rejected' && r2.status === 'rejected') {
    throw new Error(`SerpAPI: ${(r1.reason as Error)?.message}`);
  }

  const events = [
    ...mapSerpResults(r1.status === 'fulfilled' ? r1.value : [], 1),
    ...mapSerpResults(r2.status === 'fulfilled' ? r2.value : [], 2),
  ];

  cache = { data: events, ts: Date.now() };
  return events;
}

export function invalidateSerpCache() {
  cache = null;
}
