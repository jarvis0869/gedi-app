import React, { useCallback, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { FeedCard } from '@/lib/feedMixer';
import { PlaceCard as PlaceCardType } from '@/lib/places';
import { EventCard as SerpEvent } from '@/lib/events';
import { EventbriteCard } from '@/lib/eventbrite';
import { PlaceCardView } from './PlaceCardView';
import { EventCardView } from './EventCardView';
import { StampOverlay } from './StampOverlay';

export type AnyEvent = SerpEvent | EventbriteCard;

const { width, height } = Dimensions.get('window');
export const CARD_WIDTH = width - 32;
export const CARD_HEIGHT = height * 0.72;

const SWIPE_X = 100;
const SWIPE_VX = 400;
const SWIPE_Y = 80;
const PULL_DOWN = 80;
const SPRING_BACK = { damping: 20, stiffness: 220, mass: 0.9 };

interface Props {
  cards: FeedCard[];
  topIndex: number;
  onSwipeRight: (card: FeedCard) => void;
  onSwipeLeft: (card: FeedCard) => void;
  onSwipeUp: (card: FeedCard) => void;
  onRefresh?: () => void;
}

function BackCard({
  card,
  slot,
  dragX,
}: {
  card: FeedCard;
  slot: number;
  dragX: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(dragX.value) / SWIPE_X, 1);
    const baseScale = interpolate(slot, [1, 3], [0.945, 0.885]);
    const nextScale = interpolate(slot, [1, 3], [1, 0.945]);
    const scale = interpolate(progress, [0, 1], [baseScale, nextScale]);
    const baseY = slot * -10;
    const nextY = (slot - 1) * -10;
    const ty = interpolate(progress, [0, 1], [baseY, nextY]);
    const opacity = interpolate(slot, [1, 4], [1, 0.5]);
    return { transform: [{ scale }, { translateY: ty }], opacity };
  });

  return (
    <Animated.View style={[styles.card, style]}>
      {card.type === 'place' ? (
        <PlaceCardView card={card as PlaceCardType} />
      ) : (
        <EventCardView card={card as AnyEvent} />
      )}
    </Animated.View>
  );
}

