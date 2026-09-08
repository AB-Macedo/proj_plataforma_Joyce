'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BOOKING_SERVICES, FORMAT_LABELS, formatMoney, getService, quotePriceCents, type BookingFormat, type ServiceSlug } from '../../lib/catalog';

type ScheduleResponse = {
  weeks: Array<{ startsOn: string; label: string; occupancy: number; days: Array<{ date: string; dayLabel: string; dateLabel: string; disabled: boolean; reason?: string; slots: Array<{ start: string; time: string }> }> }>;
  nextWeekLocked: boolean;
  duration: number;
  priceCents: number;
  depositCents: number | null;
};

type Success = { code: string; kind: 'booking' | 'request'; priceCents: number; depositCents: number | null; whatsappUrl: string };

const durationOptions = Array.from({ length: 17 }, (_, index) => 20 + index * 10);

function dateTimeLabel(value: string): string {
  const [date, time] = value.split('T');
  return `${new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}, às ${time.slice(0, 5)}`;
}

export default function BookingFlow() {
  const [serviceSlug, setServiceSlug] = useState<ServiceSlug>('consulta-essencial');
  const [format, setFormat] = useState<BookingFormat>('whatsapp');
  const [duration, setDuration] = useState(20);
  const [step, setStep] = useState(1);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [selectedStart, setSelectedStart] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Success | null>(null);
  const [formStartedAt] = useState(() => Date.now());
  const detailsRef = useRef<HTMLDivElement>(null);

  const service = useMemo(() => getService(serviceSlug)!, [serviceSlug]);
  const effectiveDuration = service.durationMinutes ?? duration;
  const price = quotePriceCents(service, format, effectiveDuration);
  const durationLabel = effectiveDuration < 60 ? `${effectiveDuration} minutos` : `${Math.floor(effectiveDuration / 60)}h${effectiveDuration % 60 ? ` ${effectiveDuration % 60}min` : ''}`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelectedStart(''); setActiveWeek(0); setSuccess(null);
    fetch(`/api/availability?service=${serviceSlug}&format=${format}&duration=${effectiveDuration}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as ScheduleResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar a agenda.');
        setSchedule(data);
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a agenda.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [serviceSlug, format, effectiveDuration]);

  function chooseService(slug: ServiceSlug) {
    setServiceSlug(slug);
    const chosen = getService(slug)!;
    setDuration(chosen.durationMinutes ?? 20);
    setSelectedStart('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStart) { setError('Escolha um horário antes de continuar.'); return; }
    setSubmitting(true); setError('');
    const formData = new FormData(event.currentTarget);
    const payload = {
      service: serviceSlug, format, duration: effectiveDuration, startsAt: selectedStart,
      name: formData.get('name'), whatsapp: formData.get('whatsapp'), email: formData.get('email'),
      birthDate: formData.get('birthDate'),
      wantsCardImages: formData.get('wantsCardImages') === 'on', templeRulesAccepted: formData.get('templeRulesAccepted') === 'on',
      acceptedTerms: formData.get('acceptedTerms') === 'on', website: formData.get('website'), formStartedAt,
    };
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json() as Success & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível registrar o agendamento.');
      setSuccess(data);
      if (data.kind === 'booking') {
        setSchedule((current) => current ? { ...current, weeks: current.weeks.map((week) => ({ ...week, days: week.days.map((day) => ({ ...day, slots: day.slots.filter((slot) => slot.start !== selectedStart) })) })) } : current);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível registrar o agendamento.');
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="calendar-card booking-success" role="status">
        <span className="success-symbol">✓</span>
        <p className="booking-step">{success.kind === 'request' ? 'SOLICITAÇÃO ENVIADA' : 'HORÁRIO RESERVADO'}</p>
        <h3>Seu pedido de agendamento foi recebido.</h3>
        <p>Código <strong>{success.code}</strong>. Valor: <strong>{formatMoney(success.priceCents)}</strong>. Continue no WhatsApp para receber a chave PIX e enviar o comprovante.</p>
        <a className="button button-primary" href={success.whatsappUrl} target="_blank" rel="noreferrer">Continuar no WhatsApp</a>
        <button className="reset-booking" type="button" onClick={() => { setSuccess(null); setSelectedStart(''); }}>Fazer outro agendamento</button>
      </div>
    );
  }

  const week = schedule?.weeks[activeWeek];

  const stepTitle = step === 1 ? '1 · ESCOLHA SEU ATENDIMENTO E TEMPO' : step === 2 ? '2 · ESCOLHA COMO PREFERE RECEBER' : '3 · ESCOLHA A DATA E O HORÁRIO';

  return (
    <form className="calendar-card booking-flow" onSubmit={submit}>
      <div className="flow-progress" aria-label={`Etapa ${step} de 3`}>
        {[1, 2, 3].map((item) => <span className={item === step ? 'active' : item < step ? 'done' : ''} key={item}>{item}</span>)}
      </div>

      {step === 1 && <div className="booking-section flow-stage">
        <p className="booking-step">{stepTitle}</p>
        <h3>O que você busca hoje?</h3>
        <p className="choice-group-label">ATENDIMENTOS</p>
        <div className="booking-service-options">
          {BOOKING_SERVICES.filter((item) => !item.pilotPrice).map((item) => <button className={serviceSlug === item.slug ? 'selected' : ''} key={item.slug} type="button" onClick={() => chooseService(item.slug)}>{item.shortName}{item.requiresApproval && <small>Sob aprovação</small>}</button>)}
        </div>
        {serviceSlug === 'consulta-livre' && <label className="duration-field"><span>Duração desejada</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{durationOptions.map((value) => <option key={value} value={value}>{value < 60 ? `${value} minutos` : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}min` : ''}`}</option>)}</select><small>Acima de 90 minutos, solicite com pelo menos 24 horas de antecedência.</small></label>}
        {service.templeRules && <div className="temple-alert"><strong>Templo de Vênus é uma leitura fechada</strong><span>Ela já contempla pensamentos, sentimentos, intenções e tendência do relacionamento. Não é possível acrescentar perguntas extras.</span></div>}
        <div className="special-choice-group"><p className="choice-group-label">OUTRAS LEITURAS · VALOR PILOTO R$ 10,00</p><div>{BOOKING_SERVICES.filter((item) => item.pilotPrice).map((item) => <button className={serviceSlug === item.slug ? 'selected' : ''} key={item.slug} type="button" onClick={() => chooseService(item.slug)}><span>{item.shortName}</span><b>20 min · R$ 10</b></button>)}</div></div>
        <button className="flow-next" type="button" onClick={() => setStep(2)}><span>Continuar</span><b aria-hidden="true">→</b></button>
      </div>}

      {step === 2 && <div className="booking-section flow-stage">
        <button className="flow-back" type="button" onClick={() => setStep(1)}><b aria-hidden="true">←</b><span>Voltar</span></button>
        <p className="booking-step">{stepTitle}</p>
        <h3>Mensagem, áudio ou ligação?</h3>
        <div className="format-options">
          {(Object.keys(FORMAT_LABELS) as BookingFormat[]).map((item) => <label className={format === item ? 'selected' : ''} key={item}><input checked={format === item} name="format" onChange={() => setFormat(item)} type="radio" value={item} /><span>{item === 'whatsapp' ? '◌' : '☎'}</span><strong>{FORMAT_LABELS[item]}</strong><small>{item === 'whatsapp' ? 'R$ 3,50 por minuto' : 'R$ 4,50 por minuto'}</small></label>)}
        </div>
        <div className="selection-summary"><span>Você selecionou</span><strong>{service.name}</strong><small>{durationLabel} · {FORMAT_LABELS[format]}</small></div>
        <div className="price-preview"><span>{service.requiresApproval ? 'Valor estimado' : 'Valor do atendimento'}</span><strong>{formatMoney(price)}</strong></div>
        <button className="flow-next" type="button" onClick={() => setStep(3)}><span>Ver datas disponíveis</span><b aria-hidden="true">→</b></button>
      </div>}

      {step === 3 && <div className="booking-section flow-stage calendar-stage">
        <div className="calendar-top"><div><small>{stepTitle}</small><strong>{week?.label ?? 'Carregando agenda'}</strong></div><span>Horário de Brasília</span></div>
        <button className="flow-back calendar-back" type="button" onClick={() => setStep(2)}><b aria-hidden="true">←</b><span>Voltar</span></button>
        {schedule && schedule.weeks.length > 1 && <div className="week-switcher">{schedule.weeks.map((item, index) => <button className={activeWeek === index ? 'active' : ''} type="button" key={item.startsOn} onClick={() => { setActiveWeek(index); setSelectedStart(''); }}>{index === 0 ? 'Esta semana' : 'Próxima semana'}</button>)}</div>}
        {loading && <p className="schedule-message">Consultando os horários disponíveis…</p>}
        <div className="selection-summary schedule-summary"><span>Sua escolha até agora</span><strong>{service.name}</strong><small>{durationLabel} · {FORMAT_LABELS[format]} · {formatMoney(price)}</small></div>
        {!loading && week && <div className="days full-week">{week.days.map((item) => <div className={`day ${item.disabled ? 'day-disabled' : ''}`} key={item.date}><div className="day-heading"><span>{item.dayLabel}</span><strong>{item.dateLabel}</strong></div>{item.disabled ? <div className="closed-day">Sem atendimento</div> : item.slots.length ? item.slots.map((slot) => <button className={selectedStart === slot.start ? 'selected' : ''} key={slot.start} type="button" onClick={() => { setSelectedStart(slot.start); setError(''); window.setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); }}>{slot.time}</button>) : <div className="closed-day">Sem horários</div>}</div>)}</div>}
        {schedule?.nextWeekLocked && <p className="next-week-note">A agenda da próxima semana será exibida automaticamente quando esta semana atingir 60% de ocupação.</p>}
        {!selectedStart && <p className="after-slot-note">Depois de escolher o horário, você confirma seus dados e informa se quer receber as fotos das cartas pelo WhatsApp.</p>}
      </div>}

      {selectedStart && <div className="booking-section client-fields" ref={detailsRef}>
        <div className="selected-slot"><span>HORÁRIO ESCOLHIDO</span><strong>{dateTimeLabel(selectedStart)}</strong></div>
        <div className="selection-summary final-summary"><span>CONFIRA SUA RESERVA</span><strong>{service.name}</strong><small>{durationLabel} · {FORMAT_LABELS[format]} · {formatMoney(price)}</small></div>
        <p className="booking-step">3 · SEUS DADOS E PREFERÊNCIAS</p>
        <div className="field-grid"><label><span>Nome completo de solteira/o</span><input name="name" required autoComplete="name" placeholder="Informe seu nome completo de solteira/o" /></label><label><span>WhatsApp</span><input name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="(27) 99999-9999" /></label><label><span>Data de nascimento</span><input name="birthDate" required type="date" autoComplete="bday" /></label><label><span>E-mail <small>(opcional)</small></span><input name="email" type="email" autoComplete="email" /></label></div>
        <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label className="check-row photo-preference"><input name="wantsCardImages" type="checkbox" /><span><strong>Quero receber fotos das cartas pelo WhatsApp.</strong><small>Se esta opção não for marcada, as imagens não serão enviadas automaticamente.</small></span></label>
        {service.templeRules && <label className="check-row"><input name="templeRulesAccepted" required type="checkbox" /><span><strong>Entendi que o Templo de Vênus não inclui perguntas extras.</strong></span></label>}
        <div className="privacy-notice"><strong>Privacidade e uso dos dados</strong><p>Nome, WhatsApp, e-mail e data de nascimento serão usados somente para identificar sua reserva, entrar em contato e realizar este atendimento. Não serão vendidos ou compartilhados para marketing.</p><p>Você pode pedir acesso, correção ou eliminação dos seus dados pelo WhatsApp. Ao término do tratamento, os dados serão eliminados ou anonimizados nos limites da LGPD, salvo obrigação legal de conservação.</p></div>
        <label className="check-row"><input name="acceptedTerms" required type="checkbox" /><span><strong>Li e concordo com as regras do agendamento e com o uso dos meus dados para esta finalidade.</strong><small>O consentimento pode ser revogado e os direitos sobre seus dados podem ser solicitados pelo WhatsApp.</small></span></label>
        {error && <p className="booking-error" role="alert">{error}</p>}
        <button className="submit-booking" disabled={submitting} type="submit">{submitting ? 'Registrando…' : service.requiresApproval ? 'Solicitar encaixe e pagar' : 'Reservar e pagar pelo WhatsApp'}</button>
      </div>}
      {!selectedStart && error && <p className="booking-error" role="alert">{error}</p>}
    </form>
  );
}
