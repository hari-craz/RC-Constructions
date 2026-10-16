/**
 * Absolute or guarantee-style wording that must not appear in visible copy.
 * Editorial risk reduction only; it is not legal advice (see docs/CLAIMS-REVIEW.md).
 */
const BANNED_CLAIMS: readonly { readonly word: string; readonly pattern: RegExp }[] = [
  { word: 'zero', pattern: /\bzero\b/i },
  { word: 'never', pattern: /\bnever\b/i },
  { word: 'always', pattern: /\balways\b/i },
  { word: 'every', pattern: /\bevery\b/i },
  { word: 'guarantee', pattern: /\bguarantee[sd]?\b/i },
  { word: '100%', pattern: /100\s?%/ },
  { word: 'fully', pattern: /\bfully\b/i },
  { word: 'ensure', pattern: /\bensur(?:e|es|ed|ing)\b/i },
  { word: 'no defects', pattern: /\bno (?:structural )?defects?\b/i },
  { word: 'certified', pattern: /\bcertified\b/i },
  { word: 'accredited', pattern: /\baccredit(?:ed|ation)\b/i },
  { word: 'licensed', pattern: /\blicen[cs](?:ed|e)\b/i },
  { word: 'registered', pattern: /\bregistered\b/i },
  { word: 'award', pattern: /\bawards?\b|\bawarded\b/i },
];

/** Justified exceptions: a snippet that may contain a banned word, with the reason. */
const CLAIM_ALLOWLIST: readonly { readonly snippet: string; readonly reason: string }[] = [];

export function findBannedClaims(text: string): string[] {
  let cleaned = text;
  for (const { snippet } of CLAIM_ALLOWLIST) cleaned = cleaned.split(snippet).join(' ');
  return BANNED_CLAIMS.filter(({ pattern }) => pattern.test(cleaned)).map(({ word }) => word);
}
