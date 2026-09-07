'use client';

import { useState } from 'react';

export default function DashboardControls({ initialEnabled, initialMinutes }: { initialEnabled: boolean; initialMinutes: number }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [status, setStatus] = useState('');

  async function save(nextEnabled = enabled, nextMinutes = minutes) {
    setStatus('Salvando…');
    const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: nextEnabled, minutes: nextMinutes }) });
    setStatus(response.ok ? 'Proteção atualizada.' : 'Não foi possível salvar agora.');
  }

  return <article className="dash-panel routine-panel">
    <div className="panel-head"><div><p>PROTEÇÃO DA ROTINA</p><h2>Limite diário de atendimento</h2></div><span className={enabled ? 'limit-on' : 'limit-off'}>{enabled ? 'Ativo' : 'Pausado'}</span></div>
    <p>Quando ativo, o site para de oferecer novos horários ao atingir o total definido no dia.</p>
    <div className="routine-controls"><label><input type="checkbox" checked={enabled} onChange={(event) => { const value = event.target.checked; setEnabled(value); void save(value, minutes); }} /><span>Ativar proteção</span></label><select value={minutes} onChange={(event) => { const value = Number(event.target.value); setMinutes(value); void save(enabled, value); }}>{[60,90,120,150,180,210,240,300,360].map((item) => <option key={item} value={item}>{item < 60 ? `${item} min` : `${item / 60} hora${item === 60 ? '' : 's'}`}</option>)}</select></div>
    <small>{status || 'Limite de teste inicial: 3 horas por dia.'}</small>
  </article>;
}
