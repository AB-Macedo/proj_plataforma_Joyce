import { NextResponse } from 'next/server';
import { SITE_VERSION } from '../../../lib/site-version';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ version: SITE_VERSION }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
