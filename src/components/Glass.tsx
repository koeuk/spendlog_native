import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

/** True on iOS 26 and later, where the system draws real liquid glass. */
export const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

interface GlassProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /** Colours the glass, for a prominent control like the add button. */
  tint?: ColorValue;
  /** Lets the system glass react to touch: it swells and shimmers under a finger. */
  interactive?: boolean;
  /** Fills its parent behind the parent's own content, as a Pressable's background. */
  fill?: boolean;
}

/**
 * One pane of liquid glass. The system's own on iOS 26; elsewhere a frosted
 * stand-in — a see-through fill with a bright rim, blurred on the web — so
 * the look carries across without pretending to a blur Android cannot draw.
 */
export function Glass({ children, style, tint, interactive = false, fill = false }: GlassProps) {
  const theme = useTheme();
  const placement = fill ? [StyleSheet.absoluteFill, { pointerEvents: 'none' as const }] : null;

  if (LIQUID_GLASS) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} colorScheme={theme.isDark ? 'dark' : 'light'} style={[placement, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.frost, { backgroundColor: tint ?? theme.glassFill, borderColor: tint ? 'transparent' : theme.glassRim }, placement, style]}>
      {children}
    </View>
  );
}

/**
 * The ground every screen sits on: the flat colour with two soft washes of
 * light, one in the accent from the top, one cooler from the bottom. Glass
 * over a flat colour just looks grey; this gives it something to bend.
 */
export function Backdrop() {
  const theme = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.ground, pointerEvents: 'none' }]}>
      <LinearGradient colors={[theme.glow[0], 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.45 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', theme.glow[1]]} start={{ x: 0.3, y: 0.55 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  frost: {
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { backdropFilter: 'blur(24px) saturate(180%)' },
      default: {},
    }),
  },
});
