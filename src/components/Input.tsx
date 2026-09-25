import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Inside a bottom sheet the input must be the sheet's own, so the keyboard lifts it. */
  sheet?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
}

/** A pill-shaped field with its label above and any error below. */
export function Input({ label, error, hint, left, right, sheet = false, containerStyle, style, multiline, onFocus, onBlur, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  // The sheet's own input lifts with the keyboard on a phone; the browser has no such input and no keyboard to dodge.
  const Component = sheet && Platform.OS !== 'web' ? BottomSheetTextInput : TextInput;
  const borderColor = error ? theme.errorInk : focused ? theme.accent : theme.inputBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Txt variant="label" faint={0.7} style={styles.label}>
          {label}
        </Txt>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: theme.fieldFill, borderColor, borderWidth: focused || error ? 1.6 : 1 },
          multiline ? styles.multiline : styles.single,
        ]}>
        {left ? <View style={styles.adornment}>{left}</View> : null}
        <Component
          accessibilityLabel={label}
          {...rest}
          multiline={multiline}
          placeholderTextColor={theme.placeholder}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            { color: theme.text, fontFamily: theme.font('regular') },
            webOutline,
            multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
            style,
          ]}
        />
        {right ? <View style={styles.adornment}>{right}</View> : null}
      </View>
      {error ? (
        <Txt variant="label" color={theme.errorInk} style={styles.helper}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="label" faint={0.5} style={styles.helper}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

// The browser draws its own focus ring; the pill's accent border already says "focused".
const webOutline = Platform.select({ web: { outlineStyle: 'none' } as unknown as TextInputProps['style'], default: undefined });

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginLeft: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 18,
  },
  single: { minHeight: 52 },
  multiline: { minHeight: 100, alignItems: 'flex-start', borderRadius: 22 },
  // minWidth 0: a browser input keeps a min-content width otherwise, and at
  // 360 px that pushes the right adornment (the USD / KHR toggle) off the edge.
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 12, paddingHorizontal: 4 },
  adornment: { justifyContent: 'center', flexShrink: 0 },
  helper: { marginLeft: 12 },
});
