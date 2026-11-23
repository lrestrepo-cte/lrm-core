// @ts-nocheck
// LRM Trade Consulting · Portal de clientes (#/clientes)
// El cliente entra con el usuario y la clave que le creaste en el CRM.
// Ve sus envíos, sus cotizaciones (y las acepta), su estado de cuenta y sus documentos.
// Todo llega por la función lrm_portal (SQL 22): solo lo suyo, sin costos ni márgenes.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { C, fecha, Caja, Carga, Consolidado, Servicio, SEMAFORO, Etiqueta, entregadaEn, recienEntregada } from './Rastreo'

export const DOMINIO_CLIENTES = 'clientes.lrmcore.app'
const correoCliente = u => { const t = String(u || '').trim().toLowerCase(); return t.includes('@') ? t : `${t}@${DOMINIO_CLIENTES}` }
const cop = n => '$' + Math.round(Number(n || 0)).toLocaleString('es-CO')
const n = v => Number(v || 0)
const plural = u => { const t = String(u || ''); return !t || /s$/.test(t) ? t : /[aeiouáéíóú]$/i.test(t) ? t + 's' : t + 'es' }
const PAGOS = { anticipo_50:'50% para programar y 50% al terminar', anticipo_100:'100% anticipado para programar', contra_entrega:'Pago contra entrega', credito:'Crédito según lo acordado' }
const TIPOS_DOC = { factura:'🧾 Factura comercial', packing:'📋 Lista de empaque', bl:'🚢 BL / guía master', dim:'🏛️ DIM / declaración', guia:'📄 Guía / remesa', foto:'📷 Foto', soporte_pago:'💵 Soporte de pago', otro:'📎 Documento' }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
const fuente = "'Plus Jakarta Sans', system-ui, sans-serif"
const input = { width:'100%', padding:'13px 14px', borderRadius:12, border:`1px solid ${C.linea}`, background:'#fff', fontSize:15, fontFamily:fuente, color:C.tinta, outline:'none', boxSizing:'border-box' }
const boton = { width:'100%', padding:'14px', borderRadius:12, border:'none', background:C.tinta, color:'#fff', fontSize:15, fontWeight:700, fontFamily:fuente, cursor:'pointer' }

export default function PortalCliente() {
  const [estado, setEstado] = useState('revisando')   // revisando | login | dentro
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data, error } = await supabase.rpc('lrm_portal')
    if (error || !data) { setError(error ? 'No pudimos cargar tu información. Intenta de nuevo.' : 'Este usuario no tiene acceso al portal de clientes.'); setEstado('login'); return false }
    setD(data); setEstado('dentro'); return true
  }
  useEffect(() => {
    document.title = 'Portal de clientes · LRM Trade Consulting'
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) { const ok = await cargar(); if (!ok) setError('') } else setEstado('login')
    })
  }, [])
  const salir = async () => { await supabase.auth.signOut(); setD(null); setEstado('login') }

  return (
    <div id="pc-scroll" style={{ height:'100dvh', overflowY:'auto', WebkitOverflowScrolling:'touch', overscrollBehavior:'contain', background:C.fondo, color:C.tinta, fontFamily:fuente }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(48px + env(safe-area-inset-bottom, 0px))' }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:24 }}>
          <img src="/marca/logo-documento.png" alt="LRM Trade Consulting" style={{ height:44, maxWidth:'58%', objectFit:'contain' }} />
          {estado === 'dentro' ? <button id="pc-salir" onClick={salir} style={{ background:'none', border:`1px solid ${C.linea}`, borderRadius:999, padding:'7px 12px', fontSize:12.5, color:C.suave, cursor:'pointer', fontFamily:fuente }}>Salir</button>
            : <span style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:C.oro }}>CLIENTES</span>}
        </header>
        {estado === 'revisando' && <Caja><div style={{ color:C.suave, fontSize:14 }}>Cargando…</div></Caja>}
        {estado === 'login' && <Login error={error} setError={setError} onEntrar={cargar} />}
        {estado === 'dentro' && d && <Panel d={d} recargar={cargar} />}
        <footer style={{ textAlign:'center', marginTop:36, fontSize:12, color:C.suave }}>
          <div style={{ fontWeight:700, color:C.oro }}>We bring it. Safe and on time.</div>
          <div style={{ marginTop:4 }}>{d?.empresa?.nombre || 'LRM Trade Consulting'} · Barranquilla, Colombia</div>
        </footer>
      </div>
    </div>
  )
}

