import { fetchNearbyPlaces, PlaceCard } from './places';
import { fetchSerpEvents, EventCard } from './events';
import { fetchEventbriteEvents, EventbriteCard } from './eventbrite';

export type FeedCard = PlaceCard | EventCard | EventbriteCard;

function deduplicateByName(cards: (EventCard | EventbriteCard)[]): (EventCard | EventbriteCard)[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function interleave(places: PlaceCard[], events: (EventCard | EventbriteCard)[]): FeedCard[] {
  const result: FeedCard[] = [];
  let pi = 0;
  let ei = 0;
  let consecutivePlaces = 0;

  while (pi < places.length || ei < events.length) {
    if (consecutivePlaces >= 2 && ei < events.length) {
      result.push(events[ei++]);
      consecutivePlaces = 0;
    } else if (pi < places.length) {
      result.push(places[pi++]);
      consecutivePlaces++;
    } else {
      result.push(events[ei++]);
      consecutivePlaces = 0;
    }
  }
  return result;
}

export async function buildFeed(): Promise<FeedCard[]> {
  const [places, serpEvents, ebEvents] = await Promise.allSettled([
    fetchNearbyPlaces(),
    fetchSerpEvents(),
    fetchEventbriteEvents(),
  ]);

  const resolvedPlaces = places.status === 'fulfilled' ? places.value : [];
  const resolvedSerp = serpEvents.status === 'fulfilled' ? serpEvents.value : [];
  const resolvedEb = ebEvents.status === 'fulfilled' ? ebEvents.value : [];

  const allEvents = deduplicateByName([...resolvedSerp, ...resolvedEb]);

  allEvents.sort((a, b) => {
    const dateA = new Date(a.type === 'event' && a.source === 'eventbrite' ? (a as EventbriteCard).start : (a as EventCard).date).getTime();
    const dateB = new Date(b.type === 'event' && b.source === 'eventbrite' ? (b as EventbriteCard).start : (b as EventCard).date).getTime();
    return dateA - dateB;
  });

  return interleave(resolvedPlaces, allEvents);
}
