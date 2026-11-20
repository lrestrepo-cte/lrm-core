// @ts-nocheck
// LRM Trade Consulting · Red comercial
// Vendedores (primos, amigos, aliados) con su acuerdo propio, los clientes que trajeron,
// las comisiones que se causan por cada carga y su pago desde Caja.
// Tablas: lrm_vendedores, lrm_comisiones, lrm_clientes, lrm_cargas, lrm_cuentas, lrm_movimientos (SQL 07)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO, fechaCorta, linkWhatsApp } from './LRMClientes'
import { cobroCarga, costoCarga } from './tarifasLRM'

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => Number(String(v ?? '').replace(',', '.')) || 0
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const LB_A_KG = 0.45359237

export const TIPOS_COMISION = [
  { id:'porcentaje', nombre:'% de tu ganancia',    unidad:'%',        ayuda:'Ej. 20 = el 20% de lo que te queda por cada carga' },
  { id:'por_kg',     nombre:'Valor por kilo',      unidad:'$ / kg',   ayuda:'Ej. 500 = $500 por cada kilo que mueva su cliente' },
  { id:'fijo_carga', nombre:'Fijo por carga',      unidad:'$',        ayuda:'Ej. 100000 = $100.000 por cada carga' },
  { id:'manual',     nombre:'Lo defino cada vez',  unidad:'',         ayuda:'Tú pones el valor de cada comisión a mano' },
]
const tipoDe = id => TIPOS_COMISION.find(t => t.id === id) || TIPOS_COMISION[0]

// Lo que deja una carga: cobro al cliente − costo de la bodega
export function gananciaCarga(c) {
  const cobro = cobroCarga(c)
  const costo = costoCarga(c)
  return { cobro, costo, ganancia: cobro - costo }
}
export function comisionSugerida(v, c) {
  const { ganancia } = gananciaCarga(c)
  if (v.tipo_comision === 'porcentaje') return { base: ganancia, monto: Math.round(ganancia * n2(v.valor) / 100) }
  if (v.tipo_comision === 'por_kg')     return { base: n2(c.peso_cobrable_kg), monto: Math.round(n2(c.peso_cobrable_kg) * n2(v.valor)) }
  if (v.tipo_comision === 'fijo_carga') return { base: 1, monto: Math.round(n2(v.valor)) }
  return { base: ganancia, monto: 0 }
}
export function resumenAcuerdo(v) {
  const t = tipoDe(v.tipo_comision)
  const cuanto = v.tipo_comision === 'porcentaje' ? `${fmt(v.valor)}% de la ganancia de cada carga`
    : v.tipo_comision === 'por_kg' ? `${cop(v.valor)} por kilo` : v.tipo_comision === 'fijo_carga' ? `${cop(v.valor)} por carga` : 'valor por acordar en cada carga'
  return `${cuanto}${v.duracion_meses ? ` · durante ${v.duracion_meses} meses` : ' · mientras el cliente siga'}` + (t.id === 'manual' ? '' : '')
}
// ¿La carga entra en el tiempo del acuerdo?
const dentroDelAcuerdo = (v, cliente, carga) => {
  if (!v.duracion_meses || !cliente?.vendedor_desde) return true
  const fin = new Date(cliente.vendedor_desde); fin.setMonth(fin.getMonth() + Number(v.duracion_meses))
  return (carga.fecha_recibo || hoyISO()) <= fin.toISOString().slice(0, 10)
}

