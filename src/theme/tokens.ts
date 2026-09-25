/**
 * SpendLog's look, carried over from the Flutter app: solid white cards over a
 * flat light-grey ground by day, one step lighter than near-black at night,
 * one confident green for anything you can act on, and pill-shaped controls.
 */
export const palette = {
  green: '#2F6B3D',
  greenBright: '#4B9D5F',
  cream: '#F7F6F2',
  ink: '#171717',
  paper: '#ECECEA',
  white: '#FFFFFF',
  lightGround: '#EFF2F5',
  darkGround: '#121212',
  darkSurface: '#1E1E1E',
  lightHairline: '#E3E7EC',
  errorFillLight: '#FDECEC',
  errorInkLight: '#B3261E',
  errorInkDark: '#F87171',
  red: '#DC2626',
  amber: '#F59E0B',
} as const;

export const radius = {
  card: 24,
  pill: 28,
  row: 18,
  sheet: 28,
  chip: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const layout = {
  /** Horizontal breathing room between a screen's content and the window edge. */
  pageInset: 16,
  /** Room a scrollable leaves at its bottom so its last row clears the FAB. */
  fabClearance: 96,
  tabBarHeight: 62,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;
