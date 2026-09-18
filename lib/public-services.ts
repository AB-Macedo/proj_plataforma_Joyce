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
  if (service.pilotPrice) return format === 'call' ? 1500 : service.price_cents;
  if (service.slug === 'templo-de-venus') return format === 'call' && service.call_rate_cents > 0 ? duration * service.call_rate_cents : service.price_cents;
  if (service.requiresApproval || service.slug === 'consulta-essencial' || service.slug === 'consulta-profunda') {
    const rate = format === 'call' ? service.call_rate_cents : service.whatsapp_rate_cents;
    return rate > 0 ? duration * rate : service.price_cents;
  }
  return service.price_cents;
}

export const FORMAT_LABELS: Record<BookingFormat, string> = { whatsapp: 'Mensagens e áudios no WhatsApp', call: 'Ligação' };

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
