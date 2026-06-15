import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface Props {
  points: number;
  onDone: () => void;
}

export function CheckinSuccess({ points, onDone }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const pointsY = useSharedValue(10);
  const pointsOp = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    checkScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 260 }));
    pointsOp.value = withDelay(400, withTiming(1, { duration: 300 }));
    pointsY.value = withDelay(400, withSpring(0, { damping: 14, stiffness: 200 }));

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
      setTimeout(onDone, 320);
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const pointsStyle = useAnimatedStyle(() => ({
    opacity: pointsOp.value,
    transform: [{ translateY: pointsY.value }],
  }));

  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Animated.View style={[styles.card, containerStyle]}>
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
        <Text style={styles.title}>Checked In!</Text>
        <Animated.View style={pointsStyle}>
          <Text style={styles.points}>+{points} pts</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(18,15,30,0.7)',
  },
  card: {
    backgroundColor: 'rgba(26,22,40,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,81,0.4)',
    borderRadius: Radius.card,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,200,81,0.15)',
    borderWidth: 2,
    borderColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkMark: { fontSize: 36, color: Colors.success },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 2,
  },
  points: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: Colors.success,
    letterSpacing: 1,
  },
});
