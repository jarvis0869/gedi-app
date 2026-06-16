import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { Colors, Fonts } from '@/constants/theme';

export type AnyEvent = SerpEvent | EventbriteCard;

const { width } = Dimensions.get('window');

const SWIPE_X = 80;
const SWIPE_VX = 400;

interface Props {
  cards: FeedCard[];
  topIndex: number;
  onSwipeRight: (card: FeedCard) => void;
  onSwipeLeft: (card: FeedCard) => void;
  onSwipeUp: (card: FeedCard) => void;
  onRefresh?: () => void;
  onIndexChange?: (index: number) => void;
}

// Individual full-screen card with horizontal swipe for going/nah
function ScrollCard({
  card,
  pageHeight,
  onGoing,
  onNah,
  onDetails,
}: {
  card: FeedCard;
  pageHeight: number;
  onGoing: () => void;
  onNah: () => void;
  onDetails: () => void;
}) {
  const translateX = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const stamp = useSharedValue<'going' | 'nah' | null>(null);
  const didCrossThreshold = useSharedValue(false);

  const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const resetAnim = () => {
    'worklet';
    translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
    stampOpacity.value = withTiming(0, { duration: 120 });
    stamp.value = null;
    didCrossThreshold.value = false;
  };

  // Horizontal-only gesture: failOffsetY ensures vertical scroll passes to FlatList
  const gesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;

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

      const absX = Math.abs(e.translationX);
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
      didCrossThreshold.value = false;

      if (swipedRight) {
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        translateX.value = withTiming(width * 1.5, { duration: 240 }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            stamp.value = null;
            runOnJS(onGoing)();
          }
        });
      } else if (swipedLeft) {
        stampOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(hapticMedium)();
        translateX.value = withTiming(-width * 1.5, { duration: 240 }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            stamp.value = null;
            runOnJS(onNah)();
          }
        });
      } else {
        resetAnim();
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ width, height: pageHeight }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
          {card.type === 'place' ? (
            <PlaceCardView card={card as PlaceCardType} />
          ) : (
            <EventCardView card={card as AnyEvent} />
          )}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <StampOverlay type={stamp} opacity={stampOpacity} />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Tap overlay — outside GestureDetector so taps always work.
          pointerEvents="box-none": container passes touches to GestureDetector,
          but Pressable children still receive taps. */}
      <Animated.View style={[StyleSheet.absoluteFill, cardStyle]} pointerEvents="box-none">
        <Pressable
          style={styles.tapBar}
          onPress={onDetails}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
        />
        <View style={styles.tapHints} pointerEvents="box-none">
          <Pressable style={styles.tapSection} onPress={onDetails}
            hitSlop={{ top: 10, bottom: 5, left: 8, right: 4 }} />
          <Pressable style={styles.tapSection} onPress={onGoing}
            hitSlop={{ top: 10, bottom: 5, left: 4, right: 4 }} />
          <Pressable style={styles.tapSection} onPress={onNah}
            hitSlop={{ top: 10, bottom: 5, left: 4, right: 8 }} />
        </View>
      </Animated.View>
    </View>
  );
}

export function CardStack({
  cards,
  topIndex,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onRefresh,
  onIndexChange,
}: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [pageHeight, setPageHeight] = useState(0);
  const currentIndexRef = useRef(0);

  // Scroll to top when parent signals a reset (e.g., after refresh)
  useEffect(() => {
    if (topIndex === 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [topIndex]);

  // After new cards load, always reset to top
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [cards]);

  const scrollToNext = useCallback(() => {
    const next = currentIndexRef.current + 1;
    if (next < cards.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, [cards.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        currentIndexRef.current = idx;
        onIndexChange?.(idx);
      }
    },
    [onIndexChange]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: pageHeight, offset: pageHeight * index, index }),
    [pageHeight]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedCard }) => (
      <ScrollCard
        card={item}
        pageHeight={pageHeight}
        onGoing={() => { onSwipeRight(item); scrollToNext(); }}
        onNah={() => { onSwipeLeft(item); scrollToNext(); }}
        onDetails={() => onSwipeUp(item)}
      />
    ),
    [pageHeight, onSwipeRight, onSwipeLeft, onSwipeUp, scrollToNext]
  );

  const ListFooter = useCallback(() => (
    <View style={[styles.footer, { height: pageHeight }]}>
      <Text style={styles.footerEmoji}>🎉</Text>
      <Text style={styles.footerTitle}>You've seen it all!</Text>
      <Text style={styles.footerSub}>
        New places & events tomorrow.{'\n'}Check Saved for your shortlist.
      </Text>
      {onRefresh && (
        <Pressable style={styles.restartBtn} onPress={onRefresh}>
          <Text style={styles.restartBtnText}>Start Over</Text>
        </Pressable>
      )}
    </View>
  ), [pageHeight, onRefresh]);

  return (
    <View style={styles.container} onLayout={e => setPageHeight(e.nativeEvent.layout.height)}>
      {pageHeight > 0 && (
        <FlatList
          ref={flatListRef}
          data={cards}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          ListFooterComponent={ListFooter}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Transparent tap targets positioned over hint row and detail bar
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
  tapSection: { flex: 1 },

  footer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
    backgroundColor: Colors.bg,
  },
  footerEmoji: { fontSize: 56 },
  footerTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 22,
    color: Colors.white,
    textAlign: 'center',
  },
  footerSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  restartBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 100,
  },
  restartBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
