import { amountNumber, convertAmount, formatKhr, formatMoney, isNegative, sanitizeAmount } from '../money';

describe('formatMoney', () => {
  it('groups thousands and keeps two places without a float', () => {
    expect(formatMoney('1234.5')).toBe('$1,234.50');
    expect(formatMoney('12.50')).toBe('$12.50');
    expect(formatMoney('1000000.00')).toBe('$1,000,000.00');
    expect(formatMoney('0')).toBe('$0.00');
    expect(formatMoney(null)).toBe('$0.00');
  });

  it('drops the sign by default and keeps a real minus when asked', () => {
    expect(formatMoney('-6.00')).toBe('$6.00');
    expect(formatMoney('-6.00', 'signed')).toBe('−$6.00');
    expect(formatMoney('6.00', 'signed')).toBe('$6.00');
  });
});

describe('formatKhr', () => {
  it('shows whole riel, grouped', () => {
    expect(formatKhr(615000)).toBe('៛615,000');
    expect(formatKhr(4099.6)).toBe('៛4,100');
  });
});

describe('amountNumber / isNegative', () => {
  it('parses for geometry and reports the sign', () => {
    expect(amountNumber('12.50')).toBe(12.5);
    expect(amountNumber('nope')).toBe(0);
    expect(isNegative('-1.00')).toBe(true);
    expect(isNegative('-0.00')).toBe(false);
    expect(isNegative('3.00')).toBe(false);
  });
});

describe('convertAmount', () => {
  it('converts the typed figure instead of discarding it', () => {
    expect(convertAmount('5', 'USD', 'KHR', 4100)).toBe('20500');
    expect(convertAmount('20500', 'KHR', 'USD', 4100)).toBe('5');
    expect(convertAmount('20000', 'KHR', 'USD', 4100)).toBe('4.88');
  });

  it('leaves the field alone when there is nothing to convert', () => {
    expect(convertAmount('', 'USD', 'KHR', 4100)).toBeNull();
    expect(convertAmount('abc', 'USD', 'KHR', 4100)).toBeNull();
    expect(convertAmount('5', 'USD', 'USD', 4100)).toBeNull();
    expect(convertAmount('5', 'USD', 'KHR', 0)).toBeNull();
  });
});

describe('sanitizeAmount', () => {
  it('keeps digits, one point and two decimals for dollars', () => {
    expect(sanitizeAmount('12.345', 'USD')).toBe('12.34');
    expect(sanitizeAmount('1.2.3', 'USD')).toBe('1.23');
    expect(sanitizeAmount('$1,000', 'USD')).toBe('1000');
  });

  it('keeps riel whole', () => {
    expect(sanitizeAmount('4100.75', 'KHR')).toBe('4100');
  });
});
