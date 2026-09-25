import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useT } from "@/i18n";
import { layout } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

import { Card } from "./Card";
import { Header } from "./Header";
import { EmptyState, ErrorState, SkeletonCard } from "./States";

interface FormScreenProps {
  title: string;
  children?: ReactNode;
  /** The row being edited is still on its way. */
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** The row being edited is no longer there. */
  missing?: boolean;
  /**
   * An action bar pinned below the scrolling content, above the keyboard.
   * Hidden while the page is loading or broken: there is nothing to act on.
   */
  footer?: ReactNode;
}

/**
 * The frame every create / edit page sits in: a back button and title over a
 * card that carries the form, lifted by the keyboard. Replaces the bottom
 * sheets the forms used to open in.
 */
export function FormScreen({
  title,
  children,
  loading = false,
  error,
  onRetry,
  missing = false,
  footer,
}: FormScreenProps) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const raised = useKeyboardRaised();
  const bar = loading || error || missing ? null : footer;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.ground, paddingTop: insets.top },
      ]}
    >
      <Header title={title} back />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bar || raised ? 0 : insets.bottom },
          ]}
        >
          {loading || error || missing ? (
            // A skeleton or a failure keeps the old inset: full bleed is for the
            // form, and a squared-off error panel just reads as a broken layout.
            <View style={styles.state}>
              {loading ? (
                <SkeletonCard lines={4} />
              ) : error ? (
                <Card>
                  <ErrorState error={error} onRetry={onRetry} compact />
                </Card>
              ) : (
                <Card>
                  <EmptyState title={t("Nothing found.")} compact />
                </Card>
              )}
            </View>
          ) : (
            <Card style={styles.card}>{children}</Card>
          )}
        </ScrollView>
        {bar && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.hairline,
                paddingBottom: (raised ? 0 : insets.bottom) + 12,
              },
            ]}
          >
            {bar}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/** True while the keyboard is up, so the page stops reserving the home-indicator inset it already covers. */
function useKeyboardRaised(): boolean {
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setRaised(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setRaised(false),
    );
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
  return () => (router.canGoBack() ? router.back() : router.replace("/"));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // No page inset and no gap under the card: the surface runs to all four
  // edges, and `flexGrow` lets it stretch down to the footer on a short form.
  content: { flexGrow: 1 },
  card: { flexGrow: 1, padding: 18, borderRadius: 0 },
  state: { paddingHorizontal: layout.pageInset, paddingTop: 4 },
  footer: {
    paddingHorizontal: layout.pageInset,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
