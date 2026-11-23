// @ts-nocheck
// LRM Trade Consulting · Reporte mensual y metas
// Lo movido, lo facturado y lo ganado por línea (cargas, consolidados, servicios), mejores clientes,
// rentabilidad por ruta, comparación con el mes anterior, últimos 6 meses y avance de las metas.
// Lee: lrm_movimientos, lrm_cargas, lrm_consolidados, lrm_consolidado_items, lrm_servicios, lrm_servicio_lineas, lrm_clientes, lrm_ajustes
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { hoyISO } from './LRMClientes'
import { useDatosLRM, logoDocumentoHTML } from './datosLRM'

const cop = n => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const millones = n => (n < 0 ? '−' : '') + '$' + (Math.abs(n || 0) / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const num = v => Number(v || 0)
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const nombreMes = m => { const [y, mm] = m.split('-').map(Number); return `${MESES[mm - 1]} ${y}` }
const mesAntes = (m, k = 1) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 - k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const LINEAS = {
  cargas:       { l:'Cargas (bodegas EE.UU.)', icono:'📦' },
  consolidados: { l:'Consolidados',            icono:'🚢' },
  servicios:    { l:'Servicios y transporte',  icono:'🚚' },
  otros:        { l:'Otros (honorarios y manuales)', icono:'➕' },
}
const META_VACIA = { facturacion:'', utilidad:'', clientes_nuevos:'', m3:'', servicios:'' }
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }

