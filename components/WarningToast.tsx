import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props {
  message: string;
  onDismiss: () => void;
}

export function WarningToast({ message, onDismiss }: Props) {
  const op = useSharedValue(0);
  const ty = useSharedValue(-12);

  useEffect(() => {
    op.value = withTiming(1, { duration: 250 });
    ty.value = withTiming(0, { duration: 250 });
    // Auto-dismiss after 4 seconds
    op.value = withDelay(4000, withTiming(0, { duration: 300 }));
    ty.value = withDelay(4000, withTiming(-12, { duration: 300 }));
    const t = setTimeout(onDismiss, 4400);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.toast, style]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.msg} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Spacing.headerTop + 48,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: Radius.cardSm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    zIndex: 50,
  },
  icon: { fontSize: 15 },
  msg: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  dismiss: { fontSize: 13, color: Colors.muted },
});
