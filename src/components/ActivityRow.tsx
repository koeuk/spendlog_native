import { Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useTheme } from '@/theme/useTheme';
import type { ActivityAction, ActivityEntry } from '@/types/api';
import { dateTime } from '@/utils/dates';

import { Card } from './Card';
import { IconDisc } from './IconDisc';
import { Txt } from './Txt';

const ICONS: Record<ActivityAction, LucideIcon> = { created: Plus, updated: Pencil, deleted: Trash2 };

function render(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface ActivityRowProps {
  entry: ActivityEntry;
  first: boolean;
  last: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** Shown only where the log covers more than one person. */
  actor?: string | null;
}

/**
 * One line of the log, as the Activity screen and the savings history both
 * draw it — shared so the two cannot drift into describing the same record
 * differently.
 */
export function ActivityRow({ entry, first, last, expanded, onToggle, actor = null }: ActivityRowProps) {
  const theme = useTheme();
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const tint = entry.action === 'deleted' ? theme.errorInk : entry.action === 'created' ? theme.accent : theme.faint(0.6);
  const changes = entry.changes ? Object.entries(entry.changes) : [];
  const action = t(entry.action === 'created' ? 'Created' : entry.action === 'updated' ? 'Updated' : 'Deleted');
  const subject = t(entry.subject.replace(/_/g, ' '));

  return (
    <Card padded={false} style={[styles.rowCard, first && styles.firstRow, last && styles.lastRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }]}>
      <Pressable accessibilityRole={changes.length ? 'button' : undefined} onPress={changes.length ? onToggle : undefined} style={styles.row}>
        <IconDisc icon={ICONS[entry.action] ?? Pencil} color={tint} size={36} />
        <View style={styles.body}>
          <Txt weight="medium" numberOfLines={2}>
            {entry.label}
          </Txt>
          <Txt variant="label" faint={0.55} numberOfLines={1}>
            {[`${action} · ${subject}`, actor, dateTime(entry.created_at, locale)].filter(Boolean).join(' · ')}
          </Txt>
          {expanded && changes.length ? (
            <View style={styles.changes}>
              {changes.map(([field, change]) => (
                <Txt key={field} variant="label" faint={0.7}>
                  {t(field.replace(/_/g, ' '))}: {render(change.from)} → {render(change.to)}
                </Txt>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowCard: { paddingHorizontal: 14, borderRadius: 0 },
  firstRow: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lastRow: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  body: { flex: 1, gap: 3 },
  changes: { marginTop: 6, gap: 2 },
});
