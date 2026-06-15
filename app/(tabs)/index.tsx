import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useFeed } from '@/hooks/useFeed';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { PlaceCard } from '@/components/PlaceCard';
import { EventCard } from '@/components/EventCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedCard } from '@/lib/feedMixer';
import { PlaceCard as PlaceCardType } from '@/lib/places';
import { Colors, Fonts } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

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

  const handleSwipeRight = useCallback(
    async (card: FeedCard) => {
      await save(card);
      setTopIndex((i) => i + 1);
    },
    [save]
  );

  const handleSwipeLeft = useCallback((card: FeedCard) => {
    setTopIndex((i) => i + 1);
  }, []);

  const visibleCards = cards.slice(topIndex, topIndex + 4);
  const isEmpty = !loading && cards.length === 0;
  const allSwiped = !loading && cards.length > 0 && topIndex >= cards.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>GEDI</Text>
        <Text style={styles.location}>Hauz Khas Village</Text>
      </View>

      {loading && (
        <View style={styles.stack}>
          <SkeletonCard />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn't load feed</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEmpty && !error && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌃</Text>
          <Text style={styles.emptyText}>Nothing nearby right now</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {allSwiped && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>You've seen everything!</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setTopIndex(0); load(); }}>
            <Text style={styles.retryText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !isEmpty && !allSwiped && (
        <View style={styles.stack}>
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  logoText: {
    fontFamily: Fonts.headline,
    fontSize: 28,
    color: Colors.primary,
    letterSpacing: 4,
  },
  location: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
  },
  emptyEmoji: { fontSize: 64 },
  emptyText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
  },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
