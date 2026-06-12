import { useState } from 'react'

function diasRestantes(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0,0,0,0)
  const venc = new Date(fecha)
  return Math.ceil((venc - hoy) / (1000*60*60*24))
}

function colorDias(d) {
  if (d === null) return 'var(--text4)'
  if (d <= 0)  return 'var(--red)'
  if (d <= 2)  return 'var(--red)'
  if (d <= 5)  return 'var(--gold)'
  return 'var(--green)'
}

function bgDias(d) {
  if (d === null) return 'transparent'
  if (d <= 2)  return 'rgba(224,82,82,0.06)'
  if (d <= 5)  return 'rgba(201,168,76,0.06)'
  return 'transparent'
}

function labelDias(d) {
  if (d === null) return '—'
  if (d < 0)   return `Vencido hace ${Math.abs(d)}d`
  if (d === 0) return '¡Vence HOY!'
  if (d === 1) return 'Vence mañana'
  return `${d} días`
}

function tipoBadge(d) {
  if (d === null) return null
  if (d <= 0)  return { label:'VENCIDO',  bg:'var(--red-dim)',   color:'var(--red)',   border:'rgba(224,82,82,0.3)' }
  if (d <= 2)  return { label:'CRÍTICO',  bg:'var(--red-dim)',   color:'var(--red)',   border:'rgba(224,82,82,0.3)' }
  if (d <= 5)  return { label:'ATENCIÓN', bg:'var(--gold-dim)',  color:'var(--gold)',  border:'var(--gold-border)'  }
  return              { label:'OK',       bg:'var(--green-dim)', color:'var(--green)', border:'var(--green-border)' }
}

const ITEMS_INIT = [
  { id:1,  nombre:'Cream Code™',         categoria:'Salsa',    lote:'CC-001', cantidad:'1.2 kg',  vence:'2026-06-12', carrito:'C01', temp:'Refrigerado' },
  { id:2,  nombre:'Piña Caramelizada',   categoria:'Topping',  lote:'PC-001', cantidad:'800g',    vence:'2026-06-11', carrito:'C01', temp:'Refrigerado' },
  { id:3,  nombre:'Tocineta Crispy',     categoria:'Proteína', lote:'TC-001', cantidad:'500g',    vence:'2026-06-15', carrito:'C01', temp:'Refrigerado' },
  { id:4,  nombre:'Salchicha Pavo',      categoria:'Proteína', lote:'SP-001', cantidad:'16 uds',  vence:'2026-06-14', carrito:'C01', temp:'Refrigerado' },
  { id:5,  nombre:'Salchicha Hot Dog',   categoria:'Proteína', lote:'SH-001', cantidad:'14 uds',  vence:'2026-06-14', carrito:'C01', temp:'Refrigerado' },
  { id:6,  nombre:'Salchicha Alemana',   categoria:'Proteína', lote:'SA-001', cantidad:'10 uds',  vence:'2026-06-14', carrito:'C01', temp:'Refrigerado' },
  { id:7,  nombre:'Queso Cheddar',       categoria:'Queso',    lote:'QC-001', cantidad:'400g',    vence:'2026-06-16', carrito:'C01', temp:'Refrigerado' },
  { id:8,  nombre:'ZaBun™',             categoria:'Pan',      lote:'ZB-001', cantidad:'20 uds',  vence:'2026-06-13', carrito:'C01', temp:'Ambiente'    },
  { id:9,  nombre:'Mantequilla',         categoria:'Lácteo',   lote:'MT-001', cantidad:'250g',    vence:'2026-06-20', carrito:'C01', temp:'Refrigerado' },
  { id:10, nombre:'Coca-Cola 250ml',     categoria:'Bebida',   lote:'CC-002', cantidad:'24 uds',  vence:'2026-09-01', carrito:'C01', temp:'Ambiente'    },
]

const CATEGORIAS = ['Todas','Salsa','Topping','Proteína','Queso','Pan','Lácteo','Bebida']

