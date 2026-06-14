import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const CANALES = [
  { id:'whatsapp',  label:'WhatsApp',  emoji:'📱', color:'#25D366' },
  { id:'instagram', label:'Instagram', emoji:'📸', color:'#E1306C' },
  { id:'tiktok',    label:'TikTok',    emoji:'🎵', color:'#69C9D0' },
  { id:'otro',      label:'Otro',      emoji:'🛒', color:'var(--blue)' },
]

const ESTADOS = [
  { id:'pendiente',  label:'Pendiente',  color:'var(--gold)'  },
  { id:'confirmado', label:'Confirmado', color:'var(--blue)'  },
  { id:'enviado',    label:'Enviado',    color:'var(--green)' },
  { id:'entregado',  label:'Entregado',  color:'var(--green)' },
  { id:'cancelado',  label:'Cancelado',  color:'var(--red)'   },
]

const TALLAS = ['S','M','L','XL']

export default function RVPedidos() {
  const [pedidos,   setPedidos]   = useState([])
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [filtro,    setFiltro]    = useState('todos')

  // Form
  const [canal,     setCanal]     = useState('whatsapp')
  const [nombre,    setNombre]    = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [ciudad,    setCiudad]    = useState('')
  const [items,     setItems]     = useState([{producto_id:'', talla:'M', qty:1, precio:27000}])
  const [metodo,    setMetodo]    = useState('transferencia')
  const [obs,       setObs]       = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar(); cargarProductos() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('rv_ordenes').select('*').neq('canal','pos').order('created_at', { ascending:false })
    if (data) setPedidos(data)
    setLoading(false)
  }

  const cargarProductos = async () => {
    const { data } = await supabase.from('rv_productos').select('id,nombre,precio').eq('activo',true)
    if (data) setProductos(data)
  }

  const agregarItem = () => setItems(p=>[...p,{producto_id:'',talla:'M',qty:1,precio:27000}])
  const updateItem  = (i,f,v) => setItems(p=>p.map((it,j)=>j===i?{...it,[f]:v}:it))
  const removeItem  = (i) => setItems(p=>p.filter((_,j)=>j!==i))
  const totalItems  = items.reduce((s,i)=>s+(i.precio*i.qty),0)

  const guardar = async () => {
    if (!nombre) return
    setGuardando(true)
    const consec = `RV-EXT-${Date.now().toString().slice(-4)}`
    await supabase.from('rv_ordenes').insert({
      consecutivo: consec, canal, nombre_cliente:nombre, telefono, ciudad,
      items, total:totalItems, metodo_pago:metodo, observaciones:obs,
      estado:'pendiente', fecha: new Date().toISOString().split('T')[0],
    })
    setNombre(''); setTelefono(''); setCiudad(''); setItems([{producto_id:'',talla:'M',qty:1,precio:27000}]); setObs('')
    setModal(false); setGuardando(false); cargar()
  }

  const actualizarEstado = async (id, estado) => {
    await supabase.from('rv_ordenes').update({ estado }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id===id ? {...p, estado} : p))
  }

  const pedidosFiltrados = filtro==='todos' ? pedidos : pedidos.filter(p=>p.estado===filtro)

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  const estadoColor = (e) => ESTADOS.find(s=>s.id===e)?.color || 'var(--text3)'

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Pedidos externos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>WhatsApp · Instagram · TikTok · Otro</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo pedido</button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total pedidos',  val:String(pedidos.length),                                                     color:'var(--text)'  },
          { label:'Pendientes',     val:String(pedidos.filter(p=>p.estado==='pendiente').length),                   color:'var(--gold)'  },
          { label:'En camino',      val:String(pedidos.filter(p=>p.estado==='enviado').length),                     color:'var(--blue)'  },
          { label:'Entregados',     val:String(pedidos.filter(p=>p.estado==='entregado').length),                   color:'var(--green)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[{id:'todos',label:'Todos'}, ...ESTADOS].map(f => (
          <div key={f.id} onClick={() => setFiltro(f.id)} style={{
            padding:'5px 12px', borderRadius:8, fontSize:12, cursor:'pointer',
            background: filtro===f.id ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
            border:`0.5px solid ${filtro===f.id?'var(--gold-border)':'var(--border)'}`,
            color: filtro===f.id ? 'var(--gold)' : 'var(--text3)',
            fontWeight: filtro===f.id ? 700 : 400,
          }}>{f.label}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando pedidos...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📦</div>
          <div style={{ fontSize:13 }}>Sin pedidos {filtro!=='todos'?`"${filtro}"`:''}</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pedidosFiltrados.map(p => {
            const canal = CANALES.find(c=>c.id===p.canal)
            return (
              <div key={p.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'var(--gold)' }}>{p.consecutivo}</span>
                      <span style={{ fontSize:11 }}>{canal?.emoji} {canal?.label}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, fontWeight:600,
                        background:`${estadoColor(p.estado)}22`, color:estadoColor(p.estado),
                        border:`0.5px solid ${estadoColor(p.estado)}44`,
                      }}>{p.estado}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{p.nombre_cliente}</div>
                    {p.telefono && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>📞 {p.telefono}</div>}
                    {p.ciudad && <div style={{ fontSize:11, color:'var(--text3)' }}>📍 {p.ciudad}</div>}
                    {p.observaciones && <div style={{ fontSize:11, color:'var(--text4)', marginTop:4, fontStyle:'italic' }}>{p.observaciones}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(p.total)}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{p.fecha}</div>
                  </div>
                </div>
                {/* Cambiar estado */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:11, color:'var(--text3)', alignSelf:'center' }}>Estado:</span>
                  {ESTADOS.filter(e=>e.id!==p.estado).map(e => (
                    <div key={e.id} onClick={() => actualizarEstado(p.id, e.id)} style={{
                      padding:'4px 10px', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600,
                      background:`${e.color}15`, border:`0.5px solid ${e.color}44`, color:e.color,
                    }}>{e.label}</div>
                  ))}
                  {p.telefono && (
                    <a href={`https://wa.me/57${p.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:600, background:'rgba(37,211,102,0.1)', border:'0.5px solid rgba(37,211,102,0.3)', color:'#25D366', textDecoration:'none', marginLeft:'auto' }}>
                      📱 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuevo pedido */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo pedido externo</div>

            {/* Canal */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Canal</div>
              <div style={{ display:'flex', gap:8 }}>
                {CANALES.map(c => (
                  <div key={c.id} onClick={() => setCanal(c.id)} style={{
                    flex:1, padding:'10px 6px', borderRadius:8, cursor:'pointer', textAlign:'center',
                    background: canal===c.id ? `${c.color}22` : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${canal===c.id?c.color+'44':'var(--border)'}`,
                    fontSize:11, fontWeight:600, color:canal===c.id?c.color:'var(--text3)',
                  }}>{c.emoji} {c.label}</div>
                ))}
              </div>
            </div>

            {[
              {label:'Nombre cliente', val:nombre, set:setNombre, ph:'Nombre completo', type:'text'},
              {label:'Teléfono',       val:telefono, set:setTelefono, ph:'300 000 0000', type:'tel'},
              {label:'Ciudad',         val:ciudad, set:setCiudad, ph:'Ej: Barranquilla', type:'text'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}

            {/* Items */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Productos</div>
                <button onClick={agregarItem} style={{ fontSize:11, padding:'3px 10px', borderRadius:7, cursor:'pointer', background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>+ Item</button>
              </div>
              {items.map((item,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 60px 60px 24px', gap:6, marginBottom:8, alignItems:'center' }}>
                  <select value={item.producto_id} onChange={e=>{
                    const prod = productos.find(p=>p.id===e.target.value)
                    updateItem(i,'producto_id',e.target.value)
                    if(prod) updateItem(i,'precio',prod.precio)
                  }} style={{ ...inputStyle, marginTop:0, padding:'8px 10px' }}>
                    <option value="">Producto...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <select value={item.talla} onChange={e=>updateItem(i,'talla',e.target.value)} style={{ ...inputStyle, marginTop:0, padding:'8px 10px' }}>
                    {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" value={item.qty} onChange={e=>updateItem(i,'qty',parseInt(e.target.value)||1)} min={1}
                    style={{ ...inputStyle, marginTop:0, padding:'8px 6px', textAlign:'center' }} />
                  <div style={{ fontSize:12, color:'var(--gold)', fontWeight:700, textAlign:'center' }}>{cop(item.precio*item.qty)}</div>
                  {items.length > 1 && <div onClick={() => removeItem(i)} style={{ cursor:'pointer', fontSize:16, color:'var(--red)', textAlign:'center' }}>×</div>}
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total</span>
                <span style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>{cop(totalItems)}</span>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Método de pago</div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                {['transferencia','contraentrega','efectivo','otro'].map(m => (
                  <div key={m} onClick={() => setMetodo(m)} style={{
                    flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer', textAlign:'center',
                    background: metodo===m?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                    border:`0.5px solid ${metodo===m?'var(--gold-border)':'var(--border)'}`,
                    color: metodo===m?'var(--gold)':'var(--text3)',
                    fontSize:10, fontWeight:600, textTransform:'capitalize',
                  }}>{m}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Observaciones</div>
              <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Color específico, dirección, instrucciones..."
                style={{ ...inputStyle, resize:'none', height:60 }} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!nombre||guardando} className="btn-green" style={{ flex:1 }}>
                {guardando ? 'Guardando...' : 'Registrar pedido'}
              </button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
