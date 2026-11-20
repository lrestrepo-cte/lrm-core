// @ts-nocheck
// LRM Trade Consulting · Cartera
// Lo que te deben, cliente por cliente: estado de cuenta para enviar (WhatsApp o PDF),
// cuánto está en camino, cuánto ya se entregó sin pagar, antigüedad y registro de pagos.
// Lee: lrm_movimientos (cobro_cliente / abono_cliente), lrm_cargas, lrm_clientes, lrm_cuentas, lrm_cierres
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO, fechaCorta, linkWhatsApp } from './LRMClientes'
import { ETAPAS } from './Dashboard'
import { CuentaCobro, mercanciaCliente } from './Cargas'
import { ModalMovimiento } from './Caja'
import { useDatosLRM } from './datosLRM'

const cop = n => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const fmt = (n, d = 1) => Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
const dias = iso => iso ? Math.max(0, Math.round((new Date(hoyISO()) - new Date(iso)) / 86400000)) : 0
const fechaLarga = (iso = hoyISO()) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' }) }
const etapaDe = id => ETAPAS.find(e => e.id === id)
const numeroCuenta = (carga, m) => carga ? `LRM-${(carga.fecha_recibo || m.fecha || '').slice(0, 4)}-${String(carga.orden || '').padStart(3, '0')}` : (m.referencia || 'Cobro manual')

// Antigüedad: días desde que se causó el cobro (o desde que venció, si tiene fecha)
const TRAMOS = [
  { id:'t0',  label:'0–15 días',  hasta:15,       color:'#4caf50' },
  { id:'t1',  label:'16–30 días', hasta:30,       color:'#C9A84C' },
  { id:'t2',  label:'31–60 días', hasta:60,       color:'#E8A23A' },
  { id:'t3',  label:'Más de 60',  hasta:Infinity, color:'#e05252' },
]
const tramoDe = d => TRAMOS.find(t => d <= t.hasta)

// Arma la cartera de cada cliente aplicando los pagos a lo más viejo primero (FIFO)
function armarCartera(movs, cargas, clientes) {
  const porCliente = {}
  movs.forEach(m => {
    if (!m.cliente_id || (m.tipo !== 'cobro_cliente' && m.tipo !== 'abono_cliente')) return
    const c = porCliente[m.cliente_id] ||= { cobros: [], abonos: [] }
    ;(m.tipo === 'cobro_cliente' ? c.cobros : c.abonos).push(m)
  })
  return Object.entries(porCliente).map(([id, { cobros, abonos }]) => {
    cobros.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.created_at || '').localeCompare(b.created_at || ''))
    abonos.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
    let disponible = abonos.reduce((s, a) => s + Number(a.monto || 0), 0)
    const items = cobros.map(m => {
      const valor = Number(m.monto || 0)
      const aplicado = Math.min(valor, disponible); disponible -= aplicado
      const carga = m.carga_id ? cargas.find(c => c.id === m.carga_id) : null
      const desde = m.vence || m.fecha
      return {
        id: m.id, mov: m, carga, valor, abonado: aplicado, pendiente: valor - aplicado,
        numero: numeroCuenta(carga, m), fecha: m.fecha,
        mercancia: carga ? mercanciaCliente(carga) : (m.notas || 'Servicio'),
        kg: carga ? Number(carga.peso_cobrable_kg || 0) : null,
        etapa: carga?.etapa || null, entregada: carga ? carga.etapa === 'entregada' : true,
        dias: dias(desde),
      }
    })
    const abiertos = items.filter(i => i.pendiente > 0.5)
    const cargado = items.reduce((s, i) => s + i.valor, 0)
    const pagado = abonos.reduce((s, a) => s + Number(a.monto || 0), 0)
    const saldo = cargado - pagado
    const cliente = clientes.find(c => c.id === id) || { id, nombre: '—' }
    const masViejo = abiertos.reduce((mx, i) => Math.max(mx, i.dias), 0)
    return {
      id, cliente, items, abiertos, abonos, cargado, pagado, saldo, masViejo,
      enCamino: abiertos.filter(i => !i.entregada).reduce((s, i) => s + i.pendiente, 0),
      entregadoSinPagar: abiertos.filter(i => i.entregada).reduce((s, i) => s + i.pendiente, 0),
      ultimoPago: abonos.length ? abonos[abonos.length - 1] : null,
    }
  })
}

