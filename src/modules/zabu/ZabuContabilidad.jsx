import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) {
  const abs = Math.abs(Math.round(n))
  const fmt = abs >= 1000000 ? '$'+(abs/1000000).toFixed(1)+'M' : '$'+abs.toLocaleString('es-CO')
  return n < 0 ? '-'+fmt : fmt
}

const TIPO_COLORS = {
  activo:    { color:'#378ADD', bg:'rgba(55,138,221,0.1)',  border:'rgba(55,138,221,0.3)'  },
  pasivo:    { color:'#e05252', bg:'rgba(224,82,82,0.1)',   border:'rgba(224,82,82,0.3)'   },
  patrimonio:{ color:'#9C27B0', bg:'rgba(156,39,176,0.1)', border:'rgba(156,39,176,0.3)'  },
  ingreso:   { color:'#4caf50', bg:'rgba(76,175,80,0.1)',   border:'rgba(76,175,80,0.3)'   },
  costo:     { color:'#FF9800', bg:'rgba(255,152,0,0.1)',   border:'rgba(255,152,0,0.3)'   },
  gasto:     { color:'#C9A84C', bg:'rgba(201,168,76,0.1)', border:'rgba(201,168,76,0.3)'  },
}

export default function ZabuContabilidad() {
  const [tab, setTab]             = useState('diario')
  const [plan, setPlan]           = useState([])
  const [asientos, setAsientos]   = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalAdd, setModalAdd]   = useState(false)
  const [modalMov, setModalMov]   = useState(false)
  const [cuentaSel, setCuentaSel] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Nuevo asiento
  const [nFecha,    setNFecha]    = useState(new Date().toISOString().split('T')[0])
  const [nDesc,     setNDesc]     = useState('')
  const [nPartidas, setNPartidas] = useState([
    { codigo:'', nombre:'', debe:0, haber:0 },
    { codigo:'', nombre:'', debe:0, haber:0 },
  ])

  // Nuevo movimiento
  const [mTipo,     setMTipo]     = useState('egreso')
  const [mFecha,    setMFecha]    = useState(new Date().toISOString().split('T')[0])
  const [mDesc,     setMDesc]     = useState('')
  const [mCat,      setMCat]      = useState('')
  const [mMonto,    setMMonto]    = useState('')
  const [mCarrito,  setMCarrito]  = useState('C01')

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data: planData }, { data: asientosData }, { data: movsData }] = await Promise.all([
      supabase.from('plan_cuentas').select('*').eq('activo', true).order('codigo'),
      supabase.from('asientos').select('*, partidas(*)').order('fecha', { ascending: false }),
      supabase.from('movimientos').select('*').order('fecha', { ascending: false }),
    ])
    if (planData)      setPlan(planData)
    if (asientosData)  setAsientos(asientosData)
    if (movsData)      setMovimientos(movsData)
    setLoading(false)
  }

  // ─── CÁLCULOS ──────────────────────────────────────────────────────────────

  const saldoPorCuenta = () => {
    const saldos = {}
    plan.forEach(c => { saldos[c.codigo] = { ...c, debe:0, haber:0, saldo:0 } })
    asientos.forEach(a => {
      (a.partidas || []).forEach(p => {
        if (saldos[p.codigo]) {
          saldos[p.codigo].debe  += p.debe  || 0
          saldos[p.codigo].haber += p.haber || 0
        }
      })
    })
    Object.keys(saldos).forEach(k => {
      const c = saldos[k]
      saldos[k].saldo = c.naturaleza === 'debito' ? c.debe - c.haber : c.haber - c.debe
    })
    return saldos
  }

  const saldos        = saldoPorCuenta()
  const totalDebe     = Object.values(saldos).reduce((s,c) => s+c.debe, 0)
  const totalHaber    = Object.values(saldos).reduce((s,c) => s+c.haber, 0)
  const cuadra        = Math.abs(totalDebe - totalHaber) < 1

  const totalIngresos = Object.values(saldos).filter(c=>c.tipo==='ingreso').reduce((s,c)=>s+c.saldo,0)
  const totalCostos   = Object.values(saldos).filter(c=>c.tipo==='costo').reduce((s,c)=>s+c.saldo,0)
  const totalGastos   = Object.values(saldos).filter(c=>c.tipo==='gasto').reduce((s,c)=>s+c.saldo,0)
  const utilidadBruta = totalIngresos - totalCostos
  const utilidadNeta  = utilidadBruta - totalGastos
  const totalActivos  = Object.values(saldos).filter(c=>c.tipo==='activo').reduce((s,c)=>s+c.saldo,0)
  const totalPasivos  = Object.values(saldos).filter(c=>c.tipo==='pasivo').reduce((s,c)=>s+c.saldo,0)
  const totalPatrimonio = Object.values(saldos).filter(c=>c.tipo==='patrimonio').reduce((s,c)=>s+c.saldo,0) + utilidadNeta

  const totalMovIngresos = movimientos.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0)
  const totalMovEgresos  = movimientos.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+m.monto,0)
  const saldoMov         = totalMovIngresos - totalMovEgresos

  // ─── NUEVO ASIENTO ─────────────────────────────────────────────────────────

  const totalDebeN  = nPartidas.reduce((s,p)=>s+Number(p.debe||0),0)
  const totalHaberN = nPartidas.reduce((s,p)=>s+Number(p.haber||0),0)
  const cuadraN     = Math.abs(totalDebeN-totalHaberN)<1

  const updatePartida = (i, field, val) => {
    setNPartidas(prev => {
      const next = [...prev]
      if (field === 'codigo') {
        const cuenta = plan.find(c=>c.codigo===val)
        next[i] = { ...next[i], codigo:val, nombre:cuenta?.nombre||'' }
      } else {
        next[i] = { ...next[i], [field]:val }
      }
      return next
    })
  }

  const registrarAsiento = async () => {
    if (!nDesc.trim() || !cuadraN) return
    const { data: asiento, error } = await supabase.from('asientos').insert({
      fecha: nFecha, descripcion: nDesc
    }).select().single()
    if (error || !asiento) return

    const partidas = nPartidas
      .filter(p => p.codigo && (p.debe>0||p.haber>0))
      .map(p => ({ asiento_id:asiento.id, codigo:p.codigo, nombre:p.nombre, debe:Number(p.debe)||0, haber:Number(p.haber)||0 }))

    await supabase.from('partidas').insert(partidas)
    setNDesc(''); setNPartidas([{codigo:'',nombre:'',debe:0,haber:0},{codigo:'',nombre:'',debe:0,haber:0}])
    setModalAdd(false)
    cargarTodo()
  }

  const registrarMovimiento = async () => {
    if (!mDesc.trim() || !mMonto) return
    await supabase.from('movimientos').insert({
      fecha:mFecha, descripcion:mDesc, tipo:mTipo,
      categoria:mCat, monto:parseInt(mMonto), carrito:mCarrito
    })
    setMDesc(''); setMMonto(''); setMCat('')
    setModalMov(false)
    cargarTodo()
  }

  const inputStyle = {
    width:'100%', padding:'9px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:5,
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>
      <div style={{ fontSize:24, marginBottom:12 }}>⏳</div>
      <div>Cargando contabilidad...</div>
    </div>
  )

  const categorias = [...new Set(plan.map(c=>c.grupo))].sort()
  const movsFiltrados = filtroTipo === 'todos' ? movimientos : movimientos.filter(m=>m.tipo===filtroTipo)

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingresos',     val:cop(totalIngresos), color:'var(--green)', sub:'ventas acumuladas'    },
          { label:'Utilidad neta',val:cop(utilidadNeta),  color:utilidadNeta>=0?'var(--green)':'var(--red)', sub:'después de gastos' },
          { label:'Saldo caja',   val:cop(saldoMov),      color:saldoMov>=0?'var(--gold)':'var(--red)', sub:'movimientos registrados' },
          { label:'Balance',      val:cuadra?'✅ Cuadra':'⚠️ Error', color:cuadra?'var(--green)':'var(--red)', sub:'partida doble' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color, fontSize:k.label==='Balance'?16:22 }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div className="sub-nav" style={{ marginBottom:0 }}>
          {[
            { id:'diario',      label:'Diario'           },
            { id:'movimientos', label:'Movimientos'      },
            { id:'mayor',       label:'Libro mayor'      },
            { id:'balance',     label:'Balance prueba'   },
            { id:'resultados',  label:'Est. resultados'  },
            { id:'general',     label:'Balance general'  },
            { id:'plan',        label:'Plan de cuentas'  },
          ].map(t => (
            <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={() => setModalMov(true)}>+ Movimiento</button>
          <button className="btn-gold" onClick={() => setModalAdd(true)}>+ Asiento</button>
        </div>
      </div>

      {/* ── DIARIO ── */}
      {tab === 'diario' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {asientos.length === 0 && (
            <div className="panel" style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>
              Sin asientos registrados. Crea el primero con el botón + Asiento.
            </div>
          )}
          {asientos.map(a => {
            const td = (a.partidas||[]).reduce((s,p)=>s+p.debe,0)
            const th = (a.partidas||[]).reduce((s,p)=>s+p.haber,0)
            const ok = Math.abs(td-th)<1
            return (
              <div key={a.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{a.descripcion}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{a.fecha}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(td)}</span>
                    <span style={{ fontSize:9, padding:'2px 8px', borderRadius:8,
                      background:ok?'var(--green-dim)':'var(--red-dim)',
                      color:ok?'var(--green)':'var(--red)',
                      border:`0.5px solid ${ok?'var(--green-border)':'rgba(224,82,82,0.3)'}`,
                    }}>{ok?'✓ Cuadra':'⚠ Error'}</span>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr', marginBottom:4 }}>
                  {['Código','Cuenta','Débito','Crédito'].map(h => (
                    <div key={h} style={{ fontSize:9, color:'var(--text4)', padding:'0 8px 4px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                {(a.partidas||[]).map((p,i) => {
                  const tc = TIPO_COLORS[plan.find(c=>c.codigo===p.codigo)?.tipo] || TIPO_COLORS.gasto
                  return (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize:11, padding:'6px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.codigo}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', paddingLeft:p.haber>0?24:8 }}>{p.nombre}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color:p.debe>0?'var(--text2)':'var(--text4)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.debe>0?cop(p.debe):'—'}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color:p.haber>0?tc.color:'var(--text4)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.haber>0?cop(p.haber):'—'}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MOVIMIENTOS ── */}
      {tab === 'movimientos' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:8 }}>
            {['todos','ingreso','egreso'].map(f => (
              <div key={f} onClick={() => setFiltroTipo(f)} style={{
                padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                background:filtroTipo===f?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                border:`0.5px solid ${filtroTipo===f?'var(--gold-border)':'var(--border)'}`,
                color:filtroTipo===f?'var(--gold)':'var(--text3)',
                fontWeight:filtroTipo===f?700:400, textTransform:'capitalize',
              }}>{f==='todos'?'Todos':f==='ingreso'?'Ingresos':'Egresos'}</div>
            ))}
          </div>

          <div className="grid-3" style={{ gap:10, marginBottom:4 }}>
            {[
              { label:'Ingresos',  val:cop(totalMovIngresos), color:'var(--green)' },
              { label:'Egresos',   val:cop(totalMovEgresos),  color:'var(--red)'   },
              { label:'Saldo',     val:cop(saldoMov),         color:saldoMov>=0?'var(--gold)':'var(--red)' },
            ].map(k => (
              <div key={k.label} style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{k.label}</div>
                <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div className="panel">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr 1fr 1fr', marginBottom:8 }}>
              {['Fecha','Descripción','Categoría','Tipo','Monto'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 8px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>
            {movsFiltrados.length === 0 && (
              <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text4)', fontSize:13 }}>Sin movimientos</div>
            )}
            {movsFiltrados.map((m,i) => (
              <div key={m.id} style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr 1fr 1fr', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:11, padding:'9px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.fecha}</div>
                <div style={{ fontSize:12, padding:'9px 8px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.descripcion}</div>
                <div style={{ fontSize:11, padding:'9px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.categoria}</div>
                <div style={{ fontSize:11, padding:'9px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, fontWeight:600,
                    background:m.tipo==='ingreso'?'var(--green-dim)':'var(--red-dim)',
                    color:m.tipo==='ingreso'?'var(--green)':'var(--red)',
                    border:`0.5px solid ${m.tipo==='ingreso'?'var(--green-border)':'rgba(224,82,82,0.3)'}`,
                  }}>{m.tipo==='ingreso'?'Ingreso':'Egreso'}</span>
                </div>
                <div style={{ fontSize:13, padding:'9px 8px', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)', color:m.tipo==='ingreso'?'var(--green)':'var(--red)' }}>
                  {m.tipo==='ingreso'?'+':'-'}{cop(m.monto)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIBRO MAYOR ── */}
      {tab === 'mayor' && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {['activo','pasivo','patrimonio','ingreso','costo','gasto'].map(t => {
              const tc = TIPO_COLORS[t]
              return (
                <div key={t} onClick={() => setCuentaSel(cuentaSel===t?null:t)} style={{
                  padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                  background:cuentaSel===t?tc.bg:'rgba(255,255,255,0.04)',
                  border:`0.5px solid ${cuentaSel===t?tc.border:'var(--border)'}`,
                  color:cuentaSel===t?tc.color:'var(--text3)',
                  fontWeight:cuentaSel===t?700:400, textTransform:'capitalize',
                }}>{t}</div>
              )
            })}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {plan
              .filter(c => !cuentaSel || c.tipo===cuentaSel)
              .filter(c => saldos[c.codigo]?.debe>0 || saldos[c.codigo]?.haber>0)
              .map(cuenta => {
                const s = saldos[cuenta.codigo]
                const tc = TIPO_COLORS[cuenta.tipo]
                const movs = asientos.flatMap(a => (a.partidas||[])
                  .filter(p=>p.codigo===cuenta.codigo)
                  .map(p=>({...p, fecha:a.fecha, desc:a.descripcion}))
                )
                let acum = 0
                return (
                  <div key={cuenta.codigo} className="panel">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:tc.bg, color:tc.color, border:`0.5px solid ${tc.border}`, fontWeight:600 }}>{cuenta.codigo}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{cuenta.nombre}</div>
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, color:tc.color }}>{cop(s.saldo)}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', marginBottom:4 }}>
                      {['Fecha','Descripción','Débito','Crédito','Saldo'].map(h => (
                        <div key={h} style={{ fontSize:9, color:'var(--text4)', padding:'0 8px 4px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                      ))}
                    </div>
                    {movs.map((m,i) => {
                      acum += cuenta.naturaleza==='debito' ? m.debe-m.haber : m.haber-m.debe
                      return (
                        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                          <div style={{ fontSize:11, padding:'6px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.fecha}</div>
                          <div style={{ fontSize:12, padding:'6px 8px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.desc}</div>
                          <div style={{ fontSize:12, padding:'6px 8px', color:m.debe>0?'var(--text2)':'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.debe>0?cop(m.debe):'—'}</div>
                          <div style={{ fontSize:12, padding:'6px 8px', color:m.haber>0?tc.color:'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.haber>0?cop(m.haber):'—'}</div>
                          <div style={{ fontSize:12, padding:'6px 8px', color:tc.color, fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(acum)}</div>
                        </div>
                      )
                    })}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
                      <div style={{ padding:'8px', gridColumn:'1/3' }}><span style={{ fontSize:12, color:'var(--text3)', fontWeight:700 }}>TOTALES</span></div>
                      <div style={{ fontSize:13, padding:'8px', color:'var(--text2)', fontWeight:800 }}>{cop(s.debe)}</div>
                      <div style={{ fontSize:13, padding:'8px', color:tc.color, fontWeight:800 }}>{cop(s.haber)}</div>
                      <div style={{ fontSize:14, padding:'8px', color:tc.color, fontWeight:900 }}>{cop(s.saldo)}</div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── BALANCE DE PRUEBA ── */}
      {tab === 'balance' && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Balance de prueba — sumas y saldos</div>
            <div style={{ fontSize:11, padding:'4px 14px', borderRadius:20,
              background:cuadra?'var(--green-dim)':'var(--red-dim)',
              color:cuadra?'var(--green)':'var(--red)',
              border:`0.5px solid ${cuadra?'var(--green-border)':'rgba(224,82,82,0.3)'}`,
              fontWeight:700,
            }}>{cuadra?'✅ Balance cuadrado':'⚠️ No cuadra'}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
            {['Código','Cuenta','Suma débito','Suma crédito','Saldo débito','Saldo crédito'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 8px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>
          {plan.filter(c=>saldos[c.codigo]?.debe>0||saldos[c.codigo]?.haber>0).map((c,i) => {
            const s = saldos[c.codigo]
            const tc = TIPO_COLORS[c.tipo]
            return (
              <div key={c.codigo} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:11, padding:'7px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{c.codigo}</div>
                <div style={{ fontSize:12, padding:'7px 8px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:tc.color, flexShrink:0 }} />{c.nombre}
                </div>
                <div style={{ fontSize:12, padding:'7px 8px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(s.debe)}</div>
                <div style={{ fontSize:12, padding:'7px 8px', color:tc.color, fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(s.haber)}</div>
                <div style={{ fontSize:12, padding:'7px 8px', color:c.naturaleza==='debito'?'var(--text2)':'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{c.naturaleza==='debito'&&s.saldo>0?cop(s.saldo):'—'}</div>
                <div style={{ fontSize:12, padding:'7px 8px', color:c.naturaleza==='credito'?tc.color:'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{c.naturaleza==='credito'&&s.saldo>0?cop(s.saldo):'—'}</div>
              </div>
            )
          })}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:6, borderRadius:8 }}>
            <div style={{ padding:'10px', gridColumn:'1/3' }}><span style={{ fontSize:13, color:'var(--text)', fontWeight:800 }}>TOTALES</span></div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(totalDebe)}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(totalHaber)}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--green)', fontWeight:900 }}>{cop(Object.values(saldos).filter(c=>c.naturaleza==='debito').reduce((s,c)=>s+c.saldo,0))}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--green)', fontWeight:900 }}>{cop(Object.values(saldos).filter(c=>c.naturaleza==='credito').reduce((s,c)=>s+c.saldo,0))}</div>
          </div>
        </div>
      )}

      {/* ── ESTADO DE RESULTADOS ── */}
      {tab === 'resultados' && (
        <div style={{ maxWidth:620 }}>
          <div className="panel">
            <div style={{ textAlign:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:2, fontWeight:600, marginBottom:4 }}>ZABÚ — HOT DOGS DE VERDAD</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Estado de Resultados</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Período acumulado · {new Date().toLocaleDateString('es-CO')}</div>
            </div>

            {[
              { titulo:'INGRESOS OPERACIONALES', tipo:'ingreso', color:'var(--green)', total:totalIngresos },
              { titulo:'COSTO DE VENTAS',         tipo:'costo',   color:'#FF9800',      total:totalCostos  },
            ].map(grupo => (
              <div key={grupo.titulo} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:grupo.color, letterSpacing:1, fontWeight:700, marginBottom:8 }}>{grupo.titulo}</div>
                {plan.filter(c=>c.tipo===grupo.tipo&&saldos[c.codigo]?.saldo>0).map(c => (
                  <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize:12, color:'var(--text3)', paddingLeft:12 }}>{c.nombre}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:grupo.color }}>{cop(saldos[c.codigo].saldo)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total {grupo.tipo === 'ingreso' ? 'ingresos' : 'costos'}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:grupo.color }}>{grupo.tipo==='costo'?`(${cop(grupo.total)})`:cop(grupo.total)}</span>
                </div>
              </div>
            ))}

            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:utilidadBruta>=0?'var(--green-dim)':'var(--red-dim)', borderRadius:10, marginBottom:16, border:`1px solid ${utilidadBruta>=0?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>UTILIDAD BRUTA</span>
              <span style={{ fontSize:16, fontWeight:900, color:utilidadBruta>=0?'var(--green)':'var(--red)' }}>{cop(utilidadBruta)}</span>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:1, fontWeight:700, marginBottom:8 }}>GASTOS OPERACIONALES</div>
              {[...new Set(plan.filter(c=>c.tipo==='gasto').map(c=>c.grupo))].map(grp => {
                const cuentasGrp = plan.filter(c=>c.tipo==='gasto'&&c.grupo===grp&&saldos[c.codigo]?.saldo>0)
                if (cuentasGrp.length===0) return null
                const totalGrp = cuentasGrp.reduce((s,c)=>s+saldos[c.codigo].saldo,0)
                return (
                  <div key={grp} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:1, marginBottom:4, paddingLeft:4 }}>{grp.replace('Gastos operacionales — ','').toUpperCase()}</div>
                    {cuentasGrp.map(c => (
                      <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize:12, color:'var(--text3)', paddingLeft:12 }}>{c.nombre}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--gold)' }}>{cop(saldos[c.codigo].saldo)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total gastos</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>({cop(totalGastos)})</span>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 20px', background:utilidadNeta>=0?'rgba(76,175,80,0.12)':'var(--red-dim)', borderRadius:12, border:`2px solid ${utilidadNeta>=0?'var(--green-border)':'rgba(224,82,82,0.4)'}` }}>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>UTILIDAD NETA</span>
              <span style={{ fontSize:22, fontWeight:900, color:utilidadNeta>=0?'var(--green)':'var(--red)' }}>{cop(utilidadNeta)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BALANCE GENERAL ── */}
      {tab === 'general' && (
        <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
          <div className="panel">
            <div style={{ textAlign:'center', marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:2, fontWeight:600, marginBottom:2 }}>ZABÚ</div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Balance General</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO')}</div>
            </div>
            <div style={{ fontSize:11, color:'var(--blue)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>ACTIVOS</div>
            {[...new Set(plan.filter(c=>c.tipo==='activo').map(c=>c.grupo))].map(grp => {
              const cuentasGrp = plan.filter(c=>c.tipo==='activo'&&c.grupo===grp&&saldos[c.codigo]?.saldo>0)
              if (cuentasGrp.length===0) return null
              return (
                <div key={grp} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:1, marginBottom:4 }}>{grp.toUpperCase()}</div>
                  {cuentasGrp.map(c => (
                    <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--blue)' }}>{cop(saldos[c.codigo].saldo)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 8px', borderTop:'2px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>TOTAL ACTIVOS</span>
              <span style={{ fontSize:16, fontWeight:900, color:'var(--blue)' }}>{cop(totalActivos)}</span>
            </div>
          </div>

          <div className="panel">
            <div style={{ height:60, marginBottom:14 }} />
            <div style={{ fontSize:11, color:'var(--red)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>PASIVOS</div>
            {plan.filter(c=>c.tipo==='pasivo'&&saldos[c.codigo]?.saldo>0).map(c => (
              <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--red)' }}>{cop(saldos[c.codigo].saldo)}</span>
              </div>
            ))}
            {plan.filter(c=>c.tipo==='pasivo').every(c=>!saldos[c.codigo]?.saldo) && (
              <div style={{ fontSize:12, color:'var(--text4)', padding:'8px', textAlign:'center' }}>Sin pasivos registrados</div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px', borderTop:'1px solid var(--border)', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total pasivos</span>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--red)' }}>{cop(totalPasivos)}</span>
            </div>

            <div style={{ fontSize:11, color:'#9C27B0', letterSpacing:1, fontWeight:700, marginBottom:10 }}>PATRIMONIO</div>
            {plan.filter(c=>c.tipo==='patrimonio'&&saldos[c.codigo]?.saldo>0).map(c => (
              <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#9C27B0' }}>{cop(saldos[c.codigo].saldo)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Utilidad del ejercicio</span>
              <span style={{ fontSize:12, fontWeight:600, color:utilidadNeta>=0?'var(--green)':'var(--red)' }}>{cop(utilidadNeta)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px', borderTop:'1px solid var(--border)', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total patrimonio</span>
              <span style={{ fontSize:14, fontWeight:800, color:'#9C27B0' }}>{cop(totalPatrimonio)}</span>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 8px', borderTop:'2px solid var(--border)' }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>PASIVOS + PATRIMONIO</span>
              <span style={{ fontSize:16, fontWeight:900, color:Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1?'var(--green)':'var(--red)' }}>{cop(totalPasivos+totalPatrimonio)}</span>
            </div>
            <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, textAlign:'center',
              background:Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1?'var(--green-dim)':'var(--red-dim)',
              border:`1px solid ${Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1?'var(--green-border)':'rgba(224,82,82,0.3)'}`,
            }}>
              <span style={{ fontSize:13, fontWeight:700, color:Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1?'var(--green)':'var(--red)' }}>
                {Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1?'✅ Balance cuadrado':'⚠️ Balance no cuadra'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN DE CUENTAS ── */}
      {tab === 'plan' && (
        <div className="panel">
          <div className="panel-title">Plan de cuentas — {plan.length} cuentas activas</div>
          {['activo','pasivo','patrimonio','ingreso','costo','gasto'].map(tipo => {
            const tc = TIPO_COLORS[tipo]
            const cuentas = plan.filter(c=>c.tipo===tipo)
            if (cuentas.length===0) return null
            return (
              <div key={tipo} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, padding:'4px 12px', borderRadius:6, display:'inline-block', background:tc.bg, color:tc.color, border:`0.5px solid ${tc.border}`, fontWeight:700, letterSpacing:1, marginBottom:10, textTransform:'uppercase' }}>{tipo}</div>
                {cuentas.map((c,i) => (
                  <div key={c.codigo} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 10px', background:i%2===0?'transparent':'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:tc.color, minWidth:44 }}>{c.codigo}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', flex:1 }}>{c.nombre}</div>
                    <div style={{ fontSize:10, color:'var(--text4)' }}>{c.grupo.replace('Gastos operacionales — ','')}</div>
                    <div style={{ fontSize:10, padding:'1px 7px', borderRadius:6, background:'rgba(255,255,255,0.04)', color:'var(--text3)' }}>{c.naturaleza==='debito'?'Débito':'Crédito'}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL NUEVO ASIENTO ── */}
      {modalAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:600, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo asiento contable</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5 }}>Fecha</div>
                <input type="date" value={nFecha} onChange={e=>setNFecha(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5 }}>Descripción</div>
                <input type="text" value={nDesc} onChange={e=>setNDesc(e.target.value)} placeholder="Ej: Ventas del día..." style={inputStyle} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 28px', gap:6, marginBottom:8 }}>
              {['Código','Cuenta','Débito','Crédito',''].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {nPartidas.map((p,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 28px', gap:6, marginBottom:6 }}>
                <select value={p.codigo} onChange={e=>updatePartida(i,'codigo',e.target.value)} style={{ ...inputStyle, padding:'7px 8px', marginTop:0 }}>
                  <option value="">—</option>
                  {plan.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo}</option>)}
                </select>
                <div style={{ padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center' }}>
                  {p.nombre || '—'}
                </div>
                <input type="number" value={p.debe||''} onChange={e=>updatePartida(i,'debe',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign:'right', marginTop:0 }} />
                <input type="number" value={p.haber||''} onChange={e=>updatePartida(i,'haber',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign:'right', marginTop:0 }} />
                <div onClick={() => setNPartidas(prev=>prev.filter((_,j)=>j!==i))} style={{ width:28, height:36, borderRadius:8, background:'rgba(224,82,82,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--red)', fontSize:16 }}>×</div>
              </div>
            ))}

            <button className="btn" style={{ marginTop:8, marginBottom:20 }} onClick={() => setNPartidas(prev=>[...prev,{codigo:'',nombre:'',debe:0,haber:0}])}>
              + Agregar partida
            </button>

            <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:16,
              background:cuadraN?'var(--green-dim)':'var(--red-dim)',
              border:`1px solid ${cuadraN?'var(--green-border)':'rgba(224,82,82,0.3)'}`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span style={{ color:'var(--text3)' }}>Total débito</span>
                <span style={{ fontWeight:700, color:'var(--text2)' }}>{cop(totalDebeN)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'var(--text3)' }}>Total crédito</span>
                <span style={{ fontWeight:700, color:'var(--text2)' }}>{cop(totalHaberN)}</span>
              </div>
              <div style={{ marginTop:8, fontSize:13, fontWeight:700, textAlign:'center', color:cuadraN?'var(--green)':'var(--red)' }}>
                {cuadraN?'✅ El asiento cuadra':'⚠️ Débito ≠ Crédito'}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={registrarAsiento} disabled={!cuadraN||!nDesc.trim()}>
                Registrar asiento
              </button>
              <button className="btn" onClick={() => setModalAdd(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO MOVIMIENTO ── */}
      {modalMov && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar movimiento</div>

            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['ingreso','egreso'].map(t => (
                <div key={t} onClick={() => setMTipo(t)} style={{
                  flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background:mTipo===t?(t==='ingreso'?'var(--green-dim)':'var(--red-dim)'):'rgba(255,255,255,0.04)',
                  border:`1px solid ${mTipo===t?(t==='ingreso'?'var(--green-border)':'rgba(224,82,82,0.3)'):'var(--border)'}`,
                  color:mTipo===t?(t==='ingreso'?'var(--green)':'var(--red)'):'var(--text3)',
                  fontSize:13, fontWeight:700, textTransform:'capitalize',
                }}>{t}</div>
              ))}
            </div>

            {[
              { label:'Fecha',        val:mFecha,  set:setMFecha,  type:'date', ph:'' },
              { label:'Descripción',  val:mDesc,   set:setMDesc,   type:'text', ph:'Ej: Compra salchichas...' },
              { label:'Categoría',    val:mCat,    set:setMCat,    type:'text', ph:'Ej: Ingredientes, Personal...' },
              { label:'Monto (COP)',  val:mMonto,  set:setMMonto,  type:'number', ph:'Ej: 85000' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Carrito</div>
              <select value={mCarrito} onChange={e=>setMCarrito(e.target.value)} style={inputStyle}>
                {['C01','C02','C03'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={registrarMovimiento}>Registrar</button>
              <button className="btn" onClick={() => setModalMov(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}