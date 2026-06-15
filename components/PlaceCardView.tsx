import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PlaceCard } from '@/lib/places';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';

interface Props {
  card: PlaceCard;
}

const PRICE: Record<number, string> = { 0: '₹', 1: '₹', 2: '₹₹', 3: '₹₹₹', 4: '₹₹₹₹' };

export function PlaceCardView({ card }: Props) {
  const photo = card.photos?.[0];
  const price = PRICE[card.price_level] ?? '₹';
  const category = card.categories
    ?.filter((c) => !['establishment', 'point_of_interest', 'food', 'store'].includes(c))[0]
    ?.replace(/_/g, ' ') || 'place';

  return (
    <View style={styles.card}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['rgba(255,107,0,0.06)', 'rgba(18,15,30,0.9)']}
          style={[styles.image, styles.imageFallback]}
        >
          <Text style={styles.fallbackEmoji}>📍</Text>
        </LinearGradient>
      )}

      <LinearGradient
        colors={Gradients.cardOverlay}
        locations={[0, 0.42, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {card.opening_hours && (
          <View style={[
            styles.openBadge,
            card.opening_hours.open_now ? styles.openGreen : styles.openRed,
          ]}>
            <Text style={styles.openBadgeText}>
              {card.opening_hours.open_now ? '● OPEN' : '● CLOSED'}
            </Text>
          </View>
        )}

        <Text style={styles.name} numberOfLines={2}>{card.name}</Text>

        <View style={styles.metaRow}>
          {!!card.rating && (
            <Text style={styles.rating}>★ {card.rating.toFixed(1)}</Text>
          )}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.category}>{category}</Text>
        </View>

        {!!card.vicinity && (
          <Text style={styles.vicinity} numberOfLines={1}>📍 {card.vicinity}</Text>
        )}

        <View style={styles.hintRow}>
          <Text style={styles.hint}>↑ details</Text>
          <Text style={styles.hintGreen}>→ going ✓</Text>
          <Text style={styles.hintGrey}>✗ nah ←</Text>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(255,107,0,0.14)', 'rgba(255,107,0,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.detailBar}
      >
        <Text style={styles.detailBarText}>View Details</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  image: { width: '100%', height: '64%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackEmoji: { fontSize: 72 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '68%',
  },
  content: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: 5,
  },
  openBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  openGreen: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  openRed: { backgroundColor: Colors.errorDim, borderColor: Colors.error },
  openBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 34,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 38,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rating: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#FFD700' },
  dot: { color: Colors.muted, fontSize: 13 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  category: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  vicinity: { fontFamily: Fonts.body, fontSize: 12, color: Colors.mutedLight },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hint: { fontFamily: Fonts.body, fontSize: 11, color: Colors.mutedFaint },
  hintGreen: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(0,200,81,0.45)' },
  hintGrey: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(136,136,136,0.45)' },
  detailBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 13,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.2)',
  },
  detailBarText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary, letterSpacing: 0.5 },
});
