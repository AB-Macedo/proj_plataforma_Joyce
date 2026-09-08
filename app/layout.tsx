import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({ variable: '--font-display', subsets: ['latin'], weight: ['500', '600', '700'] });
const sans = Manrope({ variable: '--font-sans', subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://joymagia-piloto.anabiamacedo10.chatgpt.site'),
  title: 'Magia Selenne | Consultas e agendamentos',
  description: 'Escolha sua consulta e encontre um horário para uma leitura conduzida com cuidado, presença e clareza.',
  openGraph: {
    title: 'Magia Selenne | Cartas, escuta e direção',
    description: 'Consultas online com horário reservado, cuidado e clareza.',
    images: [{ url: '/og.png', width: 1732, height: 909, alt: 'Magia Selenne — Cartas, escuta e direção' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Magia Selenne | Cartas, escuta e direção',
    description: 'Consultas online com horário reservado, cuidado e clareza.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
