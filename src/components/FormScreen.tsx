import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Card } from './Card';
import { Header } from './Header';
import { EmptyState, ErrorState, SkeletonCard } from './States';

interface FormScreenProps {
  title: string;
  children?: ReactNode;
  /** The row being edited is still on its way. */
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** The row being edited is no longer there. */
  missing?: boolean;
}

/**
 * The frame every create / edit page sits in: a back button and title over a
 * card that carries the form, lifted by the keyboard. Replaces the bottom
 * sheets the forms used to open in.
 */
export function FormScreen({ title, children, loading = false, error, onRetry, missing = false }: FormScreenProps) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const raised = useKeyboardRaised();

  return (
    <View style={[styles.root, { backgroundColor: theme.ground, paddingTop: insets.top }]}>
      <Header title={title} back />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: (raised ? 0 : insets.bottom) + 24 }]}>
          {loading ? (
            <SkeletonCard lines={4} />
          ) : error ? (
            <Card>
              <ErrorState error={error} onRetry={onRetry} compact />
            </Card>
          ) : missing ? (
            <Card>
              <EmptyState title={t('Nothing found.')} compact />
            </Card>
          ) : (
            <Card style={styles.card}>{children}</Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** True while the keyboard is up, so the page stops reserving the home-indicator inset it already covers. */
function useKeyboardRaised(): boolean {
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setRaised(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setRaised(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return raised;
}

/** Leave a form page: back to where it was opened from, or home when it was deep-linked. */
export function useLeaveForm(): () => void {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace('/'));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: layout.pageInset, paddingTop: 4 },
  card: { padding: 18 },
});
