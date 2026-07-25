// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }
function colorStock(pct) { if (pct < 20) return 'var(--red)'; if (pct < 50) return 'var(--gold)'; return 'var(--green)' }
function labelStock(pct)  { if (pct < 20) return 'Crítico'; if (pct < 50) return 'Bajo'; return 'OK' }

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO REAL — copiado exactamente del POS (ZabuPOS.jsx). Cuando cambies
// un precio en el POS, actualízalo aquí también para mantener sincronía.
// Próximo paso: mover a catalogo.js compartido para evitar duplicación.
// ════════════════════════════════════════════════════════════════════════════
const MENU = {
  hotdog: [
    { nombre:'ZABÚ', emoji:'🌭', precioSolo:18000, precioCombo:25000,
      desc:'Pan ZaBún · 6 salchichas · 4 quesos · Cream Code™ · Piña · Papa chongo' },
  ],
  burgers: [
    { nombre:'Classic Burger Z',  emoji:'🍔', precio:25000, precioCombo:32000, desc:'Blend ZABÚ · Cream Code · Cheddar · Lechuga · Mayo ajo' },
    { nombre:'Hawaii',            emoji:'🍔', precio:25000, precioCombo:32000, desc:'Blend ZABÚ · Cheddar · Piña caramelizada · Mayo ajo'    },
    { nombre:'CheesBurger Z',     emoji:'🧀', precio:23000, precioCombo:30000, desc:'Blend ZABÚ · Cheddar · Salsa ZABÚ'                       },
    { nombre:'CheesBurger Doble', emoji:'🧀', precio:31000, precioCombo:38000, desc:'Doble Blend ZABÚ · Doble cheddar · Salsa ZABÚ'           },
  ],
  sides: [
    { nombre:'Salchipapa ZABÚ', emoji:'🍟', precio:29000, desc:'2 salchichas · papas · queso rayado · piña · tocineta · salsas · perejil' },
    { nombre:'Fries',           emoji:'🥔', precio:7000,  desc:'Papa + sazonador ZABÚ' },
    { nombre:'Fries ZABÚ',      emoji:'🍟', precio:10000, desc:'Papa + sazonador + tocineta crispy + Cream Code™' },
  ],
  kids: [
    { nombre:'Mini Hot Dog', emoji:'🌭', precio:18000, desc:'Salchicha · pan · queso · salsas · papas · Hit 200ml · sorpresa' },
    { nombre:'Mini Burger',  emoji:'🍔', precio:18000, desc:'Carne · pan · queso · salsas · papas · Hit 200ml · sorpresa'    },
    { nombre:'Nuggets x8',   emoji:'🍗', precio:18000, desc:'8 nuggets · papas · Hit 200ml · sorpresa'                       },
  ],
  granizados: [
    { nombre:'Luna Azul',   emoji:'🧊', precio:20000, desc:'Maracuyá + Whisky · 500ml' },
    { nombre:'Código Rojo', emoji:'🧊', precio:20000, desc:'Fruit Punch + Ron · 500ml'  },
    { nombre:'Blend',       emoji:'🧊', precio:20000, desc:'Luna Azul + Código Rojo · 500ml' },
  ],
  paletas: [
    { nombre:'Frutos Rojos',   emoji:'🍡', precio:7000 },
    { nombre:'Mango',          emoji:'🍡', precio:7000 },
    { nombre:'Cookies & Cream',emoji:'🍡', precio:7000 },
    { nombre:'Chocolate Belga',emoji:'🍡', precio:7000 },
  ],
  extras: [
    { nombre:'Extra Shot',        emoji:'🥃', precio:7000  },
    { nombre:'Tocineta crispy',   emoji:'🥓', precio:3000  },
    { nombre:'Piña caramelizada', emoji:'🍍', precio:2000  },
    { nombre:'Queso Cheddar',     emoji:'🧀', precio:3000  },
  ],
  bebidas: [
    { nombre:'Gaseosas 350ml',  emoji:'🥤', precio:4000 },
    { nombre:'Té Hatsu 400ml',  emoji:'🍵', precio:6000 },
    { nombre:'Agua MS 500ml',   emoji:'💧', precio:4000 },
  ],
}

