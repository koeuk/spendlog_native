import { CircleHelp } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useFaqs } from '@/hooks/overview';
import { useT } from '@/i18n';
import { FaqSheet } from '@/sheets/FaqSheet';
import { layout } from '@/theme/tokens';
import type { Faq } from '@/types/api';

/** The questions the help page answers, and whether each one is live. */
export default function FaqsSettingsScreen() {
  const t = useT();
  const faqs = useFaqs();
  const faqSheet = useSheet();
  const [editing, setEditing] = useState<Faq | null>(null);

  const open = (faq: Faq | null) => {
    setEditing(faq);
    faqSheet.present();
  };

  return (
    <>
      <Screen
        scroll
        refreshing={faqs.isRefetching && !faqs.isPending}
        onRefresh={() => void faqs.refetch()}
        bottomInset={layout.fabClearance}
        contentContainerStyle={styles.content}
        header={<Header title={t('FAQ')} back />}>
        <Card padded={false} style={styles.list}>
          {faqs.isPending ? (
            <SkeletonCard lines={3} />
          ) : (faqs.data ?? []).length === 0 ? (
            <Txt faint={0.5} style={styles.empty}>
              {t('No entries yet. Add your first question.')}
            </Txt>
          ) : (
            (faqs.data ?? []).map((faq, index, all) => (
              <ListRow
                key={faq.uuid}
                leading={<CircleHelp size={20} color={faq.status === 'published' ? undefined : '#9CA3AF'} />}
                title={faq.question}
                subtitle={t(faq.status === 'published' ? 'Published' : 'Draft')}
                chevron
                divider={index < all.length - 1}
                onPress={() => open(faq)}
              />
            ))
          )}
        </Card>
      </Screen>
      <Fab onPress={() => open(null)} accessibilityLabel={t('Add question')} />
      <FaqSheet sheetRef={faqSheet.ref} faq={editing} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  list: { paddingHorizontal: 16 },
  empty: { paddingVertical: 14 },
});
