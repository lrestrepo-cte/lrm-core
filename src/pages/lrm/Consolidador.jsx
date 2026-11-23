// @ts-nocheck
// LRM Trade Consulting · Consolidador
// Juntas la carga de varios clientes en un mismo envío (ej. Shanghái → Barranquilla) y el sistema te dice
// cuántos contenedores llenas, qué combinación te sale más barata con las tarifas de tus aliados,
// cuánto le cobras a cada cliente y cuánto ganas.
// Tablas: lrm_consolidados, lrm_consolidado_items (SQL 12), lrm_consolidado_productos (SQL 16) · usa lrm_tarifas_flete (SQL 11)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { linkWhatsApp, hoyISO, fechaCorta } from './LRMClientes'
import { CONTENEDORES } from './Aliados'
import { useDatosLRM } from './datosLRM'
import { useTarifas, escaleraPara, costoPara, escalonDe, tramoTexto, CONSOLIDADO } from './tarifasLRM'
import ModalListaEmpaque from './ListaEmpaque'
import Documentos from '../../components/Documentos'
import CotizacionConsolidado from './CotizacionConsolidado'
import { RUTAS, EXTRA_HITOS, MERCANCIA, FRECUENCIAS, DIAS, rutaDe, rutaPorOrigen, tituloHito, siguienteHito, estadoTrasHito, semanaISO, proximoDia, masDias } from './rutasConsolidado'
import { linkRastreo } from './datosLRM'
import { descargarExcel } from './leerListaEmpaque'

// Precio por m³ de un item, en su moneda (columnas nuevas tarifa_m3 + moneda; las viejas eran tarifa_m3_usd)
// Nadie cobra más de US$10.000 por m³: si viene "en dólares" con una cifra así, en realidad son pesos
export const monedaReal = (v, m) => m === 'USD' && Number(v) > 10000 ? 'COP' : (m || 'COP')
const tarifaItem = i => i.tarifa_m3 != null && i.tarifa_m3 !== '' ? { v: n2Raw(i.tarifa_m3), m: monedaReal(i.tarifa_m3, i.moneda) } : { v: n2Raw(i.tarifa_m3_usd), m: monedaReal(i.tarifa_m3_usd, 'USD') }
function n2Raw(v) { return Number(v) || 0 }

const usd = n => 'US$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })
const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'24px 0', textAlign:'center' }}>{children}</div>
// Estado de la carga de cada cliente. Las canceladas no cuentan en volumen, peso ni cobro.
const ESTADO_ITEM = {
  por_llegar: { l:'Por llegar', c:'#E8A23A' },
  en_bodega:  { l:'✓ En bodega', c:'var(--green)' },
  novedad:    { l:'⚠ Con novedad', c:'#E05252' },
  cancelado:  { l:'Cancelada', c:'var(--text4)' },
}
const activa = i => i.estado !== 'cancelado'
const ESTADOS = { abierto:{ l:'Abierto · recibiendo carga', c:'#4caf50' }, cerrado:{ l:'Cerrado', c:'#E8A23A' }, despachado:{ l:'Despachado', c:'#378ADD' }, entregado:{ l:'Entregado', c:'#8A94A6' } }
const TIPOS_FCL = ['40HC', '40GP', '20GP']
const vigente = t => !t.vigente_hasta || t.vigente_hasta >= hoyISO()

// ── Cálculo: la combinación de contenedores (y carga suelta) más barata ─────
export function planes(m3, kg, tarifasRuta) {
  if (!m3) return []
  const barata = tipo => tarifasRuta.filter(t => t.tipo === tipo && vigente(t)).sort((a, b) => n2(a.costo_usd) - n2(b.costo_usd))[0]
  const costo = { '20GP': barata('20GP'), '40GP': barata('40GP'), '40HC': barata('40HC') }
  const lcl = barata('LCL')
  const sinTarifas = !costo['20GP'] && !costo['40GP'] && !costo['40HC'] && !lcl
  const max = Math.ceil(m3 / 28) + 1
  const out = []
  for (let a = 0; a <= Math.min(max, 8); a++) for (let b = 0; b <= Math.min(max, 6); b++) for (let c = 0; c <= Math.min(max, 6); c++) {
    const n = { '40HC': a, '40GP': b, '20GP': c }
    if (!sinTarifas && TIPOS_FCL.some(t => n[t] && !costo[t])) continue
    const cap = TIPOS_FCL.reduce((s, t) => s + n[t] * CONTENEDORES[t].util, 0)
    const capKg = TIPOS_FCL.reduce((s, t) => s + n[t] * CONTENEDORES[t].kg, 0)
    const resto = Math.max(0, m3 - cap)
    if (resto > 0 && (sinTarifas || !lcl)) continue
    if (resto === 0 && cap - m3 >= 28 && a + b + c > 1) continue                 // sobra un contenedor entero
    if (cap > 0 && kg > capKg + (resto ? kg * resto / m3 : 0)) continue          // se pasa de peso
    const m3Lcl = resto ? Math.max(resto, n2(lcl?.minimo_m3) || 1) : 0
    const total = sinTarifas ? null : TIPOS_FCL.reduce((s, t) => s + n[t] * n2(costo[t]?.costo_usd), 0) + m3Lcl * n2(lcl?.costo_usd)
    const partes = TIPOS_FCL.filter(t => n[t]).map(t => `${n[t]}×${t}`)
    if (resto) partes.push(`${fmt(resto)} m³ en carga suelta`)
    out.push({ n, cap, resto, total, texto: partes.join(' + '), lleno: cap ? Math.min(m3, cap) / cap : 1, contenedores: a + b + c, costo, lcl })
  }
  return out.sort((x, y) => sinTarifas ? (x.contenedores - y.contenedores || x.cap - y.cap) : (x.total - y.total || x.contenedores - y.contenedores))
    .filter((p, i, arr) => arr.findIndex(q => q.texto === p.texto) === i).slice(0, 4)
}

