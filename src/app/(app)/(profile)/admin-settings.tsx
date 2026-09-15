import { Image } from 'expo-image';
import { Check, CircleHelp, ImageOff, ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { assetUrl } from '@/api/env';
import type { PickedFile } from '@/api/multipart';
import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { ListRow } from '@/components/ListRow';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useSheet } from '@/components/Sheet';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useBrandingSettings, useColorSettings, useSpendingSettings, useUpdateBrandingSettings, useUpdateColorSettings, useUpdateSpendingSettings } from '@/hooks/admin';
import { useFaqs } from '@/hooks/overview';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { FaqSheet } from '@/sheets/FaqSheet';
import { toast } from '@/store/toast';
import { layout, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { BrandingSettings, ColorSettings, Currency, Faq, SpendingSettings } from '@/types/api';
import { luminance } from '@/utils/color';
import { pickImage } from '@/utils/pickImage';

/** The app-wide knobs: the exchange rate, the guidance texts, the name and marks, the colours, the FAQ. */
export default function AdminSettingsScreen() {
  const t = useT();
  const spending = useSpendingSettings();
  const branding = useBrandingSettings();
  const colors = useColorSettings();
  const faqs = useFaqs();
  const faqSheet = useSheet();
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  const openFaq = (faq: Faq | null) => {
    setEditingFaq(faq);
    faqSheet.present();
  };

  const refresh = () => {
    void spending.refetch();
    void branding.refetch();
    void colors.refetch();
    void faqs.refetch();
  };

  return (
    <>
      <Screen scroll refreshing={spending.isRefetching && !spending.isPending} onRefresh={refresh} bottomInset={layout.fabClearance} contentContainerStyle={styles.content} header={<Header title={t('App settings')} back />}>
        {spending.isPending ? <SkeletonCard lines={4} /> : spending.isError ? <Card><ErrorState error={spending.error} onRetry={refresh} compact /></Card> : spending.data ? <SpendingCard key={spending.data.khr_per_usd + spending.data.spending_warning} settings={spending.data} /> : null}
        {branding.isPending ? <SkeletonCard lines={3} /> : branding.isError ? <Card><ErrorState error={branding.error} onRetry={refresh} compact /></Card> : branding.data ? <BrandingCard key={`${branding.data.app_name}-${branding.data.logo ?? ''}-${branding.data.favicon ?? ''}`} settings={branding.data} /> : null}
        {colors.isPending ? <SkeletonCard lines={3} /> : colors.isError ? <Card><ErrorState error={colors.error} onRetry={refresh} compact /></Card> : colors.data ? <ColorsCard key={`${colors.data.button_color}-${colors.data.body_color}`} settings={colors.data} /> : null}
        <Card padded={false} style={styles.faqCard}>
          <Txt variant="heading" style={styles.faqTitle}>
            {t('FAQ')}
          </Txt>
          {faqs.isPending ? (
            <SkeletonCard lines={2} />
          ) : (faqs.data ?? []).length === 0 ? (
            <Txt faint={0.5} style={styles.faqEmpty}>
              {t('No entries yet. Add your first question.')}
            </Txt>
          ) : (
            (faqs.data ?? []).map((faq, index, all) => (
              <ListRow key={faq.uuid} leading={<CircleHelp size={20} color={faq.status === 'published' ? undefined : '#9CA3AF'} />} title={faq.question} subtitle={t(faq.status === 'published' ? 'Published' : 'Draft')} chevron divider={index < all.length - 1} onPress={() => openFaq(faq)} />
            ))
          )}
        </Card>
      </Screen>
      <Fab onPress={() => openFaq(null)} accessibilityLabel={t('Add question')} />
      <FaqSheet sheetRef={faqSheet.ref} faq={editingFaq} />
    </>
  );
}

function SpendingCard({ settings }: { settings: SpendingSettings }) {
  const t = useT();
  const theme = useTheme();
  const update = useUpdateSpendingSettings();
  const form = useForm({
    enabled: settings.spending_guidance_enabled,
    warning: settings.spending_warning,
    advice: settings.spending_advice,
    khr_per_usd: String(settings.khr_per_usd),
    default_currency: settings.default_currency as Currency,
  });

  const submit = () =>
    form.submit(
      async () => {
        const rate = Number.parseFloat(form.values.khr_per_usd);
        await update.mutateAsync({
          enabled: form.values.enabled,
          warning: form.values.warning,
          advice: form.values.advice,
          khr_per_usd: Number.isFinite(rate) && rate > 0 ? rate : undefined,
          default_currency: form.values.default_currency,
        });
        toast(t('Settings saved.'), 'success');
      },
      () => ({ khr_per_usd: Number.parseFloat(form.values.khr_per_usd) > 0 ? undefined : t('Enter the rate.') }),
    );

  return (
    <Card style={styles.section}>
      <Txt variant="heading">{t('Spending')}</Txt>
      <Input label={t('Riel per dollar')} value={form.values.khr_per_usd} onChangeText={(text) => form.set('khr_per_usd', text.replace(/[^\d.]/g, ''))} error={form.errors.khr_per_usd} keyboardType="decimal-pad" hint={t('Every ៛ entry converts at this rate.')} />
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Default currency')}
      </Txt>
      <Segmented<Currency>
        options={[
          { value: 'USD', label: 'USD' },
          { value: 'KHR', label: 'KHR' },
        ]}
        value={form.values.default_currency}
        onChange={(value) => form.set('default_currency', value)}
      />
      <View style={styles.switchRow}>
        <View style={styles.grow}>
          <Txt weight="medium">{t('Spending guidance')}</Txt>
          <Txt variant="label" faint={0.55}>
            {t('A line of advice on the web dashboard.')}
          </Txt>
        </View>
        <Switch value={form.values.enabled} onValueChange={(value) => form.set('enabled', value)} trackColor={{ true: theme.accent }} thumbColor="#FFFFFF" />
      </View>
      {form.values.enabled ? (
        <>
          <Input label={t('When over budget')} value={form.values.warning} onChangeText={(text) => form.set('warning', text)} multiline />
          <Input label={t('Otherwise')} value={form.values.advice} onChangeText={(text) => form.set('advice', text)} multiline />
        </>
      ) : null}
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </Card>
  );
}

function BrandingCard({ settings }: { settings: BrandingSettings }) {
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
      <Txt variant="heading">{t('Branding')}</Txt>
      <Input label={t('App name')} value={form.values.app_name} onChangeText={(text) => form.set('app_name', text)} error={form.errors.app_name} />
      <Input label={t('Copyright holder')} value={form.values.copyright_holder} onChangeText={(text) => form.set('copyright_holder', text)} hint={t('Blank falls back to the app name.')} />
      <ImageField label={t('Logo')} current={removeLogo ? null : (logo?.uri ?? assetUrl(settings.logo))} onPick={async () => {
        const file = await pickImage({ square: false });
        if (file) {
          setLogo(file);
          setRemoveLogo(false);
        }
      }} onRemove={() => {
        setLogo(null);
        setRemoveLogo(true);
      }} />
      <ImageField label={t('Favicon')} current={removeFavicon ? null : (favicon?.uri ?? assetUrl(settings.favicon))} onPick={async () => {
        const file = await pickImage();
        if (file) {
          setFavicon(file);
          setRemoveFavicon(false);
        }
      }} onRemove={() => {
        setFavicon(null);
        setRemoveFavicon(true);
      }} />
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

function ColorsCard({ settings }: { settings: ColorSettings }) {
  const t = useT();
  const theme = useTheme();
  const update = useUpdateColorSettings();
  const [buttonColor, setButtonColor] = useState(settings.button_color);
  const [bodyColor, setBodyColor] = useState(settings.body_color);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({ button_color: buttonColor, body_color: bodyColor });
      toast(t('Settings saved.'), 'success');
    } catch (error) {
      toast(t(String((error as Error).message ?? 'Something went wrong.')), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.section}>
      <Txt variant="heading">{t('Colours')}</Txt>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Buttons')}
      </Txt>
      <View style={styles.swatches}>
        {settings.button_presets.map((preset) => {
          const active = preset.value.toLowerCase() === buttonColor.toLowerCase();
          return (
            <Pressable key={preset.value} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={preset.label} onPress={() => setButtonColor(preset.value)} style={[styles.swatch, { backgroundColor: preset.value, borderColor: active ? theme.text : 'transparent' }]}>
              {active ? <Check size={16} color={luminance(preset.value) > 0.45 ? '#171717' : '#FFFFFF'} strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Background')}
      </Txt>
      <View style={styles.swatches}>
        {settings.body_presets.map((preset) => {
          const active = preset.value.toLowerCase() === bodyColor.toLowerCase();
          return (
            <Pressable key={preset.value} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={preset.label} onPress={() => setBodyColor(preset.value)} style={[styles.swatch, { backgroundColor: preset.value, borderColor: active ? theme.text : theme.hairline }]}>
              {active ? <Check size={16} color="#171717" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <PillButton label={t('Save')} onPress={() => void submit()} loading={saving} block />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  label: { marginLeft: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  grow: { flex: 1 },
  imageField: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 64, height: 64, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imageBody: { flex: 1, gap: 8 },
  imageButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  faqCard: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  faqTitle: { marginBottom: 4 },
  faqEmpty: { paddingVertical: 12 },
});
