import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface Props {
  type: 'going' | 'nah' | null;
  opacity: Animated.SharedValue<number>;
}

export function StampOverlay({ type, opacity }: Props) {
  if (!type) return null;
  const isGoing = type === 'going';
  return (
    <Animated.View
      style={[
        styles.stamp,
        isGoing ? styles.going : styles.nah,
        { opacity },
      ]}
      entering={FadeIn.duration(100)}
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
    top: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 4,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  going: {
    left: 20,
    borderColor: '#00C851',
    backgroundColor: 'rgba(0,200,81,0.15)',
  },
  nah: {
    right: 20,
    borderColor: '#999',
    backgroundColor: 'rgba(153,153,153,0.15)',
    transform: [{ rotate: '15deg' }],
  },
  text: {
    fontSize: 28,
    fontFamily: 'BebasNeue',
    letterSpacing: 4,
  },
  goingText: { color: '#00C851' },
  nahText: { color: '#999' },
});
