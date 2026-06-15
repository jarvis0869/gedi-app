import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  strong?: boolean;
}

export function GlassCard({ children, style, glow = false, strong = false }: Props) {
  return (
    <View
      style={[
        styles.card,
        strong && styles.cardStrong,
        glow && styles.cardGlow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  cardStrong: {
    backgroundColor: Colors.glassStrong,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardGlow: {
    ...Shadow.glow,
    borderColor: 'rgba(255,107,0,0.3)',
  },
});
