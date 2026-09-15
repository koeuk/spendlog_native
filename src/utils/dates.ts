import dayjs from 'dayjs';
import 'dayjs/locale/km';

import type { Locale } from '@/store/locale';
import type { Ym, Ymd } from '@/types/api';

/**
 * The API speaks `YYYY-MM` months and `YYYY-MM-DD` days as plain strings;
 * these helpers move between them and the labels people read.
 */

export function dateParam(date: Date): Ymd {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayYmd(): Ymd {
  return dateParam(new Date());
}

export function currentYm(): Ym {
  return todayYmd().slice(0, 7);
}

/** A local-time Date for a `YYYY-MM-DD` string; `null` when malformed. */
export function parseYmd(ymd: string | null | undefined): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidYm(value: string): value is Ym {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** `'2026-08'` ± n months, staying in the API's month format. */
export function shiftMonth(ym: Ym, delta: number): Ym {
  const [year, month] = ym.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** `'2026-08'` → `'August 2026'` (or the Khmer month). */
export function monthLabel(ym: Ym, locale: Locale = 'en'): string {
  if (!isValidYm(ym)) return ym;
  return dayjs(`${ym}-01`).locale(locale).format('MMMM YYYY');
}

/** `'2026-08-17'` → `'17 Aug'`. */
export function dayLabel(ymd: Ymd, locale: Locale = 'en'): string {
  const date = parseYmd(ymd);
  return date ? dayjs(date).locale(locale).format('D MMM') : ymd;
}

/** `'2026-08-17'` → `'Mon, 17 Aug 2026'`. */
export function longDate(ymd: Ymd, locale: Locale = 'en'): string {
  const date = parseYmd(ymd);
  return date ? dayjs(date).locale(locale).format('ddd, D MMM YYYY') : ymd;
}

/** An ISO timestamp → `'17 Aug 2026, 14:05'`. */
export function dateTime(iso: string, locale: Locale = 'en'): string {
  const date = dayjs(iso);
  return date.isValid() ? date.locale(locale).format('D MMM YYYY, HH:mm') : iso;
}

/**
 * `'2026-08'` → `['2026-08-01', '2026-08-31']`: the inclusive day range a
 * `filter[from]` / `filter[to]` pair needs to cover exactly one month.
 */
export function monthBounds(ym: Ym): { from: Ymd; to: Ymd } {
  const [year, month] = ym.split('-').map(Number);
  // Day zero of the next month is the last day of this one.
  const last = new Date(year, month, 0);
  return { from: `${ym}-01`, to: dateParam(last) };
}

export function isFutureYmd(ymd: Ymd): boolean {
  return ymd > todayYmd();
}
