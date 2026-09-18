'use client';

import { useEffect } from 'react';
import { SITE_VERSION } from '../../lib/site-version';

export default function VersionRefresh() {
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('/api/version', { cache: 'no-store' });
        const body = await response.json() as { version?: string };
        if (body.version && body.version !== SITE_VERSION) {
          const url = new URL(window.location.href);
          url.searchParams.set('site_version', body.version);
          window.location.replace(url.toString());
        }
      } catch { /* A próxima verificação tenta novamente. */ }
    };
    void check();
    const timer = window.setInterval(() => void check(), 30000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);
  return null;
}
