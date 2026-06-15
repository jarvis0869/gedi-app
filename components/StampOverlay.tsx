import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

interface Props {
  type: 'going' | 'nah' | null;
  opacity: Animated.SharedValue<number>;
}

export function StampOverlay({ type, opacity }: Props) {
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!type) return null;

  const isGoing = type === 'going';

  return (
    <Animated.View
      style={[
        styles.stamp,
        isGoing ? styles.going : styles.nah,
        animStyle,
      ]}
    >
      <Text style={[styles.text, isGoing ? styles.goingText : styles.nahText]}>
        {isGoing ? 'GOING' : 'NAH'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: 64,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 3.5,
    zIndex: 20,
  },
  going: {
    left: 20,
    borderColor: '#00C851',
    backgroundColor: 'rgba(0,200,81,0.12)',
    transform: [{ rotate: '-14deg' }],
  },
  nah: {
    right: 20,
    borderColor: '#888',
    backgroundColor: 'rgba(136,136,136,0.12)',
    transform: [{ rotate: '14deg' }],
  },
  text: {
    fontSize: 30,
    fontFamily: Fonts.headline,
    letterSpacing: 5,
  },
  goingText: { color: '#00C851' },
  nahText: { color: '#888' },
});
