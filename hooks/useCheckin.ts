import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export const CHECKIN_RADIUS_METERS = 500;
const POINTS_PER_CHECKIN = 10;

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export type CheckinResult = 'success' | 'too_far' | 'already' | 'no_permission' | null;

export function useCheckin(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckinResult>(null);
  const [distanceToPlace, setDistanceToPlace] = useState<number | null>(null);

  const checkin = async (placeId: string, placeName: string, placeLat: number, placeLng: number) => {
    if (!userId) return;
    setLoading(true);
    setResult(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setResult('no_permission');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const dist = distanceMeters(loc.coords.latitude, loc.coords.longitude, placeLat, placeLng);
      setDistanceToPlace(dist);

      if (dist > CHECKIN_RADIUS_METERS) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setResult('too_far');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .gte('checked_in_at', `${today}T00:00:00`)
        .maybeSingle();

      if (existing) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setResult('already');
        return;
      }

      await supabase.from('checkins').insert({
        user_id: userId,
        place_id: placeId,
        place_name: placeName,
        points_earned: POINTS_PER_CHECKIN,
      });

      const { data: userData } = await supabase
        .from('users')
        .select('points, checkins_count')
        .eq('id', userId)
        .single();

      await supabase.from('users').update({
        points: (userData?.points || 0) + POINTS_PER_CHECKIN,
        checkins_count: (userData?.checkins_count || 0) + 1,
      }).eq('id', userId);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult('success');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    checkin,
    loading,
    result,
    distanceToPlace,
    clearResult: () => setResult(null),
  };
}
