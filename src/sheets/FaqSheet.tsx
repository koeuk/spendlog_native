import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useDeleteFaq, useSaveFaq } from '@/hooks/admin';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Faq, FaqStatus } from '@/types/api';
import { confirm } from '@/utils/confirm';

interface FaqSheetProps {
  sheetRef: SheetRef;
  faq: Faq | null;
}

/** One FAQ entry; drafts stay hidden from the Help screen until published. */
export function FaqSheet({ sheetRef, faq }: FaqSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={faq ? t('Edit question') : t('Add question')}>
      <FaqForm key={faq?.uuid ?? 'new'} faq={faq} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function FaqForm({ faq, close }: { faq: Faq | null; close: () => void }) {
  const t = useT();
  const save = useSaveFaq();
  const remove = useDeleteFaq();
  const form = useForm({ question: faq?.question ?? '', answer: faq?.answer ?? '', status: (faq?.status ?? 'draft') as FaqStatus });

  const submit = () =>
    form.submit(
      async () => {
        await save.mutateAsync({ uuid: faq?.uuid, payload: { question: form.values.question.trim(), answer: form.values.answer.trim(), status: form.values.status } });
        toast(t('Saved.'), 'success');
        close();
      },
      () => ({
        question: form.values.question.trim() ? undefined : t('Write the question.'),
        answer: form.values.answer.trim() ? undefined : t('Write the answer.'),
      }),
    );

  const destroy = async () => {
    if (!faq) return;
    const ok = await confirm({ title: t('Delete this question?'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(faq.uuid);
      toast(t('Deleted.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Segmented
        options={[
          { value: 'draft', label: t('Draft') },
          { value: 'published', label: t('Published') },
        ]}
        value={form.values.status}
        onChange={(status) => form.set('status', status)}
      />
      <Input sheet label={t('Question')} value={form.values.question} onChangeText={(text) => form.set('question', text)} error={form.errors.question} autoFocus={!faq} />
      <Input sheet label={t('Answer')} value={form.values.answer} onChangeText={(text) => form.set('answer', text)} error={form.errors.answer} multiline />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {faq ? <PillButton label={t('Delete')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
