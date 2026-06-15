import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

interface Props {
  type: SharedValue<'going' | 'nah' | null>;
  opacity: SharedValue<number>;
}

export function StampOverlay({ type, opacity }: Props) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    display: type.value ? 'flex' : 'none',
  }));

  const isGoingStyle = useAnimatedStyle(() => ({
    display: type.value === 'going' ? 'flex' : 'none',
  }));
  const isNahStyle = useAnimatedStyle(() => ({
    display: type.value === 'nah' ? 'flex' : 'none',
  }));

  return (
    <>
      <Animated.View style={[styles.stamp, styles.going, animStyle, isGoingStyle]}>
        <Text style={[styles.text, styles.goingText]}>GOING</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.nah, animStyle, isNahStyle]}>
        <Text style={[styles.text, styles.nahText]}>NAH</Text>
      </Animated.View>
    </>
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
