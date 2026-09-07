export type ServiceSlug = 'consulta-essencial' | 'consulta-profunda' | 'templo-de-venus' | 'consulta-livre' | 'leitura-amorosa-completa' | 'campo-especifico' | 'pergunta-objetiva' | 'campo-geral';
export type BookingFormat = 'whatsapp' | 'call';

export type BookingService = {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  durationMinutes: number | null;
  minDuration: number;
  maxDuration: number;
  requiresApproval: boolean;
  templeRules: boolean;
  pilotPrice?: boolean;
};

export const BOOKING_SERVICES: BookingService[] = [
  { slug: 'consulta-essencial', name: 'Consulta livre — 20 minutos', shortName: '20 minutos (consulta livre)', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false },
  { slug: 'consulta-profunda', name: 'Consulta livre — 30 minutos', shortName: '30 minutos (consulta livre)', durationMinutes: 30, minDuration: 30, maxDuration: 30, requiresApproval: false, templeRules: false },
  { slug: 'templo-de-venus', name: 'Templo de Vênus', shortName: 'Templo de Vênus', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: true },
  { slug: 'consulta-livre', name: 'Escolha seu tempo', shortName: 'Escolha seu tempo', durationMinutes: null, minDuration: 20, maxDuration: 180, requiresApproval: true, templeRules: false },
  { slug: 'leitura-amorosa-completa', name: 'Leitura amorosa completa', shortName: 'Leitura amorosa completa', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false, pilotPrice: true },
  { slug: 'campo-especifico', name: 'Campo específico', shortName: 'Campo específico', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false, pilotPrice: true },
  { slug: 'pergunta-objetiva', name: 'Pergunta objetiva', shortName: 'Pergunta objetiva', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false, pilotPrice: true },
  { slug: 'campo-geral', name: 'Campo geral', shortName: 'Campo geral', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false, pilotPrice: true },
];

export const FORMAT_LABELS: Record<BookingFormat, string> = {
  whatsapp: 'Mensagens e áudios no WhatsApp',
  call: 'Ligação',
};

export function getService(slug: string): BookingService | undefined {
  return BOOKING_SERVICES.find((service) => service.slug === slug);
}

export function quotePriceCents(service: BookingService, format: BookingFormat, durationMinutes: number): number {
  if (service.pilotPrice) return format === 'call' ? 1500 : 1000;
  if (service.slug === 'templo-de-venus' && format === 'whatsapp') return 5000;
  return durationMinutes * (format === 'call' ? 450 : 350);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
