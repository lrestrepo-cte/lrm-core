// LRM Inversiones · Sports: tendencias de fútbol para apostar con cabeza, y tu banca con topes.
// Datos: API-Football por el puente /api/futbol (la llave vive en Vercel). Todo lo que se pide queda en
// bet_cache para gastar pocas consultas (el plan gratis da 100 al día). Registro y topes: bet_apuestas, bet_ajustes.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LIGAS, temporada, VENTANAS, lecturaPartido, resumenEquipo, analizarPartido, valor, montoSugerido,
  BANCA_BASE, estadoBanca, puedeApostar, gananciaDe } from './motorSports'

const COLOR = '#9C7BFF'
const cop = n => (Number(n) < 0 ? '−' : '') + '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('es-CO')
const pct = p => p == null ? '—' : Math.round(p * 100) + '%'
const hoyISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const num = v => Number(String(v ?? '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const fechaPartido = iso => new Date(iso).toLocaleString('es-CO', { weekday:'short', day:'numeric', month:'short', hour:'numeric', minute:'2-digit' })

// ─── Datos ───────────────────────────────────────────────────────────────────
let quedanHoy = null
async function api(params) {
  const { data } = await supabase.auth.getSession()
  const r = await fetch('/api/futbol?' + new URLSearchParams(params), { headers: { Authorization: 'Bearer ' + (data.session?.access_token || '') } })
  const j = await r.json().catch(() => ({}))
  if (Number.isFinite(j.quedan)) quedanHoy = j.quedan
  if (!r.ok) throw new Error(j.error || 'No se pudo consultar')
  const errores = j.errors && (Array.isArray(j.errors) ? j.errors : Object.values(j.errors))
  if (errores?.length) throw new Error(String(errores[0]))
  return j.response || []
}
async function conCache(clave, horas, traer) {
  const c = await supabase.from('bet_cache').select('datos,actualizado').eq('clave', clave).maybeSingle()
  if (c.error && /bet_cache/.test(c.error.message)) throw new Error('sql')
  if (c.data && (horas === Infinity || Date.now() - new Date(c.data.actualizado).getTime() < horas * 3600e3)) return c.data.datos
  const datos = await traer()
  await supabase.from('bet_cache').upsert({ clave, datos, actualizado: new Date().toISOString() })
  return datos
}
async function proximos(liga) {
  return conCache(`next:${liga.id}:${hoyISO()}`, 6, () => api({ path: 'fixtures', league: liga.id, season: temporada(liga), next: 15 }))
}
// Los últimos 10 partidos terminados de un equipo, con estadísticas y eventos (los terminados quedan guardados para siempre)
async function ultimosDe(teamId) {
  const lista = await conCache(`last:${teamId}:${hoyISO()}`, 24, () => api({ path: 'fixtures', team: teamId, last: 10, status: 'FT-AET-PEN' }))
  const ids = lista.map(f => f.fixture.id)
  const guardados = ids.length ? (await supabase.from('bet_cache').select('clave,datos').in('clave', ids.map(i => 'fx:' + i))).data || [] : []
  const tengo = new Map(guardados.map(g => [g.clave, g.datos]))
  const faltan = ids.filter(i => !tengo.has('fx:' + i))
  for (let i = 0; i < faltan.length; i += 20) {
    const lote = await api({ path: 'fixtures', ids: faltan.slice(i, i + 20).join('-') })
    await supabase.from('bet_cache').upsert(lote.map(f => ({ clave: 'fx:' + f.fixture.id, datos: f, actualizado: new Date().toISOString() })))
    lote.forEach(f => tengo.set('fx:' + f.fixture.id, f))
  }
  return resumenEquipo(ids.map(i => tengo.get('fx:' + i)).filter(Boolean).map(f => lecturaPartido(f, teamId)))
}
function useBanca() {
  const [cfg, setCfg] = useState(null)
  const [apuestas, setApuestas] = useState(null)
  const [falta, setFalta] = useState(false)
  const cargar = async () => {
    const [a, c] = await Promise.all([
      supabase.from('bet_apuestas').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('bet_ajustes').select('valor').eq('clave', 'banca').maybeSingle(),
    ])
    if (a.error) return setFalta(true)
    setApuestas(a.data || []); setCfg({ ...BANCA_BASE, ...(c.data?.valor || {}) })
  }
  useEffect(() => { cargar() }, [])
  const guardarCfg = async v => { setCfg(v); await supabase.from('bet_ajustes').upsert({ clave: 'banca', valor: v }) }
  const b = useMemo(() => cfg && apuestas ? estadoBanca(cfg, apuestas, hoyISO()) : null, [cfg, apuestas])
  return { cfg, apuestas, b, falta, recargar: cargar, guardarCfg }
}

// ─── Piezas ───────────────────────────────────────────────────────────────────
const Escudo = ({ src, size = 28 }) => src ? <img src={src} alt="" style={{ width:size, height:size, objectFit:'contain', flexShrink:0 }} /> : <span style={{ width:size }} />
const Chip = ({ c, children }) => <span style={{ fontSize:10.5, fontWeight:800, padding:'2px 8px', borderRadius:999, color:c, border:`1px solid ${c}`, whiteSpace:'nowrap' }}>{children}</span>
const COLOR_CONF = { alta:'var(--green)', media:'#E8A23A', baja:'var(--text3)' }
function Kpi({ l, v, c, id }) {
  return <div className="panel" style={{ padding:'12px 14px', minWidth:0 }}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div><div id={id} style={{ fontSize:19, fontWeight:800, color: c || 'var(--text)', whiteSpace:'nowrap' }}>{v}</div></div>
}
function AvisoTope({ b }) {
  if (!b) return null
  if (b.bloqueada) return <div className="panel" style={{ borderLeft:'4px solid var(--red)', fontSize:13.5, color:'var(--text)' }}>Llegaste a tu tope de pérdida de esta semana ({cop(b.cfg.topeSemana)}). Las apuestas nuevas quedan cerradas hasta el lunes. Mirar tendencias sí puedes.</div>
  if (b.perdidasHoy >= 2) return <div className="panel" style={{ borderLeft:'4px solid #E8A23A', fontSize:13.5, color:'var(--text)' }}>Llevas {b.perdidasHoy} apuestas perdidas hoy. Buen momento para parar y volver mañana con la cabeza fría.</div>
  return null
}

// ─── Registrar una apuesta ───────────────────────────────────────────────────
function ModalApuesta({ base, banca, onCerrar, onListo }) {
  const [f, setF] = useState({ partido: base?.partido || '', mercado: base?.mercado || '', seleccion: base?.seleccion || '', cuota: base?.cuota || '', monto: '', nota: '' })
  const [error, setError] = useState('')
  const p = base?.p || null
  const sug = p && num(f.cuota) > 1 ? montoSugerido(p, num(f.cuota), Math.max(0, banca.b.saldo), banca.cfg.maxPct) : 0
  const v = p ? valor(p, num(f.cuota)) : null
  const motivo = num(f.monto) ? puedeApostar(banca.b, num(f.monto)) : null
  const guardar = async () => {
    if (!f.partido || !f.seleccion || num(f.cuota) <= 1 || !num(f.monto)) return setError('Llena partido, selección, cuota y monto.')
    const m = puedeApostar(banca.b, num(f.monto)); if (m) return setError(m)
    const r = await supabase.from('bet_apuestas').insert({ fecha: hoyISO(), fixture_id: base?.fixture || null, partido: f.partido, liga: base?.liga || null, mercado: f.mercado || 'Otro',
      seleccion: f.seleccion, cuota: num(f.cuota), monto: num(f.monto), prob_estimada: p, estado: 'pendiente', nota: f.nota || null })
    if (r.error) return setError(r.error.message)
    onListo()
  }
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  return (
    <div onClick={onCerrar} style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Registrar apuesta" style={{ width:'100%', maxWidth:460, background:'var(--bg2, #141416)', border:'1px solid var(--border)', borderRadius:'20px 20px 0 0', padding:'18px 18px calc(18px + env(safe-area-inset-bottom, 0px))', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Registrar apuesta</div>
          <button type="button" className="btn" onClick={onCerrar} aria-label="Cerrar" style={{ width:'auto' }}>✕</button>
        </div>
        {[['partido', 'Partido'], ['mercado', 'Mercado'], ['seleccion', 'Selección']].map(([k, l]) => (
          <label key={k} style={{ display:'block', marginBottom:10 }}><span style={{ fontSize:12, color:'var(--text3)' }}>{l}</span><input value={f[k]} onChange={set(k)} style={iStyle} /></label>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <label><span style={{ fontSize:12, color:'var(--text3)' }}>Cuota de tu casa</span><input id="sp-cuota" inputMode="decimal" value={f.cuota} onChange={set('cuota')} placeholder="1.85" style={iStyle} /></label>
          <label><span style={{ fontSize:12, color:'var(--text3)' }}>Monto</span><input id="sp-monto" inputMode="numeric" value={f.monto ? Number(num(f.monto)).toLocaleString('es-CO') : ''} onChange={set('monto')} placeholder="$0" style={iStyle} /></label>
        </div>
        <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:10, lineHeight:1.6 }}>
          {v && <div>Tu probabilidad: <b>{pct(p)}</b> · la casa: <b>{pct(v.implicita)}</b> → {v.conValor ? <b style={{ color:'var(--green)' }}>tiene valor (+{Math.round(v.ventaja * 100)}%)</b> : <b style={{ color:'var(--text3)' }}>sin valor</b>}</div>}
          <div>Máximo por apuesta: <b>{cop(banca.b.maxApuesta)}</b>{sug > 0 && <> · sugerido: <b>{cop(sug)}</b></>}</div>
        </div>
        <label style={{ display:'block', marginTop:10 }}><span style={{ fontSize:12, color:'var(--text3)' }}>Nota (opcional)</span><input value={f.nota} onChange={set('nota')} style={iStyle} /></label>
        {(error || motivo) && <div id="sp-error" style={{ fontSize:13, color:'var(--red)', marginTop:10 }}>{error || motivo}</div>}
        <button id="sp-guardar" type="button" className="btn-gold" disabled={!!motivo} onClick={guardar} style={{ width:'100%', marginTop:14 }}>Registrar</button>
      </div>
    </div>
  )
}

// ─── Análisis de un partido ──────────────────────────────────────────────────
function PanelEquipo({ nombre, logo, r }) {
  const maxV = Math.max(1, ...r.ventanasFavor, ...r.ventanasContra)
  const f1 = n => n == null ? '—' : n.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  return (
    <div className="panel" style={{ minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}><Escudo src={logo} /><b style={{ color:'var(--text)' }}>{nombre}</b><span style={{ fontSize:11.5, color:'var(--text3)' }}>últimos {r.n}</span></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:6, fontSize:12.5, color:'var(--text2)' }}>
        <div>Goles: <b style={{ color:'var(--text)' }}>{f1(r.golesFavor)}</b> a favor · {f1(r.golesContra)} en contra</div>
        <div>Córners: <b style={{ color:'var(--text)' }}>{f1(r.cornersFavor)}</b> a favor · {f1(r.cornersContra)} en contra</div>
        <div>Tiros al arco: <b style={{ color:'var(--text)' }}>{f1(r.tirosFavor)}</b> · {f1(r.tirosContra)} en contra</div>
        <div>Tarjetas por partido: <b style={{ color:'var(--text)' }}>{f1(r.tarjetas)}</b></div>
      </div>
      <div style={{ display:'flex', gap:4, marginTop:10, flexWrap:'wrap' }}>
        {r.partidos.slice(0, 5).map(p => <span key={p.id} title={`${p.local ? 'vs' : 'en'} ${p.rival}`} style={{ fontSize:11, fontWeight:800, padding:'3px 7px', borderRadius:6, background: p.gf > p.gc ? 'rgba(76,175,80,0.2)' : p.gf < p.gc ? 'rgba(224,82,82,0.18)' : 'rgba(255,255,255,0.08)', color:'var(--text)' }}>{p.gf}-{p.gc}</span>)}
      </div>
      <div style={{ fontSize:11.5, color:'var(--text3)', margin:'12px 0 6px' }}>Minuto de los goles (dorado: a favor · gris: en contra)</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:4, alignItems:'end', height:64 }}>
        {VENTANAS.map((v, i) => (
          <div key={v} style={{ display:'flex', gap:2, alignItems:'flex-end', height:'100%' }} title={`${v}': ${r.ventanasFavor[i]} a favor, ${r.ventanasContra[i]} en contra`}>
            <div style={{ flex:1, height:`${r.ventanasFavor[i] / maxV * 100}%`, minHeight:2, background:'var(--gold)', borderRadius:3 }} />
            <div style={{ flex:1, height:`${r.ventanasContra[i] / maxV * 100}%`, minHeight:2, background:'rgba(255,255,255,0.25)', borderRadius:3 }} />
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:4, fontSize:9.5, color:'var(--text4)', marginTop:3, textAlign:'center' }}>{VENTANAS.map(v => <span key={v}>{v}</span>)}</div>
    </div>
  )
}
function Analisis({ f, liga, banca, onVolver }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [cuotas, setCuotas] = useState({})
  const [registrar, setRegistrar] = useState(null)
  const [verTodo, setVerTodo] = useState(false)
  useEffect(() => {
    Promise.all([ultimosDe(f.teams.home.id), ultimosDe(f.teams.away.id)])
      .then(([a, b]) => setD({ a, b, filas: analizarPartido(a, b) })).catch(e => setError(e.message))
  }, [f.fixture.id])
  const partido = `${f.teams.home.name} vs ${f.teams.away.name}`
  const filas = d ? (verTodo ? d.filas : d.filas.filter(x => x.p >= 0.6)) : []
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <button type="button" className="btn" onClick={onVolver} style={{ width:'auto', alignSelf:'flex-start' }}>← Partidos</button>
      <div className="panel" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><Escudo src={f.teams.home.logo} size={36} /><b style={{ color:'var(--text)', fontSize:16 }}>{f.teams.home.name}</b></div>
        <span style={{ color:'var(--text3)', fontSize:12 }}>{fechaPartido(f.fixture.date)} · {liga.nombre}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><b style={{ color:'var(--text)', fontSize:16 }}>{f.teams.away.name}</b><Escudo src={f.teams.away.logo} size={36} /></div>
      </div>
      {error && <div className="panel" style={{ color:'var(--red)', fontSize:13 }}>{error}</div>}
      {!d && !error && <div className="panel" style={{ fontSize:13, color:'var(--text3)' }}>Leyendo los últimos 10 partidos de cada equipo…</div>}
      {d && <>
        <div className="panel" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
            <b style={{ color:'var(--text)' }}>Tendencias del partido</b>
            <button type="button" className="btn" onClick={() => setVerTodo(v => !v)} style={{ width:'auto', fontSize:12 }}>{verTodo ? 'Solo las claras' : 'Ver todas'}</button>
          </div>
          {!filas.length && <div style={{ padding:14, fontSize:13, color:'var(--text3)' }}>No hay tendencias claras (60% o más) en este partido. Mejor no forzarlo.</div>}
          {filas.map((x, i) => {
            const k = x.mercado + x.seleccion, v = valor(x.p, num(cuotas[k]))
            return (
              <div key={k} id={`sp-fila-${i}`} style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr) 90px auto', gap:10, alignItems:'center', padding:'10px 14px', borderTop: i ? '1px solid var(--border)' : 'none' }} className="sp-fila">
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>{x.nombreMercado} · {x.seleccion}</div>
                  <div style={{ fontSize:11.5, color:'var(--text3)' }}>Local {pct(x.pLocal)} · visita {pct(x.pVisita)} · cuota justa {x.cuotaJusta ? x.cuotaJusta.toFixed(2) : '—'}</div>
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><b style={{ color:'var(--text)' }}>{pct(x.p)}</b><Chip c={COLOR_CONF[x.confianza]}>{x.confianza}</Chip></div>
                  <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', marginTop:4 }}><div style={{ width:pct(x.p), height:'100%', borderRadius:3, background: x.p >= 0.7 ? 'var(--green)' : COLOR }} /></div>
                </div>
                <input aria-label={`Cuota de tu casa para ${x.seleccion}`} inputMode="decimal" value={cuotas[k] || ''} onChange={e => setCuotas(c => ({ ...c, [k]: e.target.value }))} placeholder="Cuota" style={{ ...iStyle, padding:'7px 9px', fontSize:14 }} />
                <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end' }}>
                  {v && <Chip c={v.conValor ? 'var(--green)' : 'var(--text3)'}>{v.conValor ? `valor +${Math.round(v.ventaja * 100)}%` : 'sin valor'}</Chip>}
                  <button type="button" className="btn" onClick={() => setRegistrar({ partido, mercado: x.nombreMercado, seleccion: x.seleccion, cuota: cuotas[k] || '', p: x.p, fixture: f.fixture.id, liga: liga.nombre })} style={{ width:'auto', fontSize:12 }}>＋</button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(320px,100%), 1fr))', gap:12 }}>
          <PanelEquipo nombre={f.teams.home.name} logo={f.teams.home.logo} r={d.a} />
          <PanelEquipo nombre={f.teams.away.name} logo={f.teams.away.logo} r={d.b} />
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>Esto es historia, no un pronóstico: dice qué tan seguido pasó algo en los últimos partidos de cada equipo. «Cuota justa» es lo mínimo que debería pagar la casa para que valga la pena. Hay valor cuando la cuota de tu casa paga más que eso.</div>
      </>}
      {registrar && banca.b && <ModalApuesta base={registrar} banca={banca} onCerrar={() => setRegistrar(null)} onListo={() => { setRegistrar(null); banca.recargar() }} />}
    </div>
  )
}

// ─── Partidos ─────────────────────────────────────────────────────────────────
function Partidos({ banca }) {
  const [liga, setLiga] = useState(LIGAS[0])
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState(null)
  useEffect(() => { setLista(null); setError(''); proximos(liga).then(setLista).catch(e => setError(e.message)) }, [liga.id])
  if (abierto) return <Analisis f={abierto} liga={liga} banca={banca} onVolver={() => setAbierto(null)} />
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {LIGAS.map(l => <button key={l.id} type="button" id={`sp-liga-${l.id}`} onClick={() => setLiga(l)} className="btn" style={{ width:'auto', background: l.id === liga.id ? `${COLOR}33` : undefined, borderColor: l.id === liga.id ? COLOR : undefined }}>{l.nombre}</button>)}
      </div>
      {error === 'falta_llave' ? <Configurar /> : error === 'sql' ? <div className="panel" style={{ fontSize:13 }}>Corre en Supabase el archivo <b>31_inversiones_sports.sql</b>.</div>
        : error ? <div className="panel" style={{ fontSize:13, color:'var(--red)' }}>{error}</div>
        : !lista ? <div className="panel" style={{ fontSize:13, color:'var(--text3)' }}>Buscando los próximos partidos…</div>
        : !lista.length ? <div className="panel" style={{ fontSize:13, color:'var(--text3)' }}>No hay partidos próximos de {liga.nombre} por ahora.</div>
        : <div className="panel" style={{ padding:0, overflow:'hidden' }}>
            {lista.map((f, i) => (
              <button key={f.fixture.id} type="button" id={`sp-partido-${i}`} onClick={() => setAbierto(f)} style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) auto minmax(0,1fr)', gap:10, alignItems:'center', width:'100%', padding:'12px 14px', background:'transparent', border:'none', borderTop: i ? '1px solid var(--border)' : 'none', cursor:'pointer', fontFamily:'inherit', color:'var(--text)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end', minWidth:0, textAlign:'right' }}><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:700, fontSize:13.5 }}>{f.teams.home.name}</span><Escudo src={f.teams.home.logo} size={24} /></span>
                <span style={{ fontSize:11, color:'var(--text3)', textAlign:'center', minWidth:84 }}>{fechaPartido(f.fixture.date)}</span>
                <span style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}><Escudo src={f.teams.away.logo} size={24} /><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:700, fontSize:13.5 }}>{f.teams.away.name}</span></span>
              </button>
            ))}
          </div>}
      {quedanHoy != null && Number.isFinite(quedanHoy) && <div style={{ fontSize:11.5, color:'var(--text3)' }}>Consultas que te quedan hoy en la API: {quedanHoy}</div>}
    </div>
  )
}
function Configurar() {
  return (
    <div className="panel" style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.7 }}>
      <b style={{ color:'var(--text)' }}>Falta conectar la API de fútbol</b>
      <ol style={{ margin:'8px 0 0', paddingLeft:18 }}>
        <li>Crea tu cuenta gratis en dashboard.api-football.com y copia tu API key.</li>
        <li>En Vercel → tu proyecto → Settings → Environment Variables, agrega <b>API_FOOTBALL_KEY</b> con esa llave.</li>
        <li>Haz Redeploy y vuelve aquí.</li>
      </ol>
    </div>
  )
}

