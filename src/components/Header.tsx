import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Glass } from './Glass';
import { Txt } from './Txt';

interface HeaderProps {
  title: string;
  back?: boolean;
  right?: ReactNode;
  /** A larger, left-aligned title for a tab's root screen. */
  large?: boolean;
}

/** Every screen's title, set once: a label over the content, not a headline. */
export function Header({ title, back = false, right, large = false }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  if (large) {
    return (
      <View style={styles.large}>
        <Txt variant="title" numberOfLines={1} style={styles.grow}>
          {title}
        </Txt>
        {right}
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
            <Glass interactive fill style={styles.round} />
            <ChevronLeft size={24} color={theme.text} />
          </Pressable>
        )}
      </View>
      <Txt variant="heading" numberOfLines={1} style={styles.title}>
        {title}
      </Txt>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.pageInset - 8,
  },
  large: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.pageInset,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  grow: { flex: 1 },
  side: { width: 64, flexDirection: 'row', alignItems: 'center' },
  right: { justifyContent: 'flex-end' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 20 },
  title: { flex: 1, textAlign: 'center' },
});
