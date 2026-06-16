import { fetchNearbyPlaces, PlaceCard } from './places';
import { fetchSerpEvents, EventCard } from './events';
import { fetchEventbriteEvents, EventbriteCard } from './eventbrite';

export type FeedCard = PlaceCard | EventCard | EventbriteCard;

// Jaccard similarity on word sets
function jaccardSimilarity(a: string, b: string): number {
  const words = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const wA = words(a);
  const wB = words(b);
  let intersection = 0;
  for (const w of wA) if (wB.has(w)) intersection++;
  const union = wA.size + wB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

// Deduplicate events by title similarity — Jaccard >= 0.7 treated as same event
function dedupeEvents(cards: (EventCard | EventbriteCard)[]): (EventCard | EventbriteCard)[] {
  const result: (EventCard | EventbriteCard)[] = [];
  for (const card of cards) {
    const isDup = result.some(
      (existing) => jaccardSimilarity(existing.title, card.title) >= 0.7
    );
    if (!isDup) result.push(card);
  }
  return result;
}

function parseEventDate(c: EventCard | EventbriteCard): number {
  const raw = c.source === 'eventbrite'
    ? (c as EventbriteCard).start
    : (c as EventCard).date;
  if (!raw) return Infinity;
  const ms = Date.parse(raw);
  return isNaN(ms) ? Infinity : ms;
}

// 3 places : 2 events pattern = 60% places, 40% events
function interleave(places: PlaceCard[], events: (EventCard | EventbriteCard)[]): FeedCard[] {
  const result: FeedCard[] = [];
  let pi = 0;
  let ei = 0;

  while (pi < places.length || ei < events.length) {
    for (let i = 0; i < 3 && pi < places.length; i++) result.push(places[pi++]);
    for (let i = 0; i < 2 && ei < events.length; i++) result.push(events[ei++]);
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

  // Prefer Eventbrite (richer data), then SerpAPI; dedupe by title similarity
  const allEvents = dedupeEvents([...ebEvents, ...serpEvents]);

  // Sort events soonest first, allow events up to 3 h past start
  const now = Date.now();
  const upcomingEvents = allEvents
    .filter((e) => parseEventDate(e) >= now - 3 * 60 * 60 * 1000)
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