// ─── Mis apuestas ────────────────────────────────────────────────────────────
function MisApuestas({ banca }) {
  const [nueva, setNueva] = useState(false)
  const resolver = async (a, estado) => { await supabase.from('bet_apuestas').update({ estado, resuelta_at: new Date().toISOString() }).eq('id', a.id); banca.recargar() }
  const borrar = async a => { if (a.estado !== 'pendiente') return; await supabase.from('bet_apuestas').delete().eq('id', a.id); banca.recargar() }
  const pend = banca.apuestas.filter(a => a.estado === 'pendiente'), hechas = banca.apuestas.filter(a => a.estado !== 'pendiente')
  const Fila = ({ a }) => (
    <div style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 0', borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
      <div style={{ flex:'1 1 220px', minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>{a.seleccion} <span style={{ color:'var(--text3)', fontWeight:400 }}>@ {Number(a.cuota).toFixed(2)}</span></div>
        <div style={{ fontSize:11.5, color:'var(--text3)' }}>{a.partido} · {a.mercado} · {a.fecha}</div>
      </div>
      <b style={{ fontSize:13.5, color: a.estado === 'ganada' ? 'var(--green)' : a.estado === 'perdida' ? 'var(--red)' : 'var(--text)' }}>{a.estado === 'pendiente' ? cop(a.monto) : cop(gananciaDe(a))}</b>
      {a.estado === 'pendiente' && <div style={{ display:'flex', gap:6 }}>
        <button type="button" className="btn" onClick={() => resolver(a, 'ganada')} style={{ width:'auto', fontSize:12, color:'var(--green)' }}>Ganó</button>
        <button type="button" className="btn" onClick={() => resolver(a, 'perdida')} style={{ width:'auto', fontSize:12, color:'var(--red)' }}>Perdió</button>
        <button type="button" className="btn" onClick={() => resolver(a, 'nula')} style={{ width:'auto', fontSize:12 }}>Nula</button>
        <button type="button" className="btn" aria-label="Borrar" onClick={() => borrar(a)} style={{ width:'auto', fontSize:12 }}>✕</button>
      </div>}
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <AvisoTope b={banca.b} />
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><b style={{ color:'var(--text)' }}>Pendientes ({pend.length})</b><button id="sp-nueva" type="button" className="btn-gold" onClick={() => setNueva(true)} style={{ width:'auto' }}>＋ Registrar</button></div>
        {!pend.length && <div style={{ fontSize:13, color:'var(--text3)', marginTop:8 }}>Nada en juego.</div>}
        {pend.map(a => <Fila key={a.id} a={a} />)}
      </div>
      {hechas.length > 0 && <div className="panel"><b style={{ color:'var(--text)' }}>Historial</b>{hechas.slice(0, 40).map(a => <Fila key={a.id} a={a} />)}</div>}
      {nueva && <ModalApuesta banca={banca} onCerrar={() => setNueva(false)} onListo={() => { setNueva(false); banca.recargar() }} />}
    </div>
  )
}

// ─── Banca ────────────────────────────────────────────────────────────────────
function Banca({ banca }) {
  const [f, setF] = useState(banca.cfg)
  const [ok, setOk] = useState(false)
  const b = banca.b
  const campos = [['inicial', 'Tu banca (la plata que destinas solo a esto)', '$'], ['topeSemana', 'Pérdida máxima por semana', '$'], ['maxPct', 'Apuesta máxima (% de tu banca)', '%'], ['maxDia', 'Apuestas máximas por día', '#']]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <AvisoTope b={b} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
        <Kpi id="sp-saldo" l="Saldo disponible" v={cop(b.saldo)} />
        <Kpi l="Esta semana" v={cop(b.resultadoSemana)} c={b.resultadoSemana < 0 ? 'var(--red)' : b.resultadoSemana > 0 ? 'var(--green)' : undefined} />
        <Kpi l="Resultado total" v={cop(b.ganado)} c={b.ganado < 0 ? 'var(--red)' : b.ganado > 0 ? 'var(--green)' : undefined} />
        <Kpi l="Retorno (ROI)" v={b.roi == null ? '—' : `${(b.roi * 100).toFixed(1)}%`} />
        <Kpi l="Aciertos" v={pct(b.aciertos)} />
        <Kpi l="En juego" v={cop(b.enJuego)} />
      </div>
      {Number(b.cfg.topeSemana) > 0 && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--text2)' }}><span>Tope de la semana</span><span>{cop(Math.max(0, -b.resultadoSemana))} de {cop(b.cfg.topeSemana)}</span></div>
          <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', marginTop:6, overflow:'hidden' }}><div style={{ width:`${Math.min(100, Math.max(0, -b.resultadoSemana) / b.cfg.topeSemana * 100)}%`, height:'100%', background: b.bloqueada ? 'var(--red)' : '#E8A23A' }} /></div>
        </div>
      )}
      <div className="panel">
        <b style={{ color:'var(--text)' }}>Tus reglas</b>
        <div style={{ fontSize:12.5, color:'var(--text3)', margin:'4px 0 12px' }}>Una banca aparte de tu plata del mes, y topes que no se negocian en caliente. Si llegas al tope de la semana, las apuestas se cierran hasta el lunes.</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10 }}>
          {campos.map(([k, l]) => <label key={k}><span style={{ fontSize:12, color:'var(--text3)' }}>{l}</span><input id={`sp-cfg-${k}`} inputMode="numeric" value={f[k] ?? ''} onChange={e => { setOk(false); setF(x => ({ ...x, [k]: num(e.target.value) })) }} style={iStyle} /></label>)}
        </div>
        <button id="sp-cfg-guardar" type="button" className="btn-gold" onClick={async () => { await banca.guardarCfg(f); setOk(true) }} style={{ width:'auto', marginTop:12 }}>{ok ? '✓ Guardado' : 'Guardar reglas'}</button>
      </div>
    </div>
  )
}