export default function Consolidador() {
  const [lista, setLista] = useState([])
  const [items, setItems] = useState([])
  const [tarifas, setTarifas] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [movsCaja, setMovsCaja] = useState([])
  const [cierres, setCierres] = useState([])
  const [hitos, setHitos] = useState([])
  const [filtroRuta, setFiltroRuta] = useState('todas')
  const [abierto, setAbierto] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const cargar = async () => {
    const [c, i, t, cl] = await Promise.all([
      supabase.from('lrm_consolidados').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_consolidado_items').select('*').order('created_at'),
      supabase.from('lrm_tarifas_flete').select('*'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
    ])
    if (c.error || i.error) { setFaltaTabla(true); return }
    setLista(c.data || []); setItems(i.data || []); setTarifas(t.data || []); setClientes(cl.data || [])
    const pr = await supabase.from('lrm_consolidado_productos').select('id,item_id,consolidado_id')
    setProductos(pr.error ? null : (pr.data || []))   // null = falta el SQL 16
    const [mv, ci] = await Promise.all([
      supabase.from('lrm_movimientos').select('id,tipo,monto,fecha,cliente_id,proveedor,consolidado_id,notas').not('consolidado_id', 'is', null),
      supabase.from('lrm_cierres').select('mes'),
    ])
    setMovsCaja(mv.error ? null : (mv.data || []))   // null = falta el SQL 18
    setCierres((ci.data || []).map(x => x.mes))
    const hi = await supabase.from('lrm_consolidado_hitos').select('*').order('fecha').order('created_at')
    setHitos(hi.error ? null : (hi.data || []))   // null = falta el SQL 20
  }
  useEffect(() => { cargar() }, [])
  if (faltaTabla) return <div className="panel" style={{ border:'1px solid var(--gold-border)', color:'var(--gold)', fontSize:13 }}>Para usar el Consolidador corre en Supabase el archivo <b>12_lrm_consolidados.sql</b>.</div>

  const cons = lista.find(c => c.id === abierto)
  if (cons) return <Detalle cons={cons} items={items.filter(i => i.consolidado_id === cons.id)} productos={productos} movsCaja={movsCaja && movsCaja.filter(m => m.consolidado_id === cons.id)} cierres={cierres} hitos={hitos && hitos.filter(h => h.consolidado_id === cons.id)} tarifas={tarifas} clientes={clientes} onVolver={() => setAbierto(null)} onCambio={cargar} onAbrir={setAbierto} />
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:13, color:'var(--text3)' }}>Junta la carga de varios clientes y llena contenedores.</div>
        <button id="cs-nuevo" onClick={() => setNuevo(true)} className="btn-gold" style={{ width:'auto' }}>+ Nuevo consolidado</button>
      </div>
      {lista.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['todas', 'Todas las rutas'], ...Object.entries(RUTAS).filter(([k]) => lista.some(c => rutaDe(c) === RUTAS[k])).map(([k, r]) => [k, `${r.bandera} ${r.l}`])].map(([k, l]) => (
            <button key={k} onClick={() => setFiltroRuta(k)} className={filtroRuta === k ? 'btn-gold' : 'btn'} style={{ width:'auto', fontSize:12 }}>{l} ({k === 'todas' ? lista.length : lista.filter(c => rutaDe(c) === RUTAS[k]).length})</button>
          ))}
        </div>
      )}
      {lista.length === 0 ? <div className="panel"><Vacio>Crea tu primer consolidado: Miami semanal, Panamá o China.</Vacio></div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap:12 }}>
          {lista.filter(c => filtroRuta === 'todas' || rutaDe(c) === RUTAS[filtroRuta]).map(c => {
            const its = items.filter(i => i.consolidado_id === c.id && activa(i))
            const m3 = its.reduce((s, i) => s + n2(i.cbm), 0)
            const nCli = new Set(its.map(i => i.cliente_id)).size
            const mejor = planes(m3, its.reduce((s, i) => s + n2(i.peso_kg), 0), tarifas.filter(t => t.origen === c.origen && t.destino === c.destino))[0]
            const e = ESTADOS[c.estado] || ESTADOS.abierto
            const r = rutaDe(c), ult = (hitos || []).filter(h => h.consolidado_id === c.id).slice(-1)[0]
            return (
              <div key={c.id} onClick={() => setAbierto(c.id)} className="panel cs-card" style={{ cursor:'pointer', borderLeft:`3px solid ${e.c}` }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{r.bandera} CONS-{String(c.numero || '').padStart(3, '0')} · {c.origen} → {c.destino}{c.mercancia === 'especial' ? ' · especial' : ''}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
                <div style={{ fontSize:12, color:e.c, marginTop:2 }}>{e.l}{c.fecha_cierre ? ` · cierra ${fechaCorta(c.fecha_cierre)}` : ''}</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginTop:8 }}><b style={{ color:'var(--text)' }}>{fmt(m3)} m³</b> · {nCli} cliente{nCli === 1 ? '' : 's'} · {its.length} carga{its.length === 1 ? '' : 's'}</div>
                {mejor && <div style={{ fontSize:12, color:'var(--gold)', marginTop:4 }}>{mejor.texto}{mejor.cap ? ` · ${fmt(mejor.lleno * 100, 0)}% lleno` : ''}</div>}
                {ult && <div style={{ fontSize:11.5, color:'var(--text2)', marginTop:4 }}>📍 {ult.titulo} · {fechaCorta(ult.fecha)}</div>}
              </div>
            )
          })}
        </div>
      )}
      {nuevo && <ModalConsolidado tarifas={tarifas} onCerrar={() => setNuevo(false)} onGuardado={async (id) => { setNuevo(false); await cargar(); setAbierto(id) }} />}
    </div>
  )
}

