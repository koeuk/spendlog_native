import { Check, ChevronDown, Globe, Search, User as UserIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { ListRow } from '@/components/ListRow';
import { PillButton } from '@/components/PillButton';
import { Sheet, useSheet, type SheetRef } from '@/components/Sheet';
import { TimeField } from '@/components/TimeField';
import { Txt } from '@/components/Txt';
import { useAdminUserSearch } from '@/hooks/admin';
import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Ymd } from '@/types/api';

/** Whose log: the account's own, everyone's, or one named person's. */
export type ActivityPerson = { kind: 'me' } | { kind: 'all' } | { kind: 'user'; uuid: string; name: string };

/** One end of the window: a day, and optionally a time within it. */
export interface ActivityMoment {
  date: Ymd;
  time: string | null;
}

export interface ActivityListFilters {
  person: ActivityPerson;
  from: ActivityMoment | null;
  to: ActivityMoment | null;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityListFilters = { person: { kind: 'me' }, from: null, to: null };

export function hasActivityFilters(filters: ActivityListFilters): boolean {
  return filters.person.kind !== 'me' || filters.from !== null || filters.to !== null;
}

/** The API's form of one end: a bare day covers all of it, a time pins it. */
export function momentParam(moment: ActivityMoment | null): string | undefined {
  if (!moment) return undefined;
  return moment.time ? `${moment.date}T${moment.time}` : moment.date;
}

interface ActivityFilterSheetProps {
  sheetRef: SheetRef;
  filters: ActivityListFilters;
  onChange: (filters: ActivityListFilters) => void;
  isAdmin: boolean;
}

/** Narrow the activity log: for admins whose, and for everyone when. */
export function ActivityFilterSheet({ sheetRef, filters, onChange, isAdmin }: ActivityFilterSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={t('Filters')}>
      <FilterForm
        // Remounted on every open, so an abandoned edit does not linger.
        key={JSON.stringify(filters)}
        filters={filters}
        isAdmin={isAdmin}
        onApply={(next) => {
          onChange(next);
          sheetRef.current?.dismiss();
        }}
      />
    </Sheet>
  );
}

function FilterForm({ filters, isAdmin, onApply }: { filters: ActivityListFilters; isAdmin: boolean; onApply: (filters: ActivityListFilters) => void }) {
  const t = useT();
  const theme = useTheme();
  const [draft, setDraft] = useState(filters);
  const backwards = !!draft.from && !!draft.to && momentParam(draft.to)! < momentParam(draft.from)!;

  const setEnd = (end: 'from' | 'to', moment: { date?: Ymd | null; time?: string | null }) => {
    const current = draft[end];
    if (moment.date === null) return setDraft({ ...draft, [end]: null });
    const date = moment.date ?? current?.date;
    // A time with no day means nothing; it waits for the day to be picked.
    if (!date) return;
    setDraft({ ...draft, [end]: { date, time: moment.time !== undefined ? moment.time : (current?.time ?? null) } });
  };

  return (
    <View style={styles.form}>
      {isAdmin ? <PersonField value={draft.person} onChange={(person) => setDraft({ ...draft, person })} /> : null}
      <View style={styles.row}>
        <View style={styles.date}>
          <DateField label={t('From')} value={draft.from?.date ?? null} onChange={(date) => setEnd('from', { date })} placeholder={t('Any time')} maximumDate={new Date()} clearable />
        </View>
        <View style={styles.time}>
          <TimeField label=" " value={draft.from?.time ?? null} onChange={(time) => setEnd('from', { time })} placeholder="00:00" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.date}>
          <DateField label={t('To')} value={draft.to?.date ?? null} onChange={(date) => setEnd('to', { date })} placeholder={t('Any time')} maximumDate={new Date()} clearable />
        </View>
        <View style={styles.time}>
          <TimeField label=" " value={draft.to?.time ?? null} onChange={(time) => setEnd('to', { time })} placeholder="23:59" />
        </View>
      </View>
      {backwards ? (
        <Txt variant="label" color={theme.errorInk}>
          {t('The end cannot come before the start.')}
        </Txt>
      ) : null}
      <PillButton label={t('Apply')} onPress={() => onApply(draft)} disabled={backwards} block />
      <PillButton label={t('Reset')} variant="ghost" onPress={() => onApply(DEFAULT_ACTIVITY_FILTERS)} block />
    </View>
  );
}

/** The chosen person as a field; tapping it opens a searchable list of accounts. */
function PersonField({ value, onChange }: { value: ActivityPerson; onChange: (person: ActivityPerson) => void }) {
  const t = useT();
  const theme = useTheme();
  const sheet = useSheet();
  const label = value.kind === 'me' ? t('Only me') : value.kind === 'all' ? t('Everyone') : value.name;

  return (
    <View style={styles.personField}>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Person')}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Person')}
        accessibilityValue={{ text: label }}
        onPress={sheet.present}
        style={({ pressed }) => [styles.field, { backgroundColor: theme.fieldFill, borderColor: theme.inputBorder, opacity: pressed ? 0.8 : 1 }]}>
        <UserIcon size={18} color={theme.faint(0.5)} />
        <Txt style={styles.grow} numberOfLines={1}>
          {label}
        </Txt>
        <ChevronDown size={18} color={theme.faint(0.4)} />
      </Pressable>
      <Sheet sheetRef={sheet.ref} title={t('Person')}>
        <PersonSearch
          value={value}
          onPick={(person) => {
            onChange(person);
            sheet.dismiss();
          }}
        />
      </Sheet>
    </View>
  );
}

function PersonSearch({ value, onPick }: { value: ActivityPerson; onPick: (person: ActivityPerson) => void }) {
  const t = useT();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim(), 300);
  const people = useAdminUserSearch(search);
  const tick = <Check size={18} color={theme.accent} />;

  return (
    <View style={styles.form}>
      <Input sheet value={query} onChangeText={setQuery} placeholder={t('Search by name or email')} left={<Search size={18} color={theme.faint(0.5)} />} autoCapitalize="none" autoCorrect={false} />
      <View>
        <ListRow leading={<UserIcon size={22} color={theme.faint(0.7)} />} title={t('Only me')} trailing={value.kind === 'me' ? tick : undefined} divider onPress={() => onPick({ kind: 'me' })} />
        <ListRow leading={<Globe size={22} color={theme.faint(0.7)} />} title={t('Everyone')} trailing={value.kind === 'all' ? tick : undefined} divider onPress={() => onPick({ kind: 'all' })} />
        {people.items.map((person, index) => (
          <ListRow
            key={person.uuid}
            leading={<Avatar name={person.name} url={person.avatar_url} size={34} />}
            title={person.name}
            subtitle={person.email}
            trailing={value.kind === 'user' && value.uuid === person.uuid ? tick : undefined}
            divider={index < people.items.length - 1}
            onPress={() => onPick({ kind: 'user', uuid: person.uuid, name: person.name })}
          />
        ))}
      </View>
      {people.isPending || people.isFetchingNextPage ? (
        <ActivityIndicator color={theme.accent} />
      ) : people.items.length === 0 && search ? (
        <Txt faint={0.55} align="center">
          {t('Nothing found.')}
        </Txt>
      ) : people.hasNextPage ? (
        <PillButton label={t('Load more')} variant="tonal" onPress={() => void people.fetchNextPage()} block />
      ) : null}
    </View>
  );
}

/** The value, once it has stopped changing for `delay` ms: one request per pause, not per keystroke. */
function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  date: { flex: 1.5 },
  time: { flex: 1 },
  personField: { gap: 6 },
  label: { marginLeft: 12 },
  field: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  grow: { flex: 1 },
});
