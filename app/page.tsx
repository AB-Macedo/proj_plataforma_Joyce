import BookingFlow from './components/BookingFlow';
import FeedbackForm from './components/FeedbackForm';

const services = [
  { eyebrow: 'consulta livre', name: 'Consulta livre · 20 min', duration: '20 minutos', price: 'a partir de R$ 70', description: 'Vinte minutos para você fazer as perguntas que desejar e receber as respostas por mensagem, áudio ou ligação.' },
  { eyebrow: 'consulta livre', name: 'Consulta livre · 30 min', duration: '30 minutos', price: 'a partir de R$ 105', description: 'Trinta minutos para conversar com calma e fazer as perguntas que desejar dentro do período.', featured: true },
  { eyebrow: 'leitura temática', name: 'Templo de Vênus', duration: '', price: 'a partir de R$ 50', description: 'Uma abertura completa sobre pensamentos, sentimentos, intenções e a tendência do relacionamento.', note: 'Leitura fechada: não inclui perguntas extras.' },
  { eyebrow: 'sob aprovação', name: 'Escolha seu tempo', duration: '20 min a 3 horas', price: 'valor calculado', description: 'Você escolhe o tempo que precisa. O encaixe é analisado antes da confirmação.' },
];

const specialReadings = [
  { name: 'Leitura amorosa completa', price: 'R$ 10,00 · piloto', description: 'Pensamentos, sentimentos, intenções e próximos passos da pessoa do seu interesse.' },
  { name: 'Campo específico', price: 'R$ 10,00 · piloto', description: 'Energia geral, obstáculo e conselho para um aspecto que você deseja compreender melhor.' },
  { name: 'Pergunta objetiva', price: 'R$ 10,00 · piloto', description: 'Uma pergunta direta e um conselho do baralho sobre o que você pode fazer diante da situação.' },
  { name: 'Campo geral', price: 'R$ 10,00 · piloto', description: 'Uma abertura para os campos profissional, financeiro, saúde, espiritual e amoroso.' },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Magia Selenne, início"><span className="brand-mark" aria-hidden="true">M</span><span>Magia Selenne</span></a>
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
        <div className="section-heading"><div><p className="kicker"><span /> Escolha sua leitura</p><h2>Um tempo reservado para você</h2></div><p>Escolha o formato que combina com o que você busca hoje.</p></div>
        <p className="general-pricing">Mensagens e áudios: <strong>R$ 3,50/min</strong> · Ligação: <strong>R$ 4,50/min</strong></p>
        <div className="service-grid">
          {services.map((service) => (
            <article className={`service-card ${service.featured ? 'featured' : ''}`} key={service.name}>
              {service.featured && <span className="popular">Mais escolhida</span>}
              <p className="service-eyebrow">{service.eyebrow}</p><h3>{service.name}</h3><p className="service-description">{service.description}</p>{service.note && <p className="service-note">{service.note}</p>}
              <div className={`service-meta ${service.duration ? '' : 'price-only'}`}>{service.duration && <span>{service.duration}</span>}<strong>{service.price}</strong></div>
              <a href="#agenda">Escolher consulta <span aria-hidden="true">→</span></a>
              <a className="service-whatsapp" href={`https://wa.me/5527988043118?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${service.name}.`)}`} target="_blank" rel="noreferrer">Tirar dúvida no WhatsApp</a>
            </article>
          ))}
        </div>
        <div className="special-readings">
          <div><p className="kicker"><span /> Outras leituras</p><h3>Leituras especiais do catálogo</h3><p>Para este piloto, todas podem ser agendadas no site pelo valor teste informado.</p></div>
          <div className="special-grid">{specialReadings.map((reading) => <article key={reading.name}><strong>{reading.name}</strong><em>{reading.price}</em><span>{reading.description}</span><div><a href="#agenda">Agendar pelo site →</a><a href={`https://wa.me/5527988043118?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${reading.name}.`)}`} target="_blank" rel="noreferrer">Tirar dúvida no WhatsApp</a></div></article>)}</div>
        </div>
      </section>

      <section className="booking section" id="agenda">
        <div className="booking-copy"><p className="kicker light"><span /> Agenda da semana</p><h2>Reserve um tempo só seu</h2><p>Você escolhe uma etapa por vez. Os horários exibidos são atualizados conforme a disponibilidade.</p>
          <ol id="como-funciona"><li><span>1</span><div><strong>Escolha seu atendimento e tempo</strong><small>Consulta livre, Templo de Vênus ou leitura especial.</small></div></li><li><span>2</span><div><strong>Escolha o formato</strong><small>Mensagem, áudio ou ligação.</small></div></li><li><span>3</span><div><strong>Reserve o horário</strong><small>Depois, confirme seus dados e as fotos das cartas.</small></div></li></ol>
        </div>
        <BookingFlow />
      </section>

      <section className="feedback-section section" id="feedback"><div><p className="kicker"><span /> Feedback privado</p><h2>Sua opinião ajuda a cuidar melhor de cada atendimento.</h2><p>Se você já passou por uma leitura, conte como foi. A mensagem vai apenas para Magia Selenne e não será publicada.</p></div><FeedbackForm /></section>
      <footer><a className="brand footer-brand" href="#inicio"><span className="brand-mark">M</span><span>Magia Selenne</span></a><div className="footer-contact"><p>Um espaço de escuta, simbolismo e novas perspectivas.</p><span className="social-links"><a href="https://www.instagram.com/joycegoularti.magia/" target="_blank" rel="noreferrer"><i aria-hidden="true">◎</i> Instagram</a><a href="https://wa.me/5527988043118" target="_blank" rel="noreferrer"><i className="whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M19.1 4.9A9.8 9.8 0 0 0 3.5 16.7L2.3 21.2l4.6-1.2A9.8 9.8 0 1 0 19.1 4.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.4 7.5c.2-.4.5-.4.8-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.5.9 1.2 1.7 2.1 2.2.2.1.3.1.5 0l.8-.8c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5v.5c0 .4-.2.7-.5.9-.5.3-1.2.4-2 .1-1.2-.4-2.7-1.4-3.8-2.7-1-1.1-1.8-2.5-2-3.6-.2-.8 0-1.4.3-1.9Z" fill="currentColor"/></svg></i> WhatsApp</a><a href="tel:+5527988043118"><i aria-hidden="true">☎</i> Ligar</a></span><a className="privacy-link" href="#feedback">Enviar feedback</a><a className="privacy-link" href="/privacidade">Privacidade e uso de dados</a></div><a href="#inicio">Voltar ao início ↑</a></footer>
    </main>
  );
}
