// MySpace · Coach físico: preguntas, plan de la semana alrededor del fútbol y la sesión del día con reemplazos
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { EJERCICIOS, SESIONES, OBJETIVOS, LUGARES, opcionesDe, armarPlan } from './Ejercicios'
import { DIAS, DIA_BASE, hoyISO, letraDe, masDias } from './Rutina'
import { useAjuste } from './MiDia'

const AZUL = '#7B93FF'
const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', marginTop:6, boxSizing:'border-box' }
const Pregunta = ({ n, t, sub, children }) => (
  <div className="panel">
    <div style={{ fontSize:11.5, fontWeight:800, color:AZUL, letterSpacing:1 }}>PREGUNTA {n}</div>
    <div style={{ fontSize:15.5, fontWeight:800, color:'var(--text)', marginTop:2 }}>{t}</div>
    {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{sub}</div>}
    <div style={{ marginTop:10 }}>{children}</div>
  </div>
)
const Chips = ({ opciones, valor, onChange, multi, id }) => (
  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
    {opciones.map(([k, l]) => {
      const on = multi ? (valor || []).includes(k) : valor === k
      return <button key={k} type="button" id={id ? `${id}-${k}` : undefined} onClick={() => onChange(multi ? (on ? valor.filter(x => x !== k) : [...(valor || []), k]) : k)}
        style={{ padding:'8px 12px', borderRadius:999, fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', background: on ? `${AZUL}26` : 'rgba(255,255,255,0.03)', color: on ? AZUL : 'var(--text2)', border:`1px solid ${on ? AZUL + '66' : 'var(--border)'}` }}>{l}</button>
    })}
  </div>
)
const Dias = ({ valor, onChange, id, deshabilitar = '' }) => (
  <div style={{ display:'flex', gap:5 }}>
    {DIAS.map(([d, l]) => {
      const on = String(valor || '').includes(d), off = deshabilitar.includes(d)
      return <button key={d} type="button" id={id ? `${id}-${d}` : undefined} disabled={off} onClick={() => onChange(on ? valor.replace(d, '') : DIAS.map(x => x[0]).filter(x => String(valor || '').includes(x) || x === d).join(''))}
        style={{ flex:1, padding:'9px 0', borderRadius:10, fontFamily:'inherit', fontSize:12, fontWeight:800, cursor: off ? 'default' : 'pointer', opacity: off ? 0.3 : 1, background: on ? `${AZUL}26` : 'transparent', color: on ? AZUL : 'var(--text3)', border:`1px solid ${on ? AZUL + '66' : 'var(--border)'}` }}>{l.slice(0, 2)}</button>
    })}
  </div>
)

// ─── Preguntas ────────────────────────────────────────────────────────────────
function Cuestionario({ inicial, onListo, onCancelar }) {
  const [r, setR] = useState(inicial || { objetivo:'futbol', nivel:'intermedio', futbol:'', partidos:'', horaFutbol:'19:00', horaPartido:'08:00', gym:'', minutos:60, hora:'manana', lugar:'gym', molestias:[] })
  const set = k => v => setR(p => ({ ...p, [k]: v }))
  const [error, setError] = useState('')
  const listo = () => {
    if (!r.gym) return setError('Elige al menos un día para el gym (pregunta 4)')
    onListo(r)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Tu coach</div>
        <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>Unas preguntas y armo tu plan alrededor del fútbol. Lo puedes rehacer cuando cambie tu semana.</div>
      </div>
      <Pregunta n={1} t="¿Qué buscas?"><Chips id="co-obj" opciones={Object.entries(OBJETIVOS).map(([k, v]) => [k, v.l])} valor={r.objetivo} onChange={set('objetivo')} /></Pregunta>
      <Pregunta n={2} t="¿Cómo vas en el gym?"><Chips opciones={[['principiante', 'Empezando'], ['intermedio', 'Voy hace rato'], ['avanzado', 'Llevo años']]} valor={r.nivel} onChange={set('nivel')} /></Pregunta>
      <Pregunta n={3} t="¿Qué días juegas fútbol?" sub="Y marca cuáles son partido o torneo: esos días el cuerpo se exige más.">
        <Dias id="co-fut" valor={r.futbol} onChange={v => setR(p => ({ ...p, futbol: v, partidos: p.partidos.split('').filter(d => v.includes(d)).join(''), gym: p.gym.split('').filter(d => !v.includes(d) || p.gym.includes(d)).join('') }))} />
        {r.futbol && <>
          <div style={{ fontSize:12, color:'var(--text3)', margin:'10px 0 6px' }}>De esos, ¿cuáles son partido o torneo?</div>
          <Dias id="co-par" valor={r.partidos} onChange={set('partidos')} deshabilitar={DIAS.map(d => d[0]).filter(d => !r.futbol.includes(d)).join('')} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
            <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Hora de práctica</div><input type="time" value={r.horaFutbol} onChange={e => set('horaFutbol')(e.target.value)} style={iStyle} /></div>
            <div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Hora de partido / torneo</div><input type="time" value={r.horaPartido} onChange={e => set('horaPartido')(e.target.value)} style={iStyle} /></div>
          </div>
        </>}
      </Pregunta>
      <Pregunta n={4} t="¿Qué días puedes ir al gym?" sub="Mejor los días sin fútbol. Si solo puedes un día de fútbol, lo acomodo con tren superior."><Dias id="co-gym" valor={r.gym} onChange={set('gym')} /></Pregunta>
      <Pregunta n={5} t="¿Cuánto tiempo por sesión y a qué hora?">
        <Chips opciones={[[45, '45 min'], [60, '1 hora'], [75, '1 h 15'], [90, '1 h 30']]} valor={Number(r.minutos)} onChange={set('minutos')} />
        <div style={{ height:8 }} />
        <Chips id="co-hora" opciones={[['manana', 'Mañana'], ['mediodia', 'Mediodía'], ['tarde', 'Tarde'], ['noche', 'Noche']]} valor={r.hora} onChange={set('hora')} />
      </Pregunta>
      <Pregunta n={6} t="¿Dónde entrenas?"><Chips opciones={Object.entries(LUGARES).map(([k, v]) => [k, v.l])} valor={r.lugar} onChange={set('lugar')} /></Pregunta>
      <Pregunta n={7} t="¿Algo que cuidar?" sub="Si algo duele de verdad, primero el médico o el fisioterapeuta."><Chips multi opciones={[['rodilla', 'Rodilla'], ['tobillo', 'Tobillo'], ['espalda', 'Espalda baja'], ['hombro', 'Hombro'], ['ingle', 'Ingle / aductor']]} valor={r.molestias} onChange={set('molestias')} /></Pregunta>
      {error && <div style={{ fontSize:12.5, color:'var(--red)' }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="co-armar" type="button" className="btn-gold" onClick={listo}>Armar mi plan</button>
        {onCancelar && <button type="button" className="btn" onClick={onCancelar} style={{ width:'auto' }}>Cancelar</button>}
      </div>
    </div>
  )
}

// ─── Coach ────────────────────────────────────────────────────────────────────
export default function Coach() {
  const coach = useAjuste('coach'), dia = useAjuste('mi_dia')
  const hoy = hoyISO()
  const [editar, setEditar] = useState(false)
  const [diaSel, setDiaSel] = useState(letraDe(hoy))
  const [eleccion, setEleccion] = useState({})     // ejercicio → índice de opción
  const [hecho, setHecho] = useState({})
  const [entrenos, setEntrenos] = useState([])
  const [aviso, setAviso] = useState('')

  useEffect(() => { supabase.from('my_space_entrenos').select('*').gte('fecha', masDias(hoy, -28)).order('fecha', { ascending:false }).then(r => setEntrenos(r.data || [])) }, [])

  const guardarRespuestas = async r => {
    const plan = armarPlan(r)
    await coach.guardar({ respuestas: r, plan })
    // El fútbol entra a Mi día como compromiso fijo
    const base = dia.valor || DIA_BASE, fin = h => { const [a, b] = h.split(':').map(Number); return `${String(Math.min(23, a + 2)).padStart(2, '0')}:${String(b).padStart(2, '0')}` }
    const practica = r.futbol.split('').filter(d => !r.partidos.includes(d)).join('')
    const compromisos = [...(base.compromisos || []).filter(c => c.tipo !== 'futbol'),
      ...(practica ? [{ tipo:'futbol', nombre:'Fútbol', dias: practica, inicio: r.horaFutbol, fin: fin(r.horaFutbol) }] : []),
      ...(r.partidos ? [{ tipo:'futbol', nombre:'Partido / torneo', dias: r.partidos, inicio: r.horaPartido, fin: fin(r.horaPartido) }] : [])]
    await dia.guardar({ ...base, compromisos })
    setEditar(false)
  }

  if (coach.valor === undefined) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (coach.falta) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>27_myspace_dia_coach.sql</b> en Supabase para usar el Coach.</div>
  if (!coach.valor || editar) return <Cuestionario inicial={coach.valor?.respuestas} onCancelar={coach.valor ? () => setEditar(false) : null} onListo={guardarRespuestas} />

  const { plan } = coach.valor
  const d = plan.dias[diaSel] || { tipo:'movilidad' }
  const sesion = d.tipo === 'gym' ? SESIONES[d.id] : null
  const obj = OBJETIVOS[plan.objetivo] || OBJETIVOS.salud
  const esHoy = diaSel === letraDe(hoy)
  const yaHoy = entrenos.find(e => e.fecha === hoy)
  const terminar = async () => {
    const ejercicios = sesion.lista.map(id => ({ id, nombre: opcionesDe(id, plan.lugar)[(eleccion[id] || 0) % opcionesDe(id, plan.lugar).length][0], hecho: !!hecho[id] }))
    const r = await supabase.from('my_space_entrenos').insert({ fecha: hoy, sesion: sesion.nombre, ejercicios })
    if (r.error) return setAviso('No se guardó: ' + r.error.message)
    // Cuenta en Mi día y en el hábito físico
    await supabase.from('my_space_dia_registro').upsert({ fecha: hoy, bloque:'entreno', hecho_at: new Date().toISOString() })
    const h = await supabase.from('my_space_habitos').select('id').eq('area', 'fisica').eq('activo', true).limit(1)
    if (h.data?.[0]) await supabase.from('my_space_habitos_registro').upsert({ fecha: hoy, habito_id: h.data[0].id })
    setEntrenos(p => [{ fecha: hoy, sesion: sesion.nombre, ejercicios, hecho_at: new Date().toISOString() }, ...p])
    setAviso(`✓ Sesión guardada: ${ejercicios.filter(e => e.hecho).length} de ${ejercicios.length} ejercicios`)
  }
  const icono = x => x.tipo === 'gym' ? '🏋️' : x.tipo === 'futbol' ? (x.partido ? '🏆' : '⚽') : '🧘'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Tu coach</div>
          <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>{obj.l} · {LUGARES[plan.lugar]?.l} · {plan.minutos} min · series {obj.series}, descanso {obj.descanso}</div>
        </div>
        <button id="co-rehacer" type="button" className="btn" onClick={() => setEditar(true)} style={{ width:'auto' }}>Rehacer preguntas</button>
      </div>

      <div className="co-semana" style={{ display:'grid', gridTemplateColumns:'repeat(7, minmax(0, 1fr))', gap:6 }}>
        {DIAS.map(([l, nombre]) => { const x = plan.dias[l]; const on = diaSel === l; return (
          <button key={l} type="button" id={`co-dia-${l}`} onClick={() => setDiaSel(l)} style={{ padding:'8px 2px', borderRadius:12, fontFamily:'inherit', cursor:'pointer', textAlign:'center', minWidth:0,
            background: on ? `${AZUL}26` : 'rgba(255,255,255,0.03)', border:`1px solid ${on ? AZUL + '66' : l === letraDe(hoy) ? 'var(--gold)' : 'var(--border)'}`, color: on ? AZUL : 'var(--text2)' }}>
            <div style={{ fontSize:11, fontWeight:800 }}>{nombre.slice(0, 3)}</div>
            <div style={{ fontSize:20 }}>{icono(x)}</div>
            <div style={{ fontSize:9.5, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.tipo === 'gym' ? x.id === 'P' ? 'Pierna' : x.id === 'Q' ? 'Prevención' : x.id === 'A' ? 'Empuje' : x.id === 'B' ? 'Tirón' : x.id === 'S' ? 'Superior' : 'Completo' : x.tipo === 'futbol' ? (x.partido ? 'Partido' : 'Fútbol') : 'Movilidad'}</div>
          </button>
        ) })}
      </div>

      {d.tipo === 'futbol' && (
        <div className="panel">
          <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{d.partido ? '🏆 Partido / torneo' : '⚽ Fútbol'}</div>
          <ul style={{ margin:'10px 0 0', paddingLeft:18, fontSize:13.5, color:'var(--text2)', lineHeight:1.8 }}>
            <li>Antes: 10 minutos de calentamiento: trote, movilidad de cadera, skipping, aceleraciones cortas.</li>
            <li>Comida 2–3 horas antes, con carbohidrato; agua durante todo el día.</li>
            <li>Después: 10 minutos de estiramiento suave y proteína en la siguiente comida.</li>
            {d.partido && <li>Hoy nada de gym: el partido es tu entreno.</li>}
          </ul>
        </div>
      )}
      {d.tipo === 'movilidad' && (
        <div className="panel">
          <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>🧘 Recuperación y movilidad</div>
          <div style={{ fontSize:13.5, color:'var(--text2)', marginTop:8, lineHeight:1.7 }}>20 minutos: caminar suave, movilidad de cadera y tobillo, estiramiento de femoral, aductores y espalda. Duerme bien: también es entreno.</div>
        </div>
      )}
      {sesion && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'baseline', flexWrap:'wrap' }}>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>🏋️ {sesion.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{obj.series} · descanso {obj.descanso}</div>
          </div>
          {d.conFutbol && <div style={{ fontSize:12.5, color:'var(--gold)', marginTop:6 }}>Hoy también hay fútbol: haz el gym temprano y con 1 serie menos.</div>}
          {plan.molestias?.length > 0 && <div style={{ fontSize:12, color:'var(--text3)', marginTop:6 }}>Cuidando: {plan.molestias.join(', ')}. Si un ejercicio molesta, pasa al siguiente reemplazo.</div>}
          <div style={{ marginTop:10 }}>
            {sesion.lista.map((id, i) => {
              const ops = opcionesDe(id, plan.lugar), k = (eleccion[id] || 0) % ops.length, [nombre] = ops[k]
              return (
                <div key={id} id={`co-ej-${id}`} style={{ display:'flex', gap:10, alignItems:'center', padding:'11px 0', borderTop:'1px solid var(--border)' }}>
                  {esHoy && <button type="button" id={`co-hecho-${id}`} onClick={() => setHecho(p => ({ ...p, [id]: !p[id] }))} style={{ width:28, height:28, flexShrink:0, borderRadius:9, display:'grid', placeItems:'center', fontWeight:900, cursor:'pointer', background: hecho[id] ? 'var(--green)' : 'transparent', border: hecho[id] ? 'none' : '2px solid rgba(255,255,255,0.18)', color:'#0b0b0b' }}>{hecho[id] ? '✓' : ''}</button>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="co-nombre" style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{i + 1}. {nombre}</div>
                    <div style={{ fontSize:11.5, color:'var(--text3)' }}>{EJERCICIOS[id].musculo}{ops.length > 1 ? ` · opción ${k + 1} de ${ops.length}` : ''}</div>
                  </div>
                  {ops.length > 1 && <button type="button" id={`co-otro-${id}`} onClick={() => setEleccion(p => ({ ...p, [id]: (p[id] || 0) + 1 }))} className="btn" style={{ width:'auto', fontSize:12, padding:'6px 10px', flexShrink:0 }}>Ocupado →</button>}
                </div>
              )
            })}
          </div>
          {esHoy && (
            <div style={{ marginTop:12 }}>
              {yaHoy ? <div style={{ fontSize:13, color:'var(--green)' }}>✓ Hoy ya entrenaste: {yaHoy.sesion}</div>
                : <button id="co-terminar" type="button" className="btn-gold" onClick={terminar}>Terminar sesión</button>}
              {aviso && <div style={{ fontSize:12.5, marginTop:8, color: aviso.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{aviso}</div>}
            </div>
          )}
        </div>
      )}

      {entrenos.length > 0 && (
        <div className="panel">
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Últimos entrenos</div>
          {entrenos.slice(0, 8).map((e, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'8px 0', borderTop:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text2)' }}>{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })} · {e.sesion}</span>
              <span style={{ color:'var(--text3)', whiteSpace:'nowrap' }}>{(e.ejercicios || []).filter(x => x.hecho).length}/{(e.ejercicios || []).length} · {new Date(e.hecho_at).toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}