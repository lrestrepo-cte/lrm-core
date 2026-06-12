import { useState } from 'react'

const INVENTARIO = [
  { id:1, nombre:'ZaBun™ (pan top-split)',   categoria:'Pan',       stock:85,  min:20, max:100, unidad:'uds',  costo:1000,  proveedor:'Panadera (pendiente)',  vence:'2026-06-12' },
  { id:2, nombre:'Cream Code™',              categoria:'Salsa',     stock:90,  min:20, max:100, unidad:'%',    costo:700,   proveedor:'Producción propia',     vence:'2026-06-12' },
  { id:3, nombre:'Tocineta Crispy',          categoria:'Proteína',  stock:30,  min:25, max:100, unidad:'%',    costo:600,   proveedor:'Por definir',           vence:'2026-06-15' },
  { id:4, nombre:'Piña Caramelizada',        categoria:'Topping',   stock:15,  min:20, max:100, unidad:'%',    costo:400,   proveedor:'Producción propia',     vence:'2026-06-11' },
  { id:5, nombre:'Salchicha Pavo',           categoria:'Proteína',  stock:70,  min:20, max:100, unidad:'uds',  costo:3700,  proveedor:'La Parisienne',        vence:'2026-06-14' },
  { id:6, nombre:'Salchicha Hot Dog',        categoria:'Proteína',  stock:60,  min:20, max:100, unidad:'uds',  costo:2937,  proveedor:'La Parisienne',        vence:'2026-06-14' },
  { id:7, nombre:'Salchicha Alemana',        categoria:'Proteína',  stock:50,  min:20, max:100, unidad:'uds',  costo:4140,  proveedor:'La Parisienne',        vence:'2026-06-14' },
  { id:8, nombre:'Salchicha Parisienne',     categoria:'Proteína',  stock:50,  min:20, max:100, unidad:'uds',  costo:4140,  proveedor:'La Parisienne',        vence:'2026-06-14' },
  { id:9, nombre:'Queso Cheddar',            categoria:'Queso',     stock:60,  min:20, max:100, unidad:'%',    costo:1000,  proveedor:'Por definir',           vence:'2026-06-16' },
  { id:10,nombre:'Bandeja boat kraft',       categoria:'Empaque',   stock:65,  min:30, max:100, unidad:'uds',  costo:400,   proveedor:'Proveedor Barranquilla', vence:null },
  { id:11,nombre:'Papel encerado',           categoria:'Empaque',   stock:80,  min:30, max:100, unidad:'%',    costo:100,   proveedor:'Proveedor Barranquilla', vence:null },
  { id:12,nombre:'Servilletas x6',           categoria:'Empaque',   stock:75,  min:30, max:100, unidad:'%',    costo:240,   proveedor:'Proveedor Barranquilla', vence:null },
  { id:13,nombre:'Sticker ZABÚ',             categoria:'Empaque',   stock:70,  min:30, max:100, unidad:'uds',  costo:120,   proveedor:'Imprenta',              vence:null },
  { id:14,nombre:'Caja kraft ventana',       categoria:'Empaque',   stock:55,  min:20, max:100, unidad:'uds',  costo:1350,  proveedor:'Proveedor Barranquilla', vence:null },
  { id:15,nombre:'Bolsa papel kraft',        categoria:'Empaque',   stock:60,  min:20, max:100, unidad:'uds',  costo:300,   proveedor:'Proveedor Barranquilla', vence:null },
  { id:16,nombre:'Coca-Cola 250ml',          categoria:'Bebida',    stock:80,  min:24, max:100, unidad:'uds',  costo:1500,  proveedor:'Distribuidor',          vence:'2026-09-01' },
]

const CATEGORIAS = ['Todos', 'Pan', 'Salsa', 'Proteína', 'Topping', 'Queso', 'Empaque', 'Bebida']

function getEstado(item) {
  if (item.stock <= item.min) return 'critico'
  if (item.stock <= item.min * 1.5) return 'bajo'
  return 'ok'
}

function colorEstado(estado) {
  if (estado === 'critico') return 'var(--red)'
  if (estado === 'bajo') return 'var(--gold)'
  return 'var(--green)'
}

function diasVence(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  const venc = new Date(fecha)
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
  return diff
}

