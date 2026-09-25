import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Camera, CircleHelp, Coins, Contrast, FileQuestion, KeyRound, Languages, LogOut, Lightbulb, Palette, Sparkles, Trash2, Users, Wallet } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { SettingsGroup } from '@/components/SettingsGroup';
import { Sheet, useSheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useAvatar } from '@/hooks/profile';
import { useT } from '@/i18n';
import { PasswordSheet } from '@/sheets/PasswordSheet';
import { ProfileSheet } from '@/sheets/ProfileSheet';
import { LOCALES, useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import { confirm } from '@/utils/confirm';
import { pickImage } from '@/utils/pickImage';

import { APPEARANCE_OPTIONS } from './appearance';

/**
 * The account page, as one grouped list: what each row is set to reads at a
 * glance, and the value itself is chosen on the row's own page rather than in
 * a form stacked here.
 */
export default function SettingsScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const mode = useThemeStore((state) => state.mode);
  const locale = useLocaleStore((state) => state.locale);
  const avatar = useAvatar();
  const profileSheet = useSheet();
  const passwordSheet = useSheet();
  const avatarSheet = useSheet();

  const icon = (Icon: typeof Wallet) => <Icon size={22} color={theme.faint(0.7)} />;
  const appearanceLabel = APPEARANCE_OPTIONS.find((option) => option.value === mode)?.label ?? 'System';
  const languageLabel = LOCALES.find((option) => option.code === locale)?.label ?? '';

  const choosePhoto = async () => {
    avatarSheet.dismiss();
    const file = await pickImage();
    if (!file) return;
    try {
      await avatar.upload.mutateAsync(file);
      toast(t('Photo updated.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const removePhoto = async () => {
    avatarSheet.dismiss();
    try {
      await avatar.remove.mutateAsync();
      toast(t('Photo removed.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const leave = async () => {
    const ok = await confirm({ title: t('Sign out?'), message: t('Only this device is signed out.'), confirmLabel: t('Sign out') });
    if (ok) await signOut();
  };

  if (!user) return null;

  return (
    <>
      <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Settings')} back />}>
        <Card style={styles.profile}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Change photo')} onPress={avatarSheet.present} style={styles.avatarWrap}>
            <Avatar name={user.name} url={user.avatar_url} size={72} />
            <View style={[styles.camera, { backgroundColor: theme.accent }]}>
              <Camera size={14} color={theme.onAccent} />
            </View>
          </Pressable>
          <View style={styles.identity}>
            <Txt variant="heading" numberOfLines={1}>
              {user.name}
            </Txt>
            <Txt variant="label" faint={0.55} numberOfLines={1}>
              {user.email}
            </Txt>
            {user.username ? (
              <Txt variant="label" faint={0.55} numberOfLines={1}>
                @{user.username}
              </Txt>
            ) : null}
          </View>
          <PillButton label={t('Edit')} variant="tonal" size="sm" onPress={profileSheet.present} />
        </Card>

        <SettingsGroup title={t('General')}>
          <ListRow leading={icon(Contrast)} title={t('Appearance')} trailingText={t(appearanceLabel)} trailingColor={theme.faint(0.5)} chevron divider onPress={() => router.push('/appearance')} />
          <ListRow leading={icon(Languages)} title={t('Language')} trailingText={languageLabel} trailingColor={theme.faint(0.5)} chevron divider onPress={() => router.push('/language')} />
          <ListRow leading={icon(Coins)} title={t('Currency')} trailingText={user.preferences?.currency ?? t('App default')} trailingColor={theme.faint(0.5)} chevron divider onPress={() => router.push('/currency')} />
          <ListRow leading={icon(Palette)} title={t('Colours')} trailingText={user.preferences?.button_color || user.preferences?.body_color ? t('Your own') : t('App default')} trailingColor={theme.faint(0.5)} chevron onPress={() => router.push('/my-colours')} />
        </SettingsGroup>

        {user.is_admin ? (
          <SettingsGroup title={t('App')}>
            <ListRow leading={icon(Wallet)} title={t('Spending')} chevron divider onPress={() => router.push('/spending')} />
            <ListRow leading={icon(Lightbulb)} title={t('Guidance')} chevron divider onPress={() => router.push('/guidance')} />
            <ListRow leading={icon(FileQuestion)} title={t('FAQ')} chevron divider onPress={() => router.push('/faqs')} />
            <ListRow leading={icon(Sparkles)} title={t('Branding')} chevron divider onPress={() => router.push('/branding')} />
            <ListRow leading={icon(Palette)} title={t('App colours')} chevron divider onPress={() => router.push('/colours')} />
            <ListRow leading={icon(Users)} title={t('Users')} chevron onPress={() => router.push('/admin-users')} />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title={t('Account')}>
          <ListRow leading={icon(KeyRound)} title={t('Change password')} chevron divider onPress={passwordSheet.present} />
          <ListRow leading={icon(CircleHelp)} title={t('Help')} chevron divider onPress={() => router.push('/help')} />
          <ListRow leading={<LogOut size={22} color={theme.errorInk} />} title={t('Sign out')} titleColor={theme.errorInk} onPress={() => void leave()} />
        </SettingsGroup>

        <Txt variant="caption" faint={0.4} align="center">
          SpendLog {Constants.expoConfig?.version ?? ''}
        </Txt>
      </Screen>
      <ProfileSheet sheetRef={profileSheet.ref} />
      <PasswordSheet sheetRef={passwordSheet.ref} />
      <Sheet sheetRef={avatarSheet.ref} title={t('Profile photo')}>
        <View>
          <ListRow leading={<Camera size={22} color={theme.faint(0.7)} />} title={t('Choose a photo')} subtitle={t('JPEG, PNG or WebP, up to 4 MB')} divider={!!user.avatar_url} onPress={() => void choosePhoto()} />
          {user.avatar_url ? <ListRow leading={<Trash2 size={22} color={theme.errorInk} />} title={t('Remove photo')} onPress={() => void removePhoto()} /> : null}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingTop: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative' },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, gap: 2 },
});
