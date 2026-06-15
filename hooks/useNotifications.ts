import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SESSION_COUNT_KEY = '@gedi_session_count';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications(userId: string | undefined) {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!userId) return;
    registerIfEligible(userId);

    // Notification tapped while app was foregrounded or backgrounded
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      routeFromNotif(data, router);
    });

    // Notification tap that cold-launched the app
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      routeFromNotif(data, router);
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [userId]);
}

function routeFromNotif(data: Record<string, unknown>, router: ReturnType<typeof useRouter>) {
  const placeId = data?.place_id as string | undefined;
  const eventId = data?.event_id as string | undefined;
  const screen = data?.screen as string | undefined;

  if (placeId) {
    router.push(`/place/${placeId}`);
  } else if (eventId) {
    router.push(`/event/${eventId}`);
  } else if (screen === 'saved') {
    router.push('/(tabs)/saved');
  } else {
    router.push('/(tabs)');
  }
}

async function registerIfEligible(userId: string) {
  const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
  const count = parseInt(raw || '0', 10) + 1;
  await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));

  if (count < 3) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Gedi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  if (!tokenData?.data) return;
  await supabase.from('users').update({ push_token: tokenData.data }).eq('id', userId);
}
