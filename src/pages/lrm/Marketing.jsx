// @ts-nocheck
// LRM Trade Consulting · Marketing y crecimiento
// Estrategias con pasos, campañas de prospección por WhatsApp y pauta en Meta con resultados,
// calendario de contenido, secuencias de seguimiento, referidos y de dónde llegan tus clientes.
// Tablas: lrm_campanas, lrm_campana_envios, lrm_contenidos (SQL 23) · lrm_clientes (fuente, referidos, secuencia)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { linkWhatsApp, hoyISO, fechaCorta, ESTADOS_CLIENTE, NICHOS_LRM, nichosDe } from './LRMClientes'
import { useDatosLRM } from './datosLRM'
import { FUENTES, SECUENCIAS, ESTRATEGIAS, IDEAS_CONTENIDO, PUBLICOS_META } from './marketingLRM'

const cop = n => '$' + Math.round(Number(n || 0)).toLocaleString('es-CO')
const fmt = (v, d = 0) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const n2 = v => Number(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const diasDesde = iso => iso ? Math.floor((new Date(hoyISO() + 'T12:00:00') - new Date(String(iso).slice(0, 10) + 'T12:00:00')) / 86400000) : 9999
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12.5, color:'var(--text4)', padding:'18px 0', textAlign:'center' }}>{children}</div>
const Titulo = ({ children, extra }) => <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}><div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)' }}>{children}</div>{extra}</div>
const llenar = (t, c) => String(t || '').replace(/\{nombre\}/g, String(c?.nombre || '').split(' ')[0] || '')
const copiar = async t => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }

const ENVIO = {
  pendiente:   { l:'Pendiente',     c:'var(--text3)' },
  enviado:     { l:'Enviado',       c:'#378ADD' },
  respondio:   { l:'Respondió',     c:'#9C7BFF' },
  interesado:  { l:'Interesado',    c:'var(--gold)' },
  cliente:     { l:'¡Cliente!',     c:'var(--green)' },
  no_interesa: { l:'No le interesa', c:'var(--red)' },
}
const TIPOS_CAMPANA = { whatsapp:'💬 Prospección por WhatsApp', meta:'📣 Pauta en Meta', contenido:'🎬 Contenido orgánico', evento:'🎤 Evento / charla', alianza:'🔗 Alianza', otro:'➕ Otra' }
const REDES = { instagram:'📸 Instagram', facebook:'📘 Facebook', tiktok:'🎵 TikTok', whatsapp:'💬 WhatsApp', linkedin:'💼 LinkedIn', youtube:'▶️ YouTube' }
const FORMATOS = ['post', 'reel', 'historia', 'carrusel', 'anuncio', 'estado']

export default function Marketing() {
  const [tab, setTab] = useState('estrategias')
  const [clientes, setClientes] = useState([])
  const [contactos, setContactos] = useState([])
  const [campanas, setCampanas] = useState([])
  const [envios, setEnvios] = useState([])
  const [contenidos, setContenidos] = useState([])
  const [movs, setMovs] = useState([])
  const [ajustes, setAjustes] = useState({})
  const [falta, setFalta] = useState(false)
  const cargar = async () => {
    const [cl, co, ca, en, ct, mv, aj] = await Promise.all([
      supabase.from('lrm_clientes').select('*').order('nombre'),
      supabase.from('lrm_contactos').select('cliente_id,fecha'),
      supabase.from('lrm_campanas').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_campana_envios').select('*'),
      supabase.from('lrm_contenidos').select('*').order('fecha'),
      supabase.from('lrm_movimientos').select('tipo,monto,cliente_id,fecha').eq('tipo', 'cobro_cliente'),
      supabase.from('lrm_ajustes').select('*').in('clave', ['estrategias', 'referidos', 'secuencias']),
    ])
    if (ca.error || ct.error) setFalta(true)
    setClientes(cl.data || []); setContactos(co.data || []); setCampanas(ca.data || []); setEnvios(en.data || []); setContenidos(ct.data || []); setMovs(mv.data || [])
    const a = {}; (aj.data || []).forEach(x => { try { a[x.clave] = JSON.parse(x.valor) } catch {} }); setAjustes(a)
  }
  useEffect(() => { cargar() }, [])
  const guardarAjuste = async (clave, valor) => { setAjustes(p => ({ ...p, [clave]: valor })); await supabase.from('lrm_ajustes').upsert({ clave, valor: JSON.stringify(valor) }) }
  const ultimoContacto = useMemo(() => { const m = {}; contactos.forEach(c => { if (!m[c.cliente_id] || c.fecha > m[c.cliente_id]) m[c.cliente_id] = c.fecha }); return m }, [contactos])

  const TABS = [['estrategias', '🎯 Estrategias'], ['campanas', `📣 Campañas (${campanas.length})`], ['contenido', '🎬 Contenido y pauta'], ['seguimiento', '🔁 Seguimientos'], ['referidos', '🤝 Referidos'], ['fuentes', '📊 Fuentes y embudo']]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {TABS.map(([id, l]) => <button key={id} id={`mk-tab-${id}`} onClick={() => setTab(id)} className={tab === id ? 'btn-gold' : 'btn'} style={{ width:'auto' }}>{l}</button>)}
      </div>
      {falta && tab !== 'estrategias' && <div className="panel" style={{ fontSize:13, color:'var(--gold)' }}>Para campañas, contenido, fuentes y referidos corre en Supabase el archivo <b>23_lrm_marketing.sql</b>.</div>}
      {tab === 'estrategias' && <Estrategias progreso={ajustes.estrategias || {}} onGuardar={v => guardarAjuste('estrategias', v)} irA={setTab} />}
      {tab === 'campanas' && !falta && <Campanas campanas={campanas} envios={envios} clientes={clientes} ultimoContacto={ultimoContacto} movs={movs} onCambio={cargar} />}
      {tab === 'contenido' && !falta && <Contenido contenidos={contenidos} campanas={campanas} onCambio={cargar} />}
      {tab === 'seguimiento' && <Seguimientos clientes={clientes} onCambio={cargar} />}
      {tab === 'referidos' && !falta && <Referidos clientes={clientes} movs={movs} config={ajustes.referidos || {}} onConfig={v => guardarAjuste('referidos', v)} onCambio={cargar} />}
      {tab === 'fuentes' && !falta && <Fuentes clientes={clientes} movs={movs} campanas={campanas} />}
    </div>
  )
}

