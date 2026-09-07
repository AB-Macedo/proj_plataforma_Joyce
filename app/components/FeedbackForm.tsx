'use client';

import { FormEvent, useState } from 'react';

export default function FeedbackForm() {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [startedAt] = useState(() => Date.now());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setStatus('');
    const form = event.currentTarget; const values = new FormData(form);
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: values.get('name'), rating: Number(values.get('rating')), message: values.get('message'), contactAllowed: values.get('contactAllowed') === 'on', website: values.get('website'), startedAt }) });
    const data = await response.json() as { error?: string };
    setSending(false);
    if (!response.ok) { setStatus(data.error ?? 'Não foi possível enviar agora.'); return; }
    form.reset(); setStatus('Obrigada por compartilhar. Seu feedback foi enviado de forma privada.');
  }
  return <form className="feedback-form" onSubmit={submit}>
    <label>Como podemos te chamar? <small>(opcional)</small><input name="name" maxLength={90} /></label>
    <label>Sua experiência<select name="rating" required defaultValue=""><option value="" disabled>Escolha de 1 a 5 estrelas</option><option value="5">★★★★★ — muito boa</option><option value="4">★★★★ — boa</option><option value="3">★★★ — regular</option><option value="2">★★ — pode melhorar</option><option value="1">★ — não foi boa</option></select></label>
    <label className="feedback-message">Conte com sinceridade — o que funcionou ou poderia melhorar?<textarea name="message" required minLength={8} maxLength={1600} /></label>
    <label className="feedback-check"><input type="checkbox" name="contactAllowed" /><span>Podemos entrar em contato sobre este feedback.</span></label>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <p>Este formulário é privado: sua mensagem não será publicada no site.</p><button type="submit" disabled={sending}>{sending ? 'Enviando…' : 'Enviar feedback privado'}</button>{status && <strong role="status">{status}</strong>}
  </form>;
}
