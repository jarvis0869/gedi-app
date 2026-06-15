import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  intensity?: 'soft' | 'medium' | 'strong';
  yOffset?: number;
}

export function GlowBackground({ intensity = 'soft', yOffset = height * 0.3 }: Props) {
  const opacities = { soft: 0.12, medium: 0.22, strong: 0.35 };
  const sizes = { soft: width * 1.2, medium: width * 1.4, strong: width * 1.6 };
  const opacity = opacities[intensity];
  const size = sizes[intensity];

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top: yOffset - size / 2,
          left: width / 2 - size / 2,
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['#FF6B00', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
