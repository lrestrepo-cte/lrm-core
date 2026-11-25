// MySpace · Diario: preguntas fijas cada día y el recuerdo de lo que escribiste ayer
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO, masDias } from './Rutina'

export const ANIMOS = [[1, '😞', 'Muy mal'], [2, '😕', 'Regular'], [3, '😐', 'Normal'], [4, '🙂', 'Bien'], [5, '😄', 'Muy bien']]
const COLOR = '#E1306C'
const PREGUNTAS = [
  ['mejor',     '¿Qué fue lo que más te gustó hoy?',       'Una conversación, un logro, un momento con Lucía…'],
  ['peor',      '¿Qué fue lo que menos te gustó?',         'Sin juzgarte: solo nómbralo'],
  ['problema',  '¿Cuál fue tu problema más grande?',       ''],
  ['reflexion', '¿Qué reflexión te deja el día?',          'Lo que aprendiste, lo que harías distinto'],
  ['gratitud',  '¿Por qué das gracias hoy?',               'Tres cosas, aunque sean pequeñas'],
  ['manana',    '¿Qué tienes para mañana?',                'Lo más importante primero. Mañana te lo recuerdo'],
]
const area = { width:'100%', minHeight:64, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.5 }
const fechaLarga = f => new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })

export async function cargarAyer() {
  const r = await supabase.from('my_space_diario').select('*').eq('fecha', masDias(hoyISO(), -1)).maybeSingle()
  return r.data || null
}

