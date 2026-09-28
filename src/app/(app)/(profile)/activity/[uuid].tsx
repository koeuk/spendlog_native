import { useLocalSearchParams } from 'expo-router';
import { ArrowRight, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { renderValue } from '@/components/ActivityRow';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useActivityEntry } from '@/hooks/overview';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { ActivityAction } from '@/types/api';
import { dateTime } from '@/utils/dates';

const ICONS: Record<ActivityAction, LucideIcon> = { created: Plus, updated: Pencil, deleted: Trash2 };

/** One record of the log in full: what was touched, by whom, when, and every field that moved. */
export default function ActivityEntryScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const { uuid = '' } = useLocalSearchParams<{ uuid: string }>();
  const entry = useActivityEntry(uuid);

  if (!entry) {
    return (
      <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Activity')} back />}>
        <Card>
          <EmptyState title={t('Nothing found.')} compact />
        </Card>
      </Screen>
    );
  }

  const tint = entry.action === 'deleted' ? theme.errorInk : entry.action === 'created' ? theme.accent : theme.faint(0.6);
  const action = t(entry.action === 'created' ? 'Created' : entry.action === 'updated' ? 'Updated' : 'Deleted');
  const changes = entry.changes ? Object.entries(entry.changes) : [];

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Activity')} back />}>
      <Card style={styles.head}>
        <IconDisc icon={ICONS[entry.action] ?? Pencil} color={tint} size={44} />
        <Txt variant="heading">{entry.label}</Txt>
        <Txt variant="label" faint={0.55}>
          {action} · {t(entry.subject.replace(/_/g, ' '))}
        </Txt>
      </Card>

      <Card style={styles.facts}>
        <Fact label={t('When')} value={dateTime(entry.created_at, locale)} />
        {entry.user?.name ? <Fact label={t('Who')} value={entry.user.name} /> : null}
      </Card>

      <Card style={styles.facts}>
        <Txt variant="heading">{t('Changes')}</Txt>
        {changes.length === 0 ? (
          // A create or a delete records the row, not a diff between two of them.
          <Txt faint={0.5}>{t('No field changes were recorded.')}</Txt>
        ) : (
          changes.map(([field, change], index) => (
            <View key={field} style={[styles.change, index < changes.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }]}>
              <Txt variant="label" faint={0.55}>
                {t(field.replace(/_/g, ' '))}
              </Txt>
              <View style={styles.values}>
                <Txt faint={0.5} style={styles.value}>
                  {renderValue(change.from)}
                </Txt>
                <ArrowRight size={15} color={theme.faint(0.35)} />
                <Txt weight="medium" style={styles.value}>
                  {renderValue(change.to)}
                </Txt>
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Txt variant="label" faint={0.55}>
        {label}
      </Txt>
      <Txt weight="medium" style={styles.factValue}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4, paddingHorizontal: layout.pageInset },
  head: { gap: 8, alignItems: 'flex-start' },
  facts: { gap: 12 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  factValue: { flex: 1, textAlign: 'right' },
  change: { gap: 4, paddingBottom: 10 },
  values: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  value: { flexShrink: 1 },
});
