import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Radius } from '@/constants/theme';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌃</Text>
      <Text style={styles.title}>Nothing here</Text>
      <Text style={styles.body}>
        This link doesn't lead anywhere in Hauz Khas Village.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
        <Text style={styles.btnText}>Back to Feed</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 40,
    color: Colors.white,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  btnText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
