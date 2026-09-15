import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { forgotPassword } from '@/api/endpoints/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';

export default function ForgotPasswordScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const form = useForm({ email: '' });

  const submit = async () => {
    const email = form.values.email.trim();
    const ok = await form.submit(
      () => forgotPassword(email),
      () => ({ email: email ? undefined : t('Enter your email.') }),
    );
    if (ok) {
      toast(t('We emailed you a six-digit code.'), 'success');
      router.push({ pathname: '/reset-password', params: { email } });
    }
  };

  return (
    <AuthShell title={t('Forgot password')} subtitle={t('Enter your email and we will send a six-digit code.')}>
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
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <PillButton label={t('Send code')} onPress={submit} loading={form.submitting} block />
      <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/reset-password', params: { email: form.values.email.trim() } })} style={styles.link}>
        <Txt variant="label" color={theme.accent} align="center">
          {t('I already have a code')}
        </Txt>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.link}>
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
