import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '../../../dashboard-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireDashboardAdmin('/painel');
  const result = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('daily_limit_enabled', 'daily_limit_minutes')").all<{ key: string; value: string }>();
  const values = new Map(result.results.map((item) => [item.key, item.value]));
  return NextResponse.json({ enabled: values.get('daily_limit_enabled') !== 'false', minutes: Number(values.get('daily_limit_minutes') ?? 180) });
}

export async function PUT(request: NextRequest) {
  await requireDashboardAdmin('/painel');
  const body = await request.json() as { enabled?: boolean; minutes?: number };
  const enabled = body.enabled !== false;
  const minutes = Number(body.minutes);
  if (!Number.isInteger(minutes) || minutes < 60 || minutes > 720 || minutes % 30 !== 0) return NextResponse.json({ error: 'Escolha um limite entre 1 e 12 horas, em intervalos de 30 minutos.' }, { status: 400 });
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').bind('daily_limit_enabled', String(enabled), now),
    env.DB.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').bind('daily_limit_minutes', String(minutes), now),
  ]);
  return NextResponse.json({ enabled, minutes });
}
