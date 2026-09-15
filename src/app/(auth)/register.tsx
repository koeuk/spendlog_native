import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { register } from '@/api/endpoints/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme/useTheme';
import { deviceName } from '@/utils/device';

export default function RegisterScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const form = useForm({ name: '', email: '', password: '', password_confirmation: '' });

  const submit = () =>
    form.submit(
      async () => {
        const auth = await register({
          name: form.values.name.trim(),
          email: form.values.email.trim(),
          password: form.values.password,
          password_confirmation: form.values.password_confirmation,
          device_name: deviceName(),
        });
        await signIn(auth);
      },
      () => ({
        name: form.values.name.trim() ? undefined : t('Enter your name.'),
        email: form.values.email.trim() ? undefined : t('Enter your email.'),
        password: form.values.password.length >= 8 ? undefined : t('Use at least 8 characters.'),
        password_confirmation: form.values.password === form.values.password_confirmation ? undefined : t('The passwords do not match.'),
      }),
    );

  return (
    <AuthShell title={t('Create an account')} subtitle={t('Start logging what you spend.')}>
      <Input label={t('Name')} value={form.values.name} onChangeText={(text) => form.set('name', text)} error={form.errors.name} autoComplete="name" textContentType="name" />
      <Input
        label={t('Email')}
        value={form.values.email}
        onChangeText={(text) => form.set('email', text)}
        error={form.errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Input
        label={t('Password')}
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
      <PillButton label={t('Create account')} onPress={submit} loading={form.submitting} block />
      <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.link}>
        <Txt variant="label" color={theme.accent} align="center">
          {t('Already have an account? Sign in')}
        </Txt>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: 4 },
});
