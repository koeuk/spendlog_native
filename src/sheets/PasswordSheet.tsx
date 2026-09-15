import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useChangePassword } from '@/hooks/profile';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';

/** A new password. No current-password check, as on the web; other devices stay signed in. */
export function PasswordSheet({ sheetRef }: { sheetRef: SheetRef }) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={t('Change password')}>
      <PasswordForm close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function PasswordForm({ close }: { close: () => void }) {
  const t = useT();
  const change = useChangePassword();
  const form = useForm({ password: '', password_confirmation: '' });

  const submit = () =>
    form.submit(
      async () => {
        await change.mutateAsync(form.values);
        toast(t('Password updated.'), 'success');
        close();
      },
      () => ({
        password: form.values.password.length >= 8 ? undefined : t('Use at least 8 characters.'),
        password_confirmation: form.values.password === form.values.password_confirmation ? undefined : t('The passwords do not match.'),
      }),
    );

  return (
    <View style={styles.form}>
      <Input sheet label={t('New password')} value={form.values.password} onChangeText={(text) => form.set('password', text)} error={form.errors.password} secureTextEntry autoCapitalize="none" autoComplete="new-password" autoFocus />
      <Input sheet label={t('Confirm password')} value={form.values.password_confirmation} onChangeText={(text) => form.set('password_confirmation', text)} error={form.errors.password_confirmation} secureTextEntry autoCapitalize="none" returnKeyType="go" onSubmitEditing={submit} />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