function Login({ error, setError, onEntrar }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [entrando, setEntrando] = useState(false)
  const entrar = async e => {
    e?.preventDefault()
    if (!usuario.trim() || !clave) return setError('Escribe tu usuario y tu clave.')
    setEntrando(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: correoCliente(usuario), password: clave })
    if (error) { setEntrando(false); return setError('Usuario o clave incorrectos.') }
    supabase.rpc('lrm_portal_entro').then(() => {})
    const ok = await onEntrar()
    if (!ok) await supabase.auth.signOut()
    setEntrando(false)
  }
  return (
    <Caja pad="24px">
      <h1 style={{ fontSize:24, fontWeight:800, margin:'0 0 4px', letterSpacing:-0.5 }}>Portal de clientes</h1>
      <p style={{ fontSize:14, color:C.suave, margin:'0 0 20px' }}>Tus envíos, cotizaciones, pagos y documentos en un solo lugar.</p>
      <form onSubmit={entrar} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <input id="pc-usuario" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Usuario" autoCapitalize="none" autoComplete="username" style={input} />
        <input id="pc-clave" type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="Clave" autoComplete="current-password" style={input} />
        {error && <div id="pc-error" style={{ fontSize:13, color:'#B4442F' }}>{error}</div>}
        <button id="pc-entrar" type="submit" disabled={entrando} style={{ ...boton, opacity: entrando ? 0.6 : 1 }}>{entrando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <div style={{ fontSize:12.5, color:C.suave, marginTop:14 }}>¿No tienes usuario o se te olvidó la clave? Escríbenos por WhatsApp y te ayudamos.</div>
    </Caja>
  )
}

