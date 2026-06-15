import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GlowBackground } from '@/components/GlowBackground';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const REASONS = [
  { icon: '🏙️', text: 'Show places near you in Hauz Khas Village' },
  { icon: '📍', text: 'Verify you\'re actually at a spot when you check in (+10 pts)' },
  { icon: '📏', text: 'Show how far each place is from you' },
];

export default function LocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLoading(false);
    if (status !== 'granted') setDenied(true);
    router.replace('/auth/privacy');
  };

  const handleSkip = () => router.replace('/auth/privacy');

  return (
    <View style={styles.container}>
      <GlowBackground intensity="soft" yOffset={200} />

      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['rgba(255,107,0,0.25)', 'rgba(255,107,0,0.05)']}
            style={styles.iconBg}
          >
            <Text style={styles.icon}>📍</Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>LOCATION</Text>
        <Text style={styles.subtitle}>
          Gedi needs to know where you are
        </Text>

        <GlassCard style={styles.reasons}>
          {REASONS.map((r, i) => (
            <View key={i} style={[styles.reason, i < REASONS.length - 1 && styles.reasonBorder]}>
              <Text style={styles.reasonIcon}>{r.icon}</Text>
              <Text style={styles.reasonText}>{r.text}</Text>
            </View>
          ))}
        </GlassCard>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your exact location is never stored in our database. Used only in the moment.
          </Text>
        </View>

        {denied && (
          <Text style={styles.deniedText}>
            Location denied. You can enable it in Settings later.
          </Text>
        )}

        <PrimaryButton
          label={loading ? 'Requesting…' : 'Allow Location Access'}
          onPress={handleAllow}
          loading={loading}
          style={styles.btn}
        />

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.screenPad + 8,
    justifyContent: 'center',
  },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
  },
  icon: { fontSize: 40 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 52,
    color: Colors.primary,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 28,
  },
  reasons: { marginBottom: 20 },
  reason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 14,
  },
  reasonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  reasonIcon: { fontSize: 22, marginTop: 1 },
  reasonText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    flex: 1,
    lineHeight: 21,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  privacyIcon: { fontSize: 14, marginTop: 1 },
  privacyText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
    flex: 1,
    lineHeight: 18,
  },
  deniedText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: { marginBottom: 14 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
});
