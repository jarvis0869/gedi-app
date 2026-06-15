import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GlowBackground } from '@/components/GlowBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    setTimeout(() => refs.current[0]?.focus(), 300);
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDigit = (text: string, index: number) => {
    const char = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
    if (char && index === OTP_LENGTH - 1) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      refs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (isComplete && !loading) {
      handleVerify();
    }
  }, [isComplete]);

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: phone!,
      token: otp,
      type: 'sms',
    });
    if (err) {
      setLoading(false);
      setError(err.message || 'Invalid code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 100);
      return;
    }
    if (data.user) {
      await supabase.from('users').upsert(
        { id: data.user.id, phone: phone },
        { onConflict: 'id' }
      );
    }
    setLoading(false);
    router.replace('/auth/location');
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setDigits(Array(OTP_LENGTH).fill(''));
    await supabase.auth.signInWithOtp({ phone: phone! });
    setCountdown(30);
    setResending(false);
    setTimeout(() => refs.current[0]?.focus(), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity="soft" yOffset={300} />

      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headingArea}>
          <Text style={styles.title}>VERIFY</Text>
          <Text style={styles.subtitle}>Code sent to</Text>
          <Text style={styles.phone}>{phone}</Text>
        </View>

        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { refs.current[i] = r; }}
              style={[styles.box, d ? styles.boxFilled : null, error ? styles.boxError : null]}
              value={d}
              onChangeText={(t) => handleDigit(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              selectionColor={Colors.primary}
              caretHidden
              textAlign="center"
            />
          ))}
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PrimaryButton
          label="Verify"
          onPress={handleVerify}
          loading={loading}
          disabled={!isComplete}
          style={styles.btn}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get it? </Text>
          <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
            <Text style={[styles.resendBtn, (countdown > 0 || resending) && styles.resendDisabled]}>
              {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending…' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.screenPad + 8,
    justifyContent: 'center',
  },
  back: { position: 'absolute', top: Spacing.headerTop, left: Spacing.screenPad },
  backText: { fontFamily: Fonts.body, fontSize: 16, color: Colors.muted },
  headingArea: { marginBottom: 40 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 60,
    color: Colors.primary,
    letterSpacing: 8,
    marginBottom: 10,
  },
  subtitle: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },
  phone: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.white, marginTop: 2 },
  boxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    fontSize: 26,
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  boxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorDim,
  },
  errorRow: {
    marginBottom: 14,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  btn: { marginBottom: 20 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  resendBtn: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  resendDisabled: { color: Colors.muted },
});
