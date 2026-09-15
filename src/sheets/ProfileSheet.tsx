import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useUpdateProfile } from '@/hooks/profile';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { toast } from '@/store/toast';
import type { User } from '@/types/api';

/** The account's own details. A blank username releases the handle. */
export function ProfileSheet({ sheetRef }: { sheetRef: SheetRef }) {
  const t = useT();
  const user = useSessionStore((state) => state.user);
  if (!user) return null;
  return (
    <Sheet sheetRef={sheetRef} title={t('Edit profile')}>
      <ProfileForm key={`${user.uuid}-${user.name}-${user.email}-${user.username ?? ''}-${user.phone ?? ''}`} user={user} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function ProfileForm({ user, close }: { user: User; close: () => void }) {
  const t = useT();
  const update = useUpdateProfile();
  const form = useForm({ name: user.name, username: user.username ?? '', email: user.email, phone: user.phone ?? '' });

  const submit = () =>
    form.submit(
      async () => {
        const { name, username, email, phone } = form.values;
        await update.mutateAsync({ name: name.trim(), username: username.trim() || null, email: email.trim(), phone: phone.trim() || null });
        toast(t('Profile updated.'), 'success');
        close();
      },
      () => ({
        name: form.values.name.trim() ? undefined : t('Enter your name.'),
        email: form.values.email.trim() ? undefined : t('Enter your email.'),
      }),
    );

  return (
    <View style={styles.form}>
      <Input sheet label={t('Name')} value={form.values.name} onChangeText={(text) => form.set('name', text)} error={form.errors.name} autoComplete="name" />
      <Input sheet label={t('Username')} value={form.values.username} onChangeText={(text) => form.set('username', text)} error={form.errors.username} autoCapitalize="none" autoCorrect={false} hint={t('Optional. Leave it blank to release it.')} />
      <Input sheet label={t('Email')} value={form.values.email} onChangeText={(text) => form.set('email', text)} error={form.errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" hint={t('Changing this means verifying the new address.')} />
      <Input sheet label={t('Phone')} value={form.values.phone} onChangeText={(text) => form.set('phone', text)} error={form.errors.phone} keyboardType="phone-pad" autoComplete="tel" />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
