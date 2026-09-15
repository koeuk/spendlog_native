import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { resetPassword } from '@/api/endpoints/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';

export default function ResetPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const form = useForm({ email: params.email ?? '', code: '', password: '', password_confirmation: '' });

  const submit = async () => {
    const ok = await form.submit(
      () =>
        resetPassword({
          email: form.values.email.trim(),
          code: form.values.code.trim(),
          password: form.values.password,
          password_confirmation: form.values.password_confirmation,
        }),
      () => ({
        email: form.values.email.trim() ? undefined : t('Enter your email.'),
        code: /^\d{6}$/.test(form.values.code.trim()) ? undefined : t('Enter the six-digit code.'),
        password: form.values.password.length >= 8 ? undefined : t('Use at least 8 characters.'),
        password_confirmation: form.values.password === form.values.password_confirmation ? undefined : t('The passwords do not match.'),
      }),
    );
    if (ok) {
      toast(t('Your password has been reset. Sign in with the new one.'), 'success');
      router.dismissTo('/login');
    }
  };

  return (
    <AuthShell title={t('Reset password')} subtitle={t('The code lasts ten minutes and works once.')}>
      <Input
        label={t('Email')}
        value={form.values.email}
        onChangeText={(text) => form.set('email', text)}
        error={form.errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Input
        label={t('Code')}
        value={form.values.code}
        onChangeText={(text) => form.set('code', text.replace(/\D/g, '').slice(0, 6))}
        error={form.errors.code}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
      />
      <Input
        label={t('New password')}
        value={form.values.password}
        onChangeText={(text) => form.set('password', text)}
        error={form.errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Input
        label={t('Confirm password')}
        value={form.values.password_confirmation}
        onChangeText={(text) => form.set('password_confirmation', text)}
        error={form.errors.password_confirmation}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <PillButton label={t('Reset password')} onPress={submit} loading={form.submitting} block />
      <Pressable accessibilityRole="link" onPress={() => router.dismissTo('/login')} style={styles.link}>
        <Txt variant="label" faint={0.6} align="center">
          {t('Back to sign in')}
        </Txt>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: 4 },
});
