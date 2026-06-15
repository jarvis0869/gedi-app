import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY = '@gedi_pending_link';

// Supported deep link patterns:
//   gedi://place/<id>            → /place/<id>
//   gedi://event/<id>            → /event/<id>
//   https://gediapp.in/place/<id> → /place/<id>
//   https://gediapp.in/event/<id> → /event/<id>
export function parseDeepLink(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.replace(/^\//, '').split('/');
    const [type, id] = segments;
    if (!id) return null;
    if (type === 'place') return `/place/${id}`;
    if (type === 'event') return `/event/${id}`;
    return null;
  } catch {
    return null;
  }
}

export async function storePendingLink(url: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, url);
}

// Returns the stored URL and clears it (call once, consume once).
export async function consumePendingLink(): Promise<string | null> {
  const url = await AsyncStorage.getItem(PENDING_KEY);
  if (url) await AsyncStorage.removeItem(PENDING_KEY);
  return url;
}