function ModalConsolidado({ cons, tarifas, onCerrar, onGuardado, onBorrado }) {
  const origenes = [...new Set(['Shanghái', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Colón (Panamá)', ...tarifas.map(t => t.origen)])]
  const [f, setF] = useState({ nombre:'', origen:'Shanghái', destino:'Barranquilla', fecha_cierre:'', notas:'', ruta:'china', mercancia:'general', frecuencia:'por_contenedor', ...(cons || {}) })
  // Arranque rápido por ruta: Miami semanal, Panamá, China
  const usarRuta = k => {
    const r = RUTAS[k], hoy = hoyISO()
    const cierre = r.diaCierre ? proximoDia(hoy, r.diaCierre) : ''
    const mes = new Date(hoy + 'T12:00:00').toLocaleDateString('es-CO', { month:'long' })
    setF(p => ({ ...p, ruta:k, origen: r.origen || p.origen, mercancia: r.mercancia, frecuencia: r.frecuencia, dia_cierre: r.diaCierre || null,
      fecha_cierre: cierre || p.fecha_cierre, nombre: k === 'miami' ? `Miami · semana ${semanaISO(cierre || hoy)}` : `${r.origen || r.l} · ${mes}` }))
  }
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const [confirmar, setConfirmar] = useState(false)
  const borrarCons = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_consolidados').delete().eq('id', f.id); onBorrado ? onBorrado() : onGuardado() }
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Ponle un nombre, ej. "Shanghái · diciembre".')
    const datos = { nombre: f.nombre.trim(), origen: f.origen, destino: f.destino, fecha_cierre: f.fecha_cierre || null, notas: f.notas || null }
    if (f.ruta || (cons && 'ruta' in cons)) Object.assign(datos, { ruta: f.ruta || rutaPorOrigen(f.origen), mercancia: f.mercancia || 'general', frecuencia: f.frecuencia || null, dia_cierre: f.dia_cierre ? Number(f.dia_cierre) : null })
    if (f.etd || f.eta || (cons && 'etd' in cons)) Object.assign(datos, { etd: f.etd || null, eta: f.eta || null })
    if (f.etd && f.eta && f.eta < f.etd) return setError('La llegada (ETA) no puede ser antes de la salida (ETD).')
    const r = f.id ? await supabase.from('lrm_consolidados').update(datos).eq('id', f.id).select().single() : await supabase.from('lrm_consolidados').insert(datos).select().single()
    if (r.error) return setError(/ruta|mercancia|frecuencia|dia_cierre/.test(r.error.message) ? 'Para las rutas y frecuencias corre en Supabase el archivo 20_lrm_hitos_rutas.sql.' : /etd|eta/.test(r.error.message) ? 'Para guardar las fechas de salida y llegada corre en Supabase el archivo 17_lrm_consolidado_fechas.sql.' : 'No se pudo guardar: ' + r.error.message)
    onGuardado(r.data?.id || f.id)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:480, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{f.id ? 'Editar consolidado' : 'Nuevo consolidado'}</div>
        {!f.id && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {Object.entries(RUTAS).map(([k, r]) => <button key={k} type="button" id={`cs-ruta-${k}`} onClick={() => usarRuta(k)} className={f.ruta === k ? 'btn-gold' : 'btn'} style={{ width:'auto', fontSize:12 }}>{r.bandera} {r.l}{r.frecuencia === 'semanal' ? ' semanal' : ''}</button>)}
          </div>
        )}
        <div style={{ marginBottom:10 }}><Etiqueta>Nombre</Etiqueta><input id="cs-nombre" value={f.nombre} onChange={set('nombre')} placeholder="Shanghái · diciembre" style={iStyle} autoFocus /></div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Origen</Etiqueta><input id="cs-origen" list="cs-origenes" value={f.origen} onChange={set('origen')} style={iStyle} /><datalist id="cs-origenes">{origenes.map(o => <option key={o} value={o} />)}</datalist></div>
          <div><Etiqueta>Destino</Etiqueta><input value={f.destino} onChange={set('destino')} style={iStyle} /></div>
          <div><Etiqueta>Ruta</Etiqueta><select id="cs-ruta" value={f.ruta || rutaPorOrigen(f.origen)} onChange={set('ruta')} style={iStyle}>{Object.entries(RUTAS).map(([k, r]) => <option key={k} value={k}>{r.bandera} {r.l}</option>)}</select></div>
          <div><Etiqueta>Mercancía</Etiqueta><select id="cs-mercancia" value={f.mercancia || 'general'} onChange={set('mercancia')} style={iStyle}>{Object.entries(MERCANCIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><Etiqueta>Frecuencia</Etiqueta><select value={f.frecuencia || 'por_contenedor'} onChange={set('frecuencia')} style={iStyle}>{Object.entries(FRECUENCIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          {f.frecuencia === 'semanal' ? <div><Etiqueta>Cierra cada</Etiqueta><select value={f.dia_cierre || ''} onChange={set('dia_cierre')} style={iStyle}><option value="">—</option>{DIAS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></div> : <div />}
          <div><Etiqueta>Recibe carga hasta</Etiqueta><input type="date" value={f.fecha_cierre || ''} onChange={set('fecha_cierre')} style={iStyle} /></div>
          <div><Etiqueta>Salida estimada (ETD)</Etiqueta><input id="cs-etd" type="date" value={f.etd || ''} onChange={set('etd')} style={iStyle} /></div>
          <div><Etiqueta>Llegada estimada (ETA)</Etiqueta><input id="cs-eta" type="date" value={f.eta || ''} onChange={set('eta')} style={iStyle} /></div>
          {(() => {
            // Sugerencia de llegada: salida + días de tránsito que te dio tu aliado para esa ruta
            const dt = tarifas.filter(t => t.origen === f.origen && t.destino === f.destino && Number(t.transito_dias)).map(t => Number(t.transito_dias))
            if (!f.etd || !dt.length) return null
            const d = Math.max(...dt), x = new Date(f.etd + 'T12:00:00'); x.setDate(x.getDate() + d)
            const sug = x.toISOString().slice(0, 10)
            return f.eta === sug ? null : <div style={{ gridColumn:'1 / -1', fontSize:11, color:'var(--text3)' }}>Tu aliado da {d} días de tránsito: llegaría el {fechaCorta(sug)}. <button type="button" onClick={() => setF(p => ({ ...p, eta: sug }))} className="btn" style={{ fontSize:11, padding:'2px 8px', width:'auto' }}>Usar</button></div>
          })()}
        </div>
        <div style={{ marginBottom:14 }}><Etiqueta>Notas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button id="cs-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {f.id && <button onClick={borrarCons} onBlur={() => setConfirmar(false)} className="btn" title="Borra el consolidado con toda su carga y listas de empaque" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Borrar todo el consolidado?' : 'Borrar'}</button>}
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Un consolidado por dentro ──────────────────────────────────────────────
function Detalle({ cons, items: todos, productos, movsCaja, cierres, hitos, tarifas, clientes, onVolver, onCambio, onAbrir }) {
  const [hito, setHito] = useState(null)        // hito por registrar
  const [avisar, setAvisar] = useState(null)    // hito recién registrado para avisar a los clientes
  const [pasarCaja, setPasarCaja] = useState(false)
  const items = todos.filter(activa)
  const canceladas = todos.filter(i => !activa(i))
  const nProd = id => (productos || []).filter(p => p.item_id === id).length
  const [lista, setLista] = useState(null)
  const [cotizar, setCotizar] = useState(null)
  const [bajando, setBajando] = useState(false)
  const divisas = useDivisas()
  const trm = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const { empresa } = useDatosLRM()
  const { escaleras, costos } = useTarifas()
  const [trmManual, setTrmManual] = useState('')
  const trmUso = n2(trmManual) || trm
  const aCOP = (v, m) => m === 'USD' ? v * trmUso : v
  const [item, setItem] = useState(null)
  const [editar, setEditar] = useState(false)
  const [copiado, setCopiado] = useState('')
  const ruta = tarifas.filter(t => t.origen === cons.origen && t.destino === cons.destino)
  const m3 = items.reduce((s, i) => s + n2(i.cbm), 0)
  const kg = items.reduce((s, i) => s + n2(i.peso_kg), 0)
  const valorItem = i => { const t = tarifaItem(i); return aCOP(n2(i.cbm) * t.v, t.m) }
  const ingreso = items.reduce((s, i) => s + valorItem(i), 0)
  const modo = cons.costo_modo || 'fijo'
  const costoFijo = costoPara(costos, null, CONSOLIDADO)
  const costoFijoTotal = costoFijo?.unidad === 'cbm' ? aCOP(m3 * n2(costoFijo.valor), monedaReal(costoFijo.valor, costoFijo.moneda)) : null
  const opciones = useMemo(() => planes(m3, kg, ruta), [m3, kg, ruta.length])
  const elegido = opciones.find(o => o.texto === cons.plan) || opciones[0]
  const costoCont = elegido?.total != null ? elegido.total * trmUso : null
  const costo = modo === 'fijo' ? costoFijoTotal : costoCont
  const nombreCli = id => clientes.find(c => c.id === id)?.nombre || 'Sin cliente'
  const porCliente = [...new Set(items.map(i => i.cliente_id))].map(id => {
    const its = items.filter(i => i.cliente_id === id)
    return { id, nombre: nombreCli(id), tel: clientes.find(c => c.id === id)?.telefono, its, m3: its.reduce((s, i) => s + n2(i.cbm), 0), kg: its.reduce((s, i) => s + n2(i.peso_kg), 0), bultos: its.reduce((s, i) => s + n2(i.bultos), 0), total: its.reduce((s, i) => s + valorItem(i), 0) }
  }).sort((a, b) => b.m3 - a.m3)

  const setEstado = async e => { await supabase.from('lrm_consolidados').update({ estado: e.target.value }).eq('id', cons.id); onCambio() }
  const usarPlan = async p => { await supabase.from('lrm_consolidados').update({ plan: p.texto }).eq('id', cons.id); onCambio() }
  const setModo = async m => { await supabase.from('lrm_consolidados').update({ costo_modo: m }).eq('id', cons.id); onCambio() }
  const textoCliente = c => [
    `Hola ${c.nombre.split(' ')[0]}, este es el resumen de tu carga en nuestro consolidado *${cons.nombre}* (${cons.origen} → ${cons.destino}):`, '',
    ...c.its.map(i => `• ${i.descripcion || 'Mercancía'}${i.bultos ? ` · ${i.bultos} bultos` : ''} · ${fmt(i.cbm, 2)} m³${i.peso_kg ? ` · ${fmt(i.peso_kg, 0)} kg` : ''}${i.estado === 'en_bodega' ? ' · ✓ en bodega' : i.estado === 'novedad' ? ` · novedad${i.motivo ? ': ' + i.motivo : ''}` : ' · por llegar'}`),
    '', `Total: ${fmt(c.m3, 2)} m³ · *${cop(c.total)}*`,
    ...(cons.fecha_cierre ? [`Recibimos carga hasta el ${fechaCorta(cons.fecha_cierre)}.`] : []), '', `*${empresa.nombre}* · We bring it. Safe and on time.`,
  ].join('\n')
  // Excel con todos los productos del consolidado (para el aliado / agente de carga)
  const bajarConsolidada = async () => {
    setBajando(true)
    const { data, error } = await supabase.from('lrm_consolidado_productos').select('*').eq('consolidado_id', cons.id).order('linea')
    setBajando(false)
    if (error) return
    const orden = porCliente.flatMap(c => c.its)
    const filas = []
    orden.forEach(it => {
      const ps = (data || []).filter(p => p.item_id === it.id)
      const base = { Cliente: nombreCli(it.cliente_id), Carga: it.descripcion || '' }
      if (!ps.length) filas.push({ ...base, Referencia:'', 'Descripción': it.descripcion || 'Sin lista de empaque', Cantidad:'', Unidad:'', Bultos: it.bultos || '', 'Peso kg': it.peso_kg || '', 'm³': it.cbm || '', 'Valor US$':'', Subpartida:'' })
      ps.forEach(p => filas.push({ ...base, Referencia: p.referencia || '', 'Descripción': p.descripcion || '', Cantidad: p.cantidad ?? '', Unidad: p.unidad || '', Bultos: p.bultos ?? '', 'Peso kg': p.peso_kg ?? '', 'm³': p.cbm ?? '', 'Valor US$': p.valor_usd ?? '', Subpartida: p.subpartida || '' }))
    })
    const resumen = porCliente.map(c => ({ Cliente: c.nombre, Cargas: c.its.length, Bultos: c.bultos, 'Peso kg': Math.round(c.kg * 10) / 10, 'm³': Math.round(c.m3 * 1000) / 1000, Productos: c.its.reduce((s, i) => s + nProd(i.id), 0) }))
    descargarExcel(`Lista de empaque - ${cons.nombre}.xlsx`.replace(/[\\/:*?"<>|]/g, '-'), filas, resumen)
  }
  const copiar = async (t, k) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 2000) } catch {} }
  const e = ESTADOS[cons.estado] || ESTADOS.abierto

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div>
          <button onClick={onVolver} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto', marginBottom:6 }}>← Consolidados</button>
          <div style={{ fontSize:11, color:'var(--text3)' }}>CONS-{String(cons.numero || '').padStart(3, '0')} · {cons.origen} → {cons.destino}{cons.fecha_cierre ? ` · recibe hasta ${fechaCorta(cons.fecha_cierre)}` : ''}{cons.etd ? ` · sale ${fechaCorta(cons.etd)}` : ''}{cons.eta ? ` · llega ${fechaCorta(cons.eta)}` : ''}</div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>{rutaDe(cons).bandera} {cons.nombre}</div>
          <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:999, background:'var(--bg4)', color:'var(--text2)' }}>{rutaDe(cons).l}</span>
            {cons.mercancia && <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:999, background: cons.mercancia === 'especial' ? 'rgba(232,162,58,0.15)' : 'var(--bg4)', color: cons.mercancia === 'especial' ? '#E8A23A' : 'var(--text2)' }}>{MERCANCIA[cons.mercancia]}</span>}
            {cons.frecuencia && <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:999, background:'var(--bg4)', color:'var(--text2)' }}>{FRECUENCIAS[cons.frecuencia]}{cons.frecuencia === 'semanal' && cons.dia_cierre ? ` · cierra los ${DIAS[cons.dia_cierre - 1]}` : ''}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select value={cons.estado} onChange={setEstado} style={{ ...iStyle, marginTop:0, width:'auto', color:e.c }}>{Object.entries(ESTADOS).map(([k, x]) => <option key={k} value={k}>{x.l}</option>)}</select>
          <button onClick={() => setEditar(true)} className="btn" style={{ width:'auto' }}>Editar</button>
          {productos && items.length > 0 && <button id="cs-bajar" onClick={bajarConsolidada} className="btn" style={{ width:'auto' }}>{bajando ? 'Armando…' : '⬇ Lista de empaque'}</button>}
          <button id="cs-item-nuevo" onClick={() => setItem({ consolidado_id: cons.id, cliente_id:'', descripcion:'', proveedor:'', bultos:'', cbm:'', peso_kg:'', tarifa_m3:'', moneda:'COP', estado:'por_llegar' })} className="btn-gold" style={{ width:'auto' }}>+ Carga de un cliente</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:10 }}>
        {[['Volumen', `${fmt(m3, 2)} m³`, 'var(--text)'], ['Peso', `${fmt(kg, 0)} kg`, 'var(--text)'], ['Clientes', porCliente.length, 'var(--text)'],
          ['Le cobras', cop(ingreso), 'var(--gold)'], ['Te cuesta', costo == null ? '—' : cop(costo), 'var(--red)'], ['Ganas', costo == null ? '—' : cop(ingreso - costo), ingreso - (costo || 0) >= 0 ? 'var(--green)' : 'var(--red)']].map(([l, v, c]) => (
          <div key={l} className="panel" style={{ padding:'12px 14px', minWidth:0, overflow:'hidden' }}>
            <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', fontWeight:700 }}>{l}</div>
            <div className="cs-kpi" style={{ fontSize: String(v).length > 13 ? 16 : 19, fontWeight:800, color:c, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={String(v)}>{v}</div>
            {l === 'Ganas' && costo != null && ingreso ? <div style={{ fontSize:11, color:'var(--text3)' }}>{fmt((ingreso - costo) / ingreso * 100, 0)}% de lo que cobras</div> : null}
            {l === 'Te cuesta' ? <div style={{ fontSize:11, color:'var(--text3)' }}>{modo === 'fijo' ? (costoFijo?.unidad === 'cbm' ? `${fmt(m3, 2)} m³ × ${costoFijo.moneda === 'USD' ? 'US$' + fmt(costoFijo.valor, 2) : cop(costoFijo.valor)}` : 'pon el costo por m³ en Tarifas') : 'por contenedores'}</div> : null}
          </div>
        ))}
      </div>

      {/* Bitácora del envío: hitos que ve el cliente */}
      {hitos === null ? (
        <div className="panel" style={{ fontSize:12, color:'var(--gold)' }}>Para la bitácora del envío (cierre, zarpe, Colón, llegada…) corre en Supabase el archivo <b>20_lrm_hitos_rutas.sql</b>.</div>
      ) : (() => {
        const sig = siguienteHito(cons, hitos)
        const pasos = rutaDe(cons).hitos
        const hechos = new Set(hitos.map(h => h.hito))
        const nClientes = porCliente.filter(c => c.id).length
        return (
          <div className="panel" style={{ border:'1px solid rgba(55,138,221,0.35)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'#378ADD' }}>BITÁCORA DEL ENVÍO</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {sig && <button id="cs-hito-sig" onClick={() => setHito({ def: sig })} className="btn-gold" style={{ width:'auto', fontSize:12 }}>📍 {tituloHito(sig, cons)}</button>}
                <select id="cs-hito-otro" value="" onChange={e => { const d = [...pasos, ...EXTRA_HITOS].find(x => x.id === e.target.value); if (d) setHito({ def: d }) }} style={{ ...iStyle, marginTop:0, width:'auto', maxWidth:'100%', fontSize:12 }}>
                  <option value="">Otro hito…</option>
                  {[...pasos, ...EXTRA_HITOS].map(d => <option key={d.id} value={d.id}>{d.id === 'otro' ? 'Otro (escribirlo)' : tituloHito(d, cons)}</option>)}
                </select>
                {cons.frecuencia === 'semanal' && <button id="cs-siguiente-semana" onClick={async () => {
                  const datos = { nombre: cons.ruta === 'miami' || rutaDe(cons) === RUTAS.miami ? `Miami · semana ${semanaISO(masDias(cons.fecha_cierre || hoyISO(), 7))}` : `${cons.nombre} (siguiente)`, origen: cons.origen, destino: cons.destino,
                    fecha_cierre: masDias(cons.fecha_cierre, 7), etd: masDias(cons.etd, 7), eta: masDias(cons.eta, 7), ruta: cons.ruta, mercancia: cons.mercancia, frecuencia: cons.frecuencia, dia_cierre: cons.dia_cierre, costo_modo: cons.costo_modo }
                  const r = await supabase.from('lrm_consolidados').insert(datos).select().single()
                  if (!r.error) { await onCambio(); onAbrir && onAbrir(r.data.id) }
                }} className="btn" style={{ width:'auto', fontSize:12 }}>+ Semana siguiente</button>}
              </div>
            </div>
            {/* Ruta completa: hechos en color, pendientes en gris */}
            <div style={{ display:'flex', gap:4, marginBottom:10 }}>
              {pasos.map(d => <div key={d.id} title={tituloHito(d, cons)} style={{ flex:1, height:6, borderRadius:3, background: hechos.has(d.id) ? '#378ADD' : 'rgba(255,255,255,0.08)' }} />)}
            </div>
            {hitos.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>Sin hitos todavía. Registra cada paso del envío y avísale a tus {nClientes} cliente{nClientes === 1 ? '' : 's'} con un clic.</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {[...hitos].reverse().map(h => (
                  <div key={h.id} className="cs-hito" style={{ display:'flex', gap:10, alignItems:'center', fontSize:12.5, padding:'6px 8px', borderRadius:8, background:'var(--bg4)' }}>
                    <span style={{ width:58, color:'var(--text3)', flexShrink:0 }}>{fechaCorta(h.fecha)}</span>
                    <span style={{ flex:1, color:'var(--text)' }}>{h.titulo}{h.lugar ? <span style={{ color:'var(--text3)' }}> · {h.lugar}</span> : null}{h.nota_cliente ? <span style={{ color:'var(--text3)' }}> · {h.nota_cliente}</span> : null}{!h.visible_cliente ? <span style={{ color:'var(--text4)' }}> · interno</span> : null}</span>
                    {h.visible_cliente && <button onClick={() => setAvisar(h)} className="btn" style={{ width:'auto', fontSize:11, padding:'2px 8px', color: h.avisado ? 'var(--text3)' : '#25D366' }}>{h.avisado ? '✓ Avisado' : '💬 Avisar'}</button>}
                    <button onClick={async () => { if (window.confirm('¿Borrar este hito?')) { await supabase.from('lrm_consolidado_hitos').delete().eq('id', h.id); onCambio() } }} title="Borrar" className="btn" style={{ width:'auto', fontSize:11, padding:'2px 7px', color:'var(--text4)' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Documentos del envío: BL, DIM, facturas y fotos (por cliente o de todo el envío) */}
      <div className="panel"><Documentos entidad="consolidado" entidadId={cons.id} clientes={porCliente.filter(c => c.id).map(c => ({ id: c.id, nombre: c.nombre }))} titulo="Documentos y fotos del envío" /></div>

      {/* Caja: lo facturado a los clientes y el costo registrado */}
      {(() => {
        if (!items.length) return null
        if (movsCaja === null) return <div className="panel" style={{ fontSize:12, color:'var(--gold)' }}>Para pasar este consolidado a Caja corre en Supabase el archivo <b>18_lrm_consolidado_caja.sql</b>.</div>
        const fact = movsCaja.filter(m => m.tipo === 'cobro_cliente').reduce((s, m) => s + Number(m.monto || 0), 0)
        const costoReg = movsCaja.filter(m => m.tipo === 'costo_proveedor').reduce((s, m) => s + Number(m.monto || 0), 0)
        const pendientes = porCliente.filter(c => Math.abs(c.total - movsCaja.filter(m => m.tipo === 'cobro_cliente' && m.cliente_id === c.id).reduce((s, m) => s + Number(m.monto || 0), 0)) > 1).length
        const costoDif = costo != null && Math.abs(costo - costoReg) > 1
        const todoOk = !pendientes && !costoDif
        return (
          <div className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', border:`1px solid ${todoOk ? 'rgba(76,175,80,0.35)' : 'var(--gold-border)'}` }}>
            <div style={{ fontSize:12.5, color:'var(--text2)' }}>
              <span style={{ fontSize:11, letterSpacing:2, fontWeight:700, color: todoOk ? 'var(--green)' : 'var(--gold)', marginRight:10 }}>CAJA</span>
              Facturado a clientes <b style={{ color:'var(--text)' }}>{cop(fact)}</b> de {cop(ingreso)} · Costo registrado <b style={{ color:'var(--text)' }}>{cop(costoReg)}</b>{costo != null ? ` de ${cop(costo)}` : ''}
              {todoOk ? <span style={{ color:'var(--green)' }}> · ✓ al día</span> : <span style={{ color:'#E8A23A' }}>{pendientes ? ` · ${pendientes} cliente${pendientes === 1 ? '' : 's'} por facturar o ajustar` : ''}{costoDif ? ' · falta el costo' : ''}</span>}
            </div>
            {!todoOk && <button id="cs-caja" onClick={() => setPasarCaja(true)} className="btn-gold" style={{ width:'auto' }}>💵 Pasar a Caja</button>}
            {todoOk && <button onClick={() => setPasarCaja(true)} className="btn" style={{ width:'auto', fontSize:11 }}>Ver</button>}
          </div>
        )
      })()}

      {/* Planeador de contenedores */}
      <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:10 }}>
          <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>CÓMO SE LLENA</div>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Tu costo:</span>
            {[['fijo','Tarifa fija por m³'],['contenedores','Por contenedores']].map(([id, l]) => (
              <button key={id} id={`cs-modo-${id}`} onClick={() => setModo(id)} className={modo === id ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'4px 10px', width:'auto' }}>{l}</button>
            ))}
            <input value={trmManual} onChange={e => setTrmManual(e.target.value)} placeholder={trm ? `TRM ${fmt(trm, 0)}` : 'TRM'} style={{ ...iStyle, marginTop:0, width:100, padding:'4px 8px', fontSize:11 }} />
          </div>
        </div>
        {modo === 'fijo' && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>Te cobran una tarifa fija por m³ ({costoFijo?.unidad === 'cbm' ? (costoFijo.moneda === 'USD' ? 'US$' + fmt(costoFijo.valor, 2) : cop(costoFijo.valor)) : 'sin definir'}). Abajo ves cómo quedaría en contenedores, solo como referencia.</div>}
        {!m3 ? <Vacio>Agrega la carga de tus clientes y aquí te digo cuántos contenedores llenas.</Vacio> : (
          <>
            {!ruta.length && <div style={{ fontSize:12, color:'#E8A23A', marginBottom:8 }}>No tienes tarifas para {cons.origen} → {cons.destino} en Aliados y fletes: te muestro solo por espacio, sin costos.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {opciones.map((p, i) => {
                const activo = p === elegido
                return (
                  <div key={p.texto} className="cs-plan" style={{ padding:'10px 12px', borderRadius:10, background: activo ? 'var(--gold-dim)' : 'var(--bg4)', border:`1px solid ${activo ? 'var(--gold-border)' : 'transparent'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{i === 0 && p.total != null ? '★ ' : ''}{p.texto}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>
                          {p.cap ? `Capacidad ${fmt(p.cap, 0)} m³ · ${fmt(p.lleno * 100, 0)}% lleno${p.cap > m3 ? ` · te sobran ${fmt(p.cap - m3)} m³ para vender` : ''}` : 'Todo en carga suelta'}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        {p.total != null && <div style={{ textAlign:'right' }}><div style={{ fontSize:15, fontWeight:800, color:'var(--red)' }}>{usd(p.total)}{trmUso ? <span style={{ fontSize:11, fontWeight:400, color:'var(--text3)' }}> · {cop(p.total * trmUso)}</span> : null}</div>{trmUso ? <div style={{ fontSize:11, color:'var(--green)' }}>ganarías {cop(ingreso - p.total * trmUso)}</div> : null}</div>}
                        {!activo && <button onClick={() => usarPlan(p)} className="btn" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>Usar este</button>}
                      </div>
                    </div>
                    {p.cap > 0 && (
                      <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                        {(() => { let resta = m3; return TIPOS_FCL.flatMap(t => Array.from({ length: p.n[t] }, (_, k) => { const cap = CONTENEDORES[t].util, usa = Math.min(resta, cap); resta -= usa; return (
                          <div key={t + k} style={{ flex:'1 1 120px', minWidth:110 }}>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{t} · {fmt(usa)} / {cap} m³</div>
                            <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden', marginTop:2 }}><div style={{ width:`${usa / cap * 100}%`, height:'100%', background: usa / cap > 0.85 ? 'var(--green)' : 'var(--gold)' }} /></div>
                          </div>
                        ) })) })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Carga por cliente */}
      <div className="panel">
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:10 }}>CARGA POR CLIENTE</div>
        {porCliente.length === 0 ? <Vacio>Sin carga todavía.</Vacio> : porCliente.map(c => {
          const txt = textoCliente(c), wa = c.tel ? linkWhatsApp(c.tel, c.nombre, txt) : null
          return (
            <div key={c.id || 'x'} style={{ borderBottom:'1px solid var(--border)', padding:'10px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{c.nombre} <span style={{ fontSize:12, fontWeight:400, color:'var(--text3)' }}>· {fmt(c.m3, 2)} m³ · {fmt(c.kg, 0)} kg{c.bultos ? ` · ${c.bultos} bultos` : ''} · {fmt(m3 ? c.m3 / m3 * 100 : 0, 0)}% del envío</span></div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <b style={{ color:'var(--gold)' }}>{cop(c.total)}</b>
                  <button onClick={() => setCotizar(c)} className="btn-gold cs-cotizar" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>📄 Cotización</button>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ fontSize:11, padding:'4px 9px', textDecoration:'none', color:'#25D366' }}>WhatsApp</a>}
                  <button onClick={() => copiar(txt, c.id)} className="btn" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>{copiado === c.id ? '✓' : 'Copiar'}</button>
                </div>
              </div>
              {c.its.map(i => {
                const e = ESTADO_ITEM[i.estado] || ESTADO_ITEM.por_llegar, n = nProd(i.id)
                return (
                  <div key={i.id} className="cs-item" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:12, color:'var(--text2)', padding:'6px 8px', marginTop:4, borderRadius:8, background:'var(--bg4)', borderLeft:`3px solid ${e.c}` }}>
                    <span onClick={() => setItem(i)} style={{ cursor:'pointer', flex:'1 1 260px', minWidth:0 }}>
                      {i.descripcion || 'Mercancía'}{i.proveedor ? ` · ${i.proveedor}` : ''}{i.bultos ? ` · ${i.bultos} bultos` : ''} · {fmt(i.cbm, 2)} m³{i.peso_kg ? ` · ${fmt(i.peso_kg, 0)} kg` : ''}
                      {i.estado === 'novedad' && i.motivo ? <span style={{ color:'#E05252' }}> · {i.motivo}</span> : null}
                    </span>
                    <span style={{ display:'flex', gap:6, alignItems:'center', whiteSpace:'nowrap' }}>
                      <span style={{ color:e.c }}>{e.l}</span> · {cop(valorItem(i))}
                      {productos && <button onClick={() => setLista(i)} className="btn cs-lista" style={{ fontSize:11, padding:'3px 8px', width:'auto', color: n ? 'var(--gold)' : undefined }}>📋 {n ? `${n} producto${n === 1 ? '' : 's'}` : 'Lista de empaque'}</button>}
                      <button onClick={() => setItem(i)} className="btn cs-editar" title="Editar, cancelar o borrar" style={{ fontSize:11, padding:'3px 8px', width:'auto' }}>✏️ Editar</button>
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
        {canceladas.length > 0 && (
          <details style={{ marginTop:12 }}>
            <summary style={{ fontSize:12, color:'var(--text3)', cursor:'pointer' }}>Canceladas ({canceladas.length}) · no cuentan en el envío</summary>
            {canceladas.map(i => (
              <div key={i.id} onClick={() => setItem(i)} className="cs-cancelada" style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:12, color:'var(--text4)', padding:'6px 8px', marginTop:4, borderRadius:8, background:'var(--bg4)', cursor:'pointer' }}>
                <span style={{ textDecoration:'line-through' }}>{nombreCli(i.cliente_id)} · {i.descripcion || 'Mercancía'} · {fmt(i.cbm, 2)} m³</span>
                <span>{i.motivo || 'Sin motivo'} · ✏️</span>
              </div>
            ))}
          </details>
        )}
      </div>

      {hito && <ModalHito cons={cons} def={hito.def} onCerrar={() => setHito(null)} onGuardado={async h => { setHito(null); await onCambio(); if (h.visible_cliente) setAvisar(h) }} />}
      {avisar && <ModalAvisarHito cons={cons} hito={avisar} porCliente={porCliente} clientes={clientes} onCerrar={async marcado => { setAvisar(null); if (marcado) onCambio() }} />}
      {pasarCaja && <ModalPasarCaja cons={cons} porCliente={porCliente} movs={movsCaja || []} cierres={cierres || []} costo={costo} tarifaDe={tarifaItem} onCerrar={() => setPasarCaja(false)} onGuardado={() => { setPasarCaja(false); onCambio() }} />}
      {cotizar && <CotizacionConsolidado cons={cons} cliente={cotizar} valorItem={valorItem} tarifaDe={tarifaItem} trm={trmUso} onCerrar={() => { setCotizar(null); onCambio() }} />}
      {lista && <ModalListaEmpaque item={lista} consolidado={cons} cliente={nombreCli(lista.cliente_id)} onCerrar={() => setLista(null)} onGuardado={() => { setLista(null); onCambio() }} />}
      {item && <ModalItem item={item} clientes={clientes} items={items} conLista={!!productos} onLista={() => { const i = item; setItem(null); setLista(i) }} escaleras={escaleras} trm={trmUso} onCerrar={() => setItem(null)} onGuardado={() => { setItem(null); onCambio() }} />}
      {editar && <ModalConsolidado cons={cons} tarifas={tarifas} onCerrar={() => setEditar(false)} onGuardado={() => { setEditar(false); onCambio() }} onBorrado={() => { setEditar(false); onVolver(); onCambio() }} />}
    </div>
  )
}

function ModalItem({ item, clientes, items, escaleras, trm, conLista, onLista, onCerrar, onGuardado }) {
  const t0 = item.id ? tarifaItem(item) : { v: '', m: 'COP' }
  const [f, setF] = useState({ ...item, bultos: String(item.bultos ?? ''), cbm: String(item.cbm ?? ''), peso_kg: String(item.peso_kg ?? ''), tarifa_m3: String(t0.v ?? ''), moneda: t0.m })
  const [auto, setAuto] = useState(!item.id)
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  // Escalera del consolidado: la del cliente o la general, según los m³ que lleva en este envío
  const cli = clientes.find(c => c.id === f.cliente_id)
  const { esc, fuente } = escaleraPara(cli, escaleras, CONSOLIDADO)
  const m3Cliente = items.filter(i => i.cliente_id === f.cliente_id && i.id !== f.id).reduce((s, i) => s + n2(i.cbm), 0) + n2(f.cbm)
  const escalon = escalonDe(esc, m3Cliente)
  useEffect(() => { if (auto && esc.unidad === 'cbm') setF(p => ({ ...p, tarifa_m3: String(escalon.precio), moneda: monedaReal(escalon.precio, esc.moneda) })) }, [auto, f.cliente_id, f.cbm, escalon?.precio, esc.moneda])
  const total = n2(f.cbm) * n2(f.tarifa_m3)
  const guardar = async () => {
    if (!f.cliente_id) return setError('Elige el cliente.')
    if (!n2(f.cbm)) return setError('Pon los m³.')
    if ((f.estado === 'cancelado' || f.estado === 'novedad') && !String(f.motivo || '').trim()) return setError(f.estado === 'cancelado' ? 'Escribe por qué se canceló.' : 'Escribe cuál es la novedad.')
    const { id, created_at, ...d } = f
    if (d.estado !== 'cancelado' && d.estado !== 'novedad') d.motivo = null
    const datos = { ...d, bultos: Math.round(n2(d.bultos)), cbm: n2(d.cbm), peso_kg: n2(d.peso_kg), tarifa_m3: n2(d.tarifa_m3), moneda: monedaReal(n2(d.tarifa_m3), d.moneda), tarifa_m3_usd: monedaReal(n2(d.tarifa_m3), d.moneda) === 'USD' ? n2(d.tarifa_m3) : 0 }
    const r = id ? await supabase.from('lrm_consolidado_items').update(datos).eq('id', id) : await supabase.from('lrm_consolidado_items').insert(datos)
    if (r.error) return setError(r.error.message.includes('motivo') || r.error.message.includes('estado_check') ? 'Falta correr en Supabase el archivo 16_lrm_lista_empaque.sql.' : r.error.message.includes('tarifa_m3') || r.error.message.includes('moneda') ? 'Falta correr en Supabase el SQL 13 (columnas tarifa_m3 y moneda).' : 'No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_consolidado_items').delete().eq('id', f.id); onGuardado() }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{f.id ? 'Editar carga' : 'Carga de un cliente'}</div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Cliente</Etiqueta><select id="ci-cliente" value={f.cliente_id || ''} onChange={set('cliente_id')} style={iStyle}><option value="">Elegir…</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><Etiqueta>Estado</Etiqueta><select id="ci-estado" value={f.estado} onChange={set('estado')} style={{ ...iStyle, color:(ESTADO_ITEM[f.estado] || {}).c }}>
            <option value="por_llegar">Por llegar a bodega</option><option value="en_bodega">En bodega</option>
            <option value="novedad">Con novedad (incompleta, dañada, falta producto…)</option><option value="cancelado">Cancelada (no cuenta en el envío)</option></select></div>
          {(f.estado === 'novedad' || f.estado === 'cancelado') && (
            <div style={{ gridColumn:'1 / -1' }}><Etiqueta>{f.estado === 'cancelado' ? '¿Por qué se canceló?' : '¿Qué novedad tiene?'}</Etiqueta>
              <input id="ci-motivo" list="ci-motivos" value={f.motivo || ''} onChange={set('motivo')} placeholder={f.estado === 'cancelado' ? 'Ej: el cliente no se decidió' : 'Ej: llegaron 8 de 10 cajas'} style={iStyle} />
              <datalist id="ci-motivos">{(f.estado === 'cancelado' ? ['El cliente no se decidió', 'El proveedor no tenía el producto', 'No llegó a tiempo a bodega', 'El cliente canceló el pedido', 'Se pasa para el próximo consolidado'] : ['Llegó incompleta', 'Llegó con daños', 'Falta un producto', 'Falta la lista de empaque', 'Medidas distintas a las informadas']).map(m => <option key={m} value={m} />)}</datalist>
            </div>
          )}
          <div><Etiqueta>Mercancía</Etiqueta><input id="ci-desc" value={f.descripcion || ''} onChange={set('descripcion')} placeholder="Ej: accesorios para celular" style={iStyle} /></div>
          <div><Etiqueta>Proveedor / fábrica</Etiqueta><input value={f.proveedor || ''} onChange={set('proveedor')} style={iStyle} /></div>
          <div><Etiqueta>Volumen (m³)</Etiqueta><input id="ci-cbm" inputMode="decimal" value={f.cbm} onChange={set('cbm')} style={iStyle} /></div>
          <div><Etiqueta>Peso (kg)</Etiqueta><input id="ci-kg" inputMode="decimal" value={f.peso_kg} onChange={set('peso_kg')} style={iStyle} /></div>
          <div><Etiqueta>Bultos</Etiqueta><input inputMode="numeric" value={f.bultos} onChange={set('bultos')} style={iStyle} /></div>
          <div><Etiqueta>Le cobras por m³ ({f.moneda === 'USD' ? 'US$' : 'pesos'})</Etiqueta>
            <div style={{ display:'flex', gap:6 }}>
              <input id="ci-tarifa" inputMode="decimal" value={f.tarifa_m3} onChange={e => { setAuto(false); setF(p => ({ ...p, tarifa_m3: e.target.value })) }} style={iStyle} />
              <select value={f.moneda} onChange={e => { setAuto(false); setF(p => ({ ...p, moneda: e.target.value })) }} style={{ ...iStyle, width:80 }}><option>COP</option><option>USD</option></select>
            </div></div>
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {auto ? <span>Tarifa {fuente === 'cliente' ? <b style={{ color:'var(--gold)' }}>de {cli?.nombre}</b> : 'general'} del consolidado · escalón {tramoTexto(esc, escalon)} m³ (lleva {fmt(m3Cliente, 2)} m³)</span> : <span>Tarifa puesta a mano</span>}
          {!auto && <button type="button" onClick={() => setAuto(true)} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto' }}>↺ Usar la escalera</button>}
        </div>
        <div style={{ marginBottom:14 }}><Etiqueta>Notas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
        <div style={{ fontSize:14, color:'var(--text2)', marginBottom:12 }}>Total al cliente: <b style={{ color:'var(--gold)' }}>{f.moneda === 'USD' ? `${usd(total)}${trm ? ` · ${cop(total * trm)}` : ''}` : cop(total)}</b></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button id="ci-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {f.id && conLista && <button onClick={onLista} className="btn" style={{ width:'auto' }}>📋 Lista de empaque</button>}
          {f.id && <button id="ci-borrar" onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" title="Borra la carga y su lista de empaque. Si solo se canceló, mejor cambia el estado a Cancelada." style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Borrar del todo?' : 'Borrar'}</button>}
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
// ── Pasar el consolidado a Caja: cuenta de cobro por cliente + factura del proveedor ──
// Si ya estaba y el valor cambió: se corrige el mismo registro; si ese mes ya se cerró, se agrega la diferencia.
function ModalPasarCaja({ cons, porCliente, movs, cierres, costo, tarifaDe, onCerrar, onGuardado }) {
  const ref = `CONS-${String(cons.numero || '').padStart(3, '0')} · ${cons.nombre}`
  const hoy = hoyISO()
  const yaCobrado = id => movs.filter(m => m.tipo === 'cobro_cliente' && m.cliente_id === id)
  const yaCosto = movs.filter(m => m.tipo === 'costo_proveedor')
  const suma = arr => arr.reduce((s, m) => s + Number(m.monto || 0), 0)
  const filas = porCliente.filter(c => c.id).map(c => {
    const prev = yaCobrado(c.id), antes = suma(prev)
    return { c, prev, antes, dif: Math.round(c.total) - antes }
  })
  const [marcados, setMarcados] = useState(Object.fromEntries(filas.map(f => [f.c.id, Math.abs(f.dif) > 1])))
  const costoAntes = suma(yaCosto)
  const [conCosto, setConCosto] = useState(costo != null && Math.abs(costo - costoAntes) > 1)
  const [proveedor, setProveedor] = useState(yaCosto[0]?.proveedor || `Consolidado ${cons.origen}`)
  const [montoCosto, setMontoCosto] = useState(String(Math.round(costo || 0)))
  const [fecha, setFecha] = useState(hoy)
  const [vence, setVence] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cerrado = f => cierres.includes((f || '').slice(0, 7))
  const sinCliente = porCliente.some(c => !c.id)

  const notaDe = c => `Consolidado ${cons.origen} → ${cons.destino} · ` + c.its.map(i => { const t = tarifaDe(i); return `${fmt(i.cbm, 3)} m³ × ${t.m === 'USD' ? 'US$' + fmt(t.v, 2) : cop(t.v)}` }).join(' + ')

  // Un valor nuevo sobre registros que ya existen: corrige el último si su mes está abierto; si no, agrega la diferencia
  const ajustar = async (prev, nuevo, base) => {
    const antes = suma(prev), dif = Math.round(nuevo) - antes
    if (!prev.length) return supabase.from('lrm_movimientos').insert({ ...base, monto: Math.round(nuevo) })
    const ultimo = prev[prev.length - 1]
    if (!cerrado(ultimo.fecha)) {
      const m = Number(ultimo.monto || 0) + dif
      if (m <= 0) return supabase.from('lrm_movimientos').delete().eq('id', ultimo.id)
      return supabase.from('lrm_movimientos').update({ monto: m, notas: base.notas }).eq('id', ultimo.id)
    }
    if (dif > 0) return supabase.from('lrm_movimientos').insert({ ...base, monto: dif, notas: `Ajuste · ${base.notas}` })
    return { error: { message: `El cobro anterior está en un mes cerrado (${ultimo.fecha.slice(0, 7)}). Para bajar el valor registra un ajuste en Caja.` } }
  }

  const guardar = async () => {
    if (cerrado(fecha)) return setError('Ese mes ya está cerrado en Caja. Cambia la fecha o reábrelo.')
    setGuardando(true); setError('')
    for (const f of filas) {
      if (!marcados[f.c.id]) continue
      const r = await ajustar(f.prev, f.c.total, { tipo:'cobro_cliente', concepto:'flete', cliente_id: f.c.id, consolidado_id: cons.id, fecha, vence: vence || null, referencia: ref, notas: notaDe(f.c) })
      if (r?.error) { setGuardando(false); return setError(`${f.c.nombre}: ${r.error.message}`) }
    }
    if (conCosto && n2(montoCosto) > 0) {
      if (!proveedor.trim()) { setGuardando(false); return setError('Escribe a quién le pagas el consolidado.') }
      const r = await ajustar(yaCosto, n2(montoCosto), { tipo:'costo_proveedor', concepto:'flete', proveedor: proveedor.trim(), consolidado_id: cons.id, fecha, vence: vence || null, referencia: ref, notas: `Consolidado ${cons.origen} → ${cons.destino} · ${cons.nombre}` })
      if (r?.error) { setGuardando(false); return setError('Costo: ' + r.error.message) }
    }
    setGuardando(false); onGuardado()
  }
  const nada = !filas.some(f => marcados[f.c.id]) && !conCosto

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:620, maxHeight:'92vh', overflowY:'auto', border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>PASAR A CAJA</div>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{cons.nombre}</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Cada cliente queda con su cuenta de cobro en Caja y Cartera, y el costo como factura por pagar.</div>

        <div style={{ fontSize:11, letterSpacing:1.5, fontWeight:700, color:'var(--text3)', marginBottom:6 }}>CLIENTES</div>
        {filas.map(f => (
          <label key={f.c.id} className="pc-fila" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--bg4)', marginBottom:6, cursor:'pointer' }}>
            <input type="checkbox" checked={!!marcados[f.c.id]} onChange={e => setMarcados(p => ({ ...p, [f.c.id]: e.target.checked }))} />
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{f.c.nombre}</span>
              <span style={{ display:'block', fontSize:11, color: Math.abs(f.dif) <= 1 ? 'var(--green)' : f.antes ? '#E8A23A' : 'var(--text3)' }}>
                {Math.abs(f.dif) <= 1 ? '✓ Ya está en Caja' : f.antes ? `En Caja ${cop(f.antes)} · ${f.dif > 0 ? 'sube' : 'baja'} ${cop(Math.abs(f.dif))}` : 'Sin facturar'}
              </span>
            </span>
            <b style={{ color:'var(--gold)', whiteSpace:'nowrap' }}>{cop(f.c.total)}</b>
          </label>
        ))}
        {sinCliente && <div style={{ fontSize:11, color:'#E8A23A', marginBottom:6 }}>Hay carga sin cliente asignado: no se puede facturar hasta que le pongas cliente.</div>}

        <div style={{ fontSize:11, letterSpacing:1.5, fontWeight:700, color:'var(--text3)', margin:'14px 0 6px' }}>TU COSTO</div>
        <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--text2)', cursor:'pointer', marginBottom:8 }}>
          <input type="checkbox" checked={conCosto} onChange={e => setConCosto(e.target.checked)} />
          Registrar la factura del proveedor {costoAntes ? <span style={{ fontSize:11, color:'var(--text3)' }}>(en Caja hoy: {cop(costoAntes)})</span> : null}
        </label>
        {conCosto && (
          <div className="grid-2" style={{ gap:10 }}>
            <div><Etiqueta>A quién le pagas</Etiqueta><input id="pc-proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} style={iStyle} /></div>
            <div><Etiqueta>Valor (COP)</Etiqueta><input id="pc-costo" inputMode="numeric" value={montoCosto ? Number(n2(montoCosto)).toLocaleString('es-CO') : ''} onChange={e => setMontoCosto(e.target.value.replace(/\D/g, ''))} style={iStyle} /></div>
          </div>
        )}

        <div className="grid-2" style={{ gap:10, marginTop:12 }}>
          <div><Etiqueta>Fecha</Etiqueta><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={iStyle} /></div>
          <div><Etiqueta>Vence (opcional)</Etiqueta><input type="date" value={vence} onChange={e => setVence(e.target.value)} style={iStyle} /></div>
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="pc-guardar" onClick={guardar} disabled={guardando || nada} className="btn-green" style={{ flex:1, opacity: nada ? 0.5 : 1 }}>{guardando ? 'Guardando…' : 'Registrar en Caja'}</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
// ── Registrar un hito del envío ─────────────────────────────────────────────
function ModalHito({ cons, def, onCerrar, onGuardado }) {
  const [f, setF] = useState({ titulo: tituloHito(def, cons), fecha: hoyISO(), lugar:'', nota_cliente:'', nota_interna:'', visible_cliente:true, eta: cons.eta || '' })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const cambiaEstado = estadoTrasHito(cons.estado, def)
  const pideEta = ['zarpe', 'transbordo', 'colon', 'cargado'].includes(def.id)
  const guardar = async () => {
    if (!f.titulo.trim()) return setError('Escribe qué pasó.')
    const r = await supabase.from('lrm_consolidado_hitos').insert({ consolidado_id: cons.id, hito: def.id, titulo: f.titulo.trim(), fecha: f.fecha, lugar: f.lugar || null,
      nota_cliente: f.nota_cliente || null, nota_interna: f.nota_interna || null, visible_cliente: f.visible_cliente }).select().single()
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    // El hito mueve el consolidado: estado y fechas
    const cambio = {}
    if (cambiaEstado) cambio.estado = cambiaEstado
    if (def.fecha === 'etd') cambio.etd = f.fecha
    if (pideEta && f.eta && f.eta !== cons.eta) cambio.eta = f.eta
    if (def.id === 'cierre' && !cons.fecha_cierre) cambio.fecha_cierre = f.fecha
    if (Object.keys(cambio).length) await supabase.from('lrm_consolidados').update(cambio).eq('id', cons.id)
    onGuardado(r.data)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:480, border:'1px solid rgba(55,138,221,0.45)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'#378ADD' }}>NUEVO HITO · {cons.nombre}</div>
        <div style={{ margin:'10px 0' }}><Etiqueta>Qué pasó (lo ve el cliente)</Etiqueta><input id="hi-titulo" value={f.titulo} onChange={set('titulo')} style={iStyle} autoFocus /></div>
        <div className="grid-2" style={{ gap:10 }}>
          <div><Etiqueta>Fecha</Etiqueta><input id="hi-fecha" type="date" value={f.fecha} onChange={set('fecha')} style={iStyle} /></div>
          <div><Etiqueta>Lugar</Etiqueta><input value={f.lugar} onChange={set('lugar')} placeholder="Ej: Puerto de Shanghái" style={iStyle} /></div>
          {pideEta && <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Llegada estimada (ETA) actualizada</Etiqueta><input id="hi-eta" type="date" value={f.eta} onChange={set('eta')} style={iStyle} /></div>}
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Nota para el cliente (opcional)</Etiqueta><input value={f.nota_cliente} onChange={set('nota_cliente')} placeholder="Ej: buque MSC Ana · contenedor MSCU1234567" style={iStyle} /></div>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Nota interna (solo tú)</Etiqueta><input value={f.nota_interna} onChange={set('nota_interna')} style={iStyle} /></div>
          <label style={{ gridColumn:'1 / -1', fontSize:12.5, color:'var(--text2)', display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}><input type="checkbox" checked={f.visible_cliente} onChange={set('visible_cliente')} /> Que lo vean los clientes en su portal</label>
        </div>
        {cambiaEstado && <div style={{ fontSize:12, color:'var(--text3)', marginTop:10 }}>El consolidado pasa a <b style={{ color:(ESTADOS[cambiaEstado] || {}).c }}>{(ESTADOS[cambiaEstado] || {}).l}</b>{def.fecha === 'etd' ? ' y la salida (ETD) queda con esta fecha' : ''}.</div>}
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button id="hi-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Registrar{f.visible_cliente ? ' y avisar' : ''}</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Avisar a todos los clientes del envío (un WhatsApp por cliente, ya escrito) ──
function ModalAvisarHito({ cons, hito, porCliente, clientes, onCerrar }) {
  const { empresa } = useDatosLRM()
  const [enviados, setEnviados] = useState({})
  const [copiado, setCopiado] = useState(false)
  const filas = porCliente.filter(c => c.id).map(c => ({ ...c, cliente: clientes.find(x => x.id === c.id) }))
  const mensaje = c => [
    `📍 Hola ${String(c.nombre || '').split(' ')[0]}, actualización de tu carga en el consolidado *${cons.nombre}* (${cons.origen} → ${cons.destino}):`, '',
    `*${hito.titulo}*${hito.lugar ? ` · ${hito.lugar}` : ''} · ${fechaCorta(hito.fecha)}`,
    ...(hito.nota_cliente ? [hito.nota_cliente] : []),
    ...(cons.eta ? [`Llegada estimada: ${fechaCorta(cons.eta)}`] : []),
    ...(linkRastreo(c.cliente) ? ['', `Sigue tu carga aquí: ${linkRastreo(c.cliente)}`] : []),
    '', `*${empresa.nombre}* · We bring it. Safe and on time.`,
  ].join('\n')
  const general = mensaje({ nombre:'' }).replace('Hola , ', 'Hola, ').replace(/\n\nSigue tu carga aquí: .*$/m, '')
  const marcar = async () => { await supabase.from('lrm_consolidado_hitos').update({ avisado:true }).eq('id', hito.id); onCerrar(true) }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:125, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', border:'1px solid rgba(37,211,102,0.35)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'#25D366' }}>AVISAR A LOS CLIENTES</div>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:'2px 0 12px' }}>📍 {hito.titulo}</div>
        {filas.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>Este consolidado todavía no tiene clientes.</div> : filas.map(c => {
          const tel = c.cliente?.telefono, link = tel ? linkWhatsApp(tel, c.nombre, mensaje(c)) : null
          return (
            <div key={c.id} className="av-fila" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--bg4)', marginBottom:6 }}>
              <div style={{ fontSize:13, color:'var(--text)' }}>{c.nombre}<div style={{ fontSize:11, color:'var(--text3)' }}>{fmt(c.m3, 2)} m³ · {tel || 'sin WhatsApp en el CRM'}</div></div>
              {link ? <a href={link} target="_blank" rel="noreferrer" onClick={() => setEnviados(p => ({ ...p, [c.id]: true }))} className="btn av-wa" style={{ textDecoration:'none', color: enviados[c.id] ? 'var(--text3)' : '#25D366', whiteSpace:'nowrap' }}>{enviados[c.id] ? '✓ Enviado' : '💬 Enviar'}</a> : <span style={{ fontSize:11, color:'var(--text4)' }}>—</span>}
            </div>
          )
        })}
        <div style={{ fontSize:11, color:'var(--text3)', margin:'10px 0 6px' }}>Mensaje para tu lista de difusión o grupo:</div>
        <div id="av-texto" style={{ fontSize:12, color:'var(--text2)', whiteSpace:'pre-wrap', background:'var(--bg4)', borderRadius:10, padding:10 }}>{general}</div>
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          <button onClick={async () => { try { await navigator.clipboard.writeText(general); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }} className="btn" style={{ width:'auto' }}>{copiado ? '✓ Copiado' : 'Copiar mensaje'}</button>
          <button id="av-listo" onClick={marcar} className="btn-green" style={{ flex:1 }}>Listo, ya avisé</button>
          <button onClick={() => onCerrar(false)} className="btn" style={{ width:'auto' }}>Después</button>
        </div>
      </div>
    </div>
  )
}