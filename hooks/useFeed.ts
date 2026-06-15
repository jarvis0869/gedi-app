import { useCallback, useState } from 'react';
import { buildFeed, FeedCard } from '@/lib/feedMixer';

export function useFeed() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = await buildFeed();
      setCards(feed);
    } catch (e: any) {
      setError(e?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { cards, loading, error, load, setCards };
}
