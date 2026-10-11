import { describe, expect, it } from 'vitest';
import { hasSeenIntro, markIntroSeen, resetIntroSeen } from './sessionStorage';

describe('sessionStorage helpers', () => {
  it('reads and writes intro seen flag in normal storage', () => {
    const memoryStore = new Map<string, string>();
    const mockStorage: Storage = {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
      },
      clear: () => {
        memoryStore.clear();
      },
      key: () => null,
      length: 0,
    };

    expect(hasSeenIntro(mockStorage)).toBe(false);
    markIntroSeen(mockStorage);
    expect(hasSeenIntro(mockStorage)).toBe(true);
    resetIntroSeen(mockStorage);
    expect(hasSeenIntro(mockStorage)).toBe(false);
  });

  it('handles throwing storage gracefully without uncaught errors', () => {
    const throwingStorage: Storage = {
      getItem: () => {
        throw new Error('Access denied (SecurityError)');
      },
      setItem: () => {
        throw new Error('Access denied (SecurityError)');
      },
      removeItem: () => {
        throw new Error('Access denied (SecurityError)');
      },
      clear: () => {},
      key: () => null,
      length: 0,
    };

    expect(() => hasSeenIntro(throwingStorage)).not.toThrow();
    expect(hasSeenIntro(throwingStorage)).toBe(false);
    expect(() => markIntroSeen(throwingStorage)).not.toThrow();
    expect(() => resetIntroSeen(throwingStorage)).not.toThrow();
  });

  it('handles null storage gracefully', () => {
    expect(hasSeenIntro(null)).toBe(false);
    expect(() => markIntroSeen(null)).not.toThrow();
    expect(() => resetIntroSeen(null)).not.toThrow();
  });
});
