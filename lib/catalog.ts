export type ServiceSlug = 'consulta-essencial' | 'consulta-profunda' | 'templo-de-venus' | 'consulta-livre';
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
};

export const BOOKING_SERVICES: BookingService[] = [
  { slug: 'consulta-essencial', name: 'Tempo reservado — 20 minutos', shortName: '20 minutos', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: false },
  { slug: 'consulta-profunda', name: 'Tempo estendido — 30 minutos', shortName: '30 minutos', durationMinutes: 30, minDuration: 30, maxDuration: 30, requiresApproval: false, templeRules: false },
  { slug: 'templo-de-venus', name: 'Templo de Vênus', shortName: 'Templo de Vênus', durationMinutes: 20, minDuration: 20, maxDuration: 20, requiresApproval: false, templeRules: true },
  { slug: 'consulta-livre', name: 'Consulta Livre', shortName: 'Consulta Livre', durationMinutes: null, minDuration: 20, maxDuration: 180, requiresApproval: true, templeRules: false },
];

export const FORMAT_LABELS: Record<BookingFormat, string> = {
  whatsapp: 'Mensagens e áudios no WhatsApp',
  call: 'Ligação',
};

export function getService(slug: string): BookingService | undefined {
  return BOOKING_SERVICES.find((service) => service.slug === slug);
}

export function quotePriceCents(service: BookingService, format: BookingFormat, durationMinutes: number): number {
  if (service.slug === 'templo-de-venus' && format === 'whatsapp') return 5000;
  return durationMinutes * (format === 'call' ? 450 : 350);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