const iStyle = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'20px 0', textAlign:'center' }}>{children}</div>
const Titulo = ({ children }) => <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', margin:'16px 0 8px' }}>{children}</div>
const codigoDe = nombre => 'LRM-' + (nombre || '').trim().split(/\s+/)[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// ══════════════════════════════════════════════════════════════════════════
export default function RedComercial() {
  const [datos, setDatos] = useState(null)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [editar, setEditar] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [propuesta, setPropuesta] = useState(null)

  const cargar = async () => {
    const [ve, co, cl, ca, cu] = await Promise.all([
      supabase.from('lrm_vendedores').select('*').order('created_at'),
      supabase.from('lrm_comisiones').select('*').order('fecha', { ascending:false }),
      supabase.from('lrm_clientes').select('*').order('nombre'),
      supabase.from('lrm_cargas').select('*').order('fecha_recibo', { ascending:false }),
      supabase.from('lrm_cuentas').select('*').eq('activa', true).order('created_at'),
    ])
    if ([ve, co, cl, ca].some(r => r.error)) { setFaltaTabla(true); return }
    setDatos({ vendedores: ve.data || [], comisiones: co.data || [], clientes: cl.data || [], cargas: ca.data || [], cuentas: cu.data || [] })
  }
  useEffect(() => { cargar() }, [])

  // Cargas de clientes traídos por un vendedor que todavía no tienen comisión
  const porCausar = useMemo(() => {
    if (!datos) return []
    const conComision = new Set(datos.comisiones.map(c => c.carga_id).filter(Boolean))
    return datos.cargas.flatMap(carga => {
      const cli = datos.clientes.find(c => c.id === carga.cliente_id)
      const v = cli?.vendedor_id && datos.vendedores.find(x => x.id === cli.vendedor_id)
      if (!v || conComision.has(carga.id) || !dentroDelAcuerdo(v, cli, carga)) return []
      return [{ carga, cliente: cli, vendedor: v, ...comisionSugerida(v, carga) }]
    })
  }, [datos])

  if (faltaTabla) return (
    <div className="panel" style={{ maxWidth:560, border:'1px solid rgba(224,82,82,0.3)' }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Falta crear las tablas de la Red comercial</div>
      <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>Corre en Supabase (SQL Editor) el archivo <b>07_lrm_red_comercial.sql</b> y recarga la página.</div>
    </div>
  )
  if (!datos) return <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text3)' }}>Cargando…</div>

  const { vendedores, comisiones, clientes } = datos
  const mes = hoyISO().slice(0, 7)
  const pendiente = comisiones.filter(c => c.estado === 'pendiente').reduce((s, c) => s + n2(c.monto), 0)
  const pagadoMes = comisiones.filter(c => c.estado === 'pagada' && (c.pagada_en || '').startsWith(mes)).reduce((s, c) => s + n2(c.monto), 0)
  const kpis = [
    ['Vendedores activos', vendedores.filter(v => v.activo).length, 'var(--text)'],
    ['Clientes traídos', clientes.filter(c => c.vendedor_id).length, 'var(--gold)'],
    ['Comisiones por pagar', cop(pendiente), 'var(--red)'],
    ['Pagado este mes', cop(pagadoMes), 'var(--green)'],
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap:12 }}>
        {kpis.map(([l, v, c]) => <div key={l} className="kpi-card"><div className="kpi-label">{l}</div><div className="kpi-val" style={{ color:c, fontSize:22 }}>{v}</div></div>)}
      </div>

      {porCausar.length > 0 && (
        <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>🧮 {porCausar.length} carga(s) con comisión por registrar</div>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Revísalas en la ficha de cada vendedor</span>
          </div>
          {porCausar.slice(0, 5).map(x => (
            <div key={x.carga.id} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
              <span style={{ color:'var(--text2)' }}>{x.vendedor.nombre} · {x.cliente.nombre} · WR {x.carga.guia}</span>
              <span style={{ color:'var(--gold)', fontWeight:700, cursor:'pointer' }} onClick={() => setFicha(x.vendedor)}>{x.monto ? cop(x.monto) : 'por definir'} →</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:13, color:'var(--text3)' }}>Cada vendedor con su propio acuerdo</div>
        <button onClick={() => setEditar({})} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo vendedor</button>
      </div>

      {vendedores.length === 0 ? <Vacio>Todavía no hay vendedores. Dale a "+ Nuevo vendedor" para agregar al primero.</Vacio> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap:12 }}>
          {vendedores.map(v => {
            const susClientes = clientes.filter(c => c.vendedor_id === v.id)
            const suyas = comisiones.filter(c => c.vendedor_id === v.id)
            const pend = suyas.filter(c => c.estado === 'pendiente').reduce((s, c) => s + n2(c.monto), 0)
            const pag = suyas.filter(c => c.estado === 'pagada').reduce((s, c) => s + n2(c.monto), 0)
            const nuevas = porCausar.filter(x => x.vendedor.id === v.id).length
            const wa = linkWhatsApp(v.telefono, v.nombre)
            return (
              <div key={v.id} className="panel" style={{ opacity: v.activo ? 1 : 0.55, cursor:'pointer' }} onClick={() => setFicha(v)}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{v.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{[v.codigo, v.relacion, !v.activo && 'inactivo'].filter(Boolean).join(' · ')}</div>
                  </div>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ textDecoration:'none' }}>💬</a>}
                </div>
                <div style={{ fontSize:12, color:'var(--gold)', margin:'10px 0' }}>{resumenAcuerdo(v)}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  {[['Clientes', susClientes.length, 'var(--text)'], ['Por pagar', cop(pend), 'var(--red)'], ['Pagado', cop(pag), 'var(--green)']].map(([l, val, c]) => (
                    <div key={l} style={{ padding:'6px 8px', borderRadius:8, background:'var(--bg4)' }}>
                      <div style={{ fontSize:9.5, color:'var(--text4)' }}>{l}</div><div style={{ fontSize:13, fontWeight:800, color:c }}>{val}</div>
                    </div>
                  ))}
                </div>
                {nuevas > 0 && <div style={{ fontSize:11, color:'#E8A23A', marginTop:8 }}>🧮 {nuevas} carga(s) por registrar comisión</div>}
              </div>
            )
          })}
        </div>
      )}

      {editar && <ModalVendedor vendedor={editar} onCerrar={() => setEditar(null)} onGuardado={() => { setEditar(null); cargar() }} />}
      {ficha && !editar && <FichaVendedor v={vendedores.find(x => x.id === ficha.id) || ficha} datos={datos} porCausar={porCausar.filter(x => x.vendedor.id === ficha.id)}
        onEditar={setEditar} onPropuesta={setPropuesta} onCerrar={() => setFicha(null)} onCambio={cargar} />}
      {propuesta && <ModalPropuesta v={propuesta} onCerrar={() => setPropuesta(null)} />}
    </div>
  )
}

