// MySpace · Hábitos (Fase 1): un hábito mínimo por área, racha, semana y recordatorios en el calendario
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const AZUL = '#7B93FF'
export const AREAS_HABITO = [
  { id:'espiritual',   l:'Espiritual',   icono:'🙏', ej:'Leer un capítulo y orar 10 minutos',       min:'Abrir la Biblia y leer un versículo' },
  { id:'mental',       l:'Mental',       icono:'🧠', ej:'Leer 15 minutos',                          min:'Leer una página' },
  { id:'fisica',       l:'Física',       icono:'💪', ej:'Entrenar',                                 min:'Ponerme la ropa del gym' },
  { id:'financiera',   l:'Financiera',   icono:'💰', ej:'Anotar todos los gastos del día',          min:'Anotar el primer gasto' },
  { id:'emocional',    l:'Emocional',    icono:'❤️', ej:'Escribir cómo me siento',                  min:'Una línea en el diario' },
  { id:'lucia',        l:'Lucía',        icono:'👧', ej:'Llamar o compartir con Lucía',             min:'Mandarle un audio' },
  { id:'alimentacion', l:'Alimentación', icono:'🥗', ej:'Proteína en cada comida, cero gaseosa',    min:'Un vaso de agua al despertar' },
  { id:'sueno',        l:'Sueño',        icono:'🌙', ej:'Acostarme a las 10:30 sin celular',        min:'Dejar el celular fuera de la cama' },
]
const DIAS = [['L', 'lun', 'MO'], ['M', 'mar', 'TU'], ['X', 'mié', 'WE'], ['J', 'jue', 'TH'], ['V', 'vie', 'FR'], ['S', 'sáb', 'SA'], ['D', 'dom', 'SU']]
const letraDe = iso => DIAS[(new Date(iso + 'T12:00:00').getDay() + 6) % 7][0]
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const toca = (h, iso) => String(h.dias || 'LMXJVSD').includes(letraDe(iso))
const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', marginTop:6, boxSizing:'border-box' }

// Racha: días seguidos (solo los días que toca) en que se cumplió
export function rachaDe(h, hecho, hoy = hoyISO()) {
  let n = 0, f = hecho(hoy, h.id) || !toca(h, hoy) ? hoy : masDias(hoy, -1)
  for (let i = 0; i < 400; i++) {
    if (toca(h, f)) { if (hecho(f, h.id)) n++; else if (f !== hoy) break }
    f = masDias(f, -1)
  }
  return n
}

