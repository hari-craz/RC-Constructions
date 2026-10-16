import { useEffect } from 'react';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Loads Vercel Web Analytics after the page has finished loading and the browser is idle.
 * It is skipped on local hosts, where the `/_vercel/insights` endpoint does not exist.
 */
export function Analytics() {
  useEffect(() => {
    if (LOCAL_HOSTS.has(window.location.hostname)) return;
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      void import('@vercel/analytics').then((m) => {
        if (!cancelled) m.inject();
      });
    };
    const whenIdle = () =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(load, { timeout: 4000 })
        : window.setTimeout(load, 2000);
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', whenIdle);
    };
  }, []);
  return null;
}
