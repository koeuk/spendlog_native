import type { LucideIcon } from 'lucide-react-native';
import { Inbox, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { apiErrorMessage, errorStatus } from '@/api/client';
import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { PillButton } from './PillButton';
import { Txt } from './Txt';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle, actionLabel, onAction, compact = false }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.center, compact ? styles.compact : styles.roomy]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.faint(0.06) }]}>
        <Icon size={26} color={theme.faint(0.5)} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      {subtitle ? (
        <Txt faint={0.55} align="center">
          {subtitle}
        </Txt>
      ) : null}
      {actionLabel && onAction ? <PillButton label={actionLabel} onPress={onAction} variant="tonal" size="sm" style={styles.action} /> : null}
    </View>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  const theme = useTheme();
  const t = useT();
  return (
    <View style={[styles.center, compact ? styles.compact : styles.roomy]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.errorFill }]}>
        <WifiOff size={26} color={theme.errorInk} />
      </View>
      <Txt align="center" faint={0.7}>
        {errorStatus(error) === 403 ? t('You do not have access to this.') : t(apiErrorMessage(error))}
      </Txt>
      {onRetry ? <PillButton label={t('Try again')} onPress={onRetry} variant="tonal" size="sm" style={styles.action} /> : null}
    </View>
  );
}

interface SkeletonProps {
  height?: number;
  width?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
}

/** A breathing placeholder for content that is on its way. */
export function Skeleton({ height = 16, width = '100%', style, rounded = 10 }: SkeletonProps) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ height, width, borderRadius: rounded, backgroundColor: theme.faint(0.08), opacity }, style]} />;
}

/** A card-shaped skeleton with a few lines, for lists and summaries. */
export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: theme.surface, borderRadius: radius.card }, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === 0 ? '55%' : index === lines - 1 ? '35%' : '80%'} height={index === 0 ? 20 : 14} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  roomy: { paddingVertical: 48 },
  compact: { paddingVertical: 20 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  action: { marginTop: 8 },
  skeletonCard: { padding: 18, gap: 12 },
});
