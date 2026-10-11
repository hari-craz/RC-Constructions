/**
 * Slug helpers for project overlay routing and URL hashing.
 * Converts project IDs like 'project-residential-enclave' to 'residential-enclave' and back.
 */

export function slugFromProjectId(id: string): string {
  if (!id) return '';
  return id.replace(/^project-/, '');
}

export function projectIdFromSlug(slug: string): string {
  if (!slug) return '';
  return slug.startsWith('project-') ? slug : `project-${slug}`;
}

export function parseProjectHash(hash: string): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^#/, '');
  if (!clean.startsWith('project-')) return null;
  const slug = clean.replace(/^project-/, '');
  return slug.length > 0 ? slug : null;
}
