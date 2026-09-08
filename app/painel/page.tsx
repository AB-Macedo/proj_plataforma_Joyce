import { env } from 'cloudflare:workers';
import { chatGPTSignOutPath } from '../chatgpt-auth';
import { requireDashboardAdmin } from '../dashboard-auth';
import DashboardControls from './DashboardControls';
import DashboardWorkspace, { type DashboardSection } from './DashboardWorkspace';
import { addDays, localToday } from '../../lib/schedule';

export const dynamic = 'force-dynamic';

type Appointment = { starts_at: string; duration_minutes: number; quoted_price_cents: number; status: string; name: string; service: string; payment_status: string | null };

async function dashboardData() {
  const today = localToday();
  const weekEnd = addDays(today, 7);
  try {
    const [appointmentsResult, settingsResult, availabilityResult] = await Promise.all([
      env.DB.prepare("SELECT a.starts_at, a.duration_minutes, a.quoted_price_cents, a.status, c.name, s.name AS service, (SELECT p.status FROM payments p WHERE p.appointment_id = a.id ORDER BY p.id DESC LIMIT 1) AS payment_status FROM appointments a JOIN customers c ON c.id = a.customer_id JOIN services s ON s.id = a.service_id WHERE a.starts_at >= ? AND a.starts_at < ? ORDER BY a.starts_at").bind(`${today}T00:00:00`, `${weekEnd}T00:00:00`).all<Appointment>(),
      env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('daily_limit_enabled', 'daily_limit_minutes')").all<{ key: string; value: string }>(),
      env.DB.prepare('SELECT weekday, start_time, end_time FROM weekly_availability WHERE active = true').all<{ weekday: number; start_time: string; end_time: string }>(),
    ]);
    const values = new Map(settingsResult.results.map((item) => [item.key, item.value]));
    const reserved = appointmentsResult.results.filter((item) => item.status === 'pending' || item.status === 'confirmed');
    const totalMinutes = reserved.reduce((sum, item) => sum + item.duration_minutes, 0);
    const totalRevenue = reserved.reduce((sum, item) => sum + item.quoted_price_cents, 0);
    const availableMinutes = availabilityResult.results.reduce((sum, item) => { const [sh, sm] = item.start_time.split(':').map(Number); const [eh, em] = item.end_time.split(':').map(Number); return sum + (eh * 60 + em) - (sh * 60 + sm); }, 0);
    return { today, appointments: appointmentsResult.results, totalMinutes, totalRevenue, availableMinutes, enabled: values.get('daily_limit_enabled') !== 'false', limit: Number(values.get('daily_limit_minutes') ?? 180) };
  } catch { return { today, appointments: [], totalMinutes: 0, totalRevenue: 0, availableMinutes: 0, enabled: true, limit: 180 }; }
}

function money(cents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100); }
function hours(minutes: number) { return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}`; }

const sections: Array<{ key: DashboardSection; label: string; icon: string }> = [
  { key: 'visao-geral', label: 'Visão geral', icon: '⌂' }, { key: 'agenda', label: 'Agenda', icon: '□' }, { key: 'servicos', label: 'Serviços', icon: '✦' }, { key: 'clientes', label: 'Clientes', icon: '♙' }, { key: 'financeiro', label: 'Financeiro', icon: '◌' }, { key: 'mensagens', label: 'Mensagens', icon: '✉' }, { key: 'feedbacks', label: 'Feedbacks', icon: '♡' },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const user = await requireDashboardAdmin('/painel');
  const data = await dashboardData();
  const params = await searchParams;
  const section = sections.some((item) => item.key === params.aba) ? params.aba as DashboardSection : 'visao-geral';
  const current = sections.find((item) => item.key === section)!;
  const firstName = user.fullName?.split(' ')[0] ?? 'Joyce';
  return (
    <main className="dashboard-shell">
      <aside className="dash-sidebar">
        <a className="brand dash-brand" href="/"><span className="brand-mark">J</span><span>Joyce Magia</span></a>
        <nav className="dash-nav" aria-label="Navegação do painel">{sections.map((item) => <a className={item.key === section ? 'active' : ''} href={item.key === 'visao-geral' ? '/painel' : `/painel?aba=${item.key}`} key={item.key}><span>{item.icon}</span>{item.label}</a>)}</nav>
        <div className="dash-sidebar-bottom"><a href="/">Ver site público ↗</a><a href={chatGPTSignOutPath('/')}>Sair</a></div>
      </aside>

      <section className="dash-main">
        <header className="dash-top"><div><p>{current.label.toUpperCase()}</p><h1>{section === 'visao-geral' ? `Boa tarde, ${firstName}.` : current.label}</h1></div><div className="dash-user"><span>JM</span><div><strong>Administradora</strong><small>{user.email}</small></div></div></header>

        {section === 'visao-geral' && <><div className="notice"><span>✦</span><div><strong>Painel conectado</strong><p>Aqui está um resumo da semana. Use o menu ao lado para administrar agenda, serviços e reservas.</p></div></div>

        <div className="metric-grid" id="financeiro">
          <article><p>Receita prevista</p><strong>{money(data.totalRevenue)}</strong><small>reservas desta semana</small></article>
          <article><p>Horas reservadas</p><strong>{hours(data.totalMinutes)}</strong><small>de {hours(data.availableMinutes)} disponíveis</small></article>
          <article><p>Taxa de ocupação</p><strong>{data.availableMinutes ? `${Math.round(data.totalMinutes / data.availableMinutes * 100)}%` : '0%'}</strong><small>{data.appointments.length} reservas no período</small></article>
          <article><p>Receita por hora</p><strong>{data.totalMinutes ? money(data.totalRevenue / (data.totalMinutes / 60)) : '—'}</strong><small>média das reservas</small></article>
        </div></>}

        <div className="dash-grid">
          <DashboardWorkspace section={section} />
          {section === 'visao-geral' && <DashboardControls initialEnabled={data.enabled} initialMinutes={data.limit} />}
        </div>
      </section>
    </main>
  );
}
