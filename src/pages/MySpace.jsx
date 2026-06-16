import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) {
  if (!n && n !== 0) return '$0'
  return '$' + Math.round(Math.abs(n)).toLocaleString('es-CO')
}

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
}

// ─── CATEGORÍAS PREDEFINIDAS ──────────────────────────────────────────────────
const GASTOS_TEMPLATE = [
  { persona:'Hogar', categoria:'Vivienda',     items:['Arriendo Apto','Electricidad - AIRE','Agua - AAA','Gas - Gases del Caribe','Internet - Claro'] },
  { persona:'Hogar', categoria:'Streaming',    items:['Netflix','Disney+','Youtube Premium','Paramount+','DGO'] },
  { persona:'Hogar', categoria:'Alimentación', items:['Mercado','Restaurantes','Domicilios'] },
  { persona:'Hogar', categoria:'Empleada',     items:['Salario empleada','Extras empleada'] },
  { persona:'Luis',  categoria:'Salud',        items:['EPS / Medicina prepagada','Medicamentos','Consultas'] },
  { persona:'Luis',  categoria:'Transporte',   items:['Gasolina','Mantenimiento carro','Parqueaderos'] },
  { persona:'Luis',  categoria:'Personal',     items:['Gym','Ropa','Entretenimiento','Salidas'] },
  { persona:'Luis',  categoria:'Tecnología',   items:['Claude IA','ChatGPT','Gemini','Plan celular'] },
  { persona:'Luis',  categoria:'Ejecutivo',    items:['Café / Trabajo','Representación','Capacitación'] },
  { persona:'Emelyn',categoria:'Salud',        items:['EPS / Medicina prepagada','Medicamentos','Consultas'] },
  { persona:'Emelyn',categoria:'Personal',     items:['Gym','Ropa','Entretenimiento','Salidas'] },
  { persona:'Emelyn',categoria:'Celular',      items:['Plan celular Emelyn'] },
  { persona:'Lucía', categoria:'Educación',    items:['Colegio Lucía','Útiles y materiales','Uniformes'] },
  { persona:'Lucía', categoria:'Actividades',  items:['Patinaje','Natación','Refuerzo académico'] },
  { persona:'Lucía', categoria:'Salud',        items:['EPS / Copagos médicos','Medicamentos','Consultas'] },
  { persona:'Lucía', categoria:'Personal',     items:['Plan celular Lucía','Ropa','Entretenimiento'] },
  { persona:'Lucía', categoria:'Ahorro',       items:['Ahorro año Lucía','Fondo educación'] },
]

const PERSONAS = ['Hogar','Luis','Emelyn','Lucía']
const PERSONA_COLOR = { Hogar:'var(--gold)', Luis:'var(--blue)', Emelyn:'#E1306C', Lucía:'#9C27B0' }
const PERSONA_EMOJI = { Hogar:'🏠', Luis:'👤', Emelyn:'👩', Lucía:'👧' }

