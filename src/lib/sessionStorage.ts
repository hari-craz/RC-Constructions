/**
 * Session storage wrapper with defensive try/catch handling for private
 * browsing modes, third-party iframe restrictions, and disabled storage.
 */

const INTRO_STORAGE_KEY = 'rc_intro_seen';

export function hasSeenIntro(storage: Storage | null = getSessionStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(storage: Storage | null = getSessionStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(INTRO_STORAGE_KEY, '1');
  } catch {
    // Safely swallow exceptions when storage is blocked
  }
}

export function resetIntroSeen(storage: Storage | null = getSessionStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(INTRO_STORAGE_KEY);
  } catch {
    // Safely swallow exceptions
  }
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Accessing window.sessionStorage may throw SecurityError
  }
  return null;
}