function Panel({ d, recargar }) {
  const cotizaciones = d.cotizaciones || []
  const pendientes = cotizaciones.filter(c => c.estado === 'cotizado')
  const cuenta = d.cuenta || []
  const cargado = cuenta.filter(m => m.tipo === 'cobro_cliente').reduce((s, m) => s + n(m.monto), 0)
  const pagado = cuenta.filter(m => m.tipo === 'abono_cliente').reduce((s, m) => s + n(m.monto), 0)
  const saldo = Math.max(0, cargado - pagado)
  const enCurso = (d.cargas || []).filter(c => c.etapa !== 'entregada').length + (d.consolidados || []).filter(x => x.estado !== 'entregado').length + (d.servicios || []).filter(x => x.activo).length
  const cobros = aplicarPagos(cuenta)
  const historial = armarHistorial(d)
  const [tab, setTab] = useState(pendientes.length ? 'cotizaciones' : 'envios')
  const irA = t => { setTab(t); document.getElementById('pc-scroll')?.scrollTo({ top:0, behavior:'smooth' }) }
  const wa = d.empresa?.whatsapp ? `https://wa.me/${(String(d.empresa.whatsapp).replace(/\D/g, '').length === 10 ? '57' : '') + String(d.empresa.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, soy ${d.nombre}. `)}` : null
  const TABS = [['envios', 'Mis envíos', enCurso], ['entregadas', 'Entregadas', historial.length], ['cotizaciones', 'Cotizaciones', pendientes.length], ['cuenta', 'Estado de cuenta', saldo > 1 ? '!' : 0], ['documentos', 'Documentos', (d.documentos || []).length]]
  return (
    <>
      <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px', letterSpacing:-0.5 }}>Hola, {String(d.nombre || '').split(' ')[0]}</h1>
      <p style={{ fontSize:14, color:C.suave, margin:'0 0 16px' }}>
        {enCurso ? `${enCurso} envío${enCurso === 1 ? '' : 's'} en curso` : 'Sin envíos en curso'}{pendientes.length ? ` · ${pendientes.length} cotización${pendientes.length === 1 ? '' : 'es'} por aprobar` : ''}{saldo > 1 ? ` · saldo ${cop(saldo)}` : ''}
      </p>
      <nav style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:16, paddingBottom:2 }}>
        {TABS.map(([id, l, badge]) => (
          <button key={id} id={`pc-tab-${id}`} onClick={() => irA(id)} style={{ flexShrink:0, padding:'9px 14px', borderRadius:999, border:`1px solid ${tab === id ? C.tinta : C.linea}`, background: tab === id ? C.tinta : '#fff', color: tab === id ? '#fff' : C.tinta, fontSize:13, fontWeight:700, fontFamily:fuente, cursor:'pointer' }}>
            {l}{badge ? <span style={{ marginLeft:6, fontSize:11, padding:'1px 6px', borderRadius:999, background: tab === id ? C.oro : C.oroClaro, color: tab === id ? '#fff' : '#7A5E14' }}>{badge}</span> : null}
          </button>
        ))}
      </nav>

      {tab === 'envios' && <Envios d={d} entregadas={historial.length} irA={irA} />}
      {tab === 'entregadas' && <Entregadas d={d} lista={historial} cobros={cobros} />}
      {tab === 'cotizaciones' && <Cotizaciones lista={cotizaciones} recargar={recargar} />}
      {tab === 'cuenta' && <Cuenta d={d} cargado={cargado} pagado={pagado} saldo={saldo} cobros={cobros} />}
      {tab === 'documentos' && <Docs docs={d.documentos || []} wa={wa} />}

      {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ display:'block', textAlign:'center', marginTop:22, padding:'14px', borderRadius:12, background:'#fff', border:`1px solid ${C.linea}`, color:C.tinta, textDecoration:'none', fontWeight:700, fontSize:14 }}>💬 Escríbenos por WhatsApp</a>}
    </>
  )
}

// Pagos: los abonos del cliente cubren los cobros del más viejo al más nuevo
function aplicarPagos(cuenta) {
  let disponible = cuenta.filter(m => m.tipo === 'abono_cliente').reduce((t, m) => t + n(m.monto), 0)
  return cuenta.filter(m => m.tipo === 'cobro_cliente').map(m => {
    const cubre = Math.min(n(m.monto), disponible); disponible -= cubre
    const pendiente = Math.max(0, n(m.monto) - cubre)
    return { ...m, pendiente, estadoPago: pendiente < 1 ? 'pagado' : cubre > 0 ? 'abonado' : 'pendiente' }
  })
}
// Estado de pago de un envío (por su WR, consolidado o SRV)
function pagoDe(cobros, de) {
  const suyos = cobros.filter(m => m.de && m.de === de)
  if (!suyos.length) return null
  const pend = suyos.reduce((t, m) => t + m.pendiente, 0), total = suyos.reduce((t, m) => t + n(m.monto), 0)
  return { total, pendiente: pend, estado: pend < 1 ? 'pagado' : pend < total ? 'abonado' : 'pendiente' }
}
const ESTADO_PAGO = { pagado:['✓ Pagado', '#E4F3EA', '#1F5F3B'], abonado:['Abonado', '#FFF3C7', '#6E5300'], pendiente:['Por pagar', '#FBE7E3', '#9A3A26'] }
const Pago = ({ p }) => {
  if (!p) return null
  const e = ESTADO_PAGO[p.estado]
  return <span style={{ fontSize:11.5, fontWeight:700, padding:'4px 9px', borderRadius:999, background:e[1], color:e[2], whiteSpace:'nowrap' }}>{e[0]}{p.estado !== 'pagado' ? ` · ${cop(p.pendiente)}` : ''}</span>
}

// Todo lo entregado, del más viejo al más nuevo (el orden da el consecutivo)
function armarHistorial(d) {
  const base = Array.isArray(d.historial) ? d.historial : [
    ...(d.cargas || []).filter(c => c.etapa === 'entregada').map(c => ({ tipo:'carga', de:`WR ${c.guia}`, titulo:c.descripcion || 'Mercancía', piezas:c.piezas, kg:c.kg, modalidad:c.modalidad, recibido:c.fecha_recibo, salida:c.fecha_salida, entregado:entregadaEn(c) })),
    ...(d.consolidados || []).filter(x => x.estado === 'entregado').map(x => ({ tipo:'consolidado', de:x.nombre, titulo:`${x.origen || ''} → ${x.destino || ''}`, modalidad:'maritimo', recibido:x.fecha_cierre, salida:x.etd, entregado:(x.hitos || []).filter(h => h.hito === 'entregado').pop()?.fecha || x.eta })),
    ...(d.servicios || []).filter(x => x.estado === 'completado').map(x => ({ tipo:'servicio', de:`SRV-${String(x.numero || '').padStart(4, '0')}`, titulo:x.titulo || 'Servicio', modalidad:'terrestre', recibido:x.fecha, entregado:x.fecha })),
  ]
  return [...base].sort((a, b) => String(a.entregado || '').localeCompare(String(b.entregado || ''))).map((h, i) => ({ ...h, n: i + 1 }))
}
const dias = (a, b) => { if (!a || !b) return null; const x = new Date(String(a).slice(0, 10) + 'T12:00:00'), y = new Date(String(b).slice(0, 10) + 'T12:00:00'); return Math.max(0, Math.round((y - x) / 86400000)) }
const kgTxt = v => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })
const MODAL = { maritimo:'Marítimo', aereo:'Aéreo', terrestre:'Terrestre' }

function Envios({ d, entregadas, irA }) {
  // Lo entregado se queda aquí 24 horas y después pasa a "Entregadas"
  const srv = (d.servicios || []).filter(x => x.activo)
  const cons = (d.consolidados || []).filter(x => x.estado !== 'entregado' || recienEntregada((x.hitos || []).filter(h => h.hito === 'entregado').pop()?.fecha))
  const cargas = (d.cargas || []).filter(c => c.etapa !== 'entregada' || recienEntregada(entregadaEn(c)))
  const vacio = !srv.length && !cons.length && !cargas.length
  return (
    <>
      {vacio && <Caja><div style={{ fontSize:14, color:C.suave }}>{entregadas ? 'No tienes envíos en curso en este momento.' : 'Todavía no tienes envíos con nosotros.'}</div></Caja>}
      {!vacio && <Semaforo />}
      {srv.map(x => <Servicio key={'s' + x.numero} x={x} />)}
      {cons.map((x, k) => <Consolidado key={'c' + k} x={x} />)}
      {cargas.map(c => <Carga key={c.guia + c.fecha_recibo} c={c} />)}
      {entregadas > 0 && (
        <button id="pc-ver-entregadas" onClick={() => irA('entregadas')} style={{ ...boton, marginTop:6, background:'#fff', color:C.tinta, border:`1px solid ${C.linea}` }}>
          ✓ Ver mis {entregadas} entrega{entregadas === 1 ? '' : 's'} →
        </button>
      )}
    </>
  )
}
// Guía de colores
function Semaforo() {
  const L = [['bodega', 'En bodega'], ['transito', 'En camino'], ['aduana', 'Aduana'], ['destino', 'Lista'], ['entregada', 'Entregada']]
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', margin:'0 2px 12px', fontSize:11.5, color:C.suave }}>
      {L.map(([f, l]) => <span key={f} style={{ display:'inline-flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius:5, background:SEMAFORO[f].c }} />{l}</span>)}
    </div>
  )
}

function Entregadas({ d, lista, cobros }) {
  const [buscar, setBuscar] = useState('')
  if (!lista.length) return <Caja><div style={{ fontSize:14, color:C.suave }}>Aquí va a quedar el registro de todo lo que te entreguemos.</div></Caja>
  const q = buscar.trim().toLowerCase()
  const vista = [...lista].reverse().filter(h => !q || [h.de, h.titulo, h.referencia, `#${h.n}`].join(' ').toLowerCase().includes(q))
  const totKg = lista.reduce((t, h) => t + n(h.kg), 0), totPiezas = lista.reduce((t, h) => t + n(h.piezas), 0)
  const num = k => '#' + String(k).padStart(3, '0')
  const pdf = () => {
    const hoy = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
    const filas = [...lista].reverse().map(h => { const p = pagoDe(cobros, h.de); return `<tr><td>${num(h.n)}</td><td><b>${esc(h.de)}</b><br>${esc(h.titulo || '')}${h.referencia ? `<br><span style="color:#777">Ref. ${esc(h.referencia)}</span>` : ''}</td><td>${h.piezas ? esc(h.piezas) : ''}${n(h.kg) ? ` · ${kgTxt(h.kg)} kg` : ''}</td><td>${h.recibido ? fecha(String(h.recibido).slice(0, 10)) : ''}</td><td>${h.entregado ? fecha(String(h.entregado).slice(0, 10)) : ''}</td><td>${p ? ESTADO_PAGO[p.estado][0] + (p.estado !== 'pagado' ? ' ' + cop(p.pendiente) : '') : ''}</td></tr>` }).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Historial de entregas · ${esc(d.nombre)}</title><style>
      @page{size:letter;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;font-size:11px;margin:0;padding:20px}
      .top{display:flex;justify-content:space-between;border-bottom:2px solid #C9A84C;padding-bottom:10px}.t{font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700;text-align:right}
      table{width:100%;border-collapse:collapse;margin-top:14px}th{text-align:left;font-size:9.5px;text-transform:uppercase;color:#777;padding:6px;border-bottom:1.5px solid #1b1b1b}td{padding:6px;border-bottom:1px solid #f0eadb;vertical-align:top}</style></head><body>
      <div class="top"><div><img src="${location.origin}/marca/logo-documento.png" style="height:54px"></div>
      <div class="t">HISTORIAL DE ENTREGAS<div style="font-size:15px;color:#1b1b1b;letter-spacing:0;margin-top:4px">${esc(d.nombre)}</div><div style="font-weight:400;color:#555;letter-spacing:0">${hoy} · ${lista.length} entregas${totKg ? ` · ${kgTxt(totKg)} kg` : ''}</div></div></div>
      <table><thead><tr><th>#</th><th>Envío</th><th>Piezas / peso</th><th>Recibido</th><th>Entregado</th><th>Pago</th></tr></thead><tbody>${filas}</tbody></table>
      <p style="color:#8a6d1f;font-weight:700;text-align:right">We bring it. Safe and on time.</p></body></html>`
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close()
  }
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8, marginBottom:12 }}>
        {[['Entregas', lista.length.toLocaleString('es-CO')], ['Piezas', totPiezas ? totPiezas.toLocaleString('es-CO') : '—'], ['Peso', totKg ? `${kgTxt(totKg)} kg` : '—']].map(([l, v]) => (
          <div key={l} style={{ background:'#fff', border:`1px solid ${C.linea}`, borderRadius:14, padding:'12px 10px', minWidth:0 }}>
            <div style={{ fontSize:11, color:C.suave }}>{l}</div>
            <div style={{ fontSize:'clamp(12px, 3.4vw, 16px)', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
          </div>
        ))}
      </div>
      <input id="pc-buscar" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por WR, factura o descripción" style={{ ...input, marginBottom:12, fontSize:16 }} />
      {vista.length === 0 && <Caja><div style={{ fontSize:14, color:C.suave }}>Nada coincide con “{buscar}”.</div></Caja>}
      {vista.map(h => {
        const p = pagoDe(cobros, h.de), t = dias(h.recibido, h.entregado)
        return (
          <Caja key={h.tipo + h.de + h.n} acento={SEMAFORO.entregada.c} pad="14px 16px">
            <div className="pc-entrega" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:C.suave }}><b style={{ color:C.oro }}>{num(h.n)}</b> · {h.tipo === 'carga' ? 'Recibo' : h.tipo === 'consolidado' ? 'Consolidado' : 'Servicio'} {h.de}</div>
                <div style={{ fontSize:15.5, fontWeight:800, marginTop:2 }}>{h.titulo || 'Mercancía'}</div>
                <div style={{ fontSize:12.5, color:C.suave, marginTop:2 }}>
                  {[h.referencia ? `Ref./factura ${h.referencia}` : null, h.piezas ? `${h.piezas} ${n(h.piezas) === 1 ? 'pieza' : 'piezas'}` : null, n(h.kg) ? `${kgTxt(h.kg)} kg` : null, n(h.cbm) ? `${Number(h.cbm).toLocaleString('es-CO', { maximumFractionDigits: 2 })} m³` : null, MODAL[h.modalidad]].filter(Boolean).join(' · ')}
                </div>
              </div>
              <Etiqueta fase="entregada">✓ Entregada</Etiqueta>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:10, paddingTop:10, borderTop:`1px solid ${C.linea}`, fontSize:12.5 }}>
              <span style={{ color:C.suave }}>
                {h.recibido ? <>Recibido <b style={{ color:C.tinta }}>{fecha(String(h.recibido).slice(0, 10))}</b> → </> : null}
                Entregado <b style={{ color:C.tinta }}>{h.entregado ? fecha(h.entregado, String(h.entregado).length > 10) : '—'}</b>
                {t !== null && t > 0 ? ` · ${t} día${t === 1 ? '' : 's'}` : ''}
              </span>
              <Pago p={p} />
            </div>
          </Caja>
        )
      })}
      <button id="pc-pdf-entregas" onClick={pdf} style={{ ...boton, background:'#fff', color:C.tinta, border:`1px solid ${C.linea}` }}>Descargar historial de entregas (PDF)</button>
    </>
  )
}

function Cotizaciones({ lista, recargar }) {
  const [abierta, setAbierta] = useState(null)
  const [aceptando, setAceptando] = useState(null)
  const [msg, setMsg] = useState('')
  if (!lista.length) return <Caja><div style={{ fontSize:14, color:C.suave }}>No tienes cotizaciones por ahora.</div></Caja>
  const aceptar = async c => {
    setAceptando(c.id); setMsg('')
    const { error } = await supabase.rpc('lrm_portal_aceptar', { p_servicio: c.id })
    setAceptando(null)
    if (error) return setMsg(error.message || 'No se pudo aceptar.')
    setMsg(`✓ Aceptaste la cotización SRV-${String(c.numero).padStart(4, '0')}. Te contactamos para programarla.`)
    recargar()
  }
  const ESTADO = { cotizado:['Por aprobar', C.oroClaro, '#7A5E14'], aceptado:['Aceptada', '#E6F0FA', '#1F5A8C'], programado:['Programada', '#EEE9FB', '#5B45A8'], en_curso:['En curso', '#FDF1DE', '#8C5A12'], completado:['Completada', '#EAF5EE', '#1F5F3B'] }
  return (
    <>
      {msg && <div id="pc-msg" style={{ fontSize:13.5, color: msg.startsWith('✓') ? C.verde : '#B4442F', marginBottom:12 }}>{msg}</div>}
      {lista.map(c => {
        const e = ESTADO[c.estado] || ESTADO.cotizado, abierto = abierta === c.id || c.estado === 'cotizado'
        const vence = c.creado ? new Date(new Date(c.creado).getTime() + n(c.vigencia_dias || 8) * 86400000) : null
        const vencida = c.estado === 'cotizado' && vence && vence < new Date()
        return (
          <Caja key={c.id}>
            <div onClick={() => setAbierta(abierta === c.id ? null : c.id)} style={{ cursor:'pointer', display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:C.suave }}>Cotización SRV-{String(c.numero || '').padStart(4, '0')}{c.creado ? ` · ${fecha(c.creado.slice(0, 10))}` : ''}</div>
                <div style={{ fontSize:16.5, fontWeight:800, marginTop:2 }}>{c.titulo || 'Servicio'}</div>
                {c.fecha && <div style={{ fontSize:13, color:C.suave, marginTop:2 }}>{fecha(c.fecha)}{c.hora ? ` · ${c.hora}` : ''}</div>}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <span style={{ fontSize:11.5, fontWeight:700, padding:'5px 9px', borderRadius:999, background:e[1], color:e[2] }}>{vencida ? 'Vencida' : e[0]}</span>
                <div style={{ fontSize:17, fontWeight:800, marginTop:6 }}>{cop(c.total)}</div>
              </div>
            </div>
            {abierto && (
              <div className="pc-cot" style={{ marginTop:12, borderTop:`1px solid ${C.linea}`, paddingTop:10 }}>
                {(c.direccion_origen || c.origen) && <div style={{ fontSize:13, marginBottom:4 }}>📍 <span style={{ color:C.suave }}>Recoge:</span> {[c.direccion_origen, c.origen].filter(Boolean).join(', ')}</div>}
                {(c.direccion_destino || c.destino) && <div style={{ fontSize:13, marginBottom:4 }}>🏁 <span style={{ color:C.suave }}>Entrega:</span> {[c.direccion_destino, c.destino].filter(Boolean).join(', ')}</div>}
                {c.vehiculo && <div style={{ fontSize:13, marginBottom:4 }}>🚚 <span style={{ color:C.suave }}>Vehículo:</span> {c.vehiculo}</div>}
                {c.mercancia && <div style={{ fontSize:13, marginBottom:4 }}>📦 <span style={{ color:C.suave }}>Carga:</span> {c.mercancia}</div>}
                <div style={{ marginTop:8 }}>
                  {(c.lineas || []).map((l, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:13, padding:'6px 0', borderTop: i ? `1px dashed ${C.linea}` : 'none' }}>
                      <span>{l.concepto}{l.detalle ? <span style={{ color:C.suave }}> · {l.detalle}</span> : null}{n(l.cantidad) !== 1 ? <span style={{ color:C.suave }}> · {n(l.cantidad).toLocaleString('es-CO')} {plural(l.unidad)}</span> : null}</span>
                      <b style={{ whiteSpace:'nowrap' }}>{cop(n(l.cantidad) * n(l.precio))}</b>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, padding:'10px 0 0', borderTop:`1px solid ${C.tinta}`, marginTop:4 }}><span>Total</span><span>{cop(c.total)}</span></div>
                </div>
                <div style={{ fontSize:12.5, color:C.suave, marginTop:8 }}>Forma de pago: {PAGOS[c.condicion_pago] || '—'}{c.estado === 'cotizado' && vence ? ` · válida hasta el ${vence.toLocaleDateString('es-CO', { day:'numeric', month:'long' })}` : ''}</div>
                {c.notas_cliente && <div style={{ fontSize:12.5, color:C.suave, marginTop:4, whiteSpace:'pre-wrap' }}>{c.notas_cliente}</div>}
                {c.estado === 'cotizado' && !vencida && (
                  <button className="pc-aceptar" onClick={() => aceptar(c)} disabled={aceptando === c.id} style={{ ...boton, marginTop:14, background:C.verde }}>{aceptando === c.id ? 'Aceptando…' : '✓ Aceptar cotización'}</button>
                )}
                {vencida && <div style={{ fontSize:12.5, color:'#B4442F', marginTop:10 }}>Esta cotización venció. Escríbenos y te la actualizamos.</div>}
              </div>
            )}
          </Caja>
        )
      })}
    </>
  )
}

function Cuenta({ d, cargado, pagado, saldo, cobros = [] }) {
  const movs = d.cuenta || []
  const medios = (Array.isArray(d.medios_pago) ? d.medios_pago : []).filter(m => m.detalle)
  let corre = 0
  let ic = 0
  const hoyISO = new Date().toISOString().slice(0, 10)
  const filas = movs.map(m => { corre += (m.tipo === 'cobro_cliente' ? 1 : -1) * n(m.monto); const p = m.tipo === 'cobro_cliente' ? cobros[ic++] : null; return { ...m, saldo: corre, pago: p } })
  const vencido = filas.filter(m => m.pago && m.pago.pendiente > 0 && m.vence && m.vence < hoyISO).reduce((t, m) => t + m.pago.pendiente, 0)
  const pdf = () => {
    const hoy = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Estado de cuenta · ${esc(d.nombre)}</title><style>
      @page{size:letter;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;font-size:11.5px;margin:0;padding:20px}
      .top{display:flex;justify-content:space-between;border-bottom:2px solid #C9A84C;padding-bottom:10px}.t{font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700;text-align:right}
      table{width:100%;border-collapse:collapse;margin-top:14px}th{text-align:left;font-size:9.5px;text-transform:uppercase;color:#777;padding:6px;border-bottom:1.5px solid #1b1b1b}td{padding:6px;border-bottom:1px solid #f0eadb}.n{text-align:right;white-space:nowrap}
      .tot{display:flex;justify-content:flex-end;gap:12px;margin-top:12px}.tot div{background:#faf7ee;border-radius:8px;padding:8px 12px;text-align:right}.tot b{font-size:15px}
      ul{font-size:11px;color:#444}</style></head><body>
      <div class="top"><div><img src="${location.origin}/marca/logo-documento.png" style="height:54px"><div style="font-size:10.5px;color:#555">${esc(d.empresa?.ciudad || '')} · ${esc(d.empresa?.whatsapp || '')} · ${esc(d.empresa?.correo || '')}</div></div>
      <div class="t">ESTADO DE CUENTA<div style="font-size:15px;color:#1b1b1b;letter-spacing:0;margin-top:4px">${esc(d.nombre)}</div><div style="font-weight:400;color:#555;letter-spacing:0">${hoy}</div></div></div>
      <table><thead><tr><th>Fecha</th><th>Concepto</th><th class="n">Cargo</th><th class="n">Pago</th><th class="n">Saldo</th></tr></thead><tbody>
      ${filas.map(m => `<tr><td>${esc(m.fecha)}</td><td>${esc(m.referencia || (m.tipo === 'abono_cliente' ? 'Pago recibido' : 'Servicio'))}${m.notas ? ' · ' + esc(m.notas) : ''}</td><td class="n">${m.tipo === 'cobro_cliente' ? cop(m.monto) : ''}</td><td class="n">${m.tipo === 'abono_cliente' ? cop(m.monto) : ''}</td><td class="n">${cop(m.saldo)}</td></tr>`).join('')}
      </tbody></table>
      <div class="tot"><div>Cargos<br><b>${cop(cargado)}</b></div><div>Pagos<br><b>${cop(pagado)}</b></div><div style="background:#1b1b1b;color:#fff">Saldo<br><b>${cop(saldo)}</b></div></div>
      ${medios.length ? `<p style="margin-top:16px;font-weight:700">Medios de pago</p><ul>${medios.map(m => `<li>${esc(m.tipo)}: ${esc(m.detalle)}${m.titular ? ' · ' + esc(m.titular) : ''}</li>`).join('')}</ul>` : ''}
      <p style="color:#8a6d1f;font-weight:700;text-align:right">We bring it. Safe and on time.</p></body></html>`
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close()
  }
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8, marginBottom:12 }}>
        {[['Cargos', cargado, C.tinta], ['Pagos', pagado, C.verde], ['Saldo', saldo, saldo > 1 ? '#B4442F' : C.verde]].map(([l, v, c]) => (
          <div key={l} style={{ background:'#fff', border:`1px solid ${C.linea}`, borderRadius:14, padding:'12px 10px', minWidth:0 }}>
            <div style={{ fontSize:11, color:C.suave }}>{l}</div>
            <div id={`pc-${l.toLowerCase()}`} style={{ fontSize:'clamp(12px, 3.4vw, 16px)', fontWeight:800, color:c, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cop(v)}</div>
          </div>
        ))}
      </div>
      {vencido > 1 && <div id="pc-vencido" style={{ fontSize:13, background:'#FBE7E3', color:'#9A3A26', borderRadius:12, padding:'10px 12px', marginBottom:12, fontWeight:600 }}>Tienes {cop(vencido)} vencidos. Escríbenos si ya pagaste para registrarlo.</div>}
      <Caja pad="6px 16px">
        {filas.length === 0 ? <div style={{ fontSize:14, color:C.suave, padding:'10px 0' }}>Sin movimientos.</div> : [...filas].reverse().map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'11px 0', borderTop: i ? `1px solid ${C.linea}` : 'none', fontSize:13 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:600 }}>{m.tipo === 'abono_cliente' ? 'Pago recibido' : (m.referencia || 'Servicio')}{m.de && m.de !== m.referencia ? <span style={{ color:C.suave, fontWeight:500 }}> · {m.de}</span> : null}</div>
              <div style={{ fontSize:11.5, color:C.suave }}>{fecha(m.fecha)}{m.notas ? ` · ${m.notas}` : ''}{m.pago && m.pago.pendiente > 0 && m.vence ? <span style={{ color: m.vence < hoyISO ? '#B4442F' : C.suave, fontWeight: m.vence < hoyISO ? 700 : 400 }}> · {m.vence < hoyISO ? 'venció' : 'vence'} {fecha(m.vence)}</span> : null}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <b style={{ color: m.tipo === 'abono_cliente' ? C.verde : C.tinta, whiteSpace:'nowrap' }}>{m.tipo === 'abono_cliente' ? '−' : ''}{cop(m.monto)}</b>
              {m.pago && <div style={{ marginTop:4 }}><Pago p={{ estado: m.pago.estadoPago, pendiente: m.pago.pendiente }} /></div>}
            </div>
          </div>
        ))}
      </Caja>
      {medios.length > 0 && saldo > 1 && (
        <Caja>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:6 }}>Paga tu saldo de {cop(saldo)}</div>
          {medios.map((m, i) => <div key={i} style={{ fontSize:13, padding:'4px 0' }}><b>{m.tipo}:</b> {m.detalle}{m.titular ? <span style={{ color:C.suave }}> · {m.titular}</span> : null}</div>)}
          <div style={{ fontSize:12, color:C.suave, marginTop:6 }}>Envíanos el soporte por WhatsApp.</div>
        </Caja>
      )}
      <button id="pc-pdf" onClick={pdf} style={{ ...boton, background:'#fff', color:C.tinta, border:`1px solid ${C.linea}` }}>Descargar estado de cuenta (PDF)</button>
    </>
  )
}

