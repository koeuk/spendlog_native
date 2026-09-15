import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { login } from '@/api/endpoints/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme/useTheme';
import { deviceName } from '@/utils/device';

export default function LoginScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const form = useForm({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const submit = () =>
    form.submit(
      async () => {
        const auth = await login({ email: form.values.email.trim(), password: form.values.password, device_name: deviceName() });
        await signIn(auth);
      },
      () => ({
        email: form.values.email.trim() ? undefined : t('Enter your email or username.'),
        password: form.values.password ? undefined : t('Enter your password.'),
      }),
    );

  return (
    <AuthShell title={t('Welcome back')} subtitle={t('Sign in to keep logging.')}>
      <Input
        label={t('Email or username')}
        value={form.values.email}
        onChangeText={(text) => form.set('email', text)}
        error={form.errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
      />
      <Input
        label={t('Password')}
        value={form.values.password}
        onChangeText={(text) => form.set('password', text)}
        error={form.errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? t('Hide password') : t('Show password')} hitSlop={8} onPress={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={20} color={theme.faint(0.5)} /> : <Eye size={20} color={theme.faint(0.5)} />}
          </Pressable>
        }
      />
      <PillButton label={t('Sign in')} onPress={submit} loading={form.submitting} block />
      <View style={styles.links}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/forgot-password')}>
          <Txt variant="label" color={theme.accent}>
            {t('Forgot password?')}
          </Txt>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/register')}>
          <Txt variant="label" color={theme.accent}>
            {t('Create an account')}
          </Txt>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 4 },
});
