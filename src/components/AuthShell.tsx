import { Image } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { assetUrl } from '@/api/env';
import { useBranding } from '@/hooks/useBranding';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Card } from './Card';
import { Txt } from './Txt';

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

/** The signed-out frame: the brand mark over a card that carries the form. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: branding } = useBranding();
  const logo = assetUrl(branding?.logo);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.brand}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={[styles.mark, { backgroundColor: theme.accent }]}>
              <Txt variant="title" color={theme.onAccent}>
                {(branding?.name ?? 'S').slice(0, 1)}
              </Txt>
            </View>
          )}
          <Txt variant="display" align="center">
            {branding?.name ?? 'SpendLog'}
          </Txt>
        </View>
        <Card style={styles.card}>
          <Txt variant="title">{title}</Txt>
          {subtitle ? (
            <Txt faint={0.6} style={styles.subtitle}>
              {subtitle}
            </Txt>
          ) : null}
          <View style={styles.form}>{children}</View>
        </Card>
        {branding?.copyright ? (
          <Txt variant="caption" faint={0.4} align="center" style={styles.copyright}>
            © {new Date().getFullYear()} {branding.copyright}
          </Txt>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: layout.pageInset, gap: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 14 },
  logo: { width: 72, height: 72 },
  mark: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 22 },
  subtitle: { marginTop: 4 },
  form: { marginTop: 18, gap: 14 },
  copyright: { marginTop: 8 },
});