function Docs({ docs, wa }) {
  const [urls, setUrls] = useState({})
  useEffect(() => {
    if (!docs.length) return
    supabase.storage.from('lrm-docs').createSignedUrls(docs.map(x => x.ruta), 3600).then(({ data }) => setUrls(Object.fromEntries((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]))))
  }, [docs.length])
  const pedir = wa ? wa.replace(/text=([^&]*)/, (m, t) => 'text=' + t + encodeURIComponent('Necesito un documento de mi envío: ')) : null
  const solicitar = pedir && <a id="pc-pedir-doc" href={pedir} target="_blank" rel="noreferrer" style={{ ...boton, display:'block', textAlign:'center', textDecoration:'none', background:'#fff', color:C.tinta, border:`1px solid ${C.linea}`, boxSizing:'border-box' }}>📄 Solicitar un documento</a>
  if (!docs.length) return <><Caja><div style={{ fontSize:14, color:C.suave }}>Aquí vas a ver las fotos y documentos de tus envíos: factura, lista de empaque, guía, fotos de la carga y soportes de pago.</div></Caja>{solicitar}</>
  const grupos = {}
  docs.forEach(x => { (grupos[x.de || 'Otros'] ||= []).push(x) })
  return <>{Object.entries(grupos).map(([de, lista]) => (
    <Caja key={de}>
      <div style={{ fontSize:13, fontWeight:800, marginBottom:10 }}>{de}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:8 }}>
        {lista.map(x => {
          const url = urls[x.ruta], img = String(x.mime || '').startsWith('image/')
          return (
            <a key={x.ruta} className="pc-doc" href={url || undefined} target="_blank" rel="noreferrer" style={{ display:'block', textDecoration:'none', color:C.tinta, border:`1px solid ${C.linea}`, borderRadius:12, overflow:'hidden', background:C.fondo }}>
              <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, background:'#fff' }}>{img && url ? <img src={url} alt={x.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (TIPOS_DOC[x.tipo] || TIPOS_DOC.otro).split(' ')[0]}</div>
              <div style={{ padding:'7px 9px' }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{(TIPOS_DOC[x.tipo] || TIPOS_DOC.otro).replace(/^\S+\s/, '')}</div>
                <div style={{ fontSize:11, color:C.suave, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.nombre}</div>
              </div>
            </a>
          )
        })}
      </div>
    </Caja>
  ))}{solicitar}</>
}