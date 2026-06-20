import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TALLAS = ['S','M','L','XL']

export default function RVInventario() {
  const [productos, setProductos] = useState([])
  const [inventario,setInventario]= useState([])
  const [loading,   setLoading]   = useState(true)
  const [editId,    setEditId]    = useState(null)
  const [editVal,   setEditVal]   = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:prods }, { data:inv }] = await Promise.all([
      supabase.from('rv_productos').select('*').eq('activo',true).order('nombre'),
      supabase.from('rv_inventario').select('*'),
    ])
    if (prods) setProductos(prods)
    if (inv)   setInventario(inv)
    setLoading(false)
  }

  const getStock = (prodId, talla) => {
    return inventario.find(i=>i.producto_id===prodId && i.talla===talla)?.stock || 0
  }

  const getInvId = (prodId, talla) => {
    return inventario.find(i=>i.producto_id===prodId && i.talla===talla)?.id
  }

  const actualizarStock = async (prodId, talla, valor) => {
    const stock = parseInt(valor) || 0
    const id = getInvId(prodId, talla)
    if (id) {
      await supabase.from('rv_inventario').update({ stock, updated_at: new Date().toISOString() }).eq('id', id)
      setInventario(prev => prev.map(i => i.id===id ? {...i, stock} : i))
    } else {
      const { data } = await supabase.from('rv_inventario').insert({ producto_id:prodId, talla, stock }).select().single()
      if (data) setInventario(prev => [...prev, data])
    }
    setEditId(null)
  }

  const totalStock = inventario.reduce((s,i)=>s+i.stock,0)
  const bajoStock  = inventario.filter(i=>i.stock>0 && i.stock<=3).length
  const sinStock   = inventario.filter(i=>i.stock===0).length

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Inventario</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Stock por producto y talla</div>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:'Total en stock', val:String(totalStock), color:'var(--gold)',  sub:'pares' },
          { label:'Bajo stock',     val:String(bajoStock),  color:'var(--gold)',  sub:'≤ 3 pares' },
          { label:'Sin stock',      val:String(sinStock),   color:'var(--red)',   sub:'referencias' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando inventario...</div>
      ) : productos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:13 }}>Sin productos en catálogo. Agrega primero en Catálogo.</div>
        </div>
      ) : (
        <div className="panel">
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,80px)', marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:1, fontWeight:600 }}>PRODUCTO</div>
            {TALLAS.map(t => (
              <div key={t} style={{ fontSize:11, fontWeight:700, color:'var(--gold)', textAlign:'center' }}>{t}</div>
            ))}
          </div>

          {productos.map(prod => (
            <div key={prod.id} style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,80px)', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.03)', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{prod.nombre}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{prod.referencia}</div>
              </div>
              {TALLAS.map(t => {
                const stock = getStock(prod.id, t)
                const key   = `${prod.id}-${t}`
                const color = stock === 0 ? 'var(--red)' : stock <= 3 ? 'var(--gold)' : 'var(--green)'
                return (
                  <div key={t} style={{ textAlign:'center' }}>
                    {editId === key ? (
                      <input
                        type="number" defaultValue={stock} autoFocus
                        onBlur={e => actualizarStock(prod.id, t, e.target.value)}
                        onKeyDown={e => e.key==='Enter' && actualizarStock(prod.id, t, e.target.value)}
                        style={{ width:60, padding:'4px 6px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid var(--gold-border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', textAlign:'center' }}
                      />
                    ) : (
                      <div onClick={() => { setEditId(key); setEditVal(String(stock)) }}
                        style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:44, height:32, borderRadius:8, cursor:'pointer',
                          background:`${color}15`, border:`1px solid ${color}33`,
                          fontSize:14, fontWeight:800, color,
                          transition:'all .15s',
                        }}
                        title="Click para editar"
                      >{stock}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          <div style={{ paddingTop:12, marginTop:4, fontSize:11, color:'var(--text4)', textAlign:'center' }}>
            Click en cualquier número para editar el stock · Enter o click afuera para guardar
          </div>
        </div>
      )}
    </div>
  )
}
