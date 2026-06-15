import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFeed } from '@/hooks/useFeed';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { GlowBackground } from '@/components/GlowBackground';
import { FeedCard } from '@/lib/feedMixer';
import { PlaceCard as PlaceCardType } from '@/lib/places';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const { user } = useAuth();
  const { cards, loading, error, load, setCards } = useFeed();
  const { save } = useSaved(user?.id);
  const [topIndex, setTopIndex] = useState(0);

  useNotifications(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (cards.length === 0) load();
    }, [])
  );

  const handleSwipeRight = useCallback(async (card: FeedCard) => {
    await save(card);
    setTopIndex((i) => i + 1);
  }, [save]);

  const handleSwipeLeft = useCallback(() => {
    setTopIndex((i) => i + 1);
  }, []);

  const visibleCards = cards.slice(topIndex, topIndex + 4);
  const isEmpty = !loading && !error && cards.length === 0;
  const allSwiped = !loading && cards.length > 0 && topIndex >= cards.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,107,0,0.06)', Colors.bg, Colors.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>GEDI</Text>
        </View>
        <View style={styles.locationPill}>
          <Text style={styles.locationDot}>●</Text>
          <Text style={styles.locationText}>Hauz Khas Village</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.stack}>
          <GlowBackground intensity="soft" yOffset={height * 0.45} />
          <SkeletonCard />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyTitle}>Couldn't load feed</Text>
          <Text style={styles.emptySubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEmpty && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌃</Text>
          <Text style={styles.emptyTitle}>Quiet night in HKV</Text>
          <Text style={styles.emptySubtitle}>Nothing nearby right now. Check back soon.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {allSwiped && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>You've seen it all!</Text>
          <Text style={styles.emptySubtitle}>Check back tomorrow for new places and events.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setTopIndex(0); load(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !isEmpty && !allSwiped && (
        <View style={styles.stack}>
          <GlowBackground intensity="soft" yOffset={height * 0.45} />
          {[...visibleCards].reverse().map((card, revIdx) => {
            const idx = visibleCards.length - 1 - revIdx;
            const isTop = idx === 0;
            if (card.type === 'place') {
              return (
                <PlaceCard
                  key={card.id}
                  card={card as PlaceCardType}
                  isTop={isTop}
                  index={idx}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              );
            }
            return (
              <EventCard
                key={card.id}
                card={card as any}
                isTop={isTop}
                index={idx}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
              />
            );
          })}
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
    paddingBottom: 10,
    zIndex: 1,
  },
  logoText: {
    fontFamily: Fonts.headline,
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: 5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  locationDot: { fontSize: 8, color: Colors.success },
  locationText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 100,
  },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
