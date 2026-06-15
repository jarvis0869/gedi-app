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
import { useRouter } from 'expo-router';
import { PlaceCard as PlaceCardType } from '@/lib/places';
import { StampOverlay } from './StampOverlay';
import { Colors, Fonts, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.72;
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
    const scale = isTop ? 1 : interpolate(index, [1, 3], [0.94, 0.88]);
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

  const stampAnimStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
  }));

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      if (e.translationX > 30) {
        stamp.value = 'going';
        stampOpacity.value = Math.min((e.translationX - 30) / 60, 1);
      } else if (e.translationX < -30) {
        stamp.value = 'nah';
        stampOpacity.value = Math.min((-e.translationX - 30) / 60, 1);
      } else {
        stampOpacity.value = 0;
        stamp.value = null;
      }
    })
    .onEnd((e) => {
      const swipedRight =
        e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;
      const swipedLeft =
        e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const swipedUp =
        e.translationY < -80 && Math.abs(e.translationX) < 50;

      if (swipedRight) {
        translateX.value = withTiming(width * 1.5, { duration: 300 });
        runOnJS(onSwipeRight)(card);
      } else if (swipedLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: 300 });
        runOnJS(onSwipeLeft)(card);
      } else if (swipedUp) {
        runOnJS(() => router.push(`/place/${card.place_id}`))();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        stampOpacity.value = withTiming(0);
        stamp.value = null;
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        stampOpacity.value = withTiming(0);
        stamp.value = null;
      }
    });

  const photo = card.photos?.[0];
  const priceLabel = card.price_level ? '₹'.repeat(card.price_level) : '₹';
  const category = card.categories?.[0]?.replace(/_/g, ' ') || 'place';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}

        <Animated.View style={[StyleSheet.absoluteFillObject, styles.stampContainer]}>
          <StampOverlay type={stamp.value} opacity={stampOpacity} />
        </Animated.View>

        <View style={styles.gradient} />

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {card.name}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.rating}>★ {card.rating?.toFixed(1)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.price}>{priceLabel}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.category}>{category}</Text>
          </View>
          <Text style={styles.vicinity} numberOfLines={1}>
            {card.vicinity}
          </Text>
          <View style={styles.hintRow}>
            <Text style={styles.hint}>↑ Details</Text>
            <Text style={styles.hint}>→ Going</Text>
            <Text style={styles.hint}>← Nah</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => router.push(`/place/${card.place_id}`)}
        >
          <Text style={styles.detailBtnText}>View Details</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '65%',
  },
  imageFallback: {
    backgroundColor: Colors.glassStrong,
  },
  stampContainer: {
    zIndex: 10,
    pointerEvents: 'none',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(26,22,40,0.98))',
  },
  content: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: 20,
  },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  rating: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#FFD700',
  },
  dot: {
    color: Colors.muted,
    fontSize: 14,
  },
  price: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.primary,
  },
  category: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  vicinity: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 12,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  detailBtn: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
