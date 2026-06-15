import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Fonts, Radius } from '@/constants/theme';

export default function LocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    await Location.requestForegroundPermissionsAsync();
    setLoading(false);
    router.replace('/auth/privacy');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📍</Text>
      <Text style={styles.title}>LOCATION</Text>
      <Text style={styles.subtitle}>Gedi needs your location to</Text>

      <View style={styles.points}>
        {[
          'Show places near you in Hauz Khas Village',
          'Verify you\'re actually at a spot when you check in',
          'Calculate distance to nearby places',
        ].map((point, i) => (
          <View key={i} style={styles.point}>
            <Text style={styles.bullet}>→</Text>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.privacy}>
        Your exact location is never stored. It's only used in the moment.
      </Text>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleAllow}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Requesting…' : 'Allow Location'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/privacy')} style={styles.skip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 28,
    justifyContent: 'center',
  },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 20 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 48,
    color: Colors.primary,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  points: { gap: 14, marginBottom: 28 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bullet: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.primary, marginTop: 2 },
  pointText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted, flex: 1, lineHeight: 22 },
  privacy: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white },
  skip: { alignItems: 'center' },
  skipText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
});
