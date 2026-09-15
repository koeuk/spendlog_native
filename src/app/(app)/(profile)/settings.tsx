import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Camera, CircleHelp, KeyRound, LogOut, Settings2, Trash2, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Sheet, useSheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useAvatar } from '@/hooks/profile';
import { useT } from '@/i18n';
import { PasswordSheet } from '@/sheets/PasswordSheet';
import { ProfileSheet } from '@/sheets/ProfileSheet';
import { LOCALES, useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { useThemeStore, type ThemeMode } from '@/store/theme';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import { confirm } from '@/utils/confirm';
import { pickImage } from '@/utils/pickImage';

/** The account page: photo, details, appearance, password, and the admin doors. */
export default function SettingsScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const avatar = useAvatar();
  const profileSheet = useSheet();
  const passwordSheet = useSheet();
  const avatarSheet = useSheet();

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

        <Card padded={false} style={styles.list}>
          <ListRow leading={<KeyRound size={22} color={theme.faint(0.7)} />} title={t('Change password')} chevron divider onPress={passwordSheet.present} />
          <ListRow leading={<CircleHelp size={22} color={theme.faint(0.7)} />} title={t('Help')} chevron onPress={() => router.push('/help')} />
        </Card>

        <Card style={styles.section}>
          <Txt variant="heading">{t('Appearance')}</Txt>
          <Segmented<ThemeMode>
            options={[
              { value: 'light', label: t('Light') },
              { value: 'dark', label: t('Dark') },
              { value: 'system', label: t('System') },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Txt variant="heading" style={styles.subheading}>
            {t('Language')}
          </Txt>
          <Segmented options={LOCALES.map((option) => ({ value: option.code, label: option.label }))} value={locale} onChange={setLocale} />
        </Card>

        {user.is_admin ? (
          <Card padded={false} style={styles.list}>
            <Txt variant="heading" style={styles.listTitle}>
              {t('Admin')}
            </Txt>
            <ListRow leading={<Users size={22} color={theme.faint(0.7)} />} title={t('Users')} chevron divider onPress={() => router.push('/admin-users')} />
            <ListRow leading={<Settings2 size={22} color={theme.faint(0.7)} />} title={t('App settings')} chevron onPress={() => router.push('/admin-settings')} />
          </Card>
        ) : null}

        <PillButton label={t('Sign out')} icon={LogOut} variant="outline" onPress={leave} block />
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
  content: { gap: 14, paddingTop: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative' },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, gap: 2 },
  list: { paddingHorizontal: 16 },
  listTitle: { paddingTop: 14 },
  section: { gap: 10 },
  subheading: { marginTop: 6 },
});
