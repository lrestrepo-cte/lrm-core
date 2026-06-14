import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function RVClientes() {
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [buscar,   setBuscar]   = useState('')
  const [nombre,   setNombre]   = useState('')
  const [telefono, setTelefono] = useState('')
  const [instagram,setInstagram]= useState('')
  const [ciudad,   setCiudad]   = useState('')
  const [guardando,setGuardando]= useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('rv_clientes').select('*').order('nombre')
    if (data) setClientes(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre) return
    setGuardando(true)
    await supabase.from('rv_clientes').insert({ nombre, telefono, instagram, ciudad })
    setNombre(''); setTelefono(''); setInstagram(''); setCiudad('')
    setModal(false); setGuardando(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('rv_clientes').delete().eq('id', id)
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    c.telefono?.includes(buscar) ||
    c.ciudad?.toLowerCase().includes(buscar.toLowerCase())
  )

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Clientes RV Sports</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{clientes.length} clientes registrados</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Cliente</button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom:16 }}>
        <input type="text" value={buscar} onChange={e=>setBuscar(e.target.value)}
          placeholder="Buscar por nombre, teléfono o ciudad..."
          style={{ ...inputStyle, marginTop:0 }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando clientes...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
          <div style={{ fontSize:13 }}>{buscar ? 'Sin resultados' : 'Sin clientes registrados'}</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
          {filtrados.map(c => (
            <div key={c.id} className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{c.nombre}</div>
                  {c.telefono && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>📞 {c.telefono}</span>
                      <a href={`https://wa.me/57${c.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'rgba(37,211,102,0.1)', color:'#25D366', border:'0.5px solid rgba(37,211,102,0.3)', textDecoration:'none' }}>WA</a>
                    </div>
                  )}
                  {c.instagram && <div style={{ fontSize:11, color:'#E1306C', marginBottom:4 }}>📸 @{c.instagram.replace('@','')}</div>}
                  {c.ciudad && <div style={{ fontSize:11, color:'var(--text3)' }}>📍 {c.ciudad}</div>}
                </div>
                <div onClick={() => eliminar(c.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:380, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo cliente</div>
            {[
              {label:'Nombre',    val:nombre,    set:setNombre,    ph:'Nombre completo'},
              {label:'Teléfono',  val:telefono,  set:setTelefono,  ph:'300 000 0000',  type:'tel'},
              {label:'Instagram', val:instagram, set:setInstagram, ph:'@usuario'},
              {label:'Ciudad',    val:ciudad,    set:setCiudad,    ph:'Ej: Barranquilla'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type||'text'} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={guardar} disabled={!nombre||guardando} className="btn-green" style={{ flex:1 }}>
                {guardando?'Guardando...':'Guardar cliente'}
              </button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
