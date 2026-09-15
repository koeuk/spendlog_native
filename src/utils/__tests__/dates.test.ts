import { dayLabel, isValidYm, longDate, monthBounds, monthLabel, parseYmd, shiftMonth } from '../dates';

describe('months', () => {
  it('shifts across year boundaries in the API format', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-08', 0)).toBe('2026-08');
  });

  it('labels a month in either language', () => {
    expect(monthLabel('2026-08')).toBe('August 2026');
    expect(monthLabel('2026-08', 'km')).toContain('2026');
    expect(monthLabel('garbage')).toBe('garbage');
  });

  it('bounds a month inclusively', () => {
    expect(monthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('validates YYYY-MM', () => {
    expect(isValidYm('2026-07')).toBe(true);
    expect(isValidYm('2026-13')).toBe(false);
    expect(isValidYm('2026-07-01')).toBe(false);
  });
});

describe('days', () => {
  it('parses local dates and labels them', () => {
    expect(parseYmd('2026-08-17')?.getDate()).toBe(17);
    expect(parseYmd('nope')).toBeNull();
    expect(dayLabel('2026-08-17')).toBe('17 Aug');
    expect(longDate('2026-08-17')).toBe('Mon, 17 Aug 2026');
    expect(dayLabel('bad')).toBe('bad');
  });
});
