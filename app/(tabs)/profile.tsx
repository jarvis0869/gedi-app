import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Fonts, Radius } from '@/constants/theme';

type PrivacyMode = 'ghost' | 'friends' | 'public';

interface UserProfile {
  phone: string;
  points: number;
  checkins_count: number;
  saves_count: number;
  privacy_mode: PrivacyMode;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('phone,points,checkins_count,saves_count,privacy_mode')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [user]);

  const updatePrivacy = async (mode: PrivacyMode) => {
    if (!user) return;
    setProfile((p) => p ? { ...p, privacy_mode: mode } : p);
    await supabase.from('users').update({ privacy_mode: mode }).eq('id', user.id);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            await supabase.from('saves').delete().eq('user_id', user.id);
            await supabase.from('checkins').delete().eq('user_id', user.id);
            await supabase.from('users').delete().eq('id', user.id);
            await signOut();
          },
        },
      ]
    );
  };

  const PRIVACY_OPTIONS: { key: PrivacyMode; label: string; icon: string }[] = [
    { key: 'ghost', label: 'Ghost', icon: '👻' },
    { key: 'friends', label: 'Friends Only', icon: '👥' },
    { key: 'public', label: 'Public', icon: '🌍' },
  ];

  const phone = profile?.phone || user?.phone || '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>PROFILE</Text>

      <GlassCard style={styles.statsCard}>
        <Text style={styles.phone}>{phone}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.points ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.checkins_count ?? 0}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.saves_count ?? 0}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>PRIVACY</Text>
      <GlassCard style={styles.section}>
        {PRIVACY_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.privacyRow,
              i < PRIVACY_OPTIONS.length - 1 && styles.rowBorder,
            ]}
            onPress={() => updatePrivacy(opt.key)}
          >
            <Text style={styles.privacyIcon}>{opt.icon}</Text>
            <Text style={styles.privacyLabel}>{opt.label}</Text>
            <View style={[styles.radio, profile?.privacy_mode === opt.key && styles.radioActive]}>
              {profile?.privacy_mode === opt.key && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </GlassCard>

      <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      <GlassCard style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Text style={styles.switchDesc}>Events tonight, saved places opening</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            thumbColor={Colors.white}
            trackColor={{ false: Colors.glassBorder, true: Colors.primary }}
          />
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>ABOUT</Text>
      <GlassCard style={styles.section}>
        <TouchableOpacity
          style={[styles.linkRow, styles.rowBorder]}
          onPress={() => Linking.openURL('https://gediapp.in/terms')}
        >
          <Text style={styles.linkText}>Terms of Service</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.linkRow, styles.rowBorder]}
          onPress={() => Linking.openURL('https://gediapp.in/privacy')}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Version</Text>
          <Text style={styles.versionText}>{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>
      </GlassCard>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 100 },
  title: { fontFamily: Fonts.headline, fontSize: 28, color: Colors.white, letterSpacing: 3, marginBottom: 20 },
  statsCard: { padding: 20, marginBottom: 24 },
  phone: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white, marginBottom: 20, textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: Fonts.headline, fontSize: 32, color: Colors.primary },
  statLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.glassBorder },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  section: { marginBottom: 20 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  privacyIcon: { fontSize: 22 },
  privacyLabel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.white, flex: 1 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  switchLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white, marginBottom: 4 },
  switchDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.white },
  linkArrow: { fontFamily: Fonts.body, fontSize: 16, color: Colors.muted },
  versionText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  signOutBtn: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.muted },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.error },
});