// ─── Calendario (.ics): hábitos con hora y pagos fijos ─────────────────────────
export function archivoCalendario(habitos, fijos = []) {
  const hoy = hoyISO().replace(/-/g, ''), ahora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const esc = s => String(s || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n')
  const ev = []
  habitos.filter(h => h.activo && h.hora).forEach(h => {
    const hh = String(h.hora).slice(0, 5).replace(':', '')
    const byday = DIAS.filter(d => String(h.dias || 'LMXJVSD').includes(d[0])).map(d => d[2]).join(',')
    ev.push(['BEGIN:VEVENT', `UID:habito-${h.id}@lrmcore`, `DTSTAMP:${ahora}`, `DTSTART:${hoy}T${hh}00`, 'DURATION:PT15M',
      `RRULE:FREQ=WEEKLY;BYDAY=${byday}`, `SUMMARY:${esc((AREAS_HABITO.find(a => a.id === h.area)?.icono || '') + ' ' + h.nombre)}`,
      `DESCRIPTION:${esc('Mínimo: ' + (h.minimo || h.nombre) + ' · MySpace')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(h.nombre)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n'))
  })
  fijos.filter(f => f.activo).forEach(f => {
    ev.push(['BEGIN:VEVENT', `UID:fijo-${f.id}@lrmcore`, `DTSTAMP:${ahora}`, `DTSTART:${hoy.slice(0, 6)}${String(Math.min(28, f.dia)).padStart(2, '0')}T080000`, 'DURATION:PT15M',
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${Math.min(28, f.dia)}`, `SUMMARY:${esc('💳 Pagar ' + f.nombre + ' $' + Math.round(f.monto).toLocaleString('es-CO'))}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Pagar ' + f.nombre)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n'))
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LRM Core//MySpace//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:MySpace', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n'
}
async function descargarCalendario(habitos) {
  const f = await supabase.from('my_space_fijos').select('*')
  const blob = new Blob([archivoCalendario(habitos, f.data || [])], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = 'MySpace.ics'; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// ─── Hábitos ──────────────────────────────────────────────────────────────────
export default function Habitos() {
  const hoy = hoyISO()
  const [habitos, setHabitos] = useState(null)
  const [reg, setReg] = useState([])
  const [editar, setEditar] = useState(null)
  const [ayuda, setAyuda] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const [h, r] = await Promise.all([
      supabase.from('my_space_habitos').select('*').eq('activo', true).order('orden').order('created_at'),
      supabase.from('my_space_habitos_registro').select('fecha,habito_id').gte('fecha', masDias(hoy, -120)),
    ])
    if (h.error) return setHabitos(false)
    setHabitos(h.data || []); setReg(r.data || [])
  }
  useEffect(() => { cargar() }, [])
  const set = useMemo(() => new Set(reg.map(x => x.fecha + '|' + x.habito_id)), [reg])
  const hecho = (f, id) => set.has(f + '|' + id)
  const marcar = async h => {
    const ya = hecho(hoy, h.id)
    setReg(p => ya ? p.filter(x => !(x.fecha === hoy && x.habito_id === h.id)) : [...p, { fecha: hoy, habito_id: h.id }])
    const r = ya ? await supabase.from('my_space_habitos_registro').delete().eq('fecha', hoy).eq('habito_id', h.id)
                 : await supabase.from('my_space_habitos_registro').insert({ fecha: hoy, habito_id: h.id })
    if (r.error) { setError('No se guardó'); cargar() }
  }

  if (habitos === null) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (habitos === false) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>26_myspace_plata_habitos.sql</b> en Supabase para usar tus hábitos.</div>

  const hoyToca = habitos.filter(h => toca(h, hoy)), listos = hoyToca.filter(h => hecho(hoy, h.id)).length
  const semana = Array.from({ length: 7 }, (_, i) => masDias(hoy, i - 6))
  const creado = h => { const d = new Date(h.created_at || Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const posibles = semana.reduce((t, f) => t + habitos.filter(h => toca(h, f) && (creado(h) <= f || hecho(f, h.id))).length, 0)
  const cumplidos = semana.reduce((t, f) => t + habitos.filter(h => toca(h, f) && hecho(f, h.id)).length, 0)
  const pctSemana = posibles ? Math.round((cumplidos / posibles) * 100) : 0
  const sinHabito = AREAS_HABITO.filter(a => !habitos.some(h => h.area === a.id))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Hábitos</div>
          <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2, maxWidth:520 }}>Un hábito por área, con su versión mínima: lo que haces aunque el día salga mal. Un 1% cada día.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {habitos.some(h => h.hora) && <button id="ha-calendario" type="button" className="btn" onClick={() => { descargarCalendario(habitos); setAyuda(true) }} style={{ width:'auto' }}>📅 Al calendario</button>}
          <button id="ha-nuevo" type="button" className="btn-gold" onClick={() => setEditar({ area: sinHabito[0]?.id || 'mental' })} style={{ width:'auto' }}>+ Hábito</button>
        </div>
      </div>

      {ayuda && (
        <div className="panel" style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
          <b style={{ color:'var(--text)' }}>Se descargó MySpace.ics.</b> En el iPhone: ábrelo y toca <b>Agregar todo</b>; quedan en tu Calendario con alarma a la hora de cada hábito y el día de cada pago fijo. En Google Calendar (computador): Configuración → Importar. Si cambias horas, borra los eventos viejos antes de importar de nuevo.
          <div><button type="button" className="btn" onClick={() => setAyuda(false)} style={{ width:'auto', marginTop:8 }}>Entendido</button></div>
        </div>
      )}

      {habitos.length === 0 ? (
        <div className="panel">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Arma tus 8 hábitos</div>
          <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:12 }}>Toca un área, ajusta el ejemplo a tu vida y ponle hora si quieres que te avise el calendario.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:8 }}>
            {AREAS_HABITO.map(a => (
              <button key={a.id} id={`ha-area-${a.id}`} type="button" onClick={() => setEditar({ area: a.id, nombre: a.ej, minimo: a.min })}
                style={{ padding:'12px', borderRadius:14, textAlign:'left', fontFamily:'inherit', cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', color:'var(--text)' }}>
                <div style={{ fontSize:20 }}>{a.icono}</div><div style={{ fontSize:13, fontWeight:800, marginTop:4 }}>{a.l}</div><div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>{a.ej}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="ms-kpis" style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:10 }}>
            {[['Hoy', `${listos} de ${hoyToca.length}`, listos === hoyToca.length && hoyToca.length ? 'var(--green)' : 'var(--text)'], ['Esta semana', `${pctSemana}%`, pctSemana >= 80 ? 'var(--green)' : pctSemana >= 50 ? 'var(--gold)' : 'var(--red)'], ['Áreas con hábito', `${8 - sinHabito.length} de 8`, 'var(--text)']].map(([l, v, c]) => (
              <div key={l} className="panel" style={{ padding:'12px 14px', minWidth:0 }}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div><div id={`ha-kpi-${l.split(' ')[0].toLowerCase()}`} style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div></div>
            ))}
          </div>
          <div className="panel">
            {habitos.map(h => {
              const a = AREAS_HABITO.find(x => x.id === h.area) || {}, hoyT = toca(h, hoy), ok = hecho(hoy, h.id), n = rachaDe(h, hecho, hoy)
              const prevToca = (() => { let f = masDias(hoy, -1); for (let i = 0; i < 7 && !toca(h, f); i++) f = masDias(f, -1); return f })()
              const alerta = hoyT && !ok && !hecho(prevToca, h.id) && reg.some(x => x.habito_id === h.id)
              return (
                <div key={h.id} className="ha-fila" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderTop:'1px solid var(--border)' }}>
                  <button type="button" id={`ha-check-${h.area}`} disabled={!hoyT} onClick={() => marcar(h)}
                    style={{ width:30, height:30, flexShrink:0, borderRadius:10, display:'grid', placeItems:'center', fontSize:16, fontWeight:900, cursor: hoyT ? 'pointer' : 'default',
                      background: ok ? 'var(--green)' : 'transparent', border: ok ? 'none' : `2px solid ${hoyT ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, color:'#0b0b0b' }}>{ok ? '✓' : ''}</button>
                  <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => setEditar(h)}>
                    <div style={{ fontSize:14.5, fontWeight:700, color:'var(--text)' }}>{a.icono} {h.nombre}</div>
                    <div style={{ fontSize:12, color: alerta ? 'var(--red)' : 'var(--text3)', marginTop:1 }}>
                      {alerta ? 'La vez pasada no salió: hoy no se puede fallar' : !hoyT ? 'Hoy no toca' : `Mínimo: ${h.minimo || h.nombre}`}
                      {h.hora ? ` · ⏰ ${String(h.hora).slice(0, 5)}` : ''}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ display:'flex', gap:3, justifyContent:'flex-end', marginBottom:4 }}>
                      {semana.map(f => <span key={f} title={f} style={{ width:7, height:7, borderRadius:2, background: !toca(h, f) ? 'transparent' : hecho(f, h.id) ? (f === hoy ? 'var(--green)' : AZUL) : 'rgba(255,255,255,0.10)', border: !toca(h, f) ? '1px solid rgba(255,255,255,0.08)' : 'none' }} />)}
                    </div>
                    <div style={{ fontSize:11.5, fontWeight:700, color: n ? 'var(--gold)' : 'var(--text4)' }}>{n ? `🔥 ${n}` : 'sin racha'}</div>
                  </div>
                </div>
              )
            })}
            {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:6 }}>{error}</div>}
          </div>
          {sinHabito.length > 0 && <div style={{ fontSize:12.5, color:'var(--text3)' }}>Áreas sin hábito: {sinHabito.map(a => <button key={a.id} type="button" onClick={() => setEditar({ area: a.id, nombre: a.ej, minimo: a.min })} style={{ background:'none', border:'none', color:AZUL, cursor:'pointer', fontFamily:'inherit', fontSize:12.5, padding:'0 4px' }}>{a.icono} {a.l}</button>)}</div>}
        </>
      )}
      {editar && <ModalHabito h0={editar} onCerrar={() => setEditar(null)} onListo={() => { setEditar(null); cargar() }} />}
    </div>
  )
}

