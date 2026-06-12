import { useState } from 'react'

const CARRITOS_INIT = [
  { id:'c01', nombre:'Carrito 01', ubicacion:'Por definir', activo:true,  operador:'Operador C01', color:'#C9A84C' },
  { id:'c02', nombre:'Carrito 02', ubicacion:'Por definir', activo:false, operador:'—',            color:'#4caf50' },
  { id:'c03', nombre:'Carrito 03', ubicacion:'Por definir', activo:false, operador:'—',            color:'#378ADD' },
]

const USUARIOS_INIT = [
  { id:1, nombre:'Luis Restrepo',  email:'luis@zabu.co',   rol:'ceo',      pin:null,   carrito:'—',  activo:true  },
  { id:2, nombre:'Emelyn Mendoza', email:'emelyn@zabu.co', rol:'ceo',      pin:null,   carrito:'—',  activo:true  },
  { id:3, nombre:'Operador C01',   email:null,             rol:'vendedor', pin:'1234', carrito:'C01',activo:true  },
  { id:4, nombre:'Operador C02',   email:null,             rol:'vendedor', pin:'2345', carrito:'C02',activo:false },
  { id:5, nombre:'Cocina',         email:null,             rol:'cocina',   pin:'9999', carrito:'C01',activo:true  },
]

const MENU_INIT = [
  { id:1, nombre:'ZABÚ',     precioSolo:17000, precioCombo:20000, activo:true  },
  { id:2, nombre:'CheeZabú', precioSolo:19000, precioCombo:22000, activo:true  },
]

const EXTRAS_INIT = [
  { id:1, nombre:'Queso extra',    precio:3000, activo:true  },
  { id:2, nombre:'Tocineta extra', precio:3000, activo:true  },
  { id:3, nombre:'Piña extra',     precio:2000, activo:true  },
]

const SALCHICHAS_INIT = [
  { id:1, nombre:'Pavo',       costo:3700, activo:true  },
  { id:2, nombre:'Hot Dog',    costo:2937, activo:true  },
  { id:3, nombre:'Alemana',    costo:4140, activo:true  },
  { id:4, nombre:'Parisienne', costo:4140, activo:true  },
]

function cop(n) { return '$' + Math.round(n).toLocaleString('es-CO') }

const ROL_COLORS = {
  ceo:      { color:'#C9A84C', bg:'rgba(201,168,76,0.1)',  border:'rgba(201,168,76,0.3)'  },
  vendedor: { color:'#4caf50', bg:'rgba(76,175,80,0.1)',   border:'rgba(76,175,80,0.3)'   },
  cocina:   { color:'#378ADD', bg:'rgba(55,138,221,0.1)',  border:'rgba(55,138,221,0.3)'  },
}

