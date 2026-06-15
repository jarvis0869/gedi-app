import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { session, loading, isOnboarded } = useAuth();
  const [onboardChecked, setOnboardChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    if (!session?.user) { setOnboardChecked(true); return; }
    isOnboarded(session.user.id).then((v) => {
      setOnboarded(v);
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
  return <Redirect href="/(tabs)" />;
}
