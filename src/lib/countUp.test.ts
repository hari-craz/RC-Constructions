import { describe, expect, it } from 'vitest';
import { formatStatNumber, getFormattedStatValue, parseStatValue } from './countUp';

describe('countUp helper', () => {
  it('parses placeholder strings like "XX" as non-numeric and preserves raw string', () => {
    const parsed = parseStatValue('XX');
    expect(parsed.isNumeric).toBe(false);
    expect(parsed.raw).toBe('XX');
    expect(getFormattedStatValue(parsed, 0)).toBe('XX');
    expect(getFormattedStatValue(parsed, 100)).toBe('XX');
  });

  it('parses numeric values and supports prefixes and suffixes', () => {
    const parsedNumeric = parseStatValue('148');
    expect(parsedNumeric.isNumeric).toBe(true);
    expect(parsedNumeric.targetNumber).toBe(148);
    expect(parsedNumeric.prefix).toBe('');
    expect(parsedNumeric.suffix).toBe('');

    const parsedPercent = parseStatValue('99%');
    expect(parsedPercent.isNumeric).toBe(true);
    expect(parsedPercent.targetNumber).toBe(99);
    expect(parsedPercent.suffix).toBe('%');

    const parsedCurrency = parseStatValue('$500k');
    expect(parsedCurrency.isNumeric).toBe(true);
    expect(parsedCurrency.prefix).toBe('$');
    expect(parsedCurrency.targetNumber).toBe(500);
    expect(parsedCurrency.suffix).toBe('k');
  });

  it('formats numbers with Intl.NumberFormat', () => {
    expect(formatStatNumber(12500)).toBe('12,500');
    expect(formatStatNumber(0)).toBe('0');
  });

  it('interpolates formatted values when numeric and passes through when placeholder', () => {
    const numeric = parseStatValue('1500');
    expect(getFormattedStatValue(numeric, 750)).toBe('750');
    expect(getFormattedStatValue(numeric, 1500)).toBe('1,500');

    const placeholder = parseStatValue('XX');
    expect(getFormattedStatValue(placeholder, 42)).toBe('XX');
  });
});
