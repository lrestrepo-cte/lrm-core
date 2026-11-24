// MySpace · Mi día: tu rutina de despertar a dormir, con horas que pone la app y la hora real de lo que cumples
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DIAS, DIA_BASE, TIPOS_COMPROMISO, BLOQUE_DE_AREA, armarDia, ahoraEn, calendarioSemana, hoyISO, masDias, letraDe, hora12, ahoraMin } from './Rutina'

const AZUL = '#7B93FF'
const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', marginTop:6, boxSizing:'border-box' }

// ─── Ajustes guardados (mi día, coach) ────────────────────────────────────────
export function useAjuste(clave) {
  const [valor, setValor] = useState(undefined)   // undefined cargando · null sin guardar · {} guardado
  const [falta, setFalta] = useState(false)
  const cargar = async () => {
    const r = await supabase.from('my_space_ajustes').select('valor').eq('clave', clave).maybeSingle()
    if (r.error) { setFalta(true); setValor(null); return }
    setValor(r.data?.valor || null)
  }
  useEffect(() => { cargar() }, [clave])
  const guardar = async v => {
    const r = await supabase.from('my_space_ajustes').upsert({ clave, valor: v, updated_at: new Date().toISOString() })
    if (!r.error) setValor(v)
    return r
  }
  return { valor, guardar, falta, recargar: cargar }
}

// Reloj que se mueve solo
export function useReloj(cadaMs = 30000) {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), cadaMs); return () => clearInterval(i) }, [cadaMs])
  return t
}

// ─── Cuestionario de tu día ───────────────────────────────────────────────────
function DiasPicker({ value, onChange, id }) {
  return (
    <div style={{ display:'flex', gap:5, marginTop:6 }}>
      {DIAS.map(([d, l]) => {
        const on = String(value || '').includes(d)
        return <button key={d} type="button" id={id ? `${id}-${d}` : undefined} onClick={() => onChange(on ? value.replace(d, '') : DIAS.map(x => x[0]).filter(x => String(value || '').includes(x) || x === d).join(''))}
          style={{ flex:1, padding:'8px 0', borderRadius:10, fontFamily:'inherit', fontSize:12, fontWeight:800, cursor:'pointer', background: on ? `${AZUL}26` : 'transparent', color: on ? AZUL : 'var(--text3)', border:`1px solid ${on ? AZUL + '66' : 'var(--border)'}` }}>{l.slice(0, 2)}</button>
      })}
    </div>
  )
}

