import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { decorateService, quoteService, type BookingFormat } from '../../../lib/public-services';
import { buildSchedule } from '../../../lib/schedule';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('service') ?? '';
  const row = await env.DB.prepare('SELECT id, slug, name, description, price_cents, whatsapp_rate_cents, call_rate_cents, duration_minutes FROM services WHERE slug = ? AND active = true LIMIT 1').bind(slug).first();
  const service = row ? decorateService(row as Parameters<typeof decorateService>[0]) : null;
  const format = request.nextUrl.searchParams.get('format') as BookingFormat;
  const requestedDuration = Number(request.nextUrl.searchParams.get('duration'));

  if (!service || !['whatsapp', 'call'].includes(format)) {
    return NextResponse.json({ error: 'Serviço ou formato inválido.' }, { status: 400 });
  }

  const duration = service.requiresApproval ? requestedDuration : service.duration_minutes;
  if (!Number.isInteger(duration) || duration < (service.requiresApproval ? 20 : 5) || duration > (service.requiresApproval ? 180 : service.duration_minutes) || (service.requiresApproval && duration % 10 !== 0)) {
    return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 });
  }

  const schedule = await buildSchedule(duration);
  return NextResponse.json({
    ...schedule,
    duration,
    priceCents: quoteService(service, format, duration),
    depositCents: null,
  });
}
