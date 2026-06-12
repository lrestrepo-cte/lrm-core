import { useState } from 'react'

function cop(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

const PEPS_DATA = [
  {
    id: 'zabu',
    nombre: 'ZABÚ',
    emoji: '🌭',
    precioVenta: 17000,
    foodCostMax: 45,
    ingredientes: [
      { id:1, nombre:'ZaBun™ (pan top-split)',       gramaje:'160g',   unidad:'ud',       cantidad:1,    costoUd:1000,  categoria:'Pan'      },
      { id:2, nombre:'TurkeyLink™ — Pavo',           gramaje:'90g',    unidad:'ud',       cantidad:1,    costoUd:3700,  categoria:'Proteína' },
      { id:3, nombre:'Cream Code™',                  gramaje:'26ml',   unidad:'pulsación',cantidad:1,    costoUd:700,   categoria:'Salsa'    },
      { id:4, nombre:'Tocineta Crispy',              gramaje:'15g',    unidad:'porción',  cantidad:1,    costoUd:600,   categoria:'Proteína' },
      { id:5, nombre:'Piña Caramelizada',            gramaje:'20g',    unidad:'porción',  cantidad:1,    costoUd:400,   categoria:'Topping'  },
      { id:6, nombre:'Mantequilla ZaBun Seal™',      gramaje:'6g',     unidad:'porción',  cantidad:1,    costoUd:60,    categoria:'Lácteo'   },
      { id:7, nombre:'Bandeja boat kraft',           gramaje:'—',      unidad:'ud',       cantidad:1,    costoUd:400,   categoria:'Empaque'  },
      { id:8, nombre:'Papel encerado',               gramaje:'—',      unidad:'lámina',   cantidad:1,    costoUd:100,   categoria:'Empaque'  },
      { id:9, nombre:'Servilletas x6',               gramaje:'—',      unidad:'set',      cantidad:1,    costoUd:240,   categoria:'Empaque'  },
      { id:10,nombre:'Sticker ZABÚ',                 gramaje:'—',      unidad:'ud',       cantidad:1,    costoUd:120,   categoria:'Empaque'  },
    ]
  },
  {
    id: 'cheezabu',
    nombre: 'CheeZabú',
    emoji: '🧀',
    precioVenta: 19000,
    foodCostMax: 50,
    ingredientes: [
      { id:1, nombre:'ZaBun™ (pan top-split)',       gramaje:'160g',   unidad:'ud',       cantidad:1,    costoUd:1000,  categoria:'Pan'      },
      { id:2, nombre:'TurkeyLink™ — Pavo',           gramaje:'90g',    unidad:'ud',       cantidad:1,    costoUd:3700,  categoria:'Proteína' },
      { id:3, nombre:'Queso Cheddar',                gramaje:'20g',    unidad:'porción',  cantidad:1,    costoUd:1000,  categoria:'Queso'    },
      { id:4, nombre:'Cream Code™',                  gramaje:'26ml',   unidad:'pulsación',cantidad:1,    costoUd:700,   categoria:'Salsa'    },
      { id:5, nombre:'Tocineta Crispy',              gramaje:'15g',    unidad:'porción',  cantidad:1,    costoUd:600,   categoria:'Proteína' },
      { id:6, nombre:'Piña Caramelizada',            gramaje:'20g',    unidad:'porción',  cantidad:1,    costoUd:400,   categoria:'Topping'  },
      { id:7, nombre:'Mantequilla ZaBun Seal™',      gramaje:'6g',     unidad:'porción',  cantidad:1,    costoUd:60,    categoria:'Lácteo'   },
      { id:8, nombre:'Bandeja boat kraft',           gramaje:'—',      unidad:'ud',       cantidad:1,    costoUd:400,   categoria:'Empaque'  },
      { id:9, nombre:'Papel encerado',               gramaje:'—',      unidad:'lámina',   cantidad:1,    costoUd:100,   categoria:'Empaque'  },
      { id:10,nombre:'Servilletas x6',               gramaje:'—',      unidad:'set',      cantidad:1,    costoUd:240,   categoria:'Empaque'  },
      { id:11,nombre:'Sticker ZABÚ',                 gramaje:'—',      unidad:'ud',       cantidad:1,    costoUd:120,   categoria:'Empaque'  },
    ]
  },
]

const CATEGORIA_COLORS = {
  Pan:      '#C9A84C',
  Proteína: '#4caf50',
  Salsa:    '#378ADD',
  Topping:  '#9C27B0',
  Queso:    '#FF9800',
  Lácteo:   '#00BCD4',
  Empaque:  '#666',
}

export default function ZabuPEPS() {
  const [sel, setSel]           = useState(PEPS_DATA[0])
  const [editando, setEditando] = useState(null)
  const [costoEdit, setCostoEdit] = useState('')

  const costoTotal    = sel.ingredientes.reduce((s, i) => s + (i.costoUd * i.cantidad), 0)
  const utilidad      = sel.precioVenta - costoTotal
  const foodCost      = ((costoTotal / sel.precioVenta) * 100).toFixed(1)
  const margen        = ((utilidad / sel.precioVenta) * 100).toFixed(1)
  const alerta        = parseFloat(foodCost) > sel.foodCostMax

  const porCategoria  = sel.ingredientes.reduce((acc, ing) => {
    acc[ing.categoria] = (acc[ing.categoria] || 0) + ing.costoUd * ing.cantidad
    return acc
  }, {})

  const guardarCosto = (ingId) => {
    const nuevo = parseInt(costoEdit)
    if (!nuevo || nuevo <= 0) { setEditando(null); return }
    setSel(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map(i =>
        i.id === ingId ? { ...i, costoUd: nuevo } : i
      )
    }))
    setEditando(null); setCostoEdit('')
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Costo total',    val:cop(costoTotal), color:'var(--text)',  sub:`${sel.ingredientes.length} ingredientes` },
          { label:'Precio venta',   val:cop(sel.precioVenta), color:'var(--gold)', sub:'precio oficial' },
          { label:'Food cost',      val:foodCost+'%',    color: alerta ? 'var(--red)' : 'var(--green)', sub:`máx ${sel.foodCostMax}% ${alerta ? '⚠️ EXCEDIDO' : '✅ OK'}` },
          { label:'Margen',         val:margen+'%',      color: parseFloat(margen) >= 50 ? 'var(--green)' : 'var(--gold)', sub:cop(utilidad)+' por unidad' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Alerta food cost */}
      {alerta && (
        <div style={{ padding:'12px 16px', background:'var(--red-dim)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:10, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
          <span style={{ fontSize:13, color:'var(--red)', fontWeight:600 }}>
            ⚠️ Food cost {foodCost}% supera el máximo permitido de {sel.foodCostMax}%. Revisa los costos de ingredientes.
          </span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16, alignItems:'start' }}>

        {/* Selector producto */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="panel">
            <div className="panel-title">Productos</div>
            {PEPS_DATA.map(p => {
              const ct = p.ingredientes.reduce((s,i) => s+i.costoUd*i.cantidad, 0)
              const fc = ((ct/p.precioVenta)*100).toFixed(1)
              const al = parseFloat(fc) > p.foodCostMax
              return (
                <div key={p.id} onClick={() => setSel(p)} style={{
                  padding:'12px 14px', borderRadius:10, cursor:'pointer', marginBottom:8,
                  background: sel.id===p.id ? 'var(--gold-dim)' : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${sel.id===p.id ? 'var(--gold-border)' : 'var(--border)'}`,
                  transition:'all .15s',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:22 }}>{p.emoji}</span>
                    <span style={{ fontSize:14, fontWeight:700, color: sel.id===p.id ? 'var(--gold)' : 'var(--text)' }}>{p.nombre}</span>
                    {al && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:6, background:'var(--red-dim)', color:'var(--red)', border:'0.5px solid rgba(224,82,82,0.3)' }}>FC ALTO</span>}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'var(--text3)' }}>Costo: <span style={{ color:'var(--text2)', fontWeight:600 }}>{cop(ct)}</span></span>
                    <span style={{ color: al ? 'var(--red)' : 'var(--green)', fontWeight:700 }}>{fc}% FC</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desglose por categoría */}
          <div className="panel">
            <div className="panel-title">Costo por categoría</div>
            {Object.entries(porCategoria).sort((a,b) => b[1]-a[1]).map(([cat, total]) => (
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:CATEGORIA_COLORS[cat]||'#888' }} />
                    <span style={{ color:'var(--text2)' }}>{cat}</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ color:'var(--text3)' }}>{((total/costoTotal)*100).toFixed(1)}%</span>
                    <span style={{ color:'var(--gold)', fontWeight:700 }}>{cop(total)}</span>
                  </div>
                </div>
                <div className="prog-wrap" style={{ height:4 }}>
                  <div className="prog-fill" style={{ width:`${(total/costoTotal)*100}%`, background:CATEGORIA_COLORS[cat]||'#888', height:4 }} />
                </div>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Costo total</span>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(costoTotal)}</span>
            </div>
          </div>
        </div>

        {/* Tabla PEP */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Header */}
          <div className="panel">
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:48 }}>{sel.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-0.5, marginBottom:4 }}>{sel.nombre}</div>
                <div style={{ display:'flex', gap:24 }}>
                  {[
                    { label:'INGREDIENTES', val:sel.ingredientes.length },
                    { label:'COSTO',        val:cop(costoTotal)         },
                    { label:'FOOD COST',    val:foodCost+'%'            },
                    { label:'MARGEN',       val:margen+'%'              },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:1, marginBottom:3 }}>{s.label}</div>
                      <div style={{ fontSize:15, fontWeight:700, color: s.label==='FOOD COST' ? (alerta ? 'var(--red)' : 'var(--green)') : s.label==='MARGEN' ? 'var(--green)' : 'var(--text)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla ingredientes editable */}
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Ficha técnica PEP — toca el costo para editar</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Actualiza precios reales aquí</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
              {['Ingrediente','Categoría','Gramaje','Cantidad','Costo/ud'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {sel.ingredientes.map((ing, i) => (
              <div key={ing.id} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:12, padding:'9px 10px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:CATEGORIA_COLORS[ing.categoria]||'#888', flexShrink:0 }} />
                  {ing.nombre}
                </div>
                <div style={{ fontSize:11, padding:'9px 10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{ing.categoria}</div>
                <div style={{ fontSize:11, padding:'9px 10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{ing.gramaje}</div>
                <div style={{ fontSize:11, padding:'9px 10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{ing.cantidad} {ing.unidad}</div>
                <div style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  {editando === ing.id ? (
                    <div style={{ display:'flex', gap:4 }}>
                      <input
                        type="number"
                        value={costoEdit}
                        onChange={e => setCostoEdit(e.target.value)}
                        autoFocus
                        style={{ width:70, padding:'4px 8px', borderRadius:6, background:'rgba(255,255,255,0.1)', border:'1px solid var(--gold-border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }}
                      />
                      <div onClick={() => guardarCosto(ing.id)} style={{ width:24, height:24, borderRadius:6, background:'var(--green-dim)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--green)' }}>✓</div>
                      <div onClick={() => setEditando(null)} style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text3)' }}>✕</div>
                    </div>
                  ) : (
                    <div onClick={() => { setEditando(ing.id); setCostoEdit(String(ing.costoUd)) }} style={{ fontSize:13, fontWeight:700, color:'var(--gold)', cursor:'pointer', padding:'3px 0' }}>
                      {cop(ing.costoUd)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
              <div style={{ fontSize:13, padding:'10px', color:'var(--text)', fontWeight:800, gridColumn:'1/5' }}>COSTO TOTAL POR UNIDAD</div>
              <div style={{ fontSize:16, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(costoTotal)}</div>
            </div>
          </div>

          {/* Simulador precio */}
          <div className="panel">
            <div className="panel-title">Simulador de precio</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[17000,18000,19000,20000,21000,22000].map(pv => {
                const fc = ((costoTotal/pv)*100).toFixed(1)
                const mg = (((pv-costoTotal)/pv)*100).toFixed(1)
                const ok = parseFloat(fc) <= sel.foodCostMax
                return (
                  <div key={pv} style={{ background: pv===sel.precioVenta ? 'var(--gold-dim)' : 'var(--bg4)', borderRadius:10, padding:'12px 14px', border:`1px solid ${pv===sel.precioVenta ? 'var(--gold-border)' : 'var(--border)'}` }}>
                    <div style={{ fontSize:16, fontWeight:800, color: pv===sel.precioVenta ? 'var(--gold)' : 'var(--text)', marginBottom:4 }}>{cop(pv)}</div>
                    <div style={{ fontSize:11, color: ok ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>FC: {fc}%</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Margen: {mg}%</div>
                    {pv===sel.precioVenta && <div style={{ fontSize:9, color:'var(--gold)', marginTop:4, fontWeight:600 }}>PRECIO ACTUAL</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}