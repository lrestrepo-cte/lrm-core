// @ts-nocheck
// LRM Trade Consulting · Dashboard — lo primero que se ve al entrar a la empresa.
// Lee de Supabase: lrm_clientes, lrm_cargas, lrm_movimientos, lrm_contactos, lrm_temas, lrm_ajustes
// y (si existen) lrm_consolidados, lrm_consolidado_items, lrm_tarifas_flete, lrm_tarifas_terrestre
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { linkWhatsApp, hoyISO, fechaCorta } from './LRMClientes'
import { SECUENCIAS } from './marketingLRM'

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const millones = n => (n < 0 ? '−' : '') + '$' + (Math.abs(n || 0) / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'
const sumar = (arr) => arr.reduce((s, m) => s + Number(m.monto || 0), 0)
const diasDesde = (iso) => iso ? Math.round((new Date(hoyISO()) - new Date(iso)) / 86400000) : 0
const masDias = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

export const ETAPAS = [
  { id:'bodega',    label:'En bodega',       color:'#8A94A6' },
  { id:'transito',  label:'En tránsito',     color:'#378ADD' },
  { id:'aduana',    label:'Aduana',          color:'#E8A23A' },
  { id:'destino',   label:'En Barranquilla', color:'#C9A84C' },
  { id:'entregada', label:'Entregada',       color:'#4caf50' },
]
const EMBUDO = [
  { id:'prospecto',    label:'Prospectos',   color:'#8A94A6' },
  { id:'conversacion', label:'Conversación', color:'#378ADD' },
  { id:'propuesta',    label:'Propuesta',    color:'#E8A23A' },
  { id:'activo',       label:'Activos',      color:'#4caf50' },
]
const ICONO = { contactar:'📞', cobrar:'💵', pagar:'🧾', carga:'📦', consolidado:'🚢', novedad:'⚠️', tarifa:'🏷️', servicio:'🚚' }
const ESTADO_CONS = { abierto:{ l:'Recibiendo carga', c:'#4caf50' }, cerrado:{ l:'Cerrado', c:'#E8A23A' }, despachado:{ l:'En camino', c:'#378ADD' }, entregado:{ l:'Entregado', c:'#8A94A6' } }
const tarifaVencida = t => t.vigente_hasta && t.vigente_hasta < hoyISO()
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

// Saldo abierto aplicando los pagos a lo más viejo primero (FIFO)
function saldoFIFO(cargos, pagos) {
  let pagado = sumar(pagos)
  const ordenados = [...cargos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  let masViejo = null
  for (const c of ordenados) {
    const m = Number(c.monto || 0)
    if (pagado >= m) { pagado -= m; continue }
    if (!masViejo) masViejo = c
    pagado = 0
  }
  return { saldo: Math.max(0, sumar(cargos) - sumar(pagos)), masViejo }
}

function calcular({ clientes, cargas, movs, contactos, temas, ajustes, consolidados = [], itemsCons = [], tarifasAliados = [], servicios = [], lineasSrv = [] }) {
  const hoy = hoyISO()
  const mesActual = hoy.slice(0, 7)
  const cli = Object.fromEntries(clientes.map(c => [c.id, c]))
  const nombreCli = (id) => cli[id]?.nombre || 'Sin cliente'

  const idsCliente = [...new Set(movs.filter(m => m.cliente_id && (m.tipo === 'cobro_cliente' || m.tipo === 'abono_cliente')).map(m => m.cliente_id))]
  const cartera = idsCliente.map(id => {
    const r = saldoFIFO(movs.filter(m => m.cliente_id === id && m.tipo === 'cobro_cliente'), movs.filter(m => m.cliente_id === id && m.tipo === 'abono_cliente'))
    return { id, cliente: nombreCli(id), telefono: cli[id]?.telefono, saldo: r.saldo, dias: diasDesde(r.masViejo?.fecha), vence: r.masViejo?.vence, ref: r.masViejo?.referencia }
  }).filter(c => c.saldo > 0).sort((a, b) => b.dias - a.dias)

  const provs = [...new Set(movs.filter(m => m.proveedor && (m.tipo === 'costo_proveedor' || m.tipo === 'pago_proveedor')).map(m => m.proveedor))]
  const porPagar = provs.map(p => {
    const r = saldoFIFO(movs.filter(m => m.proveedor === p && m.tipo === 'costo_proveedor'), movs.filter(m => m.proveedor === p && m.tipo === 'pago_proveedor'))
    return { proveedor: p, saldo: r.saldo, vence: r.masViejo?.vence }
  }).filter(p => p.saldo > 0).sort((a, b) => (a.vence || '9999').localeCompare(b.vence || '9999'))

  const delMes = movs.filter(m => (m.fecha || '').startsWith(mesActual))
  const de = (tipo, concepto) => sumar(delMes.filter(m => m.tipo === tipo && (!concepto || m.concepto === concepto)))
  const mes = {
    honorarios:  de('cobro_cliente', 'honorario'),
    margenFlete: de('cobro_cliente', 'flete') - de('costo_proveedor', 'flete'),
    costos:      de('costo_proveedor', 'otro') + de('costo_proveedor', 'honorario') - de('cobro_cliente', 'otro'),
    gastos:      de('gasto'),
  }

  const vivos = clientes.filter(c => c.estado !== 'perdido')
  const embudo = Object.fromEntries(EMBUDO.map(e => {
    const lista = vivos.filter(c => c.estado === e.id)
    return [e.id, { n: lista.length, valor: lista.reduce((s, c) => s + Number(c.valor_mes || 0), 0) }]
  }))
  const proyeccion = {
    activos: embudo.activo.valor,
    propuestas: embudo.propuesta.valor,
    meta: Number(ajustes.find(a => a.clave === 'meta_mensual')?.valor || 0),
  }

  const hoyLista = []
  vivos.filter(c => c.fecha_accion && c.fecha_accion <= hoy).forEach(c => hoyLista.push({
    tipo:'contactar', quien:c.nombre, cliente_id:c.id, telefono:c.telefono,
    que: c.proxima_accion || 'Hacer seguimiento',
    // Si va en una secuencia de seguimiento, el WhatsApp sale con el mensaje de ese paso
    mensaje: SECUENCIAS[c.secuencia]?.pasos[c.secuencia_paso || 0]?.mensaje?.replace(/\{nombre\}/g, String(c.nombre || '').split(' ')[0]),
    alerta: c.fecha_accion < hoy, nota: c.fecha_accion < hoy ? `atrasado desde el ${fechaCorta(c.fecha_accion)}` : null,
  }))
  cartera.filter(c => c.vence && c.vence <= hoy).forEach(c => hoyLista.push({
    tipo:'cobrar', quien:c.cliente, cliente_id:c.id, telefono:c.telefono, monto:c.saldo,
    que: `Cobro${c.ref ? ' ' + c.ref : ''} vencido ${c.vence === hoy ? 'hoy' : 'hace ' + diasDesde(c.vence) + ' días'}`, alerta: c.vence < hoy,
  }))
  porPagar.filter(p => p.vence && p.vence <= masDias(hoy, 3)).forEach(p => hoyLista.push({
    tipo:'pagar', quien:p.proveedor, monto:p.saldo,
    que: p.vence < hoy ? `Pago vencido desde el ${fechaCorta(p.vence)}` : `Pagar antes del ${fechaCorta(p.vence)}`, alerta: p.vence < hoy,
  }))
  cargas.forEach(c => {
    if (c.etapa === 'destino') hoyLista.push({ tipo:'carga', quien:`Guía ${c.guia}`, que:`En Barranquilla — coordinar entrega a ${nombreCli(c.cliente_id)}` })
    else if (c.etapa !== 'entregada' && c.fecha_llegada_est && c.fecha_llegada_est < hoy)
      hoyLista.push({ tipo:'carga', quien:`Guía ${c.guia}`, que:`Debía llegar el ${fechaCorta(c.fecha_llegada_est)} — revisar con ${c.proveedor || 'el proveedor'}`, alerta:true })
  })
  // Consolidados: novedades, cierres de recepción, salidas, llegadas y facturación pendiente
  const activosCons = consolidados.filter(c => c.estado !== 'entregado')
  const consInfo = activosCons.map(c => {
    const its = itemsCons.filter(i => i.consolidado_id === c.id && i.estado !== 'cancelado')
    const facturado = sumar(movs.filter(m => m.consolidado_id === c.id && m.tipo === 'cobro_cliente'))
    const valor = its.reduce((s, i) => s + Number(i.cbm || 0) * Number(i.tarifa_m3 || 0) * (i.moneda === 'USD' && Number(i.tarifa_m3) < 10000 ? 0 : 1), 0)
    return { ...c, its, m3: its.reduce((s, i) => s + Number(i.cbm || 0), 0), clientes: new Set(its.map(i => i.cliente_id)).size,
      porLlegar: its.filter(i => i.estado === 'por_llegar').length, novedades: its.filter(i => i.estado === 'novedad'), facturado, valor }
  })
  consInfo.forEach(c => {
    const nom = c.nombre
    c.novedades.forEach(i => hoyLista.push({ tipo:'novedad', quien:`${nombreCli(i.cliente_id)} · ${nom}`, que:`Novedad: ${i.motivo || i.descripcion || 'revisar'}`, alerta:true, ir:'consolidador' }))
    if (c.estado === 'abierto' && c.fecha_cierre && c.fecha_cierre <= masDias(hoy, 2))
      hoyLista.push({ tipo:'consolidado', quien:nom, que:`${c.fecha_cierre < hoy ? 'Se pasó la fecha de recepción (' + fechaCorta(c.fecha_cierre) + ')' : 'Cierra recepción ' + (c.fecha_cierre === hoy ? 'hoy' : 'el ' + fechaCorta(c.fecha_cierre))}${c.porLlegar ? ` · ${c.porLlegar} carga${c.porLlegar === 1 ? '' : 's'} por llegar` : ''}`, alerta: c.fecha_cierre < hoy, ir:'consolidador' })
    if ((c.estado === 'abierto' || c.estado === 'cerrado') && c.etd && c.etd <= masDias(hoy, 5))
      hoyLista.push({ tipo:'consolidado', quien:nom, que: c.etd < hoy ? `Debía zarpar el ${fechaCorta(c.etd)}: confirma con el aliado y márcalo En camino` : `Zarpa el ${fechaCorta(c.etd)}`, alerta: c.etd < hoy, ir:'consolidador' })
    if (c.estado === 'despachado' && c.eta && c.eta <= masDias(hoy, 3))
      hoyLista.push({ tipo:'consolidado', quien:nom, que: c.eta < hoy ? `Debía llegar el ${fechaCorta(c.eta)}: revisar con el aliado` : `Llega el ${fechaCorta(c.eta)}: coordina entregas`, alerta: c.eta < hoy, ir:'consolidador' })
    if (c.estado !== 'abierto' && c.its.length && c.facturado < 1)
      hoyLista.push({ tipo:'cobrar', quien:nom, que:'Sin pasar a Caja: factúrale a los clientes', alerta:true, ir:'consolidador' })
  })
  // Servicios: lo de hoy y mañana, lo que falta programar, cotizaciones sin respuesta y saldos
  const srvCod = sv => `SRV-${String(sv.numero || '').padStart(4, '0')}`
  const totalSrv = id => lineasSrv.filter(l => l.servicio_id === id).reduce((t, l) => t + Number(l.cantidad || 0) * Number(l.precio || 0), 0)
  const abonadoSrv = id => sumar(movs.filter(m => m.servicio_id === id && m.tipo === 'abono_cliente'))
  const manana = masDias(hoy, 1)
  const proximos = servicios.filter(sv => ['aceptado', 'programado', 'en_curso'].includes(sv.estado))
    .map(sv => ({ ...sv, cliente: nombreCli(sv.cliente_id), total: totalSrv(sv.id), abonado: abonadoSrv(sv.id) }))
    .sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'))
  proximos.forEach(sv => {
    const quien = `${srvCod(sv)} · ${sv.cliente}`
    if (sv.estado !== 'en_curso' && sv.fecha && sv.fecha < hoy) hoyLista.push({ tipo:'servicio', quien, que:`Era el ${fechaCorta(sv.fecha)} y sigue sin completar`, alerta:true, ir:'servicios' })
    else if (sv.fecha && sv.fecha <= manana && sv.estado !== 'en_curso') {
      const sinGente = !sv.conductor && !(Array.isArray(sv.equipo) && sv.equipo.length)
      hoyLista.push({ tipo:'servicio', quien, que:`${sv.fecha === hoy ? 'Hoy' : 'Mañana'}${sv.hora ? ' ' + sv.hora : ''} · ${sv.titulo || 'servicio'}${sinGente ? ' · falta asignar quién va' : sv.placa ? ' · ' + sv.placa : ''}`, alerta: sinGente, ir:'servicios' })
    }
    if (sv.condicion_pago === 'anticipo_50' && sv.abonado < 1 && sv.fecha && sv.fecha <= masDias(hoy, 2))
      hoyLista.push({ tipo:'cobrar', quien, que:`Falta el anticipo del 50% (${cop(sv.total / 2)}) antes del servicio`, alerta:true, ir:'servicios' })
  })
  servicios.filter(sv => sv.aceptado_por === 'cliente' && ['aceptado', 'programado', 'en_curso'].includes(sv.estado) && !movs.some(m => m.servicio_id === sv.id && m.tipo === 'cobro_cliente')).forEach(sv =>
    hoyLista.push({ tipo:'servicio', quien:`${srvCod(sv)} · ${nombreCli(sv.cliente_id)}`, que:`¡Aceptó la cotización en el portal! Pásala a Caja y prográmala (${cop(totalSrv(sv.id))})`, alerta:true, ir:'servicios' }))
  servicios.filter(sv => sv.estado === 'completado' && totalSrv(sv.id) - abonadoSrv(sv.id) > 1).forEach(sv =>
    hoyLista.push({ tipo:'cobrar', quien:`${srvCod(sv)} · ${nombreCli(sv.cliente_id)}`, que:`Completado con saldo de ${cop(totalSrv(sv.id) - abonadoSrv(sv.id))}`, monto: totalSrv(sv.id) - abonadoSrv(sv.id), ir:'servicios', telefono: cli[sv.cliente_id]?.telefono, cliente_id: sv.cliente_id }))
  const sinRespuesta = servicios.filter(sv => sv.estado === 'cotizado' && diasDesde(sv.created_at?.slice(0, 10)) >= 3)
  if (sinRespuesta.length) hoyLista.push({ tipo:'servicio', quien:'Cotizaciones sin respuesta', que:`${sinRespuesta.length} de hace 3 días o más: haz seguimiento`, ir:'servicios' })

  const vencidas = tarifasAliados.filter(tarifaVencida)
  if (vencidas.length) hoyLista.push({ tipo:'tarifa', quien:'Tarifas de aliados', que:`${vencidas.length} tarifa${vencidas.length === 1 ? '' : 's'} vencida${vencidas.length === 1 ? '' : 's'}: pide precios nuevos`, ir:'aliados' })

  hoyLista.sort((a, b) => (b.alerta ? 1 : 0) - (a.alerta ? 1 : 0))

  return {
    hoy: hoyLista, cartera, porPagar, mes, embudo, proyeccion, temas,
    cargas: cargas.map(c => ({ ...c, cliente: nombreCli(c.cliente_id) })),
    contactosSemana: contactos.length,
    consolidados: consInfo,
    servicios: proximos,
  }
}

function Bloque({ titulo, extra, children, style }) {
  return (
    <div className="panel" style={style}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14, gap:10 }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>{titulo}</div>
        {extra && <div style={{ fontSize:11, color:'var(--text3)', textAlign:'right' }}>{extra}</div>}
      </div>
      {children}
    </div>
  )
}
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'14px 0', textAlign:'center' }}>{children}</div>

