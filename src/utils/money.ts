import type { Currency, Money } from '@/types/api';

/**
 * The API speaks money as `"12.50"` strings, displayed verbatim: nothing here
 * goes through a float on the way to the screen. Only chart geometry parses.
 */

function groupThousands(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Splits `"-1234.5"` into its sign, grouped integer part and two-place fraction. */
function parts(value: Money | number | null | undefined): { negative: boolean; integer: string; fraction: string } {
  const raw = value === null || value === undefined ? '0' : typeof value === 'number' ? value.toFixed(2) : String(value).trim();
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ''] = unsigned.split('.');
  const integer = groupThousands(integerPart.replace(/\D/g, '') || '0');
  const fraction = (fractionPart.replace(/\D/g, '') + '00').slice(0, 2);
  return { negative, integer, fraction };
}

export type MoneySign = 'abs' | 'signed';

/**
 * `"1234.50"` → `"$1,234.50"`.
 *
 * `abs` (the default) drops a leading minus: the API reports an overspend as
 * `remaining: "-6.00"` and every screen says "over" in words, so the sign would
 * read twice. `signed` keeps it, with a real minus sign, for figures that
 * legitimately go negative like a month's balance.
 */
export function formatMoney(value: Money | number | null | undefined, sign: MoneySign = 'abs'): string {
  const { negative, integer, fraction } = parts(value);
  const body = `$${integer}.${fraction}`;
  return sign === 'signed' && negative ? `−${body}` : body;
}

/** Whole riel, grouped: `615000` → `"៛615,000"`. There is no subunit in circulation. */
export function formatKhr(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  return `៛${groupThousands(String(rounded))}`;
}

/** For geometry and comparisons only, never for display. */
export function amountNumber(value: Money | null | undefined): number {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isNegative(value: Money | null | undefined): boolean {
  return (value ?? '').trim().startsWith('-') && amountNumber(value) !== 0;
}

/**
 * Rewrite what is typed in an amount field when the currency toggle moves,
 * so the prefix and the number always mean the same amount of money.
 * Riel is returned whole; dollars keep their cents with trailing zeros
 * trimmed, so "12" rather than "12.00". Returns `null` when there is nothing
 * to convert, so the caller leaves the field exactly as the person left it.
 */
export function convertAmount(text: string, from: Currency, to: Currency, khrPerUsd: number): string | null {
  if (from === to) return null;
  const value = Number.parseFloat(text.trim());
  if (!Number.isFinite(value) || value <= 0 || khrPerUsd <= 0) return null;
  if (to === 'KHR') return String(Math.round(value * khrPerUsd));
  return (value / khrPerUsd).toFixed(2).replace(/\.?0+$/, '');
}

/** Keeps an amount field to digits and one decimal point. */
export function sanitizeAmount(text: string, currency: Currency): string {
  let cleaned = text.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  if (currency === 'KHR') cleaned = cleaned.split('.')[0];
  const [integer, fraction] = cleaned.split('.');
  return fraction !== undefined ? `${integer}.${fraction.slice(0, 2)}` : integer;
}
