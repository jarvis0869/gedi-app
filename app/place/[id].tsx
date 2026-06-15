import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchPlaceDetails, PlaceDetail } from '@/lib/places';
import { useCheckin } from '@/hooks/useCheckin';
import { useAuth } from '@/hooks/useAuth';
import { CheckinSuccess } from '@/components/CheckinSuccess';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

function Stars({ rating }: { rating: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[starStyles.star, n <= Math.round(rating) && starStyles.filled]}>
          ★
        </Text>
      ))}
      <Text style={starStyles.label}>{rating.toFixed(1)}</Text>
    </View>
  );
}
const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { fontSize: 16, color: Colors.glassBorder },
  filled: { color: '#FFD700' },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFD700', marginLeft: 4 },
});

function PriceLevel({ level }: { level: number }) {
  const str = '₹'.repeat(Math.max(1, level));
  const grey = '₹'.repeat(Math.max(0, 4 - Math.max(1, level)));
  return (
    <Text style={priceStyles.text}>
      <Text style={priceStyles.active}>{str}</Text>
      <Text style={priceStyles.inactive}>{grey}</Text>
    </Text>
  );
}
const priceStyles = StyleSheet.create({
  text: { fontSize: 14 },
  active: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  inactive: { color: Colors.mutedFaint },
});

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { checkin, loading: checkinLoading, result, clearResult } = useCheckin(user?.id);
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPlaceDetails(id)
      .then(setPlace)
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (result === 'success') {
      setShowSuccess(true);
      clearResult();
    } else if (result === 'too_far') {
      clearResult();
    } else if (result === 'already') {
      clearResult();
    }
  }, [result]);

  const openMaps = () => {
    if (!place?.lat || !place?.lng) return;
    const query = encodeURIComponent(place.name);
    const url = Platform.select({
      ios: `maps://app?q=${query}&ll=${place.lat},${place.lng}`,
      android: `geo:${place.lat},${place.lng}?q=${query}`,
      default: `https://maps.google.com/?q=${place.lat},${place.lng}`,
    });
    Linking.openURL(url!);
  };

  const handleShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        title: place.name,
        message: `Check out ${place.name} on Gedi!\nhttps://gediapp.in/place/${id}`,
        url: `gedi://place/${id}`,
      });
    } catch {}
  };

  const handleCheckin = () => {
    if (!place) return;
    checkin(id!, place.name, place.lat, place.lng);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setPhotoIdx(idx);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>{error || 'Place not found'}</Text>
        <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
          <Text style={styles.backFabText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = place.photos ?? [];
  const category = place.categories
    ?.filter((c) => !['establishment', 'point_of_interest', 'food', 'store'].includes(c))[0]
    ?.replace(/_/g, ' ') ?? '';
  const isOpen = place.opening_hours?.open_now;
  const todayHours = place.hours_text?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <View style={styles.container}>
      {showSuccess && (
        <CheckinSuccess points={10} onDone={() => setShowSuccess(false)} />
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
        <Text style={styles.backFabText}>←</Text>
      </TouchableOpacity>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <View>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `photo-${i}`}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
              )}
            />
            {/* Dots */}
            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === photoIdx && styles.dotActive,
                      Math.abs(i - photoIdx) > 3 && { display: 'none' },
                    ]}
                  />
                ))}
              </View>
            )}
            <LinearGradient
              colors={['rgba(18,15,30,0)', 'rgba(18,15,30,0.98)']}
              style={styles.photoGradient}
              pointerEvents="none"
            />
          </View>
        ) : (
          <LinearGradient
            colors={['rgba(255,107,0,0.08)', 'rgba(18,15,30,0.95)']}
            style={styles.photoFallback}
          >
            <Text style={styles.photoFallbackEmoji}>📍</Text>
          </LinearGradient>
        )}

        <View style={styles.content}>
          {/* Name + status */}
          <View style={styles.nameRow}>
            {isOpen !== undefined && (
              <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
                <View style={[styles.statusDot, isOpen ? styles.openDot : styles.closedDot]} />
                <Text style={styles.statusText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{place.name}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {!!place.rating && <Stars rating={place.rating} />}
            {!!place.price_level && (
              <>
                <Text style={styles.metaSep}>·</Text>
                <PriceLevel level={place.price_level} />
              </>
            )}
            {!!category && (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.category}>{category}</Text>
              </>
            )}
          </View>

          {/* Address */}
          {!!place.formatted_address && (
            <TouchableOpacity onPress={openMaps} style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText} numberOfLines={2}>{place.formatted_address}</Text>
            </TouchableOpacity>
          )}

          {/* Phone */}
          {!!place.formatted_phone_number && (
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => Linking.openURL(`tel:${place.formatted_phone_number}`)}
            >
              <Text style={styles.addressIcon}>📞</Text>
              <Text style={[styles.addressText, styles.link]}>{place.formatted_phone_number}</Text>
            </TouchableOpacity>
          )}

          {/* Today's hours */}
          {!!todayHours && (
            <GlassCard style={styles.hoursCard}>
              <Text style={styles.hoursTitle}>TODAY</Text>
              <Text style={styles.hoursText}>{todayHours}</Text>
            </GlassCard>
          )}

          {/* Full hours */}
          {place.hours_text && place.hours_text.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OPENING HOURS</Text>
              <GlassCard>
                {place.hours_text.map((line, i) => (
                  <View
                    key={i}
                    style={[
                      styles.hoursRow,
                      i < place.hours_text!.length - 1 && styles.hoursRowBorder,
                    ]}
                  >
                    <Text style={styles.hoursDay}>{line.split(': ')[0]}</Text>
                    <Text style={styles.hoursTime}>{line.split(': ')[1] ?? ''}</Text>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Reviews */}
          {place.reviews && place.reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>REVIEWS</Text>
              <View style={styles.reviewsStack}>
                {place.reviews.slice(0, 3).map((r, i) => (
                  <GlassCard key={i} style={styles.review}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {r.author_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                        <Text style={styles.reviewTime}>{r.relative_time_description}</Text>
                      </View>
                      <Stars rating={r.rating} />
                    </View>
                    {!!r.text && (
                      <Text style={styles.reviewText} numberOfLines={5}>{r.text}</Text>
                    )}
                  </GlassCard>
                ))}
              </View>
            </View>
          )}

          {/* Website */}
          {!!place.website && (
            <TouchableOpacity
              style={styles.websiteRow}
              onPress={() => Linking.openURL(place.website!)}
            >
              <Text style={styles.websiteIcon}>🌐</Text>
              <Text style={styles.websiteText} numberOfLines={1}>{place.website}</Text>
            </TouchableOpacity>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnDirections} onPress={openMaps} activeOpacity={0.85}>
              <LinearGradient
                colors={['#FF8C00', '#FF6B00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnPrimaryText}>📍 Get Directions</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnShare} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.btnSecondaryText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Check in */}
          <TouchableOpacity
            style={[styles.checkinBtn, checkinLoading && styles.btnDisabled]}
            onPress={handleCheckin}
            disabled={checkinLoading}
            activeOpacity={0.85}
          >
            {checkinLoading ? (
              <ActivityIndicator color={Colors.success} size="small" />
            ) : (
              <Text style={styles.checkinText}>📍 Check In  ·  +10 pts</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },

  backFab: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26,22,40,0.85)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backFabText: { fontSize: 20, color: Colors.white },

  photo: { width, height: width * 0.72 },
  photoFallback: {
    width,
    height: width * 0.72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFallbackEmoji: { fontSize: 80 },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },

  content: { padding: Spacing.screenPad, paddingBottom: 60 },

  nameRow: { marginBottom: 6 },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  openBadge: { backgroundColor: Colors.successDim, borderColor: Colors.success },
  closedBadge: { backgroundColor: Colors.errorDim, borderColor: Colors.error },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  openDot: { backgroundColor: Colors.success },
  closedDot: { backgroundColor: Colors.error },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.white, letterSpacing: 0.5 },

  name: {
    fontFamily: Fonts.headline,
    fontSize: 42,
    color: Colors.white,
    letterSpacing: 1,
    lineHeight: 46,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaSep: { color: Colors.muted, fontSize: 14 },
  category: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textTransform: 'capitalize',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  addressIcon: { fontSize: 14, marginTop: 2 },
  addressText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted, flex: 1, lineHeight: 20 },
  link: { color: Colors.primary },

  hoursCard: {
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 2,
  },
  hoursText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hoursRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  hoursDay: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.white, width: 100 },
  hoursTime: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, flex: 1, textAlign: 'right' },

  reviewsStack: { gap: 10 },
  review: { padding: 14 },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.primary },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.white },
  reviewTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.mutedLight, marginTop: 1 },
  reviewText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
  },

  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  websiteIcon: { fontSize: 14 },
  websiteText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.primary, flex: 1 },

  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnDirections: { flex: 1, borderRadius: Radius.button, overflow: 'hidden' },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  btnShare: {
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.muted },

  checkinBtn: {
    backgroundColor: Colors.successDim,
    borderWidth: 1.5,
    borderColor: Colors.success,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  checkinText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.success, letterSpacing: 0.3 },
  btnDisabled: { opacity: 0.5 },
});
