import { fetchNearbyPlaces, PlaceCard } from './places';
import { fetchSerpEvents, EventCard } from './events';
import { fetchEventbriteEvents, EventbriteCard } from './eventbrite';

export type FeedCard = PlaceCard | EventCard | EventbriteCard;

// Deduplicate events by normalised title
function dedupeEvents(cards: (EventCard | EventbriteCard)[]): (EventCard | EventbriteCard)[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseEventDate(c: EventCard | EventbriteCard): number {
  const raw = c.source === 'eventbrite'
    ? (c as EventbriteCard).start
    : (c as EventCard).date;
  if (!raw) return Infinity;
  const ms = Date.parse(raw);
  return isNaN(ms) ? Infinity : ms;
}

// Interleave: no more than 2 places in a row before an event
function interleave(places: PlaceCard[], events: (EventCard | EventbriteCard)[]): FeedCard[] {
  const result: FeedCard[] = [];
  let pi = 0;
  let ei = 0;
  let run = 0;

  while (pi < places.length || ei < events.length) {
    if (run >= 2 && ei < events.length) {
      result.push(events[ei++]);
      run = 0;
    } else if (pi < places.length) {
      result.push(places[pi++]);
      run++;
    } else {
      result.push(events[ei++]);
      run = 0;
    }
  }

  return result;
}

export interface FeedResult {
  cards: FeedCard[];
  errors: { source: string; message: string }[];
}

export async function buildFeed(): Promise<FeedResult> {
  const [placesResult, serpResult, ebResult] = await Promise.allSettled([
    fetchNearbyPlaces(),
    fetchSerpEvents(),
    fetchEventbriteEvents(),
  ]);

  const errors: { source: string; message: string }[] = [];

  const places = placesResult.status === 'fulfilled'
    ? placesResult.value
    : (errors.push({ source: 'Google Places', message: (placesResult.reason as Error)?.message }), []);

  const serpEvents = serpResult.status === 'fulfilled'
    ? serpResult.value
    : (errors.push({ source: 'SerpAPI', message: (serpResult.reason as Error)?.message }), []);

  const ebEvents = ebResult.status === 'fulfilled'
    ? ebResult.value
    : (errors.push({ source: 'Eventbrite', message: (ebResult.reason as Error)?.message }), []);

  // Prefer Eventbrite events (richer data), then SerpAPI
  const allEvents = dedupeEvents([...ebEvents, ...serpEvents]);

  // Sort events by soonest first, filter out past events
  const now = Date.now();
  const upcomingEvents = allEvents
    .filter((e) => parseEventDate(e) >= now - 3 * 60 * 60 * 1000) // allow events up to 3h ago
    .sort((a, b) => parseEventDate(a) - parseEventDate(b));

  const cards = interleave(places, upcomingEvents);

  return { cards, errors };
}

export function invalidateAllCaches() {
  const { invalidateNearbyCache } = require('./places');
  const { invalidateSerpCache } = require('./events');
  const { invalidateEventbriteCache } = require('./eventbrite');
  invalidateNearbyCache();
  invalidateSerpCache();
  invalidateEventbriteCache();
}
