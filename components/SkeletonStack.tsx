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

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.72;

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

// Single full-screen shimmer card matching TikTok feed layout
export function SkeletonStack() {
  const op = useSharedValue(0.5);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);
  const cardStyle = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Image shimmer area */}
      <View style={styles.imageArea}>
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Content shimmer area */}
      <View style={styles.contentArea}>
        {/* Open badge placeholder */}
        <ShimmerBar w={72} h={22} delay={0} />
        {/* Name */}
        <ShimmerBar w="68%" h={30} mt={10} delay={80} />
        {/* Meta row */}
        <View style={styles.metaRow}>
          <ShimmerBar w={60} h={12} delay={120} />
          <ShimmerBar w={24} h={12} delay={120} />
          <ShimmerBar w={80} h={12} delay={120} />
        </View>
        {/* Vicinity */}
        <ShimmerBar w="50%" h={12} mt={4} delay={160} />
        {/* Hint row */}
        <View style={styles.hintRow}>
          <ShimmerBar w={55} h={9} delay={240} />
          <ShimmerBar w={65} h={9} delay={240} />
          <ShimmerBar w={55} h={9} delay={240} />
        </View>
      </View>

      {/* Detail bar shimmer */}
      <View style={styles.detailBar}>
        <ShimmerBar w={100} h={13} delay={200} />
      </View>
    </Animated.View>
  );
}

export function SkeletonCard() {
  return <SkeletonStack />;
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
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentArea: {
    padding: 18,
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  detailBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,0,0.06)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.12)',
  },
});
