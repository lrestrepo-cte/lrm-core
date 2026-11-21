// @ts-nocheck
// LRM Trade Consulting · Servicios de logística integral
// Transporte en cualquier vehículo, coteros, escolta, esperas, seguro… todo con tu costo y tu precio.
// Flujo: Cotizado → Aceptado (pasa a Caja) → Programado (conductor, placa, equipo) → En curso → Completado
// Tablas: lrm_servicios, lrm_servicio_lineas, lrm_recursos (SQL 19) · lrm_movimientos.servicio_id
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { linkWhatsApp, hoyISO, fechaCorta } from './LRMClientes'
import { useDatosLRM, logoDocumentoHTML } from './datosLRM'

// ── Catálogos ───────────────────────────────────────────────────────────────
export const VEHICULOS_SRV = ['Carry / van', 'NHR', 'Camión 350', 'Camión 500', 'Camión 600', 'Camión 3 toneladas', 'Turbo', 'Sencillo', 'Doble troque', 'Tractomula', "Portacontenedor 20'", "Portacontenedor 40'", 'Cama baja', 'Otro']
const CONCEPTOS = [
  { id:'Transporte',         unidad:'viaje',    icono:'🚚' },
  { id:'Coteros',            unidad:'persona',  icono:'💪' },
  { id:'Escolta / seguridad', unidad:'servicio', icono:'🛡️' },
  { id:'Cargue / descargue', unidad:'servicio', icono:'📦' },
  { id:'Espera / standby',   unidad:'día',      icono:'⏱️' },
  { id:'Montacarga',         unidad:'hora',     icono:'🏗️' },
  { id:'Almacenaje',         unidad:'día',      icono:'🏬' },
  { id:'Seguro',             unidad:'servicio', icono:'🔒' },
  { id:'Otro',               unidad:'servicio', icono:'➕' },
]
const ESTADOS = {
  cotizado:   { l:'Cotizado',   c:'#C9A84C' },
  aceptado:   { l:'Aceptado',   c:'#378ADD' },
  programado: { l:'Programado', c:'#9C7BFF' },
  en_curso:   { l:'En curso',   c:'#E8A23A' },
  completado: { l:'Completado', c:'#4caf50' },
  cancelado:  { l:'Cancelado',  c:'#8A8F98' },
}
const COLUMNAS = [
  { id:'cotizado',  titulo:'Cotizados',              estados:['cotizado'] },
  { id:'aceptado',  titulo:'Aceptados y programados', estados:['aceptado', 'programado'] },
  { id:'en_curso',  titulo:'En curso',               estados:['en_curso'] },
  { id:'completado', titulo:'Completados',           estados:['completado'] },
]
export const PAGOS = {
  anticipo_50:    '50% para programar y 50% al terminar',
  anticipo_100:   '100% anticipado para programar',
  contra_entrega: 'Pago contra entrega',
  credito:        'Crédito según lo acordado',
}
export const TIPOS_RECURSO = {
  conductor:  { l:'Conductor / vehículo', icono:'🚚' },
  cotero:     { l:'Cotero',               icono:'💪' },
  escolta:    { l:'Escolta / seguridad',  icono:'🛡️' },
  montacarga: { l:'Montacarga',           icono:'🏗️' },
  bodega:     { l:'Bodega',               icono:'🏬' },
  otro:       { l:'Otro',                 icono:'👤' },
}
const CIUDADES = ['Barranquilla', 'Cartagena', 'Santa Marta', 'Puerto de Barranquilla', 'Puerto de Cartagena', 'Puerto de Santa Marta', 'Zona Franca Barranquilla', 'Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'Valledupar', 'Montería', 'Sincelejo', 'Riohacha', 'Malambo', 'Soledad', 'Galapa', 'Puerto Colombia']
// Arranque rápido de un servicio
const PLANTILLAS = [
  { id:'transporte', l:'🚚 Transporte',             lineas:['Transporte'] },
  { id:'trans_cot',  l:'🚚💪 Transporte + coteros',  lineas:['Transporte', 'Coteros'] },
  { id:'contenedor', l:"📦 Contenedor puerto → bodega", lineas:['Transporte', 'Escolta / seguridad', 'Coteros'], vehiculo:"Portacontenedor 40'", origen:'Puerto de Santa Marta', destino:'Barranquilla' },
  { id:'coteros',    l:'💪 Solo coteros',            lineas:['Coteros'], tipo:'coteros' },
  { id:'escolta',    l:'🛡️ Escolta',                 lineas:['Escolta / seguridad'], tipo:'escolta' },
]

// ── Utilidades ──────────────────────────────────────────────────────────────
const cop = n => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
const fechaLarga = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' }) : ''
export const codigoSrv = s => `SRV-${String(s?.numero || '').padStart(4, '0')}`
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const celda = { ...iStyle, marginTop:0, padding:'6px 7px', fontSize:12 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'18px 0', textAlign:'center' }}>{children}</div>
const Titulo = ({ children, color = 'var(--text3)' }) => <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color, margin:'4px 0 8px' }}>{children}</div>
const suma = arr => arr.reduce((s, m) => s + Number(m.monto || 0), 0)
export const totalesLineas = ls => ls.reduce((t, l) => ({ precio: t.precio + n2(l.cantidad) * n2(l.precio), costo: t.costo + n2(l.cantidad) * n2(l.costo) }), { precio:0, costo:0 })
const lineaVacia = (concepto = 'Transporte') => ({ concepto, detalle:'', cantidad:'1', unidad: CONCEPTOS.find(c => c.id === concepto)?.unidad || 'servicio', precio:'', costo:'', proveedor:'', recurso_id:null })

// Lo que te cuesta, agrupado por a quién le pagas
const costosPorProveedor = ls => {
  const m = {}
  ls.forEach(l => { const c = n2(l.cantidad) * n2(l.costo); if (c > 0) { const k = (l.proveedor || '').trim() || `Proveedor ${l.concepto}`; m[k] = (m[k] || 0) + c } })
  return m
}

