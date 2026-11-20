// @ts-nocheck
// LRM Trade Consulting · Cargas y guías
// Recibos de bodega (warehouse receipt) tal cual llegan de RD Star u otra bodega,
// piezas con medidas, cálculo de cobro/costo/margen y trazabilidad con un clic por etapa.
// Tablas: lrm_bodegas, lrm_cargas, lrm_carga_piezas, lrm_carga_eventos, lrm_movimientos (SQL 06)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO, fechaCorta, NICHOS_LRM, nichoPrincipal } from './LRMClientes'
import { ETAPAS } from './Dashboard'
import { useDivisas } from '../../lib/divisas'
import { BODEGA_POR_DEFECTO, useDatosLRM, AVISOS_LRM, DIAS_TRANSITO } from './datosLRM'
import { linkWhatsApp } from './LRMClientes'
import { useTarifas, escaleraPara, costoPara, escalonDe, tramoTexto, cobroCarga, cantidadCobro, unidadCobro, costoCarga, UNIDAD_CORTA } from './tarifasLRM'

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => Number(String(v ?? '').replace(',', '.')) || 0
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const LB_A_KG = 0.45359237
const PIE3_A_M3 = 0.0283168
const pies3Pieza = p => (n2(p.largo) * n2(p.ancho) * n2(p.alto)) / 1728

const iStyle = {
  width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)',
  border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4,
}
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'30px 0', textAlign:'center' }}>{children}</div>
const etapaDe = id => ETAPAS.find(e => e.id === id) || ETAPAS[0]
const siguiente = id => ETAPAS[ETAPAS.findIndex(e => e.id === id) + 1]
const anterior  = id => ETAPAS[ETAPAS.findIndex(e => e.id === id) - 1]

// Costo de la bodega en US$/kg según la categoría (ej. RD Star: Perfumes = 5)
export const usdDe = (bodega, categoria) => Number(bodega?.tarifas_usd?.[categoria] || 0)

// De dónde sale el servicio según el país de la bodega
export const origenDe = (bodega) => { const p = (bodega?.pais || '').toLowerCase(); return p.includes('china') ? 'China' : p.includes('pan') ? 'Panamá' : 'Miami' }

export function totalesPiezas(piezas) {
  const piezasTot = piezas.reduce((s, p) => s + n2(p.cantidad), 0)
  const lb = piezas.reduce((s, p) => s + n2(p.cantidad) * n2(p.peso_lb), 0)
  const pies3 = piezas.reduce((s, p) => s + n2(p.cantidad) * (n2(p.pies3) || pies3Pieza(p)), 0)
  return { piezas: piezasTot, lb, kg: lb * LB_A_KG, pies3, m3: pies3 * PIE3_A_M3 }
}

