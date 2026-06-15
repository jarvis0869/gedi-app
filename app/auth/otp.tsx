import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Fonts, Radius } from '@/constants/theme';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    ref.current?.focus();
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: phone!,
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      await supabase.from('users').upsert({ id: data.user.id, phone: phone }, { onConflict: 'id' });
    }
    router.replace('/auth/location');
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await supabase.auth.signInWithOtp({ phone: phone! });
    setCountdown(30);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>VERIFY</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          ref={ref}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          placeholder="• • • • • •"
          placeholderTextColor={Colors.muted}
          selectionColor={Colors.primary}
          textAlign="center"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, (loading || otp.length !== 6) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0}
          style={styles.resend}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  back: { position: 'absolute', top: 56, left: 28 },
  backText: { fontFamily: Fonts.body, fontSize: 16, color: Colors.muted },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 56,
    color: Colors.primary,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  phone: { color: Colors.white, fontFamily: Fonts.bodySemiBold },
  input: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.button,
    backgroundColor: Colors.glass,
    fontSize: 32,
    color: Colors.white,
    paddingVertical: 20,
    letterSpacing: 20,
    marginBottom: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white },
  resend: { marginTop: 20, alignItems: 'center' },
  resendText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.primary },
  resendDisabled: { color: Colors.muted },
});
