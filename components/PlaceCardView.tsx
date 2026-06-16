import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PlaceCard } from '@/lib/places';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';

interface Props {
  card: PlaceCard;
  userLat?: number;
  userLng?: number;
}

const PRICE: Record<number, string> = { 0: '₹', 1: '₹', 2: '₹₹', 3: '₹₹₹', 4: '₹₹₹₹' };
const CYCLE_MS = 3000;

function calcDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m: number): string {
  return m < 1000 ? `${Math.round(m)}m away` : `${(m / 1000).toFixed(1)} km away`;
}

export function PlaceCardView({ card, userLat, userLng }: Props) {
  const photos = card.photos ?? [];
  const price = PRICE[card.price_level] ?? '₹';
  const category = card.categories
    ?.filter((c) => !['establishment', 'point_of_interest', 'food', 'store'].includes(c))[0]
    ?.replace(/_/g, ' ') || 'place';

  const distLabel =
    userLat != null && userLng != null && card.lat && card.lng
      ? formatDist(calcDistanceM(userLat, userLng, card.lat, card.lng))
      : null;

  // Photo cycling
  const [photoIdx, setPhotoIdx] = useState(0);
  const opacity = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setPhotoIdx((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    timerRef.current = setInterval(() => {
      opacity.value = withTiming(0, { duration: 400 }, (done) => {
        'worklet';
        if (done) {
          runOnJS(advance)();
          opacity.value = withTiming(1, { duration: 400 });
        }
      });
    }, CYCLE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [photos.length, advance]);

  const imgStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const photo = photos[photoIdx];

  return (
    <View style={styles.card}>
      {photo ? (
        <Animated.Image
          source={{ uri: photo }}
          style={[styles.image, imgStyle]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['rgba(255,107,0,0.06)', 'rgba(18,15,30,0.9)']}
          style={[styles.image, styles.imageFallback]}
        >
          <Text style={styles.fallbackEmoji}>📍</Text>
        </LinearGradient>
      )}

      {/* Photo dots */}
      {photos.length > 1 && (
        <View style={styles.photoDots}>
          {photos.slice(0, 8).map((_, i) => (
            <View key={i} style={[styles.photoDot, i === photoIdx && styles.photoDotActive]} />
          ))}
        </View>
      )}

      <LinearGradient
        colors={Gradients.cardOverlay}
        locations={[0, 0.42, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {card.opening_hours && (
          <View style={[
            styles.openBadge,
            card.opening_hours.open_now ? styles.openGreen : styles.openRed,
          ]}>
            <Text style={styles.openBadgeText}>
              {card.opening_hours.open_now ? '● OPEN' : '● CLOSED'}
            </Text>
          </View>
        )}

        <Text style={styles.name} numberOfLines={2}>{card.name}</Text>

        <View style={styles.metaRow}>
          {!!card.rating && (
            <Text style={styles.rating}>★ {card.rating.toFixed(1)}</Text>
          )}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.category}>{category}</Text>
        </View>

        {!!card.vicinity && (
          <Text style={styles.vicinity} numberOfLines={1}>📍 {card.vicinity}</Text>
        )}

        {!!distLabel && (
          <Text style={styles.distance}>📐 {distLabel}</Text>
        )}

        <View style={styles.hintRow}>
          <Text style={styles.hint}>↑ details</Text>
          <Text style={styles.hintGreen}>→ going ✓</Text>
          <Text style={styles.hintGrey}>✗ nah ←</Text>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(255,107,0,0.14)', 'rgba(255,107,0,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.detailBar}
      >
        <Text style={styles.detailBarText}>View Details</Text>
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
  image: { width: '100%', height: '64%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackEmoji: { fontSize: 72 },

  photoDots: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    zIndex: 3,
  },
  photoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoDotActive: {
    backgroundColor: Colors.white,
    width: 14,
  },

  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '68%',
  },
  content: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: 5,
  },
  openBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  openGreen: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  openRed: { backgroundColor: Colors.errorDim, borderColor: Colors.error },
  openBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 34,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 38,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rating: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#FFD700' },
  dot: { color: Colors.muted, fontSize: 13 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  category: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  vicinity: { fontFamily: Fonts.body, fontSize: 12, color: Colors.mutedLight },
  distance: { fontFamily: Fonts.body, fontSize: 11, color: Colors.primary },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
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