export default function Cargas() {
  const [cargas, setCargas] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [filtroEtapa, setFiltroEtapa] = useState('activas')
  const [filtroBodega, setFiltroBodega] = useState('')
  const [buscar, setBuscar] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [verBodegas, setVerBodegas] = useState(false)
  const [avisar, setAvisar] = useState(null)            // { carga, etapa } para mandar el aviso al cliente

  const cargar = async () => {
    const [ca, bo, cl] = await Promise.all([
      supabase.from('lrm_cargas').select('*').order('orden', { ascending:false }),
      supabase.from('lrm_bodegas').select('*').order('created_at'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
    ])
    if ([ca, bo, cl].some(r => r.error)) { setFaltaTabla(true); setCargando(false); return }
    let bods = bo.data || []
    if (bods.length === 0) {   // sin bodegas: se crea RD Star 1 para poder trabajar de una vez
      const { data } = await supabase.from('lrm_bodegas').insert(BODEGA_POR_DEFECTO).select()
      bods = data || []
    }
    setCargas(ca.data || []); setBodegas(bods); setClientes(cl.data || []); setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const nombreCliente = id => clientes.find(c => c.id === id)?.nombre
  const nombreBodega = id => bodegas.find(b => b.id === id)?.nombre || '—'

  const lista = useMemo(() => cargas.filter(c =>
    (filtroEtapa === 'todas' || (filtroEtapa === 'activas' ? c.etapa !== 'entregada' : c.etapa === filtroEtapa)) &&
    (!filtroBodega || c.bodega_id === filtroBodega) &&
    (!buscar || [c.guia, c.referencia, c.seguimiento, c.remitente, c.descripcion, nombreCliente(c.cliente_id), String(c.orden)].join(' ').toLowerCase().includes(buscar.toLowerCase()))
  ), [cargas, filtroEtapa, filtroBodega, buscar, clientes])

  const avanzar = async (c, etapa) => {
    if (!etapa) return
    setCargas(prev => prev.map(x => x.id === c.id ? { ...x, etapa } : x))
    const extra = etapa === 'entregada' ? { fecha_entrega: hoyISO() } : etapa === 'transito' ? { fecha_salida: hoyISO() } : {}
    await supabase.from('lrm_cargas').update({ etapa, ...extra }).eq('id', c.id)
    await supabase.from('lrm_carga_eventos').insert({ carga_id: c.id, etapa })
    cargar()
    setAvisar({ carga: { ...c, etapa }, etapa })        // al cambiar de etapa, se propone avisarle al cliente
  }

  if (faltaTabla) return (
    <div className="panel" style={{ maxWidth:560, border:'1px solid rgba(224,82,82,0.3)' }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Falta crear las tablas de Logística</div>
      <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>Corre en Supabase (SQL Editor) el archivo <b>06_lrm_logistica.sql</b> y recarga la página.</div>
    </div>
  )
  if (cargando) return <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text3)' }}>Cargando…</div>

  const activas = cargas.filter(c => c.etapa !== 'entregada')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Barra de acciones */}
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <button onClick={() => setFiltroBodega('')} className={!filtroBodega ? 'btn-gold' : 'btn'} style={{ fontSize:11 }}>Todas las bodegas</button>
          {bodegas.filter(b => b.activa).map(b => (
            <button key={b.id} onClick={() => setFiltroBodega(b.id)} className={filtroBodega === b.id ? 'btn-gold' : 'btn'} style={{ fontSize:11 }}>{b.nombre}</button>
          ))}
          <button onClick={() => setVerBodegas(true)} className="btn" style={{ fontSize:11 }}>⚙ Bodegas</button>
        </div>
        <button onClick={() => setNuevo(true)} className="btn-gold" style={{ padding:'9px 18px' }}>+ Recibo de bodega</button>
      </div>

      {/* Etapas */}
      <div className="panel" style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', gap:4 }}>
          {[{ id:'activas', label:'En camino', color:'var(--gold)', n: activas.length }, ...ETAPAS.map(e => ({ ...e, n: cargas.filter(c => c.etapa === e.id).length }))].map(e => (
            <button key={e.id} onClick={() => setFiltroEtapa(filtroEtapa === e.id ? 'todas' : e.id)}
              style={{ flex:1, background: filtroEtapa === e.id ? 'var(--bg4)' : 'transparent', border:'1px solid ' + (filtroEtapa === e.id ? 'var(--border2)' : 'transparent'), borderRadius:10, padding:'8px 4px', cursor:'pointer', fontFamily:'inherit' }}>
              <div style={{ height:4, borderRadius:2, background: e.n ? e.color : 'rgba(255,255,255,0.06)', marginBottom:6 }} />
              <div style={{ fontSize:18, fontWeight:800, color: e.n ? 'var(--text)' : 'var(--text4)' }}>{e.n}</div>
              <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.2 }}>{e.label}</div>
            </button>
          ))}
        </div>
      </div>

      <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por recibo, cliente, referencia o remitente…" style={{ ...iStyle, marginTop:0, padding:'10px 12px' }} />

      {/* Lista */}
      {lista.length === 0 ? <Vacio>{cargas.length === 0 ? 'Todavía no hay cargas. Dale a "+ Recibo de bodega" para registrar la primera.' : 'Ninguna carga coincide con el filtro.'}</Vacio> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {lista.map(c => {
            const e = etapaDe(c.etapa), sig = siguiente(c.etapa)
            const cobro = cobroCarga(c), costo = costoCarga(c)
            const idx = ETAPAS.findIndex(x => x.id === c.etapa)
            return (
              <div key={c.id} className="panel" style={{ padding:'14px 16px', borderLeft:`3px solid ${e.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', cursor:'pointer' }} onClick={() => setDetalle(c)}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Orden #{c.orden} · WR {c.guia} · {nombreBodega(c.bodega_id)} · {fechaCorta(c.fecha_recibo)}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginTop:2 }}>{nombreCliente(c.cliente_id) || c.referencia || 'Sin cliente'}</div>
                    {c.seguimiento && <div style={{ fontSize:12, color:'var(--gold)', marginTop:2 }}>📌 {c.seguimiento}</div>}
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                      {[c.descripcion, c.remitente && `de ${c.remitente}`].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>
                      {c.piezas} pzs · {fmt(c.libras, 0)} lb · {fmt(c.peso_kg)} kg · {fmt(c.pies3, 2)} ft³ · {c.modalidad === 'aereo' ? 'Aéreo' : 'Marítimo'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(cobro)}</div>
                    <div style={{ fontSize:11, color:'var(--green)' }}>margen {cop(cobro - costo)}</div>
                    {!c.facturada && cobro > 0 && <div style={{ fontSize:10, color:'#E8A23A', marginTop:2 }}>sin pasar a Caja</div>}
                  </div>
                </div>
                {/* Trazabilidad */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', gap:3, flex:1, minWidth:200 }}>
                    {ETAPAS.map((x, i) => (
                      <div key={x.id} title={x.label} style={{ flex:1 }}>
                        <div style={{ height:5, borderRadius:3, background: i <= idx ? e.color : 'rgba(255,255,255,0.07)' }} />
                        <div style={{ fontSize:9, color: i === idx ? e.color : 'var(--text4)', marginTop:3, textAlign:'center', fontWeight: i === idx ? 700 : 400 }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                  {sig && <button onClick={() => avanzar(c, sig.id)} className="btn" style={{ fontSize:11, borderColor:sig.color, color:sig.color }}>→ {sig.label}</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {nuevo && <ModalRecibo bodegas={bodegas.filter(b => b.activa)} clientes={clientes} onCerrar={() => setNuevo(false)} onGuardado={() => { setNuevo(false); cargar() }} />}
      {detalle && <ModalDetalle carga={detalle} cliente={nombreCliente(detalle.cliente_id)} clienteFicha={clientes.find(x => x.id === detalle.cliente_id)} bodega={bodegas.find(b => b.id === detalle.bodega_id)}
        onAvanzar={avanzar} onAvisar={(c) => { setDetalle(null); setAvisar({ carga:c, etapa:c.etapa }) }} onCerrar={() => setDetalle(null)} onCambio={() => { setDetalle(null); cargar() }} />}
      {avisar && <ModalAviso carga={avisar.carga} etapa={avisar.etapa} cliente={clientes.find(x => x.id === avisar.carga.cliente_id)}
        bodega={bodegas.find(b => b.id === avisar.carga.bodega_id)} onCerrar={() => setAvisar(null)} />}
      {verBodegas && <ModalBodegas bodegas={bodegas} onCerrar={() => setVerBodegas(false)} onCambio={cargar} />}
    </div>
  )
}

// ── Pegar datos: convierte el bloque de texto (sacado de la foto con Claude) en el formulario ──
// Formato:
//   WR: 191360
//   Fecha: 2026-09-10            (también 9/10/2026 como viene en el recibo)
//   Bodega: RD Star 1
//   Referencia: MOHAMED ANKA / 608
//   Remitente: ORIENTAL AROMA PERFUMERIA
//   Consignatario: SPC SERVICIOS LOGISTICOS SAS
//   Descripcion: 6 CRTN CON PERFUMES
//   Modalidad: Maritimo          (o Aereo)
//   Flete: Collect               (o Prepaid)
//   Piezas:
//   4 | CART | 24 | 18 | 13 | 48     (cantidad | tipo | largo | ancho | alto | peso lb por pieza)
const sinTildes = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export function leerBloqueRecibo(texto) {
  const datos = {}, piezas = []
  let enPiezas = false
  for (const linea of String(texto || '').split(/\r?\n/)) {
    const l = linea.trim()
    if (!l) continue
    const m = l.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ .()º°#]+?)\s*:\s*(.*)$/)
    if (m && !/^\d/.test(l)) {
      const clave = sinTildes(m[1]).replace(/[^a-z]/g, '')
      enPiezas = clave.startsWith('pieza')
      if (!enPiezas) datos[clave] = m[2].trim()
      continue
    }
    if (enPiezas) {
      const partes = l.split(/\s*[|;,\t]\s*|\s+x\s+|\s{2,}/i).map(x => x.trim()).filter(Boolean)
      const numeros = partes.map(x => (x.match(/^[\d.,]+/) || [])[0]).filter(Boolean)
      const tipo = (partes.find(x => /^[a-z]+$/i.test(x)) || 'CART').toUpperCase()
      if (numeros.length >= 5) {
        const [cantidad, largo, ancho, alto, peso_lb] = numeros.map(x => x.replace(',', '.'))
        piezas.push({ cantidad, tipo: ['CART','BOX','PALLET','BAG'].includes(tipo) ? tipo : 'OTRO', largo, ancho, alto, peso_lb })
      }
    }
  }
  let fecha = datos.fecha || ''
  const us = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (us) fecha = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  else fecha = (fecha.match(/\d{4}-\d{2}-\d{2}/) || [''])[0]
  const mod = sinTildes(datos.modalidad || '')
  return {
    guia: datos.wr || datos.recibo || datos.numero || datos.warehousereceipt || '',
    fecha_recibo: fecha,
    bodega: datos.bodega || '',
    referencia: datos.referencia || datos.reference || '',
    remitente: datos.remitente || datos.receivedfrom || '',
    consignatario: datos.consignatario || datos.receivedfor || '',
    descripcion: datos.descripcion || datos.description || '',
    modalidad: mod.startsWith('aer') || mod.startsWith('air') ? 'aereo' : mod ? 'maritimo' : '',
    flete: sinTildes(datos.flete || '').startsWith('pre') ? 'prepaid' : datos.flete ? 'collect' : '',
    piezas,
  }
}

// ── Nuevo recibo de bodega ─────────────────────────────────────────────────
const PIEZA_VACIA = { cantidad:'1', tipo:'CART', largo:'', ancho:'', alto:'', peso_lb:'' }

function ModalRecibo({ bodegas: bodegasIniciales, clientes: clientesIniciales, onCerrar, onGuardado }) {
  const [bodegas, setBodegas] = useState(bodegasIniciales)
  const [nuevaBod, setNuevaBod] = useState(null)          // { nombre, operador, usd, aiu } mientras se crea una bodega aquí
  const [clientes, setClientes] = useState(clientesIniciales)
  const [nuevoCli, setNuevoCli] = useState(null)          // nombre del cliente que se está creando aquí mismo
  const [f, setF] = useState({
    bodega_id: bodegas[0]?.id || '', guia:'', fecha_recibo: hoyISO(), cliente_id:'', referencia:'', seguimiento:'', remitente:'', consignatario:'',
    descripcion:'', categoria:'Perfumes', modalidad:'maritimo', flete:'collect', peso_cobrable_kg:'',
    aiu_lb_pieza: String(bodegas[0]?.aiu_lb_pieza ?? 2), trm:'',
    costo_valor:'', costo_moneda:'USD', costo_unidad:'kg',
    cobro_por:'kg', unidades:'', tarifa_cliente:'', notas:'',
  })
  const { escaleras, costos, listo: tarifasListas } = useTarifas()
  const [tarifaAuto, setTarifaAuto] = useState(true)     // la tarifa al cliente la pone la escalera hasta que la cambies a mano
  const [costoAuto, setCostoAuto] = useState(true)
  const divisas = useDivisas()
  const trmHoy = divisas?.find(d => d.id === 'USD')?.hoy
  useEffect(() => { if (trmHoy && !f.trm) setF(p => ({ ...p, trm: String(Math.round(trmHoy * 100) / 100) })) }, [trmHoy])
  const [piezas, setPiezas] = useState([{ ...PIEZA_VACIA }])
  const [pasarACaja, setPasarACaja] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  // AIU interno: solo perfumes, X lb por pieza. Va en el peso que se le cobra al cliente, nunca se le muestra.
  const tot = totalesPiezas(piezas)
  const conAiu = f.categoria === 'Perfumes'
  const aiuPieza = conAiu ? n2(f.aiu_lb_pieza) : 0
  const aiuLb = aiuPieza * tot.piezas
  const lbConAiu = tot.lb + aiuLb
  const kgCliente = f.peso_cobrable_kg !== '' ? n2(f.peso_cobrable_kg) : Math.round(lbConAiu * LB_A_KG * 10) / 10
  // Cuánto se cobra: por kg (con AIU), por lb o por unidad, según la escalera del cliente
  const cantCliente = f.cobro_por === 'unidad' ? n2(f.unidades) : f.cobro_por === 'lb' ? kgCliente / LB_A_KG : kgCliente
  const cobro = cantCliente * n2(f.tarifa_cliente)
  // Lo que te cobra la bodega: peso real (kg o lb) o unidades, en US$ o pesos
  const baseCosto = f.costo_unidad === 'unidad' ? n2(f.unidades) : f.costo_unidad === 'lb' ? tot.lb : tot.kg
  const costoMoneda = baseCosto * n2(f.costo_valor)
  const costo = f.costo_moneda === 'USD' ? costoMoneda * n2(f.trm) : costoMoneda
  const textoCosto = `${fmt(baseCosto)} ${f.costo_unidad === 'unidad' ? 'u' : f.costo_unidad + ' reales'} × ${f.costo_moneda === 'USD' ? 'US$' + fmt(f.costo_valor, 2) : cop(f.costo_valor)}${f.costo_moneda === 'USD' ? ` = US$${fmt(costoMoneda, 2)}` : ''}`

  // Precio del cliente según su escalera (la propia o la general) y el escalón que alcanza
  const cliSel = clientes.find(c => c.id === f.cliente_id)
  const { esc, fuente } = escaleraPara(cliSel, escaleras, f.categoria)
  const cantEsc = esc.unidad === 'unidad' ? n2(f.unidades) : esc.unidad === 'lb' ? kgCliente / LB_A_KG : kgCliente
  const escalon = escalonDe(esc, cantEsc)
  const precioEsc = esc.moneda === 'USD' ? escalon.precio * n2(f.trm) : escalon.precio
  useEffect(() => {
    if (!tarifasListas || !tarifaAuto) return
    setF(p => ({ ...p, cobro_por: esc.unidad, tarifa_cliente: precioEsc ? String(Math.round(precioEsc)) : (cliSel?.tarifa_kg ? String(cliSel.tarifa_kg) : p.tarifa_cliente) }))
  }, [tarifasListas, tarifaAuto, f.cliente_id, f.categoria, esc, escalon?.precio, precioEsc])
  const bodegaSel = bodegas.find(b => b.id === f.bodega_id)
  useEffect(() => {
    if (!tarifasListas || !costoAuto) return
    const c = costoPara(costos, bodegaSel, f.categoria)
    setF(p => ({ ...p, costo_valor: String(c.valor || ''), costo_moneda: c.moneda, costo_unidad: c.unidad }))
  }, [tarifasListas, costoAuto, f.bodega_id, f.categoria, costos])

  // La referencia es el nombre que trae el recibo (quien envía). NO es el cliente LRM: ese se elige a mano.
  const alCambiarReferencia = (e) => setF(p => ({ ...p, referencia: e.target.value }))
  const alCambiarCliente = (e) => {
    const cli = clientes.find(c => c.id === e.target.value)
    const categoria = nichoPrincipal(cli, NICHOS_LRM) || f.categoria
    setTarifaAuto(true)
    setF(p => ({ ...p, cliente_id: e.target.value, categoria }))
  }
  const alCambiarBodega = (e) => {
    const b = bodegas.find(x => x.id === e.target.value)
    setCostoAuto(true)
    setF(p => ({ ...p, bodega_id: e.target.value, aiu_lb_pieza: String(b?.aiu_lb_pieza ?? p.aiu_lb_pieza) }))
  }
  const crearBodega = async () => {
    if (!nuevaBod?.nombre.trim()) return
    const { data, error: e } = await supabase.from('lrm_bodegas').insert({
      nombre: nuevaBod.nombre.trim(), operador: nuevaBod.operador.trim() || nuevaBod.nombre.trim(),
      tarifas_usd: { Perfumes: n2(nuevaBod.usd) }, aiu_lb_pieza: n2(nuevaBod.aiu),
    }).select().single()
    if (e) return setError('No se pudo crear la bodega: ' + e.message)
    setBodegas(prev => [...prev, data])
    setF(p => ({ ...p, bodega_id: data.id, aiu_lb_pieza: String(data.aiu_lb_pieza ?? p.aiu_lb_pieza) }))
    setNuevaBod(null)
  }
  const crearCliente = async () => {
    if (!nuevoCli?.trim()) return
    const { data, error: e } = await supabase.from('lrm_clientes').insert({ nombre: nuevoCli.trim(), nicho: f.categoria, estado:'activo', tarifa_kg: n2(f.tarifa_cliente) }).select().single()
    if (e) return setError('No se pudo crear el cliente: ' + e.message)
    setClientes(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setF(p => ({ ...p, cliente_id: data.id })); setNuevoCli(null)
  }
  const setPieza = (i, k) => e => setPiezas(prev => prev.map((p, j) => j === i ? { ...p, [k]: e.target.value } : p))
  const [bloque, setBloque] = useState('')
  const [aviso, setAviso] = useState('')
  const llenarDesdeBloque = () => {
    const d = leerBloqueRecibo(bloque)
    if (!d.guia && d.piezas.length === 0) return setAviso('No reconocí el formato. Pega el bloque tal cual te lo entregó Claude.')
    const bod = d.bodega && bodegas.find(b => sinTildes(b.nombre).includes(sinTildes(d.bodega)) || sinTildes(d.bodega).includes(sinTildes(b.nombre)))
    setF(p => ({
      ...p,
      ...(d.guia && { guia: d.guia }), ...(d.fecha_recibo && { fecha_recibo: d.fecha_recibo }),
      ...(d.referencia && { referencia: d.referencia }), ...(d.remitente && { remitente: d.remitente }),
      ...(d.consignatario && { consignatario: d.consignatario }), ...(d.descripcion && { descripcion: limpiarDescripcion(d.descripcion) }),
      ...(d.modalidad && { modalidad: d.modalidad }), ...(d.flete && { flete: d.flete }),
      ...(bod && { bodega_id: bod.id, aiu_lb_pieza: String(bod.aiu_lb_pieza ?? p.aiu_lb_pieza) }),
    }))
    if (d.piezas.length) setPiezas(d.piezas)
    if (d.bodega && !bod) setNuevaBod({ nombre: d.bodega, operador:'', usd:'5', aiu:'2' })   // la bodega del recibo no existe: se propone crearla
    setAviso(`Listo: ${d.piezas.length} renglón(es) de piezas. Ahora elige tu cliente LRM (quien te paga) y revisa los totales contra el papel.`)
    setBloque('')
  }

  const guardar = async () => {
    if (!f.guia.trim()) return setError('Escribe el número del recibo (WR).')
    if (!f.bodega_id) return setError('Elige la bodega.')
    if (tot.piezas === 0) return setError('Agrega al menos una pieza.')
    if (!f.cliente_id) return setError('Elige o crea el cliente LRM antes de guardar.')
    if ((f.cobro_por === 'unidad' || f.costo_unidad === 'unidad') && !n2(f.unidades)) return setError('Escribe cuántas unidades trae la carga.')
    setGuardando(true)
    const bodega = bodegas.find(b => b.id === f.bodega_id)
    const { data: carga, error: e } = await supabase.from('lrm_cargas').insert({
      guia: f.guia.trim(), bodega_id: f.bodega_id, fecha_recibo: f.fecha_recibo, cliente_id: f.cliente_id || null,
      referencia: f.referencia || null, seguimiento: f.seguimiento.trim() || null, remitente: f.remitente || null, consignatario: f.consignatario || null,
      descripcion: f.descripcion || null, categoria: f.categoria, modalidad: f.modalidad, flete: f.flete,
      proveedor: bodega?.operador || bodega?.nombre, origen: bodega?.ciudad || null,
      piezas: tot.piezas, libras: Math.round(tot.lb * 100) / 100, peso_kg: Math.round(tot.kg * 10) / 10,
      pies3: Math.round(tot.pies3 * 1000) / 1000, cbm: Math.round(tot.m3 * 1000) / 1000,
      aiu_lb: aiuLb, libras_aiu: Math.round(lbConAiu * 100) / 100, peso_cobrable_kg: kgCliente,
      tarifa_cliente: n2(f.tarifa_cliente), trm: n2(f.trm),
      tarifa_costo_usd: f.costo_moneda === 'USD' && f.costo_unidad === 'kg' ? n2(f.costo_valor) : null,
      tarifa_costo: Math.round(costo / Math.max(kgCliente, 0.0001)),
      cobro_por: f.cobro_por, unidades: n2(f.unidades) || null, costo_total: Math.round(costo),
      etapa:'bodega', facturada: pasarACaja && (cobro > 0 || costo > 0), notas: f.notas || null,
    }).select().single()
    if (e) { setGuardando(false); return setError('No se pudo guardar: ' + e.message) }

    await supabase.from('lrm_carga_piezas').insert(piezas.filter(p => n2(p.cantidad) > 0).map(p => ({
      carga_id: carga.id, cantidad: n2(p.cantidad), tipo: p.tipo || 'CART', largo: n2(p.largo), ancho: n2(p.ancho), alto: n2(p.alto),
      peso_lb: n2(p.peso_lb), pies3: Math.round(pies3Pieza(p) * 1000) / 1000,
    })))
    await supabase.from('lrm_carga_eventos').insert({ carga_id: carga.id, etapa:'bodega', nota:`Recibida en ${bodega?.nombre || 'bodega'}` })

    // Pasa a Caja: cuenta de cobro al cliente y factura del proveedor
    if (pasarACaja && (cobro > 0 || costo > 0)) {
      const ref = `WR ${f.guia.trim()}`
      // Nota para el cliente: solo kilos × tarifa (el AIU no se menciona)
      const movs = [{ tipo:'cobro_cliente', concepto:'flete', cliente_id: f.cliente_id || null, carga_id: carga.id, monto: Math.round(cobro), fecha: hoyISO(), referencia: ref, notas: `${fmt(cantCliente)} ${UNIDAD_CORTA[f.cobro_por]} × ${cop(f.tarifa_cliente)}` }]
      if (costo > 0) movs.push({ tipo:'costo_proveedor', concepto:'flete', proveedor: bodega?.operador || bodega?.nombre, carga_id: carga.id, monto: Math.round(costo), fecha: hoyISO(), referencia: ref, notas: `${textoCosto}${f.costo_moneda === 'USD' ? ` · TRM ${fmt(f.trm, 2)}` : ''}` })
      await supabase.from('lrm_movimientos').insert(movs)
    }
    setGuardando(false); onGuardado(carga)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:760, border:'1px solid var(--border)', maxHeight:'94vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>Recibo de bodega</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Pega el bloque que te entrega Claude con la foto del recibo, o llénalo a mano.</div>
        <div style={{ padding:12, borderRadius:10, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 }}>📋 Pegar datos del recibo</div>
          <textarea id="wr-bloque" value={bloque} onChange={e => setBloque(e.target.value)} placeholder={'WR: 191360\nFecha: 9/10/2026\nReferencia: MOHAMED ANKA / 608\n…\nPiezas:\n4 | CART | 24 | 18 | 13 | 48'}
            style={{ ...iStyle, minHeight:70, resize:'vertical', fontFamily:'ui-monospace, Menlo, monospace', fontSize:12 }} />
          <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:8, flexWrap:'wrap' }}>
            <button id="wr-llenar" onClick={llenarDesdeBloque} disabled={!bloque.trim()} className="btn-gold" style={{ fontSize:12 }}>Llenar formulario</button>
            {aviso && <span style={{ fontSize:11, color:'var(--text2)' }}>{aviso}</span>}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap:10, marginBottom:10 }}>
          <div><Etiqueta>Bodega</Etiqueta>
            <div style={{ display:'flex', gap:6 }}>
              <select id="wr-bodega" value={f.bodega_id} onChange={alCambiarBodega} style={{ ...iStyle, borderColor: f.bodega_id ? 'var(--border)' : 'rgba(232,162,58,0.6)' }}>
                <option value="">Elegir bodega…</option>
                {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
              <button type="button" onClick={() => setNuevaBod({ nombre:'', operador:'', usd:'5', aiu:'2' })} className="btn" style={{ marginTop:4, fontSize:11 }} title="Crear bodega">+</button>
            </div>
            {!f.bodega_id && <div style={{ fontSize:10, marginTop:3, color:'#E8A23A' }}>{bodegas.length ? 'Elige la bodega.' : 'No hay bodegas: créala con +'}</div>}
          </div>
          <div><Etiqueta>N.º recibo (WR)</Etiqueta><input id="wr-numero" value={f.guia} onChange={set('guia')} placeholder="191360" style={iStyle} autoFocus /></div>
          <div><Etiqueta>Fecha</Etiqueta><input type="date" value={f.fecha_recibo} onChange={set('fecha_recibo')} style={iStyle} /></div>
          <div><Etiqueta>Modalidad</Etiqueta><select value={f.modalidad} onChange={set('modalidad')} style={iStyle}><option value="maritimo">Marítimo (Ocean)</option><option value="aereo">Aéreo (Air)</option></select></div>
        </div>
        {nuevaBod && (
          <div style={{ padding:12, borderRadius:10, background:'var(--bg4)', border:'1px solid var(--gold-border)', marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:6 }}>Nueva bodega</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:8 }}>
              <div><Etiqueta>Nombre</Etiqueta><input id="wr-bod-nombre" value={nuevaBod.nombre} onChange={e => setNuevaBod(p => ({ ...p, nombre:e.target.value }))} placeholder="Ej: RD Star 1" style={iStyle} autoFocus /></div>
              <div><Etiqueta>A quién se le paga</Etiqueta><input value={nuevaBod.operador} onChange={e => setNuevaBod(p => ({ ...p, operador:e.target.value }))} placeholder="Ej: RD Star - Ok Cargo" style={iStyle} /></div>
              <div><Etiqueta>Costo perfumes (US$/kg)</Etiqueta><input inputMode="decimal" value={nuevaBod.usd} onChange={e => setNuevaBod(p => ({ ...p, usd:e.target.value }))} style={iStyle} /></div>
              <div><Etiqueta>AIU (lb por caja)</Etiqueta><input inputMode="decimal" value={nuevaBod.aiu} onChange={e => setNuevaBod(p => ({ ...p, aiu:e.target.value }))} style={iStyle} /></div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button type="button" onClick={crearBodega} disabled={!nuevaBod.nombre.trim()} className="btn-gold" style={{ fontSize:12 }}>Crear bodega</button>
              <button type="button" onClick={() => setNuevaBod(null)} className="btn" style={{ fontSize:12 }}>Cancelar</button>
              <span style={{ fontSize:11, color:'var(--text3)', alignSelf:'center' }}>Dirección y teléfono los completas luego en ⚙ Bodegas.</span>
            </div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap:10, marginBottom:10 }}>
          <div><Etiqueta>Nombre en el recibo (Reference)</Etiqueta><input id="wr-referencia" value={f.referencia} onChange={alCambiarReferencia} placeholder="MOHAMED ANKA / 608" style={iStyle} /></div>
          <div><Etiqueta>Seguimiento (nombre tuyo para esta carga)</Etiqueta><input id="wr-seguimiento" value={f.seguimiento} onChange={set('seguimiento')} placeholder="Ej: Andrés · perfumes pedido 3" style={iStyle} /></div>
          <div><Etiqueta>Cliente LRM · quien te paga</Etiqueta>
            {nuevoCli === null ? (
              <div style={{ display:'flex', gap:6 }}>
                <select id="wr-cliente" value={f.cliente_id} onChange={alCambiarCliente} style={{ ...iStyle, borderColor: f.cliente_id ? 'var(--border)' : 'rgba(232,162,58,0.6)' }}>
                  <option value="">Elegir cliente…</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.codigo ? ` · ${c.codigo}` : ''}</option>)}
                </select>
                <button type="button" onClick={() => setNuevoCli('')} className="btn" style={{ marginTop:4, whiteSpace:'nowrap', fontSize:11 }}>+ Nuevo</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:6 }}>
                <input id="wr-nuevo-cliente" value={nuevoCli} onChange={e => setNuevoCli(e.target.value)} placeholder="Nombre del cliente" style={iStyle} autoFocus />
                <button type="button" onClick={crearCliente} className="btn-gold" style={{ marginTop:4, fontSize:11 }}>Crear</button>
                <button type="button" onClick={() => setNuevoCli(null)} className="btn" style={{ marginTop:4, fontSize:11 }}>✕</button>
              </div>
            )}
            <div style={{ fontSize:10, marginTop:3, color: f.cliente_id ? 'var(--green)' : '#E8A23A' }}>
              {f.cliente_id ? '✓ A este cliente le sale la cuenta de cobro y los avisos.' : 'Elige quién te paga (ej. Andrés Restrepo) o créalo con + Nuevo.'}
            </div>
          </div>
          <div><Etiqueta>Remitente (Received from)</Etiqueta><input id="wr-remitente" value={f.remitente} onChange={set('remitente')} placeholder="ORIENTAL AROMA PERFUMERIA" style={iStyle} /></div>
          <div><Etiqueta>Consignatario (Received for)</Etiqueta><input value={f.consignatario} onChange={set('consignatario')} placeholder="SPC SERVICIOS LOGISTICOS SAS" style={iStyle} /></div>
          <div><Etiqueta>Descripción</Etiqueta><input id="wr-descripcion" value={f.descripcion} onChange={set('descripcion')} onBlur={() => setF(p => ({ ...p, descripcion: limpiarDescripcion(p.descripcion) }))} placeholder="6 cajas con perfumes" style={iStyle} /></div>
          <div className="grid-2" style={{ gap:10 }}>
            <div><Etiqueta>Categoría</Etiqueta><select id="wr-categoria" value={f.categoria} onChange={e => { const categoria = e.target.value; setTarifaAuto(true); setCostoAuto(true); setF(p => ({ ...p, categoria })) }} style={iStyle}>{NICHOS_LRM.map(n => <option key={n}>{n}</option>)}</select></div>
            <div><Etiqueta>Flete</Etiqueta><select value={f.flete} onChange={set('flete')} style={iStyle}><option value="collect">Collect</option><option value="prepaid">Prepaid</option></select></div>
          </div>
        </div>

        {/* Piezas */}
        <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', margin:'16px 0 6px' }}>Piezas <span style={{ fontWeight:400, color:'var(--text3)' }}>· medidas en pulgadas, peso por pieza en libras</span></div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:560 }}>
            <thead><tr style={{ color:'var(--text3)', textAlign:'left' }}>
              {['Cant.','Tipo','Largo','Ancho','Alto','Peso lb', ...(conAiu ? ['+ AIU'] : []),'ft³ c/u',''].map(h => <th key={h} style={{ fontWeight:500, padding:'4px 4px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {piezas.map((p, i) => (
                <tr key={i}>
                  {['cantidad','tipo','largo','ancho','alto','peso_lb'].map(k => (
                    <td key={k} style={{ padding:'2px 4px' }}>
                      {k === 'tipo'
                        ? <select value={p.tipo} onChange={setPieza(i, k)} style={{ ...iStyle, marginTop:0, padding:'6px', minWidth:84 }}>{['CART','BOX','PALLET','BAG','OTRO'].map(t => <option key={t}>{t}</option>)}</select>
                        : <input className={`wr-pieza-${k}`} inputMode="decimal" value={p[k]} onChange={setPieza(i, k)} style={{ ...iStyle, marginTop:0, padding:'6px' }} />}
                    </td>
                  ))}
                  {conAiu && <td style={{ padding:'2px 6px', color:'#E8A23A', whiteSpace:'nowrap', fontSize:11 }}>+{fmt(aiuPieza)} = {fmt(n2(p.peso_lb) + aiuPieza)}</td>}
                  <td style={{ padding:'2px 6px', color:'var(--text2)' }}>{fmt(pies3Pieza(p), 3)}</td>
                  <td>{piezas.length > 1 && <button onClick={() => setPiezas(prev => prev.filter((_, j) => j !== i))} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button id="wr-agregar-pieza" onClick={() => setPiezas(prev => [...prev, { ...PIEZA_VACIA }])} className="btn" style={{ fontSize:11, marginTop:6 }}>+ Pieza</button>

        {/* Totales como en el recibo */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100px, 100%), 1fr))', gap:8, margin:'14px 0' }}>
          {[['Piezas', fmt(tot.piezas, 0)], ['Libras', fmt(tot.lb, 1)], ['Kilos', fmt(tot.kg, 1)], ['Pies³', fmt(tot.pies3, 3)], ['m³', fmt(tot.m3, 3)], ...(conAiu ? [['Lb + AIU', fmt(lbConAiu, 1)], ['Kg + AIU', fmt(lbConAiu * LB_A_KG, 1)]] : [])].map(([l, v]) => (
            <div key={l} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg4)' }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Costo (bodega, peso real en US$) y cobro (cliente, peso con AIU interno) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:10, marginBottom:10 }}>
          {conAiu && <div><Etiqueta>AIU interno (lb por pieza)</Etiqueta><input id="wr-aiu" inputMode="decimal" value={f.aiu_lb_pieza} onChange={set('aiu_lb_pieza')} style={iStyle} /></div>}
          {(f.cobro_por === 'unidad' || f.costo_unidad === 'unidad') && <div><Etiqueta>Unidades en la carga</Etiqueta><input id="wr-unidades" inputMode="numeric" value={f.unidades} onChange={set('unidades')} placeholder="60" style={{ ...iStyle, borderColor: n2(f.unidades) ? 'var(--border)' : 'rgba(232,162,58,0.6)' }} /></div>}
          <div><Etiqueta>Costo bodega ({f.costo_moneda === 'USD' ? 'US$' : '$'}/{UNIDAD_CORTA[f.costo_unidad]})</Etiqueta><input id="wr-costo-usd" inputMode="decimal" value={f.costo_valor} onChange={e => { setCostoAuto(false); setF(p => ({ ...p, costo_valor: e.target.value })) }} placeholder="5" style={iStyle} /></div>
          <div><Etiqueta>TRM</Etiqueta><input id="wr-trm" inputMode="decimal" value={f.trm} onChange={set('trm')} placeholder="3326.96" style={iStyle} /></div>
          {f.cobro_por !== 'unidad' && <div><Etiqueta>Kg al cliente</Etiqueta><input id="wr-cobrable" inputMode="decimal" value={f.peso_cobrable_kg} onChange={set('peso_cobrable_kg')} placeholder={fmt(lbConAiu * LB_A_KG)} style={iStyle} /></div>}
          <div><Etiqueta>Le cobras (COP/{UNIDAD_CORTA[f.cobro_por]})</Etiqueta><input id="wr-tarifa-cliente" inputMode="numeric" value={f.tarifa_cliente} onChange={e => { setTarifaAuto(false); setF(p => ({ ...p, tarifa_cliente: e.target.value })) }} placeholder="20000" style={iStyle} /></div>
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <span>{tarifaAuto
            ? <>Precio {fuente === 'cliente' ? <b style={{ color:'var(--gold)' }}>de {cliSel?.nombre}</b> : 'general'} · {f.categoria} · escalón {tramoTexto(esc, escalon)} {UNIDAD_CORTA[esc.unidad]}</>
            : <>Precio puesto a mano</>}</span>
          {!tarifaAuto && <button type="button" onClick={() => setTarifaAuto(true)} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto' }}>↺ Usar la escalera</button>}
          {!costoAuto && <button type="button" onClick={() => setCostoAuto(true)} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto' }}>↺ Costo de la tabla</button>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:8, padding:'12px 14px', borderRadius:10, background:'var(--bg4)', marginBottom:12, fontSize:12, color:'var(--text2)' }}>
          <div>Costo bodega <b style={{ color:'var(--red)', fontSize:14 }}>{cop(costo)}</b><div style={{ fontSize:11, color:'var(--text3)' }}>{textoCosto}</div></div>
          <div>Cobro al cliente <b style={{ color:'var(--gold)', fontSize:14 }}>{cop(cobro)}</b><div style={{ fontSize:11, color:'var(--text3)' }}>{fmt(cantCliente)} {UNIDAD_CORTA[f.cobro_por]} × {cop(f.tarifa_cliente)}</div></div>
          <div>Margen <b style={{ color:'var(--green)', fontSize:14 }}>{cop(cobro - costo)}</b>{conAiu && aiuLb > 0 && <div style={{ fontSize:11, color:'#E8A23A' }}>incluye AIU interno: {fmt(aiuLb)} lb ({fmt(aiuLb * LB_A_KG)} kg)</div>}</div>
        </div>
        <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--text2)', marginBottom:12, cursor:'pointer' }}>
          <input type="checkbox" checked={pasarACaja} onChange={e => setPasarACaja(e.target.checked)} />
          Crear en Caja la cuenta de cobro al cliente y la factura del proveedor
        </label>
        <div style={{ marginBottom:14 }}><Etiqueta>Notas</Etiqueta><input value={f.notas} onChange={set('notas')} style={iStyle} /></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button id="wr-guardar" onClick={guardar} disabled={guardando} className="btn-green" style={{ flex:1 }}>{guardando ? 'Guardando…' : 'Guardar recibo'}</button>
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Detalle: piezas, trazabilidad y borrar ─────────────────────────────────
function ModalDetalle({ carga, cliente, clienteFicha, bodega, onAvanzar, onAvisar, onCerrar, onCambio }) {
  const [verCuenta, setVerCuenta] = useState(!!carga._cuenta)
  const [piezas, setPiezas] = useState([])
  const [eventos, setEventos] = useState([])
  const [confirmar, setConfirmar] = useState(false)
  useEffect(() => {
    supabase.from('lrm_carga_piezas').select('*').eq('carga_id', carga.id).then(r => setPiezas(r.data || []))
    supabase.from('lrm_carga_eventos').select('*').eq('carga_id', carga.id).order('fecha').then(r => setEventos(r.data || []))
  }, [carga.id])
  const ant = anterior(carga.etapa), sig = siguiente(carga.etapa)

  const retroceder = async () => {
    await supabase.from('lrm_cargas').update({ etapa: ant.id }).eq('id', carga.id)
    await supabase.from('lrm_carga_eventos').insert({ carga_id: carga.id, etapa: ant.id, nota:'Corrección: se devolvió de etapa' })
    onCambio()
  }
  const borrar = async () => {
    if (!confirmar) return setConfirmar(true)
    await supabase.from('lrm_movimientos').delete().eq('carga_id', carga.id)
    await supabase.from('lrm_cargas').delete().eq('id', carga.id)
    onCambio()
  }

  if (verCuenta) return <CuentaCobro carga={carga} onVolver={() => setVerCuenta(false)} onCerrar={onCerrar} />
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:620, border:'1px solid var(--border)', maxHeight:'94vh', overflowY:'auto' }}>
        <div style={{ fontSize:11, color:'var(--text3)' }}>Orden #{carga.orden} · {bodega?.nombre}</div>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>WR {carga.guia} · {cliente || carga.referencia || 'Sin cliente'}</div>
        {carga.seguimiento && <div style={{ fontSize:13, color:'var(--gold)', marginTop:2 }}>📌 {carga.seguimiento}</div>}
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>{[carga.referencia && `Casillero ${carga.referencia}`, carga.descripcion, carga.remitente && `de ${carga.remitente}`, carga.consignatario && `para ${carga.consignatario}`].filter(Boolean).join(' · ')}</div>

        <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Piezas</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:6 }}>
          <thead><tr style={{ color:'var(--text3)', textAlign:'left' }}>{['Cant.','Tipo','Medidas (in)','Peso c/u','ft³ c/u'].map(h => <th key={h} style={{ fontWeight:500, padding:4 }}>{h}</th>)}</tr></thead>
          <tbody>{piezas.map(p => (
            <tr key={p.id} style={{ color:'var(--text2)', borderTop:'1px solid var(--border)' }}>
              <td style={{ padding:4 }}>{p.cantidad}</td><td style={{ padding:4 }}>{p.tipo}</td>
              <td style={{ padding:4 }}>{fmt(p.largo, 1)} × {fmt(p.ancho, 1)} × {fmt(p.alto, 1)}</td>
              <td style={{ padding:4 }}>{fmt(p.peso_lb, 1)} lb</td><td style={{ padding:4 }}>{fmt(p.pies3, 3)}</td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Total: {carga.piezas} pzs · {fmt(carga.libras, 0)} lb · {fmt(carga.peso_kg)} kg · {fmt(carga.pies3, 3)} ft³ · {fmt(carga.cbm, 3)} m³ · al cliente {carga.cobro_por === 'unidad' ? `${fmt(carga.unidades, 0)} unidades` : `${fmt(carga.peso_cobrable_kg)} kg`}{carga.aiu_lb ? ` (AIU interno ${fmt(carga.aiu_lb)} lb)` : ''}{carga.tarifa_costo_usd ? ` · costo US$${fmt(carga.tarifa_costo_usd, 2)}/kg, TRM ${fmt(carga.trm, 2)}` : ''}</div>

        <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Trazabilidad</div>
        <div style={{ borderLeft:'2px solid var(--border2)', marginLeft:6, paddingLeft:14, marginBottom:14 }}>
          {eventos.map(ev => {
            const e = etapaDe(ev.etapa)
            return (
              <div key={ev.id} style={{ position:'relative', marginBottom:10 }}>
                <div style={{ position:'absolute', left:-20, top:4, width:10, height:10, borderRadius:'50%', background:e.color }} />
                <div style={{ fontSize:13, fontWeight:700, color:e.color }}>{e.label}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{new Date(ev.fecha).toLocaleString('es-CO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}{ev.nota ? ` · ${ev.nota}` : ''}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => setVerCuenta(true)} className="btn-gold">🧾 Generar cuenta de cobro</button>
          <button onClick={() => onAvisar(carga)} className="btn">📣 Avisar al cliente</button>
          {sig && <button onClick={async () => { await onAvanzar(carga, sig.id); onCambio() }} className="btn">→ {sig.label}</button>}
          {ant && <button onClick={retroceder} className="btn">← Devolver a {ant.label}</button>}
          <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ color:'var(--red)', borderColor:'rgba(224,82,82,0.4)' }}>
            {confirmar ? '¿Seguro? Se borra con su cobro y costo' : 'Borrar carga'}
          </button>
          <button onClick={onCerrar} className="btn" style={{ marginLeft:'auto' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ── Bodegas ───────────────────────────────────────────────────────────────
const BODEGA_VACIA = { nombre:'', operador:'', pais:'Estados Unidos', ciudad:'', direccion:'', telefono:'', email:'', usd_perfumes:'5', aiu_lb_pieza:'2', tarifas_usd:{} }
function ModalBodegas({ bodegas, onCerrar, onCambio }) {
  const [editando, setEditando] = useState(null)
  const guardar = async () => {
    const d = { ...editando, aiu_lb_pieza: n2(editando.aiu_lb_pieza), tarifas_usd: { ...(editando.tarifas_usd || {}), Perfumes: n2(editando.usd_perfumes) } }
    delete d.usd_perfumes; delete d.tarifa_costo
    delete d.id; delete d.created_at
    if (editando.id) await supabase.from('lrm_bodegas').update(d).eq('id', editando.id)
    else await supabase.from('lrm_bodegas').insert(d)
    setEditando(null); onCambio()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:'1px solid var(--border)', maxHeight:'94vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:14 }}>Bodegas</div>
        {!editando ? (
          <>
            {bodegas.map(b => (
              <div key={b.id} onClick={() => setEditando({ ...b, usd_perfumes: String(usdDe(b, 'Perfumes') || ''), aiu_lb_pieza: String(b.aiu_lb_pieza ?? 2) })} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg4)', marginBottom:6, cursor:'pointer', opacity: b.activa ? 1 : 0.5 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{b.nombre}{!b.activa && ' (archivada)'}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{[b.operador, b.ciudad, b.pais, usdDe(b, 'Perfumes') && `perfumes US$${usdDe(b, 'Perfumes')}/kg`, b.aiu_lb_pieza && `AIU ${b.aiu_lb_pieza} lb/pza`].filter(Boolean).join(' · ')}</div>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={() => setEditando({ ...BODEGA_VACIA })} className="btn-gold">+ Bodega</button>
              <button onClick={onCerrar} className="btn" style={{ marginLeft:'auto' }}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            {[['nombre','Nombre','Ej: Bodega Panamá'],['operador','A quién se le paga','Ej: RD Star - Ok Cargo'],['pais','País',''],['ciudad','Ciudad',''],['direccion','Dirección',''],['telefono','Teléfono',''],['email','Correo',''],['usd_perfumes','Costo perfumes (US$ por kg)','5'],['aiu_lb_pieza','AIU interno perfumes (lb por pieza)','2']].map(([k, l, ph]) => (
              <div key={k} style={{ marginBottom:8 }}><Etiqueta>{l}</Etiqueta><input value={editando[k] ?? ''} onChange={e => setEditando(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={iStyle} /></div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={guardar} disabled={!editando.nombre?.trim()} className="btn-green" style={{ flex:1 }}>Guardar</button>
              {editando.id && <button onClick={async () => { await supabase.from('lrm_bodegas').update({ activa: !editando.activa }).eq('id', editando.id); setEditando(null); onCambio() }} className="btn">{editando.activa ? 'Archivar' : 'Activar'}</button>}
              <button onClick={() => setEditando(null)} className="btn">Volver</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
// Pasa la descripción del recibo (en inglés y abreviada) a español claro:
// "6 CRTN CON PERFUMES" → "6 cajas con perfumes"
const DICCIONARIO = [
  [/\b(CRTNS?|CTNS?|CARTONS?|CARTS?|BOX(ES)?|BXS?|CAJAS?)\b/gi, 'cajas'], [/\b(PCS|PC|PIECES?|PZS?)\b/gi, 'piezas'],
  [/\b(PALLETS?|PLTS?)\b/gi, 'estibas'], [/\b(BAGS?)\b/gi, 'bolsas'], [/\bWITH\b/gi, 'con'], [/\bAND\b/gi, 'y'],
  [/\bPERF[UE]{1,3}M[EI]{0,2}S?\b/gi, 'perfumes'], [/\bFRAGRANCES?\b/gi, 'perfumes'], [/\bCOSMETICS?\b/gi, 'cosméticos'], [/\bMAKE ?UP\b/gi, 'maquillaje'],
  [/\b(CELL ?PHONES?|PHONES?|CELLULARS?)\b/gi, 'celulares'], [/\b(LAPTOPS?|COMPUTERS?)\b/gi, 'computadores'], [/\bTABLETS?\b/gi, 'tablets'],
  [/\bELECTRONICS?\b/gi, 'electrónica'], [/\bCLOTH(ES|ING)\b/gi, 'ropa'], [/\bSHOES?\b/gi, 'zapatos'], [/\b(AUTO )?PARTS?\b/gi, 'repuestos'],
  [/\bACCESSOR(Y|IES)\b/gi, 'accesorios'], [/\bGENERAL MERCHANDISE\b/gi, 'mercancía general'], [/\bTOYS?\b/gi, 'juguetes'],
]
export function limpiarDescripcion(txt) {
  let t = String(txt || '').trim()
  if (!t) return ''
  for (const [re, es] of DICCIONARIO) t = t.replace(re, es)
  t = t.toLowerCase().replace(/\s+/g, ' ')
  t = t.replace(/^1 cajas\b/, '1 caja').replace(/^1 piezas\b/, '1 pieza')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// ── Cuenta de cobro al cliente ─────────────────────────────────────────────
// Documento completo: empresa, cliente, datos de la carga, piezas, liquidación y medios de pago.
// El AIU no se nombra: va incluido en el peso de cada pieza que ve el cliente.
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))

// Cómo ve el cliente su mercancía: "Perfumes · 6 cajas" (no el texto en inglés del recibo)
export const mercanciaCliente = (carga) => carga.descripcion ? limpiarDescripcion(carga.descripcion)
  : `${carga.categoria && carga.categoria !== 'Otro' ? carga.categoria : 'Mercancía general'} · ${carga.piezas} ${Number(carga.piezas) === 1 ? 'caja' : 'cajas'}`

export function htmlCuentaCobro({ carga, piezas, cliente, bodega, empresa, medios, mercancia }) {
  mercancia = (mercancia || '').trim() || mercanciaCliente(carga)
  const numero = `LRM-${(carga.fecha_recibo || hoyISO()).slice(0, 4)}-${String(carga.orden || '').padStart(3, '0')}`
  const aiuPieza = n2(carga.piezas) ? n2(carga.aiu_lb) / n2(carga.piezas) : 0
  const kg = n2(carga.peso_cobrable_kg), tarifa = n2(carga.tarifa_cliente), total = Math.round(cobroCarga(carga))
  const cant = cantidadCobro(carga), uni = UNIDAD_CORTA[unidadCobro(carga)], uniLarga = unidadCobro(carga) === 'unidad' ? 'unidades' : uni
  const lbTotal = n2(carga.libras_aiu) || n2(carga.libras)
  const fechaHoy = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
  const modalidad = carga.modalidad === 'aereo' ? 'Aéreo' : 'Marítimo'
  const origen = origenDe(bodega)
  const ruta = `${origen} → Barranquilla`
  const filasPiezas = piezas.map(p => {
    const pesoUnit = n2(p.peso_lb) + aiuPieza
    return `<tr><td>${p.cantidad}</td><td>${p.tipo === 'CART' ? 'Caja' : esc(p.tipo)}</td><td class="n">${fmt(pesoUnit, 1)}</td><td class="n">${fmt(pesoUnit * n2(p.cantidad), 1)}</td></tr>`
  }).join('')
  const mediosOk = (medios || []).filter(m => String(m.detalle || '').trim())
  const dato = (l, v) => v ? `<div class="d"><span>${l}</span><b>${esc(v)}</b></div>` : ''
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cuenta de cobro ${numero}</title><style>
    @page{size:letter;margin:10mm}
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:18px;background:#fff;font-size:11px;line-height:1.35}
    .doc{max-width:780px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #C9A84C;padding-bottom:8px}
    .marca{font-size:18px;font-weight:800;color:#1b1b1b}.marca small{display:block;font-size:10px;font-weight:400;color:#777;margin-top:1px}
    .emp{font-size:10px;color:#555;line-height:1.45;margin-top:4px}.num{text-align:right}.num .t{font-size:9.5px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
    .num .n1{font-size:16px;font-weight:800;margin:1px 0 3px}.num div{font-size:10px;color:#555}
    h3{font-size:9.5px;letter-spacing:1.5px;color:#8a6d1f;margin:10px 0 4px;text-transform:uppercase}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.d{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dotted #ddd;padding:2px 0}.d span{color:#777}
    table{width:100%;border-collapse:collapse}th{background:#f6f1e3;text-align:left;font-size:9.5px;padding:4px 5px;color:#5a4a1a}td{padding:3px 5px;border-bottom:1px solid #eee}
    tr{page-break-inside:avoid}.n{text-align:right}.tot td{font-weight:700;background:#fafafa}.liq td{font-size:11.5px}
    .gran{font-size:15px;font-weight:800;text-align:right;padding:6px 5px;border-top:2px solid #1b1b1b}
    .cierre{page-break-inside:avoid;break-inside:avoid}
    .pago{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.m{border:1px solid #e5dcc3;border-radius:6px;padding:5px 8px}.m b{display:block;font-size:10.5px}.m span{color:#555;font-size:10px}
    .pie{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:10px}
    .cond{font-size:9.5px;color:#555;background:#faf7ee;border-radius:6px;padding:6px 10px;flex:1}.firma{font-size:10px;color:#555;text-align:center}.firma .l{border-top:1px solid #999;width:200px;padding-top:3px;margin-top:26px}
    @media print{body{padding:0}}</style></head><body><div class="doc">
    <div class="top"><div><div class="marca">${esc(empresa.nombre)}<small>${esc(empresa.lema)}</small></div>
      <div class="emp">${esc(empresa.responsable)} · ${esc(empresa.documento)}<br>${esc(empresa.ciudad)} · ${esc(empresa.whatsapp)} · ${esc(empresa.correo)}</div></div>
      <div class="num"><div class="t">CUENTA DE COBRO</div><div class="n1">${numero}</div><div>Fecha: ${fechaHoy}</div></div></div>
    <h3>Cliente</h3><div class="grid">${dato('Nombre', cliente?.nombre || '')}${dato('Empresa', cliente?.empresa)}${dato('Teléfono', cliente?.telefono)}</div>
    <h3>Servicio</h3><div class="grid">${dato('Servicio', 'Importación y entrega en Barranquilla')}${dato('Origen', origen)}
      ${dato('Modalidad', modalidad)}${dato('Mercancía', mercancia)}${dato('Ref. envío', 'WR ' + carga.guia)}${dato('Fecha de recepción', fechaCorta(carga.fecha_recibo) + ' ' + (carga.fecha_recibo || '').slice(0, 4))}</div>
    <h3>Detalle de la mercancía</h3><table><tr><th>Cant.</th><th>Empaque</th><th class="n">Peso c/u (lb)</th><th class="n">Peso total (lb)</th></tr>${filasPiezas}
      <tr class="tot"><td>${carga.piezas}</td><td>Total</td><td></td><td class="n">${fmt(lbTotal, 1)} lb · ${fmt(kg, 1)} kg</td></tr></table>
    <div class="cierre"><h3>Liquidación</h3><table class="liq"><tr><th>Concepto</th><th class="n">Cantidad</th><th class="n">Tarifa</th><th class="n">Valor</th></tr>
      <tr><td>Servicio de importación ${esc(ruta)} · ${modalidad.toLowerCase()}</td><td class="n">${fmt(cant, 1)} ${uniLarga}</td><td class="n">${cop(tarifa)} / ${uni}</td><td class="n">${cop(total)}</td></tr></table>
    <div class="gran">Total a pagar: ${cop(total)}</div>
    ${mediosOk.length ? `<h3>Medios de pago</h3><div class="pago">${mediosOk.map(m => `<div class="m"><b>${esc(m.tipo)}</b><span>${esc(m.detalle)}${m.titular ? '<br>' + esc(m.titular) : ''}</span></div>`).join('')}</div>` : ''}
    <div class="pie">${empresa.condiciones ? `<div class="cond"><b>Condiciones:</b> ${esc(empresa.condiciones)}</div>` : '<div></div>'}
    <div class="firma"><div class="l">${esc(empresa.responsable)}<br>${esc(empresa.nombre)}</div></div></div></div>
  </div></body></html>`

  const texto = [
    `*${empresa.nombre}* · Cuenta de cobro ${numero}`, `Fecha: ${fechaHoy}`, `Cliente: ${cliente?.nombre || ''}`, ``,
    `Servicio de importación ${ruta} (${modalidad.toLowerCase()})`, `Mercancía: ${mercancia}`,
    `${carga.piezas} cajas · ${fmt(lbTotal, 1)} lb · *${fmt(kg, 1)} kg*`, ``,
    `${fmt(cant, 1)} ${uniLarga} × ${cop(tarifa)} = *${cop(total)}*`, `*Total a pagar: ${cop(total)}*`, ``,
    ...(mediosOk.length ? ['*Medios de pago*', ...mediosOk.map(m => `• ${m.tipo}: ${m.detalle}${m.titular ? ' (' + m.titular + ')' : ''}`)] : []),
    ...(empresa.condiciones ? ['', empresa.condiciones] : []),
  ].join('\n')
  return { html, texto, numero, total }
}

export function CuentaCobro({ cargaId, carga: cargaInicial, onVolver, onCerrar }) {
  const { empresa, medios, cargado } = useDatosLRM()
  const [d, setD] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const id = cargaId || cargaInicial?.id
  useEffect(() => {
    (async () => {
      const { data: carga } = await supabase.from('lrm_cargas').select('*').eq('id', id).single()
      if (!carga) return setD({ error:true })
      const [pz, cl, bo] = await Promise.all([
        supabase.from('lrm_carga_piezas').select('*').eq('carga_id', id),
        carga.cliente_id ? supabase.from('lrm_clientes').select('*').eq('id', carga.cliente_id).single() : Promise.resolve({ data:null }),
        carga.bodega_id ? supabase.from('lrm_bodegas').select('*').eq('id', carga.bodega_id).single() : Promise.resolve({ data:null }),
      ])
      setD({ carga, piezas: pz.data || [], cliente: cl.data, bodega: bo.data })
    })()
  }, [id])

  const [mercancia, setMercancia] = useState('')
  useEffect(() => { if (d?.carga) setMercancia(m => m || mercanciaCliente(d.carga)) }, [d])
  const doc = d && !d.error && cargado ? htmlCuentaCobro({ ...d, empresa, medios, mercancia }) : null
  const copiar = async () => { try { await navigator.clipboard.writeText(doc.texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }
  const wa = doc && d.cliente?.telefono ? (linkWhatsApp(d.cliente.telefono, d.cliente.nombre) || '').replace(/text=.*$/, 'text=' + encodeURIComponent(doc.texto)) : null
  const imprimir = () => {
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(doc.html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:18, width:'100%', maxWidth:880, border:'1px solid var(--gold-border)', height:'94vh', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:3, color:'var(--gold)', fontWeight:700 }}>CUENTA DE COBRO</div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>{doc ? `${doc.numero} · ${cop(doc.total)}` : 'Cargando…'}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ color:'#25D366', borderColor:'rgba(37,211,102,0.4)', textDecoration:'none' }}>WhatsApp</a>}
            <button onClick={copiar} disabled={!doc} className="btn">{copiado ? '✓ Copiado' : 'Copiar texto'}</button>
            <button onClick={imprimir} disabled={!doc} className="btn-gold">Imprimir / PDF</button>
            {onVolver && <button onClick={onVolver} className="btn">Ver carga</button>}
            <button onClick={onCerrar} className="btn">Cerrar</button>
          </div>
        </div>
        {doc && (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Mercancía en la cuenta:</span>
            <input id="cc-mercancia" value={mercancia} onChange={e => setMercancia(e.target.value)} style={{ ...iStyle, marginTop:0, flex:1, minWidth:200, padding:'6px 10px' }} />
            <button onClick={() => setMercancia(mercanciaCliente(d.carga))} className="btn" style={{ fontSize:11 }}>Restablecer</button>
          </div>
        )}
        {d?.error ? <Vacio>No se encontró la carga.</Vacio>
          : doc ? <iframe title="Cuenta de cobro" srcDoc={doc.html} style={{ flex:1, width:'100%', border:'none', borderRadius:10, background:'#fff' }} />
          : <Vacio>Cargando…</Vacio>}
        <div style={{ fontSize:11, color:'var(--text4)' }}>Ya quedó en Caja como cuenta por cobrar. Medios de pago y datos de la empresa: LRM Trade → Ajustes.</div>
      </div>
    </div>
  )
}
// ── Aviso al cliente: mensaje listo para WhatsApp o correo según la etapa ───
export function ModalAviso({ carga, etapa, cliente, bodega, onCerrar }) {
  const { empresa } = useDatosLRM()
  const plantilla = AVISOS_LRM[etapa] || AVISOS_LRM.transito
  const kg = n2(carga.peso_cobrable_kg), total = Math.round(cobroCarga(carga))
  const vars = {
    nombre: (cliente?.nombre || '').split(' ')[0] || 'hola', mercancia: (carga.categoria && carga.categoria !== 'Otro' ? carga.categoria : 'mercancía').toLowerCase(),
    cajas: carga.piezas, origen: origenDe(bodega), dias: DIAS_TRANSITO[carga.modalidad] || 8, kg: fmt(kg, 1), total: cop(total), guia: carga.guia,
  }
  const llenar = t => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
  const [texto, setTexto] = useState(llenar(plantilla.texto) + `\n\n${empresa.nombre} · ${empresa.whatsapp}`)
  const [estado, setEstado] = useState('')
  const asunto = `${empresa.nombre} · ${plantilla.asunto} · Envío WR ${carga.guia}`
  const registrar = async (tipo) => { if (cliente?.id) await supabase.from('lrm_contactos').insert({ cliente_id: cliente.id, tipo, resumen: `${plantilla.asunto} (WR ${carga.guia})` }) }
  const wa = cliente?.telefono ? (linkWhatsApp(cliente.telefono, cliente.nombre) || '').replace(/text=.*$/, 'text=' + encodeURIComponent(texto)) : null
  const mail = cliente?.correo ? `mailto:${cliente.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}` : null
  const e = etapaDe(etapa)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:`1px solid ${e.color}66` }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:e.color }}>📣 AVISAR AL CLIENTE · {e.label.toUpperCase()}</div>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', margin:'4px 0 12px' }}>{cliente?.nombre || 'Carga sin cliente LRM'}</div>
        <textarea value={texto} onChange={ev => setTexto(ev.target.value)} style={{ width:'100%', minHeight:150, padding:12, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', lineHeight:1.5, resize:'vertical', outline:'none' }} />
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
          {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => { registrar('whatsapp'); setEstado('Abriendo WhatsApp…') }} className="btn" style={{ color:'#25D366', borderColor:'rgba(37,211,102,0.4)', textDecoration:'none' }}>WhatsApp</a>}
          {mail && <a href={mail} onClick={() => { registrar('correo'); setEstado('Abriendo el correo…') }} className="btn" style={{ textDecoration:'none' }}>Correo</a>}
          <button onClick={async () => { try { await navigator.clipboard.writeText(texto); setEstado('✓ Copiado') } catch {} }} className="btn">Copiar</button>
          <button onClick={onCerrar} className="btn" style={{ marginLeft:'auto' }}>{estado ? 'Listo' : 'Ahora no'}</button>
        </div>
        <div style={{ fontSize:11, color: estado ? 'var(--green)' : 'var(--text4)', marginTop:10 }}>
          {estado || (!wa && !mail ? 'Este cliente no tiene WhatsApp ni correo en su ficha (CRM). Puedes copiar el mensaje.' : 'Puedes editar el mensaje antes de enviarlo. Queda registrado en el CRM.')}
        </div>
      </div>
    </div>
  )
}