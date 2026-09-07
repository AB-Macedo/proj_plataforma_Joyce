import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { name?: string; rating?: number; message?: string; contactAllowed?: boolean; website?: string; startedAt?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Não foi possível enviar agora.' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.startedAt || Date.now() - body.startedAt < 1200 || Date.now() - body.startedAt > 7_200_000) return NextResponse.json({ error: 'Atualize a página e tente novamente.' }, { status: 400 });
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 90) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1600) : '';
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 8) return NextResponse.json({ error: 'Escolha uma avaliação e escreva pelo menos uma frase.' }, { status: 400 });
  await env.DB.prepare("INSERT INTO feedback (name, rating, message, contact_allowed, status, created_at) VALUES (?, ?, ?, ?, 'new', ?)").bind(name || null, rating, message, body.contactAllowed ? 1 : 0, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