// ── Cálculo del mes ─────────────────────────────────────────────────────────
export function calcularMes(mes, B) {
  const { movs, cargas, consolidados, items, servicios, lineasSrv, clientes } = B
  const cargaDe = Object.fromEntries(cargas.map(c => [c.id, c]))
  const srvDe = Object.fromEntries(servicios.map(s => [s.id, s]))
  const consDe = Object.fromEntries(consolidados.map(c => [c.id, c]))
  const nombreCli = id => clientes.find(c => c.id === id)?.nombre || 'Sin cliente'
  const linea = m => m.carga_id ? 'cargas' : m.consolidado_id ? 'consolidados' : m.servicio_id ? 'servicios' : 'otros'
  const delMes = movs.filter(m => (m.fecha || '').startsWith(mes))
  const suma = (arr, f = () => true) => arr.filter(f).reduce((s, m) => s + num(m.monto), 0)

  const porLinea = Object.fromEntries(Object.keys(LINEAS).map(k => {
    const ms = delMes.filter(m => linea(m) === k)
    const ingreso = suma(ms, m => m.tipo === 'cobro_cliente'), costo = suma(ms, m => m.tipo === 'costo_proveedor')
    return [k, { ingreso, costo, margen: ingreso - costo }]
  }))
  const facturado = Object.values(porLinea).reduce((s, x) => s + x.ingreso, 0)
  const costos = Object.values(porLinea).reduce((s, x) => s + x.costo, 0)
  const gastos = suma(delMes, m => m.tipo === 'gasto')
  const recaudado = suma(delMes, m => m.tipo === 'abono_cliente')
  const pagado = suma(delMes, m => m.tipo === 'pago_proveedor')

  // Cartera al cierre del mes (todo lo causado hasta el último día menos lo pagado)
  const hasta = movs.filter(m => (m.fecha || '') <= mes + '-31')
  const cartera = Math.max(0, suma(hasta, m => m.tipo === 'cobro_cliente') - suma(hasta, m => m.tipo === 'abono_cliente'))

  // Quién es el cliente de cada costo (para la ganancia por cliente)
  const clienteDeCosto = m => {
    if (m.cliente_id) return [[m.cliente_id, 1]]
    if (m.carga_id) return [[cargaDe[m.carga_id]?.cliente_id, 1]]
    if (m.servicio_id) return [[srvDe[m.servicio_id]?.cliente_id, 1]]
    if (m.consolidado_id) {                                     // se reparte por los m³ de cada cliente
      const its = items.filter(i => i.consolidado_id === m.consolidado_id && i.estado !== 'cancelado')
      const tot = its.reduce((s, i) => s + num(i.cbm), 0) || 1
      const por = {}; its.forEach(i => { por[i.cliente_id] = (por[i.cliente_id] || 0) + num(i.cbm) / tot })
      return Object.entries(por)
    }
    return [[null, 1]]
  }
  const cli = {}
  delMes.forEach(m => {
    if (m.tipo === 'cobro_cliente') { const k = m.cliente_id || 'x'; (cli[k] ||= { id:k, ingreso:0, costo:0 }).ingreso += num(m.monto) }
    if (m.tipo === 'costo_proveedor') clienteDeCosto(m).forEach(([id, p]) => { const k = id || 'x'; (cli[k] ||= { id:k, ingreso:0, costo:0 }).costo += num(m.monto) * p })
  })
  const topClientes = Object.values(cli).filter(c => c.ingreso > 0).map(c => ({ ...c, nombre: c.id === 'x' ? 'Sin cliente' : nombreCli(c.id), margen: c.ingreso - c.costo }))
    .sort((a, b) => b.ingreso - a.ingreso)

  // Rentabilidad por ruta
  const rutas = {}
  const addRuta = (k, tipo, ing, cos) => { (rutas[k] ||= { ruta:k, tipo, ingreso:0, costo:0, n:0 }); rutas[k].ingreso += ing; rutas[k].costo += cos }
  delMes.forEach(m => {
    const ing = m.tipo === 'cobro_cliente' ? num(m.monto) : 0, cos = m.tipo === 'costo_proveedor' ? num(m.monto) : 0
    if (!ing && !cos) return
    if (m.consolidado_id && consDe[m.consolidado_id]) { const c = consDe[m.consolidado_id]; addRuta(`${c.origen} → ${c.destino}`, '🚢', ing, cos) }
    else if (m.servicio_id && srvDe[m.servicio_id]) { const s = srvDe[m.servicio_id]; addRuta(s.origen || s.destino ? `${s.origen || '—'} → ${s.destino || '—'}` : (s.titulo || 'Servicio'), '🚚', ing, cos) }
    else if (m.carga_id && cargaDe[m.carga_id]) { const c = cargaDe[m.carga_id]; addRuta(`${c.origen || 'EE.UU.'} → Barranquilla`, '📦', ing, cos) }
  })
  const listaRutas = Object.values(rutas).map(r => ({ ...r, margen: r.ingreso - r.costo, pct: r.ingreso ? (r.ingreso - r.costo) / r.ingreso * 100 : 0 })).sort((a, b) => b.margen - a.margen)

  // Lo movido
  const cargasMes = cargas.filter(c => (c.fecha_recibo || '').startsWith(mes))
  const consMes = consolidados.filter(c => movs.some(m => m.consolidado_id === c.id && (m.fecha || '').startsWith(mes)) || (c.etd || '').startsWith(mes))
  const m3 = items.filter(i => consMes.some(c => c.id === i.consolidado_id) && i.estado !== 'cancelado').reduce((s, i) => s + num(i.cbm), 0)
  const srvCompletados = servicios.filter(s => s.estado === 'completado' && (s.completado_at || '').slice(0, 7) === mes)
  const srvCotizados = servicios.filter(s => (s.created_at || '').slice(0, 7) === mes)
  const srvAceptados = srvCotizados.filter(s => !['cotizado', 'cancelado'].includes(s.estado))
  const clientesNuevos = clientes.filter(c => (c.created_at || '').slice(0, 7) === mes)
  const clientesActivos = new Set(delMes.filter(m => m.tipo === 'cobro_cliente' && m.cliente_id).map(m => m.cliente_id)).size

  return {
    mes, porLinea, facturado, costos, margenBruto: facturado - costos, gastos, utilidad: facturado - costos - gastos, recaudado, pagado, cartera,
    topClientes, rutas: listaRutas,
    movido: { cargas: cargasMes.length, kg: cargasMes.reduce((s, c) => s + num(c.peso_cobrable_kg || c.peso_kg), 0), consolidados: consMes.length, m3,
      servicios: srvCompletados.length, cotizados: srvCotizados.length, aceptados: srvAceptados.length },
    clientesNuevos: clientesNuevos.length, clientesActivos,
  }
}

