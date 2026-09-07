import BookingFlow from './components/BookingFlow';

const services = [
  { eyebrow: 'mensagem, áudio ou ligação', name: 'Tempo reservado', duration: '20 minutos', price: 'a partir de R$ 70', description: 'Vinte minutos exclusivos para você fazer as perguntas que desejar e receber as respostas por mensagem, áudio ou ligação.' },
  { eyebrow: 'mensagem, áudio ou ligação', name: 'Tempo estendido', duration: '30 minutos', price: 'a partir de R$ 105', description: 'Trinta minutos reservados para conversar com calma e fazer as perguntas que desejar dentro do período.', featured: true },
  { eyebrow: 'leitura temática', name: 'Templo de Vênus', duration: '', price: 'a partir de R$ 50', description: 'Uma abertura completa sobre pensamentos, sentimentos, intenções e a tendência do relacionamento.', note: 'Leitura fechada: não inclui perguntas extras.' },
  { eyebrow: 'sob aprovação', name: 'Consulta Livre', duration: '20 min a 3 horas', price: 'valor calculado', description: 'Você escolhe o tempo que precisa. O encaixe é analisado antes da confirmação e requer 50% de entrada.', note: 'WhatsApp: R$ 3,50/min · Ligação: R$ 4,50/min' },
];

const specialReadings = [
  { name: 'Leitura amorosa completa', price: 'Valor a consultar', description: 'Pensamentos, sentimentos, intenções e próximos passos da pessoa do seu interesse.' },
  { name: 'Campo específico', price: 'Valor a consultar', description: 'Energia geral, obstáculo e conselho para um aspecto que você deseja compreender melhor.' },
  { name: 'Pergunta objetiva', price: 'Valor a consultar', description: 'Uma pergunta direta e um conselho do baralho sobre o que você pode fazer diante da situação.' },
  { name: 'Campo geral', price: 'Valor a consultar', description: 'Uma abertura para os campos profissional, financeiro, saúde, espiritual e amoroso.' },
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
        <div className="section-heading"><div><p className="kicker"><span /> Escolha sua leitura</p><h2>Um tempo reservado para você</h2></div><p>Escolha o formato que combina com o que você busca hoje.</p></div>
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
          <div><p className="kicker"><span /> Outras leituras</p><h3>Leituras especiais do catálogo</h3><p>Essas opções têm formato próprio. Solicite os detalhes, valor e disponibilidade diretamente pelo WhatsApp.</p></div>
          <div className="special-grid">{specialReadings.map((reading) => <a key={reading.name} href={`https://wa.me/5527988043118?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre a ${reading.name}.`)}`} target="_blank" rel="noreferrer"><strong>{reading.name}</strong><em>{reading.price}</em><span>{reading.description}</span><b>Conversar no WhatsApp →</b></a>)}</div>
        </div>
      </section>

      <section className="booking section" id="agenda">
        <div className="booking-copy"><p className="kicker light"><span /> Agenda da semana</p><h2>Reserve um tempo só seu</h2><p>Você escolhe uma etapa por vez. Os horários exibidos são atualizados conforme a disponibilidade.</p>
          <ol id="como-funciona"><li><span>1</span><div><strong>Escolha o tempo</strong><small>20 min, 30 min, Templo de Vênus ou livre.</small></div></li><li><span>2</span><div><strong>Escolha o formato</strong><small>Mensagem, áudio ou ligação.</small></div></li><li><span>3</span><div><strong>Reserve o horário</strong><small>Depois, confirme seus dados e as fotos das cartas.</small></div></li></ol>
        </div>
        <BookingFlow />
      </section>

      <footer><a className="brand footer-brand" href="#inicio"><span className="brand-mark">J</span><span>JoyMagia</span></a><div className="footer-contact"><p>Um espaço de escuta, simbolismo e novas perspectivas.</p><span><a href="https://www.instagram.com/joycegoularti.magia/" target="_blank" rel="noreferrer">Instagram @joycegoularti.magia</a> · <a href="https://wa.me/5527988043118" target="_blank" rel="noreferrer">WhatsApp</a> · <a href="tel:+5527988043118">Ligar</a></span></div><a href="#inicio">Voltar ao início ↑</a></footer>
    </main>
  );
}
