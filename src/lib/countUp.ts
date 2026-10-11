/**
 * Count-up helper for animated statistics.
 *
 * Requirements:
 * - Formatted with Intl.NumberFormat.
 * - Leaves non-numeric placeholders like "XX" completely static (passthrough).
 * - Final values must be in the DOM from the start (screen readers & no-JS).
 * - Animation skipped under reduced motion.
 */

export interface ParsedStatValue {
  isNumeric: boolean;
  targetNumber: number;
  prefix: string;
  suffix: string;
  raw: string;
}

export function parseStatValue(raw: string): ParsedStatValue {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) {
    return {
      isNumeric: false,
      targetNumber: 0,
      prefix: '',
      suffix: '',
      raw: trimmed,
    };
  }
  return {
    isNumeric: true,
    targetNumber: parseInt(match[2] ?? '0', 10),
    prefix: match[1] ?? '',
    suffix: match[3] ?? '',
    raw: trimmed,
  };
}

export function formatStatNumber(val: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(val);
}

export function getFormattedStatValue(
  parsed: ParsedStatValue,
  currentNumber: number,
  locale = 'en-US',
): string {
  if (!parsed.isNumeric) {
    return parsed.raw;
  }
  return `${parsed.prefix}${formatStatNumber(currentNumber, locale)}${parsed.suffix}`;
}
