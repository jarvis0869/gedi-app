export const Colors = {
  bg: '#1A1628',
  bgDeep: '#120F1E',
  primary: '#FF6B00',
  primaryDim: 'rgba(255,107,0,0.15)',
  primaryGlow: 'rgba(255,107,0,0.25)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.5)',
  mutedLight: 'rgba(255,255,255,0.3)',
  mutedFaint: 'rgba(255,255,255,0.12)',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassStrong: 'rgba(255,255,255,0.1)',
  glassHover: 'rgba(255,255,255,0.08)',
  error: '#FF4444',
  errorDim: 'rgba(255,68,68,0.15)',
  success: '#00C851',
  successDim: 'rgba(0,200,81,0.15)',
  gold: '#FFD700',
  overlay: 'rgba(26,22,40,0.85)',
  overlayDeep: 'rgba(18,15,30,0.95)',
};

export const Fonts = {
  headline: 'BebasNeue',
  body: 'Inter',
  bodyBold: 'Inter-Bold',
  bodySemiBold: 'Inter-SemiBold',
};

export const Radius = {
  card: 20,
  cardSm: 14,
  button: 12,
  pill: 100,
  small: 8,
  xs: 4,
};

export const Shadow = {
  glow: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  cardSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const Gradients = {
  cardOverlay: ['transparent', 'rgba(26,22,40,0.6)', 'rgba(18,15,30,0.98)'] as string[],
  cardOverlayLight: ['transparent', 'rgba(26,22,40,0.4)', 'rgba(18,15,30,0.92)'] as string[],
  primaryBtn: ['#FF8C00', '#FF6B00'] as string[],
  glow: ['rgba(255,107,0,0.2)', 'transparent'] as string[],
  bgTop: ['rgba(255,107,0,0.06)', '#1A1628'] as string[],
  dark: ['rgba(18,15,30,0)', 'rgba(18,15,30,0.98)'] as string[],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPad: 20,
  headerTop: 56,
};