export function CardStack({ cards, topIndex, onSwipeRight, onSwipeLeft, onSwipeUp, onRefresh }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const stamp = useSharedValue<'going' | 'nah' | null>(null);
  const didCrossThreshold = useSharedValue(false);

  const visible = cards.slice(topIndex, topIndex + 4);
  const topCard = visible[0];
  const backCards = visible.slice(1);

  // Reset animation when the card changes (covers button-press swipes)
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    stampOpacity.value = 0;
    stamp.value = null;
    didCrossThreshold.value = false;
  }, [topIndex]);

  const handleGoingPress = useCallback(() => {
    if (!topCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeRight(topCard);
  }, [topCard, onSwipeRight]);

  const handleNahPress = useCallback(() => {
    if (!topCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeLeft(topCard);
  }, [topCard, onSwipeLeft]);

  const handleDetailsPress = useCallback(() => {
    if (!topCard) return;
    onSwipeUp(topCard);
  }, [topCard, onSwipeUp]);

  const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const resetAnim = () => {
    'worklet';
    translateX.value = withSpring(0, SPRING_BACK);
    translateY.value = withSpring(0, SPRING_BACK);
    stampOpacity.value = withTiming(0, { duration: 120 });
    stamp.value = null;
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 30])
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
      translateY.value = e.translationY;

      const absX = Math.abs(e.translationX);

      if (e.translationX > 40) {
        stamp.value = 'going';
        stampOpacity.value = Math.min((e.translationX - 40) / 55, 1);
      } else if (e.translationX < -40) {
        stamp.value = 'nah';
        stampOpacity.value = Math.min((-e.translationX - 40) / 55, 1);
      } else {
        stampOpacity.value = withTiming(0, { duration: 80 });
        stamp.value = null;
      }

      if (absX >= SWIPE_X && !didCrossThreshold.value) {
        didCrossThreshold.value = true;
        runOnJS(hapticLight)();
      } else if (absX < SWIPE_X - 10 && didCrossThreshold.value) {
        didCrossThreshold.value = false;
      }
    })
    .onEnd((e) => {
      'worklet';
      const swipedRight = e.translationX > SWIPE_X || e.velocityX > SWIPE_VX;
      const swipedLeft = e.translationX < -SWIPE_X || e.velocityX < -SWIPE_VX;
      const swipedUp =
        e.translationY < -SWIPE_Y &&
        Math.abs(e.translationX) < 60 &&
        e.velocityY < 0;
      const swipedDown =
        e.translationY > PULL_DOWN &&
        Math.abs(e.translationX) < 60;

      const card = cards[topIndex];
      didCrossThreshold.value = false;

      if (!card) { resetAnim(); return; }

      if (swipedRight) {
        const speed = Math.max(e.velocityX, 900);
        const dur = Math.min(300, Math.round(1400 / (speed / 400)));
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        // Reset translate BEFORE notifying parent so new card starts at 0
        translateX.value = withTiming(width * 1.6, { duration: dur }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            translateY.value = 0;
            stamp.value = null;
            didCrossThreshold.value = false;
            runOnJS(onSwipeRight)(card);
          }
        });
      } else if (swipedLeft) {
        const speed = Math.max(-e.velocityX, 900);
        const dur = Math.min(300, Math.round(1400 / (speed / 400)));
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        translateX.value = withTiming(-width * 1.6, { duration: dur }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            translateY.value = 0;
            stamp.value = null;
            didCrossThreshold.value = false;
            runOnJS(onSwipeLeft)(card);
          }
        });
      } else if (swipedUp) {
        runOnJS(onSwipeUp)(card);
        resetAnim();
      } else if (swipedDown) {
        resetAnim();
        if (onRefresh) runOnJS(onRefresh)();
      } else {
        resetAnim();
      }
    });

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-width, 0, width], [-22, 0, 22]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  if (!topCard) return null;

  return (
    <View style={styles.stack}>
      {[...backCards].reverse().map((card, revIdx) => {
        const slot = backCards.length - revIdx;
        return (
          <BackCard key={card.id} card={card} slot={slot} dragX={translateX} />
        );
      })}

      {/* Top card — swipe gesture lives here */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, topCardStyle]}>
          {topCard.type === 'place' ? (
            <PlaceCardView card={topCard as PlaceCardType} />
          ) : (
            <EventCardView card={topCard as AnyEvent} />
          )}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <StampOverlay type={stamp} opacity={stampOpacity} />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Tappable overlay — same animation as card, outside GestureDetector.
          pointerEvents="box-none" means the container passes touches through to
          the GestureDetector below, but the Pressable children still receive taps. */}
      <Animated.View style={[styles.card, topCardStyle]} pointerEvents="box-none">
        {/* View Details / View Event bar at the bottom */}
        <Pressable
          style={styles.tapBar}
          onPress={handleDetailsPress}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
        />
        {/* Three equal tap zones over the hint row: details | going | nah */}
        <View style={styles.tapHints} pointerEvents="box-none">
          <Pressable
            style={styles.tapSection}
            onPress={handleDetailsPress}
            hitSlop={{ top: 10, bottom: 5, left: 8, right: 4 }}
          />
          <Pressable
            style={styles.tapSection}
            onPress={handleGoingPress}
            hitSlop={{ top: 10, bottom: 5, left: 4, right: 4 }}
          />
          <Pressable
            style={styles.tapSection}
            onPress={handleNahPress}
            hitSlop={{ top: 10, bottom: 5, left: 4, right: 8 }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tapBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 46,
  },
  tapHints: {
    position: 'absolute',
    bottom: 46,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
  },
  tapSection: {
    flex: 1,
  },
});
