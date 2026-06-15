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
import { PlaceCard as PlaceCardType } from '@/lib/places';
import { StampOverlay } from './StampOverlay';
import { Colors, Fonts, Gradients, Radius, Shadow } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
export const CARD_WIDTH = width - 32;
export const CARD_HEIGHT = height * 0.72;
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 400;

interface Props {
  card: PlaceCardType;
  isTop: boolean;
  index: number;
  onSwipeRight: (card: PlaceCardType) => void;
  onSwipeLeft: (card: PlaceCardType) => void;
}

export function PlaceCard({ card, isTop, index, onSwipeRight, onSwipeLeft }: Props) {
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

      if (swipedRight) {
        translateX.value = withTiming(width * 1.5, { duration: 280 });
        runOnJS(onSwipeRight)(card);
      } else if (swipedLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: 280 });
        runOnJS(onSwipeLeft)(card);
      } else if (swipedUp) {
        const pid = card.place_id;
        runOnJS(() => router.push(`/place/${pid}`))();
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

  const photo = card.photos?.[0];
  const priceLabel = card.price_level ? '₹'.repeat(card.price_level) : '₹';
  const category = card.categories
    ?.filter((c) => !['establishment', 'point_of_interest', 'food'].includes(c))[0]
    ?.replace(/_/g, ' ') || 'place';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackEmoji}>📍</Text>
          </View>
        )}

        <LinearGradient
          colors={Gradients.cardOverlay}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <View style={styles.stampZone} pointerEvents="none">
          <StampOverlay type={stamp.value} opacity={stampOpacity} />
        </View>

        <View style={styles.content}>
          {card.opening_hours && (
            <View style={[styles.openBadge, card.opening_hours.open_now ? styles.openBadgeGreen : styles.openBadgeRed]}>
              <Text style={styles.openBadgeText}>
                {card.opening_hours.open_now ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{card.name}</Text>
          <View style={styles.metaRow}>
            {!!card.rating && (
              <Text style={styles.rating}>★ {card.rating.toFixed(1)}</Text>
            )}
            <Text style={styles.dot}>·</Text>
            <Text style={styles.price}>{priceLabel}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.category}>{category}</Text>
          </View>
          <Text style={styles.vicinity} numberOfLines={1}>{card.vicinity}</Text>
          <View style={styles.hintRow}>
            <Text style={styles.hint}>↑ Details</Text>
            <Text style={styles.hint}>→ Going</Text>
            <Text style={styles.hint}>← Nah</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => router.push(`/place/${card.place_id}`)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,107,0,0.2)', 'rgba(255,107,0,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.detailBtnInner}
          >
            <Text style={styles.detailBtnText}>View Details</Text>
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
    height: '65%',
  },
  imageFallback: {
    backgroundColor: Colors.glassStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: { fontSize: 72 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  stampZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  content: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  openBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: 10,
    borderWidth: 1,
  },
  openBadgeGreen: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  openBadgeRed: { backgroundColor: Colors.errorDim, borderColor: Colors.error },
  openBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 34,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 8,
    lineHeight: 38,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  rating: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.gold },
  dot: { color: Colors.muted, fontSize: 14 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  category: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  vicinity: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.mutedLight,
    marginBottom: 12,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