const FUENTES_INGRESO = [
  { id:'salario',    label:'Salario Oh Wow',       emoji:'💼', tipo:'fijo'    },
  { id:'ocasional',  label:'Ingreso ocasional',    emoji:'💵', tipo:'variable'},
  { id:'zabu',       label:'Dividendos ZABÚ',       emoji:'🌭', tipo:'negocio' },
  { id:'rv',         label:'Dividendos RV Sports',  emoji:'⚽', tipo:'negocio' },
  { id:'bombas',     label:'Dividendos Las Bombas', emoji:'💣', tipo:'negocio' },
  { id:'coco',       label:'Dividendos Coco Shake', emoji:'🥥', tipo:'negocio' },
  { id:'otro',       label:'Otro ingreso',          emoji:'➕', tipo:'variable'},
]

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
function PinLock({ onUnlock }) {
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState(false)

  const addDigit = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo)
    setError(false)
    if (nuevo.length === 4) {
      setTimeout(() => {
        if (nuevo === '2794') onUnlock()
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
            <div key={i} style={{ width:14, height:14, borderRadius:'50%', transition:'all .2s',
              background: i < pin.length ? (error?'var(--red)':'var(--gold)') : 'rgba(255,255,255,0.1)',
              border:`1px solid ${error?'rgba(224,82,82,0.4)':'rgba(201,168,76,0.3)'}`,
            }} />
          ))}
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:16 }}>PIN incorrecto</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:260, margin:'0 auto' }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
            <div key={i} onClick={() => {
              if (d==='⌫') { setPin(p=>p.slice(0,-1)); setError(false) }
              else if (d!=='') addDigit(String(d))
            }} style={{
              padding:'16px', borderRadius:12, textAlign:'center',
              cursor:d===''?'default':'pointer', visibility:d===''?'hidden':'visible',
              background:d==='⌫'?'rgba(224,82,82,0.1)':'rgba(255,255,255,0.06)',
              border:`1px solid ${d==='⌫'?'rgba(224,82,82,0.2)':'rgba(255,255,255,0.08)'}`,
              fontSize:d==='⌫'?18:20, fontWeight:700,
              color:d==='⌫'?'var(--red)':'var(--text)', transition:'all .1s',
            }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── RESUMEN GENERAL ──────────────────────────────────────────────────────────
function Resumen() {
  const [ingresos,  setIngresos]  = useState([])
  const [gastosMes, setGastosMes] = useState([])
  const [gastosFijos,setGastosFijos]=useState([])
  const [deudas,    setDeudas]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const mes = new Date().toISOString().slice(0,7)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:ing }, { data:gm }, { data:gf }, { data:deu }] = await Promise.all([
      supabase.from('my_space_ingresos').select('*').eq('mes', mes),
      supabase.from('my_space_gastos_mes').select('*, my_space_gastos_fijos(persona, categoria, subcategoria)').eq('mes', mes),
      supabase.from('my_space_gastos_fijos').select('*').eq('activo', true),
      supabase.from('my_space_deudas').select('*').eq('tipo','debo'),
    ])
    if (ing) setIngresos(ing)
    if (gm)  setGastosMes(gm)
    if (gf)  setGastosFijos(gf)
    if (deu) setDeudas(deu)
    setLoading(false)
  }

  const totalIngresos  = ingresos.reduce((s,i)=>s+i.monto,0)
  const totalGastos    = gastosMes.reduce((s,g)=>s+g.monto_real,0)
  const totalGastosRef = gastosFijos.reduce((s,g)=>s+g.monto_ref,0)
  const saldo          = totalIngresos - totalGastos
  const totalDeudas    = deudas.reduce((s,d)=>s+d.saldo_total,0)

  const porPersona = PERSONAS.map(p => ({
    persona: p,
    gastado: gastosMes.filter(g=>g.my_space_gastos_fijos?.persona===p).reduce((s,g)=>s+g.monto_real,0),
    ref:     gastosFijos.filter(g=>g.persona===p).reduce((s,g)=>s+g.monto_ref,0),
  }))

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Resumen financiero</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom:20 }}>
            {[
              { label:'Ingresos del mes',  val:cop(totalIngresos), color:'var(--green)', sub:`${ingresos.length} fuentes` },
              { label:'Gastos registrados',val:cop(totalGastos),   color:'var(--red)',   sub:`Ref: ${cop(totalGastosRef)}` },
              { label:'Saldo disponible',  val:cop(saldo),         color:saldo>=0?'var(--gold)':'var(--red)', sub:saldo>=0?'Positivo':'⚠️ Déficit' },
              { label:'Total deudas',      val:cop(totalDeudas),   color:'var(--text3)', sub:`${deudas.length} deudas activas` },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
                <div className="kpi-accent" style={{ background:k.color }} />
              </div>
            ))}
          </div>

          {/* Por persona */}
          <div className="grid-2" style={{ gap:16, marginBottom:16 }}>
            <div className="panel">
              <div className="panel-title">Gastos por persona</div>
              {porPersona.map(p => {
                const pct = p.ref > 0 ? Math.min(100, Math.round((p.gastado/p.ref)*100)) : 0
                const color = pct===0?'var(--text4)':pct<=80?'var(--green)':pct<=100?'var(--gold)':'var(--red)'
                return (
                  <div key={p.persona} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
                        {PERSONA_EMOJI[p.persona]} {p.persona}
                      </div>
                      <div style={{ fontSize:12, color }}>
                        {cop(p.gastado)} / {cop(p.ref)}
                      </div>
                    </div>
                    <div className="prog-wrap" style={{ height:6 }}>
                      <div className="prog-fill" style={{ width:`${pct}%`, height:6, background:color, transition:'width .5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="panel">
              <div className="panel-title">Ingresos del mes</div>
              {ingresos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>
                  Sin ingresos registrados
                </div>
              ) : ingresos.map(i => {
                const fuente = FUENTES_INGRESO.find(f=>f.id===i.fuente)
                return (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:13, color:'var(--text)' }}>
                      {fuente?.emoji} {i.fuente_nombre || fuente?.label || i.fuente}
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>{cop(i.monto)}</div>
                  </div>
                )
              })}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Total</span>
                <span style={{ fontSize:16, fontWeight:900, color:'var(--green)' }}>{cop(totalIngresos)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── INGRESOS ─────────────────────────────────────────────────────────────────
function Ingresos() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [fuente,   setFuente]   = useState('salario')
  const [nombreF,  setNombreF]  = useState('')
  const [monto,    setMonto]    = useState('')
  const [guardando,setGuardando]= useState(false)
  const mes = new Date().toISOString().slice(0,7)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_ingresos').select('*').eq('mes', mes).order('created_at', { ascending:false })
    if (data) setItems(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!monto) return
    setGuardando(true)
    const fuenteInfo = FUENTES_INGRESO.find(f=>f.id===fuente)
    await supabase.from('my_space_ingresos').insert({
      mes, fuente, fuente_nombre: nombreF || fuenteInfo?.label, tipo: fuenteInfo?.tipo || 'variable', monto: parseInt(monto)
    })
    setMonto(''); setNombreF('')
    setModal(false); setGuardando(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_ingresos').delete().eq('id', id)
    setItems(prev => prev.filter(i=>i.id!==id))
  }

  const total = items.reduce((s,i)=>s+i.monto,0)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Ingresos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Registrar</button>
      </div>

      <div className="kpi-card" style={{ marginBottom:20 }}>
        <div className="kpi-label">Total ingresos del mes</div>
        <div className="kpi-val" style={{ color:'var(--green)', fontSize:32 }}>{cop(total)}</div>
        <div className="kpi-sub">{items.length} fuentes registradas</div>
      </div>

      {/* Por tipo */}
      <div className="grid-3" style={{ marginBottom:20 }}>
        {['fijo','variable','negocio'].map(t => {
          const sub = items.filter(i=>i.tipo===t)
          return (
            <div key={t} className="kpi-card">
              <div className="kpi-label">{t==='fijo'?'💼 Fijo':t==='variable'?'💵 Variable':'🏢 Negocios'}</div>
              <div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(sub.reduce((s,i)=>s+i.monto,0))}</div>
              <div className="kpi-sub">{sub.length} entradas</div>
            </div>
          )
        })}
      </div>

      <div className="panel">
        {loading ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin ingresos este mes</div>
        ) : items.map((item,i) => {
          const f = FUENTES_INGRESO.find(f=>f.id===item.fuente)
          return (
            <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:22 }}>{f?.emoji || '💵'}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.fuente_nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    <span style={{ padding:'1px 7px', borderRadius:6, fontSize:10, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)' }}>
                      {item.tipo}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{cop(item.monto)}</div>
                <div onClick={() => eliminar(item.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar ingreso</div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Fuente</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {FUENTES_INGRESO.map(f => (
                  <div key={f.id} onClick={() => setFuente(f.id)} style={{
                    padding:'10px 14px', borderRadius:8, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:10,
                    background: fuente===f.id ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${fuente===f.id?'var(--green-border)':'var(--border)'}`,
                  }}>
                    <span style={{ fontSize:18 }}>{f.emoji}</span>
                    <span style={{ fontSize:13, color: fuente===f.id?'var(--green)':'var(--text3)', fontWeight:fuente===f.id?700:400 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {(fuente==='ocasional'||fuente==='otro') && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción</div>
                <input type="text" value={nombreF} onChange={e=>setNombreF(e.target.value)} placeholder="Ej: Consultoría, comisión..." style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto (COP)</div>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 5000000" style={inputStyle} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!monto||guardando} className="btn-green" style={{ flex:1 }}>
                {guardando?'Guardando...':'Guardar ingreso'}
              </button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GASTOS POR PERSONA ───────────────────────────────────────────────────────
function GastosFamilia() {
  const [persona,    setPersona]    = useState('Hogar')
  const [gastosFijos,setGastosFijos]= useState([])
  const [gastosMes,  setGastosMes]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalConf,  setModalConf]  = useState(false)
  const [nuevaSub,   setNuevaSub]   = useState('')
  const [nuevaCat,   setNuevaCat]   = useState('')
  const mes = new Date().toISOString().slice(0,7)

  useEffect(() => { cargar() }, [persona])

  const cargar = async () => {
    setLoading(true)
    const [{ data:gf }, { data:gm }] = await Promise.all([
      supabase.from('my_space_gastos_fijos').select('*').eq('persona', persona).eq('activo',true).order('orden'),
      supabase.from('my_space_gastos_mes').select('*').eq('mes', mes),
    ])
    if (gf) setGastosFijos(gf)
    if (gm) setGastosMes(gm)
    setLoading(false)
  }

  const inicializarTemplate = async () => {
    const template = GASTOS_TEMPLATE.filter(g=>g.persona===persona)
    let orden = 0
    for (const grupo of template) {
      for (const item of grupo.items) {
        await supabase.from('my_space_gastos_fijos').insert({
          persona, categoria:grupo.categoria, subcategoria:item, monto_ref:0, activo:true, orden:orden++
        })
      }
    }
    cargar()
  }

  const agregarItem = async () => {
    if (!nuevaSub || !nuevaCat) return
    await supabase.from('my_space_gastos_fijos').insert({
      persona, categoria:nuevaCat, subcategoria:nuevaSub, monto_ref:0, activo:true, orden:gastosFijos.length
    })
    setNuevaSub(''); setNuevaCat('')
    setModalConf(false); cargar()
  }

  const actualizarRef = async (id, val) => {
    await supabase.from('my_space_gastos_fijos').update({ monto_ref:parseInt(val)||0 }).eq('id', id)
    setGastosFijos(prev => prev.map(g=>g.id===id?{...g,monto_ref:parseInt(val)||0}:g))
  }

  const actualizarReal = async (gastoFijoId, val) => {
    const existe = gastosMes.find(g=>g.gasto_fijo_id===gastoFijoId)
    if (existe) {
      await supabase.from('my_space_gastos_mes').update({ monto_real:parseInt(val)||0 }).eq('id', existe.id)
      setGastosMes(prev => prev.map(g=>g.id===existe.id?{...g,monto_real:parseInt(val)||0}:g))
    } else {
      const { data } = await supabase.from('my_space_gastos_mes').insert({ gasto_fijo_id:gastoFijoId, mes, monto_real:parseInt(val)||0 }).select().single()
      if (data) setGastosMes(prev=>[...prev,data])
    }
  }

  const eliminarItem = async (id) => {
    await supabase.from('my_space_gastos_fijos').update({ activo:false }).eq('id', id)
    setGastosFijos(prev=>prev.filter(g=>g.id!==id))
  }

  const getReal = (id) => gastosMes.find(g=>g.gasto_fijo_id===id)?.monto_real || 0

  // Agrupar por categoría
  const porCategoria = gastosFijos.reduce((acc, g) => {
    if (!acc[g.categoria]) acc[g.categoria] = []
    acc[g.categoria].push(g)
    return acc
  }, {})

  const totalRef  = gastosFijos.reduce((s,g)=>s+g.monto_ref,0)
  const totalReal = gastosFijos.reduce((s,g)=>s+getReal(g.id),0)
  const color     = PERSONA_COLOR[persona]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Gastos por persona</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Presupuesto referencia vs real del mes</div>
      </div>

      {/* Selector persona */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {PERSONAS.map(p => (
          <div key={p} onClick={() => setPersona(p)} style={{
            padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700,
            background: persona===p ? `${PERSONA_COLOR[p]}22` : 'rgba(255,255,255,0.04)',
            border:`1px solid ${persona===p ? PERSONA_COLOR[p]+'44' : 'var(--border)'}`,
            color: persona===p ? PERSONA_COLOR[p] : 'var(--text3)',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{PERSONA_EMOJI[p]}</span> {p}
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:'Presupuesto ref.', val:cop(totalRef),        color:'var(--text)'  },
          { label:'Gasto real mes',   val:cop(totalReal),       color:totalReal>totalRef?'var(--red)':'var(--gold)' },
          { label:'Diferencia',       val:cop(totalRef-totalReal), color:totalRef-totalReal>=0?'var(--green)':'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : gastosFijos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>{PERSONA_EMOJI[persona]}</div>
          <div style={{ fontSize:14, color:'var(--text3)', marginBottom:16 }}>Sin categorías para {persona}</div>
          <button onClick={inicializarTemplate} className="btn-gold" style={{ padding:'10px 20px' }}>
            ✨ Inicializar con categorías predefinidas
          </button>
        </div>
      ) : (
        <>
          {Object.entries(porCategoria).map(([cat, items]) => {
            const catRef  = items.reduce((s,g)=>s+g.monto_ref,0)
            const catReal = items.reduce((s,g)=>s+getReal(g.id),0)
            const pct     = catRef>0 ? Math.min(100,Math.round((catReal/catRef)*100)) : 0
            const catColor = pct===0?'var(--text4)':pct<=80?'var(--green)':pct<=100?'var(--gold)':'var(--red)'
            return (
              <div key={cat} className="panel" style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color }}>
                    {cat}
                  </div>
                  <div style={{ fontSize:12, color:catColor, fontWeight:700 }}>
                    {cop(catReal)} / {cop(catRef)}
                  </div>
                </div>
                <div className="prog-wrap" style={{ height:4, marginBottom:12 }}>
                  <div className="prog-fill" style={{ width:`${pct}%`, height:4, background:catColor }} />
                </div>
                {items.map(g => {
                  const real = getReal(g.id)
                  return (
                    <div key={g.id} style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 24px', gap:8, alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize:12, color:'var(--text2)' }}>{g.subcategoria}</div>
                      <input type="number" defaultValue={g.monto_ref||''} placeholder="Ref."
                        onBlur={e=>actualizarRef(g.id,e.target.value)}
                        style={{ padding:'5px 8px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', color:'var(--text3)', fontSize:11, fontFamily:'inherit', outline:'none', textAlign:'center' }} />
                      <input type="number" defaultValue={real||''} placeholder="Real"
                        onBlur={e=>actualizarReal(g.id,e.target.value)}
                        style={{ padding:'5px 8px', borderRadius:6, background: real>g.monto_ref&&g.monto_ref>0?'rgba(224,82,82,0.08)':'rgba(255,255,255,0.06)', border:`1px solid ${real>g.monto_ref&&g.monto_ref>0?'rgba(224,82,82,0.3)':'var(--border)'}`, color:'var(--text)', fontSize:11, fontFamily:'inherit', outline:'none', textAlign:'center' }} />
                      <div onClick={() => eliminarItem(g.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)', textAlign:'center' }}>×</div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          <button onClick={() => setModalConf(true)} className="btn" style={{ width:'100%', marginTop:8 }}>
            + Agregar ítem
          </button>
        </>
      )}

      {modalConf && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:380, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo ítem — {persona}</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
              <input type="text" value={nuevaCat} onChange={e=>setNuevaCat(e.target.value)} placeholder="Ej: Salud, Vivienda..." style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre del gasto</div>
              <input type="text" value={nuevaSub} onChange={e=>setNuevaSub(e.target.value)} placeholder="Ej: Gym, Netflix..." style={inputStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={agregarItem} disabled={!nuevaSub||!nuevaCat} className="btn-green" style={{ flex:1 }}>Agregar</button>
              <button onClick={() => setModalConf(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SIMULADOR DE ESCENARIOS ──────────────────────────────────────────────────
function Simulador() {
  const [ingresoBase,  setIngresoBase]  = useState(0)
  const [negocios, setNegocios] = useState({
    zabu:    { label:'ZABÚ 🌭',       semana:0, activo:false },
    rv:      { label:'RV Sports ⚽',   semana:0, activo:false },
    bombas:  { label:'Las Bombas 💣',  semana:0, activo:false },
    coco:    { label:'Coco Shake 🥥',  semana:0, activo:false },
  })
  const [gastosFijos, setGastosFijos] = useState(0)
  const [nombreEsc,   setNombreEsc]   = useState('')
  const [escenarios,  setEscenarios]  = useState([])
  const [guardando,   setGuardando]   = useState(false)

  useEffect(() => { cargarEscenarios(); cargarGastos() }, [])

  const cargarGastos = async () => {
    const { data } = await supabase.from('my_space_gastos_fijos').select('monto_ref').eq('activo',true)
    if (data) setGastosFijos(data.reduce((s,g)=>s+g.monto_ref,0))
  }

  const cargarEscenarios = async () => {
    const { data } = await supabase.from('my_space_escenarios').select('*').order('created_at', { ascending:false })
    if (data) setEscenarios(data)
  }

  const updateNegocio = (id, campo, val) => {
    setNegocios(prev => ({ ...prev, [id]: { ...prev[id], [campo]: val } }))
  }

  const totalNegocios = Object.values(negocios).filter(n=>n.activo).reduce((s,n)=>s+(n.semana*4.3),0)
  const totalIngresos = ingresoBase + totalNegocios
  const saldo         = totalIngresos - gastosFijos
  const saldoAnual    = saldo * 12

  const guardarEscenario = async () => {
    if (!nombreEsc) return
    setGuardando(true)
    await supabase.from('my_space_escenarios').insert({
      nombre: nombreEsc,
      ingreso_base: ingresoBase,
      negocios: negocios,
    })
    setNombreEsc('')
    setGuardando(false)
    cargarEscenarios()
  }

  const eliminarEsc = async (id) => {
    await supabase.from('my_space_escenarios').delete().eq('id', id)
    setEscenarios(prev=>prev.filter(e=>e.id!==id))
  }

  const cargarEscenario = (esc) => {
    setIngresoBase(esc.ingreso_base || 0)
    if (esc.negocios) setNegocios(esc.negocios)
  }

  // Metas de vida
  const METAS_VIDA = [
    { label:'🏠 Casa propia',         valor:500000000, meses: saldo>0 ? Math.ceil(500000000/saldo) : null },
    { label:'🚗 Carro nuevo',          valor:120000000, meses: saldo>0 ? Math.ceil(120000000/saldo) : null },
    { label:'🎓 Educación Lucía',      valor:200000000, meses: saldo>0 ? Math.ceil(200000000/saldo) : null },
    { label:'✈️ Viaje familiar',       valor:30000000,  meses: saldo>0 ? Math.ceil(30000000/saldo)  : null },
    { label:'🆘 Fondo emergencias',    valor:50000000,  meses: saldo>0 ? Math.ceil(50000000/saldo)  : null },
  ]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Simulador de escenarios</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>¿Qué pasa si...? Juega con tus ingresos futuros</div>
      </div>

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
        {/* Panel izquierdo — sliders */}
        <div>
          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">Ingreso base mensual</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>Salario + ingresos fijos actuales</div>
            <input type="number" value={ingresoBase||''} onChange={e=>setIngresoBase(parseInt(e.target.value)||0)}
              placeholder="Ej: 8000000" style={inputStyle} />
            {ingresoBase > 0 && (
              <div style={{ marginTop:10, fontSize:20, fontWeight:800, color:'var(--green)', textAlign:'center' }}>
                {cop(ingresoBase)}
              </div>
            )}
          </div>

          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">Proyección por negocio</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>¿Cuánto generaría cada negocio por semana?</div>
            {Object.entries(negocios).map(([id, neg]) => (
              <div key={id} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div onClick={() => updateNegocio(id,'activo',!neg.activo)} style={{
                    width:18, height:18, borderRadius:5, cursor:'pointer',
                    border:`1px solid ${neg.activo?'var(--green-border)':'var(--border)'}`,
                    background:neg.activo?'var(--green-dim)':'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--green)',
                  }}>{neg.activo&&'✓'}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:neg.activo?'var(--text)':'var(--text4)' }}>{neg.label}</div>
                  {neg.activo && <div style={{ marginLeft:'auto', fontSize:12, color:'var(--gold)', fontWeight:700 }}>
                    {cop(neg.semana*4.3)}/mes
                  </div>}
                </div>
                {neg.activo && (
                  <>
                    <input type="range" min={0} max={5000000} step={50000} value={neg.semana}
                      onChange={e=>updateNegocio(id,'semana',parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--gold)', cursor:'pointer' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text4)', marginTop:2 }}>
                      <span>$0</span>
                      <span style={{ color:'var(--gold)', fontWeight:600 }}>{cop(neg.semana)}/semana</span>
                      <span>$5M</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Guardar escenario */}
          <div className="panel">
            <div className="panel-title">Guardar escenario</div>
            <input type="text" value={nombreEsc} onChange={e=>setNombreEsc(e.target.value)}
              placeholder='Ej: "Solo Oh Wow", "ZABÚ + RV arrancando"' style={inputStyle} />
            <button onClick={guardarEscenario} disabled={!nombreEsc||guardando} className="btn-gold" style={{ width:'100%', marginTop:10 }}>
              {guardando?'Guardando...':'💾 Guardar escenario'}
            </button>
          </div>
        </div>

        {/* Panel derecho — resultados */}
        <div>
          {/* Resultado */}
          <div className="panel" style={{ marginBottom:12, border:`1px solid ${saldo>=0?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
            <div className="panel-title">Resultado del escenario</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Ingreso base',      val:cop(ingresoBase),    color:'var(--text2)'  },
                { label:'Negocios (mes)',     val:cop(totalNegocios),  color:'var(--gold)'   },
                { label:'Total ingresos',     val:cop(totalIngresos),  color:'var(--green)',  bold:true },
                { label:'Gastos fijos ref.',  val:cop(gastosFijos),   color:'var(--red)'    },
                { label:'Saldo mensual',      val:cop(saldo),         color:saldo>=0?'var(--green)':'var(--red)', bold:true },
                { label:'Proyección anual',   val:cop(saldoAnual),    color:saldoAnual>=0?'var(--gold)':'var(--red)', bold:true },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontSize:r.bold?16:13, fontWeight:r.bold?900:600, color:r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metas de vida */}
          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">¿Cuándo puedo lograr mis metas?</div>
            {saldo <= 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>
                ⚠️ Con este escenario el saldo es negativo. Ajusta los ingresos.
              </div>
            ) : METAS_VIDA.map(m => (
              <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.label}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Valor: {cop(m.valor)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>
                    {m.meses ? (m.meses > 120 ? '+10 años' : m.meses > 12 ? `${Math.floor(m.meses/12)}a ${m.meses%12}m` : `${m.meses} meses`) : '—'}
                  </div>
                  <div style={{ fontSize:10, color:'var(--text4)' }}>ahorrando todo el saldo</div>
                </div>
              </div>
            ))}
          </div>

          {/* Escenarios guardados */}
          {escenarios.length > 0 && (
            <div className="panel">
              <div className="panel-title">Escenarios guardados</div>
              {escenarios.map(e => (
                <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{e.nombre}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => cargarEscenario(e)} className="btn" style={{ fontSize:11, padding:'4px 10px' }}>Cargar</button>
                    <div onClick={() => eliminarEsc(e.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)', display:'flex', alignItems:'center' }}>×</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    await supabase.from('my_space_metas').insert({ nombre, objetivo:parseInt(objetivo), actual:parseInt(actual||0), emoji })
    setNombre(''); setObjetivo(''); setActual(''); setEmoji('🎯')
    setModal(false); setGuardando(false); cargar()
  }

  const actualizar = async (id, val) => {
    await supabase.from('my_space_metas').update({ actual:parseInt(val) }).eq('id', id)
    setMetas(prev=>prev.map(m=>m.id===id?{...m,actual:parseInt(val)}:m))
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_metas').delete().eq('id', id)
    setMetas(prev=>prev.filter(m=>m.id!==id))
  }

  const EMOJIS = ['🎯','🏠','🚗','✈️','💰','📚','💪','🌎','🏖️','👨‍👩‍👧','🎓','🏆','🏡','🛥️','💍','🌱']

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
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {metas.map(m => {
            const pct = Math.min(100, Math.round((m.actual/m.objetivo)*100))
            const completada = pct >= 100
            return (
              <div key={m.id} className="panel">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:32 }}>{m.emoji}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:completada?'var(--green)':'var(--text)' }}>
                        {m.nombre} {completada&&'✅'}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                        {cop(m.actual)} de {cop(m.objetivo)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:completada?'var(--green)':'var(--gold)' }}>{pct}%</div>
                    <div onClick={() => eliminar(m.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--red)' }}>×</div>
                  </div>
                </div>
                <div className="prog-wrap" style={{ height:8, marginBottom:10 }}>
                  <div className="prog-fill" style={{ width:`${pct}%`, height:8, background:completada?'var(--green)':pct>=60?'var(--gold)':'var(--red)', transition:'width .5s' }} />
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Actualizar:</div>
                  <input type="number" defaultValue={m.actual} onBlur={e=>actualizar(m.id,e.target.value)}
                    style={{ width:130, padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
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
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                {EMOJIS.map(e => (
                  <div key={e} onClick={() => setEmoji(e)} style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', background:emoji===e?'var(--gold-dim)':'rgba(255,255,255,0.05)', border:`1px solid ${emoji===e?'var(--gold-border)':'var(--border)'}` }}>{e}</div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Casa propia" style={inputStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto objetivo (COP)</div>
              <input type="number" value={objetivo} onChange={e=>setObjetivo(e.target.value)} placeholder="Ej: 300000000" style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Ya tengo ahorrado</div>
              <input type="number" value={actual} onChange={e=>setActual(e.target.value)} placeholder="Ej: 5000000" style={inputStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={guardando||!nombre||!objetivo} className="btn-green" style={{ flex:1 }}>
                {guardando?'Guardando...':'Guardar meta'}
              </button>
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
  const [deudas,   setDeudas]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [tipo,     setTipo]     = useState('debo')
  const [acreedor, setAcreedor] = useState('')
  const [total,    setTotal]    = useState('')
  const [cuota,    setCuota]    = useState('')
  const [vence,    setVence]    = useState('')
  const [desc,     setDesc]     = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_deudas').select('*').order('saldo_total', { ascending:false })
    if (data) setDeudas(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!acreedor||!total) return
    await supabase.from('my_space_deudas').insert({ tipo, acreedor, saldo_total:parseInt(total), cuota_mensual:parseInt(cuota||0), fecha_vencimiento:vence||null, descripcion:desc })
    setAcreedor(''); setTotal(''); setCuota(''); setVence(''); setDesc('')
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_deudas').delete().eq('id', id)
    setDeudas(prev=>prev.filter(d=>d.id!==id))
  }

  const debo    = deudas.filter(d=>d.tipo==='debo').reduce((s,d)=>s+d.saldo_total,0)
  const meDeben = deudas.filter(d=>d.tipo==='me_deben').reduce((s,d)=>s+d.saldo_total,0)

  const diasVence = (f) => {
    if (!f) return null
    return Math.ceil((new Date(f)-new Date())/(1000*60*60*24))
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Deudas y créditos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Plan de salida · Lo que debes y lo que te deben</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar</button>
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {[
          { label:'Total deudas',    val:cop(debo),    color:'var(--red)',   sub:`${deudas.filter(d=>d.tipo==='debo').length} deudas activas` },
          { label:'Te deben a ti',   val:cop(meDeben), color:'var(--green)', sub:`${deudas.filter(d=>d.tipo==='me_deben').length} pendientes` },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerta Datacredito */}
      {deudas.some(d=>d.descripcion?.toLowerCase().includes('datacredito')||d.descripcion?.toLowerCase().includes('reporte')) && (
        <div style={{ padding:'14px 16px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:12, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:4 }}>⚠️ Reportado en Datacredito</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>Saldar las deudas bancarias es prioridad para limpiar el historial crediticio.</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : deudas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin deudas registradas</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {deudas.map(d => {
            const dias   = diasVence(d.fecha_vencimiento)
            const alerta = dias!==null && dias<=7
            return (
              <div key={d.id} className="panel" style={{ border:`1px solid ${d.tipo==='debo'?'rgba(224,82,82,0.2)':'rgba(76,175,80,0.2)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, fontWeight:600,
                        background:d.tipo==='debo'?'var(--red-dim)':'var(--green-dim)',
                        color:d.tipo==='debo'?'var(--red)':'var(--green)',
                        border:`0.5px solid ${d.tipo==='debo'?'rgba(224,82,82,0.3)':'var(--green-border)'}`,
                      }}>{d.tipo==='debo'?'Le debo a':'Me debe'}</span>
                      {alerta && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)' }}>⚠️ Vence pronto</span>}
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{d.acreedor}</div>
                    {d.descripcion && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{d.descripcion}</div>}
                    {d.cuota_mensual>0 && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Cuota: {cop(d.cuota_mensual)}/mes</div>}
                    {d.fecha_vencimiento && <div style={{ fontSize:11, color:alerta?'var(--gold)':'var(--text4)', marginTop:2 }}>Vence: {d.fecha_vencimiento}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:18, fontWeight:900, color:d.tipo==='debo'?'var(--red)':'var(--green)' }}>{cop(d.saldo_total)}</div>
                    <div onClick={() => eliminar(d.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva deuda / crédito</div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[{id:'debo',label:'Le debo a alguien'},{id:'me_deben',label:'Me deben a mí'}].map(t => (
                <div key={t.id} onClick={() => setTipo(t.id)} style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background:tipo===t.id?(t.id==='debo'?'var(--red-dim)':'var(--green-dim)'):'rgba(255,255,255,0.04)',
                  border:`1px solid ${tipo===t.id?(t.id==='debo'?'rgba(224,82,82,0.3)':'var(--green-border)'):'var(--border)'}`,
                  color:tipo===t.id?(t.id==='debo'?'var(--red)':'var(--green)'):'var(--text3)',
                  fontSize:11, fontWeight:600,
                }}>{t.label}</div>
              ))}
            </div>
            {[
              {label:'Nombre / Entidad',   val:acreedor, set:setAcreedor, ph:'Ej: Banco, Jorge', type:'text'},
              {label:'Saldo total',         val:total,    set:setTotal,    ph:'Ej: 2900000',     type:'number'},
              {label:'Cuota mensual',       val:cuota,    set:setCuota,    ph:'Opcional',        type:'number'},
              {label:'Fecha vencimiento',   val:vence,    set:setVence,    ph:'',                type:'date'},
              {label:'Descripción / Notas', val:desc,     set:setDesc,     ph:'Ej: Datacredito, préstamo flash', type:'text'},
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

// ─── MY SPACE PRINCIPAL ───────────────────────────────────────────────────────
export default function MySpace() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab,      setTab]      = useState('resumen')

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />

  const TABS = [
    { id:'resumen',    label:'📊 Resumen'    },
    { id:'ingresos',   label:'💰 Ingresos'   },
    { id:'gastos',     label:'🏠 Gastos'     },
    { id:'deudas',     label:'💳 Deudas'     },
    { id:'simulador',  label:'🔮 Simulador'  },
    { id:'metas',      label:'🎯 Metas'      },
  ]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>My Space 🔐</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Centro de control financiero personal · Luis Restrepo</div>
      </div>

      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab==='resumen'   && <Resumen />}
      {tab==='ingresos'  && <Ingresos />}
      {tab==='gastos'    && <GastosFamilia />}
      {tab==='deudas'    && <Deudas />}
      {tab==='simulador' && <Simulador />}
      {tab==='metas'     && <Metas />}
    </div>
  )
}
