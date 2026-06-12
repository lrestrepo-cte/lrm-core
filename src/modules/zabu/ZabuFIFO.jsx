import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function diasRestantes(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  return Math.ceil((new Date(fecha) - hoy) / (1000*60*60*24))
}

function labelDias(d) {
  if (d === null) return '—'
  if (d < 0)   return `Vencido hace ${Math.abs(d)}d`
  if (d === 0) return '¡Vence HOY!'
  if (d === 1) return 'Vence mañana'
  return `${d} días`
}

function colorDias(d) {
  if (d === null) return 'var(--text4)'
  if (d <= 0)  return 'var(--red)'
  if (d <= 2)  return 'var(--red)'
  if (d <= 5)  return 'var(--gold)'
  return 'var(--green)'
}

function bgDias(d) {
  if (d === null) return 'var(--bg3)'
  if (d <= 2)  return 'rgba(224,82,82,0.08)'
  if (d <= 5)  return 'rgba(201,168,76,0.08)'
  return 'var(--bg3)'
}

function borderDias(d) {
  if (d === null) return 'var(--border)'
  if (d <= 2)  return 'rgba(224,82,82,0.4)'
  if (d <= 5)  return 'var(--gold-border)'
  return 'rgba(76,175,80,0.3)'
}

const LOTES_INIT = [
  { id:1,  ingrediente:'Salchicha Pavo',     lote:'SP-001', entrada:'2026-06-08', vence:'2026-06-14', cantidad:16, restante:16, unidad:'uds',  carrito:'C01', temp:'Refrigerado' },
  { id:2,  ingrediente:'Salchicha Pavo',     lote:'SP-002', entrada:'2026-06-11', vence:'2026-06-17', cantidad:16, restante:16, unidad:'uds',  carrito:'C01', temp:'Refrigerado' },
  { id:3,  ingrediente:'Salchicha Hot Dog',  lote:'SH-001', entrada:'2026-06-08', vence:'2026-06-14', cantidad:14, restante:9,  unidad:'uds',  carrito:'C01', temp:'Refrigerado' },
  { id:4,  ingrediente:'Salchicha Hot Dog',  lote:'SH-002', entrada:'2026-06-11', vence:'2026-06-17', cantidad:14, restante:14, unidad:'uds',  carrito:'C01', temp:'Refrigerado' },
  { id:5,  ingrediente:'Cream Code™',        lote:'CC-001', entrada:'2026-06-08', vence:'2026-06-12', cantidad:100,restante:65, unidad:'%',    carrito:'C01', temp:'Refrigerado' },
  { id:6,  ingrediente:'Cream Code™',        lote:'CC-002', entrada:'2026-06-11', vence:'2026-06-15', cantidad:100,restante:100,unidad:'%',    carrito:'C01', temp:'Refrigerado' },
  { id:7,  ingrediente:'ZaBun™',             lote:'ZB-001', entrada:'2026-06-09', vence:'2026-06-13', cantidad:30, restante:22, unidad:'uds',  carrito:'C01', temp:'Ambiente'    },
  { id:8,  ingrediente:'ZaBun™',             lote:'ZB-002', entrada:'2026-06-12', vence:'2026-06-16', cantidad:30, restante:30, unidad:'uds',  carrito:'C01', temp:'Ambiente'    },
  { id:9,  ingrediente:'Tocineta Crispy',    lote:'TC-001', entrada:'2026-06-07', vence:'2026-06-15', cantidad:500,restante:180,unidad:'g',    carrito:'C01', temp:'Refrigerado' },
  { id:10, ingrediente:'Piña Caramelizada',  lote:'PC-001', entrada:'2026-06-08', vence:'2026-06-11', cantidad:200,restante:60, unidad:'g',    carrito:'C01', temp:'Refrigerado' },
  { id:11, ingrediente:'Piña Caramelizada',  lote:'PC-002', entrada:'2026-06-11', vence:'2026-06-14', cantidad:200,restante:200,unidad:'g',    carrito:'C01', temp:'Refrigerado' },
  { id:12, ingrediente:'Queso Cheddar',      lote:'QC-001', entrada:'2026-06-09', vence:'2026-06-16', cantidad:400,restante:340,unidad:'g',    carrito:'C01', temp:'Refrigerado' },
  { id:13, ingrediente:'Mantequilla',        lote:'MT-001', entrada:'2026-06-08', vence:'2026-06-20', cantidad:250,restante:210,unidad:'g',    carrito:'C01', temp:'Refrigerado' },
]

