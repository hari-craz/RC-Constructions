import { describe, expect, it } from 'vitest';
import { parseProjectHash, projectIdFromSlug, slugFromProjectId } from './slug';

describe('slug helpers', () => {
  it('converts project id to slug', () => {
    expect(slugFromProjectId('project-residential-enclave')).toBe('residential-enclave');
    expect(slugFromProjectId('project-commercial-tower')).toBe('commercial-tower');
    expect(slugFromProjectId('')).toBe('');
  });

  it('converts slug to project id', () => {
    expect(projectIdFromSlug('residential-enclave')).toBe('project-residential-enclave');
    expect(projectIdFromSlug('project-commercial-tower')).toBe('project-commercial-tower');
    expect(projectIdFromSlug('')).toBe('');
  });

  it('parses project hash accurately', () => {
    expect(parseProjectHash('#project-residential-enclave')).toBe('residential-enclave');
    expect(parseProjectHash('project-commercial-tower')).toBe('commercial-tower');
    expect(parseProjectHash('#contact')).toBeNull();
    expect(parseProjectHash('#project-')).toBeNull();
    expect(parseProjectHash('')).toBeNull();
  });
});
