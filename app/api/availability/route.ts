import { NextRequest, NextResponse } from 'next/server';
import { getService, quotePriceCents, type BookingFormat } from '../../../lib/catalog';
import { buildSchedule } from '../../../lib/schedule';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const service = getService(request.nextUrl.searchParams.get('service') ?? '');
  const format = request.nextUrl.searchParams.get('format') as BookingFormat;
  const requestedDuration = Number(request.nextUrl.searchParams.get('duration'));

  if (!service || !['whatsapp', 'call'].includes(format)) {
    return NextResponse.json({ error: 'Serviço ou formato inválido.' }, { status: 400 });
  }

  const duration = service.durationMinutes ?? requestedDuration;
  if (!Number.isInteger(duration) || duration < service.minDuration || duration > service.maxDuration || duration % 10 !== 0) {
    return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 });
  }

  const schedule = await buildSchedule(duration);
  return NextResponse.json({
    ...schedule,
    duration,
    priceCents: quotePriceCents(service, format, duration),
    depositCents: service.requiresApproval ? Math.ceil(quotePriceCents(service, format, duration) / 2) : null,
  });
}
