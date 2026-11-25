// MySpace · Espiritual: planes de estudio bíblico por partes, con contexto, reflexión y lo que te llevas
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PLANES } from './Planes'
import { hoyISO } from './Rutina'

const COLOR = '#9C7BFF'
const area = { width:'100%', minHeight:80, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.5 }

export function useBiblia() {
  const [hechos, setHechos] = useState(null)
  const cargar = async () => { const r = await supabase.from('my_space_biblia').select('*'); setHechos(r.error ? false : (r.data || [])) }
  useEffect(() => { cargar() }, [])
  return { hechos, recargar: cargar }
}
// El siguiente día que toca de un plan
export const siguienteDia = (plan, hechos = []) => { const n = plan.dias.findIndex((_, i) => !hechos.some(h => h.plan === plan.id && h.dia === i + 1)); return n === -1 ? null : n + 1 }

export default function Espiritual() {
  const { hechos, recargar } = useBiblia()
  const [abierto, setAbierto] = useState(null)   // { plan, dia }
  const [llevo, setLlevo] = useState('')
  const [aviso, setAviso] = useState('')

  if (hechos === null) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (hechos === false) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>28_myspace_diario_espiritual.sql</b> en Supabase para usar tus planes de estudio.</div>

  const abrir = (plan, dia) => { setAbierto({ plan, dia }); setLlevo(hechos.find(h => h.plan === plan.id && h.dia === dia)?.llevo || ''); setAviso(''); document.querySelector('.page-content')?.scrollTo?.({ top:0 }) }
  const terminar = async () => {
    const { plan, dia } = abierto, hoy = hoyISO()
    const r = await supabase.from('my_space_biblia').upsert({ plan: plan.id, dia, fecha: hoy, llevo: llevo || null, hecho_at: new Date().toISOString() })
    if (r.error) return setAviso('No se guardó: ' + r.error.message)
    // Cuenta como devocional en Mi día y en el hábito espiritual
    await supabase.from('my_space_dia_registro').upsert({ fecha: hoy, bloque: 'devocional', hecho_at: new Date().toISOString() })
    const h = await supabase.from('my_space_habitos').select('id').eq('area', 'espiritual').eq('activo', true).limit(1)
    if (h.data?.[0]) await supabase.from('my_space_habitos_registro').upsert({ fecha: hoy, habito_id: h.data[0].id })
    await recargar()
    const sig = dia < plan.dias.length ? dia + 1 : null
    setAviso(sig ? `✓ Día ${dia} terminado. Mañana: día ${sig}.` : `✓ Terminaste ${plan.titulo}. 🎉`)
  }

  if (abierto) {
    const { plan, dia } = abierto, d = plan.dias[dia - 1], ya = hechos.some(h => h.plan === plan.id && h.dia === dia)
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <button type="button" className="btn" onClick={() => setAbierto(null)} style={{ width:'auto', alignSelf:'flex-start' }}>← Planes</button>
        <div className="ms-hero" style={{ '--acento': plan.color }}>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:plan.color, textTransform:'uppercase' }}>{plan.icono} {plan.titulo} · día {dia} de {plan.dias.length}</div>
          <div id="es-titulo" style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginTop:4, lineHeight:1.25 }}>{d.t}</div>
        </div>
        <div className="panel">
          <div style={{ fontSize:11.5, fontWeight:800, letterSpacing:1.2, color:'var(--text3)' }}>1 · LEE</div>
          <div id="es-lee" style={{ fontSize:18, fontWeight:800, color:plan.color, marginTop:4 }}>📖 {d.lee}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Léelo en tu Biblia o en tu app. Despacio, sin afán.</div>
        </div>
        <div className="panel">
          <div style={{ fontSize:11.5, fontWeight:800, letterSpacing:1.2, color:'var(--text3)' }}>2 · ENTIENDE</div>
          <div style={{ fontSize:14.5, color:'var(--text)', marginTop:6, lineHeight:1.65 }}>{d.ctx}</div>
        </div>
        <div className="panel" style={{ borderLeft:`4px solid ${plan.color}` }}>
          <div style={{ fontSize:11.5, fontWeight:800, letterSpacing:1.2, color:'var(--text3)' }}>3 · REFLEXIONA</div>
          <div style={{ fontSize:15.5, fontWeight:700, color:'var(--text)', marginTop:6, lineHeight:1.5 }}>{d.p}</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:12, marginBottom:6 }}>Lo que me llevo de hoy</div>
          <textarea id="es-llevo" value={llevo} onChange={e => setLlevo(e.target.value)} placeholder="Escribe con tus palabras lo que Dios te habló" style={area} />
        </div>
        <div className="panel">
          <div style={{ fontSize:11.5, fontWeight:800, letterSpacing:1.2, color:'var(--text3)' }}>4 · ORA</div>
          <div style={{ fontSize:15, fontStyle:'italic', color:'var(--text)', marginTop:6 }}>"{d.o}"</div>
        </div>
        <button id="es-terminar" type="button" className="btn-gold" onClick={terminar}>{ya ? 'Guardar de nuevo' : 'Terminé el día'}</button>
        {aviso && <div id="es-aviso" style={{ fontSize:13, color: aviso.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{aviso}</div>}
        {aviso.startsWith('✓') && dia < plan.dias.length && <button type="button" className="btn" onClick={() => abrir(plan, dia + 1)} style={{ width:'auto' }}>Ver el día {dia + 1} →</button>}
      </div>
    )
  }

  const recientes = [...hechos].filter(h => h.llevo).sort((a, b) => String(b.hecho_at).localeCompare(a.hecho_at)).slice(0, 5)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="ms-hero" style={{ '--acento': COLOR }}>
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:COLOR, textTransform:'uppercase' }}>Espiritual</div>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginTop:2 }}>Ir más allá de un versículo</div>
        <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>Cada día: lee, entiende, reflexiona y ora. Al terminar cuenta como tu devocional.</div>
      </div>
      <div className="es-planes" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
        {PLANES.map(plan => {
          const hechosPlan = hechos.filter(h => h.plan === plan.id).length, sig = siguienteDia(plan, hechos), pct = Math.round(hechosPlan / plan.dias.length * 100)
          return (
            <button key={plan.id} id={`es-plan-${plan.id}`} type="button" onClick={() => abrir(plan, sig || 1)} className="panel ms-card-btn" style={{ textAlign:'left', cursor:'pointer', fontFamily:'inherit', borderTop:`3px solid ${plan.color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                <div style={{ fontSize:28 }}>{plan.icono}</div>
                <div style={{ fontSize:11.5, fontWeight:800, color: pct === 100 ? 'var(--green)' : plan.color }}>{pct === 100 ? '✓ Terminado' : `${hechosPlan}/${plan.dias.length} días`}</div>
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginTop:8 }}>{plan.titulo}</div>
              <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>{plan.sub}</div>
              <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', marginTop:12, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background:plan.color }} /></div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:8 }}>{sig ? `Sigue: día ${sig} · ${plan.dias[sig - 1].t}` : 'Vuelve a leerlo cuando quieras'}</div>
            </button>
          )
        })}
      </div>
      {recientes.length > 0 && (
        <div className="panel">
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Lo que te has llevado</div>
          {recientes.map(h => { const plan = PLANES.find(p => p.id === h.plan); return (
            <div key={h.plan + h.dia} style={{ padding:'10px 0', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:11.5, color:plan?.color || COLOR, fontWeight:700 }}>{plan?.titulo} · {plan?.dias[h.dia - 1]?.t}</div>
              <div style={{ fontSize:13.5, color:'var(--text)', marginTop:2 }}>{h.llevo}</div>
            </div>
          ) })}
        </div>
      )}
    </div>
  )
}