// ── Página ──────────────────────────────────────────────────────────────────
export default function Reportes() {
  const { empresa } = useDatosLRM()
  const [B, setB] = useState(null)
  const [mes, setMes] = useState(hoyISO().slice(0, 7))
  const [metas, setMetas] = useState(META_VACIA)
  const [editMetas, setEditMetas] = useState(false)
  useEffect(() => {
    (async () => {
      const q = (t, sel = '*') => supabase.from(t).select(sel).then(r => r.error ? [] : r.data || [])
      const [movs, cargas, consolidados, items, servicios, lineasSrv, clientes, aj] = await Promise.all([
        q('lrm_movimientos'), q('lrm_cargas', 'id,cliente_id,fecha_recibo,peso_kg,peso_cobrable_kg,origen,guia'), q('lrm_consolidados'), q('lrm_consolidado_items', 'id,consolidado_id,cliente_id,cbm,estado'),
        q('lrm_servicios'), q('lrm_servicio_lineas', 'servicio_id,cantidad,precio,costo'), q('lrm_clientes', 'id,nombre,created_at,estado'), q('lrm_ajustes'),
      ])
      setB({ movs, cargas, consolidados, items, servicios, lineasSrv, clientes })
      const m = aj.find(a => a.clave === 'metas'), vieja = aj.find(a => a.clave === 'meta_mensual')
      try { setMetas({ ...META_VACIA, ...(m ? JSON.parse(m.valor) : {}), ...(!m && vieja ? { utilidad: vieja.valor } : {}) }) } catch {}
    })()
  }, [])
  const R = useMemo(() => B && calcularMes(mes, B), [B, mes])
  const A = useMemo(() => B && calcularMes(mesAntes(mes), B), [B, mes])
  const seis = useMemo(() => B ? [5, 4, 3, 2, 1, 0].map(k => { const m = mesAntes(mes, k), r = calcularMes(m, B); return { m, facturado: r.facturado, utilidad: r.utilidad } }) : [], [B, mes])
  const meses = useMemo(() => { const set = new Set([hoyISO().slice(0, 7), ...(B?.movs || []).map(m => (m.fecha || '').slice(0, 7)).filter(Boolean)]); return [...set].sort().reverse() }, [B])

  const guardarMetas = async () => {
    const limpio = Object.fromEntries(Object.entries(metas).map(([k, v]) => [k, String(v).replace(/[^\d.,]/g, '')]))
    await supabase.from('lrm_ajustes').upsert([{ clave:'metas', valor: JSON.stringify(limpio) }, { clave:'meta_mensual', valor: String(Number(String(limpio.utilidad).replace(/\D/g, '')) || 0) }])
    setMetas(limpio); setEditMetas(false)
  }
  if (!R) return <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text3)' }}>Armando el reporte…</div>

  const delta = (a, b) => b ? (a - b) / Math.abs(b) * 100 : null
  const Var = ({ a, b, subirEsMalo }) => { const d = delta(a, b); return d == null ? <span style={{ color:'var(--text4)' }}>sin mes anterior</span> : <span style={{ color: (d >= 0) !== !!subirEsMalo ? 'var(--green)' : 'var(--red)' }}>{d >= 0 ? '▲' : '▼'} {fmt(Math.abs(d), 0)}% vs {MESES[Number(mesAntes(mes).slice(5)) - 1]}</span> }
  const metaN = k => Number(String(metas[k] || '').replace(/\./g, '').replace(',', '.')) || 0
  const avances = [
    ['facturacion', 'Facturación', R.facturado, cop],
    ['utilidad', 'Utilidad', R.utilidad, cop],
    ['clientes_nuevos', 'Clientes nuevos', R.clientesNuevos, v => fmt(v, 0)],
    ['m3', 'm³ consolidados', R.m3 ?? R.movido.m3, v => fmt(v, 1)],
    ['servicios', 'Servicios completados', R.movido.servicios, v => fmt(v, 0)],
  ].map(([k, l, v, f]) => ({ k, l, v: k === 'm3' ? R.movido.m3 : v, f, meta: metaN(k) }))
  const maxBar = Math.max(1, ...seis.map(x => Math.max(x.facturado, Math.abs(x.utilidad))))

  const pdf = () => {
    const filaL = Object.entries(LINEAS).filter(([k]) => R.porLinea[k].ingreso || R.porLinea[k].costo).map(([k, x]) => `<tr><td>${x.icono} ${x.l}</td><td class="n">${cop(R.porLinea[k].ingreso)}</td><td class="n">${cop(R.porLinea[k].costo)}</td><td class="n"><b>${cop(R.porLinea[k].margen)}</b></td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte ${nombreMes(mes)} · ${empresa.nombre}</title><style>
      @page{size:letter;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;font-size:11.5px;margin:0;padding:20px}
      .top{display:flex;justify-content:space-between;border-bottom:2px solid #C9A84C;padding-bottom:10px}.t{text-align:right;font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
      h4{margin:16px 0 6px;font-size:10.5px;letter-spacing:2px;color:#8a6d1f}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.k div{background:#faf7ee;border-radius:8px;padding:9px 11px}
      .k small{display:block;font-size:9.5px;color:#8a8a8a;text-transform:uppercase;letter-spacing:1px}.k b{font-size:15px}
      table{width:100%;border-collapse:collapse}th{text-align:left;font-size:9.5px;text-transform:uppercase;color:#777;padding:6px;border-bottom:1.5px solid #1b1b1b}td{padding:6px;border-bottom:1px solid #f0eadb}.n{text-align:right;white-space:nowrap}
      .cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}</style></head><body>
      <div class="top"><div>${logoDocumentoHTML()}</div><div class="t">REPORTE MENSUAL<div style="font-size:16px;color:#1b1b1b;letter-spacing:0;margin-top:4px;text-transform:capitalize">${nombreMes(mes)}</div></div></div>
      <h4>RESULTADO</h4><div class="k">
        <div><small>Facturado</small><b>${cop(R.facturado)}</b></div><div><small>Costos directos</small><b>${cop(R.costos)}</b></div>
        <div><small>Gastos</small><b>${cop(R.gastos)}</b></div><div><small>Utilidad</small><b>${cop(R.utilidad)}</b></div>
        <div><small>Recaudado</small><b>${cop(R.recaudado)}</b></div><div><small>Pagado a proveedores</small><b>${cop(R.pagado)}</b></div>
        <div><small>Cartera al cierre</small><b>${cop(R.cartera)}</b></div><div><small>Clientes nuevos</small><b>${R.clientesNuevos}</b></div></div>
      <h4>POR LÍNEA DE NEGOCIO</h4><table><thead><tr><th>Línea</th><th class="n">Facturado</th><th class="n">Costo</th><th class="n">Margen</th></tr></thead><tbody>${filaL || '<tr><td colspan="4">Sin movimientos</td></tr>'}</tbody></table>
      <h4>LO MOVIDO</h4><div class="k"><div><small>Cargas recibidas</small><b>${R.movido.cargas}</b> · ${fmt(R.movido.kg, 0)} kg</div><div><small>Consolidados</small><b>${R.movido.consolidados}</b> · ${fmt(R.movido.m3, 1)} m³</div>
        <div><small>Servicios completados</small><b>${R.movido.servicios}</b></div><div><small>Cotizaciones aceptadas</small><b>${R.movido.aceptados} de ${R.movido.cotizados}</b></div></div>
      <div class="cols"><div><h4>MEJORES CLIENTES</h4><table><thead><tr><th>Cliente</th><th class="n">Facturado</th><th class="n">Margen</th></tr></thead><tbody>${R.topClientes.slice(0, 10).map(c => `<tr><td>${c.nombre}</td><td class="n">${cop(c.ingreso)}</td><td class="n">${cop(c.margen)}</td></tr>`).join('') || '<tr><td colspan="3">—</td></tr>'}</tbody></table></div>
      <div><h4>RENTABILIDAD POR RUTA</h4><table><thead><tr><th>Ruta</th><th class="n">Margen</th><th class="n">%</th></tr></thead><tbody>${R.rutas.slice(0, 10).map(r => `<tr><td>${r.tipo} ${r.ruta}</td><td class="n">${cop(r.margen)}</td><td class="n">${fmt(r.pct, 0)}%</td></tr>`).join('') || '<tr><td colspan="3">—</td></tr>'}</tbody></table></div></div>
      ${avances.some(a => a.meta) ? `<h4>METAS</h4><table><tbody>${avances.filter(a => a.meta).map(a => `<tr><td>${a.l}</td><td class="n">${a.f(a.v)} de ${a.f(a.meta)}</td><td class="n"><b>${fmt(a.v / a.meta * 100, 0)}%</b></td></tr>`).join('')}</tbody></table>` : ''}
      <p style="color:#8a6d1f;font-weight:700;text-align:right;margin-top:16px">We bring it. Safe and on time.</p></body></html>`
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close()
  }

  const Tarjeta = ({ l, v, sub, c = 'var(--text)', id }) => (
    <div className="panel" style={{ padding:'12px 14px', minWidth:0 }}>
      <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', fontWeight:700 }}>{l}</div>
      <div id={id} className="rp-kpi" style={{ fontSize:19, fontWeight:800, color:c, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
      {sub && <div style={{ fontSize:11, marginTop:2 }}>{sub}</div>}
    </div>
  )
  const Bloque = ({ t, extra, children }) => (
    <div className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:12, alignItems:'baseline' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)' }}>{t}</div>{extra}
      </div>{children}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <select id="rp-mes" value={mes} onChange={e => setMes(e.target.value)} style={{ ...iStyle, marginTop:0, width:'auto', textTransform:'capitalize' }}>{meses.map(m => <option key={m} value={m}>{nombreMes(m)}</option>)}</select>
        <button id="rp-pdf" onClick={pdf} className="btn-gold" style={{ width:'auto', marginLeft:'auto' }}>📄 Reporte en PDF</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:10 }}>
        <Tarjeta id="rp-facturado" l="Facturado" v={cop(R.facturado)} c="var(--gold)" sub={<Var a={R.facturado} b={A.facturado} />} />
        <Tarjeta l="Costos directos" v={cop(R.costos)} c="var(--red)" sub={<span style={{ color:'var(--text3)' }}>{R.facturado ? `${fmt(R.costos / R.facturado * 100, 0)}% de lo facturado` : '—'}</span>} />
        <Tarjeta l="Gastos operativos" v={cop(R.gastos)} c="var(--red)" sub={<Var a={R.gastos} b={A.gastos} subirEsMalo />} />
        <Tarjeta id="rp-utilidad" l="Utilidad" v={cop(R.utilidad)} c={R.utilidad >= 0 ? 'var(--green)' : 'var(--red)'} sub={<Var a={R.utilidad} b={A.utilidad} />} />
        <Tarjeta l="Recaudado" v={cop(R.recaudado)} sub={<span style={{ color:'var(--text3)' }}>Pagaste {cop(R.pagado)} a proveedores</span>} />
        <Tarjeta l="Cartera al cierre" v={cop(R.cartera)} c={R.cartera ? '#E8A23A' : 'var(--text)'} sub={<span style={{ color:'var(--text3)' }}>{R.clientesActivos} clientes facturados · {R.clientesNuevos} nuevos</span>} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14 }}>
        <Bloque t="POR LÍNEA DE NEGOCIO">
          {Object.entries(LINEAS).map(([k, x]) => {
            const v = R.porLinea[k]; if (!v.ingreso && !v.costo) return null
            return (
              <div key={k} className="rp-linea" style={{ padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:13 }}>
                  <span style={{ color:'var(--text)' }}>{x.icono} {x.l}</span>
                  <b style={{ color: v.margen >= 0 ? 'var(--green)' : 'var(--red)' }}>{cop(v.margen)}</b>
                </div>
                <div style={{ fontSize:11.5, color:'var(--text3)' }}>Facturado {cop(v.ingreso)} · costo {cop(v.costo)}{v.ingreso ? ` · ${fmt(v.margen / v.ingreso * 100, 0)}% de margen` : ''}</div>
              </div>
            )
          })}
          {!R.facturado && !R.costos && <div style={{ fontSize:12, color:'var(--text4)' }}>Sin movimientos en {nombreMes(mes)}.</div>}
        </Bloque>

        <Bloque t="LO QUE MOVISTE">
          {[['📦 Cargas recibidas', `${R.movido.cargas} · ${fmt(R.movido.kg, 0)} kg`], ['🚢 Consolidados', `${R.movido.consolidados} · ${fmt(R.movido.m3, 1)} m³`], ['🚚 Servicios completados', R.movido.servicios],
            ['📝 Cotizaciones de servicio', R.movido.cotizados ? `${R.movido.aceptados} aceptadas de ${R.movido.cotizados} (${fmt(R.movido.aceptados / R.movido.cotizados * 100, 0)}%)` : '—']].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text2)' }}>{l}</span><b style={{ color:'var(--text)' }}>{v}</b>
            </div>
          ))}
        </Bloque>
      </div>

      <Bloque t="METAS DEL MES" extra={<button id="rp-metas" onClick={() => setEditMetas(e => !e)} className="btn" style={{ width:'auto', fontSize:11, padding:'3px 10px' }}>{editMetas ? 'Cancelar' : '🎯 Poner metas'}</button>}>
        {editMetas ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap:10 }}>
              {[['facturacion', 'Facturación ($)'], ['utilidad', 'Utilidad ($)'], ['clientes_nuevos', 'Clientes nuevos'], ['m3', 'm³ consolidados'], ['servicios', 'Servicios completados']].map(([k, l]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div><input id={`rp-meta-${k}`} inputMode="numeric" value={metas[k] || ''} onChange={e => setMetas(p => ({ ...p, [k]: e.target.value }))} style={iStyle} /></div>
              ))}
            </div>
            <button id="rp-metas-guardar" onClick={guardarMetas} className="btn-green" style={{ marginTop:12 }}>Guardar metas</button>
          </>
        ) : !avances.some(a => a.meta) ? <div style={{ fontSize:12.5, color:'var(--text3)' }}>Ponte metas de facturación, utilidad, clientes nuevos, m³ y servicios, y aquí ves cómo vas cada mes.</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap:12 }}>
            {avances.filter(a => a.meta).map(a => {
              const p = Math.min(100, a.v / a.meta * 100)
              return (
                <div key={a.k} className="rp-meta">
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}><span style={{ color:'var(--text2)' }}>{a.l}</span><b style={{ color: p >= 100 ? 'var(--green)' : 'var(--text)' }}>{fmt(a.v / a.meta * 100, 0)}%</b></div>
                  <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.07)', margin:'5px 0', overflow:'hidden' }}><div style={{ width:`${Math.max(0, p)}%`, height:'100%', borderRadius:4, background: p >= 100 ? 'var(--green)' : 'var(--gold)' }} /></div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{a.f(a.v)} de {a.f(a.meta)}{p < 100 ? ` · faltan ${a.f(a.meta - a.v)}` : ' · ✓ cumplida'}</div>
                </div>
              )
            })}
          </div>
        )}
      </Bloque>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14 }}>
        <Bloque t="MEJORES CLIENTES" extra={<span style={{ fontSize:11, color:'var(--text3)' }}>por facturación</span>}>
          {R.topClientes.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>—</div> : R.topClientes.slice(0, 8).map((c, i) => (
            <div key={c.id} className="rp-cliente" style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ width:18, fontSize:12, color:'var(--text4)' }}>{i + 1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:'var(--text)' }}>{c.nombre}</div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', marginTop:4 }}><div style={{ width:`${c.ingreso / R.topClientes[0].ingreso * 100}%`, height:'100%', borderRadius:2, background:'var(--gold)' }} /></div>
              </div>
              <div style={{ textAlign:'right' }}><div style={{ fontSize:12.5, fontWeight:700, color:'var(--text)' }}>{cop(c.ingreso)}</div><div style={{ fontSize:11, color: c.margen >= 0 ? 'var(--green)' : 'var(--red)' }}>gana {cop(c.margen)}</div></div>
            </div>
          ))}
        </Bloque>
        <Bloque t="RENTABILIDAD POR RUTA" extra={<span style={{ fontSize:11, color:'var(--text3)' }}>de mayor a menor ganancia</span>}>
          {R.rutas.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>—</div> : R.rutas.slice(0, 8).map(r => (
            <div key={r.ruta + r.tipo} className="rp-ruta" style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text)' }}>{r.tipo} {r.ruta}</span>
              <span style={{ textAlign:'right' }}><b style={{ color: r.margen >= 0 ? 'var(--green)' : 'var(--red)' }}>{cop(r.margen)}</b><div style={{ fontSize:11, color:'var(--text3)' }}>{fmt(r.pct, 0)}% sobre {cop(r.ingreso)}</div></span>
            </div>
          ))}
        </Bloque>
      </div>

      <Bloque t="ÚLTIMOS 6 MESES" extra={<span style={{ fontSize:11, color:'var(--text3)' }}>pasa el mouse por cada barra</span>}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:18 }}>
          {[['Facturado', 'facturado', 'var(--gold)'], ['Utilidad', 'utilidad', 'var(--green)']].map(([titulo, k, color]) => (
            <div key={k}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>{titulo}</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120, borderBottom:'1px solid var(--border2)' }}>
                {seis.map(x => {
                  const v = x[k], h = Math.max(2, Math.abs(v) / maxBar * 112)
                  return (
                    <div key={x.m} title={`${nombreMes(x.m)}: ${cop(v)}`} className="rp-barra" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', height:'100%', cursor:'default' }}>
                      {x.m === mes && <div style={{ fontSize:10, color:'var(--text)', marginBottom:3, whiteSpace:'nowrap' }}>{millones(v)}</div>}
                      <div style={{ width:'100%', maxWidth:34, height:h, borderRadius:'4px 4px 0 0', background: v < 0 ? 'var(--red)' : color, opacity: x.m === mes ? 1 : 0.55 }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>{seis.map(x => <div key={x.m} style={{ flex:1, textAlign:'center', fontSize:10, color: x.m === mes ? 'var(--text)' : 'var(--text3)' }}>{MESES[Number(x.m.slice(5)) - 1].slice(0, 3)}</div>)}</div>
            </div>
          ))}
        </div>
      </Bloque>
    </div>
  )
}