// ── Documento: estado de cuenta de un cliente ───────────────────────────────
function estadoDeCuenta({ fila, empresa, medios, conHistorial }) {
  const { cliente } = fila
  const lista = conHistorial ? fila.items : fila.abiertos
  const mediosOk = (medios || []).filter(m => String(m.detalle || '').trim())
  const hoy = fechaLarga()
  const filas = lista.map(i => {
    const e = i.etapa ? etapaDe(i.etapa)?.label : '—'
    const estado = i.pendiente <= 0.5 ? 'Pagada' : i.abonado > 0 ? 'Abono parcial' : 'Pendiente'
    return `<tr><td>${esc(i.numero)}</td><td>${fechaCorta(i.fecha)}</td><td>${esc(i.mercancia)}</td><td class="n">${i.kg != null ? fmt(i.kg) + ' kg' : ''}</td><td>${esc(e)}</td>
      <td class="n">${cop(i.valor)}</td><td class="n">${i.abonado ? cop(i.abonado) : ''}</td><td class="n b">${i.pendiente > 0.5 ? cop(i.pendiente) : '<span class="ok">' + estado + '</span>'}</td></tr>`
  }).join('')
  const filasAbonos = fila.abonos.map(a => `<tr><td>${fechaCorta(a.fecha)} ${(a.fecha || '').slice(0, 4)}</td><td>${esc(a.referencia || a.notas || 'Pago recibido')}</td><td class="n">${cop(a.monto)}</td></tr>`).join('')
  const dato = (l, v) => v ? `<div class="d"><span>${l}</span><b>${esc(v)}</b></div>` : ''

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Estado de cuenta · ${esc(cliente.nombre)}</title><style>
    @page{size:letter;margin:10mm}*{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:18px;background:#fff;font-size:11px;line-height:1.35}
    .doc{max-width:780px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #C9A84C;padding-bottom:8px}
    .marca{font-size:18px;font-weight:800}.marca small{display:block;font-size:10px;font-weight:400;color:#777;margin-top:1px}
    .emp{font-size:10px;color:#555;line-height:1.45;margin-top:4px}.num{text-align:right}.num .t{font-size:9.5px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
    .num .n1{font-size:15px;font-weight:800;margin:1px 0 3px}.num div{font-size:10px;color:#555}
    h3{font-size:9.5px;letter-spacing:1.5px;color:#8a6d1f;margin:12px 0 4px;text-transform:uppercase}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.d{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dotted #ddd;padding:2px 0}.d span{color:#777}
    table{width:100%;border-collapse:collapse}th{background:#f6f1e3;text-align:left;font-size:9.5px;padding:4px 5px;color:#5a4a1a}td{padding:4px 5px;border-bottom:1px solid #eee;vertical-align:top}
    tr{page-break-inside:avoid}.n{text-align:right;white-space:nowrap}.b{font-weight:700}.ok{color:#2e7d32;font-weight:700}
    .res{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.r{border:1px solid #e5dcc3;border-radius:6px;padding:6px 10px}.r span{display:block;font-size:9.5px;color:#777}.r b{font-size:13px}
    .r.s{background:#1b1b1b;color:#fff;border-color:#1b1b1b}.r.s span{color:#C9A84C}.r.s b{font-size:15px}
    .cierre{page-break-inside:avoid;break-inside:avoid}
    .pago{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.m{border:1px solid #e5dcc3;border-radius:6px;padding:5px 8px}.m b{display:block;font-size:10.5px}.m span{color:#555;font-size:10px}
    .cond{font-size:9.5px;color:#555;background:#faf7ee;border-radius:6px;padding:6px 10px;margin-top:10px}
    @media print{body{padding:0}}</style></head><body><div class="doc">
    <div class="top"><div><div class="marca">${esc(empresa.nombre)}<small>${esc(empresa.lema)}</small></div>
      <div class="emp">${esc(empresa.responsable)} · ${esc(empresa.documento)}<br>${esc(empresa.ciudad)} · ${esc(empresa.whatsapp)} · ${esc(empresa.correo)}</div></div>
      <div class="num"><div class="t">ESTADO DE CUENTA</div><div class="n1">${esc(cliente.nombre)}</div><div>Corte: ${hoy}</div></div></div>
    <h3>Cliente</h3><div class="grid">${dato('Nombre', cliente.nombre)}${dato('Empresa', cliente.empresa)}${dato('Teléfono', cliente.telefono)}${dato('Correo', cliente.correo)}</div>
    <h3>${conHistorial ? 'Cuentas de cobro' : 'Cuentas pendientes'}</h3>
    ${lista.length ? `<table><tr><th>N.º</th><th>Fecha</th><th>Mercancía</th><th class="n">Peso</th><th>Estado de la carga</th><th class="n">Valor</th><th class="n">Abonado</th><th class="n">Pendiente</th></tr>${filas}</table>` : '<div>Sin cuentas pendientes.</div>'}
    ${conHistorial && filasAbonos ? `<h3>Pagos recibidos</h3><table><tr><th>Fecha</th><th>Detalle</th><th class="n">Valor</th></tr>${filasAbonos}</table>` : ''}
    <div class="cierre">
    <div class="res">
      <div class="r"><span>Mercancía en camino</span><b>${cop(fila.enCamino)}</b></div>
      <div class="r"><span>Mercancía entregada</span><b>${cop(fila.entregadoSinPagar)}</b></div>
      <div class="r s"><span>SALDO A PAGAR</span><b>${cop(Math.max(0, fila.saldo))}</b></div>
    </div>
    ${mediosOk.length ? `<h3>Medios de pago</h3><div class="pago">${mediosOk.map(m => `<div class="m"><b>${esc(m.tipo)}</b><span>${esc(m.detalle)}${m.titular ? '<br>' + esc(m.titular) : ''}</span></div>`).join('')}</div>` : ''}
    ${empresa.condiciones ? `<div class="cond"><b>Condiciones:</b> ${esc(empresa.condiciones)}</div>` : ''}
    </div></div></body></html>`

  const primer = (cliente.nombre || '').split(' ')[0]
  const texto = [
    `Hola ${primer}, este es tu estado de cuenta con *${empresa.nombre}* al ${hoy}:`, ``,
    ...fila.abiertos.map(i => `• ${i.numero} · ${i.mercancia}${i.kg != null ? ' · ' + fmt(i.kg) + ' kg' : ''}${i.etapa ? ' · ' + (etapaDe(i.etapa)?.label || '') : ''}: ${cop(i.pendiente)}${i.abonado ? ' (ya abonaste ' + cop(i.abonado) + ')' : ''}`),
    ``,
    ...(fila.enCamino > 0 ? [`En camino (se paga al llegar): ${cop(fila.enCamino)}`] : []),
    ...(fila.entregadoSinPagar > 0 ? [`Ya entregado, pendiente de pago: ${cop(fila.entregadoSinPagar)}`] : []),
    `*Saldo total: ${cop(Math.max(0, fila.saldo))}*`,
    ...(mediosOk.length ? ['', '*Medios de pago*', ...mediosOk.map(m => `• ${m.tipo}: ${m.detalle}${m.titular ? ' (' + m.titular + ')' : ''}`)] : []),
    '', 'Cualquier duda me escribes. ¡Gracias!',
  ].join('\n')
  return { html, texto }
}

// ── Documento: cartera completa (para el socio, el contador o para ti) ──────
function carteraCompleta({ filas, empresa }) {
  const total = filas.reduce((s, f) => s + f.saldo, 0)
  const porTramo = TRAMOS.map(t => ({ ...t, v: filas.reduce((s, f) => s + f.abiertos.filter(i => tramoDe(i.dias).id === t.id).reduce((a, i) => a + i.pendiente, 0), 0) }))
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cartera ${hoyISO()}</title><style>
    @page{size:letter;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:18px;font-size:11px}
    .top{display:flex;justify-content:space-between;border-bottom:2px solid #C9A84C;padding-bottom:8px;margin-bottom:10px}.marca{font-size:18px;font-weight:800}
    .t{font-size:9.5px;letter-spacing:2px;color:#8a6d1f;font-weight:700;text-align:right}.n1{font-size:15px;font-weight:800;text-align:right}
    table{width:100%;border-collapse:collapse}th{background:#f6f1e3;text-align:left;font-size:9.5px;padding:4px 5px;color:#5a4a1a}td{padding:4px 5px;border-bottom:1px solid #eee}
    .n{text-align:right;white-space:nowrap}.tot td{font-weight:800;border-top:2px solid #1b1b1b}
    .tr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.c{border:1px solid #e5dcc3;border-radius:6px;padding:6px 10px}.c span{display:block;font-size:9.5px;color:#777}.c b{font-size:13px}
    @media print{body{padding:0}}</style></head><body>
    <div class="top"><div class="marca">${esc(empresa.nombre)}</div><div><div class="t">CARTERA POR COBRAR</div><div class="n1">${cop(total)}</div><div style="font-size:10px;color:#555;text-align:right">Corte: ${fechaLarga()}</div></div></div>
    <div class="tr">${porTramo.map(t => `<div class="c"><span>${t.label}</span><b>${cop(t.v)}</b></div>`).join('')}</div>
    <table><tr><th>Cliente</th><th class="n">Cuentas</th><th class="n">En camino</th><th class="n">Entregado sin pagar</th><th class="n">Días</th><th class="n">Saldo</th></tr>
    ${filas.map(f => `<tr><td>${esc(f.cliente.nombre)}${f.cliente.empresa ? ' · ' + esc(f.cliente.empresa) : ''}</td><td class="n">${f.abiertos.length}</td><td class="n">${cop(f.enCamino)}</td><td class="n">${cop(f.entregadoSinPagar)}</td><td class="n">${f.masViejo}</td><td class="n"><b>${cop(f.saldo)}</b></td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td class="n">${filas.reduce((s, f) => s + f.abiertos.length, 0)}</td><td class="n">${cop(filas.reduce((s, f) => s + f.enCamino, 0))}</td><td class="n">${cop(filas.reduce((s, f) => s + f.entregadoSinPagar, 0))}</td><td></td><td class="n">${cop(total)}</td></tr></table>
    </body></html>`
  const texto = [
    `*Cartera ${empresa.nombre}* · corte ${fechaLarga()}`, ``,
    ...filas.map(f => `• ${f.cliente.nombre}: ${cop(f.saldo)} (${f.abiertos.length} ${f.abiertos.length === 1 ? 'cuenta' : 'cuentas'}, ${f.masViejo} días)`),
    ``, `*Total por cobrar: ${cop(total)}*`,
    ...porTramo.filter(t => t.v > 0).map(t => `${t.label}: ${cop(t.v)}`),
  ].join('\n')
  return { html, texto }
}

const imprimir = (html) => {
  const w = window.open('', '_blank'); if (!w) return
  w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close()
}
async function copiarTexto(t) { try { await navigator.clipboard.writeText(t); return true } catch { return false } }

const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'14px 0', textAlign:'center' }}>{children}</div>
function Kpi({ label, valor, sub, color }) {
  return (
    <div className="panel" style={{ padding:'14px 16px' }}>
      <div style={{ fontSize:10, letterSpacing:1.5, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color: color || 'var(--text)', marginTop:4 }}>{valor}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

// ── Pantalla ───────────────────────────────────────────────────────────────
export default function Cartera() {
  const { empresa, medios } = useDatosLRM()
  const [movs, setMovs] = useState([])
  const [cargas, setCargas] = useState([])
  const [clientes, setClientes] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cierres, setCierres] = useState([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [orden, setOrden] = useState('saldo')
  const [abierto, setAbierto] = useState(null)       // id del cliente cuyo estado de cuenta se ve
  const [pago, setPago] = useState(null)             // { cliente_id, monto }
  const [cuentaDe, setCuentaDe] = useState(null)     // carga_id para ver su cuenta de cobro
  const [completa, setCompleta] = useState(false)

  const cargar = async () => {
    const [mo, ca, cl, cu, ci] = await Promise.all([
      supabase.from('lrm_movimientos').select('*').in('tipo', ['cobro_cliente', 'abono_cliente']),
      supabase.from('lrm_cargas').select('id,orden,guia,etapa,descripcion,categoria,piezas,peso_cobrable_kg,fecha_recibo,cliente_id,modalidad'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
      supabase.from('lrm_cuentas').select('*').order('created_at'),
      supabase.from('lrm_cierres').select('*'),
    ])
    setMovs(mo.data || []); setCargas(ca.data || []); setClientes(cl.data || []); setCuentas(cu.data || []); setCierres(ci.data || [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const todas = useMemo(() => armarCartera(movs, cargas, clientes), [movs, cargas, clientes])
  const conSaldo = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return todas.filter(f => f.saldo > 0.5 && (!q || `${f.cliente.nombre} ${f.cliente.empresa || ''}`.toLowerCase().includes(q)))
      .sort((a, b) => orden === 'dias' ? b.masViejo - a.masViejo : orden === 'nombre' ? (a.cliente.nombre || '').localeCompare(b.cliente.nombre || '') : b.saldo - a.saldo)
  }, [todas, buscar, orden])
  const saldoAFavor = todas.filter(f => f.saldo < -0.5)

  const total = conSaldo.reduce((s, f) => s + f.saldo, 0)
  const enCamino = conSaldo.reduce((s, f) => s + f.enCamino, 0)
  const entregado = conSaldo.reduce((s, f) => s + f.entregadoSinPagar, 0)
  const porTramo = TRAMOS.map(t => ({ ...t, v: conSaldo.reduce((s, f) => s + f.abiertos.filter(i => tramoDe(i.dias).id === t.id).reduce((a, i) => a + i.pendiente, 0), 0) }))
  const filaAbierta = todas.find(f => f.id === abierto)

  if (cargando) return <div className="panel"><Vacio>Cargando cartera…</Vacio></div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:12 }}>
        <Kpi label="Total por cobrar" valor={cop(total)} color="var(--gold)" sub={`${conSaldo.length} ${conSaldo.length === 1 ? 'cliente' : 'clientes'}`} />
        <Kpi label="En camino" valor={cop(enCamino)} color="var(--blue)" sub="se cobra cuando llegue" />
        <Kpi label="Entregado sin pagar" valor={cop(entregado)} color={entregado > 0 ? 'var(--red)' : 'var(--text)'} sub="ya tiene la mercancía" />
        <Kpi label="Más de 30 días" valor={cop(porTramo[2].v + porTramo[3].v)} color={porTramo[2].v + porTramo[3].v > 0 ? 'var(--red)' : 'var(--text)'} sub="para llamar ya" />
      </div>

      {/* Antigüedad */}
      <div className="panel">
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>Antigüedad</div>
        <div style={{ display:'flex', height:12, borderRadius:6, overflow:'hidden', background:'rgba(255,255,255,0.05)', gap:2 }}>
          {total > 0 && porTramo.filter(t => t.v > 0).map(t => <div key={t.id} title={`${t.label}: ${cop(t.v)}`} style={{ flex:t.v, background:t.color }} />)}
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:10 }}>
          {porTramo.map(t => (
            <div key={t.id} style={{ fontSize:12, color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:9, height:9, borderRadius:3, background:t.color }} />{t.label}: <b style={{ color:'var(--text)' }}>{cop(t.v)}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:12 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar cliente…" style={{ padding:'7px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', minWidth:180 }} />
            {[['saldo','Mayor saldo'],['dias','Más viejo'],['nombre','A–Z']].map(([id, l]) => (
              <button key={id} onClick={() => setOrden(id)} className={orden === id ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={() => setPago({})}>＋ Registrar pago</button>
            <button className="btn-gold" disabled={!conSaldo.length} onClick={() => setCompleta(true)}>Cartera completa</button>
          </div>
        </div>

        {conSaldo.length === 0 ? <Vacio>Nadie te debe.</Vacio> : conSaldo.map(f => {
          const t = tramoDe(f.masViejo)
          return (
            <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
              <span style={{ width:8, height:34, borderRadius:4, background:t.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:160, cursor:'pointer' }} onClick={() => setAbierto(f.id)}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{f.cliente.nombre}{f.cliente.empresa ? <span style={{ color:'var(--text3)', fontWeight:400 }}> · {f.cliente.empresa}</span> : null}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  {f.abiertos.length} {f.abiertos.length === 1 ? 'cuenta' : 'cuentas'} · {f.masViejo} días
                  {f.enCamino > 0 && <> · <span style={{ color:'var(--blue)' }}>{cop(f.enCamino)} en camino</span></>}
                  {f.entregadoSinPagar > 0 && <> · <span style={{ color:'var(--red)' }}>{cop(f.entregadoSinPagar)} entregado</span></>}
                  {f.ultimoPago && <> · último pago {fechaCorta(f.ultimoPago.fecha)}</>}
                </div>
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{cop(f.saldo)}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn" style={{ fontSize:11, padding:'5px 10px', whiteSpace:'nowrap' }} onClick={() => setAbierto(f.id)}>Estado de cuenta</button>
                <button className="btn-green" style={{ fontSize:11, padding:'5px 12px', width:'auto', flex:'none' }} onClick={() => setPago({ cliente_id: f.id, monto: String(Math.round(f.saldo)) })}>Pago</button>
              </div>
            </div>
          )
        })}
        {saldoAFavor.length > 0 && (
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:12 }}>
            Saldo a favor del cliente: {saldoAFavor.map(f => `${f.cliente.nombre} ${cop(-f.saldo)}`).join(' · ')}
          </div>
        )}
      </div>

      {filaAbierta && !pago && !cuentaDe && (
        <ModalEstado fila={filaAbierta} empresa={empresa} medios={medios}
          onPago={() => setPago({ cliente_id: filaAbierta.id, monto: String(Math.max(0, Math.round(filaAbierta.saldo))) })}
          onCuenta={id => setCuentaDe(id)} onCerrar={() => setAbierto(null)} />
      )}
      {completa && <ModalCompleta filas={conSaldo} empresa={empresa} onCerrar={() => setCompleta(false)} />}
      {pago && (
        <ModalMovimiento tipo="abono_cliente" inicial={pago} cuentas={cuentas.filter(c => c.activa)} clientes={clientes} proveedores={[]}
          cerrado={m => cierres.some(c => c.mes === m)} onCerrar={() => setPago(null)} onGuardado={() => { setPago(null); cargar() }} />
      )}
      {cuentaDe && <CuentaCobro cargaId={cuentaDe} onCerrar={() => setCuentaDe(null)} />}
    </div>
  )
}

// ── Estado de cuenta de un cliente ──────────────────────────────────────────
function ModalEstado({ fila, empresa, medios, onPago, onCuenta, onCerrar }) {
  const [historial, setHistorial] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const doc = estadoDeCuenta({ fila, empresa, medios, conHistorial: historial })
  const wa = fila.cliente.telefono ? linkWhatsApp(fila.cliente.telefono, fila.cliente.nombre, doc.texto) : null
  const correo = fila.cliente.correo ? `mailto:${fila.cliente.correo}?subject=${encodeURIComponent('Estado de cuenta · ' + empresa.nombre)}&body=${encodeURIComponent(doc.texto.replace(/\*/g, ''))}` : null
  const copiar = async () => { if (await copiarTexto(doc.texto)) { setCopiado(true); setTimeout(() => setCopiado(false), 2000) } }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:18, width:'100%', maxWidth:900, border:'1px solid var(--gold-border)', height:'94vh', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:3, color:'var(--gold)', fontWeight:700 }}>ESTADO DE CUENTA</div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>{fila.cliente.nombre} · {cop(Math.max(0, fila.saldo))}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ color:'#25D366', borderColor:'rgba(37,211,102,0.4)', textDecoration:'none' }}>WhatsApp</a>}
            {correo && <a href={correo} className="btn" style={{ textDecoration:'none' }}>Correo</a>}
            <button onClick={copiar} className="btn">{copiado ? '✓ Copiado' : 'Copiar texto'}</button>
            <button onClick={() => imprimir(doc.html)} className="btn-gold">Imprimir / PDF</button>
            <button onClick={onPago} className="btn-green" style={{ width:'auto', flex:'none' }}>Registrar pago</button>
            <button onClick={onCerrar} className="btn">Cerrar</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', fontSize:12, color:'var(--text2)' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type="checkbox" checked={historial} onChange={e => setHistorial(e.target.checked)} /> Incluir cuentas pagadas y pagos recibidos
          </label>
          <span style={{ color:'var(--text4)' }}>·</span>
          <span>Cuenta de cobro de:</span>
          {fila.abiertos.filter(i => i.carga).map(i => (
            <button key={i.id} className="btn" style={{ fontSize:11, padding:'4px 9px' }} onClick={() => onCuenta(i.carga.id)}>🧾 {i.numero}</button>
          ))}
        </div>
        <iframe title="Estado de cuenta" srcDoc={doc.html} style={{ flex:1, width:'100%', border:'none', borderRadius:10, background:'#fff' }} />
        {!fila.cliente.telefono && <div style={{ fontSize:11, color:'var(--text4)' }}>Para enviarlo por WhatsApp, ponle el celular al cliente en el CRM.</div>}
      </div>
    </div>
  )
}

// ── Cartera completa ────────────────────────────────────────────────────────
function ModalCompleta({ filas, empresa, onCerrar }) {
  const [copiado, setCopiado] = useState(false)
  const doc = carteraCompleta({ filas, empresa })
  const copiar = async () => { if (await copiarTexto(doc.texto)) { setCopiado(true); setTimeout(() => setCopiado(false), 2000) } }
  const excel = () => {
    const filasCsv = [['Cliente','Empresa','Cuenta','Fecha','Mercancía','Kg','Estado carga','Valor','Abonado','Pendiente','Días']]
    filas.forEach(f => f.abiertos.forEach(i => filasCsv.push([f.cliente.nombre, f.cliente.empresa || '', i.numero, i.fecha, i.mercancia, i.kg ?? '', i.etapa ? etapaDe(i.etapa)?.label : '', Math.round(i.valor), Math.round(i.abonado), Math.round(i.pendiente), i.dias])))
    const csv = '﻿' + filasCsv.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' })); a.download = `cartera-lrm-${hoyISO()}.csv`; a.click()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:18, width:'100%', maxWidth:900, border:'1px solid var(--gold-border)', height:'94vh', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:3, color:'var(--gold)', fontWeight:700 }}>CARTERA COMPLETA</div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>{cop(filas.reduce((s, f) => s + f.saldo, 0))} · {filas.length} clientes</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={copiar} className="btn">{copiado ? '✓ Copiado' : 'Copiar texto'}</button>
            <button onClick={excel} className="btn">Excel</button>
            <button onClick={() => imprimir(doc.html)} className="btn-gold">Imprimir / PDF</button>
            <button onClick={onCerrar} className="btn">Cerrar</button>
          </div>
        </div>
        <iframe title="Cartera completa" srcDoc={doc.html} style={{ flex:1, width:'100%', border:'none', borderRadius:10, background:'#fff' }} />
      </div>
    </div>
  )
}