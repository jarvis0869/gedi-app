import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface UserCoords { lat: number; lng: number }

export function useLocation(): UserCoords | null {
  const [coords, setCoords] = useState<UserCoords | null>(null);

  useEffect(() => {
    // Last known position is instant — good enough for distance labels
    Location.getLastKnownPositionAsync({}).then((pos) => {
      if (pos) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }).catch(() => {});

    // Then update with a fresh accurate position
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return null;
      return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    }).then((pos) => {
      if (pos) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }).catch(() => {});
  }, []);

  return coords;
}
