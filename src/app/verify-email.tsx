import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { apiErrorMessage, fieldErrors } from '@/api/client';
import { resendVerificationCode, verifyEmail } from '@/api/endpoints/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Txt } from '@/components/Txt';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';

/** The server refuses a second code inside this window. */
const RESEND_COOLDOWN_MS = 60_000;

/**
 * Right after sign-up the server has just mailed a code, so the resend waits
 * out what is left of its minute instead of drawing a guaranteed refusal.
 */
function initialCooldownEnd(createdAt: string | undefined): number {
  const created = createdAt ? Date.parse(createdAt) : NaN;
  if (Number.isNaN(created)) return 0;
  return Math.min(created + RESEND_COOLDOWN_MS, Date.now() + RESEND_COOLDOWN_MS);
}

/**
 * Shown instead of the app while the signed-in account's email is unconfirmed.
 * A good code swaps in the verified user, and the root gate opens the app.
 */
export default function VerifyEmailScreen() {
  const t = useT();
  const theme = useTheme();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const signOut = useSessionStore((state) => state.signOut);
  const form = useForm({ code: '' });
  const [notice, setNotice] = useState<string | undefined>();
  const [resending, setResending] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(() => initialCooldownEnd(user?.created_at));
  const [now, setNow] = useState(() => Date.now());

  const secondsLeft = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));

  useEffect(() => {
    if (cooldownEnd <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownEnd) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownEnd]);

  const submit = async () => {
    const code = form.values.code.trim();
    setNotice(undefined);
    await form.submit(
      async () => {
        const response = await verifyEmail(code);
        toast(t(response.message), 'success');
        setUser(response.user);
      },
      () => ({ code: /^\d{6}$/.test(code) ? undefined : t('Enter the six-digit code.') }),
    );
  };

  const resend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setNotice(undefined);
    form.setErrors({});
    try {
      const response = await resendVerificationCode();
      setNotice(t(response.message));
      const sentAt = Date.now();
      setNow(sentAt);
      setCooldownEnd(sentAt + RESEND_COOLDOWN_MS);
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields.code) form.setErrors({ code: fields.code });
      else toast(t(apiErrorMessage(error)), 'error');
    } finally {
      setResending(false);
    }
  };

  const resendLabel = secondsLeft > 0 ? t('Resend code in :seconds s', { seconds: secondsLeft }) : t('Resend code');
  const resendDisabled = resending || secondsLeft > 0;

  return (
    <AuthShell title={t('Verify your email')} subtitle={t('We sent a six-digit code to :email.', { email: user?.email ?? '' })}>
      <Input
        label={t('Code')}
        value={form.values.code}
        onChangeText={(text) => {
          form.set('code', text.replace(/\D/g, '').slice(0, 6));
          setNotice(undefined);
        }}
        error={form.errors.code}
        hint={notice ?? t('The code lasts ten minutes.')}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <PillButton label={t('Verify')} onPress={submit} loading={form.submitting} block />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: resendDisabled }}
        disabled={resendDisabled}
        onPress={resend}
        style={styles.link}>
        <Txt variant="label" color={resendDisabled ? theme.faint(0.4) : theme.accent} align="center">
          {resendLabel}
        </Txt>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.link}>
        <Txt variant="label" faint={0.6} align="center">
          {t('Sign out')}
        </Txt>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: 4 },
});
