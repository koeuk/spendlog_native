import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useFaqs } from '@/hooks/overview';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

/** The published FAQ, in the app's language. */
export default function HelpScreen() {
  const t = useT();
  const theme = useTheme();
  const faqs = useFaqs();
  const [open, setOpen] = useState<string | null>(null);
  const visible = (faqs.data ?? []).filter((faq) => faq.status === 'published');

  return (
    <Screen scroll refreshing={faqs.isRefetching && !faqs.isPending} onRefresh={() => void faqs.refetch()} contentContainerStyle={styles.content} header={<Header title={t('Help')} back />}>
      {faqs.isPending ? (
        <SkeletonCard lines={4} />
      ) : faqs.isError ? (
        <Card>
          <ErrorState error={faqs.error} onRetry={() => void faqs.refetch()} compact />
        </Card>
      ) : visible.length === 0 ? (
        <EmptyState icon={CircleHelp} title={t('Nothing here yet. Check back soon.')} />
      ) : (
        <Card padded={false} style={styles.card}>
          {visible.map((faq, index) => {
            const expanded = open === faq.uuid;
            return (
              <Pressable
                key={faq.uuid}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : faq.uuid)}
                style={[styles.row, index < visible.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }]}>
                <View style={styles.question}>
                  <Txt weight="medium" style={styles.grow}>
                    {faq.question}
                  </Txt>
                  {expanded ? <ChevronUp size={18} color={theme.faint(0.4)} /> : <ChevronDown size={18} color={theme.faint(0.4)} />}
                </View>
                {expanded ? (
                  <Txt faint={0.7} style={styles.answer}>
                    {faq.answer}
                  </Txt>
                ) : null}
              </Pressable>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  card: { paddingHorizontal: 16 },
  row: { paddingVertical: 14, gap: 8 },
  question: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  answer: { paddingRight: 24 },
});
