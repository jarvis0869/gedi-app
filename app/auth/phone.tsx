import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GlowBackground } from '@/components/GlowBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export default function PhoneScreen() {
  const router = useRouter();
  const { markOnboarded } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signInAnonymously();
      if (err) throw err;
      if (data.user) await markOnboarded(data.user.id);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Dev sign-in failed — enable Anonymous sign-ins in Supabase dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push({ pathname: '/auth/otp', params: { phone: `+91${digits}` } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity="soft" yOffset={260} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Text style={styles.logo}>GEDI</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Tera sheher. Teri gedi.</Text>
            <View style={styles.taglineLine} />
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
              style={styles.prefix}
            >
              <Text style={styles.prefixText}>+91</Text>
            </LinearGradient>
            <TextInput
              style={styles.input}
              placeholder="9XXXXXXXXX"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(''); }}
              selectionColor={Colors.primary}
              autoFocus
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label={loading ? 'Sending…' : 'Send OTP'}
            onPress={handleSendOTP}
            loading={loading}
            disabled={phone.replace(/\D/g, '').length !== 10}
            style={styles.btn}
          />

          <Text style={styles.disclaimer}>
            One-time code sent via SMS. No passwords ever.
          </Text>

          {__DEV__ && (
            <>
              <View style={styles.devDivider}>
                <View style={styles.devLine} />
                <Text style={styles.devDividerText}>DEV ONLY</Text>
                <View style={styles.devLine} />
              </View>
              <TouchableOpacity
                style={styles.devBtn}
                onPress={handleDevSignIn}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>⚡ Skip Auth (Dev Only)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.screenPad + 8 },
  logoArea: { alignItems: 'center', marginBottom: 64 },
  logo: {
    fontFamily: Fonts.headline,
    fontSize: 80,
    color: Colors.primary,
    letterSpacing: 10,
    lineHeight: 88,
  },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  taglineLine: { flex: 1, height: 1, backgroundColor: Colors.glassBorder },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  form: {},
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: Colors.glass,
  },
  prefix: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.glassBorder,
  },
  prefixText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 3,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.error,
    marginBottom: 12,
  },
  btn: { marginTop: 4 },
  disclaimer: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  devDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
    marginBottom: 14,
  },
  devLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  devDividerText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.mutedLight,
    letterSpacing: 2,
  },
  devBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  devBtnText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.mutedLight,
  },
});
