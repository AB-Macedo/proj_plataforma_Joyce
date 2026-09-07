'use client';

import { useEffect, useMemo, useState } from 'react';

type Service = { id: number; slug: string; name: string; description: string; price_cents: number; whatsapp_rate_cents: number; call_rate_cents: number; duration_minutes: number; internal_note: string | null; active: number };
type Availability = { id?: number; weekday: number; start_time: string; end_time: string; active: number | boolean };
type Exception = { id: number; date: string; start_time: string | null; end_time: string | null; kind: 'open' | 'blocked'; reason: string | null };
type Customer = { id: number; name: string; whatsapp: string; email: string | null; birth_date: string | null; created_at: string; bookings: number };
type Appointment = { id: number; starts_at: string; duration_minutes: number; quoted_price_cents: number; status: string; format: string; wants_card_images: number; name: string; whatsapp: string; service: string; payment_status: string | null };
type Template = { id: number; key: string; channel: string; title: string; body: string; active: number };
type Feedback = { id: number; name: string | null; rating: number; message: string; contact_allowed: number; status: 'new' | 'reviewed' | 'archived'; created_at: string };
type Data = { services: Service[]; availability: Availability[]; exceptions: Exception[]; customers: Customer[]; appointments: Appointment[]; templates: Template[]; feedback: Feedback[] };