export default function ZabuConfiguracion() {
  const [tab, setTab]               = useState('carritos')
  const [carritos, setCarritos]     = useState(CARRITOS_INIT)
  const [usuarios, setUsuarios]     = useState(USUARIOS_INIT)
  const [menu, setMenu]             = useState(MENU_INIT)
  const [extras, setExtras]         = useState(EXTRAS_INIT)
  const [salchichas, setSalchichas] = useState(SALCHICHAS_INIT)

  // Modales
  const [modalCarrito, setModalCarrito] = useState(null)
  const [modalUsuario, setModalUsuario] = useState(null)
  const [modalMenu,    setModalMenu]    = useState(null)
  const [modalExtra,   setModalExtra]   = useState(null)
  const [modalSal,     setModalSal]     = useState(null)

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  // ── CARRITOS ──────────────────────────────────────────────────────────────

  const CarritosTab = () => {
    const [form, setForm] = useState(modalCarrito || { id:'', nombre:'', ubicacion:'', activo:true, operador:'', color:'#C9A84C' })

    const guardar = () => {
      if (!form.nombre.trim()) return
      if (form.id) {
        setCarritos(prev => prev.map(c => c.id===form.id ? form : c))
      } else {
        setCarritos(prev => [...prev, { ...form, id:'c'+Date.now() }])
      }
      setModalCarrito(null)
    }

    return (
      <>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{carritos.length} carritos registrados · {carritos.filter(c=>c.activo).length} activos</div>
          <button className="btn-gold" onClick={() => setModalCarrito({})}>+ Agregar carrito</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {carritos.map(c => (
            <div key={c.id} style={{ background:'var(--bg3)', borderRadius:14, border:`1px solid ${c.activo ? c.color+'33' : 'var(--border)'}`, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:c.color+'15', border:`1px solid ${c.color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background: c.activo ? c.color : '#333' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{c.nombre}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>📍 {c.ubicacion || 'Sin ubicación'} · 👤 {c.operador || '—'}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div onClick={() => setCarritos(prev => prev.map(x => x.id===c.id ? {...x, activo:!x.activo} : x))} style={{
                  padding:'5px 14px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
                  background: c.activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                  color: c.activo ? 'var(--green)' : 'var(--text4)',
                  border:`0.5px solid ${c.activo ? 'var(--green-border)' : 'var(--border)'}`,
                }}>{c.activo ? 'Activo' : 'Inactivo'}</div>
                <button className="btn" style={{ fontSize:11, padding:'5px 12px' }} onClick={() => setModalCarrito(c)}>Editar</button>
              </div>
            </div>
          ))}
        </div>

        {modalCarrito !== null && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:400, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>{form.id ? 'Editar carrito' : 'Nuevo carrito'}</div>
              {[
                { label:'Nombre del carrito', key:'nombre', ph:'Ej: Carro Villa Carolina' },
                { label:'Ubicación',          key:'ubicacion', ph:'Ej: CC Villa del Río, local 12' },
                { label:'Operador asignado',  key:'operador', ph:'Nombre del operador' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                  <input type="text" value={form[f.key]||''} onChange={e => setForm(p => ({...p, [f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Color identificador</div>
                <div style={{ display:'flex', gap:10 }}>
                  {['#C9A84C','#4caf50','#378ADD','#9C27B0','#e05252','#FF9800'].map(color => (
                    <div key={color} onClick={() => setForm(p => ({...p, color}))} style={{ width:32, height:32, borderRadius:8, background:color, cursor:'pointer', border:`3px solid ${form.color===color ? 'white' : 'transparent'}`, transition:'all .15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-green" style={{ flex:1 }} onClick={guardar}>Guardar</button>
                <button className="btn" onClick={() => setModalCarrito(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── USUARIOS ──────────────────────────────────────────────────────────────

  const UsuariosTab = () => {
    const [form, setForm] = useState({ nombre:'', email:'', rol:'vendedor', pin:'', carrito:'C01', activo:true })

    const guardar = () => {
      if (!form.nombre.trim()) return
      setUsuarios(prev => [...prev, { id:Date.now(), ...form }])
      setForm({ nombre:'', email:'', rol:'vendedor', pin:'', carrito:'C01', activo:true })
      setModalUsuario(null)
    }

    return (
      <>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{usuarios.length} usuarios · {usuarios.filter(u=>u.activo).length} activos</div>
          <button className="btn-gold" onClick={() => setModalUsuario(true)}>+ Agregar usuario</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {usuarios.map(u => {
            const rc = ROL_COLORS[u.rol] || ROL_COLORS.vendedor
            return (
              <div key={u.id} style={{ background:'var(--bg3)', borderRadius:12, border:'1px solid var(--border)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:rc.bg, border:`1px solid ${rc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:rc.color, flexShrink:0 }}>
                  {u.nombre.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{u.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    {u.email || `PIN: ${u.pin}`} · Carrito: {u.carrito}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:rc.bg, color:rc.color, border:`0.5px solid ${rc.border}`, fontWeight:700, textTransform:'capitalize' }}>{u.rol}</span>
                  <div onClick={() => setUsuarios(prev => prev.map(x => x.id===u.id ? {...x, activo:!x.activo} : x))} style={{
                    padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
                    background: u.activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                    color: u.activo ? 'var(--green)' : 'var(--text4)',
                    border:`0.5px solid ${u.activo ? 'var(--green-border)' : 'var(--border)'}`,
                  }}>{u.activo ? 'Activo' : 'Inactivo'}</div>
                </div>
              </div>
            )
          })}
        </div>

        {modalUsuario && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:400, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo usuario</div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre completo</div>
                <input type="text" value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Juan Pérez" style={inputStyle} />
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Rol</div>
                <select value={form.rol} onChange={e => setForm(p=>({...p,rol:e.target.value}))} style={inputStyle}>
                  <option value="vendedor">Vendedor</option>
                  <option value="cocina">Cocina</option>
                  <option value="ceo">CEO</option>
                </select>
              </div>

              {form.rol === 'ceo' ? (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Email</div>
                  <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="email@zabu.co" style={inputStyle} />
                </div>
              ) : (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>PIN (4 dígitos)</div>
                  <input type="number" value={form.pin} onChange={e => setForm(p=>({...p,pin:e.target.value.slice(0,4)}))} placeholder="Ej: 5678" style={inputStyle} maxLength={4} />
                </div>
              )}

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Carrito asignado</div>
                <select value={form.carrito} onChange={e => setForm(p=>({...p,carrito:e.target.value}))} style={inputStyle}>
                  {carritos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-green" style={{ flex:1 }} onClick={guardar}>Agregar</button>
                <button className="btn" onClick={() => setModalUsuario(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── MENÚ ──────────────────────────────────────────────────────────────────

  const MenuTab = () => {
    const [form, setForm] = useState({ nombre:'', precioSolo:0, precioCombo:0, activo:true })

    const guardar = () => {
      if (!form.nombre.trim()) return
      setMenu(prev => [...prev, { id:Date.now(), ...form }])
      setForm({ nombre:'', precioSolo:0, precioCombo:0, activo:true })
      setModalMenu(null)
    }

    return (
      <>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
          {/* Productos */}
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Productos</div>
              <button className="btn-gold" style={{ fontSize:11, padding:'5px 12px' }} onClick={() => setModalMenu(true)}>+ Agregar</button>
            </div>
            {menu.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Solo: {cop(m.precioSolo)} · Combo: {cop(m.precioCombo)}</div>
                </div>
                <div onClick={() => setMenu(prev => prev.map(x => x.id===m.id ? {...x,activo:!x.activo} : x))} style={{
                  padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
                  background: m.activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                  color: m.activo ? 'var(--green)' : 'var(--text4)',
                  border:`0.5px solid ${m.activo ? 'var(--green-border)' : 'var(--border)'}`,
                }}>{m.activo ? 'Activo' : 'Inactivo'}</div>
              </div>
            ))}
          </div>

          {/* Extras */}
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Extras</div>
              <button className="btn-gold" style={{ fontSize:11, padding:'5px 12px' }} onClick={() => setModalExtra(true)}>+ Agregar</button>
            </div>
            {extras.map(e => (
              <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
                  <div style={{ fontSize:12, color:'var(--gold)', fontWeight:700 }}>+{cop(e.precio)}</div>
                </div>
                <div onClick={() => setExtras(prev => prev.map(x => x.id===e.id ? {...x,activo:!x.activo} : x))} style={{
                  padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
                  background: e.activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                  color: e.activo ? 'var(--green)' : 'var(--text4)',
                  border:`0.5px solid ${e.activo ? 'var(--green-border)' : 'var(--border)'}`,
                }}>{e.activo ? 'Activo' : 'Inactivo'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Salchichas */}
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Salchichas disponibles</div>
            <button className="btn-gold" style={{ fontSize:11, padding:'5px 12px' }} onClick={() => setModalSal(true)}>+ Agregar</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {salchichas.map(s => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{cop(s.costo)}/ud</div>
                </div>
                <div onClick={() => setSalchichas(prev => prev.map(x => x.id===s.id ? {...x,activo:!x.activo} : x))} style={{
                  padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
                  background: s.activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                  color: s.activo ? 'var(--green)' : 'var(--text4)',
                  border:`0.5px solid ${s.activo ? 'var(--green-border)' : 'var(--border)'}`,
                }}>{s.activo ? 'Activa' : 'Inactiva'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal producto */}
        {modalMenu && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:380, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo producto</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
                <input type="text" value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: ZABÚ Spicy" style={inputStyle} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Precio solo</div>
                  <input type="number" value={form.precioSolo} onChange={e => setForm(p=>({...p,precioSolo:Number(e.target.value)}))} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Precio combo</div>
                  <input type="number" value={form.precioCombo} onChange={e => setForm(p=>({...p,precioCombo:Number(e.target.value)}))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-green" style={{ flex:1 }} onClick={guardar}>Agregar</button>
                <button className="btn" onClick={() => setModalMenu(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal extra */}
        {modalExtra && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:340, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo extra</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
                <input type="text" placeholder="Ej: Aguacate extra" style={inputStyle} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Precio</div>
                <input type="number" placeholder="Ej: 2000" style={inputStyle} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-green" style={{ flex:1 }} onClick={() => setModalExtra(null)}>Agregar</button>
                <button className="btn" onClick={() => setModalExtra(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal salchicha */}
        {modalSal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:340, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva salchicha</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
                <input type="text" placeholder="Ej: Salchicha Suiza" style={inputStyle} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Costo por unidad</div>
                <input type="number" placeholder="Ej: 3500" style={inputStyle} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-green" style={{ flex:1 }} onClick={() => setModalSal(null)}>Agregar</button>
                <button className="btn" onClick={() => setModalSal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── PARÁMETROS GENERALES ──────────────────────────────────────────────────

  const ParametrosTab = () => {
    const [params, setParams] = useState({
      nombreNegocio: 'ZABÚ',
      tagline: 'HOT DOGS DE VERDAD',
      ciudad: 'Barranquilla',
      moneda: 'COP',
      horarioAbre: '16:00',
      horarioCierra: '22:00',
      diasOperacion: ['Mar','Mié','Jue','Vie','Sáb','Dom'],
      metaPerdiosDia: 36,
      foodCostMax: 45,
      alertaStockMin: 20,
      alertaVencimientoDias: 5,
    })

    return (
      <div className="grid-2" style={{ gap:14 }}>
        <div className="panel">
          <div className="panel-title">Identidad del negocio</div>
          {[
            { label:'Nombre', key:'nombreNegocio' },
            { label:'Tagline', key:'tagline' },
            { label:'Ciudad', key:'ciudad' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
              <input type="text" value={params[f.key]} onChange={e => setParams(p=>({...p,[f.key]:e.target.value}))} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Moneda</div>
            <select value={params.moneda} onChange={e => setParams(p=>({...p,moneda:e.target.value}))} style={inputStyle}>
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dólar</option>
            </select>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Operación</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Abre</div>
              <input type="time" value={params.horarioAbre} onChange={e => setParams(p=>({...p,horarioAbre:e.target.value}))} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Cierra</div>
              <input type="time" value={params.horarioCierra} onChange={e => setParams(p=>({...p,horarioCierra:e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Meta diaria de perros: <span style={{ color:'var(--gold)', fontWeight:700 }}>{params.metaPerdiosDia}</span></div>
            <input type="range" min={10} max={150} value={params.metaPerdiosDia} onChange={e => setParams(p=>({...p,metaPerdiosDia:Number(e.target.value)}))} style={{ width:'100%', accentColor:'var(--gold)' }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Food cost máximo: <span style={{ color:'var(--gold)', fontWeight:700 }}>{params.foodCostMax}%</span></div>
            <input type="range" min={30} max={60} value={params.foodCostMax} onChange={e => setParams(p=>({...p,foodCostMax:Number(e.target.value)}))} style={{ width:'100%', accentColor:'var(--gold)' }} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Alertas automáticas</div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Alerta stock mínimo: <span style={{ color:'var(--gold)', fontWeight:700 }}>{params.alertaStockMin}%</span></div>
            <input type="range" min={5} max={40} value={params.alertaStockMin} onChange={e => setParams(p=>({...p,alertaStockMin:Number(e.target.value)}))} style={{ width:'100%', accentColor:'var(--gold)' }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Alertar vencimiento con: <span style={{ color:'var(--gold)', fontWeight:700 }}>{params.alertaVencimientoDias} días de anticipación</span></div>
            <input type="range" min={1} max={14} value={params.alertaVencimientoDias} onChange={e => setParams(p=>({...p,alertaVencimientoDias:Number(e.target.value)}))} style={{ width:'100%', accentColor:'var(--gold)' }} />
          </div>
          <div style={{ padding:'12px 14px', background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:10, fontSize:12, color:'var(--green)' }}>
            ✅ Alertas configuradas. Se activarán cuando conectes Supabase.
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Resumen de configuración</div>
          {[
            { label:'Negocio',          val:params.nombreNegocio },
            { label:'Ciudad',           val:params.ciudad        },
            { label:'Horario',          val:`${params.horarioAbre} — ${params.horarioCierra}` },
            { label:'Meta diaria',      val:`${params.metaPerdiosDia} perros` },
            { label:'Food cost máx.',   val:`${params.foodCostMax}%` },
            { label:'Alerta stock',     val:`< ${params.alertaStockMin}%` },
            { label:'Alerta venc.',     val:`${params.alertaVencimientoDias} días antes` },
            { label:'Carritos activos', val:carritos.filter(c=>c.activo).length },
            { label:'Usuarios activos', val:usuarios.filter(u=>u.activo).length },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{r.val}</span>
            </div>
          ))}
          <button className="btn-gold" style={{ width:'100%', marginTop:14, padding:'10px' }}>Guardar configuración</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sub-nav" style={{ marginBottom:20 }}>
        {[
          { id:'carritos',   label:'Carritos'   },
          { id:'usuarios',   label:'Usuarios'   },
          { id:'menu',       label:'Menú'        },
          { id:'parametros', label:'Parámetros'  },
        ].map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'carritos'   && <CarritosTab />}
      {tab === 'usuarios'   && <UsuariosTab />}
      {tab === 'menu'       && <MenuTab />}
      {tab === 'parametros' && <ParametrosTab />}
    </>
  )
}