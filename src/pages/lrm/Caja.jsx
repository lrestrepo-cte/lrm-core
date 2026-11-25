// @ts-nocheck
// LRM Trade Consulting · Caja
// Cuentas de plata, todo lo que entra y sale, cartera, lo que se debe y el cierre de cada mes.
// Tablas: lrm_cuentas, lrm_movimientos, lrm_cierres, lrm_clientes  (SQL: 04 y 05)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO, fechaCorta } from './LRMClientes'
import { CuentaCobro } from './Cargas'

const cop = n => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const num = v => Number(String(v ?? '').replace(/\D/g, '')) || 0
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const nombreMes = m => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`
const moverMes = (m, n) => { const d = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + n, 1); return d.toISOString().slice(0, 7) }
const finDeMes = m => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).toISOString().slice(0, 10)

export const CATEGORIAS_GASTO = ['Publicidad','Comisiones vendedores','Transporte local','Aduana e impuestos','Software y herramientas','Celular e internet','Bancarios','Viáticos','Papelería','Otros']
const CATEGORIAS_INGRESO = ['Aporte del dueño','Reintegro','Otro ingreso']
const CONCEPTOS = [
  { id:'honorario', label:'Honorarios del servicio' },
  { id:'flete',     label:'Flete' },
  { id:'otro',      label:'Otro (aduana, transporte, etc.)' },
]
const PROVEEDORES_SUGERIDOS = ['RD Star - Ok Cargo', 'Agente de aduana']

// Qué hace cada tipo de movimiento
export const TIPOS = {
  abono_cliente:   { label:'Pago de cliente',        grupo:'entra',  signo: 1, color:'var(--green)', icono:'↓' },
  ingreso:         { label:'Otro ingreso',           grupo:'entra',  signo: 1, color:'var(--green)', icono:'↓' },
  pago_proveedor:  { label:'Pago a proveedor',       grupo:'sale',   signo:-1, color:'var(--red)',   icono:'↑' },
  gasto:           { label:'Gasto',                  grupo:'sale',   signo:-1, color:'var(--red)',   icono:'↑' },
  retiro:          { label:'Retiro para mí',         grupo:'sale',   signo:-1, color:'#E8A23A',      icono:'↑' },
  traslado:        { label:'Traslado entre cuentas', grupo:'mueve',  signo: 0, color:'var(--blue)',  icono:'⇄' },
  cobro_cliente:   { label:'Cuenta de cobro',        grupo:'causa',  signo: 0, color:'var(--gold)',  icono:'＋' },
  costo_proveedor: { label:'Factura de proveedor',   grupo:'causa',  signo: 0, color:'var(--gold)',  icono:'＋' },
}
const BOTONES = [
  { grupo:'Entra plata',          tipos:['abono_cliente','ingreso'] },
  { grupo:'Sale plata',           tipos:['pago_proveedor','gasto','retiro'] },
  { grupo:'Queda pendiente',      tipos:['cobro_cliente','costo_proveedor'] },
  { grupo:'Entre cuentas',        tipos:['traslado'] },
]

const iStyle = {
  width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)',
  border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4,
}
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>

function Bloque({ titulo, extra, children, style }) {
  return (
    <div className="panel" style={style}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, gap:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>{titulo}</div>
        {extra}
      </div>
      {children}
    </div>
  )
}

// ── Cálculos ────────────────────────────────────────────────────────────────
// Efecto de un movimiento sobre una cuenta
export function efectoEnCuenta(m, cuentaId) {
  const monto = Number(m.monto || 0)
  if (m.tipo === 'traslado') return (m.cuenta_destino_id === cuentaId ? monto : 0) - (m.cuenta_id === cuentaId ? monto : 0)
  if (m.cuenta_id !== cuentaId) return 0
  return (TIPOS[m.tipo]?.signo || 0) * monto
}
export const saldoCuenta = (c, movs, hasta) =>
  Number(c.saldo_inicial || 0) + movs.filter(m => !hasta || m.fecha <= hasta).reduce((s, m) => s + efectoEnCuenta(m, c.id), 0)

const suma = (movs, f) => movs.filter(f).reduce((s, m) => s + Number(m.monto || 0), 0)

export function resumenDelMes(mes, movs, cuentas) {
  const delMes = movs.filter(m => (m.fecha || '').startsWith(mes))
  const de = (tipo, concepto) => suma(delMes, m => m.tipo === tipo && (!concepto || m.concepto === concepto))
  const entro = de('abono_cliente') + de('ingreso')
  const salio = de('pago_proveedor') + de('gasto') + de('retiro')
  const honorarios = de('cobro_cliente', 'honorario')
  const margen = de('cobro_cliente', 'flete') - de('costo_proveedor', 'flete')
  const costos = de('costo_proveedor', 'otro') + de('costo_proveedor', 'honorario') - de('cobro_cliente', 'otro')
  const gastos = de('gasto')
  const porCategoria = CATEGORIAS_GASTO.map(c => ({ c, v: suma(delMes, m => m.tipo === 'gasto' && (m.categoria || 'Otros') === c) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)
  const saldos = cuentas.map(c => ({ nombre: c.nombre, saldo: saldoCuenta(c, movs, finDeMes(mes)) }))
  return { entro, salio, flujo: entro - salio, honorarios, margen, costos, gastos, retiros: de('retiro'), utilidad: honorarios + margen - costos - gastos, porCategoria, saldos, movimientos: delMes.length }
}

function saldosPendientes(movs, clave, cargo, pago) {
  const ids = [...new Set(movs.filter(m => m[clave] && (m.tipo === cargo || m.tipo === pago)).map(m => m[clave]))]
  return ids.map(id => {
    const cargos = movs.filter(m => m[clave] === id && m.tipo === cargo).sort((a, b) => a.fecha.localeCompare(b.fecha))
    let pagado = suma(movs, m => m[clave] === id && m.tipo === pago)
    const saldo = suma(cargos, () => true) - pagado
    let abierto = null
    for (const c of cargos) { if (pagado >= c.monto) { pagado -= c.monto } else { abierto = c; break } }
    return { id, saldo, desde: abierto?.fecha, vence: abierto?.vence }
  }).filter(x => x.saldo > 0)
}

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function Caja() {
  const [cuentas, setCuentas] = useState([])
  const [movs, setMovs] = useState([])
  const [clientes, setClientes] = useState([])
  const [cierres, setCierres] = useState([])
  const [cargando, setCargando] = useState(true)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [mes, setMes] = useState(hoyISO().slice(0, 7))
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(null)          // { tipo, inicial }
  const [modalCuenta, setModalCuenta] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [cuentaDe, setCuentaDe] = useState(null)       // id de la carga cuya cuenta de cobro se está viendo

  const cargar = async () => {
    const [cu, mo, cl, ci] = await Promise.all([
      supabase.from('lrm_cuentas').select('*').order('created_at'),
      supabase.from('lrm_movimientos').select('*').order('fecha', { ascending:false }).order('created_at', { ascending:false }),
      supabase.from('lrm_clientes').select('id,nombre,empresa').order('nombre'),
      supabase.from('lrm_cierres').select('*'),
    ])
    if ([cu, mo, cl, ci].some(r => r.error)) { setFaltaTabla(true); setCargando(false); return }
    setCuentas(cu.data || []); setMovs(mo.data || []); setClientes(cl.data || []); setCierres(ci.data || [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const activas = cuentas.filter(c => c.activa)
  const nombreCliente = id => clientes.find(c => c.id === id)?.nombre || '—'
  const nombreCuenta = id => cuentas.find(c => c.id === id)?.nombre || '—'
  const cerrado = m => cierres.some(c => c.mes === m)
  const resumen = useMemo(() => resumenDelMes(mes, movs, activas), [mes, movs, cuentas])
  const cartera = useMemo(() => saldosPendientes(movs, 'cliente_id', 'cobro_cliente', 'abono_cliente').map(x => ({ ...x, nombre: nombreCliente(x.id) })).sort((a, b) => (a.desde || '').localeCompare(b.desde || '')), [movs, clientes])
  const porPagar = useMemo(() => saldosPendientes(movs, 'proveedor', 'costo_proveedor', 'pago_proveedor').map(x => ({ ...x, nombre: x.id })).sort((a, b) => (a.vence || '9999').localeCompare(b.vence || '9999')), [movs])
  const proveedores = [...new Set([...PROVEEDORES_SUGERIDOS, ...movs.map(m => m.proveedor).filter(Boolean)])]
  const totalCaja = activas.reduce((s, c) => s + saldoCuenta(c, movs), 0)

  const delMes = movs.filter(m => (m.fecha || '').startsWith(mes)).filter(m =>
    filtro === 'todos' ? true : filtro === 'pendiente' ? TIPOS[m.tipo]?.grupo === 'causa' : TIPOS[m.tipo]?.grupo === filtro)

  const borrar = async (m) => {
    if (borrando !== m.id) { setBorrando(m.id); return }
    await supabase.from('lrm_movimientos').delete().eq('id', m.id)
    setBorrando(null); cargar()
  }

  const cerrarMes = async () => {
    await supabase.from('lrm_cierres').upsert({ mes, resumen })
    cargar()
  }
  const reabrirMes = async () => { await supabase.from('lrm_cierres').delete().eq('mes', mes); cargar() }

  const descargar = () => {
    const filas = [['Fecha','Tipo','Cliente / Proveedor','Concepto','Categoría','Cuenta','Entra','Sale','Pendiente','Referencia','Notas']]
    movs.filter(m => (m.fecha || '').startsWith(mes)).slice().reverse().forEach(m => {
      const t = TIPOS[m.tipo] || {}
      const tercero = m.cliente_id ? nombreCliente(m.cliente_id) : (m.proveedor || '')
      const cuenta = m.tipo === 'traslado' ? `${nombreCuenta(m.cuenta_id)} → ${nombreCuenta(m.cuenta_destino_id)}` : (m.cuenta_id ? nombreCuenta(m.cuenta_id) : '')
      filas.push([m.fecha, t.label, tercero, m.concepto || '', m.categoria || '', cuenta,
        t.signo > 0 ? m.monto : '', t.signo < 0 ? m.monto : '', t.grupo === 'causa' ? m.monto : '', m.referencia || '', m.notas || ''])
    })
    filas.push([], ['Resumen', nombreMes(mes)], ['Entró', resumen.entro], ['Salió', resumen.salio], ['Utilidad', resumen.utilidad])
    const csv = '﻿' + filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }))
    a.download = `LRM-Trade-caja-${mes}.csv`; a.click()
  }

  if (faltaTabla) return (
    <div className="panel" style={{ maxWidth:560, border:'1px solid rgba(224,82,82,0.3)' }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Falta crear las tablas de Caja</div>
      <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>Corre en Supabase (SQL Editor) el archivo <b>05_lrm_caja.sql</b> y recarga la página.</div>
    </div>
  )
  if (cargando) return <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text3)' }}>Cargando…</div>

  const mesCerrado = cerrado(mes)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Cuentas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:12 }}>
        <div className="kpi-card" style={{ border:'1px solid var(--gold-border)' }}>
          <div className="kpi-label">Total en caja</div>
          <div className="kpi-val" style={{ color:'var(--gold)', fontSize:22 }}>{cop(totalCaja)}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{activas.length} cuentas</div>
        </div>
        {activas.map(c => (
          <div key={c.id} className="kpi-card" onClick={() => setModalCuenta(c)} style={{ cursor:'pointer' }}>
            <div className="kpi-label">{c.nombre}</div>
            <div className="kpi-val" style={{ fontSize:20 }}>{cop(saldoCuenta(c, movs))}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4, textTransform:'capitalize' }}>{c.tipo}</div>
          </div>
        ))}
        <button onClick={() => setModalCuenta({})} className="kpi-card" style={{ cursor:'pointer', border:'1px dashed var(--border2)', background:'transparent', color:'var(--text3)', fontSize:13, fontFamily:'inherit' }}>+ Cuenta</button>
      </div>

      {/* Registrar */}
      <Bloque titulo="Registrar">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap:14 }}>
          {BOTONES.map(b => (
            <div key={b.grupo}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{b.grupo}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {b.tipos.map(t => (
                  <button key={t} onClick={() => setModal({ tipo:t })} disabled={activas.length === 0 && TIPOS[t].grupo !== 'causa'}
                    style={{ padding:'8px 12px', borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                      background:'var(--bg4)', border:`1px solid ${TIPOS[t].color}55`, color:TIPOS[t].color }}>
                    {TIPOS[t].icono} {TIPOS[t].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Bloque>

      {/* Cartera y por pagar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap:14 }}>
        <Bloque titulo="Cartera · te deben" extra={<span style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(cartera.reduce((s, x) => s + x.saldo, 0))}</span>}>
          {cartera.length === 0 ? <Vacio>Nadie te debe.</Vacio> : cartera.map(x => {
            const vencido = x.vence && x.vence < hoyISO()
            return (
              <Fila key={x.id} titulo={x.nombre} sub={x.vence ? (vencido ? `vencido desde el ${fechaCorta(x.vence)}` : `vence ${fechaCorta(x.vence)}`) : `desde el ${fechaCorta(x.desde)}`} subColor={vencido ? 'var(--red)' : undefined}
                valor={cop(x.saldo)} color="var(--gold)"
                accion={<button className="btn" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => setModal({ tipo:'abono_cliente', inicial:{ cliente_id:x.id, monto:String(x.saldo) } })}>Registrar pago</button>} />
            )
          })}
        </Bloque>
        <Bloque titulo="Por pagar · debes" extra={<span style={{ fontSize:13, fontWeight:800, color:'var(--red)' }}>{cop(porPagar.reduce((s, x) => s + x.saldo, 0))}</span>}>
          {porPagar.length === 0 ? <Vacio>No le debes a ningún proveedor.</Vacio> : porPagar.map(x => {
            const vencido = x.vence && x.vence < hoyISO()
            return (
              <Fila key={x.id} titulo={x.nombre} sub={x.vence ? (vencido ? `vencido desde el ${fechaCorta(x.vence)}` : `vence ${fechaCorta(x.vence)}`) : 'sin fecha'} subColor={vencido ? 'var(--red)' : undefined}
                valor={cop(x.saldo)} color="var(--red)"
                accion={<button className="btn" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => setModal({ tipo:'pago_proveedor', inicial:{ proveedor:x.id, monto:String(x.saldo) } })}>Pagar</button>} />
            )
          })}
        </Bloque>
      </div>

      {/* Mes */}
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="btn" onClick={() => setMes(moverMes(mes, -1))}>‹</button>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', textTransform:'capitalize', minWidth:150, textAlign:'center' }}>{nombreMes(mes)}</div>
            <button className="btn" onClick={() => setMes(moverMes(mes, 1))}>›</button>
            {mesCerrado && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:8, background:'var(--green-dim)', color:'var(--green)', border:'1px solid var(--green-border)' }}>🔒 Cerrado</span>}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['todos','Todo'],['entra','Entradas'],['sale','Salidas'],['pendiente','Pendientes'],['mueve','Traslados']].map(([id, l]) => (
              <button key={id} onClick={() => setFiltro(id)} className={filtro === id ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Resumen del mes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:10, marginBottom:16 }}>
          <MiniKpi l="Entró" v={cop(resumen.entro)} c="var(--green)" />
          <MiniKpi l="Salió" v={cop(resumen.salio)} c="var(--red)" />
          <MiniKpi l="Flujo del mes" v={cop(resumen.flujo)} c={resumen.flujo >= 0 ? 'var(--green)' : 'var(--red)'} />
          <MiniKpi l="Utilidad del mes" v={cop(resumen.utilidad)} c={resumen.utilidad >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>

        {/* Movimientos */}
        {delMes.length === 0 ? <Vacio>Sin movimientos en {nombreMes(mes)}.</Vacio> : (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {delMes.map(m => {
              const t = TIPOS[m.tipo] || {}
              const tercero = m.cliente_id ? nombreCliente(m.cliente_id) : m.proveedor
              const detalle = [tercero, m.categoria, (m.cliente_id || m.proveedor) && m.concepto && CONCEPTOS.find(c => c.id === m.concepto)?.label.split(' (')[0], m.referencia, m.notas].filter(Boolean).join(' · ')
              const cuenta = m.tipo === 'traslado' ? `${nombreCuenta(m.cuenta_id)} → ${nombreCuenta(m.cuenta_destino_id)}` : m.cuenta_id ? nombreCuenta(m.cuenta_id) : t.grupo === 'causa' ? (m.vence ? `vence ${fechaCorta(m.vence)}` : 'pendiente') : ''
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, background:'var(--bg4)' }}>
                  <div style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:`${t.color}22`, color:t.color, fontWeight:800, flexShrink:0 }}>{t.icono}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{t.label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fechaCorta(m.fecha)}{detalle ? ' · ' + detalle : ''}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:t.color, whiteSpace:'nowrap' }}>{t.signo > 0 ? '+' : t.signo < 0 ? '−' : ''}{cop(m.monto).replace('−', '')}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' }}>{cuenta}</div>
                  </div>
                  {m.tipo === 'cobro_cliente' && m.carga_id && (
                    <button onClick={() => setCuentaDe(m.carga_id)} title="Ver cuenta de cobro" className="btn" style={{ fontSize:11, padding:'4px 8px' }}>🧾</button>
                  )}
                  {!mesCerrado && (
                    <button onClick={() => borrar(m)} onBlur={() => setBorrando(null)} title="Borrar"
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color: borrando === m.id ? 'var(--red)' : 'var(--text4)', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      {borrando === m.id ? '¿Borrar?' : '✕'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cierre del mes */}
      <Bloque titulo={`Cierre de ${nombreMes(mes)}`}
        extra={<div style={{ display:'flex', gap:6 }}>
          <button className="btn" onClick={descargar} style={{ fontSize:11 }}>⬇ Excel</button>
          {mesCerrado
            ? <button className="btn" onClick={reabrirMes} style={{ fontSize:11 }}>Reabrir mes</button>
            : <button className="btn-gold" onClick={cerrarMes} style={{ fontSize:11 }}>🔒 Cerrar mes</button>}
        </div>}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap:20 }}>
          <div>
            <Subtitulo>Resultado</Subtitulo>
            {[['Honorarios del servicio', resumen.honorarios], ['Margen sobre fletes', resumen.margen], ['Costos directos', -resumen.costos], ['Gastos', -resumen.gastos]].map(([l, v]) => <Linea key={l} l={l} v={v} />)}
            <Linea l="Utilidad" v={resumen.utilidad} fuerte />
            {resumen.retiros > 0 && <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>Retiraste {cop(resumen.retiros)} para ti (no cuenta como gasto).</div>}
          </div>
          <div>
            <Subtitulo>En qué se fue la plata</Subtitulo>
            {resumen.porCategoria.length === 0 ? <Vacio>Sin gastos.</Vacio> : resumen.porCategoria.map(x => (
              <div key={x.c} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}><span style={{ color:'var(--text2)' }}>{x.c}</span><span style={{ color:'var(--text)' }}>{cop(x.v)}</span></div>
                <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.05)' }}><div style={{ height:'100%', width:`${(x.v / resumen.porCategoria[0].v) * 100}%`, background:'var(--red)', borderRadius:3, opacity:0.7 }} /></div>
              </div>
            ))}
          </div>
          <div>
            <Subtitulo>Saldos al final del mes</Subtitulo>
            {resumen.saldos.map(s => <Linea key={s.nombre} l={s.nombre} v={s.saldo} />)}
            <Linea l="Total" v={resumen.saldos.reduce((a, s) => a + s.saldo, 0)} fuerte />
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--text4)', marginTop:14, lineHeight:1.6 }}>
          Al cerrar el mes, sus movimientos quedan bloqueados para que los números no cambien. Si necesitas corregir algo, lo reabres.
        </div>
      </Bloque>

      {modal && <ModalMovimiento {...modal} cuentas={activas} clientes={clientes} proveedores={proveedores} cerrado={cerrado}
        onCerrar={() => setModal(null)} onGuardado={() => { setModal(null); cargar() }} />}
      {cuentaDe && <CuentaCobro cargaId={cuentaDe} onCerrar={() => setCuentaDe(null)} />}
      {modalCuenta && <ModalCuenta cuenta={modalCuenta} onCerrar={() => setModalCuenta(null)} onGuardado={() => { setModalCuenta(null); cargar() }} />}
    </div>
  )
}

const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'14px 0', textAlign:'center' }}>{children}</div>
const Subtitulo = ({ children }) => <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{children}</div>
const MiniKpi = ({ l, v, c }) => (
  <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--bg4)' }}>
    <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase' }}>{l}</div>
    <div style={{ fontSize:17, fontWeight:800, color:c, marginTop:2 }}>{v}</div>
  </div>
)
const Linea = ({ l, v, fuerte }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding: fuerte ? '9px 0 0' : '5px 0', marginTop: fuerte ? 6 : 0, borderTop: fuerte ? '1px solid var(--border2)' : 'none', fontSize: fuerte ? 14 : 13 }}>
    <span style={{ color: fuerte ? 'var(--text)' : 'var(--text2)', fontWeight: fuerte ? 700 : 400 }}>{l}</span>
    <span style={{ color: v < 0 ? 'var(--red)' : fuerte ? 'var(--green)' : 'var(--text)', fontWeight: fuerte ? 800 : 600 }}>{cop(v)}</span>
  </div>
)
function Fila({ titulo, sub, subColor, valor, color, accion }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{titulo}</div>
        <div style={{ fontSize:11, color: subColor || 'var(--text3)' }}>{sub}</div>
      </div>
      <div style={{ fontSize:13, fontWeight:800, color }}>{valor}</div>
      {accion}
    </div>
  )
}

// ── Formulario de movimiento ────────────────────────────────────────────────
export function ModalMovimiento({ tipo, inicial = {}, cuentas, clientes, proveedores, cerrado, onCerrar, onGuardado }) {
  const t = TIPOS[tipo]
  const usaCliente   = tipo === 'abono_cliente' || tipo === 'cobro_cliente'
  const usaProveedor = tipo === 'pago_proveedor' || tipo === 'costo_proveedor'
  const usaCuenta    = t.grupo !== 'causa'
  const usaConcepto  = usaCliente || usaProveedor
  const usaVence     = t.grupo === 'causa'
  const categorias   = tipo === 'gasto' ? CATEGORIAS_GASTO : tipo === 'ingreso' ? CATEGORIAS_INGRESO : null

  const [f, setF] = useState({
    fecha: hoyISO(), monto:'', cuenta_id: cuentas[0]?.id || '', cuenta_destino_id: cuentas[1]?.id || '',
    cliente_id:'', proveedor:'', concepto: tipo.includes('proveedor') ? 'flete' : 'honorario', categoria: categorias?.[0] || '',
    vence:'', referencia:'', notas:'', ...inicial,
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  const guardar = async () => {
    const monto = num(f.monto)
    if (!monto) return setError('Escribe el valor.')
    if (usaCliente && !f.cliente_id) return setError('Elige el cliente.')
    if (usaProveedor && !f.proveedor.trim()) return setError('Escribe el proveedor.')
    if (usaCuenta && !f.cuenta_id) return setError('Elige la cuenta.')
    if (tipo === 'traslado' && f.cuenta_id === f.cuenta_destino_id) return setError('Elige dos cuentas distintas.')
    if (cerrado(f.fecha.slice(0, 7))) return setError('Ese mes ya está cerrado. Reábrelo para registrar algo ahí.')
    setGuardando(true)
    const { error: e } = await supabase.from('lrm_movimientos').insert({
      tipo, fecha: f.fecha, monto,
      concepto: usaConcepto ? f.concepto : 'otro',
      categoria: categorias ? f.categoria : null,
      cliente_id: usaCliente ? f.cliente_id : null,
      proveedor: usaProveedor ? f.proveedor.trim() : null,
      cuenta_id: usaCuenta ? f.cuenta_id : null,
      cuenta_destino_id: tipo === 'traslado' ? f.cuenta_destino_id : null,
      vence: usaVence && f.vence ? f.vence : null,
      referencia: f.referencia || null, notas: f.notas || null,
    })
    setGuardando(false)
    if (e) return setError('No se pudo guardar: ' + e.message)
    onGuardado()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:24, width:'100%', maxWidth:440, border:'1px solid var(--border)', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:t.color, marginBottom:16 }}>{t.icono} {t.label}</div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Valor (COP)</Etiqueta><input id="mov-monto" inputMode="numeric" value={f.monto ? Number(num(f.monto)).toLocaleString('es-CO') : ''} onChange={set('monto')} style={iStyle} autoFocus /></div>
          <div><Etiqueta>Fecha</Etiqueta><input type="date" value={f.fecha} onChange={set('fecha')} style={iStyle} /></div>
        </div>
        {usaCliente && (
          <div style={{ marginBottom:10 }}><Etiqueta>Cliente</Etiqueta>
            <select id="mov-cliente" value={f.cliente_id} onChange={set('cliente_id')} style={iStyle}>
              <option value="">Elegir…</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
            </select></div>
        )}
        {usaProveedor && (
          <div style={{ marginBottom:10 }}><Etiqueta>Proveedor</Etiqueta>
            <input id="mov-proveedor" list="lrm-proveedores" value={f.proveedor} onChange={set('proveedor')} style={iStyle} />
            <datalist id="lrm-proveedores">{proveedores.map(p => <option key={p} value={p} />)}</datalist></div>
        )}
        {usaConcepto && (
          <div style={{ marginBottom:10 }}><Etiqueta>Concepto</Etiqueta>
            <select value={f.concepto} onChange={set('concepto')} style={iStyle}>{CONCEPTOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        )}
        {categorias && (
          <div style={{ marginBottom:10 }}><Etiqueta>Categoría</Etiqueta>
            <select id="mov-categoria" value={f.categoria} onChange={set('categoria')} style={iStyle}>{categorias.map(c => <option key={c}>{c}</option>)}</select></div>
        )}
        {usaCuenta && (
          <div className={tipo === 'traslado' ? 'grid-2' : ''} style={{ gap:10, marginBottom:10 }}>
            <div><Etiqueta>{tipo === 'traslado' ? 'Sale de' : t.signo > 0 ? 'Entra a' : 'Sale de'}</Etiqueta>
              <select id="mov-cuenta" value={f.cuenta_id} onChange={set('cuenta_id')} style={iStyle}>{cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            {tipo === 'traslado' && <div><Etiqueta>Entra a</Etiqueta>
              <select value={f.cuenta_destino_id} onChange={set('cuenta_destino_id')} style={iStyle}>{cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>}
          </div>
        )}
        {usaVence && (
          <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
            <div><Etiqueta>Vence</Etiqueta><input type="date" value={f.vence} onChange={set('vence')} style={iStyle} /></div>
            <div><Etiqueta>N.º / referencia</Etiqueta><input value={f.referencia} onChange={set('referencia')} placeholder="Ej: LRM-2026-250" style={iStyle} /></div>
          </div>
        )}
        <div style={{ marginBottom:14 }}><Etiqueta>Nota (opcional)</Etiqueta><input value={f.notas} onChange={set('notas')} style={iStyle} /></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} disabled={guardando} className="btn-green" style={{ flex:1 }}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Crear o editar una cuenta ──────────────────────────────────────────────
function ModalCuenta({ cuenta, onCerrar, onGuardado }) {
  const nueva = !cuenta.id
  const [f, setF] = useState({ nombre: cuenta.nombre || '', tipo: cuenta.tipo || 'banco', saldo_inicial: String(cuenta.saldo_inicial || '') })
  const guardar = async () => {
    if (!f.nombre.trim()) return
    const datos = { nombre: f.nombre.trim(), tipo: f.tipo, saldo_inicial: num(f.saldo_inicial) }
    if (nueva) await supabase.from('lrm_cuentas').insert(datos)
    else await supabase.from('lrm_cuentas').update(datos).eq('id', cuenta.id)
    onGuardado()
  }
  const archivar = async () => { await supabase.from('lrm_cuentas').update({ activa:false }).eq('id', cuenta.id); onGuardado() }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:24, width:'100%', maxWidth:380, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>{nueva ? 'Nueva cuenta' : 'Editar cuenta'}</div>
        <div style={{ marginBottom:10 }}><Etiqueta>Nombre</Etiqueta><input value={f.nombre} onChange={e => setF(p => ({ ...p, nombre:e.target.value }))} placeholder="Ej: Bancolombia ahorros" style={iStyle} autoFocus /></div>
        <div style={{ marginBottom:10 }}><Etiqueta>Tipo</Etiqueta>
          <select value={f.tipo} onChange={e => setF(p => ({ ...p, tipo:e.target.value }))} style={iStyle}>
            <option value="banco">Banco</option><option value="billetera">Billetera (Nequi, Daviplata)</option><option value="efectivo">Efectivo</option>
          </select></div>
        <div style={{ marginBottom:16 }}><Etiqueta>Saldo con el que arranca (COP)</Etiqueta>
          <input inputMode="numeric" value={f.saldo_inicial ? Number(num(f.saldo_inicial)).toLocaleString('es-CO') : ''} onChange={e => setF(p => ({ ...p, saldo_inicial:e.target.value }))} style={iStyle} /></div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {!nueva && <button onClick={archivar} className="btn" title="Deja de aparecer, pero sus movimientos se conservan">Archivar</button>}
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}