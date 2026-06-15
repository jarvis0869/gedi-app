import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchPlaceDetails, getPhotoUrl } from '@/lib/places';
import { useCheckin } from '@/hooks/useCheckin';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Fonts, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { checkin, loading: checkinLoading, result, clearResult } = useCheckin(user?.id);
  const [place, setPlace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchPlaceDetails(id).then((data) => { setPlace(data); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (result === 'success') {
      Alert.alert('Checked In! 🎉', '+10 points earned', [{ text: 'Nice!', onPress: clearResult }]);
    } else if (result === 'too_far') {
      Alert.alert('Too Far Away', 'You need to be at the place to check in.', [{ text: 'OK', onPress: clearResult }]);
    } else if (result === 'already') {
      Alert.alert('Already Checked In', 'You\'ve already checked in here today.', [{ text: 'OK', onPress: clearResult }]);
    }
  }, [result]);

  const openMaps = () => {
    if (!place?.geometry?.location) return;
    const { lat, lng } = place.geometry.location;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${place?.name} on Gedi!`,
      url: `gedi://place/${id}`,
    });
  };

  const handleCheckin = () => {
    if (!place?.geometry?.location) return;
    checkin(id!, place.name, place.geometry.location.lat, place.geometry.location.lng);
  };

  const photos: string[] = (place?.photos || [])
    .slice(0, 8)
    .map((ph: any) => getPhotoUrl(ph.photo_reference));

  const priceStr = place?.price_level ? '₹'.repeat(place.price_level) : '';
  const isOpen = place?.opening_hours?.open_now;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <FlatList
          data={photos.length > 0 ? photos : ['placeholder']}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item}-${i}`}
          onScroll={(e) =>
            setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) =>
            item === 'placeholder' ? (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.photoEmoji}>📍</Text>
              </View>
            ) : (
              <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            )
          }
        />
        {photos.length > 1 && (
          <View style={styles.dotRow}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{place?.name}</Text>

          <View style={styles.metaRow}>
            {!!place?.rating && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>★ {place.rating.toFixed(1)}</Text>
              </View>
            )}
            {!!priceStr && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{priceStr}</Text>
              </View>
            )}
            <View style={[styles.badge, isOpen ? styles.openBadge : styles.closedBadge]}>
              <Text style={styles.badgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
            </View>
          </View>

          {!!place?.formatted_address && (
            <Text style={styles.address}>{place.formatted_address}</Text>
          )}

          {place?.opening_hours?.weekday_text && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOURS</Text>
              {place.opening_hours.weekday_text.map((line: string, i: number) => (
                <Text key={i} style={styles.hoursLine}>{line}</Text>
              ))}
            </View>
          )}

          {place?.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>REVIEWS</Text>
              {place.reviews.slice(0, 3).map((r: any, i: number) => (
                <View key={i} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                    <Text style={styles.reviewRating}>★ {r.rating}</Text>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={4}>{r.text}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
              <Text style={styles.actionBtnText}>Get Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleShare}>
              <Text style={styles.actionBtnSecondaryText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.checkinBtn, checkinLoading && styles.btnDisabled]}
            onPress={handleCheckin}
            disabled={checkinLoading}
          >
            <Text style={styles.checkinBtnText}>
              {checkinLoading ? 'Checking in…' : '📍 Check In (+10 pts)'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,22,40,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 20, color: Colors.white },
  photo: { width, height: width * 0.75 },
  photoFallback: { backgroundColor: Colors.glassStrong, justifyContent: 'center', alignItems: 'center' },
  photoEmoji: { fontSize: 80 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.muted },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
  content: { padding: 20, paddingBottom: 48 },
  name: {
    fontFamily: Fonts.headline,
    fontSize: 40,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 14,
    lineHeight: 44,
  },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  badge: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  openBadge: { borderColor: '#00C851', backgroundColor: 'rgba(0,200,81,0.1)' },
  closedBadge: { borderColor: Colors.error, backgroundColor: 'rgba(255,68,68,0.1)' },
  badgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.white },
  address: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted, marginBottom: 20, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  hoursLine: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, lineHeight: 22 },
  review: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.small,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.white },
  reviewRating: { fontFamily: Fonts.body, fontSize: 13, color: '#FFD700' },
  reviewText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  actionBtnSecondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.muted },
  checkinBtn: {
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  checkinBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.primary },
});
