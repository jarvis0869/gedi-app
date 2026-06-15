import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Fonts, Radius } from '@/constants/theme';

const MODES = [
  {
    key: 'ghost',
    label: 'Ghost',
    icon: '👻',
    desc: 'Totally invisible. No one knows you\'re here. You can still see everything.',
  },
  {
    key: 'friends',
    label: 'Friends Only',
    icon: '👥',
    desc: 'Only your approved connections see your activity. Good middle ground.',
  },
  {
    key: 'public',
    label: 'Public',
    icon: '🌍',
    desc: 'Your check-ins and saves show in community counts. Be seen, be social.',
  },
] as const;

export default function PrivacyScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<'ghost' | 'friends' | 'public'>('public');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    if (user) {
      await supabase.from('users').update({ privacy_mode: selected }).eq('id', user.id);
    }
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PRIVACY</Text>
      <Text style={styles.subtitle}>Who sees your Gedi activity?</Text>

      <View style={styles.options}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[styles.option, selected === mode.key && styles.optionSelected]}
            onPress={() => setSelected(mode.key)}
          >
            <Text style={styles.optionIcon}>{mode.icon}</Text>
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, selected === mode.key && styles.optionLabelSelected]}>
                {mode.label}
              </Text>
              <Text style={styles.optionDesc}>{mode.desc}</Text>
            </View>
            {selected === mode.key && (
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>You can change this anytime in Profile.</Text>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Saving…' : 'Start Exploring'}</Text>
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
  title: {
    fontFamily: Fonts.headline,
    fontSize: 48,
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
    marginBottom: 36,
  },
  options: { gap: 12, marginBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.card,
    padding: 16,
    gap: 14,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  optionIcon: { fontSize: 32 },
  optionContent: { flex: 1 },
  optionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 4,
  },
  optionLabelSelected: { color: Colors.white },
  optionDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, lineHeight: 18 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: { color: Colors.white, fontSize: 14, fontFamily: Fonts.bodyBold },
  note: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 32,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white },
});
