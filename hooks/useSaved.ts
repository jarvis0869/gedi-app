import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FeedCard } from '@/lib/feedMixer';
import { track } from '@/lib/analytics';

export interface SavedItem {
  id: string;
  place_id: string;
  place_type: 'place' | 'event';
  place_data: FeedCard;
  saved_at: string;
}

async function syncSavesCount(userId: string) {
  const { count } = await supabase
    .from('saves')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  await supabase
    .from('users')
    .update({ saves_count: count ?? 0 })
    .eq('id', userId);
}

export function useSaved(userId: string | undefined) {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('saves')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    setSaved(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const save = async (card: FeedCard) => {
    if (!userId) return;
    const placeId = card.type === 'place' ? (card as any).place_id : card.id;
    await supabase.from('saves').upsert({
      user_id: userId,
      place_id: placeId,
      place_type: card.type,
      place_data: card,
    });
    await syncSavesCount(userId);
    track('save', { card_type: card.type, place_id: placeId });
    await load();
  };

  const unsave = async (placeId: string) => {
    if (!userId) return;
    await supabase.from('saves').delete().eq('user_id', userId).eq('place_id', placeId);
    await syncSavesCount(userId);
    track('unsave', { place_id: placeId });
    await load();
  };

  const isSaved = (placeId: string) => saved.some((s) => s.place_id === placeId);

  return { saved, loading, save, unsave, isSaved, reload: load };
}