export function CuestionarioDia({ inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState(() => JSON.parse(JSON.stringify(inicial || DIA_BASE)))
  const [error, setError] = useState('')
  const setHora = (k, t) => e => setF(p => ({ ...p, [k]: { ...p[k], [t]: e.target.value } }))
  const setC = (i, k, v) => setF(p => ({ ...p, compromisos: p.compromisos.map((c, j) => j === i ? { ...c, [k]: v } : c) }))
  const agregar = tipo => setF(p => ({ ...p, compromisos: [...p.compromisos, { tipo, nombre: tipo === 'lucia' ? 'Llevar a Lucía al colegio' : TIPOS_COMPROMISO[tipo].l, dias: tipo === 'iglesia' ? 'J' : tipo === 'futbol' ? 'MX' : 'LMXJV', inicio: tipo === 'lucia' ? '06:30' : tipo === 'trabajo' ? '08:00' : '19:00', fin: tipo === 'lucia' ? '07:15' : tipo === 'trabajo' ? '17:00' : '21:00' }] }))
  const guardar = () => {
    if (f.compromisos.some(c => !c.dias)) return setError('Cada compromiso necesita al menos un día')
    onGuardar(f)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="panel">
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>Cómo es tu semana</div>
        <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2, marginBottom:14 }}>Con esto la app arma tu día con horas. Tú no pones horas en los hábitos: las toman de aquí.</div>
        <div className="md-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:10 }}>
          <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Me levanto (lun–vie)</div><input id="md-desp-s" type="time" value={f.despertar.semana} onChange={setHora('despertar', 'semana')} style={iStyle} /></div>
          <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Me acuesto (lun–vie)</div><input id="md-dorm-s" type="time" value={f.dormir.semana} onChange={setHora('dormir', 'semana')} style={iStyle} /></div>
          <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Me levanto (sáb–dom)</div><input type="time" value={f.despertar.finde} onChange={setHora('despertar', 'finde')} style={iStyle} /></div>
          <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Me acuesto (sáb–dom)</div><input type="time" value={f.dormir.finde} onChange={setHora('dormir', 'finde')} style={iStyle} /></div>
        </div>
      </div>

      <div className="panel">
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>Tus compromisos fijos</div>
        <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2, marginBottom:12 }}>Lo de Lucía va primero: lo demás se acomoda alrededor. El fútbol lo pone el Coach.</div>
        {f.compromisos.map((c, i) => (
          <div key={i} style={{ padding:'12px 0', borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:20 }}>{TIPOS_COMPROMISO[c.tipo]?.icono}</span>
              <input value={c.nombre} onChange={e => setC(i, 'nombre', e.target.value)} style={{ ...iStyle, marginTop:0, flex:1 }} />
              <button type="button" onClick={() => setF(p => ({ ...p, compromisos: p.compromisos.filter((_, j) => j !== i) }))} className="btn" style={{ width:'auto', color:'var(--red)' }}>✕</button>
            </div>
            <DiasPicker value={c.dias} onChange={v => setC(i, 'dias', v)} id={`md-c${i}`} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><div style={{ fontSize:11.5, color:'var(--text3)', marginTop:8 }}>Desde</div><input type="time" value={c.inicio} onChange={e => setC(i, 'inicio', e.target.value)} style={iStyle} /></div>
              <div><div style={{ fontSize:11.5, color:'var(--text3)', marginTop:8 }}>Hasta</div><input type="time" value={c.fin} onChange={e => setC(i, 'fin', e.target.value)} style={iStyle} /></div>
            </div>
          </div>
        ))}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          {['lucia', 'trabajo', 'estudio', 'iglesia', 'sara', 'familia', 'otro'].map(t => (
            <button key={t} id={`md-add-${t}`} type="button" className="btn" onClick={() => agregar(t)} style={{ width:'auto', fontSize:12.5 }}>+ {TIPOS_COMPROMISO[t].icono} {TIPOS_COMPROMISO[t].l}</button>
          ))}
        </div>
      </div>
      {error && <div style={{ fontSize:12.5, color:'var(--red)' }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="md-guardar" type="button" className="btn-gold" onClick={guardar}>Armar mi día</button>
        {onCancelar && <button type="button" className="btn" onClick={onCancelar} style={{ width:'auto' }}>Cancelar</button>}
      </div>
    </div>
  )
}

