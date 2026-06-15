import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSaved, SavedItem } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GAP = 12;
const PAD = 16;
const CARD_SIZE = (width - PAD * 2 - GAP) / 2;

type Filter = 'all' | 'place' | 'event';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'place', label: 'Places' },
  { key: 'event', label: 'Events' },
];

function getImage(item: SavedItem): string {
  const d = item.place_data as any;
  if (!d) return '';
  if (d.type === 'place') return d.photos?.[0] ?? '';
  if (d.source === 'eventbrite') return d.logo ?? '';
  return d.thumbnail ?? '';
}

function getName(item: SavedItem): string {
  const d = item.place_data as any;
  if (!d) return '';
  return d.type === 'place' ? d.name ?? '' : d.title ?? '';
}

function getVicinity(item: SavedItem): string {
  const d = item.place_data as any;
  if (!d) return '';
  if (d.type === 'place') return d.vicinity ?? '';
  return d.venue ?? '';
}

// Skeleton card
function SkeletonCard() {
  const op = useSharedValue(1);
  React.useEffect(() => {
    op.value = withTiming(0.4, { duration: 700 });
    const interval = setInterval(() => {
      op.value = op.value < 0.6
        ? withTiming(1, { duration: 700 })
        : withTiming(0.4, { duration: 700 });
    }, 700);
    return () => clearInterval(interval);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[skStyles.card, style]}>
      <View style={skStyles.img} />
      <View style={skStyles.meta}>
        <View style={skStyles.line1} />
        <View style={skStyles.line2} />
      </View>
    </Animated.View>
  );
}
const skStyles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    backgroundColor: Colors.glass,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  img: { width: '100%', height: CARD_SIZE * 0.85, backgroundColor: Colors.glassStrong },
  meta: { padding: 10, gap: 8 },
  line1: { height: 12, borderRadius: 6, backgroundColor: Colors.glassBorder, width: '80%' },
  line2: { height: 10, borderRadius: 5, backgroundColor: Colors.glassBorder, width: '45%' },
});

// Animated card wrapper that can fade+scale out on removal
interface AnimatedCardProps {
  item: SavedItem;
  onPress: () => void;
  onLongPress: () => void;
  onAnimateOut: (done: () => void) => void;
  triggerRemove: boolean;
}

function AnimatedCard({ item, onPress, onLongPress, onAnimateOut, triggerRemove }: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const height = useSharedValue(CARD_SIZE * 1.1 + 30); // approx card height

  React.useEffect(() => {
    if (!triggerRemove) return;
    scale.value = withSpring(0.85, { damping: 14, stiffness: 300 });
    opacity.value = withTiming(0, { duration: 250 });
    height.value = withTiming(0, { duration: 300 }, (done) => {
      if (done) runOnJS(onAnimateOut)(() => {});
    });
  }, [triggerRemove]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    height: height.value,
    overflow: 'hidden',
  }));

  const img = getImage(item);
  const name = getName(item);
  const vicinity = getVicinity(item);
  const isEvent = item.place_type === 'event';

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.85}
      >
        {img ? (
          <Image source={{ uri: img }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.imageFallback]}>
            <Text style={styles.fallbackEmoji}>{isEvent ? '🎉' : '📍'}</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(18,15,30,0.85)']}
          style={styles.cardGradient}
          pointerEvents="none"
        />
        <View style={styles.cardMeta}>
          <View style={[styles.typeBadge, isEvent ? styles.eventBadge : styles.placeBadge]}>
            <Text style={styles.typeBadgeText}>{isEvent ? 'EVENT' : 'PLACE'}</Text>
          </View>
          <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
          {!!vicinity && (
            <Text style={styles.cardVicinity} numberOfLines={1}>{vicinity}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SavedScreen() {
  const { user } = useAuth();
  const { saved, loading, unsave, reload } = useSaved(user?.id);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  // Track which item IDs are animating out
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  // Reload when tab focused
  useFocusEffect(
    useCallback(() => { reload(); }, [reload])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleLongPress = (item: SavedItem) => {
    const name = getName(item);
    Alert.alert(
      'Remove from Saved?',
      `"${name}" will be removed from your list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setRemoving((prev) => new Set(prev).add(item.place_id));
            // Give animation time before calling Supabase
            setTimeout(async () => {
              await unsave(item.place_id);
              setRemoved((prev) => new Set(prev).add(item.place_id));
              setRemoving((prev) => {
                const next = new Set(prev);
                next.delete(item.place_id);
                return next;
              });
            }, 300);
          },
        },
      ]
    );
  };

  const handleTap = (item: SavedItem) => {
    if (item.place_type === 'place') {
      router.push(`/place/${item.place_id}`);
    } else {
      router.push(`/event/${item.place_id}`);
    }
  };

  const filtered = (filter === 'all' ? saved : saved.filter((s) => s.place_type === filter))
    .filter((s) => !removed.has(s.place_id));

  const placesCount = saved.filter((s) => s.place_type === 'place').length;
  const eventsCount = saved.filter((s) => s.place_type === 'event').length;

  const emptyMessage =
    filter === 'place'
      ? { emoji: '📍', text: 'No places saved yet.\nSwipe right on a place to save it.' }
      : filter === 'event'
      ? { emoji: '🎉', text: 'No events saved yet.\nSwipe right on an event to save it.' }
      : { emoji: '★', text: 'Nothing saved yet.\nSwipe right to save places and events.' };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>SAVED</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{saved.length}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filters}>
        {FILTERS.map(({ key, label }) => {
          const count = key === 'all' ? saved.length : key === 'place' ? placesCount : eventsCount;
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading skeleton */}
      {loading && !refreshing && saved.length === 0 ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{emptyMessage.emoji}</Text>
          <Text style={styles.emptyText}>{emptyMessage.text}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <AnimatedCard
              item={item}
              onPress={() => handleTap(item)}
              onLongPress={() => handleLongPress(item)}
              triggerRemove={removing.has(item.place_id)}
              onAnimateOut={() => {}}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screenPad,
    paddingTop: Spacing.headerTop,
    paddingBottom: 12,
  },
  screenTitle: {
    fontFamily: Fonts.headline,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 4,
  },
  countBadge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
  },
  countText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
  },

  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPad,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  filterTextActive: { color: Colors.white, fontFamily: Fonts.bodySemiBold },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.muted },
  filterCountTextActive: { color: Colors.white },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD,
    gap: GAP,
  },
  listContent: {
    paddingHorizontal: PAD,
    paddingBottom: 110,
  },
  row: { gap: GAP, marginBottom: GAP },

  card: {
    width: CARD_SIZE,
    backgroundColor: Colors.glass,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: CARD_SIZE * 0.85 },
  imageFallback: {
    backgroundColor: Colors.glassStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: { fontSize: 40 },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_SIZE * 0.65,
  },
  cardMeta: { padding: 10, gap: 4 },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginBottom: 2,
  },
  placeBadge: { backgroundColor: Colors.primaryDim },
  eventBadge: { backgroundColor: 'rgba(100,100,255,0.2)' },
  typeBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  cardName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
    lineHeight: 18,
  },
  cardVicinity: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.mutedLight,
    marginTop: 1,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyEmoji: { fontSize: 52, color: Colors.muted },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