export default function Diario() {
  const hoy = hoyISO()
  const [fecha, setFecha] = useState(hoy)
  const [e, setE] = useState(null)
  const [lista, setLista] = useState([])
  const [estado, setEstado] = useState('')
  const [falta, setFalta] = useState(false)
  const temporizador = useRef(null)

  const cargarLista = async () => {
    const r = await supabase.from('my_space_diario').select('*').gte('fecha', masDias(hoy, -60)).order('fecha', { ascending: false })
    if (r.error) { setFalta(true); return }
    setLista(r.data || [])
  }
  useEffect(() => { cargarLista() }, [])
  useEffect(() => { setE(lista.find(x => x.fecha === fecha) || { fecha }) }, [fecha, lista])

  const guardar = async fila => {
    setEstado('Guardando…')
    const r = await supabase.from('my_space_diario').upsert({ ...fila, updated_at: new Date().toISOString() })
    setEstado(r.error ? 'No se guardó' : `Guardado ${new Date().toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}`)
    if (!r.error) setLista(p => [fila, ...p.filter(x => x.fecha !== fila.fecha)].sort((a, b) => b.fecha.localeCompare(a.fecha)))
  }
  const cambiar = (k, v) => {
    const n = { ...e, [k]: v }; setE(n); setEstado('…')
    clearTimeout(temporizador.current); temporizador.current = setTimeout(() => guardar(n), 900)
  }

  if (falta) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>28_myspace_diario_espiritual.sql</b> en Supabase para usar tu diario.</div>
  if (!e) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>

  const ayer = lista.find(x => x.fecha === masDias(fecha, -1))
  const semana = Array.from({ length: 14 }, (_, i) => masDias(hoy, i - 13))
  const racha = (() => { let n = 0, f = lista.some(x => x.fecha === hoy) ? hoy : masDias(hoy, -1); while (lista.some(x => x.fecha === f)) { n++; f = masDias(f, -1) } return n })()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="ms-hero" style={{ '--acento': COLOR }}>
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:COLOR, textTransform:'uppercase' }}>Diario · {fecha === hoy ? 'hoy' : fechaLarga(fecha)}</div>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginTop:2 }}>¿Cómo te fue?</div>
        <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>Privado. Se guarda solo mientras escribes. {racha ? `🔥 ${racha} día${racha === 1 ? '' : 's'} seguidos escribiendo.` : ''}</div>
      </div>

      {ayer && (ayer.manana || (ayer.problema && !ayer.resuelto)) && fecha === hoy && (
        <div id="di-ayer" className="panel" style={{ borderLeft:`4px solid ${COLOR}` }}>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.2, color:COLOR }}>LUIS, AYER ESCRIBISTE</div>
          {ayer.manana && <div style={{ fontSize:14, color:'var(--text)', marginTop:6 }}>Para hoy: <b>{ayer.manana}</b></div>}
          {ayer.problema && !ayer.resuelto && <div style={{ fontSize:13.5, color:'var(--text2)', marginTop:6 }}>Tu problema más grande era: <i>{ayer.problema}</i>. ¿Ya lo resolviste?</div>}
        </div>
      )}

      <div className="panel">
        <div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)', marginBottom:10 }}>¿Cómo te sientes?</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
          {ANIMOS.map(([n, emo, l]) => (
            <button key={n} type="button" id={`di-animo-${n}`} onClick={() => cambiar('animo', n)} style={{ padding:'10px 0', borderRadius:14, cursor:'pointer', fontFamily:'inherit',
              background: e.animo === n ? `${COLOR}22` : 'rgba(255,255,255,0.03)', border:`1px solid ${e.animo === n ? COLOR + '88' : 'var(--border)'}`, transform: e.animo === n ? 'scale(1.04)' : 'none', transition:'all .15s' }}>
              <div style={{ fontSize:26 }}>{emo}</div><div style={{ fontSize:10.5, color:'var(--text3)', marginTop:2 }}>{l}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {PREGUNTAS.map(([k, q, ph]) => (
          <div key={k} style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{q}</div>
            <textarea id={`di-${k}`} value={e[k] || ''} onChange={ev => cambiar(k, ev.target.value)} placeholder={ph} style={area} />
            {k === 'problema' && e.problema && (
              <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center', fontSize:13, color:'var(--text2)' }}>
                ¿Lo resolviste?
                {[[true, 'Sí'], [false, 'Todavía no']].map(([v, l]) => (
                  <button key={l} type="button" id={`di-resuelto-${v}`} onClick={() => cambiar('resuelto', v)} className="btn" style={{ width:'auto', padding:'5px 12px', background: e.resuelto === v ? (v ? 'rgba(76,175,80,0.2)' : 'rgba(224,82,82,0.15)') : undefined }}>{l}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div id="di-estado" style={{ fontSize:12, color:'var(--text3)', textAlign:'right' }}>{estado}</div>
      </div>

      <div className="panel">
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>Tu ánimo · 14 días</div>
        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:70 }}>
          {semana.map(f => { const x = lista.find(y => y.fecha === f); return (
            <button key={f} type="button" title={f} onClick={() => setFecha(f)} style={{ flex:1, border:'none', background:'transparent', padding:0, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ width:'100%', height: x?.animo ? x.animo * 11 : 4, borderRadius:4, background: x?.animo ? (x.animo >= 4 ? 'var(--green)' : x.animo === 3 ? 'var(--gold)' : 'var(--red)') : 'rgba(255,255,255,0.08)', outline: f === fecha ? `2px solid ${COLOR}` : 'none' }} />
              <span style={{ fontSize:9.5, color:'var(--text4)' }}>{Number(f.slice(8))}</span>
            </button>
          ) })}
        </div>
      </div>

      {lista.filter(x => x.fecha !== fecha).length > 0 && (
        <div className="panel">
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Días anteriores</div>
          {lista.filter(x => x.fecha !== fecha).slice(0, 10).map(x => (
            <button key={x.fecha} type="button" onClick={() => setFecha(x.fecha)} style={{ display:'flex', width:'100%', gap:10, alignItems:'center', padding:'10px 0', borderTop:'1px solid var(--border)', background:'transparent', borderLeft:'none', borderRight:'none', borderBottom:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <span style={{ fontSize:22 }}>{ANIMOS.find(a => a[0] === x.animo)?.[1] || '📓'}</span>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'block', fontSize:13, fontWeight:700, color:'var(--text)' }}>{fechaLarga(x.fecha)}</span>
                <span style={{ display:'block', fontSize:12, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.mejor || x.reflexion || x.gratitud || '—'}</span>
              </span>
            </button>
          ))}
          {fecha !== hoy && <button type="button" className="btn" onClick={() => setFecha(hoy)} style={{ width:'auto', marginTop:8 }}>Volver a hoy</button>}
        </div>
      )}
    </div>
  )
}