function Kpi({ label, valor, sub, color = 'var(--text)', subColor = 'var(--text3)', onClick }) {
  return (
    <div className="kpi-card" onClick={onClick} style={onClick ? { cursor:'pointer' } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color, fontSize:22 }}>{valor}</div>
      {sub && <div style={{ fontSize:11, color:subColor, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard({ onIr }) {
  const [datos, setDatos] = useState(null)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [nuevoTema, setNuevoTema] = useState('')

  const cargar = async () => {
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString()
    const [cl, ca, mo, co, te, aj] = await Promise.all([
      supabase.from('lrm_clientes').select('*'),
      supabase.from('lrm_cargas').select('*').order('fecha_recibo', { ascending:false }),
      supabase.from('lrm_movimientos').select('*'),
      supabase.from('lrm_contactos').select('id').gte('fecha', hace7),
      supabase.from('lrm_temas').select('*').eq('activo', true).order('created_at', { ascending:false }),
      supabase.from('lrm_ajustes').select('*'),
    ])
    if ([cl, ca, mo, co, te, aj].some(r => r.error)) { setFaltaTabla(true); return }
    // Módulos nuevos: si alguna tabla todavía no existe, el inicio sigue funcionando sin ella
    const [cs, ci, tf, tt, sv, sl] = await Promise.all([
      supabase.from('lrm_consolidados').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_consolidado_items').select('id,consolidado_id,cliente_id,descripcion,cbm,peso_kg,bultos,estado,motivo,tarifa_m3,moneda'),
      supabase.from('lrm_tarifas_flete').select('id,vigente_hasta'),
      supabase.from('lrm_tarifas_terrestre').select('id,vigente_hasta'),
      supabase.from('lrm_servicios').select('*').neq('estado', 'cancelado'),
      supabase.from('lrm_servicio_lineas').select('servicio_id,cantidad,precio,costo'),
    ])
    setDatos(calcular({ clientes: cl.data || [], cargas: ca.data || [], movs: mo.data || [], contactos: co.data || [], temas: te.data || [], ajustes: aj.data || [],
      consolidados: cs.error ? [] : cs.data || [], itemsCons: ci.error ? [] : ci.data || [], tarifasAliados: [...(tf.error ? [] : tf.data || []), ...(tt.error ? [] : tt.data || [])],
      servicios: sv.error ? [] : sv.data || [], lineasSrv: sl.error ? [] : sl.data || [] }))
  }
  useEffect(() => { cargar() }, [])

  const escribir = async (h) => {
    const link = linkWhatsApp(h.telefono, h.quien, h.mensaje)
    if (link) window.open(link, '_blank')
    if (h.cliente_id) await supabase.from('lrm_contactos').insert({ cliente_id: h.cliente_id, tipo:'whatsapp', resumen: h.que })
    cargar()
  }
  const agregarTema = async () => {
    if (!nuevoTema.trim()) return
    await supabase.from('lrm_temas').insert({ texto: nuevoTema.trim() })
    setNuevoTema(''); cargar()
  }
  const cerrarTema = async (id) => { await supabase.from('lrm_temas').update({ activo:false }).eq('id', id); cargar() }
  const cambiarMeta = async () => {
    const v = window.prompt('Meta de utilidad del mes (COP)', String(datos.proyeccion.meta || ''))
    if (v == null) return
    await supabase.from('lrm_ajustes').upsert({ clave:'meta_mensual', valor: String(Number(v.replace(/\D/g, '')) || 0) })
    cargar()
  }

  if (faltaTabla) return (
    <div className="panel" style={{ maxWidth:560, border:'1px solid rgba(224,82,82,0.3)' }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Faltan las tablas del dashboard</div>
      <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>
        Corre en Supabase (SQL Editor) el archivo <b>LRM_TRADE_TODO.sql</b> y recarga la página.
      </div>
    </div>
  )
  if (!datos) return <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text3)' }}>Cargando…</div>

  const { mes, proyeccion } = datos
  const utilidad = mes.honorarios + mes.margenFlete - mes.costos - mes.gastos
  const totalCartera = datos.cartera.reduce((s, c) => s + c.saldo, 0)
  const totalPagar   = datos.porPagar.reduce((s, c) => s + c.saldo, 0)
  const neto = totalCartera - totalPagar
  const proyTotal = proyeccion.activos + proyeccion.propuestas * 0.5
  const enMovimiento = datos.cargas.filter(c => c.etapa !== 'entregada')
  const entregadas30 = datos.cargas.filter(c => c.etapa === 'entregada' && diasDesde(c.fecha_entrega || c.created_at?.slice(0, 10)) <= 30)
  const nombreMes = MESES[Number(hoyISO().slice(5, 7)) - 1]
  const maxEmbudo = Math.max(1, ...EMBUDO.map(x => datos.embudo[x.id].n))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:12 }}>
        <Kpi label="Cartera por cobrar" valor={millones(totalCartera)} color="var(--gold)" sub={`${datos.cartera.length} clientes`} />
        <Kpi label="Por pagar proveedores" valor={millones(totalPagar)} color="var(--red)" sub={`${datos.porPagar.length} proveedores`} />
        <Kpi label="Cruce neto" valor={millones(neto)} color={neto >= 0 ? 'var(--green)' : 'var(--red)'} sub="Cobrar − pagar" />
        <Kpi label={`Utilidad de ${nombreMes}`} valor={millones(utilidad)} color={utilidad >= 0 ? 'var(--green)' : 'var(--red)'} sub="Honorarios + margen − costos" />
        <Kpi label="Proyección del mes" valor={millones(proyTotal)} sub={proyeccion.meta ? `Meta ${millones(proyeccion.meta)} · cambiar` : 'Poner meta'} onClick={cambiarMeta} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap:14 }}>
        <Bloque titulo="Hoy" extra={`${datos.hoy.length} pendientes · ${datos.hoy.filter(h => h.alerta).length} atrasados`}>
          {datos.hoy.length === 0 ? <Vacio>Nada pendiente para hoy.</Vacio> : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {datos.hoy.map((h, i) => (
                <div key={i} onClick={h.ir && onIr ? () => onIr(h.ir) : undefined} className={h.ir ? 'db-hoy-ir' : undefined} style={{ cursor: h.ir && onIr ? 'pointer' : undefined, display:'flex', gap:12, alignItems:'center', padding:'10px 12px', borderRadius:10,
                  background: h.alerta ? 'var(--red-dim)' : 'var(--bg4)', border:`1px solid ${h.alerta ? 'rgba(224,82,82,0.25)' : 'var(--border)'}` }}>
                  <div style={{ fontSize:18, width:24, textAlign:'center' }}>{ICONO[h.tipo]}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{h.quien}</div>
                    <div style={{ fontSize:12, color: h.alerta ? 'rgba(224,82,82,0.9)' : 'var(--text3)' }}>{h.que}{h.nota ? ` · ${h.nota}` : ''}</div>
                  </div>
                  {h.monto ? <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', whiteSpace:'nowrap' }}>{cop(h.monto)}</div> : null}
                  {h.ir && <div style={{ fontSize:16, color:'var(--text4)' }}>→</div>}
                  {h.telefono && (
                    <button onClick={ev => { ev.stopPropagation(); escribir(h) }} style={{ fontSize:10, padding:'4px 8px', borderRadius:8, background:'rgba(37,211,102,0.12)', color:'#25D366', border:'1px solid rgba(37,211,102,0.3)', whiteSpace:'nowrap', cursor:'pointer', fontFamily:'inherit' }}>WhatsApp</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Bloque>

        <Bloque titulo="Cargas en movimiento" extra={`${enMovimiento.length} activas · ${Math.round(enMovimiento.reduce((s, c) => s + Number(c.libras || 0), 0)).toLocaleString('es-CO')} lb`}>
          <div style={{ display:'flex', gap:4, marginBottom:14 }}>
            {ETAPAS.map(e => {
              const n = e.id === 'entregada' ? entregadas30.length : datos.cargas.filter(c => c.etapa === e.id).length
              return (
                <div key={e.id} style={{ flex:1, textAlign:'center' }}>
                  <div style={{ height:6, borderRadius:3, background: n ? e.color : 'rgba(255,255,255,0.06)', marginBottom:6 }} />
                  <div style={{ fontSize:18, fontWeight:800, color: n ? 'var(--text)' : 'var(--text4)' }}>{n}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.2 }}>{e.label}{e.id === 'entregada' ? ' (30 días)' : ''}</div>
                </div>
              )
            })}
          </div>
          {enMovimiento.length === 0 ? <Vacio>No hay cargas en camino.</Vacio> : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {enMovimiento.map(c => {
                const e = ETAPAS.find(x => x.id === c.etapa) || ETAPAS[0]
                return (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'var(--bg4)', borderLeft:`3px solid ${e.color}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.cliente}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{c.guia} · {c.categoria} · {Number(c.libras || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })} lb{c.fecha_llegada_est ? ` · llega ${fechaCorta(c.fecha_llegada_est)}` : ''}</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:e.color, whiteSpace:'nowrap' }}>{e.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Bloque>
      </div>

      {datos.servicios.length > 0 && (
        <Bloque titulo="Servicios en marcha" extra={<button onClick={() => onIr && onIr('servicios')} className="btn" style={{ fontSize:11, padding:'3px 9px' }}>Abrir Servicios →</button>}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {datos.servicios.slice(0, 8).map(sv => {
              const c = { aceptado:'#378ADD', programado:'#9C7BFF', en_curso:'#E8A23A' }[sv.estado] || '#8A94A6'
              const pct = sv.total ? Math.min(100, sv.abonado / sv.total * 100) : 0
              return (
                <div key={sv.id} onClick={() => onIr && onIr('servicios')} className="db-srv" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'var(--bg4)', borderLeft:`3px solid ${c}` }}>
                  <div style={{ width:70, flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:800, color: sv.fecha && sv.fecha < hoyISO() ? 'var(--red)' : 'var(--text)' }}>{sv.fecha ? (sv.fecha === hoyISO() ? 'Hoy' : fechaCorta(sv.fecha)) : 'Sin fecha'}</div>
                    <div style={{ fontSize:10.5, color:'var(--text3)' }}>{sv.hora || ''}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{sv.cliente} <span style={{ fontWeight:400, color:'var(--text3)', fontSize:11 }}>· SRV-{String(sv.numero || '').padStart(4, '0')}</span></div>
                    <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sv.titulo}{sv.placa ? ` · ${sv.placa}` : ''}{sv.conductor ? ` · ${sv.conductor}` : ''}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:800, color:'var(--gold)' }}>{cop(sv.total)}</div>
                    <div style={{ fontSize:10.5, color: pct >= 99 ? 'var(--green)' : pct > 0 ? '#E8A23A' : 'var(--red)' }}>{pct >= 99 ? 'Pagado' : pct > 0 ? `Abonó ${Math.round(pct)}%` : 'Sin abono'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Bloque>
      )}

      {datos.consolidados.length > 0 && (
        <Bloque titulo="Consolidados" extra={<button onClick={() => onIr && onIr('consolidador')} className="btn" style={{ fontSize:11, padding:'3px 9px' }}>Abrir Consolidador →</button>}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap:10 }}>
            {datos.consolidados.map(c => {
              const e = ESTADO_CONS[c.estado] || ESTADO_CONS.abierto
              const falta = Math.max(0, c.valor - c.facturado)
              return (
                <div key={c.id} onClick={() => onIr && onIr('consolidador')} className="db-cons" style={{ cursor:'pointer', padding:'12px 14px', borderRadius:10, background:'var(--bg4)', borderLeft:`3px solid ${e.c}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:e.c, whiteSpace:'nowrap' }}>{e.l}</div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{c.origen} → {c.destino}{c.etd ? ` · sale ${fechaCorta(c.etd)}` : ''}{c.eta ? ` · llega ${fechaCorta(c.eta)}` : ''}</div>
                  <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:6 }}>
                    <b style={{ color:'var(--text)' }}>{Number(c.m3).toLocaleString('es-CO', { maximumFractionDigits: 2 })} m³</b> · {c.clientes} cliente{c.clientes === 1 ? '' : 's'}
                    {c.porLlegar ? <span style={{ color:'#E8A23A' }}> · {c.porLlegar} por llegar</span> : null}
                    {c.novedades.length ? <span style={{ color:'var(--red)' }}> · {c.novedades.length} con novedad</span> : null}
                  </div>
                  <div style={{ fontSize:11.5, marginTop:4, color: c.facturado >= c.valor - 1 && c.valor ? 'var(--green)' : 'var(--text3)' }}>
                    {c.valor ? (c.facturado >= c.valor - 1 ? `✓ Facturado ${cop(c.facturado)}` : `Facturado ${cop(c.facturado)} de ${cop(c.valor)} · falta ${cop(falta)}`) : 'Sin tarifas cargadas'}
                  </div>
                </div>
              )
            })}
          </div>
        </Bloque>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap:14 }}>
        <Bloque titulo="Cartera" extra="por antigüedad">
          {datos.cartera.length === 0 ? <Vacio>Nadie te debe.</Vacio> : datos.cartera.map(c => {
            const color = c.dias > 30 ? 'var(--red)' : c.dias > 15 ? '#E8A23A' : 'var(--green)'
            return (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{c.cliente}</div>
                  <div style={{ fontSize:11, color }}>{c.dias} días</div>
                </div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(c.saldo)}</div>
              </div>
            )
          })}
        </Bloque>

        <Bloque titulo="Por pagar" extra="proveedores">
          {datos.porPagar.length === 0 ? <Vacio>No le debes a ningún proveedor.</Vacio> : datos.porPagar.map(p => (
            <div key={p.proveedor} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{p.proveedor}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{p.vence ? `vence ${fechaCorta(p.vence)}` : 'sin fecha'}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--red)' }}>{cop(p.saldo)}</div>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:12 }}>
            <span style={{ color:'var(--text3)' }}>Cruce neto (cobrar − pagar)</span>
            <span style={{ fontWeight:800, color: neto >= 0 ? 'var(--green)' : 'var(--red)' }}>{neto < 0 ? '−' : ''}{cop(neto)}</span>
          </div>
        </Bloque>

        <Bloque titulo="Resultado del mes" extra={nombreMes}>
          {[
            ['Honorarios por servicio', mes.honorarios,  'var(--text)'],
            ['Margen sobre fletes',     mes.margenFlete, mes.margenFlete < 0 ? 'var(--red)' : 'var(--text)'],
            ['Costos directos',        -mes.costos,      'var(--red)'],
            ['Gastos operativos',      -mes.gastos,      'var(--red)'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13 }}>
              <span style={{ color:'var(--text2)' }}>{l}</span>
              <span style={{ color:c, fontWeight:600 }}>{v < 0 ? '−' : ''}{cop(v)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', marginTop:6, borderTop:'1px solid var(--border2)', fontSize:14 }}>
            <span style={{ color:'var(--text)', fontWeight:700 }}>Utilidad</span>
            <span style={{ color: utilidad >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:800 }}>{utilidad < 0 ? '−' : ''}{cop(utilidad)}</span>
          </div>
        </Bloque>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap:14 }}>
        <Bloque titulo="CRM · embudo" extra={`${datos.contactosSemana} contactos esta semana`}>
          {EMBUDO.map(e => {
            const d = datos.embudo[e.id]
            return (
              <div key={e.id} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span style={{ color:'var(--text2)' }}>{e.label} <b style={{ color:'var(--text)' }}>{d.n}</b></span>
                  <span style={{ color:'var(--text3)' }}>{d.valor ? millones(d.valor) + '/mes' : ''}</span>
                </div>
                <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.05)' }}>
                  <div style={{ height:'100%', width:`${(d.n / maxEmbudo) * 100}%`, background:e.color, borderRadius:4 }} />
                </div>
              </div>
            )
          })}
        </Bloque>

        <Bloque titulo="Proyección" extra={proyeccion.meta ? `meta ${millones(proyeccion.meta)}` : null}>
          {proyeccion.meta > 0 && (
            <div style={{ height:14, borderRadius:7, background:'rgba(255,255,255,0.05)', display:'flex', overflow:'hidden', marginBottom:12 }}>
              <div style={{ width:`${Math.min(100, (proyeccion.activos / proyeccion.meta) * 100)}%`, background:'var(--green)' }} />
              <div style={{ width:`${Math.min(100, (proyeccion.propuestas * 0.5 / proyeccion.meta) * 100)}%`, background:'rgba(232,162,58,0.6)' }} />
            </div>
          )}
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.9 }}>
            <div><span style={{ color:'var(--green)' }}>■</span> Clientes activos: <b style={{ color:'var(--text)' }}>{cop(proyeccion.activos)}</b></div>
            <div><span style={{ color:'#E8A23A' }}>■</span> Propuestas (50% probable): <b style={{ color:'var(--text)' }}>{cop(proyeccion.propuestas * 0.5)}</b></div>
            {proyeccion.meta > 0 && <div style={{ color:'var(--text3)' }}>{proyTotal >= proyeccion.meta ? 'Meta cubierta' : `Faltan ${cop(proyeccion.meta - proyTotal)} para la meta`}</div>}
            <div style={{ color:'var(--text4)', fontSize:11, marginTop:4 }}>Sale de "Lo que te deja al mes" de cada cliente.</div>
          </div>
        </Bloque>

        <Bloque titulo="Temas de relevancia">
          {datos.temas.length === 0 && <Vacio>Sin temas abiertos.</Vacio>}
          {datos.temas.map(t => (
            <div key={t.id} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'var(--text)' }}>{t.texto}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{fechaCorta(t.created_at?.slice(0, 10))}</div>
              </div>
              <button onClick={() => cerrarTema(t.id)} title="Cerrar tema" style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14 }}>✓</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <input value={nuevoTema} onChange={e => setNuevoTema(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTema()}
              placeholder="Agregar tema…" style={{ flex:1, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
            <button onClick={agregarTema} className="btn" style={{ fontSize:12 }}>+</button>
          </div>
        </Bloque>
      </div>
    </div>
  )
}