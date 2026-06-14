import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) {
  if (!n && n !== 0) return '$0'
  return '$' + Math.round(Math.abs(n)).toLocaleString('es-CO')
}

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
function PinLock({ onUnlock }) {
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState(false)
  const PIN_CORRECTO = '2794'

  const addDigit = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo)
    setError(false)
    if (nuevo.length === 4) {
      setTimeout(() => {
        if (nuevo === PIN_CORRECTO) onUnlock()
        else { setError(true); setPin('') }
      }, 300)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:320, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:4 }}>My Space</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:32 }}>Acceso privado · Luis Restrepo</div>

        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:14, height:14, borderRadius:'50%', transition:'all .2s',
              background: i < pin.length ? (error ? 'var(--red)' : 'var(--gold)') : 'rgba(255,255,255,0.1)',
              border: `1px solid ${error ? 'rgba(224,82,82,0.4)' : 'rgba(201,168,76,0.3)'}`,
            }} />
          ))}
        </div>

        {error && (
          <div style={{ fontSize:12, color:'var(--red)', marginBottom:16 }}>PIN incorrecto</div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:260, margin:'0 auto' }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
            <div key={i} onClick={() => {
              if (d === '⌫') { setPin(p => p.slice(0,-1)); setError(false) }
              else if (d !== '') addDigit(String(d))
            }} style={{
              padding:'16px', borderRadius:12, textAlign:'center',
              cursor: d==='' ? 'default' : 'pointer',
              visibility: d==='' ? 'hidden' : 'visible',
              background: d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.08)'}`,
              fontSize: d==='⌫' ? 18 : 20, fontWeight:700,
              color: d==='⌫' ? 'var(--red)' : 'var(--text)',
              transition:'all .1s',
            }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── METAS Y SUEÑOS ───────────────────────────────────────────────────────────
function Metas() {
  const [metas,    setMetas]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [actual,   setActual]   = useState('')
  const [emoji,    setEmoji]    = useState('🎯')
  const [guardando,setGuardando]= useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_metas').select('*').order('created_at')
    if (data) setMetas(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre || !objetivo) return
    setGuardando(true)
    await supabase.from('my_space_metas').insert({
      nombre, objetivo: parseInt(objetivo), actual: parseInt(actual||0), emoji
    })
    setNombre(''); setObjetivo(''); setActual(''); setEmoji('🎯')
    setModal(false); setGuardando(false)
    cargar()
  }

  const actualizar = async (id, nuevoActual) => {
    await supabase.from('my_space_metas').update({ actual: parseInt(nuevoActual) }).eq('id', id)
    setMetas(prev => prev.map(m => m.id === id ? {...m, actual: parseInt(nuevoActual)} : m))
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_metas').delete().eq('id', id)
    setMetas(prev => prev.filter(m => m.id !== id))
  }

  const EMOJIS = ['🎯','🏠','🚗','✈️','💰','📚','💪','🌎','🏖️','👨‍👩‍👧','🎓','🏆']

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Metas y sueños</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Tu progreso hacia lo que importa</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva meta</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : metas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text3)' }}>Sin metas todavía</div>
          <div style={{ fontSize:12, marginTop:4 }}>Agrega tu primera meta</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {metas.map(m => {
            const pct = Math.min(100, Math.round((m.actual / m.objetivo) * 100))
            const completada = pct >= 100
            return (
              <div key={m.id} className="panel">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:32 }}>{m.emoji}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color: completada ? 'var(--green)' : 'var(--text)' }}>
                        {m.nombre} {completada && '✅'}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                        {cop(m.actual)} de {cop(m.objetivo)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:22, fontWeight:900, color: completada ? 'var(--green)' : 'var(--gold)' }}>
                      {pct}%
                    </div>
                    <div onClick={() => eliminar(m.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--red)' }}>×</div>
                  </div>
                </div>
                <div className="prog-wrap" style={{ height:8, marginBottom:10 }}>
                  <div className="prog-fill" style={{
                    width:`${pct}%`, height:8,
                    background: completada ? 'var(--green)' : pct >= 60 ? 'var(--gold)' : 'var(--red)',
                    transition:'width .5s ease',
                  }} />
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Actualizar progreso:</div>
                  <input type="number" defaultValue={m.actual}
                    onBlur={e => actualizar(m.id, e.target.value)}
                    style={{ width:120, padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva meta</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Emoji</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                {EMOJIS.map(e => (
                  <div key={e} onClick={() => setEmoji(e)} style={{
                    width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, cursor:'pointer',
                    background: emoji===e ? 'var(--gold-dim)' : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${emoji===e ? 'var(--gold-border)' : 'var(--border)'}`,
                  }}>{e}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre de la meta</div>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Casa propia" style={inputStyle} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto objetivo (COP)</div>
              <input type="number" value={objetivo} onChange={e=>setObjetivo(e.target.value)} placeholder="Ej: 300000000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto actual ahorrado</div>
              <input type="number" value={actual} onChange={e=>setActual(e.target.value)} placeholder="Ej: 5000000" style={inputStyle} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={guardando||!nombre||!objetivo} className="btn-green" style={{ flex:1 }}>
                {guardando ? 'Guardando...' : 'Guardar meta'}
              </button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FINANZAS PERSONALES ──────────────────────────────────────────────────────
function FinanzasPersonales() {
  const [movs,    setMovs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [tipo,    setTipo]    = useState('ingreso')
  const [desc,    setDesc]    = useState('')
  const [monto,   setMonto]   = useState('')
  const [cat,     setCat]     = useState('')
  const [fijo,    setFijo]    = useState(false)

  const hoy = new Date().toISOString().split('T')[0]
  const mes  = hoy.slice(0,7)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_finanzas').select('*').order('fecha', { ascending:false })
    if (data) setMovs(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!desc || !monto) return
    await supabase.from('my_space_finanzas').insert({ tipo, descripcion:desc, monto:parseInt(monto), categoria:cat, fijo, fecha:hoy })
    setDesc(''); setMonto(''); setCat(''); setFijo(false)
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_finanzas').delete().eq('id', id)
    setMovs(prev => prev.filter(m => m.id !== id))
  }

  const movsMes   = movs.filter(m => m.fecha?.startsWith(mes))
  const ingresos  = movsMes.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0)
  const gastos    = movsMes.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0)
  const saldo     = ingresos - gastos

  const CATS_INGRESO = ['Salario','Dividendos ZABÚ','Freelance','Arriendo','Otro']
  const CATS_GASTO   = ['Hogar','Alimentación','Transporte','Educación','Salud','Entretenimiento','Deudas','Otro']

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Finanzas personales</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Registrar</button>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:'Ingresos',  val:cop(ingresos), color:'var(--green)' },
          { label:'Gastos',    val:cop(gastos),   color:'var(--red)'   },
          { label:'Saldo',     val:cop(saldo),    color: saldo>=0 ? 'var(--gold)' : 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        {loading ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        ) : movs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
            <div style={{ fontSize:13 }}>Sin movimientos registrados</div>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 30px', marginBottom:8 }}>
              {['Fecha','Descripción','Categoría','Monto',''].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text4)', padding:'0 6px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>
            {movs.map((m,i) => (
              <div key={m.id} style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 30px', background:i%2===0?'transparent':'rgba(255,255,255,0.02)', alignItems:'center' }}>
                <div style={{ fontSize:11, padding:'8px 6px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.fecha}</div>
                <div style={{ fontSize:12, padding:'8px 6px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  {m.descripcion}
                  {m.fijo && <span style={{ fontSize:9, marginLeft:6, padding:'1px 6px', borderRadius:6, background:'rgba(55,138,221,0.1)', color:'var(--blue)' }}>Fijo</span>}
                </div>
                <div style={{ fontSize:11, padding:'8px 6px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.categoria}</div>
                <div style={{ fontSize:13, padding:'8px 6px', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)', color:m.tipo==='ingreso'?'var(--green)':'var(--red)' }}>
                  {m.tipo==='ingreso'?'+':'-'}{cop(m.monto)}
                </div>
                <div onClick={() => eliminar(m.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text4)', borderBottom:'1px solid rgba(255,255,255,0.03)', height:'100%' }}>×</div>
              </div>
            ))}
          </>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar movimiento</div>

            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['ingreso','gasto'].map(t => (
                <div key={t} onClick={() => setTipo(t)} style={{
                  flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background: tipo===t ? (t==='ingreso'?'var(--green-dim)':'var(--red-dim)') : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${tipo===t?(t==='ingreso'?'var(--green-border)':'rgba(224,82,82,0.3)'):'var(--border)'}`,
                  color: tipo===t ? (t==='ingreso'?'var(--green)':'var(--red)') : 'var(--text3)',
                  fontSize:13, fontWeight:700, textTransform:'capitalize',
                }}>{t==='ingreso'?'Ingreso':'Gasto'}</div>
              ))}
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción</div>
              <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Salario julio" style={inputStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto (COP)</div>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 5000000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
              <select value={cat} onChange={e=>setCat(e.target.value)} style={inputStyle}>
                <option value="">Seleccionar...</option>
                {(tipo==='ingreso'?CATS_INGRESO:CATS_GASTO).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer' }} onClick={() => setFijo(p=>!p)}>
              <div style={{ width:18, height:18, borderRadius:5, border:'1px solid var(--border)', background: fijo?'var(--gold-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--gold)' }}>
                {fijo && '✓'}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Gasto/Ingreso fijo mensual</div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!desc||!monto} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PRESUPUESTO ──────────────────────────────────────────────────────────────
function Presupuesto() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [cat,     setCat]     = useState('')
  const [plan,    setPlan]    = useState('')
  const [real,    setReal]    = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const mes = new Date().toISOString().slice(0,7)
    const { data } = await supabase.from('my_space_presupuesto').select('*').eq('mes', mes).order('categoria')
    if (data) setItems(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!cat || !plan) return
    const mes = new Date().toISOString().slice(0,7)
    await supabase.from('my_space_presupuesto').insert({ mes, categoria:cat, planeado:parseInt(plan), real:parseInt(real||0) })
    setCat(''); setPlan(''); setReal('')
    setModal(false); cargar()
  }

  const actualizarReal = async (id, val) => {
    await supabase.from('my_space_presupuesto').update({ real:parseInt(val) }).eq('id', id)
    setItems(prev => prev.map(i => i.id===id ? {...i, real:parseInt(val)} : i))
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_presupuesto').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const totalPlan = items.reduce((s,i)=>s+i.planeado,0)
  const totalReal = items.reduce((s,i)=>s+i.real,0)

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  const semaforo = (plan, real) => {
    if (real === 0) return 'var(--text4)'
    const pct = real / plan
    if (pct <= 0.8) return 'var(--green)'
    if (pct <= 1.0) return 'var(--gold)'
    return 'var(--red)'
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Presupuesto mensual</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Categoría</button>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:'Presupuestado', val:cop(totalPlan), color:'var(--text)'  },
          { label:'Gastado',       val:cop(totalReal), color: totalReal>totalPlan?'var(--red)':'var(--gold)' },
          { label:'Disponible',    val:cop(totalPlan-totalReal), color: totalPlan-totalReal>=0?'var(--green)':'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        {loading ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
            <div style={{ fontSize:13 }}>Sin categorías este mes</div>
          </div>
        ) : items.map(item => {
          const pct = item.planeado > 0 ? Math.min(100, Math.round((item.real/item.planeado)*100)) : 0
          const color = semaforo(item.planeado, item.real)
          return (
            <div key={item.id} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.categoria}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    <input type="number" defaultValue={item.real} onBlur={e=>actualizarReal(item.id,e.target.value)}
                      style={{ width:90, padding:'4px 8px', borderRadius:6, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', textAlign:'center' }} />
                    <span style={{ marginLeft:4 }}>/ {cop(item.planeado)}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color }}>{pct}%</div>
                  <div onClick={() => eliminar(item.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
                </div>
              </div>
              <div className="prog-wrap" style={{ height:6 }}>
                <div className="prog-fill" style={{ width:`${pct}%`, height:6, background:color, transition:'width .5s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:380, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva categoría</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
              <input type="text" value={cat} onChange={e=>setCat(e.target.value)} placeholder="Ej: Alimentación" style={inputStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Presupuesto planeado</div>
              <input type="number" value={plan} onChange={e=>setPlan(e.target.value)} placeholder="Ej: 800000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Gasto real hasta ahora</div>
              <input type="number" value={real} onChange={e=>setReal(e.target.value)} placeholder="Ej: 320000" style={inputStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!cat||!plan} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DEUDAS ───────────────────────────────────────────────────────────────────
function Deudas() {
  const [deudas,  setDeudas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [tipo,    setTipo]    = useState('debo')
  const [acreedor,setAcreedor]= useState('')
  const [total,   setTotal]   = useState('')
  const [cuota,   setCuota]   = useState('')
  const [vence,   setVence]   = useState('')
  const [desc,    setDesc]    = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_deudas').select('*').order('fecha_vencimiento')
    if (data) setDeudas(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!acreedor || !total) return
    await supabase.from('my_space_deudas').insert({
      tipo, acreedor, saldo_total:parseInt(total), cuota_mensual:parseInt(cuota||0),
      fecha_vencimiento:vence||null, descripcion:desc
    })
    setAcreedor(''); setTotal(''); setCuota(''); setVence(''); setDesc('')
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_deudas').delete().eq('id', id)
    setDeudas(prev => prev.filter(d => d.id !== id))
  }

  const debo    = deudas.filter(d=>d.tipo==='debo').reduce((s,d)=>s+d.saldo_total,0)
  const meDeben = deudas.filter(d=>d.tipo==='me_deben').reduce((s,d)=>s+d.saldo_total,0)

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  const diasVence = (fecha) => {
    if (!fecha) return null
    const diff = Math.ceil((new Date(fecha) - new Date()) / (1000*60*60*24))
    return diff
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Deudas y créditos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Lo que debes y lo que te deben</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar</button>
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {[
          { label:'Lo que debes',   val:cop(debo),    color:'var(--red)',  sub:`${deudas.filter(d=>d.tipo==='debo').length} deudas` },
          { label:'Lo que te deben',val:cop(meDeben), color:'var(--green)',sub:`${deudas.filter(d=>d.tipo==='me_deben').length} créditos` },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : deudas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:13 }}>Sin deudas ni créditos registrados</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {deudas.map(d => {
            const dias = diasVence(d.fecha_vencimiento)
            const alerta = dias !== null && dias <= 7
            return (
              <div key={d.id} className="panel" style={{ border:`1px solid ${d.tipo==='debo'?'rgba(224,82,82,0.2)':'rgba(76,175,80,0.2)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, fontWeight:600,
                        background: d.tipo==='debo'?'var(--red-dim)':'var(--green-dim)',
                        color: d.tipo==='debo'?'var(--red)':'var(--green)',
                        border: `0.5px solid ${d.tipo==='debo'?'rgba(224,82,82,0.3)':'var(--green-border)'}`,
                      }}>{d.tipo==='debo'?'Le debo a':'Me debe'}</span>
                      {alerta && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)' }}>⚠️ Vence pronto</span>}
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{d.acreedor}</div>
                    {d.descripcion && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{d.descripcion}</div>}
                    {d.fecha_vencimiento && <div style={{ fontSize:11, color: alerta?'var(--gold)':'var(--text4)', marginTop:4 }}>
                      Vence: {d.fecha_vencimiento} {dias!==null?`(${dias>0?`en ${dias}d`:'HOY'})`:''}
                    </div>}
                    {d.cuota_mensual > 0 && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Cuota: {cop(d.cuota_mensual)}/mes</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:18, fontWeight:900, color: d.tipo==='debo'?'var(--red)':'var(--green)' }}>{cop(d.saldo_total)}</div>
                    <div onClick={() => eliminar(d.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva deuda / crédito</div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[{id:'debo',label:'Le debo a alguien'},{id:'me_deben',label:'Me deben a mí'}].map(t => (
                <div key={t.id} onClick={() => setTipo(t.id)} style={{
                  flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background: tipo===t.id ? (t.id==='debo'?'var(--red-dim)':'var(--green-dim)') : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${tipo===t.id?(t.id==='debo'?'rgba(224,82,82,0.3)':'var(--green-border)'):'var(--border)'}`,
                  color: tipo===t.id?(t.id==='debo'?'var(--red)':'var(--green)'):'var(--text3)',
                  fontSize:11, fontWeight:600,
                }}>{t.label}</div>
              ))}
            </div>
            {[
              {label:'Nombre / Entidad', val:acreedor, set:setAcreedor, ph:'Ej: Banco, Juan', type:'text'},
              {label:'Saldo total', val:total, set:setTotal, ph:'Ej: 15000000', type:'number'},
              {label:'Cuota mensual', val:cuota, set:setCuota, ph:'Ej: 500000', type:'number'},
              {label:'Fecha vencimiento', val:vence, set:setVence, ph:'', type:'date'},
              {label:'Descripción', val:desc, set:setDesc, ph:'Ej: Crédito vehículo', type:'text'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={guardar} disabled={!acreedor||!total} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── INVERSIONES ─────────────────────────────────────────────────────────────
function Inversiones() {
  const [inv,     setInv]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [nombre,  setNombre]  = useState('')
  const [tipo,    setTipo]    = useState('CDT')
  const [inicial, setInicial] = useState('')
  const [actual,  setActual]  = useState('')
  const [fecha,   setFecha]   = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_inversiones').select('*').order('created_at')
    if (data) setInv(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre || !inicial) return
    await supabase.from('my_space_inversiones').insert({
      nombre, tipo, valor_inicial:parseInt(inicial), valor_actual:parseInt(actual||inicial), fecha_inicio:fecha||null
    })
    setNombre(''); setInicial(''); setActual(''); setFecha('')
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_inversiones').delete().eq('id', id)
    setInv(prev => prev.filter(i => i.id !== id))
  }

  const totalInicial = inv.reduce((s,i)=>s+i.valor_inicial,0)
  const totalActual  = inv.reduce((s,i)=>s+i.valor_actual,0)
  const ganancia     = totalActual - totalInicial
  const rentPct      = totalInicial > 0 ? ((ganancia/totalInicial)*100).toFixed(1) : 0

  const TIPOS = ['CDT','Acciones','Crypto','Finca raíz','Fondo','Otro']

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Inversiones personales</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Tu portafolio personal</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar</button>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Invertido',   val:cop(totalInicial), color:'var(--text)'  },
          { label:'Valor actual',val:cop(totalActual),  color:'var(--gold)'  },
          { label:'Ganancia',    val:cop(ganancia),     color:ganancia>=0?'var(--green)':'var(--red)' },
          { label:'Rentabilidad',val:`${rentPct}%`,     color:parseFloat(rentPct)>=0?'var(--green)':'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : inv.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:13 }}>Sin inversiones registradas</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {inv.map(i => {
            const gan = i.valor_actual - i.valor_inicial
            const pct = i.valor_inicial > 0 ? ((gan/i.valor_inicial)*100).toFixed(1) : 0
            return (
              <div key={i.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{i.nombre}</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(55,138,221,0.1)', color:'var(--blue)', border:'0.5px solid rgba(55,138,221,0.2)' }}>{i.tipo}</span>
                      {i.fecha_inicio && <span style={{ fontSize:11, color:'var(--text4)' }}>Desde {i.fecha_inicio}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(i.valor_actual)}</div>
                      <div style={{ fontSize:11, color:'var(--text4)' }}>Inicial: {cop(i.valor_inicial)}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:gan>=0?'var(--green)':'var(--red)' }}>
                        {gan>=0?'+':''}{cop(gan)} ({pct}%)
                      </div>
                    </div>
                    <div onClick={() => eliminar(i.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva inversión</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: CDT Bancolombia" style={inputStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Tipo</div>
              <select value={tipo} onChange={e=>setTipo(e.target.value)} style={inputStyle}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Valor inicial invertido</div>
              <input type="number" value={inicial} onChange={e=>setInicial(e.target.value)} placeholder="Ej: 5000000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Valor actual</div>
              <input type="number" value={actual} onChange={e=>setActual(e.target.value)} placeholder="Ej: 5350000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha inicio</div>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!nombre||!inicial} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CALENDARIO FINANCIERO ────────────────────────────────────────────────────
function CalendarioFinanciero() {
  const [pagos,   setPagos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [nombre,  setNombre]  = useState('')
  const [monto,   setMonto]   = useState('')
  const [dia,     setDia]     = useState('')
  const [tipo,    setTipo]    = useState('gasto')
  const [cat,     setCat]     = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_calendario').select('*').order('dia_mes')
    if (data) setPagos(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre || !dia) return
    await supabase.from('my_space_calendario').insert({ nombre, monto:parseInt(monto||0), dia_mes:parseInt(dia), tipo, categoria:cat })
    setNombre(''); setMonto(''); setDia(''); setCat('')
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_calendario').delete().eq('id', id)
    setPagos(prev => prev.filter(p => p.id !== id))
  }

  const hoy      = new Date().getDate()
  const proximos = pagos.filter(p => p.dia_mes >= hoy).slice(0,3)

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Calendario financiero</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Pagos recurrentes del mes</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar</button>
      </div>

      {proximos.length > 0 && (
        <div style={{ padding:'14px 16px', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', borderRadius:12, marginBottom:20 }}>
          <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, letterSpacing:1, marginBottom:10 }}>PRÓXIMOS VENCIMIENTOS</div>
          {proximos.map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
              <div style={{ fontSize:13, color:'var(--text)' }}>
                <span style={{ fontWeight:700, color:'var(--gold)', marginRight:8 }}>Día {p.dia_mes}</span>
                {p.nombre}
              </div>
              {p.monto > 0 && <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(p.monto)}</div>}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : pagos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:13 }}>Sin pagos recurrentes registrados</div>
        </div>
      ) : (
        <div className="panel">
          {pagos.map((p,i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: p.dia_mes===hoy?'var(--gold-dim)':p.dia_mes<hoy?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', border:`1px solid ${p.dia_mes===hoy?'var(--gold-border)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:p.dia_mes===hoy?'var(--gold)':'var(--text3)', flexShrink:0 }}>
                  {p.dia_mes}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{p.nombre}</div>
                  {p.categoria && <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{p.categoria}</div>}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {p.monto > 0 && <div style={{ fontSize:14, fontWeight:700, color:p.tipo==='gasto'?'var(--red)':'var(--green)' }}>
                  {p.tipo==='gasto'?'-':'+'}{cop(p.monto)}
                </div>}
                <div onClick={() => eliminar(p.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:380, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo pago recurrente</div>
            {[
              {label:'Nombre', val:nombre, set:setNombre, ph:'Ej: Arriendo', type:'text'},
              {label:'Día del mes', val:dia, set:setDia, ph:'Ej: 15', type:'number'},
              {label:'Monto (opcional)', val:monto, set:setMonto, ph:'Ej: 2500000', type:'number'},
              {label:'Categoría', val:cat, set:setCat, ph:'Ej: Vivienda', type:'text'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {['gasto','ingreso'].map(t => (
                <div key={t} onClick={() => setTipo(t)} style={{
                  flex:1, padding:'8px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background: tipo===t?(t==='gasto'?'var(--red-dim)':'var(--green-dim)'):'rgba(255,255,255,0.04)',
                  border:`1px solid ${tipo===t?(t==='gasto'?'rgba(224,82,82,0.3)':'var(--green-border)'):'var(--border)'}`,
                  color: tipo===t?(t==='gasto'?'var(--red)':'var(--green)'):'var(--text3)',
                  fontSize:12, fontWeight:600,
                }}>{t==='gasto'?'Gasto':'Ingreso'}</div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!nombre||!dia} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MY SPACE PRINCIPAL ───────────────────────────────────────────────────────
export default function MySpace() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab,      setTab]      = useState('metas')

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />

  const TABS = [
    { id:'metas',      label:'🎯 Metas'        },
    { id:'finanzas',   label:'💰 Finanzas'     },
    { id:'presupuesto',label:'📊 Presupuesto'  },
    { id:'deudas',     label:'💳 Deudas'       },
    { id:'inversiones',label:'📈 Inversiones'  },
    { id:'calendario', label:'📅 Calendario'   },
  ]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>My Space 🔐</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Privado · Solo visible para ti</div>
      </div>

      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'metas'       && <Metas />}
      {tab === 'finanzas'    && <FinanzasPersonales />}
      {tab === 'presupuesto' && <Presupuesto />}
      {tab === 'deudas'      && <Deudas />}
      {tab === 'inversiones' && <Inversiones />}
      {tab === 'calendario'  && <CalendarioFinanciero />}
    </div>
  )
}
