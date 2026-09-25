import { Plus, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Glass } from './Glass';
import { useTabBarInset } from './TabBar';

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: LucideIcon;
}

/** The one floating action on a tab: add something. */
export function Fab({ onPress, accessibilityLabel, icon: Icon = Plus }: FabProps) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom: 20 + tabBarInset, opacity: pressed ? 0.85 : 1 }]}>
      <Glass interactive fill tint={theme.accent} style={styles.glass} />
      <Icon size={26} color={theme.onAccent} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glass: { borderRadius: 29 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)' },
      default: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    }),
  },
});
