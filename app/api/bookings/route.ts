import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { getService, quotePriceCents, type BookingFormat } from '../../../lib/catalog';
import { endTimestamp, localToday, validateSlot } from '../../../lib/schedule';

export const dynamic = 'force-dynamic';

type BookingBody = {
  service?: string;
  format?: string;
  duration?: number;
  startsAt?: string;
  name?: string;
  whatsapp?: string;
  email?: string;
  birthDate?: string;
  wantsCardImages?: boolean;
  templeRulesAccepted?: boolean;
  acceptedTerms?: boolean;
  website?: string;
  formStartedAt?: number;
};

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

function bookingCode(): string {
  return `JOY-${Date.now().toString(36).slice(-5).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  let body: BookingBody;
  try {
    body = await request.json() as BookingBody;
  } catch {
    return NextResponse.json({ error: 'Não foi possível ler os dados enviados.' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true });
  if (!body.formStartedAt || Date.now() - body.formStartedAt < 1500 || Date.now() - body.formStartedAt > 7_200_000) {
    return NextResponse.json({ error: 'Atualize a página e tente novamente.' }, { status: 400 });
  }

  const service = getService(body.service ?? '');
  const format = body.format as BookingFormat;
  const duration = service?.durationMinutes ?? Number(body.duration);
  const startsAt = clean(body.startsAt, 19);
  const name = clean(body.name, 90);
  const whatsapp = clean(body.whatsapp, 30).replace(/[^0-9+]/g, '');
  const email = clean(body.email, 160).toLowerCase();
  const birthDate = clean(body.birthDate, 10);

  if (!service || !['whatsapp', 'call'].includes(format)) return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400 });
  if (!Number.isInteger(duration) || duration < service.minDuration || duration > service.maxDuration || duration % 10 !== 0) return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(startsAt) || startsAt.slice(0, 10) < localToday()) return NextResponse.json({ error: 'Escolha um horário válido.' }, { status: 400 });
  if (name.length < 2 || whatsapp.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'Informe seu nome e um WhatsApp válido.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(new Date(`${birthDate}T12:00:00`).getTime())) return NextResponse.json({ error: 'Informe uma data de nascimento válida.' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido ou deixe o campo vazio.' }, { status: 400 });
  if (!body.acceptedTerms) return NextResponse.json({ error: 'Confirme que leu as regras do agendamento.' }, { status: 400 });
  if (service.templeRules && !body.templeRulesAccepted) return NextResponse.json({ error: 'Confirme a regra do Templo de Vênus.' }, { status: 400 });
  if (duration > 90) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (startsAt.slice(0, 10) < tomorrow.toISOString().slice(0, 10)) return NextResponse.json({ error: 'Consultas acima de 90 minutos precisam ser solicitadas com pelo menos 24 horas de antecedência.' }, { status: 400 });
  }

  const slotIsValid = await validateSlot(startsAt, duration, service.requiresApproval);
  if (!slotIsValid) return NextResponse.json({ error: 'Este horário acabou de ficar indisponível. Escolha outro.' }, { status: 409 });

  const now = new Date().toISOString();
  const end = endTimestamp(startsAt, duration);
  const code = bookingCode();
  const priceCents = quotePriceCents(service, format, duration);

  try {
    let customer = await env.DB.prepare('SELECT id FROM customers WHERE whatsapp = ? ORDER BY id DESC LIMIT 1').bind(whatsapp).first<{ id: number }>();
    if (!customer) {
      customer = await env.DB.prepare('INSERT INTO customers (name, whatsapp, email, birth_date, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id').bind(name, whatsapp, email || null, birthDate, now, now).first<{ id: number }>();
    } else {
      await env.DB.prepare('UPDATE customers SET name = ?, email = COALESCE(?, email), birth_date = ?, consent_at = ? WHERE id = ?').bind(name, email || null, birthDate, now, customer.id).run();
    }
    if (!customer) throw new Error('customer_not_created');

    const serviceRow = await env.DB.prepare('SELECT id FROM services WHERE slug = ? AND active = true LIMIT 1').bind(service.slug).first<{ id: number }>();
    if (!serviceRow) throw new Error('service_not_found');

    if (service.requiresApproval) {
      await env.DB.prepare("INSERT INTO booking_requests (booking_code, customer_id, service_id, preferred_starts_at, preferred_ends_at, format, duration_minutes, quoted_price_cents, deposit_cents, wants_card_images, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?)")
        .bind(code, customer.id, serviceRow.id, startsAt, end, format, duration, priceCents, Math.ceil(priceCents / 2), Boolean(body.wantsCardImages), now, now).run();
    } else {
      const appointment = await env.DB.prepare("INSERT INTO appointments (service_id, customer_id, starts_at, ends_at, booking_code, format, duration_minutes, quoted_price_cents, wants_card_images, temple_rules_accepted, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) RETURNING id")
        .bind(serviceRow.id, customer.id, startsAt, end, code, format, duration, priceCents, Boolean(body.wantsCardImages), Boolean(body.templeRulesAccepted), now, now).first<{ id: number }>();
      if (!appointment) throw new Error('appointment_not_created');
      await env.DB.prepare("INSERT INTO payments (appointment_id, amount_cents, method, status, created_at) VALUES (?, ?, 'pix', 'pending', ?)").bind(appointment.id, priceCents, now).run();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('overlap') || message.includes('UNIQUE')) return NextResponse.json({ error: 'Este horário acabou de ser reservado. Escolha outro.' }, { status: 409 });
    return NextResponse.json({ error: 'Não foi possível registrar agora. Tente novamente em alguns instantes.' }, { status: 500 });
  }

  const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceCents / 100);
  const text = `Olá! Fiz a reserva ${code} pelo site para ${service.name} (${duration} minutos). Valor: ${formattedPrice}. Quero realizar o pagamento por Pix e enviar o comprovante neste chat.`;

  return NextResponse.json({
    ok: true,
    code,
    kind: service.requiresApproval ? 'request' : 'booking',
    priceCents,
    depositCents: service.requiresApproval ? Math.ceil(priceCents / 2) : null,
    whatsappUrl: `https://wa.me/5527988043118?text=${encodeURIComponent(text)}`,
  });
}