// ── Página ──────────────────────────────────────────────────────────────────
export default function Servicios() {
  const [srvs, setSrvs] = useState([])
  const [lineas, setLineas] = useState([])
  const [clientes, setClientes] = useState([])
  const [recursos, setRecursos] = useState([])
  const [movs, setMovs] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cierres, setCierres] = useState([])
  const [tarifasTerr, setTarifasTerr] = useState([])
  const [aliados, setAliados] = useState([])
  const [falta, setFalta] = useState(false)
  const [tab, setTab] = useState('tablero')
  const [abierto, setAbierto] = useState(null)        // servicio en el editor ({} = nuevo)
  const [buscar, setBuscar] = useState('')
  const [verCancelados, setVerCancelados] = useState(false)

  const cargar = async () => {
    const [s, l, c, r] = await Promise.all([
      supabase.from('lrm_servicios').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_servicio_lineas').select('*').order('orden'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
      supabase.from('lrm_recursos').select('*').order('nombre'),
    ])
    if (s.error || l.error || r.error) { setFalta(true); return }
    setSrvs(s.data || []); setLineas(l.data || []); setClientes(c.data || []); setRecursos(r.data || [])
    const [m, cu, ci, tt, al] = await Promise.all([
      supabase.from('lrm_movimientos').select('*').not('servicio_id', 'is', null),
      supabase.from('lrm_cuentas').select('*').order('created_at'),
      supabase.from('lrm_cierres').select('mes'),
      supabase.from('lrm_tarifas_terrestre').select('*'),
      supabase.from('lrm_aliados').select('id,nombre'),
    ])
    setMovs(m.data || []); setCuentas((cu.data || []).filter(x => x.activa !== false)); setCierres((ci.data || []).map(x => x.mes))
    setTarifasTerr(tt.error ? [] : tt.data || []); setAliados(al.error ? [] : al.data || [])
  }
  useEffect(() => { cargar() }, [])
  // Mantiene abierto el editor con los datos frescos después de guardar
  useEffect(() => { if (abierto?.id) { const f = srvs.find(s => s.id === abierto.id); if (f && f !== abierto) setAbierto(f) } }, [srvs])

  if (falta) return <div className="panel" style={{ border:'1px solid var(--gold-border)', color:'var(--gold)', fontSize:13 }}>Para usar Servicios corre en Supabase el archivo <b>19_lrm_servicios.sql</b>.</div>

  const nombreCli = id => clientes.find(c => c.id === id)?.nombre || 'Sin cliente'
  const lineasDe = id => lineas.filter(l => l.servicio_id === id)
  const pagosDe = id => { const ms = movs.filter(m => m.servicio_id === id); return { cobrado: suma(ms.filter(m => m.tipo === 'cobro_cliente')), abonado: suma(ms.filter(m => m.tipo === 'abono_cliente')) } }
  const mes = hoyISO().slice(0, 7)
  const vivos = srvs.filter(s => s.estado !== 'cancelado')
  const kpi = {
    cotizado: vivos.filter(s => s.estado === 'cotizado').reduce((t, s) => t + totalesLineas(lineasDe(s.id)).precio, 0),
    nCot: vivos.filter(s => s.estado === 'cotizado').length,
    vendidoMes: vivos.filter(s => s.estado !== 'cotizado' && (s.aceptado_at || s.created_at || '').slice(0, 7) === mes),
    porCobrar: vivos.filter(s => s.estado !== 'cotizado').reduce((t, s) => { const p = pagosDe(s.id); return t + Math.max(0, totalesLineas(lineasDe(s.id)).precio - p.abonado) }, 0),
    hoy: vivos.filter(s => ['aceptado', 'programado', 'en_curso'].includes(s.estado) && s.fecha && s.fecha <= hoyISO()).length,
  }
  const vendido = kpi.vendidoMes.reduce((t, s) => { const x = totalesLineas(lineasDe(s.id)); return { precio: t.precio + x.precio, costo: t.costo + x.costo } }, { precio:0, costo:0 })
  const filtrados = srvs.filter(s => (verCancelados ? true : s.estado !== 'cancelado') &&
    (!buscar || [codigoSrv(s), s.titulo, s.origen, s.destino, s.placa, s.conductor, nombreCli(s.cliente_id)].join(' ').toLowerCase().includes(buscar.toLowerCase())))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {[['tablero', 'Servicios'], ['gente', `Mi gente (${recursos.filter(r => r.activo !== false).length})`]].map(([id, l]) => (
          <button key={id} id={`sv-tab-${id}`} onClick={() => setTab(id)} className={tab === id ? 'btn-gold' : 'btn'} style={{ width:'auto' }}>{l}</button>
        ))}
        {tab === 'tablero' && <button id="sv-nuevo" onClick={() => setAbierto({})} className="btn-gold" style={{ width:'auto', marginLeft:'auto' }}>+ Nuevo servicio</button>}
      </div>

      {tab === 'gente' ? <MiGente recursos={recursos} srvs={srvs} aliados={aliados} onCambio={cargar} /> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:10 }}>
            {[
              ['Cotizaciones abiertas', cop(kpi.cotizado), `${kpi.nCot} sin respuesta`, 'var(--gold)'],
              ['Vendido este mes', cop(vendido.precio), `${kpi.vendidoMes.length} servicios`, 'var(--text)'],
              ['Ganancia del mes', cop(vendido.precio - vendido.costo), vendido.precio ? `${fmt((vendido.precio - vendido.costo) / vendido.precio * 100, 0)}% de margen` : '—', 'var(--green)'],
              ['Por cobrar', cop(kpi.porCobrar), 'aceptados sin pagar completo', kpi.porCobrar ? '#E8A23A' : 'var(--text)'],
              ['Para hoy', String(kpi.hoy), 'servicios programados hoy o atrasados', kpi.hoy ? 'var(--gold)' : 'var(--text)'],
            ].map(([l, v, sub, c]) => (
              <div key={l} className="panel" style={{ padding:'12px 14px', minWidth:0 }}>
                <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', fontWeight:700 }}>{l}</div>
                <div className="sv-kpi" style={{ fontSize:19, fontWeight:800, color:c, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por cliente, ruta, placa, conductor o SRV…" style={{ ...iStyle, marginTop:0, maxWidth:420 }} />
            <label style={{ fontSize:12, color:'var(--text3)', display:'flex', gap:6, alignItems:'center', cursor:'pointer' }}><input type="checkbox" checked={verCancelados} onChange={e => setVerCancelados(e.target.checked)} /> Ver cancelados</label>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap:12, alignItems:'start' }}>
            {COLUMNAS.map(col => {
              const lista = filtrados.filter(s => col.estados.includes(s.estado) || (col.id === 'completado' && verCancelados && s.estado === 'cancelado'))
                .filter(s => col.id !== 'completado' || s.estado === 'cancelado' || !s.completado_at || (Date.now() - new Date(s.completado_at)) / 86400000 <= 45)
                .sort((a, b) => col.id === 'cotizado' ? (b.created_at || '').localeCompare(a.created_at || '') : (a.fecha || '9999').localeCompare(b.fecha || '9999'))
              return (
                <div key={col.id} className="panel" style={{ padding:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color: ESTADOS[col.estados[0]].c }}>{col.titulo}</span>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>{lista.length}</span>
                  </div>
                  {lista.length === 0 ? <Vacio>—</Vacio> : lista.map(s => {
                    const t = totalesLineas(lineasDe(s.id)), p = pagosDe(s.id), e = ESTADOS[s.estado]
                    const pago = s.estado === 'cotizado' || s.estado === 'cancelado' ? null : p.abonado >= t.precio - 1 && t.precio ? ['Pagado', 'var(--green)'] : p.abonado > 0 ? [`Abonó ${fmt(p.abonado / (t.precio || 1) * 100, 0)}%`, '#E8A23A'] : ['Sin abono', 'var(--red)']
                    const tarde = ['aceptado', 'programado'].includes(s.estado) && s.fecha && s.fecha < hoyISO()
                    return (
                      <div key={s.id} onClick={() => setAbierto(s)} className="sv-card" style={{ cursor:'pointer', padding:'10px 11px', borderRadius:10, background:'var(--bg4)', marginBottom:6, borderLeft:`3px solid ${e.c}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
                          <span style={{ fontSize:11, color:'var(--text3)' }}>{codigoSrv(s)}{s.estado === 'programado' ? ' · programado' : ''}{s.estado === 'cancelado' ? ' · cancelado' : ''}</span>
                          <b style={{ fontSize:12.5, color:'var(--gold)' }}>{cop(t.precio)}</b>
                        </div>
                        <div style={{ fontSize:13.5, fontWeight:800, color:'var(--text)', marginTop:2 }}>{nombreCli(s.cliente_id)}</div>
                        <div style={{ fontSize:12, color:'var(--text2)' }}>{s.titulo || [s.origen, s.destino].filter(Boolean).join(' → ') || 'Servicio'}</div>
                        <div style={{ fontSize:11, color: tarde ? 'var(--red)' : 'var(--text3)', marginTop:3 }}>
                          {s.fecha ? `${fechaCorta(s.fecha)}${s.hora ? ' · ' + s.hora : ''}` : 'Sin fecha'}{s.placa ? ` · ${s.placa}` : ''}{tarde ? ' · atrasado' : ''}
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginTop:3 }}>
                          <span style={{ color:'var(--green)' }}>{t.precio ? `gana ${cop(t.precio - t.costo)}` : ''}</span>
                          {pago && <span style={{ color:pago[1], fontWeight:600 }}>{pago[0]}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </>
      )}

      {abierto && (
        <EditorServicio key={abierto.id || 'nuevo'} srv={abierto} lineas={abierto.id ? lineasDe(abierto.id) : []} clientes={clientes} recursos={recursos}
          movs={movs.filter(m => abierto.id && m.servicio_id === abierto.id)} cuentas={cuentas} cierres={cierres} tarifasTerr={tarifasTerr} aliados={aliados}
          onCerrar={() => setAbierto(null)} onCambio={async (nuevo) => { await cargar(); if (nuevo) setAbierto(nuevo) }} />
      )}
    </div>
  )
}

// ── Editor de un servicio ───────────────────────────────────────────────────
function EditorServicio({ srv, lineas: lineas0, clientes, recursos, movs, cuentas, cierres, tarifasTerr, aliados, onCerrar, onCambio }) {
  const { empresa } = useDatosLRM()
  const nuevo = !srv.id
  const [f, setF] = useState({ tipo:'transporte', estado:'cotizado', condicion_pago:'anticipo_50', vigencia_dias:8, equipo:[], fecha:'', hora:'', ...srv })
  const [ls, setLs] = useState(lineas0.length ? lineas0.map(l => ({ ...l, cantidad: String(l.cantidad ?? ''), precio: String(l.precio ?? ''), costo: String(l.costo ?? '') })) : [lineaVacia('Transporte')])
  const [nuevoCli, setNuevoCli] = useState(null)       // { nombre, telefono } para crear cliente rápido
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [doc, setDoc] = useState(false)
  const [abono, setAbono] = useState(null)
  const [pagoProv, setPagoProv] = useState(null)
  const [cancelar, setCancelar] = useState(false)
  const [cambios, setCambios] = useState(false)
  const set = k => e => { setCambios(true); setF(p => ({ ...p, [k]: e.target.value })) }
  const updL = (i, k, v) => { setCambios(true); setLs(p => p.map((l, j) => j === i ? { ...l, [k]: v } : l)) }

  const cli = clientes.find(c => c.id === f.cliente_id)
  const t = totalesLineas(ls)
  const ganancia = t.precio - t.costo
  const cobrado = suma(movs.filter(m => m.tipo === 'cobro_cliente'))
  const abonado = suma(movs.filter(m => m.tipo === 'abono_cliente'))
  const saldo = Math.max(0, t.precio - abonado)
  const porProv = costosPorProveedor(ls)
  const pagadoProv = p => suma(movs.filter(m => m.tipo === 'pago_proveedor' && m.proveedor === p))
  const registradoProv = p => suma(movs.filter(m => m.tipo === 'costo_proveedor' && m.proveedor === p))
  const vendido = !['cotizado', 'cancelado'].includes(f.estado)
  const desfase = vendido && (Math.abs(cobrado - t.precio) > 1 || Object.entries(porProv).some(([p, v]) => Math.abs(registradoProv(p) - v) > 1))
  const titulo = f.titulo?.trim() || [f.vehiculo, [f.origen, f.destino].filter(Boolean).join(' → ')].filter(Boolean).join(' · ') || ls.map(l => l.concepto).join(' + ')
  const conductores = recursos.filter(r => r.tipo === 'conductor' && r.activo !== false)
  const equipoDisp = recursos.filter(r => r.tipo !== 'conductor' && r.activo !== false)
  const equipo = Array.isArray(f.equipo) ? f.equipo : []

  // Tarifa de transporte guardada en Aliados → Transporte terrestre para esa ruta
  const tarifaRuta = useMemo(() => {
    const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/puerto de /, '').trim()
    return tarifasTerr.filter(x => norm(x.origen) && norm(x.origen) === norm(f.origen) && norm(x.destino) === norm(f.destino))
      .sort((a, b) => (Number(a.costo_cop) + Number(a.margen_cop)) - (Number(b.costo_cop) + Number(b.margen_cop)))[0]
  }, [f.origen, f.destino, tarifasTerr])
  const usarTarifa = i => {
    const x = tarifaRuta; if (!x) return
    updL(i, 'costo', String(x.costo_cop)); updL(i, 'precio', String(Number(x.costo_cop) + Number(x.margen_cop)))
    updL(i, 'proveedor', aliados.find(a => a.id === x.aliado_id)?.nombre || ''); updL(i, 'detalle', `${x.origen} → ${x.destino}`)
  }
  const plantilla = p => {
    setCambios(true)
    setF(x => ({ ...x, tipo: p.tipo || 'transporte', vehiculo: p.vehiculo || x.vehiculo, origen: p.origen || x.origen, destino: p.destino || x.destino }))
    setLs(p.lineas.map(c => lineaVacia(c)))
  }

  // Lo que se guarda del servicio
  const datosSrv = (extra = {}) => {
    const { id, numero, created_at, ...d } = { ...f, ...extra }
    return { ...d, titulo, cliente_id: d.cliente_id || null, fecha: d.fecha || null, vigencia_dias: Number(d.vigencia_dias) || null, equipo: Array.isArray(d.equipo) ? d.equipo : [] }
  }
  const guardarTodo = async (extra = {}) => {
    let cliente_id = f.cliente_id
    if (nuevoCli?.nombre?.trim()) {
      const r = await supabase.from('lrm_clientes').insert({ nombre: nuevoCli.nombre.trim(), telefono: nuevoCli.telefono || null, estado:'propuesta' }).select().single()
      if (r.error) throw new Error('No se pudo crear el cliente: ' + r.error.message)
      cliente_id = r.data.id; setNuevoCli(null); setF(p => ({ ...p, cliente_id }))
    }
    const datos = datosSrv({ ...extra, cliente_id })
    const r = f.id ? await supabase.from('lrm_servicios').update(datos).eq('id', f.id).select().single() : await supabase.from('lrm_servicios').insert(datos).select().single()
    if (r.error) throw new Error('No se pudo guardar: ' + r.error.message)
    const s = r.data
    // Líneas: se reemplazan todas
    await supabase.from('lrm_servicio_lineas').delete().eq('servicio_id', s.id)
    const limpias = ls.filter(l => n2(l.precio) || n2(l.costo) || l.detalle?.trim())
    if (limpias.length) {
      const ins = await supabase.from('lrm_servicio_lineas').insert(limpias.map((l, i) => ({
        servicio_id: s.id, orden: i + 1, concepto: l.concepto, detalle: l.detalle || null, cantidad: n2(l.cantidad) || 1, unidad: l.unidad || null,
        precio: n2(l.precio), costo: n2(l.costo), proveedor: l.proveedor?.trim() || null, recurso_id: l.recurso_id || null,
      })))
      if (ins.error) throw new Error('No se pudieron guardar las líneas: ' + ins.error.message)
    }
    setF(p => ({ ...p, ...s })); setCambios(false)
    return s
  }
  const accion = async (fn, msg) => {
    setGuardando(true); setError(''); setAviso('')
    try { const s = await fn(); if (msg) setAviso(msg); await onCambio(s) } catch (e) { setError(e.message || String(e)) }
    setGuardando(false)
  }

  // Caja: cobro al cliente + factura por pagar a cada proveedor. Si cambió, corrige.
  const cerrado = fe => cierres.includes((fe || '').slice(0, 7))
  const ajustar = async (prev, nuevoValor, base) => {
    const antes = suma(prev), dif = Math.round(nuevoValor) - antes
    if (Math.abs(dif) <= 1) return
    if (!prev.length) { if (nuevoValor > 0) { const r = await supabase.from('lrm_movimientos').insert({ ...base, monto: Math.round(nuevoValor) }); if (r.error) throw new Error(r.error.message) } return }
    const ultimo = prev[prev.length - 1]
    if (!cerrado(ultimo.fecha)) {
      const m = Number(ultimo.monto || 0) + dif
      const r = m <= 0 ? await supabase.from('lrm_movimientos').delete().eq('id', ultimo.id) : await supabase.from('lrm_movimientos').update({ monto: m, notas: base.notas }).eq('id', ultimo.id)
      if (r.error) throw new Error(r.error.message); return
    }
    if (dif > 0) { const r = await supabase.from('lrm_movimientos').insert({ ...base, monto: dif, notas: 'Ajuste · ' + base.notas }); if (r.error) throw new Error(r.error.message); return }
    throw new Error(`Hay un registro en un mes cerrado (${ultimo.fecha.slice(0, 7)}). Para bajar el valor haz un ajuste en Caja.`)
  }
  const sincronizarCaja = async (s) => {
    const ref = `${codigoSrv(s)} · ${titulo}`.slice(0, 120)
    let fecha = hoyISO(); if (cerrado(fecha)) throw new Error('El mes actual está cerrado en Caja.')
    const base = { concepto:'flete', servicio_id: s.id, fecha, referencia: ref }
    if (!s.cliente_id) throw new Error('Elige el cliente para pasarlo a Caja.')
    await ajustar(movs.filter(m => m.tipo === 'cobro_cliente'), t.precio, { ...base, tipo:'cobro_cliente', cliente_id: s.cliente_id, notas: ls.map(l => `${l.concepto}${n2(l.cantidad) > 1 ? ' ×' + fmt(l.cantidad) : ''}`).join(' + ') })
    const todos = new Set([...Object.keys(porProv), ...movs.filter(m => m.tipo === 'costo_proveedor').map(m => m.proveedor)])
    for (const p of todos) await ajustar(movs.filter(m => m.tipo === 'costo_proveedor' && m.proveedor === p), porProv[p] || 0, { ...base, tipo:'costo_proveedor', proveedor: p, notas: `${ref}` })
  }

  const guardar = () => accion(async () => { const s = await guardarTodo(); if (vendido) await sincronizarCaja(s); return s }, vendido ? '✓ Guardado y Caja al día' : '✓ Guardado')
  const aceptar = () => accion(async () => {
    if (!f.cliente_id && !nuevoCli?.nombre) throw new Error('Elige el cliente antes de aceptar.')
    if (!t.precio) throw new Error('Pon el precio de al menos una línea.')
    const s = await guardarTodo({ estado:'aceptado', aceptado_at: new Date().toISOString() })
    await sincronizarCaja(s)
    if (s.cliente_id) await supabase.from('lrm_clientes').update({ estado:'activo' }).eq('id', s.cliente_id).neq('estado', 'activo')
    return s
  }, '✓ Aceptado: ya está en Caja como cuenta por cobrar y los costos como facturas por pagar.')
  const cambiarEstado = (estado, extra = {}) => accion(async () => guardarTodo({ estado, ...extra }), `✓ ${ESTADOS[estado].l}`)
  const programar = () => {
    if (!f.fecha) return setError('Pon la fecha del servicio.')
    if (!f.conductor && !equipo.length && ls.some(l => l.concepto === 'Transporte')) return setError('Asigna el conductor o el vehículo.')
    cambiarEstado('programado')
  }

  // Conductor desde Mi gente
  const elegirConductor = id => {
    setCambios(true)
    const r = recursos.find(x => x.id === id)
    if (!r) return setF(p => ({ ...p, conductor_id:null }))
    setF(p => ({ ...p, conductor_id: r.id, conductor: r.nombre, conductor_tel: r.telefono || '', placa: r.placa || p.placa, vehiculo: p.vehiculo || r.vehiculo }))
    // Si la línea de transporte no tiene a quién se le paga, queda a nombre del conductor
    setLs(p => p.map(l => l.concepto === 'Transporte' && !l.proveedor ? { ...l, proveedor: r.nombre, recurso_id: r.id, costo: l.costo || (r.tarifa_cop ? String(r.tarifa_cop) : '') } : l))
  }
  const alternarEquipo = r => {
    setCambios(true)
    setF(p => { const eq = Array.isArray(p.equipo) ? p.equipo : []; return { ...p, equipo: eq.some(x => x.id === r.id) ? eq.filter(x => x.id !== r.id) : [...eq, { id: r.id, nombre: r.nombre, telefono: r.telefono, tipo: r.tipo }] } })
  }

  // ── Mensajes ─────────────────────────────────────────────────────────────
  const primer = (cli?.nombre || nuevoCli?.nombre || '').split(' ')[0]
  const cuando = `${f.fecha ? fechaLarga(f.fecha) : 'fecha por confirmar'}${f.hora ? ' a las ' + f.hora : ''}`
  const lugares = [f.direccion_origen || f.origen ? `📍 Recoge: ${[f.direccion_origen, f.origen].filter(Boolean).join(', ')}` : null, f.direccion_destino || f.destino ? `🏁 Entrega: ${[f.direccion_destino, f.destino].filter(Boolean).join(', ')}` : null].filter(Boolean)
  const coteros = equipo.filter(x => x.tipo === 'cotero').length
  const msgs = {
    cotizacion: [
      `Hola ${primer}, te comparto la cotización ${codigoSrv(f)} de *${empresa.nombre}*:`, '',
      `*${titulo}*`, ...(f.fecha ? [`Fecha: ${cuando}`] : []), ...(f.mercancia ? [`Carga: ${f.mercancia}`] : []), '',
      ...ls.filter(l => n2(l.precio)).map(l => `• ${l.concepto}${l.detalle ? ' · ' + l.detalle : ''}${n2(l.cantidad) !== 1 ? ` (${fmt(l.cantidad)} ${l.unidad})` : ''}: ${cop(n2(l.cantidad) * n2(l.precio))}`),
      `*Total: ${cop(t.precio)}*`, '', `Forma de pago: ${PAGOS[f.condicion_pago] || ''}`, `Cotización válida por ${f.vigencia_dias || 8} días.`, '', 'We bring it. Safe and on time.',
    ].join('\n'),
    confirmacion: [
      `✅ Hola ${primer}, tu servicio ${codigoSrv(f)} está confirmado.`, '',
      `*${titulo}*`, `🗓️ ${cuando}`, ...lugares,
      ...(f.vehiculo || f.placa ? [`🚚 Vehículo: ${[f.vehiculo, f.placa ? 'placa ' + f.placa : ''].filter(Boolean).join(' · ')}`] : []),
      ...(f.conductor ? [`👤 Conductor: ${f.conductor}${f.conductor_tel ? ' · ' + f.conductor_tel : ''}`] : []),
      ...(coteros ? [`💪 ${coteros} cotero${coteros === 1 ? '' : 's'}`] : []),
      ...(equipo.some(x => x.tipo === 'escolta') ? ['🛡️ Con escolta de seguridad'] : []),
      ...(f.contacto_sitio ? [`📞 Contacto en sitio: ${f.contacto_sitio}`] : []),
      '', ...(saldo > 1 ? [`Saldo pendiente: ${cop(saldo)}`, ''] : []), 'Cualquier novedad te aviso por aquí.', '*' + empresa.nombre + '* · We bring it. Safe and on time.',
    ].join('\n'),
    en_curso: `🚚 Hola ${primer}, tu servicio ${codigoSrv(f)} ya está en marcha${f.placa ? ` (vehículo ${f.placa})` : ''}. Te aviso apenas se complete.`,
    completado: [`✅ Hola ${primer}, tu servicio ${codigoSrv(f)} quedó completado.`, ...(saldo > 1 ? [`Queda un saldo de ${cop(saldo)}. Te agradezco el pago y el soporte por aquí.`] : ['Gracias por confiar en nosotros.']), '', '*' + empresa.nombre + '* · We bring it. Safe and on time.'].join('\n'),
  }
  const pagoDe = nombre => ls.filter(l => (l.proveedor || '').trim() === nombre).reduce((s, l) => s + n2(l.cantidad) * n2(l.costo), 0)
  const msgGente = (nombre, rol) => [
    `Hola ${String(nombre).split(' ')[0]}, te tengo un servicio (${codigoSrv(f)}):`, '',
    `🗓️ ${cuando}`, ...lugares, ...(f.mercancia ? [`📦 Carga: ${f.mercancia}`] : []),
    ...(rol === 'cotero' && coteros > 1 ? [`Van ${coteros} coteros.`] : []),
    ...(f.contacto_sitio ? [`📞 Contacto en sitio: ${f.contacto_sitio}`] : []),
    ...(pagoDe(nombre) ? [`💵 Pago: ${cop(pagoDe(nombre))}`] : []), '', 'Me confirmas por favor.',
  ].join('\n')
  const wa = (tel, nombre, texto) => linkWhatsApp(tel, nombre, texto)
  const telCli = cli?.telefono || nuevoCli?.telefono

  const e = ESTADOS[f.estado] || ESTADOS.cotizado
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'stretch', justifyContent:'center', zIndex:110, padding:10 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, width:'100%', maxWidth:1240, border:`1px solid ${e.c}66`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:e.c }}>{nuevo ? 'NUEVO SERVICIO' : `${codigoSrv(f)} · ${e.l.toUpperCase()}`}</div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{cli?.nombre || nuevoCli?.nombre || 'Elige el cliente'} <span style={{ fontWeight:400, color:'var(--text3)', fontSize:13 }}>· {titulo}</span></div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {!nuevo && f.estado !== 'cancelado' && <button onClick={() => setCancelar(true)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{f.estado === 'cotizado' ? 'No se dio' : 'Cancelar servicio'}</button>}
            <button id="sv-cerrar" onClick={() => { if (!cambios || window.confirm('Tienes cambios sin guardar. ¿Cerrar igual?')) onCerrar() }} className="btn" style={{ width:'auto' }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:18, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap:18, alignItems:'start' }}>
          {/* Izquierda: qué, dónde, cuándo y cuánto */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {nuevo && (
              <div><Titulo>EMPEZAR CON</Titulo>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{PLANTILLAS.map(p => <button key={p.id} onClick={() => plantilla(p)} className="btn sv-plantilla" style={{ width:'auto', fontSize:12 }}>{p.l}</button>)}</div>
              </div>
            )}
            <div className="grid-2" style={{ gap:10 }}>
              <div>
                <Etiqueta>Cliente</Etiqueta>
                {nuevoCli ? (
                  <div style={{ display:'flex', gap:6 }}>
                    <input id="sv-cli-nombre" value={nuevoCli.nombre} onChange={e => setNuevoCli(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" style={iStyle} autoFocus />
                    <input value={nuevoCli.telefono} onChange={e => setNuevoCli(p => ({ ...p, telefono: e.target.value }))} placeholder="WhatsApp" style={{ ...iStyle, width:130 }} />
                  </div>
                ) : (
                  <select id="sv-cliente" value={f.cliente_id || ''} onChange={e => { if (e.target.value === '__nuevo') { setNuevoCli({ nombre:'', telefono:'' }); return } set('cliente_id')(e) }} style={iStyle}>
                    <option value="">Elegir…</option><option value="__nuevo">+ Cliente nuevo</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                )}
              </div>
              <div><Etiqueta>Título (opcional)</Etiqueta><input value={f.titulo || ''} onChange={set('titulo')} placeholder={titulo} style={iStyle} /></div>
              <div><Etiqueta>Origen</Etiqueta><input id="sv-origen" list="sv-ciudades" value={f.origen || ''} onChange={set('origen')} style={iStyle} /></div>
              <div><Etiqueta>Destino</Etiqueta><input id="sv-destino" list="sv-ciudades" value={f.destino || ''} onChange={set('destino')} style={iStyle} /></div>
              <div><Etiqueta>Dirección donde se recoge</Etiqueta><input value={f.direccion_origen || ''} onChange={set('direccion_origen')} style={iStyle} /></div>
              <div><Etiqueta>Dirección de entrega</Etiqueta><input value={f.direccion_destino || ''} onChange={set('direccion_destino')} style={iStyle} /></div>
              <div><Etiqueta>Fecha</Etiqueta><input id="sv-fecha" type="date" value={f.fecha || ''} onChange={set('fecha')} style={iStyle} /></div>
              <div><Etiqueta>Hora</Etiqueta><input id="sv-hora" value={f.hora || ''} onChange={set('hora')} placeholder="Ej: 7:00 a. m." style={iStyle} /></div>
              <div><Etiqueta>Vehículo</Etiqueta><input id="sv-vehiculo" list="sv-vehiculos" value={f.vehiculo || ''} onChange={set('vehiculo')} placeholder="Camión 350, mula…" style={iStyle} /></div>
              <div><Etiqueta>Qué se mueve</Etiqueta><input value={f.mercancia || ''} onChange={set('mercancia')} placeholder="Ej: contenedor 40' de electrodomésticos" style={iStyle} /></div>
              <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Contacto en el sitio</Etiqueta><input value={f.contacto_sitio || ''} onChange={set('contacto_sitio')} placeholder="Nombre y teléfono de quien entrega o recibe" style={iStyle} /></div>
            </div>
            <datalist id="sv-ciudades">{CIUDADES.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="sv-vehiculos">{VEHICULOS_SRV.map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="sv-proveedores">{[...new Set([...recursos.map(r => r.nombre), ...aliados.map(a => a.nombre)])].map(n => <option key={n} value={n} />)}</datalist>

            {/* Líneas */}
            <div>
              <Titulo>LO QUE INCLUYE · TU COSTO Y TU PRECIO</Titulo>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {ls.map((l, i) => {
                  const sub = n2(l.cantidad) * n2(l.precio), cos = n2(l.cantidad) * n2(l.costo)
                  return (
                    <div key={i} className="sv-linea" style={{ padding:8, borderRadius:10, background:'var(--bg4)', display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <select value={l.concepto} onChange={e => { updL(i, 'concepto', e.target.value); updL(i, 'unidad', CONCEPTOS.find(c => c.id === e.target.value)?.unidad || l.unidad) }} style={{ ...celda, width:170, flexShrink:0 }}>{CONCEPTOS.map(c => <option key={c.id} value={c.id}>{c.icono} {c.id}</option>)}</select>
                        <input value={l.detalle || ''} onChange={e => updL(i, 'detalle', e.target.value)} placeholder={l.concepto === 'Coteros' ? 'Detalle: ej. descargue contenedor 40 pies' : 'Detalle (lo ve el cliente)'} style={celda} />
                        <button onClick={() => { setCambios(true); setLs(p => p.filter((_, j) => j !== i)) }} title="Quitar" className="btn" style={{ padding:'2px 9px', fontSize:12, color:'var(--red)', width:'auto' }}>×</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'64px 84px 1fr 1fr 1.25fr', gap:6, alignItems:'end' }}>
                        <div><Etiqueta>Cant.</Etiqueta><input className="sv-cant" inputMode="decimal" value={l.cantidad} onChange={e => updL(i, 'cantidad', e.target.value)} style={{ ...celda, textAlign:'right' }} /></div>
                        <div><Etiqueta>Unidad</Etiqueta><input value={l.unidad || ''} onChange={e => updL(i, 'unidad', e.target.value)} style={celda} /></div>
                        <div><Etiqueta>Te cuesta c/u</Etiqueta><input className="sv-costo" inputMode="numeric" value={l.costo} onChange={e => updL(i, 'costo', e.target.value)} style={{ ...celda, textAlign:'right', color:'var(--red)' }} /></div>
                        <div><Etiqueta>Cobras c/u</Etiqueta><input className="sv-precio" inputMode="numeric" value={l.precio} onChange={e => updL(i, 'precio', e.target.value)} style={{ ...celda, textAlign:'right', color:'var(--gold)' }} /></div>
                        <div><Etiqueta>A quién le pagas</Etiqueta><input className="sv-prov" list="sv-proveedores" value={l.proveedor || ''} onChange={e => updL(i, 'proveedor', e.target.value)} style={celda} /></div>
                      </div>
                      {(sub > 0 || cos > 0) && <div style={{ fontSize:11, color:'var(--text3)', textAlign:'right' }}>Cobras <b style={{ color:'var(--gold)' }}>{cop(sub)}</b> · te cuesta <span style={{ color:'var(--red)' }}>{cop(cos)}</span> · ganas <b style={{ color: sub - cos >= 0 ? 'var(--green)' : 'var(--red)' }}>{cop(sub - cos)}</b></div>}
                    </div>
                  )
                })}
              </div>
              {ls.map((l, i) => l.concepto === 'Transporte' && tarifaRuta && !n2(l.precio) ? (
                <div key={'tr' + i} style={{ fontSize:11.5, color:'var(--text3)', marginTop:6 }}>
                  Tienes tarifa {tarifaRuta.origen} → {tarifaRuta.destino}: te cuesta {cop(tarifaRuta.costo_cop)} y la vendes en {cop(Number(tarifaRuta.costo_cop) + Number(tarifaRuta.margen_cop))}.
                  <button onClick={() => usarTarifa(i)} className="btn" style={{ fontSize:11, padding:'2px 8px', width:'auto', marginLeft:6 }}>Usar</button>
                </div>
              ) : null)}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                {CONCEPTOS.map(c => <button key={c.id} onClick={() => { setCambios(true); setLs(p => [...p, lineaVacia(c.id)]) }} className="btn sv-add" style={{ width:'auto', fontSize:11, padding:'4px 9px' }}>+ {c.icono} {c.id}</button>)}
              </div>
            </div>

            <div className="grid-2" style={{ gap:10 }}>
              <div><Etiqueta>Forma de pago</Etiqueta><select value={f.condicion_pago || 'anticipo_50'} onChange={set('condicion_pago')} style={iStyle}>{Object.entries(PAGOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><Etiqueta>Cotización válida por (días)</Etiqueta><input inputMode="numeric" value={f.vigencia_dias ?? ''} onChange={set('vigencia_dias')} style={iStyle} /></div>
              <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Condiciones para el cliente (salen en la cotización)</Etiqueta><textarea value={f.notas_cliente || ''} onChange={set('notas_cliente')} placeholder="Ej: incluye cargue y descargue en primer piso. Esperas adicionales se cobran por día." style={{ ...iStyle, minHeight:54, resize:'vertical' }} /></div>
              <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Notas internas (solo tú)</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
            </div>
          </div>

          {/* Derecha: números, estado y acciones */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {[['Cobras', cop(t.precio), 'var(--gold)', 'sv-total'], ['Te cuesta', cop(t.costo), 'var(--red)', 'sv-costo-total'], ['Ganas', cop(ganancia), ganancia >= 0 ? 'var(--green)' : 'var(--red)', 'sv-ganas']].map(([l, v, c, id]) => (
                <div key={l} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg4)', minWidth:0 }}>
                  <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
                  <div id={id} style={{ fontSize:17, fontWeight:800, color:c, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
                  {l === 'Ganas' && t.precio ? <div style={{ fontSize:11, color:'var(--text3)' }}>{fmt(ganancia / t.precio * 100, 0)}% de margen</div> : null}
                </div>
              ))}
            </div>

            {error && <div id="sv-error" style={{ fontSize:12.5, color:'var(--red)' }}>{error}</div>}
            {aviso && <div id="sv-aviso" style={{ fontSize:12.5, color:'var(--green)' }}>{aviso}</div>}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button id="sv-guardar" onClick={guardar} disabled={guardando} className="btn-green" style={{ flex:1, minWidth:140 }}>{guardando ? 'Guardando…' : nuevo ? 'Guardar cotización' : 'Guardar cambios'}</button>
              {!nuevo && <button id="sv-doc" onClick={() => setDoc(true)} className="btn" style={{ width:'auto' }}>📄 Cotización PDF</button>}
            </div>
            {desfase && !cambios && <div style={{ fontSize:12, color:'#E8A23A' }}>Lo que está en Caja no coincide con el servicio. Dale Guardar para corregirlo.</div>}

            {/* Paso a paso según el estado */}
            {f.estado === 'cotizado' && !nuevo && (
              <div className="panel" style={{ padding:14, border:'1px solid var(--gold-border)' }}>
                <Titulo color="var(--gold)">1 · ENVIAR Y CERRAR LA VENTA</Titulo>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {telCli && <a href={wa(telCli, primer, msgs.cotizacion)} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Enviar cotización por WhatsApp</a>}
                  <button id="sv-aceptar" onClick={aceptar} disabled={guardando} className="btn-gold" style={{ width:'auto' }}>✓ El cliente aceptó</button>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>Al aceptar queda la cuenta de cobro en Caja y Cartera, y cada costo como factura por pagar.</div>
              </div>
            )}

            {vendido && (
              <>
                {/* Pagos del cliente */}
                <div className="panel" style={{ padding:14 }}>
                  <Titulo>PAGOS DEL CLIENTE · {PAGOS[f.condicion_pago] || ''}</Titulo>
                  <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}><div style={{ width:`${Math.min(100, t.precio ? abonado / t.precio * 100 : 0)}%`, height:'100%', background: abonado >= t.precio - 1 ? 'var(--green)' : 'var(--gold)' }} /></div>
                  <div id="sv-pagos" style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginTop:6, color:'var(--text2)' }}>
                    <span>Abonado <b style={{ color:'var(--text)' }}>{cop(abonado)}</b> ({fmt(t.precio ? abonado / t.precio * 100 : 0, 0)}%)</span>
                    <span>Saldo <b style={{ color: saldo > 1 ? '#E8A23A' : 'var(--green)' }}>{cop(saldo)}</b></span>
                  </div>
                  {saldo > 1 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                      {abonado < 1 && <button id="sv-abono50" onClick={() => setAbono({ monto: Math.round(t.precio / 2), nota:'Anticipo 50%' })} className="btn" style={{ width:'auto', fontSize:12 }}>Abonó el 50% ({cop(t.precio / 2)})</button>}
                      <button id="sv-abono-saldo" onClick={() => setAbono({ monto: Math.round(saldo), nota: abonado ? 'Saldo' : 'Pago total' })} className="btn" style={{ width:'auto', fontSize:12 }}>{abonado ? 'Pagó el saldo' : 'Pagó el 100%'} ({cop(saldo)})</button>
                      <button onClick={() => setAbono({ monto:'', nota:'Abono' })} className="btn" style={{ width:'auto', fontSize:12 }}>Otro valor</button>
                    </div>
                  )}
                  {movs.filter(m => m.tipo === 'abono_cliente').map(m => <div key={m.id} style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>✓ {fechaCorta(m.fecha)} · {cop(m.monto)}{m.notas ? ' · ' + m.notas : ''}</div>)}
                </div>

                {/* Programación */}
                <div className="panel" style={{ padding:14, border:`1px solid ${ESTADOS.programado.c}55` }}>
                  <Titulo color={ESTADOS.programado.c}>2 · PROGRAMAR · QUIÉN VA</Titulo>
                  <div className="grid-2" style={{ gap:10 }}>
                    <div><Etiqueta>Conductor de Mi gente</Etiqueta>
                      <select id="sv-conductor" value={f.conductor_id || ''} onChange={e => elegirConductor(e.target.value)} style={iStyle}>
                        <option value="">{conductores.length ? 'Elegir…' : 'Agrega conductores en Mi gente'}</option>
                        {conductores.map(r => <option key={r.id} value={r.id}>{r.nombre}{r.placa ? ` · ${r.placa}` : ''}{r.vehiculo ? ` · ${r.vehiculo}` : ''}</option>)}
                      </select></div>
                    <div><Etiqueta>Placa</Etiqueta><input id="sv-placa" value={f.placa || ''} onChange={set('placa')} style={iStyle} /></div>
                    <div><Etiqueta>Conductor (nombre)</Etiqueta><input value={f.conductor || ''} onChange={set('conductor')} style={iStyle} /></div>
                    <div><Etiqueta>Teléfono del conductor</Etiqueta><input value={f.conductor_tel || ''} onChange={set('conductor_tel')} style={iStyle} /></div>
                  </div>
                  <div style={{ marginTop:10 }}><Etiqueta>Equipo (coteros, escolta…) · toca para asignar</Etiqueta>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                      {equipoDisp.length === 0 && <span style={{ fontSize:12, color:'var(--text4)' }}>Agrega coteros y escoltas en Mi gente.</span>}
                      {equipoDisp.map(r => { const on = equipo.some(x => x.id === r.id); return (
                        <button key={r.id} onClick={() => alternarEquipo(r)} className={on ? 'btn-gold sv-eq' : 'btn sv-eq'} style={{ width:'auto', fontSize:11.5, padding:'4px 10px' }}>{TIPOS_RECURSO[r.tipo]?.icono} {r.nombre}{on ? ' ✓' : ''}</button>
                      ) })}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
                    {f.estado === 'aceptado' && <button id="sv-programar" onClick={programar} className="btn-gold" style={{ width:'auto' }}>📅 Marcar programado</button>}
                    {telCli && <a id="sv-wa-confirmar" href={wa(telCli, primer, msgs.confirmacion)} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Confirmar al cliente</a>}
                    {f.conductor_tel && <a href={wa(f.conductor_tel, f.conductor, msgGente(f.conductor, 'conductor'))} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Avisar al conductor</a>}
                    {equipo.filter(x => x.telefono).map(x => <a key={x.id} href={wa(x.telefono, x.nombre, msgGente(x.nombre, x.tipo))} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366', fontSize:11.5 }}>💬 {x.nombre.split(' ')[0]}</a>)}
                  </div>
                  {cambios && <div style={{ fontSize:11, color:'#E8A23A', marginTop:8 }}>Guarda los cambios antes de mandar los mensajes para que salgan con los datos nuevos.</div>}
                </div>

                {/* Ejecución */}
                <div className="panel" style={{ padding:14, border:`1px solid ${ESTADOS.en_curso.c}55` }}>
                  <Titulo color={ESTADOS.en_curso.c}>3 · EJECUCIÓN</Titulo>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['aceptado', 'programado'].includes(f.estado) && <button id="sv-iniciar" onClick={() => cambiarEstado('en_curso')} className="btn" style={{ width:'auto' }}>▶ Arrancó el servicio</button>}
                    {f.estado === 'en_curso' && telCli && <a href={wa(telCli, primer, msgs.en_curso)} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Avisar que va en camino</a>}
                    {f.estado !== 'completado' && <button id="sv-completar" onClick={() => cambiarEstado('completado', { completado_at: new Date().toISOString() })} className="btn-green" style={{ width:'auto' }}>✓ Completado</button>}
                    {f.estado === 'completado' && telCli && <a href={wa(telCli, primer, msgs.completado)} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Avisar que terminó{saldo > 1 ? ' y cobrar saldo' : ''}</a>}
                    {f.estado === 'completado' && <button onClick={() => cambiarEstado('en_curso', { completado_at: null })} className="btn" style={{ width:'auto', fontSize:11 }}>↺ Reabrir</button>}
                  </div>
                </div>

                {/* Lo que debes */}
                <div className="panel" style={{ padding:14 }}>
                  <Titulo>LO QUE LE DEBES A TU GENTE Y PROVEEDORES</Titulo>
                  {Object.keys(porProv).length === 0 ? <Vacio>Sin costos.</Vacio> : Object.entries(porProv).map(([p, v]) => {
                    const pag = pagadoProv(p), falta = Math.max(0, v - pag)
                    return (
                      <div key={p} className="sv-prov-fila" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ fontSize:13, color:'var(--text)' }}>{p}<div style={{ fontSize:11, color: falta > 1 ? '#E8A23A' : 'var(--green)' }}>{falta > 1 ? `debes ${cop(falta)}` : '✓ pagado'}</div></div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <b style={{ color:'var(--red)' }}>{cop(v)}</b>
                          {falta > 1 && <button onClick={() => setPagoProv({ proveedor: p, monto: Math.round(falta) })} className="btn sv-pagar" style={{ width:'auto', fontSize:11, padding:'3px 9px' }}>Pagar</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {f.estado === 'cancelado' && <div className="panel" style={{ padding:14, color:'var(--text3)', fontSize:13 }}>Cancelado{f.motivo ? `: ${f.motivo}` : ''}. <button onClick={() => cambiarEstado('cotizado', { motivo:null })} className="btn" style={{ width:'auto', fontSize:11, marginLeft:8 }}>↺ Volver a cotizado</button></div>}
          </div>
        </div>
      </div>

      {doc && <DocCotizacion srv={{ ...f, titulo }} lineas={ls} cliente={cli || nuevoCli} empresa={empresa} onCerrar={() => setDoc(false)} />}
      {abono && <ModalPago tipo="abono_cliente" titulo={`Pago de ${cli?.nombre || 'cliente'}`} inicial={abono} cuentas={cuentas} cerrado={cerrado}
        base={{ cliente_id: f.cliente_id, servicio_id: f.id, concepto:'flete', referencia: `${codigoSrv(f)} · ${titulo}`.slice(0, 120) }}
        onCerrar={() => setAbono(null)} onGuardado={async () => { setAbono(null); setAviso('✓ Pago registrado en Caja'); await onCambio() }} />}
      {pagoProv && <ModalPago tipo="pago_proveedor" titulo={`Pago a ${pagoProv.proveedor}`} inicial={{ monto: pagoProv.monto, nota:'' }} cuentas={cuentas} cerrado={cerrado}
        base={{ proveedor: pagoProv.proveedor, servicio_id: f.id, concepto:'flete', referencia: `${codigoSrv(f)} · ${titulo}`.slice(0, 120) }}
        onCerrar={() => setPagoProv(null)} onGuardado={async () => { setPagoProv(null); setAviso('✓ Pago registrado en Caja'); await onCambio() }} />}
      {cancelar && <ModalCancelar srv={f} cobrado={cobrado} abonado={abonado} movs={movs} cerrado={cerrado}
        onCerrar={() => setCancelar(false)} onListo={async (motivo) => { setCancelar(false); await accion(async () => guardarTodo({ estado:'cancelado', motivo }), 'Servicio cancelado') }} />}
    </div>
  )
}

// ── Pago del cliente o a un proveedor (entra a Caja con su cuenta) ──────────
function ModalPago({ tipo, titulo, inicial, cuentas, cerrado, base, onCerrar, onGuardado }) {
  const [monto, setMonto] = useState(String(inicial.monto || ''))
  const [cuenta, setCuenta] = useState(cuentas[0]?.id || '')
  const [fecha, setFecha] = useState(hoyISO())
  const [nota, setNota] = useState(inicial.nota || '')
  const [error, setError] = useState('')
  const guardar = async () => {
    if (!n2(monto)) return setError('Escribe el valor.')
    if (!cuenta) return setError('Elige la cuenta (crea una en Caja si no tienes).')
    if (cerrado(fecha)) return setError('Ese mes ya está cerrado en Caja.')
    const r = await supabase.from('lrm_movimientos').insert({ ...base, tipo, monto: n2(monto), cuenta_id: cuenta, fecha, notas: nota || null })
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:14, padding:20, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:12 }}>{titulo}</div>
        <div className="grid-2" style={{ gap:10 }}>
          <div><Etiqueta>Valor</Etiqueta><input id="pg-monto" inputMode="numeric" value={monto ? Number(n2(monto)).toLocaleString('es-CO') : ''} onChange={e => setMonto(e.target.value.replace(/\D/g, ''))} style={iStyle} autoFocus /></div>
          <div><Etiqueta>Fecha</Etiqueta><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={iStyle} /></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>{tipo === 'abono_cliente' ? 'Entró a la cuenta' : 'Sale de la cuenta'}</Etiqueta>
            <select id="pg-cuenta" value={cuenta} onChange={e => setCuenta(e.target.value)} style={iStyle}>{cuentas.length ? cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>) : <option value="">No tienes cuentas: créalas en Caja</option>}</select></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Nota</Etiqueta><input value={nota} onChange={e => setNota(e.target.value)} style={iStyle} /></div>
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="pg-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Registrar</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Cancelar: guarda el motivo; si no hay pagos, limpia lo que estaba en Caja ──
function ModalCancelar({ srv, cobrado, abonado, movs, cerrado, onCerrar, onListo }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const pagosProv = movs.filter(m => m.tipo === 'pago_proveedor')
  const ok = async () => {
    if (!motivo.trim()) return setError('Escribe el motivo.')
    // Lo causado (cobro y costos) se quita si el mes está abierto y no hay plata de por medio
    if (!abonado && !pagosProv.length) {
      for (const m of movs.filter(m => (m.tipo === 'cobro_cliente' || m.tipo === 'costo_proveedor') && !cerrado(m.fecha))) await supabase.from('lrm_movimientos').delete().eq('id', m.id)
    }
    onListo(motivo.trim())
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:14, padding:20, width:'100%', maxWidth:440, border:'1px solid rgba(224,82,82,0.4)' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{srv.estado === 'cotizado' ? 'La cotización no se dio' : `Cancelar ${codigoSrv(srv)}`}</div>
        <input id="sv-motivo" list="sv-motivos" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="¿Por qué?" style={iStyle} autoFocus />
        <datalist id="sv-motivos">{['Precio alto', 'El cliente consiguió otro transporte', 'Se aplazó', 'No había vehículo disponible', 'El cliente canceló'].map(m => <option key={m} value={m} />)}</datalist>
        {(cobrado > 0) && <div style={{ fontSize:12, color:'#E8A23A', marginTop:10 }}>
          {abonado || pagosProv.length ? 'Hay pagos registrados: lo que está en Caja se queda. Si hay que devolver plata o anular, hazlo en Caja.' : 'Se quita la cuenta de cobro y los costos que estaban en Caja.'}
        </div>}
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="sv-cancelar-ok" onClick={ok} className="btn" style={{ flex:1, color:'var(--red)' }}>Confirmar</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Volver</button>
        </div>
      </div>
    </div>
  )
}

// ── Cotización en PDF (solo precios: no sale tu costo ni a quién le pagas) ──
function DocCotizacion({ srv, lineas, cliente, empresa, onCerrar }) {
  const ls = lineas.filter(l => n2(l.precio))
  const total = ls.reduce((s, l) => s + n2(l.cantidad) * n2(l.precio), 0)
  const hoy = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cotización ${escH(codigoSrv(srv))} · ${escH(cliente?.nombre)}</title><style>
    @page{size:letter;margin:12mm}*{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:20px;background:#fff;font-size:11.5px;line-height:1.4}
    .doc{max-width:760px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #C9A84C;padding-bottom:10px}
    .emp{font-size:10.5px;color:#555;margin-top:5px}.num{text-align:right}.num .t{font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
    .num .n1{font-size:15px;font-weight:800;margin:2px 0}.num div{font-size:10.5px;color:#555}
    h4{margin:16px 0 6px;font-size:10.5px;letter-spacing:2px;color:#8a6d1f}
    .datos{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;border:1px solid #e5dcc3;border-radius:10px;padding:10px 12px}
    .datos small{display:block;font-size:9.5px;color:#8a8a8a;text-transform:uppercase;letter-spacing:1px}
    table{width:100%;border-collapse:collapse}th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;color:#777;padding:6px 7px;border-bottom:1.5px solid #1b1b1b}
    td{padding:7px;border-bottom:1px solid #f0eadb;vertical-align:top}td.n,th.n{text-align:right;white-space:nowrap}
    .total{margin-top:10px;display:flex;justify-content:flex-end}.total div{background:#1b1b1b;color:#fff;border-radius:10px;padding:10px 16px;text-align:right}
    .total small{display:block;color:#C9A84C;font-size:10px;letter-spacing:1px}.total b{font-size:19px}
    .notas{margin-top:14px;font-size:10.5px;color:#444;padding-left:16px}.notas li{margin:3px 0}
    .pie{margin-top:16px;padding-top:10px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:10.5px;color:#555}.lema{color:#8a6d1f;font-weight:700}
    @media print{body{padding:0}}</style></head><body><div class="doc">
    <div class="top"><div>${logoDocumentoHTML()}<div class="emp">${escH(empresa.ciudad)} · ${escH(empresa.whatsapp)} · ${escH(empresa.correo)}</div></div>
      <div class="num"><div class="t">COTIZACIÓN DE SERVICIO</div><div class="n1">${escH(codigoSrv(srv))}</div><div>${hoy} · válida ${escH(srv.vigencia_dias || 8)} días</div><div>Cliente: <b>${escH(cliente?.nombre || '')}</b></div></div></div>
    <h4>SERVICIO</h4>
    <div class="datos">
      <div style="grid-column:1/-1"><small>Descripción</small><b>${escH(srv.titulo)}</b></div>
      ${srv.origen || srv.direccion_origen ? `<div><small>Recoge en</small>${escH([srv.direccion_origen, srv.origen].filter(Boolean).join(', '))}</div>` : ''}
      ${srv.destino || srv.direccion_destino ? `<div><small>Entrega en</small>${escH([srv.direccion_destino, srv.destino].filter(Boolean).join(', '))}</div>` : ''}
      ${srv.fecha ? `<div><small>Fecha</small>${escH(fechaLarga(srv.fecha))}${srv.hora ? ' · ' + escH(srv.hora) : ''}</div>` : ''}
      ${srv.vehiculo ? `<div><small>Vehículo</small>${escH(srv.vehiculo)}</div>` : ''}
      ${srv.mercancia ? `<div style="grid-column:1/-1"><small>Carga</small>${escH(srv.mercancia)}</div>` : ''}
    </div>
    <h4>VALOR</h4>
    <table><thead><tr><th>Concepto</th><th>Detalle</th><th class="n">Cantidad</th><th class="n">Valor unitario</th><th class="n">Valor</th></tr></thead><tbody>
      ${ls.map(l => `<tr><td>${escH(l.concepto)}</td><td>${escH(l.detalle || '')}</td><td class="n">${fmt(l.cantidad)} ${escH(l.unidad || '')}</td><td class="n">${cop(n2(l.precio))}</td><td class="n"><b>${cop(n2(l.cantidad) * n2(l.precio))}</b></td></tr>`).join('')}
    </tbody></table>
    <div class="total"><div><small>TOTAL</small><b>${cop(total)}</b></div></div>
    <ul class="notas">
      <li>Forma de pago: ${escH(PAGOS[srv.condicion_pago] || '')}.</li>
      ${String(srv.notas_cliente || '').split('\n').filter(x => x.trim()).map(x => `<li>${escH(x.trim())}</li>`).join('')}
      ${empresa.condiciones ? `<li>${escH(empresa.condiciones)}</li>` : ''}
    </ul>
    <div class="pie"><span>${escH(empresa.responsable)} · ${escH(empresa.nombre)}</span><span class="lema">We bring it. Safe and on time.</span></div>
    </div></body></html>`
  const imprimir = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close() }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:16, width:'100%', maxWidth:880, height:'94vh', display:'flex', flexDirection:'column', gap:10, border:'1px solid var(--gold-border)' }}>
        <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, color:'var(--text3)' }}>Así la ve el cliente · sin tu costo ni tu ganancia</div>
          <div style={{ display:'flex', gap:8 }}><button onClick={imprimir} className="btn-gold" style={{ width:'auto' }}>Descargar PDF / Imprimir</button><button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cerrar</button></div>
        </div>
        <iframe id="sv-doc-frame" title="Cotización" srcDoc={html} style={{ flex:1, width:'100%', border:'none', borderRadius:10, background:'#fff' }} />
      </div>
    </div>
  )
}

// ── Mi gente: conductores, coteros, escoltas… ───────────────────────────────
const RECURSO_VACIO = { tipo:'conductor', nombre:'', telefono:'', documento:'', vehiculo:'', placa:'', capacidad:'', tarifa_cop:'', unidad:'servicio', notas:'', activo:true }
function MiGente({ recursos, srvs, aliados, onCambio }) {
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const usos = id => srvs.filter(s => s.estado !== 'cancelado' && (s.conductor_id === id || (Array.isArray(s.equipo) && s.equipo.some(x => x.id === id)))).length
  const lista = recursos.filter(r => filtro === 'todos' || r.tipo === filtro)
  return (
    <div className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['todos', 'Todos'], ...Object.entries(TIPOS_RECURSO).map(([k, v]) => [k, `${v.icono} ${v.l}`])].map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)} className={filtro === k ? 'btn-gold' : 'btn'} style={{ width:'auto', fontSize:11.5, padding:'4px 10px' }}>{l} ({k === 'todos' ? recursos.length : recursos.filter(r => r.tipo === k).length})</button>
          ))}
        </div>
        <button id="mg-nuevo" onClick={() => setEditando({ ...RECURSO_VACIO, tipo: filtro !== 'todos' ? filtro : 'conductor' })} className="btn-gold" style={{ width:'auto' }}>+ Agregar persona</button>
      </div>
      {lista.length === 0 ? <Vacio>Agrega a tu gente: conductores con su vehículo y placa, coteros, escoltas… así los asignas a cada servicio con un clic.</Vacio> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap:10 }}>
          {lista.map(r => {
            const t = TIPOS_RECURSO[r.tipo] || TIPOS_RECURSO.otro
            const link = r.telefono ? linkWhatsApp(r.telefono, r.nombre, `Hola ${r.nombre.split(' ')[0]}, `) : null
            return (
              <div key={r.id} className="mg-card" style={{ padding:'11px 13px', borderRadius:10, background:'var(--bg4)', opacity: r.activo === false ? 0.5 : 1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{t.icono} {r.nombre}</div>
                  <button onClick={() => setEditando(r)} className="btn" style={{ width:'auto', fontSize:11, padding:'2px 8px' }}>Editar</button>
                </div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{t.l}{r.vehiculo ? ` · ${r.vehiculo}` : ''}{r.placa ? ` · ${r.placa}` : ''}{r.capacidad ? ` · ${r.capacidad}` : ''}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:6, alignItems:'center' }}>
                  <span style={{ color:'var(--text2)' }}>{r.tarifa_cop ? `${cop(r.tarifa_cop)} / ${r.unidad || 'servicio'}` : 'Sin tarifa'} · {usos(r.id)} servicio{usos(r.id) === 1 ? '' : 's'}</span>
                  {link && <a href={link} target="_blank" rel="noreferrer" style={{ color:'#25D366', textDecoration:'none', fontSize:12 }}>💬 {r.telefono}</a>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {editando && <ModalRecurso recurso={editando} aliados={aliados} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio() }} />}
    </div>
  )
}

function ModalRecurso({ recurso, aliados, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...RECURSO_VACIO, ...recurso, tarifa_cop: String(recurso.tarifa_cop ?? '') })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Escribe el nombre.')
    const { id, created_at, ...d } = f
    const datos = { ...d, nombre: d.nombre.trim(), tarifa_cop: n2(d.tarifa_cop) || null, aliado_id: d.aliado_id || null }
    const r = id ? await supabase.from('lrm_recursos').update(datos).eq('id', id) : await supabase.from('lrm_recursos').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_recursos').delete().eq('id', f.id); onGuardado() }
  const esConductor = f.tipo === 'conductor'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{f.id ? 'Editar' : 'Agregar a mi gente'}</div>
        <div className="grid-2" style={{ gap:10 }}>
          <div><Etiqueta>Tipo</Etiqueta><select id="mg-tipo" value={f.tipo} onChange={set('tipo')} style={iStyle}>{Object.entries(TIPOS_RECURSO).map(([k, v]) => <option key={k} value={k}>{v.icono} {v.l}</option>)}</select></div>
          <div><Etiqueta>Nombre</Etiqueta><input id="mg-nombre" value={f.nombre} onChange={set('nombre')} style={iStyle} autoFocus /></div>
          <div><Etiqueta>WhatsApp</Etiqueta><input id="mg-tel" value={f.telefono || ''} onChange={set('telefono')} style={iStyle} /></div>
          <div><Etiqueta>Cédula / NIT</Etiqueta><input value={f.documento || ''} onChange={set('documento')} style={iStyle} /></div>
          {esConductor && <>
            <div><Etiqueta>Vehículo</Etiqueta><input id="mg-vehiculo" list="sv-vehiculos-mg" value={f.vehiculo || ''} onChange={set('vehiculo')} style={iStyle} /><datalist id="sv-vehiculos-mg">{VEHICULOS_SRV.map(v => <option key={v} value={v} />)}</datalist></div>
            <div><Etiqueta>Placa</Etiqueta><input id="mg-placa" value={f.placa || ''} onChange={e => setF(p => ({ ...p, placa: e.target.value.toUpperCase() }))} style={iStyle} /></div>
            <div><Etiqueta>Capacidad</Etiqueta><input value={f.capacidad || ''} onChange={set('capacidad')} placeholder="Ej: 3,5 t · 40 pies" style={iStyle} /></div>
            <div><Etiqueta>Empresa / aliado (opcional)</Etiqueta><select value={f.aliado_id || ''} onChange={set('aliado_id')} style={iStyle}><option value="">Independiente</option>{aliados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
          </>}
          <div><Etiqueta>Lo que normalmente le pagas</Etiqueta><input id="mg-tarifa" inputMode="numeric" value={f.tarifa_cop ? Number(n2(f.tarifa_cop)).toLocaleString('es-CO') : ''} onChange={e => setF(p => ({ ...p, tarifa_cop: e.target.value.replace(/\D/g, '') }))} style={iStyle} /></div>
          <div><Etiqueta>Por</Etiqueta><select value={f.unidad || 'servicio'} onChange={set('unidad')} style={iStyle}>{['servicio', 'viaje', 'día', 'hora', 'jornada'].map(u => <option key={u}>{u}</option>)}</select></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Notas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
          <label style={{ fontSize:12, color:'var(--text2)', display:'flex', gap:6, alignItems:'center' }}><input type="checkbox" checked={f.activo !== false} onChange={set('activo')} /> Disponible</label>
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="mg-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro?' : 'Borrar'}</button>}
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}