// ── Estrategias ─────────────────────────────────────────────────────────────
function Estrategias({ progreso, onGuardar, irA }) {
  const [abierta, setAbierta] = useState(null)
  const hechos = id => (progreso[id] || []).filter(Boolean).length
  const toggle = (e, i) => { const arr = [...(progreso[e.id] || e.pasos.map(() => false))]; arr[i] = !arr[i]; onGuardar({ ...progreso, [e.id]: arr }) }
  const total = ESTRATEGIAS.reduce((s, e) => s + e.pasos.length, 0), listos = ESTRATEGIAS.reduce((s, e) => s + hechos(e.id), 0)
  const IR = { pauta_wa:'contenido', referidos:'referidos', reactivar:'campanas', barrido:'seguimiento', contenido:'contenido' }
  return (
    <>
      <div className="panel" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Plan para conseguir clientes</div>
          <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>{ESTRATEGIAS.length} estrategias con pasos concretos. Marca lo que vas haciendo y mide cada una con su indicador.</div>
        </div>
        <div style={{ width:220 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:'var(--text3)' }}>Avance</span><b style={{ color:'var(--gold)' }}>{listos} de {total} pasos</b></div>
          <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.07)', marginTop:5, overflow:'hidden' }}><div style={{ width:`${listos / total * 100}%`, height:'100%', background:'var(--gold)' }} /></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap:12, alignItems:'start' }}>
        {ESTRATEGIAS.map(e => {
          const h = hechos(e.id), abierto = abierta === e.id
          return (
            <div key={e.id} className="panel mk-estrategia" style={{ borderLeft:`3px solid ${e.impacto === 'alto' ? 'var(--gold)' : '#378ADD'}` }}>
              <div onClick={() => setAbierta(abierto ? null : e.id)} style={{ cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)' }}>{e.icono} {e.titulo}</div>
                  <span style={{ fontSize:11, color: h === e.pasos.length ? 'var(--green)' : 'var(--text3)', whiteSpace:'nowrap' }}>{h}/{e.pasos.length}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:4, lineHeight:1.5 }}>{e.porque}</div>
              </div>
              {abierto && (
                <div style={{ marginTop:10 }}>
                  {e.pasos.map((p, i) => (
                    <label key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color: (progreso[e.id] || [])[i] ? 'var(--text3)' : 'var(--text2)', padding:'4px 0', cursor:'pointer', textDecoration: (progreso[e.id] || [])[i] ? 'line-through' : 'none' }}>
                      <input type="checkbox" className="mk-paso" checked={!!(progreso[e.id] || [])[i]} onChange={() => toggle(e, i)} style={{ marginTop:2 }} /> {p}
                    </label>
                  ))}
                  <div style={{ fontSize:11.5, color:'var(--gold)', marginTop:6 }}>📏 Mide: {e.kpi}</div>
                  {IR[e.id] && <button onClick={() => irA(IR[e.id])} className="btn" style={{ width:'auto', fontSize:11, padding:'3px 10px', marginTop:8 }}>Ir a la herramienta →</button>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Campañas ────────────────────────────────────────────────────────────────
function Campanas({ campanas, envios, clientes, ultimoContacto, movs, onCambio }) {
  const [abierta, setAbierta] = useState(null)
  const [nueva, setNueva] = useState(false)
  const stats = c => { const es = envios.filter(e => e.campana_id === c.id); const cnt = k => es.filter(e => e.estado === k).length
    return { total: es.length, enviados: es.filter(e => e.estado !== 'pendiente').length, respondio: cnt('respondio') + cnt('interesado') + cnt('cliente'), interesados: cnt('interesado') + cnt('cliente'), clientes: cnt('cliente') + clientes.filter(x => x.campana_id === c.id && x.estado === 'activo' && !es.some(e => e.cliente_id === x.id && e.estado === 'cliente')).length } }
  const camp = campanas.find(c => c.id === abierta)
  if (camp) return <DetalleCampana c={camp} envios={envios.filter(e => e.campana_id === camp.id)} clientes={clientes} ultimoContacto={ultimoContacto} movs={movs} onVolver={() => setAbierta(null)} onCambio={onCambio} />
  return (
    <div className="panel">
      <Titulo extra={<button id="mk-nueva" onClick={() => setNueva(true)} className="btn-gold" style={{ width:'auto' }}>+ Nueva campaña</button>}>CAMPAÑAS</Titulo>
      {campanas.length === 0 ? <Vacio>Crea tu primera campaña: prospección por WhatsApp a un segmento, reactivación de clientes dormidos o una pauta en Meta.</Vacio> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap:10 }}>
          {campanas.map(c => { const s = stats(c); return (
            <div key={c.id} onClick={() => setAbierta(c.id)} className="mk-campana" style={{ cursor:'pointer', padding:'12px 14px', borderRadius:10, background:'var(--bg4)', borderLeft:`3px solid ${c.estado === 'activa' ? 'var(--green)' : 'var(--text4)'}` }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{TIPOS_CAMPANA[c.tipo] || c.tipo} · {c.estado}</div>
              <div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)', marginTop:2 }}>{c.nombre}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>
                {c.tipo === 'meta' ? <>Invertido {cop(c.invertido)} · {fmt(c.mensajes)} conversaciones · {fmt(c.leads)} leads{c.leads ? ` · ${cop(c.invertido / c.leads)} c/u` : ''}</>
                  : <>{s.enviados} de {s.total} enviados · {s.respondio} respondieron · <b style={{ color:'var(--green)' }}>{s.clientes} clientes</b></>}
              </div>
            </div>
          ) })}
        </div>
      )}
      {nueva && <ModalCampana onCerrar={() => setNueva(false)} onGuardado={async id => { setNueva(false); await onCambio(); setAbierta(id) }} />}
    </div>
  )
}

const PLANTILLAS_CAMPANA = [
  { nombre:'Prospección comerciantes', tipo:'whatsapp', objetivo:'Conseguir prospectos nuevos', mensaje:'Hola {nombre}, soy Luis de LRM Trade Consulting 👋 Traemos mercancía desde Miami (salidas lunes y viernes), Panamá y China hasta Barranquilla con todo incluido. ¿Te interesa que te cotice tu próximo pedido?', segmento:{ estados:['prospecto'] } },
  { nombre:'Reactivar clientes dormidos', tipo:'whatsapp', objetivo:'Que vuelvan a mover carga', mensaje:'Hola {nombre}, ¿cómo va todo? Hace rato no movemos carga juntos. Esta semana hay salida desde Miami y el consolidado de China está abierto. ¿Te separo espacio?', segmento:{ estados:['activo'], diasSinContacto:30 } },
  { nombre:'Cierre de consolidado China', tipo:'whatsapp', objetivo:'Llenar el contenedor', mensaje:'{nombre}, el consolidado de China cierra pronto 🚢 Todo incluido por m³: flete, legalización y entrega en Barranquilla. ¿Te guardo espacio?', segmento:{ estados:['activo', 'propuesta', 'conversacion'] } },
  { nombre:'Pauta Meta · WhatsApp', tipo:'meta', objetivo:'Conversaciones por WhatsApp', mensaje:'', segmento:{} },
]
function ModalCampana({ campana, onCerrar, onGuardado }) {
  const [f, setF] = useState({ nombre:'', tipo:'whatsapp', objetivo:'', estado:'activa', mensaje:'', segmento:{}, presupuesto:'', inicio: hoyISO(), fin:'', notas:'', ...(campana || {}) })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Ponle nombre a la campaña.')
    const { id, created_at, ...d } = f
    const datos = { ...d, presupuesto: n2(d.presupuesto), invertido: n2(d.invertido), alcance: Math.round(n2(d.alcance)), mensajes: Math.round(n2(d.mensajes)), leads: Math.round(n2(d.leads)), inicio: d.inicio || null, fin: d.fin || null }
    const r = id ? await supabase.from('lrm_campanas').update(datos).eq('id', id).select().single() : await supabase.from('lrm_campanas').insert(datos).select().single()
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado(r.data.id)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:12 }}>{f.id ? 'Editar campaña' : 'Nueva campaña'}</div>
        {!f.id && <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>{PLANTILLAS_CAMPANA.map(p => <button key={p.nombre} onClick={() => setF(x => ({ ...x, ...p }))} className="btn mk-plantilla" style={{ width:'auto', fontSize:11.5 }}>{p.nombre}</button>)}</div>}
        <div className="grid-2" style={{ gap:10 }}>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Nombre</Etiqueta><input id="mk-nombre" value={f.nombre} onChange={set('nombre')} style={iStyle} /></div>
          <div><Etiqueta>Tipo</Etiqueta><select value={f.tipo} onChange={set('tipo')} style={iStyle}>{Object.entries(TIPOS_CAMPANA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><Etiqueta>Estado</Etiqueta><select value={f.estado} onChange={set('estado')} style={iStyle}>{['borrador', 'activa', 'pausada', 'terminada'].map(x => <option key={x}>{x}</option>)}</select></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Objetivo</Etiqueta><input value={f.objetivo || ''} onChange={set('objetivo')} style={iStyle} /></div>
          {f.tipo !== 'meta' && <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Mensaje (usa {'{nombre}'})</Etiqueta><textarea id="mk-mensaje" value={f.mensaje || ''} onChange={set('mensaje')} style={{ ...iStyle, minHeight:90, resize:'vertical' }} /></div>}
          {f.tipo === 'meta' && <>
            <div><Etiqueta>Presupuesto total</Etiqueta><input inputMode="numeric" value={f.presupuesto || ''} onChange={set('presupuesto')} style={iStyle} /></div>
            <div><Etiqueta>Invertido hasta hoy</Etiqueta><input inputMode="numeric" value={f.invertido || ''} onChange={set('invertido')} style={iStyle} /></div>
          </>}
          <div><Etiqueta>Inicio</Etiqueta><input type="date" value={f.inicio || ''} onChange={set('inicio')} style={iStyle} /></div>
          <div><Etiqueta>Fin</Etiqueta><input type="date" value={f.fin || ''} onChange={set('fin')} style={iStyle} /></div>
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="mk-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function DetalleCampana({ c, envios, clientes, ultimoContacto, movs, onVolver, onCambio }) {
  const { empresa } = useDatosLRM()
  const [editar, setEditar] = useState(false)
  const [seg, setSeg] = useState({ estados: [], nichos: [], fuentes: [], ciudad:'', diasSinContacto:'', ...(c.segmento || {}) })
  const [aviso, setAviso] = useState('')
  const [res, setRes] = useState({ invertido: c.invertido || '', alcance: c.alcance || '', mensajes: c.mensajes || '', leads: c.leads || '' })
  const cli = id => clientes.find(x => x.id === id)
  const coincide = x => x.telefono && (!seg.estados?.length || seg.estados.includes(x.estado)) && (!seg.nichos?.length || nichosDe(x).some(nn => seg.nichos.includes(nn)))
    && (!seg.fuentes?.length || seg.fuentes.includes(x.fuente)) && (!seg.ciudad || String(x.ciudad || '').toLowerCase().includes(seg.ciudad.toLowerCase()))
    && (!n2(seg.diasSinContacto) || diasSinContactoDe(x) >= n2(seg.diasSinContacto))
  const diasSinContactoDe = x => diasDesde(ultimoContacto[x.id] || x.created_at)
  const candidatos = clientes.filter(coincide).filter(x => !envios.some(e => e.cliente_id === x.id))
  const alternar = (k, v) => setSeg(p => { const a = p[k] || []; return { ...p, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] } })
  const armar = async () => {
    if (!candidatos.length) return setAviso('No hay clientes nuevos que cumplan el filtro (deben tener WhatsApp).')
    await supabase.from('lrm_campanas').update({ segmento: seg }).eq('id', c.id)
    const r = await supabase.from('lrm_campana_envios').insert(candidatos.map(x => ({ campana_id: c.id, cliente_id: x.id })))
    setAviso(r.error ? 'No se pudo armar la lista: ' + r.error.message : `✓ ${candidatos.length} agregados a la lista.`); onCambio()
  }
  const marcar = async (e, estado) => {
    await supabase.from('lrm_campana_envios').update({ estado, ...(estado === 'enviado' && !e.enviado_at ? { enviado_at: new Date().toISOString() } : {}) }).eq('id', e.id)
    if (estado === 'cliente') await supabase.from('lrm_clientes').update({ campana_id: c.id }).eq('id', e.cliente_id)
    onCambio()
  }
  const enviar = async e => {
    if ((e.estado || 'pendiente') === 'pendiente') {
      await supabase.from('lrm_campana_envios').update({ estado:'enviado', enviado_at: new Date().toISOString() }).eq('id', e.id)
      await supabase.from('lrm_contactos').insert({ cliente_id: e.cliente_id, tipo:'whatsapp', resumen:`Campaña: ${c.nombre}` })
      onCambio()
    }
  }
  const guardarRes = async () => { await supabase.from('lrm_campanas').update({ invertido: n2(res.invertido), alcance: Math.round(n2(res.alcance)), mensajes: Math.round(n2(res.mensajes)), leads: Math.round(n2(res.leads)) }).eq('id', c.id); setAviso('✓ Resultados guardados'); onCambio() }
  const ganados = clientes.filter(x => x.campana_id === c.id)
  const facturadoGanados = movs.filter(m => ganados.some(g => g.id === m.cliente_id)).reduce((s, m) => s + Number(m.monto || 0), 0)
  const numWA = String(empresa.whatsapp || '').replace(/\D/g, '')
  const linkAnuncio = numWA ? `https://wa.me/${numWA.length === 10 ? '57' + numWA : numWA}?text=${encodeURIComponent(`Hola, vi el anuncio "${c.nombre}" y quiero información`)}` : ''
  const cnt = k => envios.filter(e => (e.estado || 'pendiente') === k).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="panel" style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div>
          <button onClick={onVolver} className="btn" style={{ width:'auto', fontSize:11, padding:'3px 9px', marginBottom:6 }}>← Campañas</button>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{TIPOS_CAMPANA[c.tipo]} · {c.estado}{c.inicio ? ` · desde ${fechaCorta(c.inicio)}` : ''}</div>
          <div style={{ fontSize:19, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
          {c.objetivo && <div style={{ fontSize:12, color:'var(--text3)' }}>{c.objetivo}</div>}
        </div>
        <button onClick={() => setEditar(true)} className="btn" style={{ width:'auto' }}>Editar</button>
      </div>
      {aviso && <div id="mk-aviso" style={{ fontSize:12.5, color: aviso.startsWith('✓') ? 'var(--green)' : '#E8A23A' }}>{aviso}</div>}

      {c.tipo === 'meta' ? (
        <>
          <div className="panel">
            <Titulo>RESULTADOS DE LA PAUTA · los copias de Ads Manager</Titulo>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap:10 }}>
              {[['invertido', 'Invertido'], ['alcance', 'Alcance'], ['mensajes', 'Conversaciones'], ['leads', 'Leads (prospectos)']].map(([k, l]) => (
                <div key={k}><Etiqueta>{l}</Etiqueta><input id={`mk-res-${k}`} inputMode="numeric" value={res[k]} onChange={e => setRes(p => ({ ...p, [k]: e.target.value }))} style={iStyle} /></div>
              ))}
            </div>
            <button id="mk-res-guardar" onClick={guardarRes} className="btn-green" style={{ marginTop:10, width:'auto' }}>Guardar resultados</button>
            <div id="mk-kpis" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:10, marginTop:14 }}>
              {[['Costo por conversación', n2(res.mensajes) ? cop(n2(res.invertido) / n2(res.mensajes)) : '—'], ['Costo por lead', n2(res.leads) ? cop(n2(res.invertido) / n2(res.leads)) : '—'],
                ['Clientes ganados', String(ganados.filter(g => g.estado === 'activo').length)], ['Costo por cliente', ganados.filter(g => g.estado === 'activo').length ? cop(n2(res.invertido) / ganados.filter(g => g.estado === 'activo').length) : '—'],
                ['Facturado a esos clientes', cop(facturadoGanados)], ['Retorno', n2(res.invertido) ? `${fmt(facturadoGanados / n2(res.invertido), 1)}×` : '—']].map(([l, v]) => (
                <div key={l} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg4)' }}><div style={{ fontSize:10.5, color:'var(--text4)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div><div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div className="panel">
            <Titulo>LINK DE WHATSAPP PARA EL ANUNCIO</Titulo>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>Úsalo como destino del anuncio: el mensaje llega diciendo de qué campaña viene. Cuando escriba, créalo en el CRM con fuente "Pauta Meta" y esta campaña.</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <code style={{ fontSize:11.5, color:'var(--gold)', wordBreak:'break-all', flex:1 }}>{linkAnuncio || 'Pon tu WhatsApp en Ajustes'}</code>
              {linkAnuncio && <button onClick={() => copiar(linkAnuncio).then(ok => ok && setAviso('✓ Link copiado'))} className="btn" style={{ width:'auto' }}>Copiar</button>}
              <a href="https://adsmanager.facebook.com/" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none' }}>Abrir Ads Manager ↗</a>
            </div>
            <div style={{ marginTop:12 }}><Etiqueta>Públicos sugeridos</Etiqueta>
              {PUBLICOS_META.map(p => <div key={p.nombre} style={{ fontSize:12, color:'var(--text2)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}><b style={{ color:'var(--text)' }}>{p.nombre}</b> · {p.servicio}<div style={{ fontSize:11.5, color:'var(--text3)' }}>{p.ubicacion} · {p.edad} años · {p.intereses}</div></div>)}
            </div>
            {ganados.length > 0 && <div style={{ marginTop:12 }}><Etiqueta>Clientes que llegaron por esta campaña</Etiqueta><div style={{ fontSize:12.5, color:'var(--text2)', marginTop:4 }}>{ganados.map(g => g.nombre).join(' · ')}</div></div>}
          </div>
        </>
      ) : (
        <>
          <div className="panel">
            <Titulo>A QUIÉN LE LLEGA · {candidatos.length} por agregar</Titulo>
            <Etiqueta>Estado en el CRM</Etiqueta>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', margin:'6px 0 10px' }}>{ESTADOS_CLIENTE.filter(e => e.id !== 'perdido').map(e => <button key={e.id} onClick={() => alternar('estados', e.id)} className={(seg.estados || []).includes(e.id) ? 'btn-gold mk-seg' : 'btn mk-seg'} style={{ width:'auto', fontSize:11.5, padding:'4px 10px' }}>{e.nombre}</button>)}</div>
            <Etiqueta>Qué compran</Etiqueta>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', margin:'6px 0 10px' }}>{NICHOS_LRM.map(nn => <button key={nn} onClick={() => alternar('nichos', nn)} className={(seg.nichos || []).includes(nn) ? 'btn-gold' : 'btn'} style={{ width:'auto', fontSize:11, padding:'3px 9px' }}>{nn}</button>)}</div>
            <div className="grid-2" style={{ gap:10 }}>
              <div><Etiqueta>Ciudad contiene</Etiqueta><input value={seg.ciudad || ''} onChange={e => setSeg(p => ({ ...p, ciudad: e.target.value }))} style={iStyle} /></div>
              <div><Etiqueta>Sin contacto hace (días)</Etiqueta><input inputMode="numeric" value={seg.diasSinContacto || ''} onChange={e => setSeg(p => ({ ...p, diasSinContacto: e.target.value }))} style={iStyle} /></div>
            </div>
            <button id="mk-armar" onClick={armar} className="btn-gold" style={{ width:'auto', marginTop:12 }}>+ Agregar {candidatos.length} a la lista</button>
          </div>

          <div className="panel">
            <Titulo extra={<span style={{ fontSize:12, color:'var(--text3)' }}>{envios.length - cnt('pendiente')} enviados · {cnt('respondio') + cnt('interesado') + cnt('cliente')} respondieron · <b style={{ color:'var(--green)' }}>{cnt('cliente')} clientes</b></span>}>LISTA DE ENVÍO</Titulo>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>Toca 💬 y se abre WhatsApp con el mensaje listo para esa persona. Queda registrado en el CRM. Después marca cómo respondió.</div>
            {envios.length === 0 ? <Vacio>Arma la lista con el filtro de arriba.</Vacio> : [...envios].map(e => ({ ...e, estado: e.estado || 'pendiente' })).sort((a, b) => (a.estado === 'pendiente' ? 0 : 1) - (b.estado === 'pendiente' ? 0 : 1)).map(e => {
              const x = cli(e.cliente_id); if (!x) return null
              const link = linkWhatsApp(x.telefono, x.nombre, llenar(c.mensaje, x))
              return (
                <div key={e.id} className="mk-envio" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
                  <div style={{ flex:'1 1 180px', minWidth:0 }}>
                    <div style={{ fontSize:13, color:'var(--text)' }}>{x.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{x.telefono}{e.enviado_at ? ` · enviado ${fechaCorta(e.enviado_at.slice(0, 10))}` : ''}</div>
                  </div>
                  {link && <a href={link} target="_blank" rel="noreferrer" onClick={() => enviar(e)} className="btn mk-wa" style={{ textDecoration:'none', color:'#25D366', fontSize:12 }}>💬 {e.estado === 'pendiente' ? 'Enviar' : 'Escribir'}</a>}
                  <select value={e.estado} onChange={ev => marcar(e, ev.target.value)} className="mk-estado" style={{ ...iStyle, marginTop:0, width:'auto', fontSize:12, color: ENVIO[e.estado]?.c }}>{Object.entries(ENVIO).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}</select>
                </div>
              )
            })}
          </div>
        </>
      )}
      {editar && <ModalCampana campana={c} onCerrar={() => setEditar(false)} onGuardado={() => { setEditar(false); onCambio() }} />}
    </div>
  )
}

// ── Contenido y pauta ───────────────────────────────────────────────────────
function Contenido({ contenidos, campanas, onCambio }) {
  const [editando, setEditando] = useState(null)
  const [verIdeas, setVerIdeas] = useState(false)
  const [copiado, setCopiado] = useState(null)
  const hoy = hoyISO()
  const proximos = contenidos.filter(c => c.fecha >= masDias(hoy, -7)).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const publicadosMes = contenidos.filter(c => c.estado === 'publicado' && c.fecha.slice(0, 7) === hoy.slice(0, 7))
  const semanas = {}
  proximos.forEach(c => { const d = new Date(c.fecha + 'T12:00:00'); const lunes = masDias(c.fecha, -((d.getDay() + 6) % 7)); (semanas[lunes] ||= []).push(c) })
  const ESTADO = { idea:['Idea', 'var(--text3)'], listo:['Listo', 'var(--gold)'], publicado:['Publicado', 'var(--green)'] }
  const pauta = campanas.filter(c => c.tipo === 'meta')
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:10 }}>
        {[['Publicados este mes', publicadosMes.length], ['Programados', contenidos.filter(c => c.fecha >= hoy && c.estado !== 'publicado').length], ['Mensajes desde contenido', publicadosMes.reduce((s, c) => s + Number(c.mensajes || 0), 0)],
          ['Invertido en pauta', cop(pauta.reduce((s, c) => s + Number(c.invertido || 0), 0))]].map(([l, v]) => (
          <div key={l} className="panel" style={{ padding:'12px 14px' }}><div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', fontWeight:700 }}>{l}</div><div style={{ fontSize:19, fontWeight:800, color:'var(--text)', marginTop:2 }}>{v}</div></div>
        ))}
      </div>
      <div className="panel">
        <Titulo extra={<div style={{ display:'flex', gap:6 }}><button onClick={() => setVerIdeas(v => !v)} className="btn" style={{ width:'auto' }}>💡 Ideas de contenido</button><button id="mk-ct-nuevo" onClick={() => setEditando({ fecha: hoy, red:'instagram', formato:'post', tema:'', copy:'', estado:'idea' })} className="btn-gold" style={{ width:'auto' }}>+ Publicación</button></div>}>CALENDARIO DE CONTENIDO</Titulo>
        {verIdeas && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap:8, marginBottom:14 }}>
            {IDEAS_CONTENIDO.map(i => (
              <div key={i.tema} className="mk-idea" style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg4)' }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{REDES[i.red]} · {i.formato}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', margin:'2px 0 4px' }}>{i.tema}</div>
                <div style={{ fontSize:11.5, color:'var(--text3)' }}>{i.copy}</div>
                <button onClick={() => setEditando({ fecha: masDias(hoy, 1), red:i.red, formato:i.formato, tema:i.tema, copy:i.copy, estado:'idea' })} className="btn mk-usar-idea" style={{ width:'auto', fontSize:11, padding:'3px 9px', marginTop:6 }}>+ Al calendario</button>
              </div>
            ))}
          </div>
        )}
        {Object.keys(semanas).length === 0 ? <Vacio>Programa tus publicaciones de la semana. Usa las ideas para arrancar rápido.</Vacio> : Object.entries(semanas).map(([lunes, lista]) => (
          <div key={lunes} style={{ marginBottom:12 }}>
            <div style={{ fontSize:11.5, color:'var(--text3)', marginBottom:6 }}>Semana del {fechaCorta(lunes)}</div>
            {lista.map(c => (
              <div key={c.id} className="mk-pub" onClick={() => setEditando(c)} style={{ cursor:'pointer', display:'flex', gap:10, alignItems:'center', padding:'8px 10px', borderRadius:8, background:'var(--bg4)', marginBottom:5, borderLeft:`3px solid ${ESTADO[c.estado]?.[1]}` }}>
                <span style={{ width:58, fontSize:12, color: c.fecha < hoy && c.estado !== 'publicado' ? 'var(--red)' : 'var(--text3)' }}>{fechaCorta(c.fecha)}</span>
                <span style={{ flex:1, minWidth:0, fontSize:13, color:'var(--text)' }}>{c.tema}<span style={{ fontSize:11, color:'var(--text3)' }}> · {REDES[c.red] || c.red} · {c.formato}</span></span>
                {c.copy && <button onClick={ev => { ev.stopPropagation(); copiar(c.copy).then(() => { setCopiado(c.id); setTimeout(() => setCopiado(null), 1500) }) }} className="btn" style={{ width:'auto', fontSize:11, padding:'2px 8px' }}>{copiado === c.id ? '✓' : 'Copiar texto'}</button>}
                <span style={{ fontSize:11.5, color: ESTADO[c.estado]?.[1], whiteSpace:'nowrap' }}>{ESTADO[c.estado]?.[0]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {editando && <ModalContenido c={editando} campanas={campanas} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio() }} />}
    </>
  )
}
function ModalContenido({ c, campanas, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...c })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.tema?.trim()) return setError('Escribe el tema.')
    const { id, created_at, ...d } = f
    const datos = { ...d, campana_id: d.campana_id || null, alcance: d.alcance ? Math.round(n2(d.alcance)) : null, interacciones: d.interacciones ? Math.round(n2(d.interacciones)) : null, mensajes: d.mensajes ? Math.round(n2(d.mensajes)) : null }
    const r = id ? await supabase.from('lrm_contenidos').update(datos).eq('id', id) : await supabase.from('lrm_contenidos').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_contenidos').delete().eq('id', f.id); onGuardado() }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:540, maxHeight:'92vh', overflowY:'auto', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:12 }}>{f.id ? 'Publicación' : 'Nueva publicación'}</div>
        <div className="grid-2" style={{ gap:10 }}>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Tema</Etiqueta><input id="mk-ct-tema" value={f.tema || ''} onChange={set('tema')} style={iStyle} /></div>
          <div><Etiqueta>Fecha</Etiqueta><input type="date" value={f.fecha || ''} onChange={set('fecha')} style={iStyle} /></div>
          <div><Etiqueta>Estado</Etiqueta><select id="mk-ct-estado" value={f.estado} onChange={set('estado')} style={iStyle}><option value="idea">Idea</option><option value="listo">Listo para publicar</option><option value="publicado">Publicado</option></select></div>
          <div><Etiqueta>Red</Etiqueta><select value={f.red} onChange={set('red')} style={iStyle}>{Object.entries(REDES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><Etiqueta>Formato</Etiqueta><select value={f.formato} onChange={set('formato')} style={iStyle}>{FORMATOS.map(x => <option key={x}>{x}</option>)}</select></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Texto de la publicación</Etiqueta><textarea value={f.copy || ''} onChange={set('copy')} style={{ ...iStyle, minHeight:90, resize:'vertical' }} /></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Campaña (opcional)</Etiqueta><select value={f.campana_id || ''} onChange={set('campana_id')} style={iStyle}><option value="">—</option>{campanas.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></div>
          {f.estado === 'publicado' && <>
            <div><Etiqueta>Link</Etiqueta><input value={f.link || ''} onChange={set('link')} style={iStyle} /></div>
            <div><Etiqueta>Alcance</Etiqueta><input inputMode="numeric" value={f.alcance ?? ''} onChange={set('alcance')} style={iStyle} /></div>
            <div><Etiqueta>Interacciones</Etiqueta><input inputMode="numeric" value={f.interacciones ?? ''} onChange={set('interacciones')} style={iStyle} /></div>
            <div><Etiqueta>Mensajes que generó</Etiqueta><input inputMode="numeric" value={f.mensajes ?? ''} onChange={set('mensajes')} style={iStyle} /></div>
          </>}
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="mk-ct-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro?' : 'Borrar'}</button>}
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Seguimientos (secuencias) ───────────────────────────────────────────────
// Cada paso deja la "próxima acción" del cliente en el CRM, así sale en el Inicio el día que toca
export const pasoActual = x => { const s = SECUENCIAS[x.secuencia]; return s ? s.pasos[x.secuencia_paso || 0] : null }
function Seguimientos({ clientes, onCambio }) {
  const [sec, setSec] = useState('prospecto')
  const [elegir, setElegir] = useState('')
  const [aviso, setAviso] = useState('')
  const enSec = clientes.filter(x => x.secuencia && SECUENCIAS[x.secuencia])
  const hoy = hoyISO()
  const poner = async (cliente, id, paso = 0) => {
    const s = SECUENCIAS[id], desde = cliente.secuencia === id && cliente.secuencia_desde ? cliente.secuencia_desde : hoy
    const p = s.pasos[paso]
    const r = await supabase.from('lrm_clientes').update({ secuencia: id, secuencia_paso: paso, secuencia_desde: desde, proxima_accion: `${s.l}: ${p.accion}`, fecha_accion: masDias(desde, p.dia) }).eq('id', cliente.id)
    if (r.error) return setAviso(/secuencia/.test(r.error.message) ? 'Corre en Supabase el archivo 23_lrm_marketing.sql.' : r.error.message)
    onCambio()
  }
  const avanzar = async x => {
    const s = SECUENCIAS[x.secuencia], sig = (x.secuencia_paso || 0) + 1
    await supabase.from('lrm_contactos').insert({ cliente_id: x.id, tipo:'whatsapp', resumen: `${s.l}: ${pasoActual(x)?.accion}` })
    if (sig >= s.pasos.length) { await supabase.from('lrm_clientes').update({ secuencia: null, secuencia_paso: null, secuencia_desde: null, proxima_accion: null, fecha_accion: null }).eq('id', x.id); setAviso(`✓ ${x.nombre} terminó la secuencia.`); return onCambio() }
    await poner(x, x.secuencia, sig)
  }
  const quitar = async x => { await supabase.from('lrm_clientes').update({ secuencia: null, secuencia_paso: null, secuencia_desde: null }).eq('id', x.id); onCambio() }
  const s = SECUENCIAS[sec]
  const disponibles = clientes.filter(x => !x.secuencia && x.estado !== 'perdido')
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap:14, alignItems:'start' }}>
      <div className="panel">
        <Titulo>SECUENCIAS DE SEGUIMIENTO</Titulo>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>{Object.entries(SECUENCIAS).map(([k, v]) => <button key={k} onClick={() => setSec(k)} className={sec === k ? 'btn-gold' : 'btn'} style={{ width:'auto', fontSize:12 }}>{v.l}</button>)}</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>{s.d}</div>
        {s.pasos.map((p, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ width:48, fontSize:11.5, color:'var(--gold)', flexShrink:0 }}>Día {p.dia}</span>
            <div><div style={{ fontSize:12.5, color:'var(--text)', fontWeight:700 }}>{p.accion}</div><div style={{ fontSize:11.5, color:'var(--text3)' }}>{p.mensaje}</div></div>
          </div>
        ))}
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <select id="mk-sec-cliente" value={elegir} onChange={e => setElegir(e.target.value)} style={{ ...iStyle, marginTop:0 }}><option value="">Poner a un cliente en esta secuencia…</option>{disponibles.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
          <button id="mk-sec-poner" onClick={() => { const x = clientes.find(c => c.id === elegir); if (x) { poner(x, sec); setElegir('') } }} disabled={!elegir} className="btn-gold" style={{ width:'auto' }}>▶ Empezar</button>
        </div>
      </div>
      <div className="panel">
        <Titulo>EN SEGUIMIENTO ({enSec.length})</Titulo>
        {aviso && <div style={{ fontSize:12, color: aviso.startsWith('✓') ? 'var(--green)' : '#E8A23A', marginBottom:8 }}>{aviso}</div>}
        {enSec.length === 0 ? <Vacio>Nadie en seguimiento. Pon a tus prospectos en una secuencia y el Inicio te dice a quién escribirle cada día.</Vacio> :
          [...enSec].sort((a, b) => (a.fecha_accion || '').localeCompare(b.fecha_accion || '')).map(x => {
            const sq = SECUENCIAS[x.secuencia], p = pasoActual(x), toca = x.fecha_accion && x.fecha_accion <= hoy
            const link = x.telefono && p ? linkWhatsApp(x.telefono, x.nombre, llenar(p.mensaje, x)) : null
            return (
              <div key={x.id} className="mk-seg-cli" style={{ padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:13, color:'var(--text)', fontWeight:700 }}>{x.nombre}</div>
                    <div style={{ fontSize:11.5, color: toca ? 'var(--gold)' : 'var(--text3)' }}>{sq.l} · paso {(x.secuencia_paso || 0) + 1} de {sq.pasos.length}: {p?.accion} · {toca ? (x.fecha_accion < hoy ? `atrasado desde ${fechaCorta(x.fecha_accion)}` : 'hoy') : fechaCorta(x.fecha_accion)}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {link && <a href={link} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366', fontSize:11.5 }}>💬</a>}
                    <button onClick={() => avanzar(x)} className="btn mk-sec-hecho" style={{ width:'auto', fontSize:11.5 }}>✓ Hecho</button>
                    <button onClick={() => quitar(x)} title="Sacar de la secuencia" className="btn" style={{ width:'auto', fontSize:11, color:'var(--text4)' }}>×</button>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ── Referidos ───────────────────────────────────────────────────────────────
const codigoDe = x => (String(x.nombre || 'LRM').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'LRM') + String(Math.floor(100 + Math.random() * 900))
function Referidos({ clientes, movs, config, onConfig, onCambio }) {
  const [beneficio, setBeneficio] = useState(config.beneficio || '10% de descuento en tu próximo envío por cada referido que se vuelva cliente')
  const [paraElReferido, setParaElReferido] = useState(config.referido || 'precio especial en tu primer envío')
  const [asignar, setAsignar] = useState({ nuevo:'', quien:'' })
  const [aviso, setAviso] = useState('')
  const { empresa } = useDatosLRM()
  const activos = clientes.filter(x => x.estado === 'activo')
  const facturado = id => movs.filter(m => m.cliente_id === id).reduce((s, m) => s + Number(m.monto || 0), 0)
  const referidosDe = id => clientes.filter(x => x.referido_por_id === id)
  const ranking = clientes.filter(x => referidosDe(x.id).length).map(x => ({ ...x, refs: referidosDe(x.id), convertidos: referidosDe(x.id).filter(r => facturado(r.id) > 0) })).sort((a, b) => b.convertidos.length - a.convertidos.length || b.refs.length - a.refs.length)
  const generar = async () => {
    const sin = clientes.filter(x => !x.codigo_referido && x.estado === 'activo')
    for (const x of sin) await supabase.from('lrm_clientes').update({ codigo_referido: codigoDe(x) }).eq('id', x.id)
    setAviso(`✓ ${sin.length} códigos creados.`); onCambio()
  }
  const mensaje = x => `Hola ${String(x.nombre || '').split(' ')[0]} 🙌 Gracias por confiar en ${empresa.nombre}. Si conoces a alguien que importe, compártele tu código *${x.codigo_referido}*: él recibe ${paraElReferido} y tú ${beneficio}. Que me escriba aquí y me diga tu código.`
  const amarrar = async () => {
    if (!asignar.nuevo || !asignar.quien || asignar.nuevo === asignar.quien) return
    await supabase.from('lrm_clientes').update({ referido_por_id: asignar.quien, fuente:'referido', referido_por: clientes.find(c => c.id === asignar.quien)?.nombre }).eq('id', asignar.nuevo)
    setAsignar({ nuevo:'', quien:'' }); setAviso('✓ Referido registrado.'); onCambio()
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap:14, alignItems:'start' }}>
      <div className="panel">
        <Titulo>EL PROGRAMA</Titulo>
        <Etiqueta>Lo que gana quien refiere</Etiqueta><input id="mk-ref-beneficio" value={beneficio} onChange={e => setBeneficio(e.target.value)} onBlur={() => onConfig({ beneficio, referido: paraElReferido })} style={iStyle} />
        <div style={{ height:8 }} />
        <Etiqueta>Lo que gana el nuevo cliente</Etiqueta><input value={paraElReferido} onChange={e => setParaElReferido(e.target.value)} onBlur={() => onConfig({ beneficio, referido: paraElReferido })} style={iStyle} />
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          <button id="mk-ref-codigos" onClick={generar} className="btn-gold" style={{ width:'auto' }}>Crear códigos a mis clientes activos</button>
        </div>
        {aviso && <div style={{ fontSize:12, color:'var(--green)', marginTop:8 }}>{aviso}</div>}
        <div style={{ marginTop:14 }}><Etiqueta>Registrar quién trajo a quién</Etiqueta>
          <div className="grid-2" style={{ gap:8 }}>
            <select id="mk-ref-nuevo" value={asignar.nuevo} onChange={e => setAsignar(p => ({ ...p, nuevo: e.target.value }))} style={iStyle}><option value="">Cliente nuevo…</option>{clientes.filter(x => !x.referido_por_id).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
            <select id="mk-ref-quien" value={asignar.quien} onChange={e => setAsignar(p => ({ ...p, quien: e.target.value }))} style={iStyle}><option value="">Lo refirió…</option>{clientes.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.codigo_referido ? ` · ${x.codigo_referido}` : ''}</option>)}</select>
          </div>
          <button id="mk-ref-amarrar" onClick={amarrar} className="btn" style={{ width:'auto', marginTop:8 }}>Guardar</button>
        </div>
      </div>
      <div className="panel">
        <Titulo>MANDA TU CÓDIGO · {activos.filter(x => x.codigo_referido).length} clientes con código</Titulo>
        {activos.filter(x => x.codigo_referido).length === 0 ? <Vacio>Crea los códigos y mándale a cada cliente su mensaje de referidos.</Vacio> : activos.filter(x => x.codigo_referido).map(x => {
          const link = x.telefono ? linkWhatsApp(x.telefono, x.nombre, mensaje(x)) : null
          return (
            <div key={x.id} className="mk-ref" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:13, color:'var(--text)' }}>{x.nombre}<div style={{ fontSize:11.5, color:'var(--gold)' }}>{x.codigo_referido} · {referidosDe(x.id).length} referido{referidosDe(x.id).length === 1 ? '' : 's'}</div></div>
              {link ? <a href={link} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366', fontSize:11.5 }}>💬 Mandar código</a> : <span style={{ fontSize:11, color:'var(--text4)' }}>sin WhatsApp</span>}
            </div>
          )
        })}
        {ranking.length > 0 && <>
          <div style={{ height:14 }} /><Titulo>QUIÉN TE TRAE MÁS CLIENTES</Titulo>
          {ranking.map((x, i) => (
            <div key={x.id} style={{ fontSize:12.5, color:'var(--text2)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <b style={{ color:'var(--text)' }}>{i + 1}. {x.nombre}</b> · {x.refs.length} referidos · <span style={{ color:'var(--green)' }}>{x.convertidos.length} ya compraron</span>
              <div style={{ fontSize:11.5, color:'var(--text3)' }}>{x.refs.map(r => `${r.nombre}${facturado(r.id) > 0 ? ' ✓' : ''}`).join(' · ')}</div>
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}

// ── Fuentes y embudo ────────────────────────────────────────────────────────
function Fuentes({ clientes, movs, campanas }) {
  const facturado = id => movs.filter(m => m.cliente_id === id).reduce((s, m) => s + Number(m.monto || 0), 0)
  const filas = [...Object.entries(FUENTES).map(([k, f]) => [k, f]), ['', { l:'Sin fuente', icono:'❔' }]].map(([k, f]) => {
    const cs = clientes.filter(x => (x.fuente || '') === k)
    const activos = cs.filter(x => x.estado === 'activo')
    return { k, f, total: cs.length, activos: activos.length, conv: cs.length ? activos.length / cs.length * 100 : 0, facturado: cs.reduce((s, x) => s + facturado(x.id), 0) }
  }).filter(x => x.total)
  const maxF = Math.max(1, ...filas.map(x => x.facturado))
  const etapas = ['prospecto', 'conversacion', 'propuesta', 'activo']
  const nEtapa = e => clientes.filter(x => x.estado === e).length
  const llegaron = etapas.map((e, i) => clientes.filter(x => etapas.indexOf(x.estado) >= i).length)
  const inversion = campanas.filter(c => c.tipo === 'meta').reduce((s, c) => s + Number(c.invertido || 0), 0)
  const deMeta = clientes.filter(x => x.fuente === 'meta' && x.estado === 'activo').length
  const meses = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7) })
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14, alignItems:'start' }}>
        <div className="panel">
          <Titulo>DE DÓNDE LLEGAN TUS CLIENTES</Titulo>
          {filas.length === 0 ? <Vacio>Marca en cada cliente del CRM cómo llegó ("¿Cómo llegó?") y aquí ves qué canal te trae más.</Vacio> : filas.sort((a, b) => b.facturado - a.facturado || b.total - a.total).map(x => (
            <div key={x.k || 'sin'} className="mk-fuente" style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:'var(--text)' }}>{x.f.icono} {x.f.l}</span><b style={{ color:'var(--gold)' }}>{cop(x.facturado)}</b></div>
              <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', margin:'5px 0' }}><div style={{ width:`${x.facturado / maxF * 100}%`, height:'100%', borderRadius:3, background:'var(--gold)' }} /></div>
              <div style={{ fontSize:11.5, color:'var(--text3)' }}>{x.total} contacto{x.total === 1 ? '' : 's'} · {x.activos} cliente{x.activos === 1 ? '' : 's'} · {fmt(x.conv)}% se vuelven clientes</div>
            </div>
          ))}
        </div>
        <div className="panel">
          <Titulo>EMBUDO DE VENTAS</Titulo>
          {etapas.map((e, i) => {
            const est = ESTADOS_CLIENTE.find(x => x.id === e), w = llegaron[0] ? llegaron[i] / llegaron[0] * 100 : 0
            return (
              <div key={e} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}><span style={{ color:'var(--text2)' }}>{est?.nombre} <b style={{ color:'var(--text)' }}>{nEtapa(e)}</b></span><span style={{ color:'var(--text3)' }}>{i ? `${fmt(llegaron[i - 1] ? llegaron[i] / llegaron[i - 1] * 100 : 0)}% pasa` : `${llegaron[0]} en total`}</span></div>
                <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.05)', marginTop:4 }}><div style={{ width:`${w}%`, height:'100%', borderRadius:5, background: est?.color }} /></div>
              </div>
            )
          })}
          <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:6 }}>Perdidos: {nEtapa('perdido')}. "% pasa" es cuántos de la etapa anterior llegan a esta.</div>
          {inversion > 0 && <div style={{ marginTop:12, padding:'10px 12px', borderRadius:10, background:'var(--bg4)', fontSize:12.5, color:'var(--text2)' }}>📣 Pauta Meta: invertiste <b style={{ color:'var(--text)' }}>{cop(inversion)}</b> y llegaron <b style={{ color:'var(--text)' }}>{deMeta}</b> clientes{deMeta ? ` · ${cop(inversion / deMeta)} por cliente` : ''}.</div>}
        </div>
      </div>
      <div className="panel">
        <Titulo>CONTACTOS NUEVOS POR MES</Titulo>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:110, borderBottom:'1px solid var(--border2)' }}>
          {meses.map(m => { const n = clientes.filter(x => (x.created_at || '').slice(0, 7) === m).length, max = Math.max(1, ...meses.map(mm => clientes.filter(x => (x.created_at || '').slice(0, 7) === mm).length)); return (
            <div key={m} title={`${m}: ${n} contactos nuevos`} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', height:'100%' }}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:3 }}>{n || ''}</div>
              <div style={{ width:'100%', maxWidth:36, height: Math.max(2, n / max * 90), borderRadius:'4px 4px 0 0', background:'var(--gold)' }} />
            </div>
          ) })}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:4 }}>{meses.map(m => <div key={m} style={{ flex:1, textAlign:'center', fontSize:10.5, color:'var(--text3)' }}>{new Date(m + '-15').toLocaleDateString('es-CO', { month:'short' })}</div>)}</div>
      </div>
    </div>
  )
}