const TABS = [
  { id:'hotdog',     label:'🌭 Hot Dog'   },
  { id:'burgers',    label:'🍔 Burgers'   },
  { id:'sides',      label:'🍟 Sides'     },
  { id:'kids',       label:'🎈 Kids'      },
  { id:'granizados', label:'🧊 Granizados'},
  { id:'paletas',    label:'🍡 Paletas'   },
  { id:'bebidas',    label:'🥤 Bebidas'   },
]

export default function ZabuDashboard() {
  const [inventario, setInventario] = useState([])
  const [ordenesHoy, setOrdenesHoy] = useState([])
  const [turnos,     setTurnos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editando,   setEditando]   = useState(null)
  const [tabMenu,    setTabMenu]    = useState('hotdog')

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:inv }, { data:ords }, { data:trns }] = await Promise.all([
      supabase.from('zabu_inventario').select('*').order('categoria'),
      supabase.from('ordenes').select('total, carrito_id, items').eq('fecha', hoy),
      supabase.from('turnos').select('carrito_id, estado, operador_nombre').eq('fecha', hoy),
    ])
    if (inv)  setInventario(inv)
    if (ords) setOrdenesHoy(ords)
    if (trns) setTurnos(trns)
    setLoading(false)
  }

  const actualizarStock = async (id, nuevoValor) => {
    const valor = Math.max(0, parseInt(nuevoValor) || 0)
    setInventario(prev => prev.map(i => i.id===id ? {...i, stock_actual:valor} : i))
    await supabase.from('zabu_inventario').update({ stock_actual:valor, updated_at:new Date().toISOString() }).eq('id', id)
    setEditando(null)
  }

  // Cálculos reales
  const ventasHoy   = ordenesHoy.reduce((s,o) => s+(o.total||0), 0)
  const totalOrds   = ordenesHoy.length
  const metaDiaria  = 36
  const perrosHoy   = ordenesHoy.reduce((s,o) => {
    if (!o.items) return s
    const its = Array.isArray(o.items) ? o.items : JSON.parse(o.items||'[]')
    return s + its.reduce((si,it) => si+(it.cantidad||1), 0)
  }, 0)

  const salchichas   = inventario.filter(i => i.categoria === 'salchicha')
  const precioBase   = 18000
  const foodCostProm = salchichas.length > 0
    ? (salchichas.reduce((s,it)=>s+it.costo_unitario,0) / salchichas.length / precioBase * 100).toFixed(1)
    : '—'

  const alertas = inventario.map(item => {
    const pct = item.stock_maximo > 0 ? (item.stock_actual/item.stock_maximo)*100 : 0
    if (pct >= 50) return null
    return {
      txt:   pct < 20 ? `${item.nombre} — stock crítico (${Math.round(pct)}%). Compra urgente`
                      : `${item.nombre} — stock bajo (${Math.round(pct)}%). Reponer esta semana`,
      color: pct < 20 ? 'var(--red)' : 'var(--gold)',
      tipo:  pct < 20 ? 'Crítico' : 'Atención',
    }
  }).filter(Boolean)

  const carritos = ['C01','C02','C03'].map(id => {
    const t = turnos.find(t => t.carrito_id === id)
    return {
      id, nombre:`Carrito ${id.slice(1)}`,
      ubicacion: t ? (t.operador_nombre || 'Operando') : 'Por definir',
      activo: t && t.estado === 'abierto',
    }
  })

  const salchichasConMargen = salchichas.map(s => ({
    ...s,
    margen: ((precioBase - s.costo_unitario) / precioBase * 100).toFixed(1)
  }))

  const invCateg = inventario.filter(i => i.categoria !== 'salchicha')

  // Items del tab activo
  const tabItems = MENU[tabMenu] || []

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',      val:loading?'...':cop(ventasHoy), color:'var(--gold)',  sub:`${totalOrds} órdenes · ${perrosHoy} items` },
          { label:'Meta diaria',     val:`${perrosHoy}/${metaDiaria}`, color:'var(--text)', sub:'perros · punto equilibrio' },
          { label:'Food cost prom.', val:`${foodCostProm}%`,           color:'var(--green)',sub:'Calculado del inventario' },
          { label:'Alertas',         val:alertas.length, color:alertas.length>0?'var(--red)':'var(--green)', sub:alertas.length>0?'Revisar inventario':'Todo en orden' },
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

        {/* Carritos */}
        <div className="panel">
          <div className="panel-title">Carritos</div>
          {carritos.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c.activo?'var(--green)':'#333', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{c.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{c.ubicacion}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color:c.activo?'var(--green)':'#444' }}>
                {c.activo ? 'Operando' : 'Sin turno'}
              </div>
            </div>
          ))}
        </div>

        {/* Menú activo — 100% dinámico del catálogo real */}
        <div className="panel">
          <div className="panel-title">Menú activo</div>

          {/* Tabs scrollables */}
          <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
            {TABS.map(t => (
              <div key={t.id} onClick={() => setTabMenu(t.id)} style={{
                padding:'5px 10px', borderRadius:8, cursor:'pointer', fontSize:10, fontWeight:700, flexShrink:0, whiteSpace:'nowrap',
                background: tabMenu===t.id ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
                border:`1px solid ${tabMenu===t.id ? 'var(--gold-border)' : 'var(--border)'}`,
                color: tabMenu===t.id ? 'var(--gold)' : 'var(--text3)',
              }}>{t.label}</div>
            ))}
          </div>

          {/* Items del tab */}
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {tabItems.map((m, i) => (
              <div key={i} style={{ padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{m.emoji} {m.nombre}</span>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>
                      {cop(m.precioSolo || m.precio)}
                    </div>
                    {m.precioCombo && (
                      <div style={{ fontSize:10, color:'var(--text3)' }}>Combo {cop(m.precioCombo)}</div>
                    )}
                  </div>
                </div>
                {m.desc && <div style={{ fontSize:9, color:'var(--text4)', lineHeight:1.4 }}>{m.desc}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Salchichas con margen real desde inventario */}
        <div className="panel">
          <div className="panel-title">Salchichas disponibles</div>
          {loading
            ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
            : salchichasConMargen.length === 0
              ? <div style={{ fontSize:12, color:'var(--text4)', padding:'10px 0' }}>Sin salchichas en inventario</div>
              : salchichasConMargen.map(s => (
                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{s.nombre.replace('Salchicha ','')}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Costo: {cop(s.costo_unitario)}/ud</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{s.margen}%</div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Bottom */}
      <div className="grid-2">
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Inventario — estado</div>
            <div style={{ fontSize:10, color:'var(--text4)' }}>Click en el número para editar</div>
          </div>
          {loading
            ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
            : invCateg.length === 0
              ? <div style={{ fontSize:12, color:'var(--text4)', padding:'10px 0' }}>Sin items en inventario</div>
              : invCateg.map(item => {
                const pct = item.stock_maximo > 0 ? (item.stock_actual/item.stock_maximo)*100 : 0
                return (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, color:'var(--text2)', flex:1 }}>{item.nombre}</div>
                    <div style={{ flex:1, background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden' }}>
                      <div style={{ height:4, borderRadius:2, width:`${Math.min(100,pct)}%`, background:colorStock(pct) }} />
                    </div>
                    {editando === item.id ? (
                      <input type="number" autoFocus defaultValue={item.stock_actual}
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
              })
          }
        </div>

        <div className="panel">
          <div className="panel-title">Alertas pendientes</div>
          {loading
            ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
            : alertas.length === 0
              ? <div style={{ fontSize:12, color:'var(--green)', padding:'10px 0' }}>✅ Sin alertas — inventario en buen estado</div>
              : alertas.map((a, i) => (
                <div key={i} className="alert-row" style={{ borderColor:`${a.color}22` }}>
                  <div className="alert-dot" style={{ background:a.color }} />
                  <div className="alert-txt">{a.txt}</div>
                  <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:8, background:`${a.color}22`, color:a.color, flexShrink:0 }}>{a.tipo}</div>
                </div>
              ))
          }
        </div>
      </div>
    </>
  )
}
