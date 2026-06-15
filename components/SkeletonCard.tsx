import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.72;

function ShimmerBar({ w = '100%', h = 14, mt = 0 }: { w?: number | string; h?: number; mt?: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 900 }),
        withTiming(0.3, { duration: 900 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: w as any, height: h, marginTop: mt, borderRadius: Radius.xs + 2 },
        { backgroundColor: Colors.glassStrong },
        animStyle,
      ]}
    />
  );
}

export function SkeletonCard() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1100 }),
        withTiming(1, { duration: 1100 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <View style={styles.imageArea}>
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={styles.content}>
        <ShimmerBar w="65%" h={28} />
        <ShimmerBar w="90%" h={13} mt={12} />
        <ShimmerBar w="50%" h={13} mt={8} />
        <View style={styles.hintRow}>
          <ShimmerBar w={60} h={10} />
          <ShimmerBar w={60} h={10} />
          <ShimmerBar w={60} h={10} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.card,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  imageArea: {
    width: '100%',
    height: '62%',
    backgroundColor: Colors.glass,
  },
  content: {
    padding: 20,
    gap: 0,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
