// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const INGREDIENTES_BASE = ['ZaBun™ (pan top-split)', 'Cream Code™', 'Tocineta Crispy', 'Piña Caramelizada']
const EMPAQUE_DIRECTO = ['Bandeja boat kraft', 'Papel encerado', 'Servilletas x6', 'Sticker ZABÚ']

function costoPromedio(lotes, nombreProducto) {
  const activos = lotes.filter(l => l.producto_nombre === nombreProducto && l.estado === 'activo')
  if (activos.length === 0) return null
  return activos.reduce((s,l)=>s+l.costo_unitario,0) / activos.length
}

// Cuenta items reales dentro del jsonb `items` de cada orden
function contarItems(orden) {
  if (!orden.items || !Array.isArray(orden.items)) return 0
  return orden.items.length
}

export default function ZabuProyeccion() {
  const [ordenes, setOrdenes] = useState([])
  const [lotes, setLotes] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [gasOp, setGasOp] = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data: o }, { data: l }, { data: e }] = await Promise.all([
      supabase.from('ordenes').select('*').order('fecha', { ascending: false }),
      supabase.from('zabu_lotes').select('*'),
      supabase.from('zabu_empleados').select('*').eq('estado', 'activo'),
    ])
    setOrdenes(o || []); setLotes(l || []); setEmpleados(e || [])
    setLoading(false)
  }

  // ── Costo real promedio por hot dog vendido ──
  const costosBase = INGREDIENTES_BASE.map(n => costoPromedio(lotes, n))
  const totalFijo = costosBase.reduce((s,c)=>s+(c||0),0)
  const empaque = EMPAQUE_DIRECTO.reduce((s,n)=>s+(costoPromedio(lotes,n)||0),0)
  const faltaCosto = costosBase.some(c => c === null) || totalFijo === 0
  // Costo promedio de salchicha real (promedio de todas las que existan en inventario)
  const salchichas = [...new Set(lotes.map(l=>l.producto_nombre))].filter(n=>n.toLowerCase().includes('salchicha'))
  const costoSalchichaProm = salchichas.length > 0
    ? salchichas.reduce((s,n)=>s+(costoPromedio(lotes,n)||0),0) / salchichas.length
    : null
  const costoUnidad = (!faltaCosto && costoSalchichaProm !== null) ? Math.round(totalFijo + empaque + costoSalchichaProm) : null

  // ── Ventas reales agrupadas por día de la semana ──
  const ventasPorDiaSemana = {} // { 'Lunes': [total1, total2, ...] }
  DIAS_SEMANA.forEach(d => ventasPorDiaSemana[d] = [])
  const fechasConVenta = new Set()

  ordenes.forEach(o => {
    if (!o.fecha) return
    fechasConVenta.add(o.fecha)
    const fecha = new Date(o.fecha + 'T00:00:00')
    const diaSemana = DIAS_SEMANA[fecha.getDay()]
    if (!ventasPorDiaSemana[diaSemana]) ventasPorDiaSemana[diaSemana] = []
    ventasPorDiaSemana[diaSemana].push(o)
  })

  const diasConData = DIAS_SEMANA.filter(d => ventasPorDiaSemana[d].length > 0)
  const hayDataSuficiente = fechasConVenta.size >= 7 // al menos una semana completa de operación

  // Promedio real de unidades e ingresos por día de semana (si hay data)
  const promediosPorDia = DIAS_SEMANA.map(dia => {
    const ordenesDelDia = ventasPorDiaSemana[dia]
    if (ordenesDelDia.length === 0) return { dia, sinData: true }
    // Agrupar por fecha específica para sacar promedio entre semanas distintas
    const porFecha = {}
    ordenesDelDia.forEach(o => { porFecha[o.fecha] = (porFecha[o.fecha] || { total: 0, items: 0 }); porFecha[o.fecha].total += o.total; porFecha[o.fecha].items += contarItems(o) })
    const fechas = Object.values(porFecha)
    const promTotal = fechas.reduce((s,f)=>s+f.total,0) / fechas.length
    const promItems = fechas.reduce((s,f)=>s+f.items,0) / fechas.length
    return { dia, sinData: false, promTotal, promItems: Math.round(promItems), muestras: fechas.length }
  })

  const totalVentasSemanaReal = promediosPorDia.reduce((s,d)=>s+(d.sinData?0:d.promTotal),0)
  const totalItemsSemanaReal = promediosPorDia.reduce((s,d)=>s+(d.sinData?0:d.promItems),0)
  const diasSinData = promediosPorDia.filter(d=>d.sinData).length

  // ── Gastos reales: personal activo + gasto operativo manual ──
  const nominaSemanal = empleados.reduce((s,e) => {
    if (e.tipo_salario === 'por_dia') return s + (e.salario_actual * 6) // 6 días operativos
    if (e.tipo_salario === 'quincenal') return s + (e.salario_actual / 2)
    if (e.tipo_salario === 'mensual') return s + (e.salario_actual / 4.3)
    return s
  }, 0)
  const gastoOperativoSemanal = parseInt(gasOp) || 0
  const gastosFijosSemanales = nominaSemanal + gastoOperativoSemanal

  const utilidadBrutaReal = costoUnidad !== null ? totalItemsSemanaReal * (totalVentasSemanaReal/Math.max(totalItemsSemanaReal,1) - costoUnidad) : null
  // Más simple y honesto: utilidad = ventas reales - (items reales * costo real) - gastos fijos
  const costoTotalInsumosSemana = costoUnidad !== null ? totalItemsSemanaReal * costoUnidad : null
  const utilidadNetaReal = (costoTotalInsumosSemana !== null) ? (totalVentasSemanaReal - costoTotalInsumosSemana - gastosFijosSemanales) : null

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando datos reales de ventas, costos y personal...</div>

  return (
    <>
      {!hayDataSuficiente && (
        <div style={{ padding:'14px 18px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontSize:13, color:'var(--gold)', marginBottom:20, lineHeight:1.6 }}>
          ⚠️ Todavía no hay suficiente historial de ventas reales ({fechasConVenta.size} día{fechasConVenta.size!==1?'s':''} registrado{fechasConVenta.size!==1?'s':''} en el POS) para proyectar con confianza.
          Esta vista se va llenando automáticamente con cada venta que se registre en el POS — entre más días de operación real tengas, más precisa será la proyección.
        </div>
      )}

      {faltaCosto && (
        <div style={{ padding:'12px 16px', background:'rgba(224,82,82,0.08)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:10, fontSize:12, color:'var(--red)', marginBottom:20 }}>
          ⚠️ Falta costo real de uno o más ingredientes base en Inventario para calcular el costo unitario del ZABÚ. Ve a Costos para ver el detalle.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Días reales registrados', val:String(fechasConVenta.size), color:'var(--text)', sub:'desde que opera el POS' },
          { label:'Ventas promedio/semana', val: totalVentasSemanaReal>0?cop(totalVentasSemanaReal):'Sin datos', color:'var(--gold)', sub:`${totalItemsSemanaReal} items/sem` },
          { label:'Costo real por hot dog', val: costoUnidad!==null?cop(costoUnidad):'Incompleto', color:'var(--text)', sub:'desde Inventario' },
          { label:'Utilidad neta/semana', val: utilidadNetaReal!==null?cop(utilidadNetaReal):'Faltan datos', color: utilidadNetaReal>0?'var(--green)':'var(--red)', sub:'ventas - costos - gastos' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color, fontSize: typeof k.val==='string' && k.val.length>10 ? 16 : 22 }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom:16 }}>
        <div className="panel-title">Promedio real de ventas por día de la semana</div>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>Calculado desde las órdenes reales registradas en el POS — no son números inventados.</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', marginBottom:8 }}>
          {['Día','Muestras','Items prom.','Ventas prom.'].map(h => (
            <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
          ))}
        </div>
        {promediosPorDia.map((d, i) => (
          <div key={d.dia} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize:12, padding:'10px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.dia}</div>
            {d.sinData ? (
              <div style={{ fontSize:11, padding:'10px', color:'var(--text4)', gridColumn:'2 / 5', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>Sin ventas registradas todavía</div>
            ) : (
              <>
                <div style={{ fontSize:12, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.muestras} semana{d.muestras!==1?'s':''}</div>
                <div style={{ fontSize:12, padding:'10px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.promItems}</div>
                <div style={{ fontSize:12, padding:'10px', color:'var(--gold)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{cop(d.promTotal)}</div>
              </>
            )}
          </div>
        ))}
        {totalVentasSemanaReal > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
            <div style={{ fontSize:12, padding:'10px', color:'var(--text)', fontWeight:700 }}>TOTAL SEMANA</div>
            <div style={{ fontSize:12, padding:'10px' }} />
            <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800 }}>{totalItemsSemanaReal}</div>
            <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800 }}>{cop(totalVentasSemanaReal)}</div>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap:14 }}>
        <div className="panel">
          <div className="panel-title">Gastos fijos reales (semanales)</div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Nómina ({empleados.length} empleado{empleados.length!==1?'s':''} activo{empleados.length!==1?'s':''})</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text2)' }}>{cop(nominaSemanal)}</span>
          </div>
          <div style={{ padding:'10px 0' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Gastos operativos semanales (gas, transporte, etc.)</div>
            <input type="number" value={gasOp} onChange={e=>setGasOp(e.target.value)} placeholder="Ingresa el gasto real de esta semana"
              style={{ width:'100%', padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--border)', marginTop:4 }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Total gastos fijos</span>
            <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(gastosFijosSemanales)}</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Resultado real de la semana</div>
          {[
            { label:'Ventas reales',          val: totalVentasSemanaReal,  color:'var(--gold)' },
            { label:'(-) Costo insumos',       val: -(costoTotalInsumosSemana||0), color:'var(--red)' },
            { label:'(-) Gastos fijos',        val: -gastosFijosSemanales,  color:'var(--red)' },
            { label:'Utilidad neta',           val: utilidadNetaReal||0,    color: (utilidadNetaReal||0)>0?'var(--green)':'var(--red)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{cop(r.val)}</span>
            </div>
          ))}
          {utilidadNetaReal !== null && (
            <div style={{ marginTop:10, padding:'12px 14px', background: utilidadNetaReal > 0 ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius:10, border:`1px solid ${utilidadNetaReal > 0 ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}` }}>
              <div style={{ fontSize:11, color: utilidadNetaReal > 0 ? 'var(--green)' : 'var(--red)', marginBottom:4 }}>
                {utilidadNetaReal > 0 ? '✅ Operación rentable con datos reales' : '⚠️ La operación real no cubre gastos esta semana'}
              </div>
              <div style={{ fontSize:20, fontWeight:800, color: utilidadNetaReal > 0 ? 'var(--green)' : 'var(--red)' }}>{cop(utilidadNetaReal)}/semana</div>
            </div>
          )}
        </div>
      </div>

      {diasSinData > 0 && diasSinData < 7 && (
        <div className="panel" style={{ marginTop:14, background:'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.7 }}>
            💡 Tienes {7-diasSinData} de 7 días de la semana con historial real. Los {diasSinData} día{diasSinData!==1?'s':''} restante{diasSinData!==1?'s':''} se sumará{diasSinData===1?'':'n'} automáticamente al promedio en cuanto registres ventas en el POS ese día.
          </div>
        </div>
      )}
    </>
  )
}
