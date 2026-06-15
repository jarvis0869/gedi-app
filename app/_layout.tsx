import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useAuth } from '@/hooks/useAuth';
import { parseDeepLink, storePendingLink } from '@/lib/deeplink';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    Inter: Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Listen for incoming deep links while the app is already running (foreground/background)
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const route = parseDeepLink(url);
      if (!route) return;
      if (session) {
        router.push(route as any);
      } else {
        // Store for post-auth redirect
        storePendingLink(url);
      }
    });
    return () => sub.remove();
  }, [session]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/phone" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/otp" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/location" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="place/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
