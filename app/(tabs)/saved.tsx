import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Fonts, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const COLS = 2;
const CARD_SIZE = (width - 48) / COLS;

type Filter = 'all' | 'place' | 'event';

export default function SavedScreen() {
  const { user } = useAuth();
  const { saved, loading, unsave } = useSaved(user?.id);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? saved : saved.filter((s) => s.place_type === filter);

  const handleLongPress = (id: string, name: string) => {
    Alert.alert('Unsave?', `Remove "${name}" from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unsave', style: 'destructive', onPress: () => unsave(id) },
    ]);
  };

  const handleTap = (item: any) => {
    if (item.place_type === 'place') router.push(`/place/${item.place_id}`);
    else router.push(`/event/${item.place_id}`);
  };

  const getImage = (item: any): string => {
    const d = item.place_data;
    if (!d) return '';
    if (d.type === 'place') return d.photos?.[0] || '';
    if (d.source === 'eventbrite') return d.logo || '';
    return d.thumbnail || '';
  };

  const getName = (item: any): string => {
    const d = item.place_data;
    if (!d) return '';
    if (d.type === 'place') return d.name || '';
    return d.title || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SAVED</Text>
        <Text style={styles.count}>{saved.length}</Text>
      </View>

      <View style={styles.filters}>
        {(['all', 'place', 'event'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'place' ? 'Places' : 'Events'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>★</Text>
          <Text style={styles.emptyText}>Nothing saved yet.{'\n'}Start swiping.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const img = getImage(item);
            const name = getName(item);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleTap(item)}
                onLongPress={() => handleLongPress(item.place_id, name)}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.imageFallback]}>
                    <Text style={styles.fallbackEmoji}>
                      {item.place_type === 'event' ? '🎉' : '📍'}
                    </Text>
                  </View>
                )}
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
                  <View style={[styles.typeBadge, item.place_type === 'event' ? styles.eventBadge : styles.placeBadge]}>
                    <Text style={styles.typeBadgeText}>
                      {item.place_type === 'event' ? 'EVENT' : 'PLACE'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { fontFamily: Fonts.headline, fontSize: 28, color: Colors.white, letterSpacing: 3 },
  count: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  filterTextActive: { color: Colors.white, fontFamily: Fonts.bodySemiBold },
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
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
  cardMeta: { padding: 10 },
  cardName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
    marginBottom: 6,
    lineHeight: 18,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  placeBadge: { backgroundColor: 'rgba(255,107,0,0.2)' },
  eventBadge: { backgroundColor: 'rgba(100,100,255,0.2)' },
  typeBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  empty: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 10 },
  emptyEmoji: { fontSize: 48, color: Colors.muted },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted, textAlign: 'center' as const, lineHeight: 22 },
});