export default function ZabuVencimientos() {
  const [items, setItems]           = useState(ITEMS_INIT)
  const [filtro, setFiltro]         = useState('Todas')
  const [vista, setVista]           = useState('alertas')
  const [modalAdd, setModalAdd]     = useState(false)
  const [sel, setSel]               = useState(null)

  const [nuevoNombre,    setNuevoNombre]    = useState('')
  const [nuevaCat,       setNuevaCat]       = useState('Proteína')
  const [nuevoLote,      setNuevoLote]      = useState('')
  const [nuevaCantidad,  setNuevaCantidad]  = useState('')
  const [nuevoVence,     setNuevoVence]     = useState('')
  const [nuevoCarrito,   setNuevoCarrito]   = useState('C01')
  const [nuevoTemp,      setNuevoTemp]      = useState('Refrigerado')

  const conDias = items.map(i => ({ ...i, dias: diasRestantes(i.vence) }))
  const vencidos  = conDias.filter(i => i.dias !== null && i.dias <= 0)
  const criticos  = conDias.filter(i => i.dias !== null && i.dias > 0 && i.dias <= 2)
  const atencion  = conDias.filter(i => i.dias !== null && i.dias > 2 && i.dias <= 5)
  const ok        = conDias.filter(i => i.dias !== null && i.dias > 5)

  const filtrados = (filtro === 'Todas' ? conDias : conDias.filter(i => i.categoria === filtro))
    .sort((a,b) => (a.dias ?? 999) - (b.dias ?? 999))

  const agregar = () => {
    if (!nuevoNombre.trim() || !nuevoVence) return
    setItems(prev => [...prev, {
      id: Date.now(), nombre: nuevoNombre, categoria: nuevaCat,
      lote: nuevoLote || '—', cantidad: nuevaCantidad,
      vence: nuevoVence, carrito: nuevoCarrito, temp: nuevoTemp,
    }])
    setNuevoNombre(''); setNuevoLote(''); setNuevaCantidad(''); setNuevoVence('')
    setModalAdd(false)
  }

  const eliminar = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setSel(null)
  }

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Vencidos',    val:String(vencidos.length),  color:'var(--red)',   sub:'requieren retiro inmediato' },
          { label:'Críticos',    val:String(criticos.length),  color:'var(--red)',   sub:'vencen en 1-2 días'         },
          { label:'Atención',    val:String(atencion.length),  color:'var(--gold)',  sub:'vencen en 3-5 días'         },
          { label:'En orden',    val:String(ok.length),        color:'var(--green)', sub:'más de 5 días'              },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ cursor:'pointer' }} onClick={() => setVista('lista')}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs + acciones */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div className="sub-nav" style={{ marginBottom:0 }}>
          {[
            { id:'alertas', label:'Alertas'   },
            { id:'lista',   label:'Todos'     },
          ].map(t => (
            <div key={t.id} className={`sub-nav-item${vista===t.id?' active':''}`} onClick={() => setVista(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={() => setModalAdd(true)}>+ Registrar item</button>
      </div>

      {/* ALERTAS */}
      {vista === 'alertas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {vencidos.length > 0 && (
            <div className="panel" style={{ border:'1px solid rgba(224,82,82,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)' }} />
                <div className="panel-title" style={{ marginBottom:0, color:'var(--red)' }}>VENCIDOS — Retirar inmediatamente</div>
              </div>
              {vencidos.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, background:'var(--red-dim)', border:'1px solid rgba(224,82,82,0.2)', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{item.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Lote: {item.lote} · {item.cantidad} · {item.carrito} · {item.temp}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'var(--red)' }}>{labelDias(item.dias)}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>Venció: {item.vence}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {criticos.length > 0 && (
            <div className="panel" style={{ border:'1px solid rgba(224,82,82,0.2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)' }} />
                <div className="panel-title" style={{ marginBottom:0, color:'var(--red)' }}>CRÍTICOS — Vencen en 1-2 días</div>
              </div>
              {criticos.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, background:'rgba(224,82,82,0.04)', border:'1px solid rgba(224,82,82,0.15)', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{item.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Lote: {item.lote} · {item.cantidad} · {item.carrito}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--red)' }}>{labelDias(item.dias)}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{item.vence}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {atencion.length > 0 && (
            <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)' }} />
                <div className="panel-title" style={{ marginBottom:0, color:'var(--gold)' }}>ATENCIÓN — Vencen en 3-5 días</div>
              </div>
              {atencion.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{item.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Lote: {item.lote} · {item.cantidad} · {item.carrito}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{labelDias(item.dias)}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{item.vence}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {vencidos.length === 0 && criticos.length === 0 && atencion.length === 0 && (
            <div className="panel" style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--green)' }}>Todo en orden</div>
              <div style={{ fontSize:13, color:'var(--text4)', marginTop:6 }}>Sin alertas de vencimiento activas</div>
            </div>
          )}
        </div>
      )}

      {/* LISTA COMPLETA */}
      {vista === 'lista' && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {CATEGORIAS.map(c => (
              <div key={c} className={`sub-nav-item${filtro===c?' active':''}`} onClick={() => setFiltro(c)}>{c}</div>
            ))}
          </div>

          <div className="panel">
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
              {['Ingrediente','Categoría','Lote','Cantidad','Temp.','Vence'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {filtrados.map((item, i) => {
              const badge = tipoBadge(item.dias)
              return (
                <div key={item.id} onClick={() => setSel(sel?.id===item.id ? null : item)}
                  style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', background: bgDias(item.dias), cursor:'pointer',
                    borderLeft: sel?.id===item.id ? '2px solid var(--gold)' : '2px solid transparent', transition:'all .15s' }}>
                  <div style={{ fontSize:13, padding:'10px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.nombre}</div>
                  <div style={{ fontSize:11, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.categoria}</div>
                  <div style={{ fontSize:11, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.lote}</div>
                  <div style={{ fontSize:11, padding:'10px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.cantidad}</div>
                  <div style={{ fontSize:11, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.temp}</div>
                  <div style={{ fontSize:11, padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', gap:8 }}>
                    {badge && (
                      <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, fontWeight:600, background:badge.bg, color:badge.color, border:`0.5px solid ${badge.border}`, whiteSpace:'nowrap' }}>
                        {labelDias(item.dias)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detalle seleccionado */}
          {sel && (
            <div className="panel" style={{ marginTop:12, border:'1px solid var(--gold-border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{sel.nombre}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{sel.categoria} · {sel.carrito} · {sel.temp}</div>
                </div>
                <button onClick={() => eliminar(sel.id)} style={{ background:'var(--red-dim)', border:'0.5px solid rgba(224,82,82,0.3)', color:'var(--red)', fontSize:11, padding:'5px 12px', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>
                  Retirar item
                </button>
              </div>
              <div className="divider" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  { label:'Lote',        val:sel.lote     },
                  { label:'Cantidad',    val:sel.cantidad },
                  { label:'Vencimiento', val:sel.vence    },
                  { label:'Días restantes', val:labelDias(sel.dias) },
                  { label:'Temperatura', val:sel.temp     },
                  { label:'Carrito',     val:sel.carrito  },
                ].map(r => (
                  <div key={r.label} style={{ background:'var(--bg4)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{r.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:r.label==='Días restantes' ? colorDias(sel.dias) : 'var(--text2)' }}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal agregar */}
      {modalAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:400, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar item</div>

            {[
              { label:'Nombre del ingrediente', val:nuevoNombre, set:setNuevoNombre, type:'text', ph:'Ej: Cream Code™' },
              { label:'Número de lote',         val:nuevoLote,   set:setNuevoLote,   type:'text', ph:'Ej: CC-002' },
              { label:'Cantidad',               val:nuevaCantidad, set:setNuevaCantidad, type:'text', ph:'Ej: 1.2 kg' },
              { label:'Fecha de vencimiento',   val:nuevoVence,  set:setNuevoVence,  type:'date', ph:'' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
              <select value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} style={inputStyle}>
                {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Temperatura de almacenamiento</div>
              <select value={nuevoTemp} onChange={e => setNuevoTemp(e.target.value)} style={inputStyle}>
                {['Refrigerado','Congelado','Ambiente'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Carrito</div>
              <select value={nuevoCarrito} onChange={e => setNuevoCarrito(e.target.value)} style={inputStyle}>
                {['C01','C02','C03'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={agregar}>Registrar</button>
              <button className="btn" onClick={() => setModalAdd(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}