export default function ZabuInventario() {
  const [categoria, setCategoria] = useState('Todos')
  const [sel, setSel] = useState(null)

  const filtrados = categoria === 'Todos' ? INVENTARIO : INVENTARIO.filter(i => i.categoria === categoria)
  const criticos = INVENTARIO.filter(i => getEstado(i) === 'critico')
  const bajos = INVENTARIO.filter(i => getEstado(i) === 'bajo')
  const porVencer = INVENTARIO.filter(i => { const d = diasVence(i.vence); return d !== null && d <= 3 })

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total items',    val:String(INVENTARIO.length), color:'var(--text)',  sub:'en inventario'      },
          { label:'Críticos',       val:String(criticos.length),   color:'var(--red)',   sub:'requieren compra'   },
          { label:'Stock bajo',     val:String(bajos.length),      color:'var(--gold)',  sub:'reponer pronto'     },
          { label:'Por vencer',     val:String(porVencer.length),  color:'var(--gold)',  sub:'en los próximos 3 días' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="sub-nav" style={{ marginBottom:16 }}>
        {CATEGORIAS.map(c => (
          <div key={c} className={`sub-nav-item${categoria === c ? ' active' : ''}`} onClick={() => setCategoria(c)}>{c}</div>
        ))}
      </div>

      <div className="grid-2-1" style={{ gap:16, alignItems:'start' }}>

        {/* Tabla */}
        <div className="panel">
          <div className="panel-title">Inventario actual</div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', marginBottom:6 }}>
            {['Ingrediente','Stock','Estado','Vence'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>
          {filtrados.map((item, i) => {
            const estado = getEstado(item)
            const dias = diasVence(item.vence)
            return (
              <div key={item.id} onClick={() => setSel(sel?.id === item.id ? null : item)} style={{
                display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', cursor:'pointer',
                background: sel?.id === item.id ? 'rgba(201,168,76,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderLeft: sel?.id === item.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition:'all .15s',
              }}>
                <div style={{ fontSize:12, padding:'9px 10px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{item.nombre}</div>
                <div style={{ fontSize:12, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden', marginBottom:3 }}>
                    <div style={{ height:4, borderRadius:2, width:`${item.stock}%`, background:colorEstado(estado) }} />
                  </div>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>{item.stock}%</span>
                </div>
                <div style={{ fontSize:11, padding:'9px 10px', fontWeight:600, color:colorEstado(estado), borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  {estado === 'critico' ? '🔴 Crítico' : estado === 'bajo' ? '⚠️ Bajo' : '✅ OK'}
                </div>
                <div style={{ fontSize:11, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)', color: dias !== null && dias <= 2 ? 'var(--red)' : dias !== null && dias <= 5 ? 'var(--gold)' : 'var(--text3)' }}>
                  {dias !== null ? (dias <= 0 ? 'Vencido' : `${dias}d`) : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Detalle + Alertas */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Detalle item */}
          {sel ? (
            <div className="panel">
              <div className="panel-title">Detalle — {sel.nombre}</div>
              {[
                { label:'Categoría',   val:sel.categoria   },
                { label:'Proveedor',   val:sel.proveedor   },
                { label:'Costo/ud',    val:'$'+sel.costo.toLocaleString('es-CO') },
                { label:'Stock mín.',  val:sel.min+'%'     },
                { label:'Estado',      val: getEstado(sel) === 'critico' ? '🔴 Crítico' : getEstado(sel) === 'bajo' ? '⚠️ Bajo' : '✅ OK' },
                { label:'Vencimiento', val: sel.vence ? sel.vence : 'No aplica' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{r.val}</span>
                </div>
              ))}
              <button className="btn-gold" style={{ width:'100%', marginTop:14, padding:'8px' }}>
                + Registrar entrada
              </button>
            </div>
          ) : (
            <div className="panel" style={{ textAlign:'center', padding:'30px 20px' }}>
              <div style={{ fontSize:13, color:'var(--text4)' }}>Selecciona un item para ver el detalle</div>
            </div>
          )}

          {/* Alertas vencimiento */}
          <div className="panel">
            <div className="panel-title">Alertas de vencimiento</div>
            {porVencer.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin alertas activas</div>
            ) : porVencer.map((item, i) => {
              const dias = diasVence(item.vence)
              return (
                <div key={i} className="alert-row" style={{ borderColor: dias <= 1 ? 'rgba(224,82,82,0.2)' : 'rgba(201,168,76,0.2)' }}>
                  <div className="alert-dot" style={{ background: dias <= 1 ? 'var(--red)' : 'var(--gold)' }} />
                  <div className="alert-txt">
                    <span style={{ fontWeight:600, color:'var(--text2)' }}>{item.nombre}</span>
                    {' — '}{dias <= 0 ? 'Vencido' : `vence en ${dias} día${dias !== 1 ? 's' : ''}`}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Críticos */}
          <div className="panel">
            <div className="panel-title">Compras urgentes</div>
            {criticos.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin compras urgentes</div>
            ) : criticos.map((item, i) => (
              <div key={i} className="alert-row" style={{ borderColor:'rgba(224,82,82,0.2)' }}>
                <div className="alert-dot" style={{ background:'var(--red)' }} />
                <div className="alert-txt">
                  <span style={{ fontWeight:600, color:'var(--text2)' }}>{item.nombre}</span>
                  {' — '}{item.proveedor}
                </div>
                <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:8, background:'var(--red-dim)', color:'var(--red)', flexShrink:0 }}>Urgente</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}