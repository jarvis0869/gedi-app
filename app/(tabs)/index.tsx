import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFeed } from '@/hooks/useFeed';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { CardStack } from '@/components/CardStack';
import { SkeletonCard } from '@/components/SkeletonCard';
import { GlowBackground } from '@/components/GlowBackground';
import { FeedCard } from '@/lib/feedMixer';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cards, loading, error, load } = useFeed();
  const { save } = useSaved(user?.id);
  const [topIndex, setTopIndex] = useState(0);

  useNotifications(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (cards.length === 0) load();
    }, [])
  );

  // Reset stack index when feed refreshes
  useEffect(() => {
    if (cards.length > 0) setTopIndex(0);
  }, [cards]);

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,107,0,0.055)', Colors.bg]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>GEDI</Text>
        <View style={styles.locationPill}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText}>Hauz Khas Village</Text>
        </View>
      </View>

      {/* Feed counter */}
      {!loading && cards.length > 0 && !allSwiped && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {topIndex + 1} / {cards.length}
          </Text>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.stackArea}>
          <GlowBackground intensity="soft" yOffset={height * 0.46} />
          <SkeletonCard />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyTitle}>Couldn't load feed</Text>
          <Text style={styles.emptySubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty */}
      {isEmpty && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌃</Text>
          <Text style={styles.emptyTitle}>Quiet night in HKV</Text>
          <Text style={styles.emptySubtitle}>Nothing nearby right now. Check back soon.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)} activeOpacity={0.8}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All swiped */}
      {allSwiped && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>You've seen it all!</Text>
          <Text style={styles.emptySubtitle}>New places and events tomorrow. Check Saved for your list.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setTopIndex(0); load(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card stack */}
      {!loading && !error && !isEmpty && !allSwiped && (
        <View style={styles.stackArea}>
          <GlowBackground intensity="soft" yOffset={height * 0.46} />
          <CardStack
            cards={cards}
            topIndex={topIndex}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onSwipeUp={handleSwipeUp}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPad,
    paddingTop: Spacing.headerTop,
    paddingBottom: 8,
    zIndex: 1,
  },
  logo: {
    fontFamily: Fonts.headline,
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: 5,
  },
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
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  locationText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  counter: {
    position: 'absolute',
    top: Spacing.headerTop + 44,
    alignSelf: 'center',
    zIndex: 1,
  },
  counterText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.mutedLight,
    letterSpacing: 1,
  },
  stackArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 20,
    color: Colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 100,
  },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
