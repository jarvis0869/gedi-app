import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFeed } from '@/hooks/useFeed';
import { PlaceCard } from '@/lib/places';
import { Colors, Fonts } from '@/constants/theme';

const HKV_REGION: Region = {
  latitude: 28.5535,
  longitude: 77.2018,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export default function MapScreen() {
  const router = useRouter();
  const { cards, loading, error, load } = useFeed();
  const didInit = useRef(false);

  // Load feed once on first focus (cache makes this instant if feed tab already loaded)
  useFocusEffect(
    useCallback(() => {
      if (!didInit.current) {
        didInit.current = true;
        load(false);
      }
    }, [])
  );

  const places = cards.filter((c): c is PlaceCard => c.type === 'place' && !!(c as PlaceCard).lat);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MAP</Text>
        <Text style={styles.subtitle}>{places.length} places near HKV</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}

      {error && (
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>⚡</Text>
          <Text style={styles.errorText}>Couldn't load places</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(true)}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!error && (
        <MapView
          style={StyleSheet.absoluteFill}
          userInterfaceStyle="dark"
          initialRegion={HKV_REGION}
          showsUserLocation
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
        >
          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => router.push(`/place/${place.id}`)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.pin}>
                <View style={styles.pinDot} />
                <View style={styles.pinStem} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Header overlay */}
      <View style={styles.headerOverlay} pointerEvents="none">
        <View style={styles.header}>
          <Text style={styles.title}>MAP</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading…' : `${places.length} places near HKV`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(26,22,40,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    zIndex: 5,
  },

  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorEmoji: { fontSize: 48 },
  errorText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 100,
    marginTop: 4,
  },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },

  // Custom orange map pin
  pin: { alignItems: 'center' },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  pinStem: {
    width: 2,
    height: 8,
    backgroundColor: Colors.primary,
    marginTop: 1,
  },
});
