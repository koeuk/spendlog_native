import { Camera, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { FormActions } from '@/components/FormActions';
import { FormScreen } from '@/components/FormScreen';
import { Input } from '@/components/Input';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useAdminUserAvatar, useDeleteAdminUser, useSaveAdminUser } from '@/hooks/admin';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { AdminUser, RoleName, UserStatus } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { pickImage } from '@/utils/pickImage';

const ROLES: { value: Exclude<RoleName, 'super_admin'>; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export const STATUSES: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

interface AdminUserFormProps {
  title: string;
  /** The account being edited, or null for a new one. */
  user: AdminUser | null;
  /** Called once the account is saved or deleted; the page leaves. */
  onDone: () => void;
}

/**
 * An account, as an admin sees it: details, role, status, photo. The page
 * frame lives here so Save and Delete can sit in the pinned footer beside the
 * state they read. The photo saves on its own, the moment one is picked.
 */
export function AdminUserForm({ title, user, onDone }: AdminUserFormProps) {
  const t = useT();
  const save = useSaveAdminUser();
  const remove = useDeleteAdminUser();
  const avatar = useAdminUserAvatar();
  const form = useForm({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: (user?.role === 'admin' ? 'admin' : 'user') as Exclude<RoleName, 'super_admin'>,
    status: (user?.status ?? 'active') as UserStatus,
  });

  const submit = () =>
    form.submit(
      async () => {
        const { name, email, password, password_confirmation, role, status } = form.values;
        await save.mutateAsync({
          uuid: user?.uuid,
          payload: { name: name.trim(), email: email.trim(), role, status, ...(password ? { password, password_confirmation } : {}) },
        });
        toast(t(user ? 'User updated.' : 'User added.'), 'success');
        onDone();
      },
      () => ({
        name: form.values.name.trim() ? undefined : t('Enter a name.'),
        email: form.values.email.trim() ? undefined : t('Enter an email.'),
        password: !user && form.values.password.length < 8 ? t('Use at least 8 characters.') : form.values.password && form.values.password.length < 8 ? t('Use at least 8 characters.') : undefined,
        password_confirmation: form.values.password !== form.values.password_confirmation ? t('The passwords do not match.') : undefined,
      }),
    );

  const destroy = async () => {
    if (!user) return;
    const ok = await confirm({ title: t('Delete this user?'), message: user.email, confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(user.uuid);
      toast(t('User deleted.'), 'success');
      onDone();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const choosePhoto = async () => {
    if (!user) return;
    const file = await pickImage();
    if (!file) return;
    try {
      await avatar.upload.mutateAsync({ uuid: user.uuid, file });
      toast(t('Photo updated.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    try {
      await avatar.remove.mutateAsync(user.uuid);
      toast(t('Photo removed.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <FormScreen
      title={title}
      footer={
        <FormActions
          saveLabel={t('Save')}
          onSave={submit}
          saving={form.submitting}
          deleteLabel={user ? t('Delete') : undefined}
          onDelete={user ? destroy : undefined}
          deleting={remove.isPending}
        />
      }>
      <View style={styles.form}>
        {user ? (
          <View style={styles.photoRow}>
            <Avatar name={user.name} url={user.avatar_url} size={56} />
            <View style={styles.photoButtons}>
              <PillButton label={t('Choose a photo')} icon={Camera} variant="tonal" size="sm" onPress={() => void choosePhoto()} loading={avatar.upload.isPending} />
              {user.avatar_url ? <PillButton label={t('Remove')} icon={Trash2} variant="ghost" size="sm" onPress={() => void removePhoto()} loading={avatar.remove.isPending} /> : null}
            </View>
          </View>
        ) : null}
        <Input label={t('Name')} value={form.values.name} onChangeText={(text) => form.set('name', text)} error={form.errors.name} autoFocus={!user} />
        <Input label={t('Email')} value={form.values.email} onChangeText={(text) => form.set('email', text)} error={form.errors.email} autoCapitalize="none" keyboardType="email-address" />
        <Input label={user ? t('New password') : t('Password')} value={form.values.password} onChangeText={(text) => form.set('password', text)} error={form.errors.password} secureTextEntry autoCapitalize="none" hint={user ? t('Leave blank to keep the current one.') : undefined} />
        <Input label={t('Confirm password')} value={form.values.password_confirmation} onChangeText={(text) => form.set('password_confirmation', text)} error={form.errors.password_confirmation} secureTextEntry autoCapitalize="none" />
        <OptionPicker label={t('Role')} value={form.values.role} onChange={(value) => form.set('role', value)} options={ROLES.map((role) => ({ value: role.value, label: t(role.label) }))} />
        <OptionPicker label={t('Status')} value={form.values.status} onChange={(value) => form.set('status', value)} options={STATUSES.map((status) => ({ value: status.value, label: t(status.label) }))} />
        {user?.role === 'super_admin' ? (
          <Txt variant="label" faint={0.5}>
            {t('This is the owner account; its role cannot be changed here.')}
          </Txt>
        ) : null}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoButtons: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
