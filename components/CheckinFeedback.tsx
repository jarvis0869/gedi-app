import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CheckinResult, formatDistance } from '@/hooks/useCheckin';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  result: Exclude<CheckinResult, 'success' | null>;
  distanceToPlace: number | null;
  onDismiss: () => void;
}

const CONFIGS: Record<Props['result'], { icon: string; title: string; color: string; bg: string; border: string }> = {
  too_far: {
    icon: '📍',
    title: 'Too far away',
    color: '#FF8C00',
    bg: 'rgba(255,107,0,0.12)',
    border: 'rgba(255,107,0,0.4)',
  },
  already: {
    icon: '✓',
    title: 'Already checked in today',
    color: Colors.success,
    bg: 'rgba(0,200,81,0.1)',
    border: 'rgba(0,200,81,0.35)',
  },
  no_permission: {
    icon: '🔒',
    title: 'Location access required',
    color: Colors.error,
    bg: 'rgba(255,68,68,0.1)',
    border: 'rgba(255,68,68,0.35)',
  },
};

const SUBTITLES: Record<Props['result'], (dist: number | null) => string> = {
  too_far: (dist) =>
    dist != null
      ? `You're ${formatDistance(dist)} away. Get within 500m to check in.`
      : 'You need to be within 500m of this place.',
  already: () => 'Come back tomorrow to earn more points.',
  no_permission: () => 'Go to Settings → Privacy → Location and allow Gedi.',
};

export function CheckinFeedback({ result, distanceToPlace, onDismiss }: Props) {
  const cfg = CONFIGS[result];
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
    opacity.value = withTiming(1, { duration: 200 });

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 260 });
      translateY.value = withTiming(80, { duration: 260 });
      setTimeout(onDismiss, 280);
    }, 3500);

    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.icon, { color: cfg.color }]}>{cfg.icon}</Text>
      <View style={styles.text}>
        <Text style={[styles.title, { color: cfg.color }]}>{cfg.title}</Text>
        <Text style={styles.subtitle}>{SUBTITLES[result](distanceToPlace)}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    zIndex: 200,
  },
  icon: { fontSize: 22 },
  text: { flex: 1 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 14, marginBottom: 3 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, lineHeight: 17 },
});
