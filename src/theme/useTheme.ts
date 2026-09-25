import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useBranding } from '@/hooks/useBranding';
import { useLocaleStore, type Locale } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import type { Branding, UserPreferences } from '@/types/api';
import { luminance, mix, parseHex, rgba } from '@/utils/color';

import { palette } from './tokens';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface Theme {
  isDark: boolean;
  /** Khmer script sits taller; text gives it more line height. */
  khmer: boolean;
  /** The flat ground every screen sits on. */
  ground: string;
  /** Cards, inputs, the tab bar. */
  surface: string;
  /** The frosted panes that carry a blur: sheets. */
  surfaceStrong: string;
  /** Liquid glass where the system has none: a see-through fill and a bright rim. */
  glassFill: string;
  glassRim: string;
  /** Inputs sit inside glass, so they are a lighter frost rather than a solid. */
  fieldFill: string;
  /** The two soft washes of colour behind every screen, for the glass to refract. */
  glow: [string, string];
  text: string;
  hairline: string;
  inputBorder: string;
  placeholder: string;
  /** The admin's button colour when one is chosen, the house green otherwise. */
  accent: string;
  /** Text and icons laid on `accent`. */
  onAccent: string;
  accentSoft: string;
  errorFill: string;
  errorInk: string;
  /** Text at a reduced emphasis, in whichever palette is active. */
  faint: (alpha: number) => string;
  /** The font family for a weight, Khmer-capable when the locale is `km`. */
  font: (weight?: FontWeight) => string;
}

const INTER: Record<FontWeight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const KHMER: Record<FontWeight, string> = {
  regular: 'NotoSansKhmer_400Regular',
  medium: 'NotoSansKhmer_500Medium',
  semibold: 'NotoSansKhmer_600SemiBold',
  bold: 'NotoSansKhmer_700Bold',
};

/** The white background means "the ambient look", not a flat colour to paint. */
const WHITE = '#ffffff';

export function buildTheme(isDark: boolean, locale: Locale, branding: Branding | undefined, own?: UserPreferences | null): Theme {
  // The account's own colours win over the admin's, one field at a time.
  const ownButton = own?.button_color && parseHex(own.button_color) ? own.button_color : null;
  const chosen = ownButton ?? (branding?.branded && parseHex(branding.button_color) ? branding.button_color : null);
  // A chosen colour is lifted for dark mode the way the house green is: the
  // deep one reads on cream, the bright one on near-black.
  const accent = isDark ? (chosen ? mix(chosen, palette.white, 0.22) : palette.greenBright) : (chosen ?? palette.green);
  // Computed, never chosen: the label has to survive whichever fill is picked.
  const onAccent = luminance(accent) > 0.45 ? palette.ink : palette.white;
  const text = isDark ? palette.paper : palette.ink;
  // A chosen background paints flat, light mode only: an admin picking Cream
  // should not switch dark mode off for everyone.
  const ownBody = own?.body_color && parseHex(own.body_color) ? own.body_color : null;
  const body = ownBody ? (ownBody.toLowerCase() === WHITE ? null : ownBody) : branding?.plain_background && parseHex(branding.body_color) ? branding.body_color : null;
  const chosenGround = !isDark && body ? body : null;
  const fonts = locale === 'km' ? KHMER : INTER;

  return {
    isDark,
    khmer: locale === 'km',
    ground: isDark ? palette.darkGround : (chosenGround ?? palette.lightGround),
    surface: isDark ? palette.darkSurface : palette.white,
    surfaceStrong: isDark ? rgba(palette.darkSurface, 0.94) : rgba(palette.white, 0.92),
    glassFill: isDark ? rgba(palette.white, 0.07) : rgba(palette.white, 0.62),
    glassRim: isDark ? rgba(palette.white, 0.12) : rgba(palette.white, 0.95),
    fieldFill: isDark ? rgba(palette.white, 0.05) : rgba(palette.white, 0.72),
    glow: [rgba(accent, isDark ? 0.26 : 0.2), isDark ? rgba('#3B82F6', 0.16) : rgba('#38BDF8', 0.16)],
    text,
    hairline: isDark ? rgba(palette.white, 0.08) : palette.lightHairline,
    inputBorder: rgba(text, isDark ? 0.14 : 0.1),
    placeholder: rgba(text, 0.35),
    accent,
    onAccent,
    accentSoft: rgba(accent, isDark ? 0.22 : 0.12),
    errorFill: isDark ? rgba(palette.red, 0.18) : palette.errorFillLight,
    errorInk: isDark ? palette.errorInkDark : palette.errorInkLight,
    faint: (alpha) => rgba(text, alpha),
    font: (weight = 'regular') => fonts[weight],
  };
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const locale = useLocaleStore((state) => state.locale);
  const { data: branding } = useBranding();
  const own = useSessionStore((state) => state.user?.preferences);
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return useMemo(() => buildTheme(isDark, locale, branding, own), [isDark, locale, branding, own]);
}
