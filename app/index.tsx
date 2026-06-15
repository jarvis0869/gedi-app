import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { consumePendingLink, parseDeepLink } from '@/lib/deeplink';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { session, loading, isOnboarded } = useAuth();
  const [onboardChecked, setOnboardChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) { setOnboardChecked(true); return; }
    Promise.all([
      isOnboarded(session.user.id),
      consumePendingLink(),
    ]).then(([ob, pendingUrl]) => {
      setOnboarded(ob);
      if (pendingUrl) {
        const route = parseDeepLink(pendingUrl);
        if (route) setPendingRoute(route);
      }
      setOnboardChecked(true);
    });
  }, [session]);

  if (loading || !onboardChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth/phone" />;
  if (!onboarded) return <Redirect href="/auth/location" />;
  if (pendingRoute) return <Redirect href={pendingRoute as any} />;
  return <Redirect href="/(tabs)" />;
}
