import type { BudgetStatus, CategoryColor } from '@/types/api';

/**
 * The server's CategoryColor enum rendered as hex. Unknown values fall back
 * rather than crash, so a new server-side colour cannot break old builds.
 */
const COLORS: Record<CategoryColor, string> = {
  slate: '#64748B',
  red: '#EF4444',
  orange: '#F97316',
  amber: '#F59E0B',
  green: '#22C55E',
  teal: '#14B8A6',
  blue: '#3B82F6',
  indigo: '#6366F1',
  purple: '#A855F7',
  pink: '#EC4899',
};

export const CATEGORY_COLORS = Object.keys(COLORS) as CategoryColor[];

export function categoryColor(name: string | null | undefined): string {
  return COLORS[(name ?? 'slate') as CategoryColor] ?? COLORS.slate;
}

/**
 * The values the category form offers. They mirror the server's CategoryIcon
 * enum, which rejects anything else with a `422`, so the picker must not
 * invent options. Names are Lucide's, which is what the server uses too.
 */
export const CATEGORY_ICONS = [
  'utensils',
  'car',
  'receipt',
  'shopping-bag',
  'circle-dashed',
  'house',
  'coffee',
  'plane',
  'gift',
  'heart',
  'book',
  'dumbbell',
  'smartphone',
  'zap',
  'piggy-bank',
  'fuel',
  'shopping-cart',
  'pill',
  'stethoscope',
  'file-text',
  'film',
  'music',
  'gamepad-2',
  'paw-print',
  'bus',
  'train-front',
  'hotel',
  'briefcase',
  'landmark',
  'credit-card',
  'carrot',
  'salad',
  'beef',
  'fish',
  'pizza',
  'sandwich',
  'milk',
  'beer',
  'wine',
  'luggage',
  'map',
  'tent',
  'tree-palm',
  'ship',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

/** Budget status → the colour its bar and label render in. */
export function statusColor(status: BudgetStatus | string): string {
  switch (status) {
    case 'over':
      return '#DC2626';
    case 'warning':
      return '#F59E0B';
    case 'ok':
      return '#22C55E';
    default:
      return '#9CA3AF';
  }
}