const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export default function DashboardWorkspace() {
  const [data, setData] = useState<Data | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [week, setWeek] = useState<Availability[]>([]);
  const [status, setStatus] = useState('');
  const [exception, setException] = useState({ date: '', kind: 'blocked', start: '', end: '', reason: '' });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  async function load() {
    const response = await fetch('/api/admin/management');
    if (!response.ok) { setStatus('Não foi possível carregar os dados do painel.'); return; }
    const next = await response.json() as Data;
    setData(next);
    setWeek(dayLabels.map((_, index) => {
      const saved = next.availability.find((item) => item.weekday === index + 1);
      return saved ?? { weekday: index + 1, start_time: index === 4 ? '12:00' : '13:00', end_time: index === 4 ? '15:00' : '19:00', active: index !== 2 };
    }));
  }

  useEffect(() => { void load(); }, []);

  async function save(action: string, payload: Record<string, unknown>, message: string) {
    setStatus('Salvando…');
    const response = await fetch('/api/admin/management', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setStatus(result.error ?? 'Não foi possível salvar agora.'); return false; }
    setStatus(message);
    await load();
    return true;
  }

  const activeServices = useMemo(() => data?.services.filter((item) => item.active) ?? [], [data]);
  if (!data) return <article className="dash-panel workspace-loading"><p>{status || 'Carregando ferramentas do painel…'}</p></article>;

  return <>
    <article className="dash-panel schedule-panel" id="agenda-painel">
      <div className="panel-head"><div><p>AGENDA</p><h2>Configure seus horários semanais</h2></div><button type="button" onClick={() => document.getElementById('week-editor')?.scrollIntoView({ behavior: 'smooth' })}>Editar semana</button></div>
      <div className="week-grid">{week.map((item) => <div className={`week-day ${item.active ? '' : 'off'}`} key={item.weekday}><strong>{dayLabels[item.weekday - 1].slice(0, 3)}</strong><span>{item.active ? `${item.start_time} — ${item.end_time}` : 'Bloqueado'}</span><div><i style={{ width: item.active ? '100%' : '0%' }} /></div><small>{item.active ? 'Atendimento ativo' : 'Sem atendimento'}</small></div>)}</div>
      <form className="week-editor" id="week-editor" onSubmit={(event) => { event.preventDefault(); void save('availability', { items: week.map((item) => ({ weekday: item.weekday, start: item.start_time, end: item.end_time, active: Boolean(item.active) })) }, 'Agenda semanal atualizada.'); }}>
        <h3>Horários padrão</h3>{week.map((item, index) => <label key={item.weekday}><input type="checkbox" checked={Boolean(item.active)} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, active: event.target.checked } : row))} /><span>{dayLabels[index]}</span><input aria-label={`Início de ${dayLabels[index]}`} type="time" value={item.start_time} disabled={!item.active} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, start_time: event.target.value } : row))} /><b>até</b><input aria-label={`Fim de ${dayLabels[index]}`} type="time" value={item.end_time} disabled={!item.active} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, end_time: event.target.value } : row))} /></label>)}<button className="dash-primary" type="submit">Salvar semana</button></form>
      <form className="exception-form" onSubmit={(event) => { event.preventDefault(); void save('exception-create', exception, 'Exceção da agenda salva.').then((ok) => { if (ok) setException({ date: '', kind: 'blocked', start: '', end: '', reason: '' }); }); }}><h3>Abra ou bloqueie uma data específica</h3><input aria-label="Data" type="date" required value={exception.date} onChange={(event) => setException({ ...exception, date: event.target.value })} /><select aria-label="Tipo" value={exception.kind} onChange={(event) => setException({ ...exception, kind: event.target.value })}><option value="blocked">Bloquear período</option><option value="open">Abrir período extra</option></select><input aria-label="Início (opcional)" type="time" value={exception.start} onChange={(event) => setException({ ...exception, start: event.target.value })} /><input aria-label="Fim (opcional)" type="time" value={exception.end} onChange={(event) => setException({ ...exception, end: event.target.value })} /><input aria-label="Motivo" placeholder="Motivo (opcional)" value={exception.reason} onChange={(event) => setException({ ...exception, reason: event.target.value })} /><button className="dash-primary" type="submit">Salvar período</button></form>
      {data.exceptions.length > 0 && <div className="exception-list">{data.exceptions.map((item) => <p key={item.id}><strong>{item.date}</strong> · {item.kind === 'blocked' ? 'Bloqueado' : 'Aberto'}{item.start_time ? `, ${item.start_time}–${item.end_time}` : ', dia inteiro'} {item.reason ? `— ${item.reason}` : ''}<button type="button" onClick={() => void save('exception-delete', { id: item.id }, 'Período removido.')}>Remover</button></p>)}</div>}
    </article>

    <article className="dash-panel services-panel" id="servicos-painel">
      <div className="panel-head"><div><p>SERVIÇOS</p><h2>Consultas ativas</h2></div><button type="button" onClick={() => setEditingService(activeServices[0] ?? data.services[0] ?? null)}>Editar serviços</button></div>
      <div className="mini-services">{data.services.map((service) => <button type="button" className={`service-admin-card ${service.active ? '' : 'inactive'}`} key={service.id} onClick={() => setEditingService(service)}><span>{service.duration_minutes} min · {service.active ? 'ativo' : 'pausado'}</span><strong>{service.name}</strong><b>{money(service.price_cents)}</b></button>)}</div>
    </article>

    <article className="dash-panel appointments-panel" id="clientes">
      <div className="panel-head"><div><p>RESERVAS E CLIENTES</p><h2>Acompanhe cada atendimento</h2></div></div>
      <p className="photo-help">✦ O selo <strong>Enviar fotos</strong> indica que a cliente autorizou receber as imagens das cartas pelo WhatsApp.</p>
      <div className="admin-table">{data.appointments.length ? data.appointments.map((item) => <div className="admin-row" key={item.id}><div><strong>{item.name}</strong><small>{item.service} · {item.starts_at.replace('T', ' às ')}</small>{Boolean(item.wants_card_images) && <span className="photo-badge">✦ Enviar fotos</span>}</div><a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a><select aria-label={`Status de ${item.name}`} value={item.status} onChange={(event) => void save('appointment', { id: item.id, status: event.target.value, paymentStatus: item.payment_status ?? 'pending' }, 'Status da reserva atualizado.')}><option value="pending">Pendente</option><option value="confirmed">Confirmada</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option><option value="no_show">Não compareceu</option></select><select aria-label={`Pagamento de ${item.name}`} value={item.payment_status ?? 'pending'} onChange={(event) => void save('appointment', { id: item.id, status: item.status, paymentStatus: event.target.value }, 'Pagamento atualizado.')}><option value="pending">Pagamento pendente</option><option value="paid">Pago</option><option value="refunded">Estornado</option><option value="cancelled">Cancelado</option></select></div>) : <p className="empty-panel">Nenhuma reserva enviada ainda.</p>}</div>
      <h3 className="subsection-title">Clientes cadastradas</h3><div className="customer-list">{data.customers.length ? data.customers.map((customer) => <div key={customer.id}><strong>{customer.name}</strong><span>{customer.whatsapp}</span><small>{customer.bookings} reserva(s)</small></div>) : <p className="empty-panel">Os dados enviados pelo agendamento aparecerão aqui.</p>}</div>
    </article>

    <article className="dash-panel messages-panel" id="mensagens">
      <div className="panel-head"><div><p>MENSAGENS</p><h2>Textos automáticos</h2></div></div>
      <p>Edite os textos-base. O envio automático pelo WhatsApp será conectado na próxima etapa; por enquanto você pode copiar a mensagem e enviar quando quiser.</p>
      <div className="template-list">{data.templates.map((template) => <button type="button" key={template.id} onClick={() => setEditingTemplate(template)}><strong>{template.title}</strong><span>{template.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</span></button>)}</div>
    </article>

    <article className="dash-panel feedback-panel" id="feedbacks">
      <div className="panel-head"><div><p>FEEDBACKS PRIVADOS</p><h2>O que as clientes compartilharam</h2></div><span className="date-chip">{data.feedback.filter((item) => item.status === 'new').length} novos</span></div>
      <p>Essas mensagens não são públicas e ficam visíveis apenas neste painel.</p>
      <div className="feedback-list">{data.feedback.length ? data.feedback.map((item) => <article key={item.id}><div><strong>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</strong><span>{item.name || 'Cliente sem identificação'} · {new Date(item.created_at).toLocaleDateString('pt-BR')}</span></div><p>{item.message}</p><small>{item.contact_allowed ? 'Aceita contato' : 'Não pediu contato'}</small><select aria-label="Status do feedback" value={item.status} onChange={(event) => void save('feedback', { id: item.id, status: event.target.value }, 'Feedback atualizado.')}><option value="new">Novo</option><option value="reviewed">Lido</option><option value="archived">Arquivado</option></select></article>) : <p className="empty-panel">Ainda não há feedbacks enviados.</p>}</div>
    </article>

    {editingService && <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Editar serviço"><form onSubmit={(event) => { event.preventDefault(); void save('service', { ...editingService, price: editingService.price_cents / 100, whatsappRate: editingService.whatsapp_rate_cents / 100, callRate: editingService.call_rate_cents / 100 }, 'Serviço atualizado.').then((ok) => { if (ok) setEditingService(null); }); }}><div className="modal-head"><h2>Editar serviço</h2><button type="button" onClick={() => setEditingService(null)}>×</button></div><label>Nome<input value={editingService.name} onChange={(event) => setEditingService({ ...editingService, name: event.target.value })} /></label><label>Descrição<textarea value={editingService.description} onChange={(event) => setEditingService({ ...editingService, description: event.target.value })} /></label><div className="modal-grid"><label>Preço base (R$)<input type="number" min="0" step="0.5" value={editingService.price_cents / 100} onChange={(event) => setEditingService({ ...editingService, price_cents: Math.round(Number(event.target.value) * 100) })} /></label><label>Duração (min)<input type="number" min="5" step="5" value={editingService.duration_minutes} onChange={(event) => setEditingService({ ...editingService, duration_minutes: Number(event.target.value) })} /></label><label>Mensagens/áudios (R$/min)<input type="number" min="0" step="0.1" value={editingService.whatsapp_rate_cents / 100} onChange={(event) => setEditingService({ ...editingService, whatsapp_rate_cents: Math.round(Number(event.target.value) * 100) })} /></label><label>Ligação (R$/min)<input type="number" min="0" step="0.1" value={editingService.call_rate_cents / 100} onChange={(event) => setEditingService({ ...editingService, call_rate_cents: Math.round(Number(event.target.value) * 100) })} /></label></div><label className="toggle-label"><input type="checkbox" checked={Boolean(editingService.active)} onChange={(event) => setEditingService({ ...editingService, active: event.target.checked ? 1 : 0 })} /> Atendimento disponível no site</label><button className="dash-primary" type="submit">Salvar alterações</button></form></div>}
    {editingTemplate && <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Editar mensagem"><form onSubmit={(event) => { event.preventDefault(); void save('template', editingTemplate, 'Texto automático atualizado.').then((ok) => { if (ok) setEditingTemplate(null); }); }}><div className="modal-head"><h2>Editar mensagem</h2><button type="button" onClick={() => setEditingTemplate(null)}>×</button></div><label>Título<input value={editingTemplate.title} onChange={(event) => setEditingTemplate({ ...editingTemplate, title: event.target.value })} /></label><label>Mensagem<textarea value={editingTemplate.body} onChange={(event) => setEditingTemplate({ ...editingTemplate, body: event.target.value })} /></label><label className="toggle-label"><input type="checkbox" checked={Boolean(editingTemplate.active)} onChange={(event) => setEditingTemplate({ ...editingTemplate, active: event.target.checked ? 1 : 0 })} /> Usar este texto</label><button className="dash-primary" type="submit">Salvar texto</button></form></div>}
    <p className="workspace-status" aria-live="polite">{status}</p>
  </>;
}
