import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '../../../dashboard-auth';
import { addDays, localToday } from '../../../../lib/schedule';

export const dynamic = 'force-dynamic';

const allowedAppointmentStatuses = new Set(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']);
const allowedPaymentStatuses = new Set(['pending', 'paid', 'refunded', 'cancelled']);
type RuntimeEnv = typeof env & { CALENDAR_BRIDGE_URL?: string; CALENDAR_BRIDGE_SECRET?: string };

function text(value: unknown, length: number) {
  return typeof value === 'string' ? value.trim().slice(0, length) : '';
}

function time(value: unknown) {
  const item = text(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(item) ? item : '';
}

function serviceData(body: Record<string, unknown>) {
  const name = text(body.name, 80);
  const description = text(body.description, 450);
  const duration = Number(body.durationMinutes);
  const price = Math.round(Number(body.price) * 100);
  const whatsappRate = Math.round(Number(body.whatsappRate) * 100);
  const callRate = Math.round(Number(body.callRate) * 100);
  if (name.length < 2 || !Number.isInteger(duration) || duration < 5 || duration > 180 || !Number.isInteger(price) || price < 0 || !Number.isInteger(whatsappRate) || whatsappRate < 0 || !Number.isInteger(callRate) || callRate < 0) return null;
  return { name, description, duration, price, whatsappRate, callRate, active: body.active ? 1 : 0 };
}

function serviceSlug(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55) || 'novo-atendimento';
}

function productData(body: Record<string, unknown>) {
  const name = text(body.name, 90);
  const category = text(body.category, 50);
  const description = text(body.description, 600);
  const price = Math.round(Number(body.price) * 100);
  const imageUrl = text(body.imageUrl, 500);
  if (name.length < 2 || category.length < 2 || !Number.isInteger(price) || price < 0 || (imageUrl && !imageUrl.startsWith('https://'))) return null;
  return { name, category, description, price, imageUrl: imageUrl || null, active: body.active ? 1 : 0 };
}

function calendarBridge() {
  const runtime = env as RuntimeEnv;
  const url = runtime.CALENDAR_BRIDGE_URL?.trim();
  const secret = runtime.CALENDAR_BRIDGE_SECRET?.trim();
  return url && secret && url.startsWith('https://script.google.com/macros/') ? { url, secret } : null;
}

type CalendarAppointment = {
  id: number;
  starts_at: string;
  ends_at: string;
  booking_code: string;
  google_event_id: string | null;
  format: string;
  wants_card_images: number;
  oracle_deck: string;
  name: string;
  whatsapp: string;
  service: string;
};

async function syncCalendar(appointment: CalendarAppointment, status: string, payment: string): Promise<{ message?: string; error?: string }> {
  const bridge = calendarBridge();
  if (!bridge) return { message: 'Google Agenda ainda não está conectado.' };

  const shouldHaveEvent = (status === 'confirmed' || status === 'completed') && payment === 'paid';
  const action = status === 'cancelled' || status === 'no_show' ? (appointment.google_event_id ? 'delete' : null) : shouldHaveEvent ? (appointment.google_event_id ? 'update' : 'create') : null;
  if (!action) return { message: shouldHaveEvent ? 'A reserva já está sincronizada.' : 'O evento será criado quando a reserva estiver confirmada e paga.' };

  try {
    const response = await fetch(bridge.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret: bridge.secret,
        action,
        eventId: appointment.google_event_id,
        title: `Magia Theia — ${appointment.service}`,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        description: `Reserva ${appointment.booking_code}\nCliente: ${appointment.name}\nWhatsApp: ${appointment.whatsapp}\nFormato: ${appointment.format === 'call' ? 'Ligação' : 'Mensagens e áudios'}\nBaralho: ${appointment.oracle_deck === 'cigano' ? 'Baralho Cigano' : appointment.oracle_deck === 'ambos' ? 'Tarô e Baralho Cigano' : 'Tarô'}\nFotos das cartas: ${appointment.wants_card_images ? 'Solicitadas' : 'Não solicitadas'}`,
      }),
    });
    const result = await response.json().catch(() => null) as { ok?: boolean; eventId?: string; error?: string } | null;
    if (!response.ok || !result?.ok) return { error: result?.error ?? 'Não foi possível sincronizar com o Google Agenda.' };
    if (action === 'delete') {
      await env.DB.prepare('UPDATE appointments SET google_event_id=NULL, updated_at=? WHERE id=?').bind(new Date().toISOString(), appointment.id).run();
      return { message: 'Evento removido do Google Agenda.' };
    }
    if (!result.eventId) return { error: 'O Google Agenda não retornou o identificador do evento.' };
    await env.DB.prepare('UPDATE appointments SET google_event_id=?, updated_at=? WHERE id=?').bind(result.eventId, new Date().toISOString(), appointment.id).run();
    return { message: action === 'create' ? 'Evento criado no Google Agenda.' : 'Evento atualizado no Google Agenda.' };
  } catch {
    return { error: 'A reserva foi salva, mas o Google Agenda não respondeu. Tente salvar o status novamente.' };
  }
}

