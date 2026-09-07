import { env } from 'cloudflare:workers';
import { chatGPTSignOutPath } from '../chatgpt-auth';
import { requireDashboardAdmin } from '../dashboard-auth';
import DashboardControls from './DashboardControls';
import { addDays, localToday, weekday } from '../../lib/schedule';

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

export default async function DashboardPage() {
  const user = await requireDashboardAdmin('/painel');
  const data = await dashboardData();
  const firstName = user.fullName?.split(' ')[0] ?? 'Joyce';
  const week = [
    { day: 'Seg', hours: '13h — 19h', load: 6, tone: 'wine' }, { day: 'Ter', hours: '13h — 19h', load: 6, tone: 'gold' }, { day: 'Qua', hours: 'Bloqueado', load: 0, tone: 'off' }, { day: 'Qui', hours: '13h — 19h', load: 6, tone: 'navy' }, { day: 'Sex', hours: '12h — 15h', load: 3, tone: 'wine' }, { day: 'Sáb', hours: '13h — 19h', load: 6, tone: 'gold' },
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dash-sidebar">
        <a className="brand dash-brand" href="/"><span className="brand-mark">J</span><span>Joyce Magia</span></a>
        <nav className="dash-nav" aria-label="Navegação do painel">
          <a className="active" href="/painel"><span>⌂</span>Visão geral</a><a href="#agenda-painel"><span>□</span>Agenda</a><a href="#servicos-painel"><span>✦</span>Serviços</a><a href="#clientes"><span>♙</span>Clientes</a><a href="#financeiro"><span>◌</span>Financeiro</a><a href="#mensagens"><span>✉</span>Mensagens</a>
        </nav>
        <div className="dash-sidebar-bottom"><a href="/">Ver site público ↗</a><a href={chatGPTSignOutPath('/')}>Sair</a></div>
      </aside>

      <section className="dash-main">
        <header className="dash-top"><div><p>VISÃO GERAL</p><h1>Boa tarde, {firstName}.</h1></div><div className="dash-user"><span>JM</span><div><strong>Administradora</strong><small>{user.email}</small></div></div></header>

        <div className="notice"><span>✦</span><div><strong>Painel conectado</strong><p>Os números abaixo vêm das reservas registradas pelo site. O limite de proteção pode ser alterado aqui.</p></div></div>

        <div className="metric-grid" id="financeiro">
          <article><p>Receita prevista</p><strong>{money(data.totalRevenue)}</strong><small>reservas desta semana</small></article>
          <article><p>Horas reservadas</p><strong>{hours(data.totalMinutes)}</strong><small>de {hours(data.availableMinutes)} disponíveis</small></article>
          <article><p>Taxa de ocupação</p><strong>{data.availableMinutes ? `${Math.round(data.totalMinutes / data.availableMinutes * 100)}%` : '0%'}</strong><small>{data.appointments.length} reservas no período</small></article>
          <article><p>Receita por hora</p><strong>{data.totalMinutes ? money(data.totalRevenue / (data.totalMinutes / 60)) : '—'}</strong><small>média das reservas</small></article>
        </div>

        <div className="dash-grid">
          <article className="dash-panel schedule-panel" id="agenda-painel">
            <div className="panel-head"><div><p>DISPONIBILIDADE</p><h2>Semana de 7 a 12 de setembro</h2></div><button type="button">Editar semana</button></div>
            <div className="week-grid">{week.map((item) => <div className={`week-day ${item.tone}`} key={item.day}><strong>{item.day}</strong><span>{item.hours}</span><div><i style={{ width: `${item.load / 6 * 100}%` }} /></div><small>{item.load ? `${item.load}h abertas` : 'Sem atendimento'}</small></div>)}</div>
            <div className="schedule-actions"><button type="button">＋ Abrir horário</button><button type="button">⊘ Bloquear período</button><button type="button">⧉ Copiar semana anterior</button></div>
          </article>

          <article className="dash-panel today-panel">
            <div className="panel-head"><div><p>PRÓXIMOS</p><h2>{data.appointments.length} atendimentos</h2></div><span className="date-chip">{data.today.slice(8)}</span></div>
            <div className="appointment-list">{data.appointments.slice(0, 5).map((item) => <div className="appointment" key={item.starts_at}><time>{item.starts_at.slice(11, 16)}</time><div><strong>{item.name}</strong><small>{item.service}</small></div><span className={item.payment_status === 'paid' ? 'paid' : 'pending'}>{item.payment_status === 'paid' ? 'Pago' : 'Pendente'}</span></div>)}{!data.appointments.length && <p className="empty-panel">Nenhuma reserva registrada ainda.</p>}</div>
            <a href="#agenda-painel">Ver agenda completa →</a>
          </article>

          <DashboardControls initialEnabled={data.enabled} initialMinutes={data.limit} />

          <article className="dash-panel services-panel" id="servicos-painel">
            <div className="panel-head"><div><p>SERVIÇOS</p><h2>Consultas ativas</h2></div><button type="button">Editar serviços</button></div>
            <div className="mini-services"><div><span>20 min</span><strong>Consulta Essencial</strong><b>R$ 70</b></div><div><span>30 min</span><strong>Consulta Profunda</strong><b>R$ 105</b></div><div><span>20 min</span><strong>Templo de Vênus</strong><b>R$ 50</b></div></div>
          </article>
        </div>
      </section>
    </main>
  );
}
