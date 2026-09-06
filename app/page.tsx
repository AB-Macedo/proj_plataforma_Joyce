const services = [
  { eyebrow: 'mensagem ou áudio', name: 'Consulta Essencial', duration: '20 minutos', price: 'R$ 70', description: 'Uma leitura objetiva para acolher sua questão e iluminar os próximos passos.' },
  { eyebrow: 'atendimento em áudio', name: 'Consulta Profunda', duration: '30 minutos', price: 'R$ 105', description: 'Mais tempo para explorar contextos, caminhos possíveis e diferentes aspectos da questão.', featured: true },
  { eyebrow: 'leitura temática', name: 'Templo de Vênus', duration: '', price: 'R$ 50', description: 'Uma leitura direcionada às energias, movimentos e aprendizados dos relacionamentos.' },
];

const availableDays = [
  { day: 'Seg', date: '07', times: ['13:00', '14:30', '17:00'] },
  { day: 'Ter', date: '08', times: ['13:30', '16:00', '18:00'] },
  { day: 'Qui', date: '10', times: ['14:00', '15:30', '18:30'] },
  { day: 'Sex', date: '11', times: ['12:00', '13:30', '14:30'] },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="JoyMagia, início"><span className="brand-mark" aria-hidden="true">J</span><span>JoyMagia</span></a>
        <nav aria-label="Navegação principal"><a href="#consultas">Consultas</a><a href="#agenda">Agenda</a><a href="#como-funciona">Como funciona</a></nav>
        <a className="header-cta" href="#agenda">Agendar</a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="kicker"><span /> Cartas, escuta e direção</p>
          <h1>Um encontro com a sua <em>intuição.</em></h1>
          <p className="hero-lead">Leituras conduzidas com cuidado para trazer clareza ao presente e abrir novas perspectivas para o seu caminho.</p>
          <div className="hero-actions"><a className="button button-primary" href="#agenda">Ver horários disponíveis</a><a className="text-link" href="#consultas">Conhecer as consultas <span aria-hidden="true">↓</span></a></div>
          <div className="trust-row" aria-label="Informações do atendimento"><span>✦ Atendimento online</span><span>✦ Horário reservado</span><span>✦ Ambiente acolhedor</span></div>
        </div>
        <div className="hero-art" aria-label="Composição decorativa inspirada nas cartas e nas fases da lua">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="moon">☾</div>
          <div className="card card-back"><span>✦</span></div>
          <div className="card card-front"><small>XVII</small><span className="card-star">✦</span><strong>A ESTRELA</strong></div>
          <span className="spark spark-one">✦</span><span className="spark spark-two">✧</span><span className="spark spark-three">•</span>
        </div>
      </section>

      <section className="services section" id="consultas">
        <div className="section-heading"><div><p className="kicker"><span /> Escolha sua leitura</p><h2>Consultas pensadas para o seu momento</h2></div><p>Escolha o formato que combina com a profundidade que você busca hoje.</p></div>
        <div className="service-grid">
          {services.map((service) => (
            <article className={`service-card ${service.featured ? 'featured' : ''}`} key={service.name}>
              {service.featured && <span className="popular">Mais escolhida</span>}
              <p className="service-eyebrow">{service.eyebrow}</p><h3>{service.name}</h3><p className="service-description">{service.description}</p>
              <div className={`service-meta ${service.duration ? '' : 'price-only'}`}>{service.duration && <span>{service.duration}</span>}<strong>{service.price}</strong></div>
              <a href="#agenda">Escolher consulta <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="booking section" id="agenda">
        <div className="booking-copy"><p className="kicker light"><span /> Agenda da semana</p><h2>Reserve um tempo só seu</h2><p>Os horários exibidos são atualizados conforme a disponibilidade. Selecione uma consulta e escolha o melhor momento.</p>
          <ol id="como-funciona"><li><span>1</span><div><strong>Escolha a consulta</strong><small>Formato, duração e valor.</small></div></li><li><span>2</span><div><strong>Reserve seu horário</strong><small>Sem troca de mensagens para encontrar uma data.</small></div></li><li><span>3</span><div><strong>Receba a confirmação</strong><small>Com instruções para o atendimento.</small></div></li></ol>
        </div>
        <div className="calendar-card"><div className="calendar-top"><div><small>SETEMBRO</small><strong>7 — 12</strong></div><span>Horário de Brasília</span></div>
          <div className="days">{availableDays.map((item) => <div className="day" key={item.day}><div className="day-heading"><span>{item.day}</span><strong>{item.date}</strong></div>{item.times.map((time) => <button key={time} type="button">{time}</button>)}</div>)}</div>
          <p className="pilot-note">Piloto visual — a confirmação de reservas será ativada na próxima etapa.</p>
        </div>
      </section>

      <footer><a className="brand footer-brand" href="#inicio"><span className="brand-mark">J</span><span>JoyMagia</span></a><p>Um espaço de escuta, simbolismo e novas perspectivas. · <a href="/painel">Painel</a></p><a href="#inicio">Voltar ao início ↑</a></footer>
    </main>
  );
}
