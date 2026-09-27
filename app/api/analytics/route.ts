import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const allowedEvents = new Set(['page_view', 'booking_interest', 'schedule_view']);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { eventType?: unknown; sessionId?: unknown; path?: unknown } | null;
  const eventType = typeof body?.eventType === 'string' ? body.eventType : '';
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const path = typeof body?.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 120) : '/';
  if (!allowedEvents.has(eventType) || !/^[a-f0-9-]{20,50}$/i.test(sessionId) || path.startsWith('/painel') || path.startsWith('/api')) return NextResponse.json({ ok: false }, { status: 400 });
  await env.DB.prepare('INSERT INTO analytics_events (event_type, session_id, path, created_at) VALUES (?, ?, ?, ?)').bind(eventType, sessionId, path, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
