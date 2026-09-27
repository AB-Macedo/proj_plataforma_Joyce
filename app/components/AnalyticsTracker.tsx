'use client';

import { useEffect } from 'react';

type PublicEvent = 'page_view' | 'booking_interest' | 'schedule_view';

function sessionId() {
  const key = 'magia-theia-visit';
  let value = window.sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem(key, value);
  }
  return value;
}

export function trackPublicEvent(eventType: PublicEvent, onceKey?: string) {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/painel')) return;
  if (onceKey) {
    const key = `magia-theia-event-${onceKey}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  }
  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, sessionId: sessionId(), path: window.location.pathname }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function AnalyticsTracker() {
  useEffect(() => { trackPublicEvent('page_view'); }, []);
  return null;
}
