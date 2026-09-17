'use client';

import { useEffect, useMemo, useState } from 'react';

type Service = { id: number; slug: string; name: string; description: string; price_cents: number; whatsapp_rate_cents: number; call_rate_cents: number; duration_minutes: number; internal_note: string | null; active: number };
type ServiceDraft = Omit<Service, 'id' | 'slug' | 'internal_note'> & { id?: number; slug?: string; internal_note?: string | null };
type Availability = { id?: number; weekday: number; start_time: string; end_time: string; active: number | boolean };
type Exception = { id: number; date: string; start_time: string | null; end_time: string | null; kind: 'open' | 'blocked'; reason: string | null };
type Customer = { id: number; name: string; whatsapp: string; email: string | null; birth_date: string | null; created_at: string; bookings: number };
type Appointment = { id: number; starts_at: string; ends_at: string; booking_code: string; google_event_id: string | null; duration_minutes: number; quoted_price_cents: number; status: string; format: string; wants_card_images: number; name: string; whatsapp: string; service: string; payment_status: string | null };
type Template = { id: number; key: string; channel: string; title: string; body: string; active: number };
type Feedback = { id: number; name: string | null; rating: number; message: string; contact_allowed: number; status: 'new' | 'reviewed' | 'archived'; created_at: string };
type Data = { services: Service[]; availability: Availability[]; exceptions: Exception[]; customers: Customer[]; appointments: Appointment[]; templates: Template[]; feedback: Feedback[]; calendarConnected: boolean };
export type DashboardSection = 'visao-geral' | 'agenda' | 'servicos' | 'clientes' | 'financeiro' | 'mensagens' | 'feedbacks';

const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const phoneKey = (value: string) => value.replace(/\D/g, '');
const dateKey = (value: string) => value.slice(0, 10);

function dateRangeFor(filter: 'all' | 'today' | 'week' | 'upcoming' | 'past') {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const toKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { todayKey, mondayKey: toKey(monday), sundayKey: toKey(sunday), filter };
}

