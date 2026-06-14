import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const TALLAS    = ['S','M','L','XL']
const CATS      = ['Deportivo','Running','Fútbol','Gym','Casual','Moda','Corporativo']
const COLORES   = ['Negro','Blanco','Gris','Azul','Rojo','Verde','Amarillo','Naranja','Morado','Rosado','Multicolor']

export default function RVCatalogo() {
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editando,  setEditando]  = useState(null)

  // Form
  const [ref,      setRef]      = useState('')
  const [nombre,   setNombre]   = useState('')
  const [desc,     setDesc]     = useState('')
  const [precio,   setPrecio]   = useState('27000')
  const [cat,      setCat]      = useState('Deportivo')
  const [colores,  setColores]  = useState([])
  const [guardando,setGuardando]= useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('rv_productos').select('*').order('nombre')
    if (data) setProductos(data)
    setLoading(false)
  }

  const abrirModal = (prod=null) => {
    if (prod) {
      setEditando(prod.id)
      setRef(prod.referencia); setNombre(prod.nombre); setDesc(prod.descripcion||'')
      setPrecio(String(prod.precio)); setCat(prod.categoria||'Deportivo')
      setColores(prod.colores||[])
    } else {
      setEditando(null)
      setRef(''); setNombre(''); setDesc(''); setPrecio('27000'); setCat('Deportivo'); setColores([])
    }
    setModal(true)
  }

  const toggleColor = (c) => setColores(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c])

  const guardar = async () => {
    if (!ref || !nombre) return
    setGuardando(true)
    const payload = { referencia:ref, nombre, descripcion:desc, precio:parseInt(precio), categoria:cat, colores, tallas:TALLAS }
    if (editando) {
      await supabase.from('rv_productos').update(payload).eq('id', editando)
    } else {
      await supabase.from('rv_productos').insert({ ...payload, activo:true })
    }
    setModal(false); setGuardando(false); cargar()
  }

  const toggleActivo = async (id, activo) => {
    await supabase.from('rv_productos').update({ activo:!activo }).eq('id', id)
    setProductos(prev => prev.map(p => p.id===id ? {...p, activo:!activo} : p))
  }

  const eliminar = async (id) => {
    await supabase.from('rv_productos').delete().eq('id', id)
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Catálogo RV Sports</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{productos.length} referencias · $27.000 precio base</div>
        </div>
        <button onClick={() => abrirModal()} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo producto</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando catálogo...</div>
      ) : productos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚽</div>
          <div style={{ fontSize:14, color:'var(--text3)' }}>Sin productos todavía</div>
          <div style={{ fontSize:12, marginTop:4 }}>Agrega tu primera referencia</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
          {productos.map(p => (
            <div key={p.id} className="panel" style={{ opacity: p.activo?1:0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginBottom:3 }}>{p.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{p.referencia}</div>
                  {p.categoria && <div style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(55,138,221,0.1)', color:'var(--blue)', border:'0.5px solid rgba(55,138,221,0.2)', display:'inline-block', marginTop:4 }}>{p.categoria}</div>}
                </div>
                <div style={{ fontSize:16, fontWeight:900, color:'var(--gold)', marginLeft:10 }}>{cop(p.precio)}</div>
              </div>

              {p.descripcion && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10, lineHeight:1.5 }}>{p.descripcion}</div>}

              {/* Tallas */}
              <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap' }}>
                {(p.tallas||TALLAS).map(t => (
                  <span key={t} style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)' }}>{t}</span>
                ))}
              </div>

              {/* Colores */}
              {p.colores?.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  {p.colores.map(c => (
                    <span key={c} style={{ padding:'2px 8px', borderRadius:6, fontSize:10, background:'rgba(255,255,255,0.05)', color:'var(--text3)', border:'0.5px solid var(--border)' }}>{c}</span>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <button onClick={() => abrirModal(p)} className="btn" style={{ flex:1, fontSize:11 }}>Editar</button>
                <button onClick={() => toggleActivo(p.id, p.activo)} style={{ flex:1, padding:'6px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit',
                  background: p.activo?'var(--red-dim)':'var(--green-dim)',
                  border:`0.5px solid ${p.activo?'rgba(224,82,82,0.3)':'var(--green-border)'}`,
                  color: p.activo?'var(--red)':'var(--green)',
                }}>{p.activo?'Desactivar':'Activar'}</button>
                <button onClick={() => eliminar(p.id)} style={{ width:32, borderRadius:8, cursor:'pointer', fontSize:14, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.2)', color:'var(--red)' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>{editando?'Editar producto':'Nuevo producto'}</div>

            {[
              {label:'Referencia',    val:ref,    set:setRef,    ph:'Ej: RV-001'},
              {label:'Nombre',        val:nombre, set:setNombre, ph:'Ej: Calcetín Deportivo Básico'},
              {label:'Descripción',   val:desc,   set:setDesc,   ph:'Descripción opcional'},
              {label:'Precio (COP)',  val:precio, set:setPrecio, ph:'27000', type:'number'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type||'text'} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Categoría</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {CATS.map(c => (
                  <div key={c} onClick={() => setCat(c)} style={{
                    padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                    background: cat===c?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                    border:`0.5px solid ${cat===c?'var(--gold-border)':'var(--border)'}`,
                    color: cat===c?'var(--gold)':'var(--text3)',
                  }}>{c}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Colores disponibles</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {COLORES.map(c => (
                  <div key={c} onClick={() => toggleColor(c)} style={{
                    padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:11,
                    background: colores.includes(c)?'rgba(55,138,221,0.15)':'rgba(255,255,255,0.04)',
                    border:`0.5px solid ${colores.includes(c)?'rgba(55,138,221,0.4)':'var(--border)'}`,
                    color: colores.includes(c)?'var(--blue)':'var(--text3)', fontWeight:colores.includes(c)?700:400,
                  }}>{c}</div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!ref||!nombre||guardando} className="btn-green" style={{ flex:1 }}>
                {guardando?'Guardando...':editando?'Actualizar':'Agregar producto'}
              </button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
