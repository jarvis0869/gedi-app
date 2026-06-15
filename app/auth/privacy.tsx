import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GlowBackground } from '@/components/GlowBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type PrivacyMode = 'ghost' | 'friends' | 'public';

const MODES: { key: PrivacyMode; icon: string; label: string; desc: string }[] = [
  {
    key: 'ghost',
    icon: '👻',
    label: 'Ghost',
    desc: 'Totally invisible. You can see everything but no one sees you.',
  },
  {
    key: 'friends',
    icon: '👥',
    label: 'Friends Only',
    desc: 'Only approved connections see your activity.',
  },
  {
    key: 'public',
    icon: '🌍',
    label: 'Public',
    desc: 'Check-ins and saves show in community counts. Default.',
  },
];

export default function PrivacyScreen() {
  const { user, markOnboarded } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<PrivacyMode>('public');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    if (user) {
      await supabase
        .from('users')
        .update({ privacy_mode: selected })
        .eq('id', user.id);
      await markOnboarded(user.id);
    }
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <GlowBackground intensity="soft" yOffset={220} />

      <View style={styles.inner}>
        <Text style={styles.title}>PRIVACY</Text>
        <Text style={styles.subtitle}>Who sees your Gedi activity?</Text>

        <View style={styles.options}>
          {MODES.map((mode) => {
            const active = selected === mode.key;
            return (
              <TouchableOpacity
                key={mode.key}
                onPress={() => setSelected(mode.key)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    active
                      ? ['rgba(255,107,0,0.12)', 'rgba(255,107,0,0.04)']
                      : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                  }
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={styles.optionIcon}>{mode.icon}</Text>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.optionDesc}>{mode.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>You can change this anytime in Profile settings.</Text>

        <PrimaryButton
          label={loading ? 'Saving…' : 'Start Exploring →'}
          onPress={handleContinue}
          loading={loading}
        />
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
    marginBottom: 32,
  },
  options: { gap: 10, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 14,
  },
  optionActive: {
    borderColor: 'rgba(255,107,0,0.5)',
  },
  optionIcon: { fontSize: 28 },
  optionContent: { flex: 1 },
  optionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.muted,
    marginBottom: 3,
  },
  optionLabelActive: { color: Colors.white },
  optionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  note: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
});
