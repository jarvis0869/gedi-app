const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN;
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
  logo: string;
  url: string;
  is_free: boolean;
  ticket_price?: string;
}

export async function fetchEventbriteEvents(): Promise<EventbriteCard[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=Hauz+Khas+Village+Delhi&location.within=2km&expand=venue,ticket_availability&token=${EVENTBRITE_TOKEN}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` },
  });
  const json = await res.json();

  const rawEvents = json.events || [];
  const events: EventbriteCard[] = rawEvents.map((e: any) => ({
    id: `eb-${e.id}`,
    type: 'event' as const,
    source: 'eventbrite' as const,
    title: e.name?.text || '',
    description: e.description?.text || '',
    start: e.start?.local || '',
    end: e.end?.local || '',
    venue: e.venue?.name || e.venue?.address?.localized_address_display || 'Hauz Khas Village',
    logo: e.logo?.url || '',
    url: e.url || '',
    is_free: e.is_free || false,
    ticket_price: e.ticket_availability?.minimum_ticket_price?.display,
  }));

  cache = { data: events, ts: Date.now() };
  return events;
}
