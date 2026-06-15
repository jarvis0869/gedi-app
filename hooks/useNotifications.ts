import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SESSION_COUNT_KEY = '@gedi_session_count';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useNotifications(userId: string | undefined) {
  const notificationListener = useRef<any>();

  useEffect(() => {
    if (!userId) return;
    registerIfEligible(userId);

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, [userId]);
}

async function registerIfEligible(userId: string) {
  const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
  const count = parseInt(raw || '0', 10) + 1;
  await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));

  if (count < 3) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('users').update({ push_token: token }).eq('id', userId);
}
