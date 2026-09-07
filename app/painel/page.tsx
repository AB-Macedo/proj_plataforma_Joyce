import { chatGPTSignOutPath, requireChatGPTUser } from '../chatgpt-auth';

export const dynamic = 'force-dynamic';

const week = [
  { day: 'Seg', hours: '13h — 19h', load: 6, tone: 'wine' },
  { day: 'Ter', hours: '13h — 19h', load: 6, tone: 'gold' },
  { day: 'Qua', hours: 'Bloqueado', load: 0, tone: 'off' },
  { day: 'Qui', hours: '13h — 19h', load: 6, tone: 'navy' },
  { day: 'Sex', hours: '12h — 15h', load: 3, tone: 'wine' },
  { day: 'Sáb', hours: '13h — 19h', load: 6, tone: 'gold' },
];

const appointments = [
  { time: '13:00', name: 'Marina Alves', service: 'Consulta Essencial', status: 'Pago' },
  { time: '14:30', name: 'Carla Souza', service: 'Consulta Profunda', status: 'Pendente' },
  { time: '16:00', name: 'Bianca Lima', service: 'Templo de Vênus', status: 'Pago' },
];

export default async function DashboardPage() {
  const user = await requireChatGPTUser('/painel');
  const firstName = user.fullName?.split(' ')[0] ?? 'Joyce';

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

        <div className="notice"><span>✦</span><div><strong>Piloto em desenvolvimento</strong><p>Os dados abaixo demonstram como o painel funcionará. A gravação das alterações será ativada na próxima etapa.</p></div></div>

        <div className="metric-grid" id="financeiro">
          <article><p>Receita na semana</p><strong>R$ 1.040</strong><small><b>+12%</b> comparado à anterior</small></article>
          <article><p>Horas reservadas</p><strong>18h 20min</strong><small>de 27 horas disponíveis</small></article>
          <article><p>Taxa de ocupação</p><strong>67,9%</strong><small>9 horários ainda livres</small></article>
          <article><p>Receita por hora</p><strong>R$ 170</strong><small>média dos atendimentos</small></article>
        </div>

        <div className="dash-grid">
          <article className="dash-panel schedule-panel" id="agenda-painel">
            <div className="panel-head"><div><p>DISPONIBILIDADE</p><h2>Semana de 7 a 12 de setembro</h2></div><button type="button">Editar semana</button></div>
            <div className="week-grid">{week.map((item) => <div className={`week-day ${item.tone}`} key={item.day}><strong>{item.day}</strong><span>{item.hours}</span><div><i style={{ width: `${item.load / 6 * 100}%` }} /></div><small>{item.load ? `${item.load}h abertas` : 'Sem atendimento'}</small></div>)}</div>
            <div className="schedule-actions"><button type="button">＋ Abrir horário</button><button type="button">⊘ Bloquear período</button><button type="button">⧉ Copiar semana anterior</button></div>
          </article>

          <article className="dash-panel today-panel">
            <div className="panel-head"><div><p>HOJE</p><h2>3 atendimentos</h2></div><span className="date-chip">SEG · 07</span></div>
            <div className="appointment-list">{appointments.map((item) => <div className="appointment" key={item.time}><time>{item.time}</time><div><strong>{item.name}</strong><small>{item.service}</small></div><span className={item.status === 'Pago' ? 'paid' : 'pending'}>{item.status}</span></div>)}</div>
            <a href="#agenda-painel">Ver agenda completa →</a>
          </article>

          <article className="dash-panel services-panel" id="servicos-painel">
            <div className="panel-head"><div><p>SERVIÇOS</p><h2>Consultas ativas</h2></div><button type="button">Editar serviços</button></div>
            <div className="mini-services"><div><span>20 min</span><strong>Consulta Essencial</strong><b>R$ 70</b></div><div><span>30 min</span><strong>Consulta Profunda</strong><b>R$ 105</b></div><div><span>20 min</span><strong>Templo de Vênus</strong><b>R$ 50</b></div></div>
          </article>
        </div>
      </section>
    </main>
  );
}
