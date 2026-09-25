import { Image } from 'expo-image';
import { ImageOff, ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { assetUrl } from '@/api/env';
import type { PickedFile } from '@/api/multipart';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useBrandingSettings, useUpdateBrandingSettings } from '@/hooks/admin';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { BrandingSettings } from '@/types/api';
import { pickImage } from '@/utils/pickImage';

/** The name and the marks the app wears. */
export default function BrandingSettingsScreen() {
  const t = useT();
  const branding = useBrandingSettings();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Branding')} back />}>
      {branding.isPending ? (
        <SkeletonCard lines={4} />
      ) : branding.isError ? (
        <Card>
          <ErrorState error={branding.error} onRetry={() => void branding.refetch()} compact />
        </Card>
      ) : branding.data ? (
        <BrandingForm key={`${branding.data.app_name}-${branding.data.logo ?? ''}-${branding.data.favicon ?? ''}`} settings={branding.data} />
      ) : null}
    </Screen>
  );
}

function BrandingForm({ settings }: { settings: BrandingSettings }) {
  const t = useT();
  const update = useUpdateBrandingSettings();
  const form = useForm({ app_name: settings.app_name, copyright_holder: settings.copyright_holder ?? '' });
  const [logo, setLogo] = useState<PickedFile | null>(null);
  const [favicon, setFavicon] = useState<PickedFile | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);

  const submit = () =>
    form.submit(
      async () => {
        await update.mutateAsync({
          app_name: form.values.app_name.trim(),
          copyright_holder: form.values.copyright_holder.trim(),
          logo,
          favicon,
          remove_logo: removeLogo,
          remove_favicon: removeFavicon,
        });
        toast(t('Settings saved.'), 'success');
      },
      () => ({ app_name: form.values.app_name.trim() ? undefined : t('Name the app.') }),
    );

  return (
    <Card style={styles.section}>
      <Input label={t('App name')} value={form.values.app_name} onChangeText={(text) => form.set('app_name', text)} error={form.errors.app_name} />
      <Input label={t('Copyright holder')} value={form.values.copyright_holder} onChangeText={(text) => form.set('copyright_holder', text)} hint={t('Blank falls back to the app name.')} />
      <ImageField
        label={t('Logo')}
        current={removeLogo ? null : (logo?.uri ?? assetUrl(settings.logo))}
        onPick={async () => {
          const file = await pickImage({ square: false });
          if (file) {
            setLogo(file);
            setRemoveLogo(false);
          }
        }}
        onRemove={() => {
          setLogo(null);
          setRemoveLogo(true);
        }}
      />
      <ImageField
        label={t('Favicon')}
        current={removeFavicon ? null : (favicon?.uri ?? assetUrl(settings.favicon))}
        onPick={async () => {
          const file = await pickImage();
          if (file) {
            setFavicon(file);
            setRemoveFavicon(false);
          }
        }}
        onRemove={() => {
          setFavicon(null);
          setRemoveFavicon(true);
        }}
      />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </Card>
  );
}

function ImageField({ label, current, onPick, onRemove }: { label: string; current: string | null; onPick: () => Promise<void>; onRemove: () => void }) {
  const t = useT();
  const theme = useTheme();
  return (
    <View style={styles.imageField}>
      <View style={[styles.preview, { backgroundColor: theme.faint(0.05) }]}>
        {current ? <Image source={{ uri: current }} style={styles.previewImage} contentFit="contain" /> : <ImageOff size={22} color={theme.faint(0.35)} />}
      </View>
      <View style={styles.imageBody}>
        <Txt weight="medium">{label}</Txt>
        <View style={styles.imageButtons}>
          <PillButton label={t('Choose')} icon={ImagePlus} variant="tonal" size="sm" onPress={() => void onPick()} />
          {current ? <PillButton label={t('Remove')} variant="ghost" size="sm" onPress={onRemove} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  imageField: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 64, height: 64, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imageBody: { flex: 1, gap: 8 },
  imageButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
