// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const CATEGORIAS = ['Todos', 'pan', 'salsa', 'proteina', 'topping', 'queso', 'empaque', 'bebida']
const CATEGORIA_LABEL = { pan:'Pan', salsa:'Salsa', proteina:'Proteína', topping:'Topping', queso:'Queso', empaque:'Empaque', bebida:'Bebida' }

function diasVence(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const venc = new Date(fecha)
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

// Agrupa lotes activos por producto para mostrar el stock TOTAL real (suma de todos los lotes vivos)
function agruparPorProducto(lotes) {
  const grupos = {}
  lotes.filter(l => l.estado === 'activo').forEach(l => {
    if (!grupos[l.producto_nombre]) {
      grupos[l.producto_nombre] = {
        nombre: l.producto_nombre, categoria: l.categoria, unidad: l.unidad,
        stockTotal: 0, lotes: [], proximoVencimiento: null, costoPromedio: 0,
      }
    }
    const g = grupos[l.producto_nombre]
    g.stockTotal += parseFloat(l.cantidad_actual)
    g.lotes.push(l)
    const dias = diasVence(l.fecha_vencimiento)
    if (dias !== null && (g.proximoVencimiento === null || dias < g.proximoVencimiento)) g.proximoVencimiento = dias
  })
  Object.values(grupos).forEach(g => {
    g.costoPromedio = g.lotes.reduce((s,l)=>s+l.costo_unitario,0) / g.lotes.length
  })
  return Object.values(grupos)
}

export default function ZabuInventario() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState('Todos')
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    producto_nombre:'', categoria:'pan', cantidad_inicial:'', unidad:'unidades',
    costo_unitario:'', proveedor:'', ubicacion:'C01', fecha_compra: new Date().toISOString().split('T')[0],
    fecha_vencimiento:'', notas:'',
  })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('zabu_lotes').select('*').order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    if (!error && data) setLotes(data)
    setLoading(false)
  }

  const registrarLote = async () => {
    if (!form.producto_nombre || !form.cantidad_inicial) return
    const cantidad = parseFloat(form.cantidad_inicial)
    const { error } = await supabase.from('zabu_lotes').insert({
      producto_nombre: form.producto_nombre, categoria: form.categoria,
      cantidad_inicial: cantidad, cantidad_actual: cantidad, unidad: form.unidad,
      costo_unitario: parseInt(form.costo_unitario) || 0, proveedor: form.proveedor,
      ubicacion: form.ubicacion, fecha_compra: form.fecha_compra,
      fecha_vencimiento: form.fecha_vencimiento || null, notas: form.notas, estado: 'activo',
    })
    if (error) { alert('Error al registrar: ' + error.message); return }
    setForm({ producto_nombre:'', categoria:'pan', cantidad_inicial:'', unidad:'unidades', costo_unitario:'', proveedor:'', ubicacion:'C01', fecha_compra:new Date().toISOString().split('T')[0], fecha_vencimiento:'', notas:'' })
    setModal(false)
    cargar()
  }

  const ajustarCantidad = async (loteId, nuevaCantidad) => {
    const valor = Math.max(0, parseFloat(nuevaCantidad) || 0)
    const nuevoEstado = valor === 0 ? 'agotado' : 'activo'
    await supabase.from('zabu_lotes').update({ cantidad_actual: valor, estado: nuevoEstado }).eq('id', loteId)
    cargar()
  }

  const productos = agruparPorProducto(lotes)
  const productosFiltrados = categoria === 'Todos' ? productos : productos.filter(p => p.categoria === categoria)

  const getEstadoProducto = (p) => {
    // Sin umbral hardcodeado de "máximo 100" — el estado se basa en si hay lotes próximos a vencer o agotándose
    if (p.proximoVencimiento !== null && p.proximoVencimiento <= 0) return 'critico'
    if (p.proximoVencimiento !== null && p.proximoVencimiento <= 3) return 'bajo'
    if (p.stockTotal <= 0) return 'critico'
    return 'ok'
  }
  const colorEstado = (estado) => estado === 'critico' ? 'var(--red)' : estado === 'bajo' ? 'var(--gold)' : 'var(--green)'

  const criticos  = productos.filter(p => getEstadoProducto(p) === 'critico')
  const bajos     = productos.filter(p => getEstadoProducto(p) === 'bajo')
  const porVencer = lotes.filter(l => l.estado === 'activo' && diasVence(l.fecha_vencimiento) !== null && diasVence(l.fecha_vencimiento) <= 3)

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Sistema de lotes — cada compra es un registro independiente con su propio vencimiento</div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Registrar lote</button>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Productos',  val: loading?'...':String(productos.length), color:'var(--text)', sub:'con stock activo' },
          { label:'Críticos',    val: loading?'...':String(criticos.length),  color:'var(--red)',  sub:'sin stock o vencidos' },
          { label:'Stock bajo',  val: loading?'...':String(bajos.length),     color:'var(--gold)', sub:'vencen en ≤3 días' },
          { label:'Lotes activos', val: loading?'...':String(lotes.filter(l=>l.estado==='activo').length), color:'var(--blue)', sub:'compras registradas' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div className="sub-nav" style={{ marginBottom:16 }}>
        {CATEGORIAS.map(c => (
          <div key={c} className={`sub-nav-item${categoria === c ? ' active' : ''}`} onClick={() => setCategoria(c)}>
            {c === 'Todos' ? 'Todos' : CATEGORIA_LABEL[c]}
          </div>
        ))}
      </div>

      <div className="grid-2-1" style={{ gap:16, alignItems:'start' }}>
        <div className="panel">
          <div className="panel-title">Inventario actual — stock por producto (suma de lotes activos)</div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)', padding:'20px 0', textAlign:'center' }}>Cargando...</div>
          : productosFiltrados.length === 0 ? <div style={{ fontSize:13, color:'var(--text4)', padding:'30px 0', textAlign:'center' }}>Sin productos registrados en esta categoría</div>
          : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', marginBottom:6 }}>
                {['Producto','Stock total','Estado','Próx. vence'].map(h => (
                  <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                ))}
              </div>
              {productosFiltrados.map((p, i) => {
                const estado = getEstadoProducto(p)
                return (
                  <div key={p.nombre} onClick={() => setSel(sel?.nombre === p.nombre ? null : p)} style={{
                    display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', cursor:'pointer',
                    background: sel?.nombre === p.nombre ? 'rgba(201,168,76,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderLeft: sel?.nombre === p.nombre ? '2px solid var(--gold)' : '2px solid transparent',
                    transition:'all .15s',
                  }}>
                    <div style={{ fontSize:12, padding:'9px 10px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.nombre}</div>
                    <div style={{ fontSize:12, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)', fontWeight:600, color:'var(--text2)' }}>
                      {p.stockTotal} {p.unidad}
                    </div>
                    <div style={{ fontSize:11, padding:'9px 10px', fontWeight:600, color:colorEstado(estado), borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      {estado === 'critico' ? '🔴 Crítico' : estado === 'bajo' ? '⚠️ Bajo' : '✅ OK'}
                    </div>
                    <div style={{ fontSize:11, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)', color: p.proximoVencimiento !== null && p.proximoVencimiento <= 2 ? 'var(--red)' : p.proximoVencimiento !== null && p.proximoVencimiento <= 5 ? 'var(--gold)' : 'var(--text3)' }}>
                      {p.proximoVencimiento !== null ? (p.proximoVencimiento <= 0 ? 'Vencido' : `${p.proximoVencimiento}d`) : 'No aplica'}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {sel ? (
            <div className="panel">
              <div className="panel-title">Lotes de — {sel.nombre}</div>
              {sel.lotes.map(l => {
                const dias = diasVence(l.fecha_vencimiento)
                return (
                  <div key={l.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{l.numero_lote || `Lote ${l.id.slice(0,6)}`}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--gold)' }}>{cop(l.costo_unitario)}/{l.unidad}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>
                      Compra: {l.fecha_compra} · {l.proveedor || 'Sin proveedor'} · {l.ubicacion}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="number" defaultValue={l.cantidad_actual} onBlur={e=>ajustarCantidad(l.id, e.target.value)}
                        style={{ ...iStyle, marginTop:0, width:80, fontSize:11 }} />
                      <span style={{ fontSize:11, color:'var(--text3)' }}>{l.unidad} restantes</span>
                      {dias !== null && (
                        <span style={{ fontSize:10, marginLeft:'auto', color: dias<=2?'var(--red)':dias<=5?'var(--gold)':'var(--text4)' }}>
                          {dias<=0?'Vencido':`Vence en ${dias}d`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="panel" style={{ textAlign:'center', padding:'30px 20px' }}>
              <div style={{ fontSize:13, color:'var(--text4)' }}>Selecciona un producto para ver sus lotes</div>
            </div>
          )}

          <div className="panel">
            <div className="panel-title">Alertas de vencimiento</div>
            {porVencer.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin alertas activas</div>
            ) : porVencer.map((l) => {
              const dias = diasVence(l.fecha_vencimiento)
              return (
                <div key={l.id} className="alert-row" style={{ borderColor: dias <= 1 ? 'rgba(224,82,82,0.2)' : 'rgba(201,168,76,0.2)' }}>
                  <div className="alert-dot" style={{ background: dias <= 1 ? 'var(--red)' : 'var(--gold)' }} />
                  <div className="alert-txt">
                    <span style={{ fontWeight:600, color:'var(--text2)' }}>{l.producto_nombre}</span>
                    {' — '}{dias <= 0 ? 'Vencido' : `vence en ${dias} día${dias !== 1 ? 's' : ''}`}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="panel">
            <div className="panel-title">Compras urgentes</div>
            {criticos.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin compras urgentes</div>
            ) : criticos.map((p, i) => (
              <div key={i} className="alert-row" style={{ borderColor:'rgba(224,82,82,0.2)' }}>
                <div className="alert-dot" style={{ background:'var(--red)' }} />
                <div className="alert-txt"><span style={{ fontWeight:600, color:'var(--text2)' }}>{p.nombre}</span> — sin stock disponible</div>
                <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:8, background:'var(--red-dim)', color:'var(--red)', flexShrink:0 }}>Urgente</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar nuevo lote</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Producto</div>
              <input type="text" value={form.producto_nombre} onChange={e=>setForm(p=>({...p,producto_nombre:e.target.value}))} placeholder="Ej: Cream Code™, Salchicha Pavo..." style={iStyle} />
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
                <select value={form.categoria} onChange={e=>setForm(p=>({...p,categoria:e.target.value}))} style={iStyle}>
                  {CATEGORIAS.filter(c=>c!=='Todos').map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Unidad</div>
                <select value={form.unidad} onChange={e=>setForm(p=>({...p,unidad:e.target.value}))} style={iStyle}>
                  <option value="unidades">Unidades</option><option value="kg">Kilogramos</option><option value="g">Gramos</option><option value="litros">Litros</option><option value="ml">Mililitros</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Cantidad comprada</div>
                <input type="number" value={form.cantidad_inicial} onChange={e=>setForm(p=>({...p,cantidad_inicial:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Costo unitario (COP)</div>
                <input type="number" value={form.costo_unitario} onChange={e=>setForm(p=>({...p,costo_unitario:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Proveedor</div>
                <input type="text" value={form.proveedor} onChange={e=>setForm(p=>({...p,proveedor:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Ubicación</div>
                <select value={form.ubicacion} onChange={e=>setForm(p=>({...p,ubicacion:e.target.value}))} style={iStyle}>
                  <option value="C01">Carrito 01</option><option value="C02">Carrito 02</option><option value="C03">Carrito 03</option><option value="CEDIS">CEDIS</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de compra</div>
                <input type="date" value={form.fecha_compra} onChange={e=>setForm(p=>({...p,fecha_compra:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de vencimiento</div>
                <input type="date" value={form.fecha_vencimiento} onChange={e=>setForm(p=>({...p,fecha_vencimiento:e.target.value}))} placeholder="Dejar vacío si no aplica" style={iStyle} />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
              <input type="text" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={iStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={registrarLote} disabled={!form.producto_nombre||!form.cantidad_inicial} className="btn-green" style={{ flex:1 }}>Registrar lote</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
