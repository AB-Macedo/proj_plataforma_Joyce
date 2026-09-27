export type BookingFormat = 'whatsapp' | 'call';

export type PublicService = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  whatsapp_rate_cents: number;
  call_rate_cents: number;
  duration_minutes: number;
  requiresApproval: boolean;
  templeRules: boolean;
  pilotPrice: boolean;
};

type ServiceRow = Omit<PublicService, 'requiresApproval' | 'templeRules' | 'pilotPrice'>;

const PILOT_SLUGS = new Set(['leitura-amorosa-completa', 'campo-especifico', 'pergunta-objetiva', 'campo-geral']);

export function decorateService(row: ServiceRow): PublicService {
  return { ...row, requiresApproval: row.slug === 'consulta-livre', templeRules: row.slug === 'templo-de-venus', pilotPrice: PILOT_SLUGS.has(row.slug) };
}

export function quoteService(service: PublicService, format: BookingFormat, duration: number): number {
  const rate = format === 'call' ? service.call_rate_cents : service.whatsapp_rate_cents;
  return rate > 0 ? duration * rate : service.price_cents;
}

export const FORMAT_LABELS: Record<BookingFormat, string> = { whatsapp: 'Mensagens e áudios no WhatsApp', call: 'Ligação' };

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
