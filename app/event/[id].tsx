import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCachedEvent, cacheFeed } from '@/lib/eventCache';
import { buildFeed } from '@/lib/feedMixer';
import { EventCard } from '@/lib/events';
import { EventbriteCard } from '@/lib/eventbrite';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

type AnyEvent = EventCard | EventbriteCard;

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<AnyEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const cached = getCachedEvent(id);
    if (cached && cached.type === 'event') {
      setEvent(cached as AnyEvent);
      return;
    }
    // Cold-launch: cache is empty — load the feed in background then retry
    setFeedLoading(true);
    buildFeed().then(({ cards }) => {
      cacheFeed(cards);
      const found = getCachedEvent(id);
      if (found && found.type === 'event') {
        setEvent(found as AnyEvent);
      } else {
        setNotFound(true);
      }
    }).catch(() => setNotFound(true))
      .finally(() => setFeedLoading(false));
  }, [id]);

  if (!event && !notFound) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
        {feedLoading && (
          <Text style={styles.notFoundText}>Loading events…</Text>
        )}
      </View>
    );
  }

  if (notFound || !event) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundEmoji}>🎉</Text>
        <Text style={styles.notFoundText}>Event not available</Text>
        <Text style={styles.notFoundSub}>This event may have ended or been removed.</Text>
        <TouchableOpacity style={styles.feedBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.feedBtnText}>Browse Tonight's Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
          <Text style={styles.backFabText}>←</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEb = event.source === 'eventbrite';
  const eb = event as EventbriteCard;
  const serp = event as EventCard;

  const title = isEb ? eb.title : serp.title;
  const description = isEb ? eb.description : serp.description;
  const thumbnail = isEb ? eb.logo : serp.thumbnail;
  const venue = isEb ? eb.venue : serp.venue;
  const venueAddress = isEb ? eb.venue_address : undefined;
  const rawDate = isEb ? eb.start : serp.date;
  const rawTime = isEb ? eb.start : serp.time;
  const isFree = isEb ? eb.is_free : null;
  const ticketPrice = isEb ? eb.ticket_price : undefined;
  const ticketUrl = isEb ? eb.url : serp.url;

  const dateLabel = isEb ? formatDate(rawDate) : rawDate;
  const timeLabel = isEb ? formatTime(rawTime) : rawTime;

  const handleTickets = () => {
    if (ticketUrl) Linking.openURL(ticketUrl);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title,
        message: `Check out "${title}" on Gedi!\ngediapp.in/event/${id}`,
        url: `gedi://event/${id}`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
        <Text style={styles.backFabText}>←</Text>
      </TouchableOpacity>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(255,107,0,0.12)', 'rgba(18,15,30,0.95)']}
            style={styles.coverFallback}
          >
            <Text style={styles.coverEmoji}>🎉</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['transparent', Colors.bg]}
          style={styles.coverGradient}
          pointerEvents="none"
        />

        <View style={styles.content}>
          <View style={styles.pillRow}>
            <View style={styles.eventPill}>
              <Text style={styles.eventPillText}>EVENT</Text>
            </View>
            {isFree !== null && (
              <View style={[styles.pricePill, isFree ? styles.freePill : styles.paidPill]}>
                <Text style={styles.pricePillText}>
                  {isFree ? 'FREE' : ticketPrice ?? 'TICKETED'}
                </Text>
              </View>
            )}
            {isEb && (
              <View style={styles.sourcePill}>
                <Text style={styles.sourcePillText}>Eventbrite</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.infoBlock}>
            {!!dateLabel && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoText}>
                  {dateLabel}{timeLabel && timeLabel !== dateLabel ? `  ·  ${timeLabel}` : ''}
                </Text>
              </View>
            )}
            {!!venue && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View>
                  <Text style={styles.infoText}>{venue}</Text>
                  {!!venueAddress && (
                    <Text style={styles.infoSubText}>{venueAddress}</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {!!description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ABOUT THIS EVENT</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {!!ticketUrl && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleTickets} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FF8C00', '#FF6B00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnInner}
                >
                  <Text style={styles.primaryBtnText}>
                    {isFree ? '🎫 Register Free' : '🎫 Get Tickets'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.secondaryBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundEmoji: { fontSize: 52, marginBottom: 4 },
  notFoundText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.muted,
  },
  notFoundSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.mutedLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  feedBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 100,
    marginTop: 4,
  },
  feedBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  backFab: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26,22,40,0.85)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backFabText: { fontSize: 18, color: Colors.white },
  cover: { width, height: width * 0.62 },
  coverFallback: {
    width,
    height: width * 0.62,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: { fontSize: 90 },
  coverGradient: {
    position: 'absolute',
    top: width * 0.35,
    left: 0,
    right: 0,
    height: width * 0.3,
  },
  content: { padding: Spacing.screenPad, paddingBottom: 60 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  eventPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  eventPillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1.5 },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  freePill: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  paidPill: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  pricePillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  sourcePillText: { fontFamily: Fonts.body, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 38,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 20,
  },
  infoBlock: { gap: 12, marginBottom: 28 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted, flex: 1, lineHeight: 22 },
  infoSubText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.mutedLight, marginTop: 2 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 24,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: { flex: 1, borderRadius: Radius.button, overflow: 'hidden' },
  primaryBtnInner: { paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.muted },
});
