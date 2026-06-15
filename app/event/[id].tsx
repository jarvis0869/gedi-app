import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SAVED_EVENTS_KEY = '@gedi_event_cache';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
      const cache = raw ? JSON.parse(raw) : {};
      if (cache[id!]) { setEvent(cache[id!]); }
    } catch {}
    setLoading(false);
  };

  const handleTickets = () => {
    const url = event?.url || event?.link;
    if (url) Linking.openURL(url);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${event?.title || event?.name} on Gedi!`,
      url: `gedi://event/${id}`,
    });
  };

  const title = event?.title || event?.name || 'Event';
  const description = event?.description || '';
  const thumbnail = event?.thumbnail || event?.logo || '';
  const venue = event?.venue || '';
  const dateStr = event?.date || event?.start || '';
  const timeStr = event?.time || '';
  const isFree = event?.is_free;
  const ticketPrice = event?.ticket_price;
  const ticketUrl = event?.url || event?.link;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Text style={styles.coverEmoji}>🎉</Text>
          </View>
        )}

        <View style={styles.content}>
          {isFree !== undefined && isFree !== null && (
            <View style={[styles.priceBadge, isFree ? styles.freeBadge : styles.paidBadge]}>
              <Text style={styles.priceBadgeText}>{isFree ? 'FREE' : ticketPrice || 'TICKETED'}</Text>
            </View>
          )}

          <Text style={styles.title}>{title}</Text>

          <View style={styles.infoBlock}>
            {!!dateStr && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoText}>{dateStr}{timeStr ? `  ·  ${timeStr}` : ''}</Text>
              </View>
            )}
            {!!venue && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>{venue}</Text>
              </View>
            )}
          </View>

          {!!description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ABOUT</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {ticketUrl ? (
              <TouchableOpacity style={styles.actionBtn} onPress={handleTickets}>
                <Text style={styles.actionBtnText}>
                  {isFree ? 'Register Free' : 'Get Tickets'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleShare}
            >
              <Text style={styles.actionBtnSecondaryText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,22,40,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 20, color: Colors.white },
  cover: { width, height: width * 0.65 },
  coverFallback: { backgroundColor: 'rgba(255,107,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  coverEmoji: { fontSize: 100 },
  content: { padding: 20, paddingBottom: 48 },
  priceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 14,
  },
  freeBadge: { backgroundColor: 'rgba(0,200,81,0.15)', borderWidth: 1, borderColor: '#00C851' },
  paidBadge: { backgroundColor: 'rgba(255,107,0,0.12)', borderWidth: 1, borderColor: Colors.primary },
  priceBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.white, letterSpacing: 1 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 38,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 42,
    marginBottom: 20,
  },
  infoBlock: { gap: 10, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted, flex: 1, lineHeight: 22 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  actionBtnSecondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.muted },
});