export default function DashboardWorkspace({ section }: { section: DashboardSection }) {
  const [data, setData] = useState<Data | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [creatingService, setCreatingService] = useState(false);
  const [week, setWeek] = useState<Availability[]>([]);
  const [status, setStatus] = useState('');
  const [exception, setException] = useState({ date: '', kind: 'blocked', start: '', end: '', reason: '' });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingWeek, setEditingWeek] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'upcoming' | 'past'>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'first' | 'repeat'>('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'>('all');

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
  useEffect(() => {
    if (section === 'visao-geral') return;
    const refresh = async () => {
      try {
        const response = await fetch('/api/admin/management');
        if (response.ok) setData(await response.json() as Data);
      } catch { /* A próxima tentativa automática mantém o painel atualizado. */ }
    };
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [section]);

  async function save(action: string, payload: Record<string, unknown>, message: string) {
    setStatus('Salvando…');
    try {
      const response = await fetch('/api/admin/management', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
      const result = await response.json().catch(() => ({})) as { error?: string; calendarMessage?: string; calendarError?: string };
      if (!response.ok) { setStatus(result.error ?? 'Não foi possível salvar agora. Atualize a página e tente novamente.'); return false; }
      setStatus(result.calendarError ? `${message} ${result.calendarError}` : result.calendarMessage ? `${message} ${result.calendarMessage}` : message); await load(); return true;
    } catch { setStatus('Não foi possível salvar agora. Verifique sua conexão e tente novamente.'); return false; }
  }

  const activeServices = useMemo(() => data?.services.filter((item) => item.active) ?? [], [data]);
  const newService = (): ServiceDraft => ({ name: '', description: '', price_cents: 0, whatsapp_rate_cents: 350, call_rate_cents: 450, duration_minutes: 20, active: 1 });
  const customerBookingsByPhone = useMemo(() => new Map((data?.customers ?? []).map((customer) => [phoneKey(customer.whatsapp), customer.bookings])), [data]);
  const filteredAppointments = useMemo(() => {
    if (!data) return [];
    const query = clientSearch.trim().toLocaleLowerCase('pt-BR');
    const range = dateRangeFor(periodFilter);
    return data.appointments.filter((item) => {
      const itemDate = dateKey(item.starts_at);
      const matchesSearch = !query || item.name.toLocaleLowerCase('pt-BR').includes(query) || phoneKey(item.whatsapp).includes(phoneKey(query));
      const matchesPeriod = range.filter === 'all' || (range.filter === 'today' && itemDate === range.todayKey) || (range.filter === 'week' && itemDate >= range.mondayKey && itemDate <= range.sundayKey) || (range.filter === 'upcoming' && itemDate >= range.todayKey) || (range.filter === 'past' && itemDate < range.todayKey);
      const bookings = customerBookingsByPhone.get(phoneKey(item.whatsapp)) ?? 1;
      const matchesRecurrence = recurrenceFilter === 'all' || (recurrenceFilter === 'repeat' ? bookings > 1 : bookings <= 1);
      const matchesStatus = appointmentStatusFilter === 'all' || item.status === appointmentStatusFilter;
      return matchesSearch && matchesPeriod && matchesRecurrence && matchesStatus;
    });
  }, [data, clientSearch, periodFilter, recurrenceFilter, appointmentStatusFilter, customerBookingsByPhone]);
  const filteredCustomerPhones = useMemo(() => new Set(filteredAppointments.map((item) => phoneKey(item.whatsapp))), [filteredAppointments]);
  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    const query = clientSearch.trim().toLocaleLowerCase('pt-BR');
    const shouldFollowAppointments = periodFilter !== 'all' || recurrenceFilter !== 'all' || appointmentStatusFilter !== 'all';
    return data.customers.filter((customer) => (!query || customer.name.toLocaleLowerCase('pt-BR').includes(query) || phoneKey(customer.whatsapp).includes(phoneKey(query))) && (!shouldFollowAppointments || filteredCustomerPhones.has(phoneKey(customer.whatsapp))));
  }, [data, clientSearch, periodFilter, recurrenceFilter, appointmentStatusFilter, filteredCustomerPhones]);
  if (section === 'visao-geral') return null;
  if (!data) return <article className="dash-panel workspace-loading"><p>{status || 'Carregando ferramentas do painel…'}</p></article>;

  return <>
    {section === 'agenda' && <article className="dash-panel schedule-panel" id="agenda-painel">
      <div className="panel-head"><div><p>AGENDA</p><h2>Configure seus horários semanais</h2></div><button type="button" onClick={() => setEditingWeek((current) => !current)}>{editingWeek ? 'Fechar edição' : 'Editar agenda'}</button></div>
      <div className="week-grid">{week.map((item) => <div className={`week-day ${item.active ? '' : 'off'}`} key={item.weekday}><strong>{dayLabels[item.weekday - 1].slice(0, 3)}</strong><span>{item.active ? `${item.start_time} — ${item.end_time}` : 'Bloqueado'}</span><div><i style={{ width: item.active ? '100%' : '0%' }} /></div><small>{item.active ? 'Atendimento ativo' : 'Sem atendimento'}</small></div>)}</div>
      {editingWeek && <><form className="week-editor" id="week-editor" onSubmit={(event) => { event.preventDefault(); void save('availability', { items: week.map((item) => ({ weekday: item.weekday, start: item.start_time, end: item.end_time, active: Boolean(item.active) })) }, 'Agenda semanal atualizada.'); }}>
        <h3>Horários padrão</h3>{week.map((item, index) => <label key={item.weekday}><input type="checkbox" checked={Boolean(item.active)} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, active: event.target.checked } : row))} /><span>{dayLabels[index]}</span><input aria-label={`Início de ${dayLabels[index]}`} type="time" value={item.start_time} disabled={!item.active} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, start_time: event.target.value } : row))} /><b>até</b><input aria-label={`Fim de ${dayLabels[index]}`} type="time" value={item.end_time} disabled={!item.active} onChange={(event) => setWeek((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, end_time: event.target.value } : row))} /></label>)}<button className="dash-primary" type="submit">Salvar semana</button></form>
      <form className="exception-form" onSubmit={(event) => { event.preventDefault(); void save('exception-create', exception, 'Exceção da agenda salva.').then((ok) => { if (ok) setException({ date: '', kind: 'blocked', start: '', end: '', reason: '' }); }); }}><h3>Abra ou bloqueie uma data específica</h3><input aria-label="Data" type="date" required value={exception.date} onChange={(event) => setException({ ...exception, date: event.target.value })} /><select aria-label="Tipo" value={exception.kind} onChange={(event) => setException({ ...exception, kind: event.target.value })}><option value="blocked">Bloquear período</option><option value="open">Abrir período extra</option></select><input aria-label="Início (opcional)" type="time" value={exception.start} onChange={(event) => setException({ ...exception, start: event.target.value })} /><input aria-label="Fim (opcional)" type="time" value={exception.end} onChange={(event) => setException({ ...exception, end: event.target.value })} /><input aria-label="Motivo" placeholder="Motivo (opcional)" value={exception.reason} onChange={(event) => setException({ ...exception, reason: event.target.value })} /><button className="dash-primary" type="submit">Salvar período</button></form>
      {data.exceptions.length > 0 && <div className="exception-list">{data.exceptions.map((item) => <p key={item.id}><strong>{item.date}</strong> · {item.kind === 'blocked' ? 'Bloqueado' : 'Aberto'}{item.start_time ? `, ${item.start_time}–${item.end_time}` : ', dia inteiro'} {item.reason ? `— ${item.reason}` : ''}<button type="button" onClick={() => void save('exception-delete', { id: item.id }, 'Período removido.')}>Remover</button></p>)}</div>}</>}
      <aside className={`calendar-connection ${data.calendarConnected ? 'connected' : ''}`}><strong>{data.calendarConnected ? 'Google Agenda conectado' : 'Google Agenda aguardando conexão'}</strong><span>{data.calendarConnected ? 'Reservas confirmadas e pagas entram automaticamente na agenda.' : 'A integração será ativada assim que a configuração segura for concluída.'}</span></aside>
      <p className="workspace-status" aria-live="polite">{status}</p>
    </article>}

    {section === 'servicos' && <article className="dash-panel services-panel" id="servicos-painel">
      <div className="panel-head"><div><p>SERVIÇOS</p><h2>Catálogo de atendimentos</h2></div><button type="button" onClick={() => { setCreatingService(true); setEditingService(null); }}>+ Adicionar serviço</button></div>
      <p className="services-help">Toque em um atendimento para editar. Pausar o serviço o tira temporariamente do site, sem apagar o histórico de reservas.</p>
      <div className="mini-services">{data.services.map((service) => <button type="button" className={`service-admin-card ${service.active ? '' : 'inactive'}`} key={service.id} onClick={() => setEditingService(service)}><span>{service.duration_minutes} min · {service.active ? 'ativo' : 'pausado'}</span><strong>{service.name}</strong><b>{money(service.price_cents)}</b></button>)}</div>
    </article>}

    {section === 'clientes' && <article className="dash-panel appointments-panel" id="clientes">
      <div className="panel-head"><div><p>RESERVAS E CLIENTES</p><h2>Acompanhe cada atendimento</h2></div></div>
      <p className="photo-help">✦ O selo <strong>Enviar fotos</strong> indica que a cliente autorizou receber as imagens das cartas pelo WhatsApp.</p>
      <p className="auto-refresh-note">Atualização automática ativa: novas reservas aparecem aqui em até 15 segundos.</p>
      <div className="client-filters" aria-label="Filtros de clientes e atendimentos"><label>Buscar cliente<input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Nome ou WhatsApp" /></label><label>Período<select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as typeof periodFilter)}><option value="all">Todos os períodos</option><option value="today">Hoje</option><option value="week">Esta semana</option><option value="upcoming">Próximos</option><option value="past">Anteriores</option></select></label><label>Histórico<select value={recurrenceFilter} onChange={(event) => setRecurrenceFilter(event.target.value as typeof recurrenceFilter)}><option value="all">Todas as clientes</option><option value="first">Primeiro atendimento</option><option value="repeat">Clientes recorrentes</option></select></label><label>Situação<select value={appointmentStatusFilter} onChange={(event) => setAppointmentStatusFilter(event.target.value as typeof appointmentStatusFilter)}><option value="all">Todas as situações</option><option value="pending">Pendente</option><option value="confirmed">Confirmada</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option><option value="no_show">Não compareceu</option></select></label></div>
      <p className="filter-summary">Mostrando <strong>{filteredAppointments.length}</strong> de {data.appointments.length} atendimento(s) · <strong>{filteredAppointments.filter((item) => (customerBookingsByPhone.get(phoneKey(item.whatsapp)) ?? 1) > 1).length}</strong> de cliente(s) recorrente(s).</p>
      <div className="admin-table">{filteredAppointments.length ? filteredAppointments.map((item) => <div className="admin-row" key={item.id}><div><strong>{item.name}</strong><small>{item.service} · {item.starts_at.replace('T', ' às ')}</small>{(customerBookingsByPhone.get(phoneKey(item.whatsapp)) ?? 1) > 1 && <span className="repeat-badge">↻ Cliente recorrente</span>}{Boolean(item.wants_card_images) && <span className="photo-badge">✦ Enviar fotos</span>}{item.google_event_id && <span className="calendar-badge">◷ Google Agenda</span>}</div><a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a><select aria-label={`Status de ${item.name}`} value={item.status} onChange={(event) => void save('appointment', { id: item.id, status: event.target.value, paymentStatus: item.payment_status ?? 'pending' }, 'Status da reserva atualizado.')}><option value="pending">Pendente</option><option value="confirmed">Confirmada</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option><option value="no_show">Não compareceu</option></select><select aria-label={`Pagamento de ${item.name}`} value={item.payment_status ?? 'pending'} onChange={(event) => void save('appointment', { id: item.id, status: item.status, paymentStatus: event.target.value }, 'Pagamento atualizado.')}><option value="pending">Pagamento pendente</option><option value="paid">Pago</option><option value="refunded">Estornado</option><option value="cancelled">Cancelado</option></select>{!item.google_event_id && (item.status === 'confirmed' || item.status === 'completed') && item.payment_status === 'paid' && <button type="button" className="calendar-sync-button" onClick={() => void save('calendar-sync', { id: item.id }, 'Sincronização solicitada.')}>Sincronizar agenda</button>}</div>) : <p className="empty-panel">Nenhum atendimento encontrado com estes filtros.</p>}</div>
      <h3 className="subsection-title">Clientes cadastradas</h3><p className="customer-list-note">{periodFilter === 'all' && recurrenceFilter === 'all' && appointmentStatusFilter === 'all' ? 'Histórico completo de clientes.' : 'Clientes que aparecem nos atendimentos filtrados acima.'}</p><div className="customer-list">{filteredCustomers.length ? filteredCustomers.map((customer) => <div key={customer.id}><strong>{customer.name}</strong><span>{customer.whatsapp}</span><small>{customer.bookings > 1 ? `Cliente recorrente · ${customer.bookings} atendimentos` : 'Primeiro atendimento'}</small></div>) : <p className="empty-panel">Nenhuma cliente encontrada com estes filtros.</p>}</div>
      <p className="workspace-status" aria-live="polite">{status}</p>
    </article>}

    {section === 'financeiro' && <article className="dash-panel appointments-panel"><div className="panel-head"><div><p>FINANCEIRO</p><h2>Pagamentos das reservas</h2></div></div><div className="admin-table">{data.appointments.length ? data.appointments.map((item) => <div className="admin-row" key={item.id}><div><strong>{item.name}</strong><small>{item.service} · {money(item.quoted_price_cents)}</small></div><span>{item.payment_status === 'paid' ? 'Pago' : 'Aguardando pagamento'}</span><select aria-label={`Pagamento de ${item.name}`} value={item.payment_status ?? 'pending'} onChange={(event) => void save('appointment', { id: item.id, status: item.status, paymentStatus: event.target.value }, 'Pagamento atualizado.')}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="refunded">Estornado</option><option value="cancelled">Cancelado</option></select></div>) : <p className="empty-panel">Nenhum pagamento registrado ainda.</p>}</div><p className="workspace-status" aria-live="polite">{status}</p></article>}

    {section === 'mensagens' && <article className="dash-panel messages-panel" id="mensagens">
      <div className="panel-head"><div><p>MENSAGENS</p><h2>Textos automáticos</h2></div></div>
      <p>Edite os textos-base. O envio automático pelo WhatsApp será conectado na próxima etapa; por enquanto você pode copiar a mensagem e enviar quando quiser.</p>
      <div className="template-list">{data.templates.map((template) => <button type="button" key={template.id} onClick={() => setEditingTemplate(template)}><strong>{template.title}</strong><span>{template.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</span></button>)}</div>
    </article>}

    {section === 'feedbacks' && <article className="dash-panel feedback-panel" id="feedbacks">
      <div className="panel-head"><div><p>FEEDBACKS PRIVADOS</p><h2>O que as clientes compartilharam</h2></div><span className="date-chip">{data.feedback.filter((item) => item.status === 'new').length} novos</span></div>
      <p>Essas mensagens não são públicas e ficam visíveis apenas neste painel.</p>
      <div className="feedback-list">{data.feedback.length ? data.feedback.map((item) => <article key={item.id}><div><strong>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</strong><span>{item.name || 'Cliente sem identificação'} · {new Date(item.created_at).toLocaleDateString('pt-BR')}</span></div><p>{item.message}</p><small>{item.contact_allowed ? 'Aceita contato' : 'Não pediu contato'}</small><select aria-label="Status do feedback" value={item.status} onChange={(event) => void save('feedback', { id: item.id, status: event.target.value }, 'Feedback atualizado.')}><option value="new">Novo</option><option value="reviewed">Lido</option><option value="archived">Arquivado</option></select></article>) : <p className="empty-panel">Ainda não há feedbacks enviados.</p>}</div>
    </article>}

    {(editingService || creatingService) && <ServiceEditor service={editingService ?? newService()} creating={creatingService} close={() => { setEditingService(null); setCreatingService(false); }} save={save} />}
    {editingTemplate && <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Editar mensagem"><form onSubmit={(event) => { event.preventDefault(); void save('template', editingTemplate, 'Texto automático atualizado.').then((ok) => { if (ok) setEditingTemplate(null); }); }}><div className="modal-head"><h2>Editar mensagem</h2><button type="button" onClick={() => setEditingTemplate(null)}>×</button></div><label>Título<input value={editingTemplate.title} onChange={(event) => setEditingTemplate({ ...editingTemplate, title: event.target.value })} /></label><label>Mensagem<textarea value={editingTemplate.body} onChange={(event) => setEditingTemplate({ ...editingTemplate, body: event.target.value })} /></label><label className="toggle-label"><input type="checkbox" checked={Boolean(editingTemplate.active)} onChange={(event) => setEditingTemplate({ ...editingTemplate, active: event.target.checked ? 1 : 0 })} /> Usar este texto</label><button className="dash-primary" type="submit">Salvar texto</button></form></div>}
  </>;
}

function ServiceEditor({ service, creating, close, save }: { service: ServiceDraft; creating: boolean; close: () => void; save: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState<ServiceDraft>(service);
  const label = creating ? 'Novo serviço' : 'Editar serviço';
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={label}><form onSubmit={(event) => { event.preventDefault(); void save(creating ? 'service-create' : 'service', { ...draft, price: draft.price_cents / 100, whatsappRate: draft.whatsapp_rate_cents / 100, callRate: draft.call_rate_cents / 100 }, creating ? 'Novo serviço adicionado ao catálogo.' : 'Serviço atualizado.').then((ok) => { if (ok) close(); }); }}>
    <div className="modal-head"><div><p className="modal-kicker">SERVIÇOS</p><h2>{label}</h2></div><button type="button" aria-label="Fechar" onClick={close}>×</button></div>
    <label>Nome do atendimento<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ex.: Leitura de caminhos" /></label>
    <label>Descrição que aparecerá no catálogo<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Explique brevemente o que a cliente recebe." /></label>
    <div className="modal-grid"><label>Preço base (R$)<input required type="number" min="0" step="0.5" value={draft.price_cents / 100} onChange={(event) => setDraft({ ...draft, price_cents: Math.round(Number(event.target.value) * 100) })} /></label><label>Duração (min)<input required type="number" min="5" step="5" value={draft.duration_minutes} onChange={(event) => setDraft({ ...draft, duration_minutes: Number(event.target.value) })} /></label><label>Mensagens/áudios (R$/min)<input required type="number" min="0" step="0.1" value={draft.whatsapp_rate_cents / 100} onChange={(event) => setDraft({ ...draft, whatsapp_rate_cents: Math.round(Number(event.target.value) * 100) })} /></label><label>Ligação (R$/min)<input required type="number" min="0" step="0.1" value={draft.call_rate_cents / 100} onChange={(event) => setDraft({ ...draft, call_rate_cents: Math.round(Number(event.target.value) * 100) })} /></label></div>
    <label className="toggle-label"><input type="checkbox" checked={Boolean(draft.active)} onChange={(event) => setDraft({ ...draft, active: event.target.checked ? 1 : 0 })} /> Disponível para agendamento no site</label>
    <div className="modal-actions"><button className="dash-primary" type="submit">{creating ? 'Adicionar serviço' : 'Salvar alterações'}</button>{!creating && <button className="secondary-action" type="button" onClick={() => setDraft({ ...draft, active: draft.active ? 0 : 1 })}>{draft.active ? 'Pausar temporariamente' : 'Ativar novamente'}</button>}</div>
  </form></div>;
}
