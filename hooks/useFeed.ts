import { useCallback, useState } from 'react';
import { buildFeed, invalidateAllCaches, FeedCard } from '@/lib/feedMixer';
import { cacheFeed } from '@/lib/eventCache';

export function useFeed() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const load = useCallback(async (bust = false) => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    try {
      if (bust) {
        invalidateAllCaches();
      }
      const { cards: feed, errors } = await buildFeed();
      cacheFeed(feed);
      setCards(feed);
      if (errors.length > 0) {
        setWarnings(errors.map((e) => `${e.source}: ${e.message}`));
      }
      if (feed.length === 0 && errors.length > 0) {
        setError('Failed to load feed from all sources.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error loading feed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { cards, loading, error, warnings, load, setCards };
}
