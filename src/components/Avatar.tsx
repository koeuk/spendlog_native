import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { assetUrl } from '@/api/env';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** The profile photo, or the person's initials on the accent while there is none. */
export function Avatar({ name, url, size = 48 }: AvatarProps) {
  const theme = useTheme();
  const source = assetUrl(url);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (source) {
    return <Image source={{ uri: source }} style={shape} contentFit="cover" transition={150} accessibilityLabel={name} />;
  }

  return (
    <View style={[styles.fallback, shape, { backgroundColor: theme.accentSoft }]}>
      <Txt weight="bold" color={theme.accent} style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}>
        {initials(name) || '?'}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
