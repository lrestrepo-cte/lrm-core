import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const TALLAS = ['S','M','L','XL']
const METODOS = [
  { id:'efectivo', emoji:'💵', label:'Efectivo' },
  { id:'qr',       emoji:'📲', label:'QR'       },
  { id:'tarjeta',  emoji:'💳', label:'Tarjeta'  },
]

export default function RVPOS({ usuario }) {
  const [productos,  setProductos]  = useState([])
  const [carrito,    setCarrito]    = useState([])
  const [fasePago,   setFasePago]   = useState(false)
  const [cliente,    setCliente]    = useState('')
  const [pagos,      setPagos]      = useState([{metodo:'efectivo', monto:''}])
  const [ventas,     setVentas]     = useState([])
  const [consec,     setConsec]     = useState(1)
  const [confirmada, setConfirmada] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    setLoading(true)
    const { data } = await supabase.from('rv_productos').select('*').eq('activo', true).order('nombre')
    if (data) setProductos(data)
    setLoading(false)
  }

  const agregarAlCarrito = (prod, talla, color) => {
    const key = `${prod.id}-${talla}-${color}`
    setCarrito(prev => {
      const existe = prev.find(i => i.key === key)
      if (existe) return prev.map(i => i.key===key ? {...i, qty:i.qty+1} : i)
      return [...prev, { key, producto:prod, talla, color, qty:1, precio:prod.precio }]
    })
  }

  const cambiarQty = (key, delta) => {
    setCarrito(prev => prev.map(i => i.key===key ? {...i, qty:Math.max(0,i.qty+delta)} : i).filter(i=>i.qty>0))
  }

  const totalCarrito  = carrito.reduce((s,i)=>s+(i.precio*i.qty),0)
  const totalPagado   = pagos.reduce((s,p)=>s+(parseFloat(p.monto)||0),0)
  const cambio        = Math.max(0, totalPagado - totalCarrito)
  const pagoCompleto  = totalPagado >= totalCarrito && totalCarrito > 0
  const updatePago    = (i,f,v) => setPagos(prev=>prev.map((p,j)=>j===i?{...p,[f]:v}:p))

  const confirmar = async () => {
    const codigo = `RV-${String(consec).padStart(3,'0')}`
    const orden = {
      consecutivo: codigo,
      canal: 'pos',
      nombre_cliente: cliente,
      items: carrito,
      total: totalCarrito,
      metodo_pago: pagos[0]?.metodo,
      pagos, cambio,
      fecha: new Date().toISOString().split('T')[0],
    }
    const { data } = await supabase.from('rv_ordenes').insert(orden).select().single()
    await supabase.from('movimientos').insert({
      fecha: orden.fecha,
      descripcion: `Venta RV ${codigo} — ${carrito.length} item(s)`,
      tipo:'ingreso', categoria:'Ventas RV Sports',
      monto: totalCarrito, carrito_id: 'RV',
    })
    setVentas(prev => [orden, ...prev])
    setConfirmada({ ...orden, id: data?.id })
    setConsec(p=>p+1)
  }

  const reset = () => {
    setCarrito([]); setFasePago(false); setCliente('')
    setPagos([{metodo:'efectivo',monto:''}]); setConfirmada(null)
  }

  const totalSesion = ventas.reduce((s,v)=>s+v.total,0)

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      {/* KPIs sesión */}
      <div className="grid-4" style={{ marginBottom:16 }}>
        {[
          { label:'Ventas sesión',  val:cop(totalSesion),            color:'var(--gold)',  sub:`${ventas.length} órdenes`       },
          { label:'En carrito',     val:String(carrito.reduce((s,i)=>s+i.qty,0)), color:'var(--text)', sub:'pares seleccionados' },
          { label:'Total orden',    val:cop(totalCarrito),           color:totalCarrito>0?'var(--gold)':'var(--text4)', sub:'acumulado' },
          { label:'Meta',           val:`${ventas.length}/10`,       color:ventas.length>=10?'var(--green)':'var(--text)', sub:'pares/día' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>

        {/* Catálogo */}
        {!fasePago ? (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', marginBottom:12, letterSpacing:1 }}>SELECCIONAR PRODUCTOS</div>
            {loading ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando catálogo...</div>
            ) : productos.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>⚽</div>
                <div style={{ fontSize:13 }}>Sin productos. Agrega en Catálogo primero.</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {productos.map(prod => (
                  <div key={prod.id} className="panel">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{prod.nombre}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{prod.referencia} {prod.categoria ? `· ${prod.categoria}` : ''}</div>
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(prod.precio)}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {TALLAS.map(t => (
                        <div key={t} onClick={() => agregarAlCarrito(prod, t, prod.colores?.[0]||'')}
                          style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700,
                            background:'rgba(201,168,76,0.1)', border:'1px solid var(--gold-border)', color:'var(--gold)',
                            transition:'all .15s',
                          }}
                          onMouseOver={e=>e.currentTarget.style.background='rgba(201,168,76,0.2)'}
                          onMouseOut={e=>e.currentTarget.style.background='rgba(201,168,76,0.1)'}
                        >{t}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setFasePago(false)} style={{ fontSize:12, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:16 }}>← Volver</button>

            <div className="panel" style={{ marginBottom:12 }}>
              <div className="panel-title">Resumen</div>
              {carrito.map(i => (
                <div key={i.key} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text2)' }}>{i.producto.nombre} · {i.talla} × {i.qty}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(i.precio*i.qty)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>Total</span>
                <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(totalCarrito)}</span>
              </div>
            </div>

            <div className="panel" style={{ marginBottom:12 }}>
              <div className="panel-title">Cliente (opcional)</div>
              <input type="text" value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Nombre del cliente" style={inputStyle} />
            </div>

            <div className="panel" style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div className="panel-title" style={{ marginBottom:0 }}>Pago</div>
                <button onClick={() => setPagos(p=>[...p,{metodo:'efectivo',monto:''}])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>+ Mixto</button>
              </div>
              {pagos.map((p,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div style={{ display:'flex', gap:6 }}>
                    {METODOS.map(m => (
                      <div key={m.id} onClick={() => updatePago(i,'metodo',m.id)} style={{ flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer', textAlign:'center',
                        background:p.metodo===m.id?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                        border:`0.5px solid ${p.metodo===m.id?'var(--gold-border)':'var(--border)'}`,
                        fontSize:18,
                      }}>{m.emoji}</div>
                    ))}
                  </div>
                  <input type="number" value={p.monto} onChange={e=>updatePago(i,'monto',e.target.value)}
                    placeholder={i===0?`${totalCarrito}`:'Monto'}
                    style={{ padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, fontFamily:'inherit', outline:'none' }} />
                </div>
              ))}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                {[5000,10000,20000,50000,100000].map(v => (
                  <div key={v} onClick={() => { const idx=pagos.findIndex(p=>p.metodo==='efectivo'); if(idx>=0) updatePago(idx,'monto',String(v)) }}
                    style={{ padding:'5px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text3)' }}>{cop(v)}</div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Pagado</span>
                <span style={{ fontSize:14, fontWeight:700, color:pagoCompleto?'var(--green)':'var(--red)' }}>{cop(totalPagado)}</span>
              </div>
              {cambio > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 12px', background:'var(--green-dim)', borderRadius:8, border:'1px solid var(--green-border)', marginTop:6 }}>
                  <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>💰 Cambio</span>
                  <span style={{ fontSize:18, fontWeight:800, color:'var(--green)' }}>{cop(cambio)}</span>
                </div>
              )}
            </div>

            {pagoCompleto && (
              <button className="btn-green" onClick={confirmar} style={{ fontSize:15, fontWeight:800 }}>✓ Confirmar · {cop(totalCarrito)}</button>
            )}
            <button className="btn" style={{ width:'100%', marginTop:8 }} onClick={reset}>Cancelar</button>
          </div>
        )}

        {/* Carrito */}
        <div>
          <div className="panel" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Carrito</div>
              {carrito.length > 0 && (
                <button onClick={() => setCarrito([])} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Limpiar</button>
              )}
            </div>
            {carrito.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Sin productos</div>
            ) : (
              <>
                {carrito.map(i => (
                  <div key={i.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.producto.nombre}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>Talla {i.talla} · {cop(i.precio)}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>
                      <div onClick={() => cambiarQty(i.key,-1)} style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>−</div>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', minWidth:16, textAlign:'center' }}>{i.qty}</span>
                      <div onClick={() => cambiarQty(i.key,1)} style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>+</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)', marginLeft:10, minWidth:60, textAlign:'right' }}>{cop(i.precio*i.qty)}</div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(totalCarrito)}</span>
                </div>
                {!fasePago && (
                  <button onClick={() => setFasePago(true)} className="btn-gold" style={{ width:'100%', marginTop:12, padding:'12px', fontSize:14, fontWeight:800 }}>
                    Cobrar · {cop(totalCarrito)} →
                  </button>
                )}
              </>
            )}
          </div>

          {/* Confirmación */}
          {confirmada && (
            <div style={{ padding:'16px', background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:12, marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--green)', marginBottom:4 }}>✅ Venta registrada</div>
              <div style={{ fontSize:12, color:'var(--green)', marginBottom:8 }}>{confirmada.consecutivo} · {cop(confirmada.total)}</div>
              <button onClick={reset} className="btn" style={{ width:'100%', fontSize:12 }}>Nueva venta</button>
            </div>
          )}

          {/* Historial sesión */}
          {ventas.length > 0 && (
            <div className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div className="panel-title" style={{ marginBottom:0 }}>Sesión</div>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(totalSesion)}</div>
              </div>
              {ventas.slice(0,5).map((v,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--gold)', fontWeight:700 }}>{v.consecutivo}</span>
                  <span style={{ fontSize:12, color:'var(--text)' }}>{cop(v.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