export async function GET() {
  await requireDashboardAdmin('/painel');
  const now = new Date().toISOString();
  const today = localToday();
  const since30 = addDays(today, -29);
  const [services, products, availability, exceptions, customers, appointments, templates, feedback, analytics] = await Promise.all([
    env.DB.prepare('SELECT id, slug, name, description, price_cents, whatsapp_rate_cents, call_rate_cents, duration_minutes, internal_note, active, sort_order FROM services WHERE archived = false ORDER BY price_cents ASC, name COLLATE NOCASE ASC').all(),
    env.DB.prepare('SELECT id, name, category, description, price_cents, image_url, active, sort_order FROM products WHERE archived = false ORDER BY sort_order, name COLLATE NOCASE').all(),
    env.DB.prepare('SELECT id, weekday, start_time, end_time, active FROM weekly_availability ORDER BY weekday, start_time').all(),
    env.DB.prepare('SELECT id, date, start_time, end_time, kind, reason FROM availability_exceptions WHERE date >= ? ORDER BY date, start_time').bind(now.slice(0, 10)).all(),
    env.DB.prepare("SELECT c.id, c.name, c.whatsapp, c.email, c.birth_date, c.created_at, COUNT(a.id) AS bookings FROM customers c LEFT JOIN appointments a ON a.customer_id = c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50").all(),
    env.DB.prepare("SELECT a.id, a.starts_at, a.ends_at, a.booking_code, a.google_event_id, a.duration_minutes, a.quoted_price_cents, a.status, a.format, a.oracle_deck, a.wants_card_images, c.name, c.whatsapp, s.name AS service, (SELECT p.status FROM payments p WHERE p.appointment_id = a.id ORDER BY p.id DESC LIMIT 1) AS payment_status FROM appointments a JOIN customers c ON c.id=a.customer_id JOIN services s ON s.id=a.service_id ORDER BY a.starts_at DESC LIMIT 80").all(),
    env.DB.prepare('SELECT id, key, channel, title, body, active FROM message_templates ORDER BY id').all(),
    env.DB.prepare('SELECT id, name, rating, message, contact_allowed, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 100').all(),
    env.DB.prepare("SELECT (SELECT COUNT(*) FROM analytics_events WHERE event_type='page_view' AND created_at>=?) AS page_views_today, (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type='page_view' AND created_at>=?) AS visitors_30d, (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type='booking_interest' AND created_at>=?) AS interests_30d, (SELECT COUNT(*) FROM appointments WHERE created_at>=?) + (SELECT COUNT(*) FROM booking_requests WHERE created_at>=?) AS bookings_30d, (SELECT COUNT(*) FROM settings WHERE key='launch_cleanup_completed' AND value='true') AS cleanup_completed").bind(`${today}T00:00:00`, `${since30}T00:00:00`, `${since30}T00:00:00`, `${since30}T00:00:00`, `${since30}T00:00:00`).first(),
  ]);
  return NextResponse.json({ services: services.results, products: products.results, availability: availability.results, exceptions: exceptions.results, customers: customers.results, appointments: appointments.results, templates: templates.results, feedback: feedback.results, analytics, calendarConnected: Boolean(calendarBridge()) });
}

