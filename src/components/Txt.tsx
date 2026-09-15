import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type FontWeight } from '@/theme/useTheme';

export type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const VARIANTS: Record<TxtVariant, { size: number; weight: FontWeight; lineHeight: number }> = {
  display: { size: 34, weight: 'bold', lineHeight: 40 },
  title: { size: 22, weight: 'bold', lineHeight: 28 },
  heading: { size: 17, weight: 'semibold', lineHeight: 22 },
  body: { size: 15, weight: 'regular', lineHeight: 21 },
  label: { size: 13, weight: 'medium', lineHeight: 18 },
  caption: { size: 11, weight: 'medium', lineHeight: 15 },
};

export interface TxtProps extends TextProps {
  variant?: TxtVariant;
  weight?: FontWeight;
  color?: string;
  /** Reduced emphasis: the text colour at this alpha. */
  faint?: number;
  align?: TextStyle['textAlign'];
}

/** Every visible string: the right face for the locale, the palette's ink. */
export function Txt({ variant = 'body', weight, color, faint, align, style, ...rest }: TxtProps) {
  const theme = useTheme();
  const spec = VARIANTS[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: theme.font(weight ?? spec.weight),
          fontSize: spec.size,
          lineHeight: theme.khmer ? Math.round(spec.lineHeight * 1.2) : spec.lineHeight,
          color: color ?? (faint !== undefined ? theme.faint(faint) : theme.text),
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
