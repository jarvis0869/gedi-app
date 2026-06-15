import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@/constants/theme';
import { CARD_WIDTH, CARD_HEIGHT } from '@/components/CardStack';

function ShimmerBar({
  w = '100%' as number | string,
  h = 14,
  mt = 0,
  delay = 0,
}: {
  w?: number | string;
  h?: number;
  mt?: number;
  delay?: number;
}) {
  const op = useSharedValue(0.25);
  useEffect(() => {
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 850 }),
          withTiming(0.25, { duration: 850 })
        ),
        -1,
        false
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          marginTop: mt,
          borderRadius: 4,
          backgroundColor: Colors.glassStrong,
        },
        style,
      ]}
    />
  );
}

function SkeletonSingle({ scale = 1, ty = 0, opacity = 1, delay = 0 }) {
  const op = useSharedValue(opacity * 0.6);
  useEffect(() => {
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(opacity, { duration: 1000 }),
          withTiming(opacity * 0.55, { duration: 1000 })
        ),
        -1,
        false
      )
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale }, { translateY: ty }],
  }));

  return (
    <Animated.View style={[styles.card, aStyle]}>
      <View style={styles.imageArea}>
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.contentArea}>
        <ShimmerBar w="62%" h={26} delay={delay} />
        <ShimmerBar w="88%" h={12} mt={12} delay={delay + 80} />
        <ShimmerBar w="48%" h={12} mt={7} delay={delay + 160} />
        <View style={styles.hintRow}>
          <ShimmerBar w={55} h={9} delay={delay + 240} />
          <ShimmerBar w={55} h={9} delay={delay + 240} />
          <ShimmerBar w={55} h={9} delay={delay + 240} />
        </View>
      </View>
    </Animated.View>
  );
}

export function SkeletonStack() {
  return (
    <View style={styles.stack}>
      <SkeletonSingle scale={0.89} ty={-20} opacity={0.4} delay={200} />
      <SkeletonSingle scale={0.945} ty={-10} opacity={0.65} delay={100} />
      <SkeletonSingle scale={1} ty={0} opacity={1} delay={0} />
    </View>
  );
}

// Keep single export too for backwards compat
export function SkeletonCard() {
  return <SkeletonSingle />;
}

const styles = StyleSheet.create({
  stack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
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
    height: '63%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentArea: {
    padding: 18,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
});
