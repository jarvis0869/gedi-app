import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeed } from '@/hooks/useFeed';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { usePrivacy } from '@/hooks/usePrivacy';
import { CardStack } from '@/components/CardStack';
import { SkeletonStack } from '@/components/SkeletonStack';
import { GlowBackground } from '@/components/GlowBackground';
import { WarningToast } from '@/components/WarningToast';
import { SwipeTutorial } from '@/components/SwipeTutorial';
import { FeedCard } from '@/lib/feedMixer';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const { height } = Dimensions.get('window');
const PULL_THRESHOLD = 80;
const TUTORIAL_KEY = '@gedi_tutorial_seen';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cards, loading, error, warnings, load } = useFeed();
  const { save } = useSaved(user?.id);
  const { isGhost } = usePrivacy(user?.id);
  const [topIndex, setTopIndex] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didInit = useRef(false);

  // Pull-to-refresh shared values
  const pullY = useSharedValue(0);
  const refreshOpacity = useSharedValue(0);

  useNotifications(user?.id);

  // First load
  useFocusEffect(
    useCallback(() => {
      if (!didInit.current) {
        didInit.current = true;
        load(false);
        checkTutorial();
      }
    }, [])
  );

  // Reset stack on new cards
  useEffect(() => {
    if (cards.length > 0) setTopIndex(0);
  }, [cards]);

  // Show first warning only
  useEffect(() => {
    if (warnings.length > 0 && cards.length > 0) {
      setWarning(`Some sources unavailable. Showing partial results.`);
    }
  }, [warnings]);

  const checkTutorial = async () => {
    const seen = await AsyncStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      setShowTutorial(true);
      await AsyncStorage.setItem(TUTORIAL_KEY, '1');
    }
  };

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setTopIndex(0);
    await load(true);
    setIsRefreshing(false);
  }, [load]);

  // Pull-down-to-refresh gesture (only activates on downward drag)
  const pullGesture = Gesture.Pan()
    .activeOffsetY([10, 1000])
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        pullY.value = Math.min(e.translationY, PULL_THRESHOLD * 1.5);
        refreshOpacity.value = interpolate(pullY.value, [0, PULL_THRESHOLD], [0, 1]);
      }
    })
    .onEnd((_e) => {
      'worklet';
      if (pullY.value >= PULL_THRESHOLD) {
        runOnJS(doRefresh)();
      }
      pullY.value = withSpring(0, { damping: 18, stiffness: 200 });
      refreshOpacity.value = withTiming(0, { duration: 200 });
    });

  const pullIndicatorStyle = useAnimatedStyle(() => ({
    opacity: refreshOpacity.value,
    transform: [{ translateY: interpolate(pullY.value, [0, PULL_THRESHOLD], [-20, 0]) }],
  }));

  // Animated counter bounce on index change
  const counterScale = useSharedValue(1);
  useEffect(() => {
    counterScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  }, [topIndex]);
  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  // Rotate refresh icon when refreshing
  const refreshSpin = useSharedValue(0);
  useEffect(() => {
    if (isRefreshing) {
      refreshSpin.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(720, { duration: 600 }),
        withTiming(1080, { duration: 600 })
      );
    } else {
      refreshSpin.value = 0;
    }
  }, [isRefreshing]);
  const refreshIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshSpin.value}deg` }],
  }));

  const handleSwipeRight = useCallback(async (card: FeedCard) => {
    setTopIndex((i) => i + 1);
    save(card).catch(() => {});
  }, [save]);

  const handleSwipeLeft = useCallback(() => {
    setTopIndex((i) => i + 1);
  }, []);

  const handleSwipeUp = useCallback((card: FeedCard) => {
    if (card.type === 'place') {
      router.push(`/place/${(card as any).place_id}`);
    } else {
      router.push(`/event/${card.id}`);
    }
  }, [router]);

  const isEmpty = !loading && !error && cards.length === 0;
  const allSwiped = !loading && cards.length > 0 && topIndex >= cards.length;
  const showStack = !loading && !error && !isEmpty && !allSwiped;

  return (
    <GestureDetector gesture={pullGesture}>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255,107,0,0.055)', Colors.bg]}
          locations={[0, 0.45]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Pull-to-refresh indicator */}
        <Animated.View style={[styles.pullIndicator, pullIndicatorStyle]} pointerEvents="none">
          <Text style={styles.pullText}>↓ Release to refresh</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logo}>GEDI</Text>
            {isGhost && (
              <View style={styles.ghostBadge}>
                <Text style={styles.ghostBadgeText}>👻 Ghost</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={styles.locationPill}>
              <View style={styles.greenDot} />
              <Text style={styles.locationText}>Hauz Khas Village</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={doRefresh}
              disabled={isRefreshing || loading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.Text style={[styles.refreshIcon, refreshIconStyle]}>↻</Animated.Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Counter */}
        {showStack && (
          <Animated.View style={[styles.counter, counterStyle]}>
            <Text style={styles.counterText}>
              {topIndex + 1}
              <Text style={styles.counterOf}> / {cards.length}</Text>
            </Text>
          </Animated.View>
        )}

        {/* Warning toast */}
        {warning && (
          <WarningToast message={warning} onDismiss={() => setWarning(null)} />
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.stackArea}>
            <GlowBackground intensity="soft" yOffset={height * 0.46} />
            <SkeletonStack />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.stateEmoji}>⚡</Text>
            <Text style={styles.stateTitle}>Couldn't load feed</Text>
            <Text style={styles.stateSubtitle}>Check your connection and try again</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => load(true)} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {isEmpty && (
          <View style={styles.centered}>
            <Text style={styles.stateEmoji}>🌃</Text>
            <Text style={styles.stateTitle}>Quiet night in HKV</Text>
            <Text style={styles.stateSubtitle}>Nothing nearby right now. Check back soon.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => load(true)} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* All swiped */}
        {allSwiped && (
          <View style={styles.centered}>
            <Text style={styles.stateEmoji}>🎉</Text>
            <Text style={styles.stateTitle}>You've seen it all!</Text>
            <Text style={styles.stateSubtitle}>
              New places and events tomorrow.{'\n'}Check Saved for your shortlist.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { setTopIndex(0); load(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card stack */}
        {showStack && (
          <View style={styles.stackArea}>
            <GlowBackground intensity="soft" yOffset={height * 0.46} />
            <CardStack
              cards={cards}
              topIndex={topIndex}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
            />
            <SwipeTutorial visible={showTutorial && topIndex === 0} />
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  pullIndicator: {
    position: 'absolute',
    top: Spacing.headerTop + 8,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pullText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPad,
    paddingTop: Spacing.headerTop,
    paddingBottom: 8,
    zIndex: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghostBadge: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ghostBadgeText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.mutedLight },
  logo: {
    fontFamily: Fonts.headline,
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: 5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  locationText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: { fontSize: 16, color: Colors.muted },

  counter: {
    position: 'absolute',
    top: Spacing.headerTop + 44,
    alignSelf: 'center',
    zIndex: 1,
  },
  counterText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 1,
  },
  counterOf: { color: Colors.mutedLight },

  stackArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  stateEmoji: { fontSize: 56, marginBottom: 4 },
  stateTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 20,
    color: Colors.white,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 100,
  },
  actionBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