export default function ZabuFIFO() {
  const [lotes, setLotes]       = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarLotes = async () => {
      const { data } = await supabase
        .from('lotes')
        .select('*')
        .order('vence', { ascending: true })
      if (data && data.length > 0) {
        setLotes(data)
      } else {
        // Cargar datos iniciales si la tabla está vacía
        const { data: insertados } = await supabase
          .from('lotes')
          .insert(LOTES_INIT.map(l => ({
            ingrediente: l.ingrediente,
            lote:        l.lote,
            entrada:     l.entrada,
            vence:       l.vence,
            cantidad:    l.cantidad,
            restante:    l.restante,
            unidad:      l.unidad,
            carrito:     l.carrito,
            temp:        l.temp,
          })))
          .select()
        if (insertados) setLotes(insertados)
      }
      setCargando(false)
    }
    cargarLotes()
  }, [])
  const [modalAdd, setModalAdd] = useState(false)
  const [modalConsumo, setModalConsumo] = useState(null)
  const [consumoCant, setConsumoCant]   = useState('')

  const [nIngrediente, setNIngrediente] = useState('')
  const [nLote,        setNLote]        = useState('')
  const [nEntrada,     setNEntrada]     = useState(new Date().toISOString().split('T')[0])
  const [nVence,       setNVence]       = useState('')
  const [nCantidad,    setNCantidad]    = useState('')
  const [nUnidad,      setNUnidad]      = useState('uds')
  const [nCarrito,     setNCarrito]     = useState('C01')
  const [nTemp,        setNTemp]        = useState('Refrigerado')

  // Calcular FIFO automático por ingrediente
  const lotesConDias = lotes
    .filter(l => l.restante > 0)
    .map(l => ({ ...l, dias: diasRestantes(l.vence) }))

  const ingredientes = [...new Set(lotesConDias.map(l => l.ingrediente))]

  const fifoActual = ingredientes.map(ing => {
    const lotesIng = lotesConDias
      .filter(l => l.ingrediente === ing)
      .sort((a, b) => new Date(a.vence) - new Date(b.vence)) // ordena por vencimiento
    const usar = lotesIng[0] // el que vence primero = usar primero
    const siguiente = lotesIng[1] || null
    return { ing, usar, siguiente, totalRestante: lotesIng.reduce((s,l)=>s+l.restante,0) }
  }).sort((a,b) => (a.usar?.dias ?? 999) - (b.usar?.dias ?? 999)) // más urgente primero

  const criticos  = fifoActual.filter(f => f.usar && f.usar.dias !== null && f.usar.dias <= 2)
  const atencion  = fifoActual.filter(f => f.usar && f.usar.dias !== null && f.usar.dias > 2 && f.usar.dias <= 5)
  const ok        = fifoActual.filter(f => f.usar && f.usar.dias !== null && f.usar.dias > 5)

  const registrarConsumo = async () => {
    const cant = parseFloat(consumoCant)
    if (!cant || cant <= 0 || !modalConsumo) return
    const nuevoRestante = Math.max(0, modalConsumo.restante - cant)
    await supabase
      .from('lotes')
      .update({ restante: nuevoRestante })
      .eq('id', modalConsumo.id)
    setLotes(prev => prev.map(l =>
      l.id === modalConsumo.id ? { ...l, restante: nuevoRestante } : l
    ))
    setModalConsumo(null); setConsumoCant('')
  }
  const agregar = async () => {
    if (!nIngrediente.trim() || !nVence || !nCantidad) return
    const { data } = await supabase
      .from('lotes')
      .insert({
        ingrediente: nIngrediente,
        lote:        nLote || `L-${Date.now()}`,
        entrada:     nEntrada,
        vence:       nVence,
        cantidad:    parseFloat(nCantidad),
        restante:    parseFloat(nCantidad),
        unidad:      nUnidad,
        carrito:     nCarrito,
        temp:        nTemp,
      })
      .select()
      .single()
    if (data) setLotes(prev => [...prev, data])
    setNIngrediente(''); setNLote(''); setNCantidad(''); setNVence('')
    setModalAdd(false)
  }
  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  if (cargando) return (
  <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
    <div style={{ fontSize:13 }}>Cargando lotes...</div>
  </div>
)

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingredientes',  val:String(ingredientes.length), color:'var(--text)',  sub:'con stock activo'       },
          { label:'🔴 Críticos',   val:String(criticos.length),     color:'var(--red)',   sub:'usar HOY o mañana'      },
          { label:'⚠️ Atención',   val:String(atencion.length),     color:'var(--gold)',  sub:'vencen en 3-5 días'     },
          { label:'✅ En orden',   val:String(ok.length),           color:'var(--green)', sub:'más de 5 días'          },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:4 }}>
            Sistema FIFO automático
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>
            El sistema ordena automáticamente por fecha de vencimiento. Usa siempre el lote indicado.
          </div>
        </div>
        <button className="btn-gold" onClick={() => setModalAdd(true)}>+ Registrar lote</button>
      </div>

      {/* Críticos primero — banner */}
      {criticos.length > 0 && (
        <div style={{ background:'rgba(224,82,82,0.08)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--red)', marginBottom:12 }}>
            🚨 USAR HOY — Vencimiento crítico
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
            {criticos.map(f => (
              <div key={f.ing} style={{ background:'rgba(224,82,82,0.1)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(224,82,82,0.2)' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{f.ing}</div>
                <div style={{ fontSize:12, color:'var(--red)', fontWeight:700, marginBottom:2 }}>Lote: {f.usar.lote}</div>
                <div style={{ fontSize:11, color:'var(--red)' }}>{labelDias(f.usar.dias)} · {f.usar.restante} {f.usar.unidad}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIFO por ingrediente */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {fifoActual.map(f => {
          const d = f.usar?.dias
          return (
            <div key={f.ing} style={{
              background: bgDias(d), borderRadius:14,
              border:`1px solid ${borderDias(d)}`,
              padding:'16px 20px',
            }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr', gap:16, alignItems:'center' }}>

                {/* Ingrediente + qué usar */}
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:6 }}>USA PRIMERO</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{f.ing}</div>
                  {f.usar && (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:colorDias(d), flexShrink:0 }} />
                        <span style={{ fontSize:14, fontWeight:700, color:colorDias(d) }}>Lote {f.usar.lote}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', paddingLeft:16 }}>
                        Vence: {f.usar.vence} · <span style={{ color:colorDias(d), fontWeight:700 }}>{labelDias(d)}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', paddingLeft:16 }}>
                        Restante: <span style={{ color:'var(--text2)', fontWeight:600 }}>{f.usar.restante} {f.usar.unidad}</span>
                        <span style={{ color:'var(--text4)', marginLeft:8 }}>/ {f.usar.cantidad} {f.usar.unidad} inicial</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text4)', paddingLeft:16 }}>
                        🌡 {f.usar.temp} · Carrito {f.usar.carrito}
                      </div>
                    </div>
                  )}
                </div>

                {/* Siguiente lote */}
                <div>
                  {f.siguiente ? (
                    <>
                      <div style={{ fontSize:11, color:'var(--text4)', letterSpacing:1, marginBottom:6 }}>SIGUIENTE</div>
                      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', border:'1px solid var(--border)' }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', marginBottom:3 }}>Lote {f.siguiente.lote}</div>
                        <div style={{ fontSize:11, color:'var(--text4)' }}>
                          Vence: {f.siguiente.vence} · {labelDias(f.siguiente.dias)}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>
                          {f.siguiente.restante} {f.siguiente.unidad} disponibles
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:11, color:'var(--text4)', letterSpacing:1, marginBottom:6 }}>SIGUIENTE</div>
                      <div style={{ background:'rgba(224,82,82,0.05)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(224,82,82,0.15)' }}>
                        <div style={{ fontSize:12, color:'var(--red)', fontWeight:600 }}>Sin lote siguiente</div>
                        <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>Programa una compra</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ fontSize:11, color:'var(--text4)', letterSpacing:1, marginBottom:2 }}>STOCK TOTAL</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--text2)' }}>
                    {f.totalRestante} <span style={{ fontSize:12, fontWeight:400 }}>{f.usar?.unidad}</span>
                  </div>
                  <button onClick={() => { setModalConsumo(f.usar); setConsumoCant('') }} style={{
                    padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700,
                    background:'rgba(201,168,76,0.1)', border:'0.5px solid var(--gold-border)',
                    color:'var(--gold)', fontFamily:'inherit', transition:'all .15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background='rgba(201,168,76,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background='rgba(201,168,76,0.1)'}
                  >
                    Registrar consumo
                  </button>
                </div>
              </div>

              {/* Barra de progreso del lote activo */}
              {f.usar && (
                <div style={{ marginTop:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text4)', marginBottom:4 }}>
                    <span>Stock restante del lote activo</span>
                    <span>{Math.round((f.usar.restante/f.usar.cantidad)*100)}%</span>
                  </div>
                  <div className="prog-wrap" style={{ height:6 }}>
                    <div className="prog-fill" style={{
                      width:`${(f.usar.restante/f.usar.cantidad)*100}%`,
                      background: (f.usar.restante/f.usar.cantidad) > 0.5 ? 'var(--green)' : (f.usar.restante/f.usar.cantidad) > 0.2 ? 'var(--gold)' : 'var(--red)',
                      height:6
                    }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal consumo */}
      {modalConsumo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:340, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Registrar consumo</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>
              {modalConsumo.ingrediente} · Lote {modalConsumo.lote} · {modalConsumo.restante} {modalConsumo.unidad} restantes
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Cantidad consumida ({modalConsumo.unidad})</div>
            <input type="number" value={consumoCant} onChange={e => setConsumoCant(e.target.value)}
              placeholder={`Ej: ${modalConsumo.unidad === 'uds' ? '5' : '100'}`} autoFocus
              style={{ width:'100%', padding:'14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--gold-border)', color:'var(--text)', fontSize:20, fontFamily:'inherit', outline:'none', textAlign:'center', fontWeight:700 }} />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={registrarConsumo}>Confirmar</button>
              <button className="btn" onClick={() => setModalConsumo(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar lote */}
      {modalAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:400, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar nuevo lote</div>
            {[
              { label:'Ingrediente',          val:nIngrediente, set:setNIngrediente, type:'text',   ph:'Ej: Salchicha Pavo'  },
              { label:'Número de lote',        val:nLote,        set:setNLote,        type:'text',   ph:'Ej: SP-003'          },
              { label:'Fecha de entrada',      val:nEntrada,     set:setNEntrada,     type:'date',   ph:''                    },
              { label:'Fecha de vencimiento',  val:nVence,       set:setNVence,       type:'date',   ph:''                    },
              { label:'Cantidad',              val:nCantidad,    set:setNCantidad,    type:'number', ph:'Ej: 16'              },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Unidad</div>
              <select value={nUnidad} onChange={e => setNUnidad(e.target.value)} style={inputStyle}>
                {['uds','g','kg','ml','l','%'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Temperatura</div>
              <select value={nTemp} onChange={e => setNTemp(e.target.value)} style={inputStyle}>
                {['Refrigerado','Congelado','Ambiente'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Carrito</div>
              <select value={nCarrito} onChange={e => setNCarrito(e.target.value)} style={inputStyle}>
                {['C01','C02','C03'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={agregar}>Registrar lote</button>
              <button className="btn" onClick={() => setModalAdd(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}