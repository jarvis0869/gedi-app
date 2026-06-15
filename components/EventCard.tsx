import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EventCard as SerpEventCard } from '@/lib/events';
import { EventbriteCard } from '@/lib/eventbrite';
import { StampOverlay } from './StampOverlay';
import { Colors, Fonts, Gradients, Radius, Shadow } from '@/constants/theme';
import { CARD_WIDTH, CARD_HEIGHT } from './PlaceCard';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 400;

export type AnyEvent = SerpEventCard | EventbriteCard;

interface Props {
  card: AnyEvent;
  isTop: boolean;
  index: number;
  onSwipeRight: (card: AnyEvent) => void;
  onSwipeLeft: (card: AnyEvent) => void;
}

export function EventCard({ card, isTop, index, onSwipeRight, onSwipeLeft }: Props) {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const stamp = useSharedValue<'going' | 'nah' | null>(null);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-width, 0, width], [-20, 0, 20]);
    const scale = isTop ? 1 : interpolate(Math.min(index, 3), [1, 3], [0.94, 0.88]);
    const yOffset = isTop ? translateY.value : index * -10;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: yOffset },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      if (e.translationX > 30) {
        stamp.value = 'going';
        stampOpacity.value = Math.min((e.translationX - 30) / 70, 1);
      } else if (e.translationX < -30) {
        stamp.value = 'nah';
        stampOpacity.value = Math.min((-e.translationX - 30) / 70, 1);
      } else {
        stampOpacity.value = 0;
        stamp.value = null;
      }
    })
    .onEnd((e) => {
      const swipedRight = e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;
      const swipedLeft = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const swipedUp = e.translationY < -80 && Math.abs(e.translationX) < 60;
      const eventId = card.id;

      if (swipedRight) {
        translateX.value = withTiming(width * 1.5, { duration: 280 });
        runOnJS(onSwipeRight)(card);
      } else if (swipedLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: 280 });
        runOnJS(onSwipeLeft)(card);
      } else if (swipedUp) {
        runOnJS(() => router.push(`/event/${eventId}`))();
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        stampOpacity.value = withTiming(0, { duration: 150 });
        stamp.value = null;
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        stampOpacity.value = withTiming(0, { duration: 150 });
        stamp.value = null;
      }
    });

  const isEb = card.source === 'eventbrite';
  const thumbnail = isEb ? (card as EventbriteCard).logo : (card as SerpEventCard).thumbnail;
  const title = isEb ? (card as EventbriteCard).title : (card as SerpEventCard).title;
  const venue = isEb ? (card as EventbriteCard).venue : (card as SerpEventCard).venue;
  const dateStr = isEb ? (card as EventbriteCard).start : (card as SerpEventCard).date;
  const timeStr = isEb ? '' : (card as SerpEventCard).time;
  const isFree = isEb ? (card as EventbriteCard).is_free : null;

  const dateDisplay = dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(255,107,0,0.08)', 'rgba(18,15,30,0.9)']}
            style={[styles.image, styles.imageFallback]}
          >
            <Text style={styles.fallbackEmoji}>🎉</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={Gradients.cardOverlay}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <View style={styles.stampZone} pointerEvents="none">
          <StampOverlay type={stamp.value} opacity={stampOpacity} />
        </View>

        <View style={styles.eventPill}>
          <Text style={styles.eventPillText}>EVENT</Text>
        </View>

        {isFree !== null && (
          <View style={[styles.pricePill, isFree ? styles.freePill : styles.paidPill]}>
            <Text style={styles.pricePillText}>{isFree ? 'FREE' : 'TICKETED'}</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{title}</Text>
          {!!dateDisplay && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{dateDisplay}{timeStr ? `  ·  ${timeStr}` : ''}</Text>
            </View>
          )}
          {!!venue && (
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText} numberOfLines={1}>{venue}</Text>
            </View>
          )}
          <View style={styles.hintRow}>
            <Text style={styles.hint}>↑ Details</Text>
            <Text style={styles.hint}>→ Interested</Text>
            <Text style={styles.hint}>← Skip</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => router.push(`/event/${card.id}`)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,107,0,0.2)', 'rgba(255,107,0,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.detailBtnInner}
          >
            <Text style={styles.detailBtnText}>View Event</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadow.card,
  },
  image: {
    width: '100%',
    height: '62%',
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: { fontSize: 80 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72%',
  },
  stampZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  eventPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    zIndex: 5,
  },
  eventPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  pricePill: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    zIndex: 5,
    borderWidth: 1,
  },
  freePill: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  paidPill: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  pricePillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  content: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 6,
  },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 36,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: { fontSize: 13 },
  metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, flex: 1 },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hint: { fontFamily: Fonts.body, fontSize: 11, color: Colors.mutedFaint },
  detailBtn: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.4)',
    overflow: 'hidden',
  },
  detailBtnInner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
