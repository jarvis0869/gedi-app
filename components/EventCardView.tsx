import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EventCard } from '@/lib/events';
import { EventbriteCard } from '@/lib/eventbrite';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';

type AnyEvent = EventCard | EventbriteCard;

interface Props {
  card: AnyEvent;
}

function formatDateShort(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const today = new Date();
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function EventCardView({ card }: Props) {
  const isEb = card.source === 'eventbrite';
  const eb = card as EventbriteCard;
  const serp = card as EventCard;

  const thumbnail = isEb ? eb.logo : serp.thumbnail;
  const title = isEb ? eb.title : serp.title;
  const venue = isEb ? eb.venue : serp.venue;
  const rawDate = isEb ? eb.start : serp.date;
  const rawTime = isEb ? eb.start : serp.time;
  const isFree = isEb ? eb.is_free : null;

  const dateLabel = isEb ? formatDateShort(rawDate) : rawDate;
  const timeLabel = isEb
    ? (rawTime ? new Date(rawTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '')
    : rawTime;

  return (
    <View style={styles.card}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['rgba(255,107,0,0.1)', 'rgba(18,15,30,0.95)']}
          style={[styles.image, styles.imageFallback]}
        >
          <Text style={styles.fallbackEmoji}>🎉</Text>
        </LinearGradient>
      )}

      <LinearGradient
        colors={Gradients.cardOverlay}
        locations={[0, 0.38, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Badges top row */}
      <View style={styles.topBadges}>
        <View style={styles.eventPill}>
          <Text style={styles.eventPillText}>EVENT</Text>
        </View>
        {isFree !== null && (
          <View style={[styles.pricePill, isFree ? styles.freePill : styles.paidPill]}>
            <Text style={styles.pricePillText}>{isFree ? 'FREE' : 'TICKETED'}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{title}</Text>

        {!!dateLabel && (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>
              {dateLabel}{timeLabel ? `  ·  ${timeLabel}` : ''}
            </Text>
          </View>
        )}

        {!!venue && (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>{venue}</Text>
          </View>
        )}

        <View style={styles.hintRow}>
          <Text style={styles.hint}>↑ details</Text>
          <Text style={styles.hintGreen}>→ interested ✓</Text>
          <Text style={styles.hintGrey}>✗ skip ←</Text>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(255,107,0,0.14)', 'rgba(255,107,0,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.detailBar}
      >
        <Text style={styles.detailBarText}>View Event</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  image: { width: '100%', height: '60%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackEmoji: { fontSize: 80 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72%',
  },
  topBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
    zIndex: 5,
  },
  eventPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  eventPillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1.5 },
  pricePill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  freePill: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  paidPill: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  pricePillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  content: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: 6,
  },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 36,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { fontSize: 13 },
  metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, flex: 1 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  hint: { fontFamily: Fonts.body, fontSize: 11, color: Colors.mutedFaint },
  hintGreen: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(0,200,81,0.45)' },
  hintGrey: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(136,136,136,0.45)' },
  detailBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 13,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.2)',
  },
  detailBarText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary, letterSpacing: 0.5 },
});