// ─── Mi día ───────────────────────────────────────────────────────────────────
export default function MiDia() {
  const dia = useAjuste('mi_dia'), coach = useAjuste('coach')
  const reloj = useReloj(30000)
  const hoy = hoyISO()
  const [fecha, setFecha] = useState(hoy)
  const [hechos, setHechos] = useState([])
  const [editar, setEditar] = useState(false)
  const [ayuda, setAyuda] = useState(false)
  const [habitos, setHabitos] = useState([])

  const cargar = async () => {
    supabase.from('my_space_habitos').select('id,area').eq('activo', true).then(r => setHabitos(r.data || []))
    const r = await supabase.from('my_space_dia_registro').select('fecha,bloque,hecho_at').gte('fecha', masDias(hoy, -14))
    setHechos(r.data || [])
  }
  useEffect(() => { cargar() }, [])
  const cfg = dia.valor || null, plan = coach.valor?.plan || null
  const bloques = useMemo(() => cfg ? armarDia(fecha, cfg, plan) : [], [fecha, cfg, plan])
  const hechoDe = (f, id) => hechos.find(h => h.fecha === f && h.bloque === id)
  const marcar = async b => {
    const ya = hechoDe(fecha, b.id)
    if (ya) { setHechos(p => p.filter(h => !(h.fecha === fecha && h.bloque === b.id))); await supabase.from('my_space_dia_registro').delete().eq('fecha', fecha).eq('bloque', b.id) }
    else {
      const fila = { fecha, bloque: b.id, hecho_at: new Date().toISOString() }; setHechos(p => [...p, fila]); await supabase.from('my_space_dia_registro').insert(fila)
      // Cumplir el bloque también cumple el hábito de esa área (devocional → espiritual, lectura → mental, fútbol o gym → física…)
      const suyos = habitos.filter(h => BLOQUE_DE_AREA[h.area] === b.id || (h.area === 'fisica' && b.tipo === 'futbol'))
      for (const h of suyos) await supabase.from('my_space_habitos_registro').upsert({ fecha, habito_id: h.id })
    }
  }
  const descargar = async () => {
    const f = await supabase.from('my_space_fijos').select('*')
    const blob = new Blob([calendarioSemana(cfg, plan, f.data || [])], { type:'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = 'MySpace.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000)
    setAyuda(true)
  }

  if (dia.valor === undefined) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (dia.falta) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>27_myspace_dia_coach.sql</b> en Supabase para usar Mi día.</div>
  if (!cfg || editar) return <CuestionarioDia inicial={cfg} onCancelar={cfg ? () => setEditar(false) : null} onGuardar={async v => { await dia.guardar(v); setEditar(false) }} />

  const esHoy = fecha === hoy, min = ahoraMin()
  const { actual, siguiente } = esHoy ? ahoraEn(bloques, min) : {}
  const marcables = bloques.filter(b => b.id !== 'dormir')
  const cumplidos = marcables.filter(b => hechoDe(fecha, b.id)).length
  const pct = marcables.length ? Math.round(cumplidos / marcables.length * 100) : 0
  const semana = Array.from({ length: 7 }, (_, i) => masDias(hoy, i - 6))
  const pctDe = f => { const bs = armarDia(f, cfg, plan).filter(b => b.id !== 'dormir'); return bs.length ? Math.round(bs.filter(b => hechoDe(f, b.id)).length / bs.length * 100) : 0 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:10, flexWrap:'wrap' }}>
        <div>
          <div id="md-reloj" style={{ fontSize:34, fontWeight:900, color:'var(--text)', lineHeight:1 }}>{reloj.toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}</div>
          <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:4 }}>{new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button id="md-calendario" type="button" className="btn" onClick={descargar} style={{ width:'auto' }}>📅 Al calendario</button>
          <button id="md-editar" type="button" className="btn" onClick={() => setEditar(true)} style={{ width:'auto' }}>Cambiar mi semana</button>
        </div>
      </div>

      {ayuda && (
        <div className="panel" style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
          <b style={{ color:'var(--text)' }}>Se descargó MySpace.ics</b> con tu semana: devocional, entreno, Lucía, fútbol, lectura, cierre del día, pantallas fuera y dormir, más tus pagos fijos. En el iPhone ábrelo y toca <b>Agregar todo</b>: cada uno suena a su hora. En Google Calendar: Configuración → Importar. Si cambias tu semana, borra los eventos viejos e impórtalo de nuevo.
          <div><button type="button" className="btn" onClick={() => setAyuda(false)} style={{ width:'auto', marginTop:8 }}>Entendido</button></div>
        </div>
      )}

      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
        {Array.from({ length: 7 }, (_, i) => masDias(hoy, i)).map(f => (
          <button key={f} type="button" id={`md-f-${letraDe(f)}`} onClick={() => setFecha(f)} style={{ flexShrink:0, minWidth:54, padding:'8px 6px', borderRadius:12, fontFamily:'inherit', cursor:'pointer', textAlign:'center',
            background: fecha === f ? `${AZUL}26` : 'rgba(255,255,255,0.03)', border:`1px solid ${fecha === f ? AZUL + '66' : 'var(--border)'}`, color: fecha === f ? AZUL : 'var(--text2)' }}>
            <div style={{ fontSize:11, fontWeight:700 }}>{f === hoy ? 'Hoy' : DIAS.find(d => d[0] === letraDe(f))[1].slice(0, 3)}</div>
            <div style={{ fontSize:16, fontWeight:900 }}>{Number(f.slice(8))}</div>
          </button>
        ))}
      </div>

      {esHoy && (actual || siguiente) && (
        <div className="panel" style={{ borderLeft:`4px solid ${AZUL}` }}>
          {actual && <div><div style={{ fontSize:11.5, fontWeight:800, letterSpacing:1.2, color:AZUL }}>AHORA</div><div id="md-ahora" style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginTop:2 }}>{actual.icono} {actual.nombre}</div><div style={{ fontSize:12.5, color:'var(--text3)' }}>hasta las {hora12(actual.final)}</div></div>}
          {siguiente && <div style={{ marginTop: actual ? 10 : 0, fontSize:13, color:'var(--text2)' }}>Sigue: <b style={{ color:'var(--text)' }}>{siguiente.icono} {siguiente.nombre}</b> a las {hora12(siguiente.inicio)}</div>}
        </div>
      )}

      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase' }}>{esHoy ? 'Tu día' : 'Así va ese día'}</div>
          <div id="md-pct" style={{ fontSize:13, fontWeight:800, color: pct >= 80 ? 'var(--green)' : 'var(--text2)' }}>{cumplidos} de {marcables.length} · {pct}%</div>
        </div>
        {bloques.map(b => {
          const h = hechoDe(fecha, b.id), enCurso = esHoy && actual?.id === b.id, paso = esHoy && b.fin <= min && !h
          return (
            <div key={b.id} id={`md-b-${b.id}`} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 8px', margin:'0 -8px', borderRadius:12, background: enCurso ? `${AZUL}14` : 'transparent' }}>
              <div style={{ width:62, flexShrink:0, textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:800, color: enCurso ? AZUL : 'var(--text)' }}>{hora12(b.inicio).replace(' a. m.', '').replace(' p. m.', '')}</div>
                <div style={{ fontSize:10.5, color:'var(--text4)' }}>{hora12(b.inicio).slice(-5)}</div>
              </div>
              <div style={{ width:3, alignSelf:'stretch', borderRadius:2, background: h ? 'var(--green)' : b.fijo ? 'var(--gold)' : 'rgba(255,255,255,0.12)' }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', opacity: h ? 0.65 : 1 }}>{b.icono} {b.nombre}</div>
                <div style={{ fontSize:11.5, color: paso ? 'var(--red)' : 'var(--text3)' }}>
                  {b.fin > b.ini ? `${b.fin - b.ini} min` : ''}{b.fijo && b.tipo ? ' · fijo' : ''}
                  {h ? ` · ✓ a las ${new Date(h.hecho_at).toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}` : paso ? ' · ya pasó' : ''}
                </div>
              </div>
              {b.id !== 'dormir' && fecha <= hoy && (
                <button type="button" id={`md-check-${b.id}`} onClick={() => marcar(b)} style={{ width:30, height:30, flexShrink:0, borderRadius:10, display:'grid', placeItems:'center', fontSize:15, fontWeight:900, cursor:'pointer',
                  background: h ? 'var(--green)' : 'transparent', border: h ? 'none' : '2px solid rgba(255,255,255,0.18)', color:'#0b0b0b' }}>{h ? '✓' : ''}</button>
              )}
            </div>
          )
        })}
      </div>

      <div className="panel">
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>Ganando posición · 7 días</div>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:90 }}>
          {semana.map(f => { const p = pctDe(f); return (
            <div key={f} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:10.5, color:'var(--text3)', marginBottom:3 }}>{p}%</div>
              <div style={{ height:Math.max(4, p * 0.6), borderRadius:4, background: f === hoy ? AZUL : p >= 80 ? 'var(--green)' : 'rgba(255,255,255,0.18)' }} />
              <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:4 }}>{DIAS.find(d => d[0] === letraDe(f))[1].slice(0, 2)}</div>
            </div>
          ) })}
        </div>
      </div>
    </div>
  )
}