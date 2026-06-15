/**
 * CardStack — coordinates swipe animations across the card stack.
 *
 * Top card: user-driven pan gesture with rotation following finger.
 * Cards 1-3 behind: animated in real-time by the top card's translateX,
 * so the stack feels alive while dragging (not just after swipe completes).
 * Haptic feedback fires when crossing the swipe threshold.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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
const SPRING_BACK = { damping: 20, stiffness: 220, mass: 0.9 };

interface Props {
  cards: FeedCard[];
  topIndex: number;
  onSwipeRight: (card: FeedCard) => void;
  onSwipeLeft: (card: FeedCard) => void;
  onSwipeUp: (card: FeedCard) => void;
}

// Isolated component so useAnimatedStyle is called at component top-level
function BackCard({
  card,
  slot,
  dragX,
}: {
  card: FeedCard;
  slot: number;
  dragX: Animated.SharedValue<number>;
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

export function CardStack({ cards, topIndex, onSwipeRight, onSwipeLeft, onSwipeUp }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const stamp = useSharedValue<'going' | 'nah' | null>(null);
  const didCrossThreshold = useSharedValue(false);

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

      const card = cards[topIndex];
      didCrossThreshold.value = false;

      if (!card) { resetAnim(); return; }

      if (swipedRight) {
        const speed = Math.max(e.velocityX, 900);
        const dur = Math.min(300, Math.round(1400 / (speed / 400)));
        translateX.value = withTiming(width * 1.6, { duration: dur });
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        runOnJS(onSwipeRight)(card);
      } else if (swipedLeft) {
        const speed = Math.max(-e.velocityX, 900);
        const dur = Math.min(300, Math.round(1400 / (speed / 400)));
        translateX.value = withTiming(-width * 1.6, { duration: dur });
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        runOnJS(onSwipeLeft)(card);
      } else if (swipedUp) {
        runOnJS(onSwipeUp)(card);
        resetAnim();
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

  const visible = cards.slice(topIndex, topIndex + 4);
  const topCard = visible[0];
  const backCards = visible.slice(1);

  if (!topCard) return null;

  return (
    <View style={styles.stack}>
      {/* Back cards bottom to top (slot 3 first, slot 1 last) */}
      {[...backCards].reverse().map((card, revIdx) => {
        const slot = backCards.length - revIdx; // slot 1 = directly behind top
        return (
          <BackCard key={card.id} card={card} slot={slot} dragX={translateX} />
        );
      })}

      {/* Top card with gesture */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, topCardStyle]}>
          {topCard.type === 'place' ? (
            <PlaceCardView card={topCard as PlaceCardType} />
          ) : (
            <EventCardView card={topCard as AnyEvent} />
          )}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <StampOverlay type={stamp.value} opacity={stampOpacity} />
          </View>
        </Animated.View>
      </GestureDetector>
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
});
