import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacidade e uso de dados | Joyce Magia' };

export default function PrivacyPage() {
  return <main className="privacy-page">
    <header className="privacy-header"><a className="brand" href="/"><span className="brand-mark">J</span><span>Joyce Magia</span></a><a href="/" className="text-link">← Voltar ao início</a></header>
    <article className="privacy-content">
      <p className="kicker"><span /> Privacidade e uso de dados</p>
      <h1>Seu atendimento, com cuidado também com seus dados.</h1>
      <p className="privacy-lead">Esta página explica, de forma simples, como usamos os dados informados no agendamento, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).</p>
      <section><h2>Quais dados são solicitados</h2><p>No agendamento, podemos solicitar nome, WhatsApp, e-mail, data de nascimento, preferência sobre fotos das cartas e informações da reserva. Pedimos somente o necessário para identificar a cliente, organizar o horário e realizar o atendimento.</p></section>
      <section><h2>Para que usamos</h2><p>Os dados são usados exclusivamente para confirmar ou ajustar o agendamento, entrar em contato sobre o atendimento, registrar pagamentos e prestar o serviço escolhido. Não vendemos dados nem os usamos para publicidade de terceiros.</p></section>
      <section><h2>Fotos das cartas</h2><p>As fotos só são enviadas quando essa preferência for marcada no agendamento. Caso não seja marcada, o envio não é automático.</p></section>
      <section><h2>Guarda e eliminação</h2><p>Os dados ficam guardados apenas pelo tempo necessário para o atendimento e para eventuais obrigações legais. Ao fim desse período, serão eliminados ou anonimizados, dentro dos limites aplicáveis da LGPD.</p></section>
      <section><h2>Seus direitos</h2><p>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação dos seus dados; também pode revogar o consentimento, quando aplicável. Para isso, fale conosco pelo WhatsApp.</p><a className="button button-primary" href="https://wa.me/5527988043118?text=Ol%C3%A1!%20Quero%20falar%20sobre%20meus%20dados%20pessoais." target="_blank" rel="noreferrer">Falar sobre meus dados</a></section>
      <p className="privacy-update">Última atualização: setembro de 2026.</p>
    </article>
  </main>;
}
