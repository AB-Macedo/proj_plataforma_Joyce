import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '../../../dashboard-auth';

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
        title: `Magia Selenne — ${appointment.service}`,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        description: `Reserva ${appointment.booking_code}\nCliente: ${appointment.name}\nWhatsApp: ${appointment.whatsapp}\nFormato: ${appointment.format === 'call' ? 'Ligação' : 'Mensagens e áudios'}\nFotos das cartas: ${appointment.wants_card_images ? 'Solicitadas' : 'Não solicitadas'}`,
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
  const [services, availability, exceptions, customers, appointments, templates, feedback] = await Promise.all([
    env.DB.prepare('SELECT id, slug, name, description, price_cents, whatsapp_rate_cents, call_rate_cents, duration_minutes, internal_note, active, sort_order FROM services ORDER BY sort_order, id').all(),
    env.DB.prepare('SELECT id, weekday, start_time, end_time, active FROM weekly_availability ORDER BY weekday, start_time').all(),
    env.DB.prepare('SELECT id, date, start_time, end_time, kind, reason FROM availability_exceptions WHERE date >= ? ORDER BY date, start_time').bind(now.slice(0, 10)).all(),
    env.DB.prepare("SELECT c.id, c.name, c.whatsapp, c.email, c.birth_date, c.created_at, COUNT(a.id) AS bookings FROM customers c LEFT JOIN appointments a ON a.customer_id = c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50").all(),
    env.DB.prepare("SELECT a.id, a.starts_at, a.ends_at, a.booking_code, a.google_event_id, a.duration_minutes, a.quoted_price_cents, a.status, a.format, a.wants_card_images, c.name, c.whatsapp, s.name AS service, (SELECT p.status FROM payments p WHERE p.appointment_id = a.id ORDER BY p.id DESC LIMIT 1) AS payment_status FROM appointments a JOIN customers c ON c.id=a.customer_id JOIN services s ON s.id=a.service_id ORDER BY a.starts_at DESC LIMIT 80").all(),
    env.DB.prepare('SELECT id, key, channel, title, body, active FROM message_templates ORDER BY id').all(),
    env.DB.prepare('SELECT id, name, rating, message, contact_allowed, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 100').all(),
  ]);
  return NextResponse.json({ services: services.results, availability: availability.results, exceptions: exceptions.results, customers: customers.results, appointments: appointments.results, templates: templates.results, feedback: feedback.results, calendarConnected: Boolean(calendarBridge()) });
}

export async function PATCH(request: NextRequest) {
  await requireDashboardAdmin('/painel');
  const body = await request.json() as Record<string, unknown>;
  const action = text(body.action, 40);
  const now = new Date().toISOString();

  if (action === 'service') {
    const id = Number(body.id);
    const name = text(body.name, 80);
    const description = text(body.description, 450);
    const duration = Number(body.durationMinutes);
    const price = Math.round(Number(body.price) * 100);
    const whatsappRate = Math.round(Number(body.whatsappRate) * 100);
    const callRate = Math.round(Number(body.callRate) * 100);
    if (!Number.isInteger(id) || name.length < 2 || !Number.isInteger(duration) || duration < 5 || duration > 180 || !Number.isInteger(price) || price < 0 || !Number.isInteger(whatsappRate) || whatsappRate < 0 || !Number.isInteger(callRate) || callRate < 0) return NextResponse.json({ error: 'Revise os dados do serviço.' }, { status: 400 });
    await env.DB.prepare('UPDATE services SET name=?, description=?, price_cents=?, whatsapp_rate_cents=?, call_rate_cents=?, duration_minutes=?, active=?, updated_at=? WHERE id=?').bind(name, description, price, whatsappRate, callRate, duration, body.active ? 1 : 0, now, id).run();
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
    const appointment = await env.DB.prepare("SELECT a.id, a.starts_at, a.ends_at, a.booking_code, a.google_event_id, a.format, a.wants_card_images, c.name, c.whatsapp, s.name AS service FROM appointments a JOIN customers c ON c.id=a.customer_id JOIN services s ON s.id=a.service_id WHERE a.id=?").bind(id).first<CalendarAppointment>();
    if (!appointment) return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    const calendar = await syncCalendar(appointment, status, payment);
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
