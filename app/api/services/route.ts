import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { decorateService } from '../../../lib/public-services';

export const dynamic = 'force-dynamic';

export async function GET() {
  const services = await env.DB.prepare('SELECT id, slug, name, description, price_cents, whatsapp_rate_cents, call_rate_cents, duration_minutes FROM services WHERE active = true ORDER BY sort_order, id').all();
  return NextResponse.json({ services: services.results.map((service) => decorateService(service as Parameters<typeof decorateService>[0])) }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
