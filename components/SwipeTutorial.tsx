import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts } from '@/constants/theme';

interface Props {
  visible: boolean;
}

export function SwipeTutorial({ visible }: Props) {
  const op = useSharedValue(0);
  const handX = useSharedValue(0);
  const handScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) { op.value = withTiming(0, { duration: 200 }); return; }

    op.value = withDelay(600, withTiming(1, { duration: 400 }));

    // Animate hand: left then right then up, repeat
    handX.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(60, { duration: 500 }),
          withTiming(0, { duration: 300 }),
          withTiming(-60, { duration: 500 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 400 })
        ),
        3,
        false
      )
    );

    handScale.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 150 }),
          withTiming(1, { duration: 150 })
        ),
        6,
        false
      )
    );

    // Auto-fade
    op.value = withDelay(5200, withTiming(0, { duration: 400 }));
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: op.value }));
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: handX.value }, { scale: handScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.Text style={[styles.hand, handStyle]}>👆</Animated.Text>
      <View style={styles.hints}>
        <Text style={styles.hint}>← nah</Text>
        <Text style={styles.hintUp}>↑ details</Text>
        <Text style={styles.hintGoing}>going →</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
    pointerEvents: 'none',
  },
  hand: { fontSize: 36 },
  hints: {
    flexDirection: 'row',
    gap: 24,
    backgroundColor: 'rgba(26,22,40,0.75)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  hint: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(136,136,136,0.9)' },
  hintUp: { fontFamily: Fonts.body, fontSize: 12, color: Colors.mutedLight },
  hintGoing: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(0,200,81,0.9)' },
});
