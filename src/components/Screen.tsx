import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface ScreenProps extends PropsWithChildren {
  /** Wrap the content in a ScrollView. Lists bring their own scrolling. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra space at the bottom so the last row clears a floating button. */
  bottomInset?: number;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  header?: ReactNode;
}

/** The frame every screen sits in: the flat ground, safe at the top. */
export function Screen({
  children,
  scroll = false,
  refreshing = false,
  onRefresh,
  bottomInset = 0,
  padded = true,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  header,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = padded ? layout.pageInset : 0;

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: theme.ground, paddingTop: insets.top }, style]}>
        {header}
        <View style={[styles.root, { paddingHorizontal: padding }, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.ground, paddingTop: insets.top }, style]}>
      {header}
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[{ paddingHorizontal: padding, paddingBottom: bottomInset + 24 }, contentContainerStyle]}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} /> : undefined}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