export async function PATCH(request: NextRequest) {
  await requireDashboardAdmin('/painel');
  const body = await request.json() as Record<string, unknown>;
  const action = text(body.action, 40);
  const now = new Date().toISOString();

  if (action === 'launch-cleanup') {
    const completed = await env.DB.prepare("SELECT value FROM settings WHERE key='launch_cleanup_completed'").first<{ value: string }>();
    if (completed?.value === 'true') return NextResponse.json({ error: 'A limpeza de lançamento já foi concluída.' }, { status: 409 });
    await env.DB.batch([
      env.DB.prepare('DELETE FROM payments'),
      env.DB.prepare('DELETE FROM appointments'),
      env.DB.prepare('DELETE FROM booking_requests'),
      env.DB.prepare('DELETE FROM feedback'),
      env.DB.prepare('DELETE FROM customers'),
      env.DB.prepare('DELETE FROM analytics_events'),
      env.DB.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('launch_cleanup_completed', 'true', ?) ON CONFLICT(key) DO UPDATE SET value='true', updated_at=excluded.updated_at").bind(now),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'service') {
    const id = Number(body.id);
    const service = serviceData(body);
    if (!Number.isInteger(id) || !service) return NextResponse.json({ error: 'Revise os dados do serviço.' }, { status: 400 });
    await env.DB.prepare('UPDATE services SET name=?, description=?, price_cents=?, whatsapp_rate_cents=?, call_rate_cents=?, duration_minutes=?, active=?, updated_at=? WHERE id=? AND archived=false').bind(service.name, service.description, service.price, service.whatsappRate, service.callRate, service.duration, service.active, now, id).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'service-delete') {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400 });
    await env.DB.prepare('UPDATE services SET active=false, archived=true, updated_at=? WHERE id=?').bind(now, id).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'service-create') {
    const service = serviceData(body);
    if (!service) return NextResponse.json({ error: 'Revise os dados do novo serviço.' }, { status: 400 });
    const baseSlug = serviceSlug(service.name);
    const duplicate = await env.DB.prepare('SELECT id FROM services WHERE slug=? LIMIT 1').bind(baseSlug).first<{ id: number }>();
    const slug = duplicate ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;
    const order = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM services').first<{ next_order: number }>();
    await env.DB.prepare('INSERT INTO services (slug, name, description, price_cents, whatsapp_rate_cents, call_rate_cents, duration_minutes, active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(slug, service.name, service.description, service.price, service.whatsappRate, service.callRate, service.duration, service.active, order?.next_order ?? 1, now, now).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'product' || action === 'product-create') {
    const product = productData(body);
    if (!product) return NextResponse.json({ error: 'Revise os dados do produto e use um link de foto HTTPS.' }, { status: 400 });
    if (action === 'product') {
      const id = Number(body.id);
      if (!Number.isInteger(id)) return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
      await env.DB.prepare('UPDATE products SET name=?, category=?, description=?, price_cents=?, image_url=?, active=?, made_to_order=true, updated_at=? WHERE id=? AND archived=false').bind(product.name, product.category, product.description, product.price, product.imageUrl, product.active, now, id).run();
    } else {
      const order = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM products').first<{ next_order: number }>();
      await env.DB.prepare('INSERT INTO products (name, category, description, price_cents, image_url, made_to_order, active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, true, ?, ?, ?, ?)').bind(product.name, product.category, product.description, product.price, product.imageUrl, product.active, order?.next_order ?? 1, now, now).run();
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'product-delete') {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
    await env.DB.prepare('UPDATE products SET active=false, archived=true, updated_at=? WHERE id=?').bind(now, id).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'availability') {
    const items = Array.isArray(body.items) ? body.items : [];
    const clean = items.map((item) => item as Record<string, unknown>).map((item) => ({ weekday: Number(item.weekday), start: time(item.start), end: time(item.end), active: Boolean(item.active) })).filter((item) => Number.isInteger(item.weekday) && item.weekday >= 1 && item.weekday <= 6 && item.start && item.end && item.start < item.end);
    if (clean.length !== items.length) return NextResponse.json({ error: 'Revise os horários da semana.' }, { status: 400 });
    await env.DB.batch([
      env.DB.prepare('DELETE FROM weekly_availability'),
      ...clean.map((item) => env.DB.prepare('INSERT INTO weekly_availability (weekday, start_time, end_time, active) VALUES (?, ?, ?, ?)').bind(item.weekday, item.start, item.end, item.active ? 1 : 0)),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'exception-create') {
    const date = text(body.date, 10);
    const kind = body.kind === 'open' ? 'open' : 'blocked';
    const start = time(body.start);
    const end = time(body.end);
    const reason = text(body.reason, 120);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (start && !end) || (!start && end) || (start && start >= end)) return NextResponse.json({ error: 'Revise a data e o período.' }, { status: 400 });
    await env.DB.prepare('INSERT INTO availability_exceptions (date, start_time, end_time, kind, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(date, start || null, end || null, kind, reason || null, now).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'exception-delete') {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Exceção inválida.' }, { status: 400 });
    await env.DB.prepare('DELETE FROM availability_exceptions WHERE id=?').bind(id).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'appointment') {
    const id = Number(body.id);
    const status = text(body.status, 20);
    const payment = text(body.paymentStatus, 20);
    if (!Number.isInteger(id) || !allowedAppointmentStatuses.has(status) || !allowedPaymentStatuses.has(payment)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    await env.DB.batch([
      env.DB.prepare('UPDATE appointments SET status=?, updated_at=? WHERE id=?').bind(status, now, id),
      env.DB.prepare("UPDATE payments SET status=?, paid_at=CASE WHEN ?='paid' THEN ? ELSE paid_at END WHERE appointment_id=?").bind(payment, payment, now, id),
    ]);
    const appointment = await env.DB.prepare("SELECT a.id, a.starts_at, a.ends_at, a.booking_code, a.google_event_id, a.format, a.oracle_deck, a.wants_card_images, c.name, c.whatsapp, s.name AS service FROM appointments a JOIN customers c ON c.id=a.customer_id JOIN services s ON s.id=a.service_id WHERE a.id=?").bind(id).first<CalendarAppointment>();
    if (!appointment) return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    const calendar = await syncCalendar(appointment, status, payment);
    return NextResponse.json({ ok: true, calendarMessage: calendar.message, calendarError: calendar.error });
  }

  if (action === 'calendar-sync') {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Reserva inválida.' }, { status: 400 });
    const appointment = await env.DB.prepare("SELECT a.id, a.starts_at, a.ends_at, a.booking_code, a.google_event_id, a.format, a.oracle_deck, a.wants_card_images, a.status, c.name, c.whatsapp, s.name AS service, (SELECT p.status FROM payments p WHERE p.appointment_id=a.id ORDER BY p.id DESC LIMIT 1) AS payment_status FROM appointments a JOIN customers c ON c.id=a.customer_id JOIN services s ON s.id=a.service_id WHERE a.id=?").bind(id).first<CalendarAppointment & { status: string; payment_status: string | null }>();
    if (!appointment) return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    const calendar = await syncCalendar(appointment, appointment.status, appointment.payment_status ?? 'pending');
    return NextResponse.json({ ok: true, calendarMessage: calendar.message, calendarError: calendar.error });
  }

  if (action === 'template') {
    const id = Number(body.id);
    const title = text(body.title, 100);
    const messageBody = text(body.body, 2000);
    if (!Number.isInteger(id) || title.length < 2 || messageBody.length < 2) return NextResponse.json({ error: 'Escreva um título e uma mensagem.' }, { status: 400 });
    await env.DB.prepare('UPDATE message_templates SET title=?, body=?, active=?, updated_at=? WHERE id=?').bind(title, messageBody, body.active ? 1 : 0, now, id).run();
    return NextResponse.json({ ok: true });
  }

  if (action === 'feedback') {
    const id = Number(body.id);
    const status = text(body.status, 20);
    if (!Number.isInteger(id) || !['new', 'reviewed', 'archived'].includes(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    await env.DB.prepare('UPDATE feedback SET status=? WHERE id=?').bind(status, id).run();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
}
