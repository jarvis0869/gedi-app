import { StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from './theme';

export const gs = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },
  absolute: { position: 'absolute' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  screenPad: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.screenPad,
    paddingTop: Spacing.headerTop,
  },

  // Glass card base
  glass: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.card,
  },
  glassSm: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.cardSm,
  },

  // Typography
  headline: {
    fontFamily: Fonts.headline,
    color: Colors.white,
    letterSpacing: 1,
  },
  headline48: {
    fontFamily: Fonts.headline,
    fontSize: 48,
    color: Colors.white,
    letterSpacing: 2,
  },
  headline36: {
    fontFamily: Fonts.headline,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 1,
  },
  headline28: {
    fontFamily: Fonts.headline,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  bodyBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
  bodySemiBold: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Buttons
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.muted,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.primary,
  },
  btnDisabled: { opacity: 0.45 },

  // Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  badgePrimary: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  badgeSuccess: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.successDim,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  badgeError: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginVertical: Spacing.md,
  },

  // Section title
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
});
