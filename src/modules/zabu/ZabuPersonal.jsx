import { useState } from 'react'

function cop(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

const CARRITOS_INIT = [
  { id:'c01', nombre:'Carrito 01', ubicacion:'Por definir', activo:true  },
  { id:'c02', nombre:'Carrito 02', ubicacion:'Próximo',     activo:false },
  { id:'c03', nombre:'Carrito 03', ubicacion:'Próximo',     activo:false },
]

const PERSONAL_INIT = [
  { id:1, nombre:'Por asignar',   rol:'Cocinero',  carrito:'c01', salarioDia:80000, activo:true,  diasTrabajados:0 },
  { id:2, nombre:'Por asignar',   rol:'Ayudante',  carrito:'c01', salarioDia:60000, activo:true,  diasTrabajados:0 },
]

const DIAS_SEMANA = ['Mar','Mié','Jue','Vie','Sáb','Dom']
const ROLES = ['Cocinero','Ayudante','Administrador']

export default function ZabuPersonal() {
  const [personal, setPersonal]   = useState(PERSONAL_INIT)
  const [carritos]                = useState(CARRITOS_INIT)
  const [tab, setTab]             = useState('nomina')
  const [asistencia, setAsistencia] = useState({})
  const [modalAdd, setModalAdd]   = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRol, setNuevoRol]   = useState('Cocinero')
  const [nuevoCarrito, setNuevoCarrito] = useState('c01')
  const [nuevoSalario, setNuevoSalario] = useState(80000)

  const toggleAsistencia = (personaId, dia) => {
    const key = `${personaId}-${dia}`
    setAsistencia(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const diasTrabajados = (personaId) =>
    DIAS_SEMANA.filter((_, i) => asistencia[`${personaId}-${i}`]).length

  const salarioSemana = (p) => diasTrabajados(p.id) * p.salarioDia

  const totalNomina = personal
    .filter(p => p.activo)
    .reduce((s, p) => s + salarioSemana(p), 0)

  const agregarPersona = () => {
    if (!nuevoNombre.trim()) return
    setPersonal(prev => [...prev, {
      id: Date.now(), nombre: nuevoNombre, rol: nuevoRol,
      carrito: nuevoCarrito, salarioDia: nuevoSalario,
      activo: true, diasTrabajados: 0,
    }])
    setNuevoNombre(''); setModalAdd(false)
  }

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:14, fontFamily:'inherit', outline:'none',
    marginTop:6,
  }

  const selectStyle = { ...inputStyle }

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total personal',   val:String(personal.filter(p=>p.activo).length), color:'var(--text)',  sub:'activos esta semana' },
          { label:'Nómina semana',    val:cop(totalNomina),   color:'var(--gold)',  sub:'según asistencia' },
          { label:'Nómina mensual',   val:cop(totalNomina*4.3), color:'var(--text)', sub:'estimado x4.3' },
          { label:'Costo/carrito',    val:cop((personal.filter(p=>p.activo&&p.carrito==='c01').reduce((s,p)=>s+salarioSemana(p),0))), color:'var(--text3)', sub:'Carrito 01 esta semana' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sub-nav" style={{ marginBottom:20 }}>
        {[
          { id:'nomina',     label:'Nómina'      },
          { id:'asistencia', label:'Asistencia'  },
          { id:'equipo',     label:'Equipo'      },
        ].map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* NÓMINA */}
      {tab === 'nomina' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Liquidación semanal</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Martes — Domingo · 6 días</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
              {['Empleado','Rol','Carrito','Días','Total'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {personal.filter(p => p.activo).map((p, i) => {
              const dias = diasTrabajados(p.id)
              const total = salarioSemana(p)
              const carNombre = carritos.find(c => c.id === p.carrito)?.nombre || p.carrito
              return (
                <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize:13, padding:'10px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{p.nombre}</div>
                  <div style={{ fontSize:12, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{p.rol}</div>
                  <div style={{ fontSize:12, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{carNombre}</div>
                  <div style={{ fontSize:12, padding:'10px', color: dias===6 ? 'var(--green)' : dias===0 ? 'var(--red)' : 'var(--gold)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{dias}/6</div>
                  <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{cop(total)}</div>
                </div>
              )
            })}

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
              <div style={{ fontSize:13, padding:'10px', color:'var(--text)', fontWeight:800, gridColumn:'1/5' }}>TOTAL NÓMINA SEMANA</div>
              <div style={{ fontSize:16, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(totalNomina)}</div>
            </div>
          </div>

          {/* Desglose por carrito */}
          <div className="panel">
            <div className="panel-title">Costo de personal por carrito</div>
            {carritos.filter(c => c.activo).map(c => {
              const equipo = personal.filter(p => p.activo && p.carrito === c.id)
              const costoCarrito = equipo.reduce((s, p) => s + salarioSemana(p), 0)
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>{c.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{equipo.length} persona{equipo.length!==1?'s':''} · {equipo.map(p=>p.rol).join(', ')}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(costoCarrito)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ASISTENCIA */}
      {tab === 'asistencia' && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Control de asistencia — semana actual</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Toca para marcar presente</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'2fr repeat(6,1fr) 1fr', marginBottom:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>Empleado</div>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ fontSize:9, color:'var(--text3)', padding:'0 6px 8px', letterSpacing:0.5, fontWeight:600, textAlign:'center' }}>{d}</div>
            ))}
            <div style={{ fontSize:9, color:'var(--text3)', padding:'0 6px 8px', letterSpacing:0.5, fontWeight:600, textAlign:'center' }}>Total</div>
          </div>

          {personal.filter(p => p.activo).map((p, i) => {
            const dias = diasTrabajados(p.id)
            return (
              <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr repeat(6,1fr) 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)', alignItems:'center' }}>
                <div style={{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>{p.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{p.rol}</div>
                </div>
                {DIAS_SEMANA.map((_, di) => {
                  const presente = asistencia[`${p.id}-${di}`]
                  return (
                    <div key={di} onClick={() => toggleAsistencia(p.id, di)} style={{
                      padding:'10px 6px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                      display:'flex', justifyContent:'center', cursor:'pointer',
                    }}>
                      <div style={{
                        width:28, height:28, borderRadius:8,
                        background: presente ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                        border:`1px solid ${presente ? 'var(--green-border)' : 'var(--border)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14, color: presente ? 'var(--green)' : 'var(--text4)',
                        transition:'all .15s',
                      }}>
                        {presente ? '✓' : '·'}
                      </div>
                    </div>
                  )
                })}
                <div style={{ padding:'10px 6px', borderBottom:'1px solid rgba(255,255,255,0.04)', textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:800, color: dias===6 ? 'var(--green)' : dias===0 ? 'var(--red)' : 'var(--gold)' }}>{dias}/6</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{cop(salarioSemana(p))}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* EQUIPO */}
      {tab === 'equipo' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-gold" onClick={() => setModalAdd(true)}>+ Agregar persona</button>
          </div>

          <div className="grid-2" style={{ gap:12 }}>
            {personal.map(p => {
              const carNombre = carritos.find(c => c.id === p.carrito)?.nombre || p.carrito
              return (
                <div key={p.id} style={{
                  background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)',
                  padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14,
                }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'var(--gold)', flexShrink:0 }}>
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{p.nombre}</div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>{p.rol} · {carNombre}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(p.salarioDia)}/día</div>
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{cop(p.salarioDia*6)}/sem</div>
                      </div>
                    </div>
                    <div style={{ marginTop:10, display:'flex', gap:8 }}>
                      <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background: p.activo ? 'var(--green-dim)' : 'var(--bg4)', color: p.activo ? 'var(--green)' : 'var(--text4)', border:`0.5px solid ${p.activo ? 'var(--green-border)' : 'var(--border)'}` }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal agregar */}
          {modalAdd && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
              <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:360, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Agregar persona</div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre completo</div>
                  <input type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre..." style={inputStyle} />
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Rol</div>
                  <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} style={selectStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Carrito asignado</div>
                  <select value={nuevoCarrito} onChange={e => setNuevoCarrito(e.target.value)} style={selectStyle}>
                    {carritos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Salario por día: <span style={{ color:'var(--gold)', fontWeight:700 }}>{cop(nuevoSalario)}</span></div>
                  <input type="range" min={40000} max={150000} step={5000} value={nuevoSalario} onChange={e => setNuevoSalario(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)' }} />
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn-green" style={{ flex:1 }} onClick={agregarPersona}>Agregar</button>
                  <button className="btn" onClick={() => setModalAdd(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}