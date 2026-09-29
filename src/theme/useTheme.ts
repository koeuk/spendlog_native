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
  /** One flat page, no washes of light. Glass falls back to a solid, outlined pane. */
  plain: boolean;
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

/**
 * White is the one background that keeps the ambient wash; every other preset,
 * Silver — the default, and first in the picker — included, paints the page
 * flat. Mirrors BodyColor on the server, so the app and the web agree.
 */
const WASH = 'ffffff';

/** `#F4F5F7`, `f4f5f7` and a stray space all name the same colour. */
function sameColour(hex: string, other: string): boolean {
  return hex.trim().replace(/^#/, '').toLowerCase() === other;
}

export function buildTheme(isDark: boolean, locale: Locale, branding: Branding | undefined, own?: UserPreferences | null, plain = false): Theme {
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
  const brandBody = branding?.plain_background && parseHex(branding.body_color) ? branding.body_color : null;
  const picked = ownBody ?? brandBody;
  // Picking White asks for the wash. Picking anything else — Silver, Cream,
  // Sand — asks for that colour, flat, with no wash over it.
  const wash = !!picked && sameColour(picked, WASH);
  const fonts = locale === 'km' ? KHMER : INTER;
  // Either road to the flat page: a colour picked in Colours, or the switch for
  // someone who has picked none. Dark mode stays dark — flat means "no wash of
  // colour", not "white".
  const flat = plain || (!!picked && !wash);
  const chosenGround = !isDark && picked && !wash ? picked : null;
  const lightGround = flat ? (chosenGround ?? palette.white) : palette.lightGround;

  return {
    isDark,
    plain: flat,
    khmer: locale === 'km',
    ground: isDark ? palette.darkGround : lightGround,
    surface: isDark ? palette.darkSurface : palette.white,
    surfaceStrong: isDark ? rgba(palette.darkSurface, 0.94) : rgba(palette.white, 0.92),
    // A see-through pane over a flat white page is just white: with no wash of
    // colour to sit against, glass goes solid and takes a visible rim instead,
    // or every card disappears into the background.
    glassFill: flat ? (isDark ? palette.darkSurface : palette.white) : isDark ? rgba(palette.white, 0.07) : rgba(palette.white, 0.62),
    glassRim: flat ? (isDark ? rgba(palette.white, 0.12) : palette.lightHairline) : isDark ? rgba(palette.white, 0.12) : rgba(palette.white, 0.95),
    fieldFill: isDark ? rgba(palette.white, 0.05) : rgba(palette.white, 0.72),
    // The page keeps its own two washes whatever colour the buttons are: the
    // background is the room, the accent is one thing in it, and tying them
    // together repainted the whole app every time a button colour was picked.
    // Transparent rather than absent when flat: the Backdrop still draws both
    // layers, they simply add nothing over the ground.
    glow: flat
      ? ['transparent', 'transparent']
      : [isDark ? rgba(palette.greenBright, 0.26) : rgba(palette.green, 0.2), isDark ? rgba('#3B82F6', 0.16) : rgba('#38BDF8', 0.16)],
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
  const plain = useThemeStore((state) => state.plain);
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return useMemo(() => buildTheme(isDark, locale, branding, own, plain), [isDark, locale, branding, own, plain]);
}