// ── Crear o editar vendedor ────────────────────────────────────────────────
function ModalVendedor({ vendedor, onCerrar, onGuardado }) {
  const nuevo = !vendedor.id
  const [f, setF] = useState({ nombre:'', codigo:'', relacion:'', telefono:'', correo:'', tipo_comision:'porcentaje', valor:'', duracion_meses:'', acuerdo:'', cuenta_pago:'', activo:true, ...vendedor,
    valor: String(vendedor.valor ?? ''), duracion_meses: String(vendedor.duracion_meses ?? '') })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const t = tipoDe(f.tipo_comision)
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Escribe el nombre.')
    const d = { nombre: f.nombre.trim(), codigo: f.codigo.trim() || codigoDe(f.nombre), relacion: f.relacion || null, telefono: f.telefono || null, correo: f.correo || null,
      tipo_comision: f.tipo_comision, valor: n2(f.valor), duracion_meses: f.duracion_meses ? Number(f.duracion_meses) : null,
      acuerdo: f.acuerdo || null, cuenta_pago: f.cuenta_pago || null, activo: f.activo }
    const { error: e } = nuevo ? await supabase.from('lrm_vendedores').insert(d) : await supabase.from('lrm_vendedores').update(d).eq('id', vendedor.id)
    if (e) return setError('No se pudo guardar: ' + e.message)
    onGuardado()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:130, padding:16, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:540, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{nuevo ? 'Nuevo vendedor' : 'Editar vendedor'}</div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Nombre *</Etiqueta><input id="ven-nombre" value={f.nombre} onChange={set('nombre')} style={iStyle} autoFocus /></div>
          <div><Etiqueta>Código</Etiqueta><input value={f.codigo} onChange={set('codigo')} placeholder={codigoDe(f.nombre) || 'LRM-JUAN'} style={iStyle} /></div>
          <div><Etiqueta>Relación</Etiqueta><input list="relaciones" value={f.relacion} onChange={set('relacion')} placeholder="Primo, amigo, aliado…" style={iStyle} />
            <datalist id="relaciones">{['Primo','Prima','Hermano','Amigo','Amiga','Aliado','Exempleado','Cliente que refiere'].map(r => <option key={r} value={r} />)}</datalist></div>
          <div><Etiqueta>WhatsApp</Etiqueta><input value={f.telefono} onChange={set('telefono')} style={iStyle} /></div>
          <div><Etiqueta>Correo</Etiqueta><input value={f.correo} onChange={set('correo')} style={iStyle} /></div>
          <div><Etiqueta>Dónde se le paga</Etiqueta><input value={f.cuenta_pago} onChange={set('cuenta_pago')} placeholder="Nequi 300…" style={iStyle} /></div>
        </div>
        <div style={{ padding:12, borderRadius:10, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 }}>Su acuerdo</div>
          <div className="grid-2" style={{ gap:10 }}>
            <div><Etiqueta>Cómo gana</Etiqueta><select id="ven-tipo" value={f.tipo_comision} onChange={set('tipo_comision')} style={iStyle}>{TIPOS_COMISION.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></div>
            {f.tipo_comision !== 'manual' && <div><Etiqueta>Valor ({t.unidad})</Etiqueta><input id="ven-valor" inputMode="decimal" value={f.valor} onChange={set('valor')} style={iStyle} /></div>}
            <div><Etiqueta>Durante (meses)</Etiqueta><input inputMode="numeric" value={f.duracion_meses} onChange={set('duracion_meses')} placeholder="Vacío = mientras siga el cliente" style={iStyle} /></div>
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{t.ayuda}</div>
          <div style={{ marginTop:8 }}><Etiqueta>Lo que cuadraste con él (en tus palabras)</Etiqueta>
            <textarea value={f.acuerdo} onChange={set('acuerdo')} placeholder="Ej: le doy el 20% de lo que me quede de cada cliente que traiga, el primer año. Le pago cada 15 días." style={{ ...iStyle, minHeight:64, resize:'vertical' }} /></div>
        </div>
        {!nuevo && <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--text2)', marginBottom:10 }}><input type="checkbox" checked={f.activo} onChange={e => setF(p => ({ ...p, activo:e.target.checked }))} /> Activo</label>}
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Ficha del vendedor: clientes, comisiones por registrar y por pagar ──────
function FichaVendedor({ v, datos, porCausar, onEditar, onPropuesta, onCerrar, onCambio }) {
  const { clientes, comisiones, cuentas } = datos
  const susClientes = clientes.filter(c => c.vendedor_id === v.id)
  const libres = clientes.filter(c => !c.vendedor_id)
  const suyas = comisiones.filter(c => c.vendedor_id === v.id)
  const [asignar, setAsignar] = useState('')
  const [montos, setMontos] = useState({})
  const [pagar, setPagar] = useState(null)        // comisión que se está pagando
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || '')
  const [msg, setMsg] = useState('')
  const nombreCli = id => clientes.find(c => c.id === id)?.nombre || '—'
  const wa = linkWhatsApp(v.telefono, v.nombre)

  const asignarCliente = async () => {
    if (!asignar) return
    await supabase.from('lrm_clientes').update({ vendedor_id: v.id, vendedor_desde: hoyISO(), referido_por: v.nombre }).eq('id', asignar)
    setAsignar(''); onCambio()
  }
  const quitarCliente = async (id) => { await supabase.from('lrm_clientes').update({ vendedor_id: null, vendedor_desde: null }).eq('id', id); onCambio() }
  const causar = async (x) => {
    const monto = montos[x.carga.id] !== undefined ? n2(String(montos[x.carga.id]).replace(/\./g, '')) : x.monto
    if (!monto) return setMsg('Pon el valor de la comisión.')
    await supabase.from('lrm_comisiones').insert({ vendedor_id: v.id, cliente_id: x.cliente.id, carga_id: x.carga.id, base: x.base, monto, nota: `WR ${x.carga.guia}` })
    setMsg(''); onCambio()
  }
  const confirmarPago = async () => {
    if (!cuentaId) return setMsg('Elige de qué cuenta sale la plata.')
    const { data: mov, error } = await supabase.from('lrm_movimientos').insert({
      tipo:'gasto', concepto:'otro', categoria:'Comisiones vendedores', cuenta_id: cuentaId, monto: n2(pagar.monto), fecha: hoyISO(),
      notas: `Comisión ${v.nombre} · ${nombreCli(pagar.cliente_id)}${pagar.nota ? ' · ' + pagar.nota : ''}`,
    }).select().single()
    if (error) return setMsg('No se pudo registrar en Caja: ' + error.message)
    await supabase.from('lrm_comisiones').update({ estado:'pagada', pagada_en: hoyISO(), movimiento_id: mov.id }).eq('id', pagar.id)
    setPagar(null); onCambio()
  }
  const borrarComision = async (c) => { await supabase.from('lrm_comisiones').delete().eq('id', c.id); onCambio() }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', justifyContent:'flex-end', zIndex:110 }} onClick={onCerrar}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:560, height:'100%', overflowY:'auto', background:'var(--bg2)', borderLeft:'1px solid var(--border)', padding:22 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, color:'var(--gold)', fontWeight:700 }}>{v.codigo}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>{v.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{[v.relacion, v.telefono, v.cuenta_pago && `Se le paga: ${v.cuenta_pago}`].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={onCerrar} className="btn">✕</button>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', margin:'14px 0' }}>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ color:'#25D366', borderColor:'rgba(37,211,102,0.4)', textDecoration:'none' }}>💬 WhatsApp</a>}
          <button onClick={() => onPropuesta(v)} className="btn-gold">📄 Mandarle su propuesta</button>
          <button onClick={() => onEditar(v)} className="btn">✏️ Editar acuerdo</button>
        </div>
        <div style={{ padding:12, borderRadius:10, background:'var(--bg4)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{resumenAcuerdo(v)}</div>
          {v.acuerdo && <div style={{ fontSize:12, color:'var(--text2)', marginTop:6, whiteSpace:'pre-wrap' }}>{v.acuerdo}</div>}
        </div>

        <Titulo>Sus clientes ({susClientes.length})</Titulo>
        {susClientes.map(c => (
          <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
            <span style={{ color:'var(--text)' }}>{c.nombre} <span style={{ color:'var(--text4)' }}>· desde {fechaCorta(c.vendedor_desde)}</span></span>
            <button onClick={() => quitarCliente(c.id)} className="btn" style={{ fontSize:10, padding:'3px 8px' }}>Quitar</button>
          </div>
        ))}
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          <select id="ven-asignar" value={asignar} onChange={e => setAsignar(e.target.value)} style={{ ...iStyle, marginTop:0 }}>
            <option value="">Asignar un cliente que trajo…</option>
            {libres.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <button onClick={asignarCliente} disabled={!asignar} className="btn">Asignar</button>
        </div>

        {porCausar.length > 0 && <>
          <Titulo>Comisiones por registrar ({porCausar.length})</Titulo>
          {porCausar.map(x => (
            <div key={x.carga.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:180, fontSize:12 }}>
                <div style={{ color:'var(--text)' }}>{x.cliente.nombre} · WR {x.carga.guia}</div>
                <div style={{ fontSize:11, color:'var(--text4)' }}>{fechaCorta(x.carga.fecha_recibo)} · {fmt(x.carga.peso_cobrable_kg)} kg · ganancia {cop(gananciaCarga(x.carga).ganancia)}</div>
              </div>
              <input inputMode="numeric" value={montos[x.carga.id] ?? String(x.monto || '')} onChange={e => setMontos(p => ({ ...p, [x.carga.id]: e.target.value }))} placeholder="Valor" style={{ ...iStyle, marginTop:0, width:120 }} />
              <button onClick={() => causar(x)} className="btn-gold" style={{ fontSize:11 }}>Registrar</button>
            </div>
          ))}
        </>}

        <Titulo>Comisiones ({suyas.length})</Titulo>
        {suyas.length === 0 && <div style={{ fontSize:12, color:'var(--text4)' }}>Todavía no tiene comisiones.</div>}
        {suyas.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ flex:1, fontSize:12 }}>
              <div style={{ color:'var(--text)' }}>{nombreCli(c.cliente_id)}{c.nota ? ` · ${c.nota}` : ''}</div>
              <div style={{ fontSize:11, color: c.estado === 'pagada' ? 'var(--green)' : '#E8A23A' }}>{c.estado === 'pagada' ? `Pagada el ${fechaCorta(c.pagada_en)}` : `Pendiente desde el ${fechaCorta(c.fecha)}`}</div>
            </div>
            <div style={{ fontSize:13, fontWeight:800, color: c.estado === 'pagada' ? 'var(--green)' : 'var(--red)' }}>{cop(c.monto)}</div>
            {c.estado === 'pendiente' && <>
              <button onClick={() => setPagar(c)} className="btn-green" style={{ fontSize:11, padding:'5px 10px' }}>Pagar</button>
              <button onClick={() => borrarComision(c)} title="Borrar" style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer' }}>✕</button>
            </>}
          </div>
        ))}
        {msg && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{msg}</div>}

        {pagar && (
          <div style={{ marginTop:14, padding:12, borderRadius:10, background:'var(--green-dim)', border:'1px solid var(--green-border)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--green)', marginBottom:6 }}>Pagar {cop(pagar.monto)} a {v.nombre}</div>
            <div style={{ display:'flex', gap:6 }}>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} style={{ ...iStyle, marginTop:0 }}>
                {cuentas.map(c => <option key={c.id} value={c.id}>Sale de {c.nombre}</option>)}
              </select>
              <button onClick={confirmarPago} className="btn-green">Confirmar</button>
              <button onClick={() => setPagar(null)} className="btn">Cancelar</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>Queda en Caja como gasto "Comisiones vendedores".</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Propuesta para mandarle al vendedor por WhatsApp ───────────────────────
function ModalPropuesta({ v, onCerrar }) {
  const primer = (v.nombre || '').split(' ')[0]
  const gana = v.tipo_comision === 'porcentaje' ? `el ${fmt(v.valor)}% de lo que me quede de cada carga de tus clientes`
    : v.tipo_comision === 'por_kg' ? `${cop(v.valor)} por cada kilo que muevan tus clientes`
    : v.tipo_comision === 'fijo_carga' ? `${cop(v.valor)} por cada carga de tus clientes` : 'una comisión por cada carga que acordamos juntos'
  const [texto, setTexto] = useState(
`Hola ${primer}, te tengo una propuesta 🙌

Estoy creciendo LRM Trade Consulting: traemos mercancía desde Miami, China y Panamá y la entregamos en Barranquilla, segura y a tiempo.

Quiero que hagas parte de mi red comercial. Tu trabajo es sencillo: presentarme personas o negocios que traigan mercancía de afuera (perfumes, celulares, cosméticos, tecnología, lo que sea). Yo me encargo de todo lo demás.

Lo que ganas: ${gana}${v.duracion_meses ? `, durante ${v.duracion_meses} meses desde que el cliente arranca` : ', mientras el cliente siga trabajando con nosotros'}.

Tu código es ${v.codigo || codigoDe(v.nombre)}: cuando me pases un cliente, dile que viene de tu parte y queda registrado a tu nombre. Te pago apenas el cliente me pague${v.cuenta_pago ? `, a ${v.cuenta_pago}` : ''}.

¿Te le mides? Cualquier duda me dices.`)
  const wa = linkWhatsApp(v.telefono, v.nombre, texto)
  const [copiado, setCopiado] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:16 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:560, border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>PROPUESTA PARA {v.nombre.toUpperCase()}</div>
        <div style={{ fontSize:12, color:'var(--text3)', margin:'4px 0 10px' }}>Sale de su acuerdo. Ajústala antes de mandarla.</div>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} style={{ ...iStyle, minHeight:300, resize:'vertical', lineHeight:1.5 }} />
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {wa ? <a href={wa} target="_blank" rel="noreferrer" className="btn-green" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>Enviar por WhatsApp</a>
            : <button disabled className="btn" style={{ flex:1 }}>Sin WhatsApp registrado</button>}
          <button onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true) } catch {} }} className="btn">{copiado ? '✓ Copiado' : 'Copiar'}</button>
          <button onClick={onCerrar} className="btn">Cerrar</button>
        </div>
      </div>
    </div>
  )
}