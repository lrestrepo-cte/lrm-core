// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

function colorStock(pct) {
  if (pct < 20) return 'var(--red)'
  if (pct < 50) return 'var(--gold)'
  return 'var(--green)'
}
function labelStock(pct) {
  if (pct < 20) return 'Crítico'
  if (pct < 50) return 'Bajo'
  return 'OK'
}

const MENU_BASE = [
  { nombre:'ZABÚ',     solo:17000, combo:20000 },
  { nombre:'CheeZabú', solo:19000, combo:22000 },
]
const EXTRAS_BASE = [
  { nombre:'Queso extra', precio:3000 },
  { nombre:'Tocineta extra', precio:3000 },
  { nombre:'Piña extra', precio:2000 },
]

export default function ZabuDashboard() {
  const [inventario, setInventario] = useState([])
  const [ordenesHoy, setOrdenesHoy] = useState([])
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // id del item en edición inline

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:inv }, { data:ords }, { data:trns }] = await Promise.all([
      supabase.from('zabu_inventario').select('*').order('categoria'),
      supabase.from('ordenes').select('total, carrito_id, items').eq('fecha', hoy),
      supabase.from('turnos').select('carrito_id, estado, operador_nombre').eq('fecha', hoy),
    ])
    if (inv) setInventario(inv)
    if (ords) setOrdenesHoy(ords)
    if (trns) setTurnos(trns)
    setLoading(false)
  }

  const actualizarStock = async (id, nuevoValor) => {
    const valor = Math.max(0, parseInt(nuevoValor) || 0)
    setInventario(prev => prev.map(i => i.id===id ? { ...i, stock_actual:valor } : i))
    await supabase.from('zabu_inventario').update({ stock_actual: valor, updated_at: new Date().toISOString() }).eq('id', id)
    setEditando(null)
  }

  // ── Cálculos derivados — nada hardcodeado ──
  const ventasHoy   = ordenesHoy.reduce((s,o)=>s+(o.total||0),0)
  const totalOrdenes = ordenesHoy.length

  const metaDiaria = 36 // perros — referencia fija del plan de negocio, no de ventas
  const totalPerrosVendidos = ordenesHoy.reduce((s,o) => {
    if (!o.items) return s
    const items = Array.isArray(o.items) ? o.items : (typeof o.items==='string' ? JSON.parse(o.items) : [])
    return s + items.reduce((si,it)=>si+(it.cantidad||1),0)
  }, 0)

  // Alertas automáticas calculadas del inventario real — sin tabla extra
  const alertas = inventario
    .map(item => {
      const pct = item.stock_maximo>0 ? (item.stock_actual/item.stock_maximo)*100 : 0
      if (pct >= 50) return null
      return {
        txt: pct < 20
          ? `${item.nombre} — stock crítico (${Math.round(pct)}%). Compra urgente`
          : `${item.nombre} — stock bajo (${Math.round(pct)}%). Reponer esta semana`,
        color: pct < 20 ? 'var(--red)' : 'var(--gold)',
        tipo: pct < 20 ? 'Crítico' : 'Atención',
      }
    })
    .filter(Boolean)

  // Carritos a partir de turnos reales de hoy (si no hay turno, se muestra próximo)
  const CARRITOS_BASE = ['C01','C02','C03']
  const carritos = CARRITOS_BASE.map(id => {
    const turno = turnos.find(t=>t.carrito_id===id)
    return {
      id, nombre: `Carrito ${id.slice(1)}`,
      ubicacion: turno ? (turno.operador_nombre || 'Operando') : 'Por definir',
      estado: turno && turno.estado==='abierto' ? 'activo' : 'inactivo',
    }
  })

  // Salchichas con margen real calculado desde el inventario (si tiene precio de venta definido en el menú, se usa precio promedio)
  const salchichas = inventario.filter(i => i.categoria === 'salchicha')
  const precioVentaPromedio = (MENU_BASE[0].solo + MENU_BASE[1].solo) / 2
  const salchichasConMargen = salchichas.map(s => {
    const margen = precioVentaPromedio > 0 ? ((precioVentaPromedio - s.costo_unitario) / precioVentaPromedio) * 100 : 0
    return { ...s, margen: margen.toFixed(1) }
  })

  const foodCostPromedio = salchichas.length > 0
    ? (salchichas.reduce((s,it)=>s+it.costo_unitario,0) / salchichas.length / precioVentaPromedio * 100).toFixed(1)
    : '—'

  const inventarioPorCategoria = inventario.filter(i => i.categoria !== 'salchicha')

  return (
    <>
      {/* KPIs reales */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',  val: loading?'...':cop(ventasHoy), color:'var(--gold)',  sub: loading?'':`${totalOrdenes} órdenes · ${totalPerrosVendidos} perros` },
          { label:'Meta diaria', val:`${totalPerrosVendidos}/${metaDiaria}`, color:'var(--text)', sub:'perros · punto equilibrio' },
          { label:'Food cost prom.', val: `${foodCostPromedio}%`, color:'var(--green)', sub:'Calculado del inventario' },
          { label:'Alertas',     val: alertas.length, color: alertas.length>0?'var(--red)':'var(--green)', sub: alertas.length>0?'Revisar inventario':'Todo en orden' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ marginBottom:16 }}>
        {/* Carritos — desde turnos reales */}
        <div className="panel">
          <div className="panel-title">Carritos</div>
          {carritos.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: c.estado === 'activo' ? 'var(--green)' : '#333', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{c.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{c.ubicacion}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color: c.estado === 'activo' ? 'var(--green)' : '#333' }}>
                {c.estado === 'activo' ? 'Operando' : 'Sin turno hoy'}
              </div>
            </div>
          ))}
        </div>

        {/* Menú — referencia fija del plan, no de ventas (esto es precio de lista, no dato operativo) */}
        <div className="panel">
          <div className="panel-title">Menú activo</div>
          {MENU_BASE.map(m => (
            <div key={m.nombre} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.nombre}</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(m.solo)}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Combo: {cop(m.combo)}</div>
            </div>
          ))}
          <div style={{ padding:'10px 0' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Extras</div>
            {EXTRAS_BASE.map(e => (
              <div key={e.nombre} style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{e.nombre}</span>
                <span style={{ fontSize:12, color:'var(--text2)' }}>+{cop(e.precio)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Salchichas — costo y margen real desde Supabase */}
        <div className="panel">
          <div className="panel-title">Salchichas disponibles</div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
          : salchichasConMargen.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)', padding:'10px 0' }}>Sin salchichas en inventario</div>
          : salchichasConMargen.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{s.nombre.replace('Salchicha ','')}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Costo: {cop(s.costo_unitario)}/ud</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{s.margen}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid-2">
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Inventario — estado</div>
            <div style={{ fontSize:10, color:'var(--text4)' }}>Click en el número para editar</div>
          </div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
          : inventarioPorCategoria.map(item => {
            const pct = item.stock_maximo>0 ? (item.stock_actual/item.stock_maximo)*100 : 0
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, color:'var(--text2)', flex:1 }}>{item.nombre}</div>
                <div style={{ flex:1, background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden' }}>
                  <div style={{ height:4, borderRadius:2, width:`${Math.min(100,pct)}%`, background:colorStock(pct) }} />
                </div>
                {editando === item.id ? (
                  <input
                    type="number" autoFocus defaultValue={item.stock_actual}
                    onBlur={e => actualizarStock(item.id, e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') actualizarStock(item.id, e.target.value) }}
                    style={{ width:50, fontSize:11, padding:'2px 4px', borderRadius:5, background:'rgba(255,255,255,0.08)', border:'1px solid var(--gold-border)', color:'var(--text)', textAlign:'right' }}
                  />
                ) : (
                  <div onClick={() => setEditando(item.id)} style={{ fontSize:10, fontWeight:600, minWidth:44, textAlign:'right', color:colorStock(pct), cursor:'pointer' }}>
                    {labelStock(pct)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="panel">
          <div className="panel-title">Alertas pendientes</div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
          : alertas.length === 0 ? <div style={{ fontSize:12, color:'var(--green)', padding:'10px 0' }}>✅ Sin alertas — inventario en buen estado</div>
          : alertas.map((a, i) => (
            <div key={i} className="alert-row" style={{ borderColor:`${a.color}22` }}>
              <div className="alert-dot" style={{ background:a.color }} />
              <div className="alert-txt">{a.txt}</div>
              <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:8, background:`${a.color}22`, color:a.color, flexShrink:0 }}>{a.tipo}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