// ─── El módulo ────────────────────────────────────────────────────────────────
export default function Sports() {
  const banca = useBanca()
  const [tab, setTab] = useState('partidos')
  if (banca.falta) return <div className="panel" style={{ fontSize:13.5 }}>Corre en Supabase el archivo <b>31_inversiones_sports.sql</b> para usar Sports.</div>
  if (!banca.b) return <div style={{ fontSize:13, color:'var(--text3)' }}>Cargando…</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>⚽ Sports</div>
          <div style={{ fontSize:12.5, color:'var(--text3)' }}>Tendencias, no adivinanzas. Tú decides; la banca tiene sus topes.</div>
        </div>
        <div style={{ fontSize:12.5, color:'var(--text2)' }}>Banca: <b id="sp-saldo-top" style={{ color:'var(--text)' }}>{cop(banca.b.saldo)}</b> · semana <b style={{ color: banca.b.resultadoSemana < 0 ? 'var(--red)' : 'var(--green)' }}>{cop(banca.b.resultadoSemana)}</b></div>
      </div>
      <div className="sub-nav" style={{ flexWrap:'wrap' }}>
        {[['partidos', 'Partidos'], ['apuestas', 'Mis apuestas'], ['banca', 'Banca y topes']].map(([id, l]) => <div key={id} id={`sp-tab-${id}`} className={`sub-nav-item${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{l}</div>)}
      </div>
      {tab === 'partidos' && <Partidos banca={banca} />}
      {tab === 'apuestas' && <MisApuestas banca={banca} />}
      {tab === 'banca' && <Banca banca={banca} />}
    </div>
  )
}
