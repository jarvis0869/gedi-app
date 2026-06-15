import { FeedCard } from './feedMixer';

// Module-level event store — populated when feed loads, read by event/[id] detail screen
const store = new Map<string, FeedCard>();

export function cacheEvent(card: FeedCard) {
  store.set(card.id, card);
}

export function cacheFeed(cards: FeedCard[]) {
  for (const card of cards) store.set(card.id, card);
}

export function getCachedEvent(id: string): FeedCard | undefined {
  return store.get(id);
}