function ModalHabito({ h0, onCerrar, onListo }) {
  const nuevo = !h0.id
  const [f, setF] = useState({ area: h0.area || 'mental', nombre: h0.nombre || '', minimo: h0.minimo || '', hora: h0.hora ? String(h0.hora).slice(0, 5) : '', dias: h0.dias || 'LMXJVSD' })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const dia = d => setF(p => ({ ...p, dias: p.dias.includes(d) ? p.dias.replace(d, '') : DIAS.map(x => x[0]).filter(x => p.dias.includes(x) || x === d).join('') }))
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Escribe el hábito')
    if (!f.dias) return setError('Elige al menos un día')
    const fila = { area: f.area, nombre: f.nombre.trim(), minimo: f.minimo.trim() || null, hora: f.hora || null, dias: f.dias }
    const r = nuevo ? await supabase.from('my_space_habitos').insert(fila) : await supabase.from('my_space_habitos').update(fila).eq('id', h0.id)
    if (r.error) return setError(r.error.message)
    onListo()
  }
  const quitar = async () => { await supabase.from('my_space_habitos').update({ activo: false }).eq('id', h0.id); onListo() }
  return (
    <div onClick={onCerrar} style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} className="panel" style={{ width:'100%', maxWidth:440, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{nuevo ? 'Nuevo hábito' : 'Editar hábito'}</div>
        <div style={{ marginBottom:12 }}><div style={{ fontSize:11.5, color:'var(--text3)' }}>Área</div>
          <select id="mh-area" value={f.area} onChange={set('area')} style={iStyle}>{AREAS_HABITO.map(a => <option key={a.id} value={a.id}>{a.icono} {a.l}</option>)}</select></div>
        <div style={{ marginBottom:12 }}><div style={{ fontSize:11.5, color:'var(--text3)' }}>El hábito</div><input id="mh-nombre" value={f.nombre} onChange={set('nombre')} style={iStyle} /></div>
        <div style={{ marginBottom:12 }}><div style={{ fontSize:11.5, color:'var(--text3)' }}>Versión mínima (2 minutos, para los días malos)</div><input id="mh-minimo" value={f.minimo} onChange={set('minimo')} style={iStyle} /></div>
        <div style={{ marginBottom:12 }}><div style={{ fontSize:11.5, color:'var(--text3)' }}>Días</div>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>{DIAS.map(([d, l]) => (
            <button key={d} type="button" id={`mh-dia-${d}`} onClick={() => dia(d)} style={{ flex:1, padding:'8px 0', borderRadius:10, fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer',
              background: f.dias.includes(d) ? `${AZUL}26` : 'transparent', color: f.dias.includes(d) ? AZUL : 'var(--text3)', border:`1px solid ${f.dias.includes(d) ? AZUL + '66' : 'var(--border)'}` }}>{l}</button>
          ))}</div></div>
        <div style={{ marginBottom:16 }}><div style={{ fontSize:11.5, color:'var(--text3)' }}>Hora del recordatorio (opcional)</div><input id="mh-hora" type="time" value={f.hora} onChange={set('hora')} style={iStyle} /></div>
        {error && <div style={{ fontSize:12.5, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button id="mh-guardar" type="button" className="btn-gold" onClick={guardar}>Guardar</button>
          {!nuevo && <button type="button" className="btn" onClick={quitar} style={{ color:'var(--red)', width:'auto' }}>Quitar</button>}
          <button type="button" className="btn" onClick={onCerrar} style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}