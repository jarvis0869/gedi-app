import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
import { track } from '@/lib/analytics';
import { GlowBackground } from '@/components/GlowBackground';
import { WarningToast } from '@/components/WarningToast';
import { SwipeTutorial } from '@/components/SwipeTutorial';
import { FeedCard } from '@/lib/feedMixer';
import { PlaceCard } from '@/lib/places';
import { EventbriteCard } from '@/lib/eventbrite';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const { height } = Dimensions.get('window');
const TUTORIAL_KEY = '@gedi_tutorial_seen';

type FeedFilter = 'all' | 'places' | 'events' | 'open' | 'free';
const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'places', label: 'Places' },
  { key: 'events', label: 'Events' },
  { key: 'open', label: 'Open Now' },
  { key: 'free', label: 'Free' },
];

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
  const [filter, setFilter] = useState<FeedFilter>('all');
  const didInit = useRef(false);

  useNotifications(user?.id);

  // First load
  useFocusEffect(
    useCallback(() => {
      if (!didInit.current) {
        didInit.current = true;
        load(false).then(() => track('feed_load', { trigger: 'initial' }));
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
    track('feed_load', { trigger: 'refresh' });
    setIsRefreshing(false);
  }, [load]);

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
    save(card).catch(() => {});
  }, [save]);

  const handleSwipeLeft = useCallback(() => {}, []);

  const handleSwipeUp = useCallback((card: FeedCard) => {
    if (card.type === 'place') {
      router.push(`/place/${card.id}`);
    } else {
      router.push(`/event/${card.id}`);
    }
  }, [router]);

  const filteredCards = useMemo(() => {
    switch (filter) {
      case 'places':
        return cards.filter((c) => c.type === 'place');
      case 'events':
        return cards.filter((c) => c.type === 'event');
      case 'open':
        return cards.filter((c) => {
          if (c.type === 'place') return (c as PlaceCard).opening_hours?.open_now === true;
          return true;
        });
      case 'free':
        return cards.filter((c) => {
          if (c.type !== 'event') return true;
          const eb = c as EventbriteCard;
          return eb.source !== 'eventbrite' || eb.is_free === true;
        });
      default:
        return cards;
    }
  }, [cards, filter]);

  const isEmpty = !loading && !error && filteredCards.length === 0;
  const showStack = !loading && !error && !isEmpty;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,107,0,0.055)', Colors.bg]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

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

      {showStack && (
        <Animated.View style={[styles.counter, counterStyle]}>
          <Text style={styles.counterText}>
            {topIndex + 1}
            <Text style={styles.counterOf}> / {filteredCards.length}</Text>
          </Text>
        </Animated.View>
      )}

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => { setFilter(key); setTopIndex(0); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {warning && (
        <WarningToast message={warning} onDismiss={() => setWarning(null)} />
      )}

      <View style={styles.content}>
          {loading && (
            <View style={styles.stackArea}>
              <GlowBackground intensity="soft" yOffset={height * 0.46} />
              <SkeletonStack />
            </View>
          )}

          {!loading && error && (
            <View style={styles.centered}>
              <Text style={styles.stateEmoji}>⚡</Text>
              <Text style={styles.stateTitle}>Couldn't load feed</Text>
              <Text style={styles.stateSubtitle}>Check your connection and try again</Text>
              <Pressable style={styles.actionBtn} onPress={() => load(true)}>
                <Text style={styles.actionBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {isEmpty && (
            <View style={styles.centered}>
              <Text style={styles.stateEmoji}>🌃</Text>
              <Text style={styles.stateTitle}>Quiet night in HKV</Text>
              <Text style={styles.stateSubtitle}>Nothing nearby right now. Check back soon.</Text>
              <Pressable style={styles.actionBtn} onPress={() => load(true)}>
                <Text style={styles.actionBtnText}>Refresh</Text>
              </Pressable>
            </View>
          )}

          {showStack && (
            <CardStack
              cards={filteredCards}
              topIndex={topIndex}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
              onRefresh={doRefresh}
              onIndexChange={(idx) => setTopIndex(idx)}
            />
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1 },

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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPad,
    paddingBottom: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  filterPillTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },

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
