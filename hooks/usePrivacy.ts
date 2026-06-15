import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export type PrivacyMode = 'ghost' | 'friends' | 'public';

interface PrivacyState {
  mode: PrivacyMode;
  isGhost: boolean;
  isFriends: boolean;
  isPublic: boolean;
  loading: boolean;
  setMode: (mode: PrivacyMode) => Promise<void>;
}

const DEFAULT: PrivacyState = {
  mode: 'public',
  isGhost: false,
  isFriends: false,
  isPublic: true,
  loading: true,
  setMode: async () => {},
};

export function usePrivacy(userId: string | undefined): PrivacyState {
  const [mode, setModeState] = useState<PrivacyMode>('public');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('users')
      .select('privacy_mode')
      .eq('id', userId)
      .single();
    if (data?.privacy_mode) setModeState(data.privacy_mode as PrivacyMode);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Re-read when the screen gains focus (e.g. after profile change)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setMode = async (next: PrivacyMode) => {
    if (!userId) return;
    setModeState(next);
    await supabase.from('users').update({ privacy_mode: next }).eq('id', userId);
  };

  return {
    mode,
    isGhost: mode === 'ghost',
    isFriends: mode === 'friends',
    isPublic: mode === 'public',
    loading,
    setMode,
  };
}
