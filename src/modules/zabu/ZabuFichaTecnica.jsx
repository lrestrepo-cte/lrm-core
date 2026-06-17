// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const CATEGORIA_COLORS = {
  Pan:'#C9A84C', Proteína:'#4caf50', Salsa:'#378ADD', Topping:'#9C27B0',
  Queso:'#FF9800', Lácteo:'#00BCD4', Empaque:'#666', Otro:'#888',
}
const CATEGORIAS = ['Pan','Proteína','Salsa','Topping','Queso','Lácteo','Empaque','Otro']

// Costo real del ingrediente: si es 'insumo', promedio de lotes activos por producto_nombre.
// Si es 'receta', el costo_unitario del lote MÁS RECIENTE producido con ese nombre
// (el que se crea automáticamente cuando se ejecuta "Producir" en Recetario).
function costoIngrediente(ing, lotes) {
  const candidatos = lotes
    .filter(l => l.producto_nombre === ing.nombre)
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))

  if (ing.origen === 'receta') {
    const ultimo = candidatos[0]
    return ultimo ? ultimo.costo_unitario : null
  }
  // origen 'insumo': promedio de lotes activos
  const activos = candidatos.filter(l => l.estado === 'activo')
  if (activos.length === 0) return null
  return activos.reduce((s,l)=>s+l.costo_unitario,0) / activos.length
}

function ModalFicha({ ficha, productosExistentes, onClose, onSaved }) {
  const [form, setForm] = useState(ficha || { nombre:'', emoji:'🌭', precio_venta:'', food_cost_max:45 })
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(!!ficha)

  useEffect(() => { if (ficha) cargar() }, [ficha])

  const cargar = async () => {
    const { data } = await supabase.from('zabu_ficha_ingredientes').select('*').eq('ficha_id', ficha.id).order('orden')
    setIngredientes(data || [])
    setLoading(false)
  }

  const agregarIngrediente = () => setIngredientes(prev => [...prev, { nombre:'', categoria:'Otro', origen:'insumo', gramaje:'', cantidad:1, unidad:'unidad' }])
  const actualizarIngrediente = (i, campo, valor) => setIngredientes(prev => prev.map((ing, idx) => idx === i ? { ...ing, [campo]: valor } : ing))
  const quitarIngrediente = (i) => setIngredientes(prev => prev.filter((_, idx) => idx !== i))

  const guardar = async () => {
    if (!form.nombre || !form.precio_venta || ingredientes.length === 0) return
    let fichaId = ficha?.id
    const payload = { nombre: form.nombre, emoji: form.emoji, precio_venta: parseInt(form.precio_venta), food_cost_max: parseFloat(form.food_cost_max) || 45 }

    if (fichaId) {
      await supabase.from('zabu_fichas_tecnicas').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', fichaId)
      await supabase.from('zabu_ficha_ingredientes').delete().eq('ficha_id', fichaId)
    } else {
      const { data, error } = await supabase.from('zabu_fichas_tecnicas').insert(payload).select().single()
      if (error) { alert('Error: ' + error.message); return }
      fichaId = data.id
    }

    const insert = ingredientes.filter(i=>i.nombre).map((ing, idx) => ({
      ficha_id: fichaId, nombre: ing.nombre, categoria: ing.categoria, origen: ing.origen,
      gramaje: ing.gramaje, cantidad: parseFloat(ing.cantidad)||1, unidad: ing.unidad, orden: idx,
    }))
    if (insert.length > 0) await supabase.from('zabu_ficha_ingredientes').insert(insert)
    onSaved()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:600, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>{ficha ? 'Editar ficha técnica' : 'Nueva ficha técnica'}</div>

        <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre del plato</div>
            <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="ZABÚ, CheeZabú..." style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Emoji</div>
            <input type="text" value={form.emoji} onChange={e=>setForm(p=>({...p,emoji:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Precio de venta</div>
            <input type="number" value={form.precio_venta} onChange={e=>setForm(p=>({...p,precio_venta:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Food cost máximo (%)</div>
            <input type="number" value={form.food_cost_max} onChange={e=>setForm(p=>({...p,food_cost_max:e.target.value}))} style={iStyle} />
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Ingredientes del plato</div>
            <div onClick={agregarIngrediente} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar ingrediente</div>
          </div>
          <div style={{ fontSize:10, color:'var(--text4)', marginBottom:8 }}>
            Origen "Insumo" = se compra directo (busca costo en Inventario). Origen "Receta" = se produce en Recetario (busca el costo del último lote producido).
          </div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)' }}>Cargando...</div>
          : ingredientes.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>Sin ingredientes — agrega al menos uno</div>
          : ingredientes.map((ing,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 0.8fr 0.7fr 24px', gap:6, marginBottom:6, alignItems:'center' }}>
              <input type="text" list="productos-disponibles" value={ing.nombre} onChange={e=>actualizarIngrediente(i,'nombre',e.target.value)} placeholder="Nombre" style={{...iStyle,marginTop:0}} />
              <select value={ing.categoria} onChange={e=>actualizarIngrediente(i,'categoria',e.target.value)} style={{...iStyle,marginTop:0}}>
                {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select value={ing.origen} onChange={e=>actualizarIngrediente(i,'origen',e.target.value)} style={{...iStyle,marginTop:0}}>
                <option value="insumo">Insumo</option><option value="receta">Receta</option>
              </select>
              <input type="text" value={ing.gramaje} onChange={e=>actualizarIngrediente(i,'gramaje',e.target.value)} placeholder="160g" style={{...iStyle,marginTop:0}} />
              <input type="number" value={ing.cantidad} onChange={e=>actualizarIngrediente(i,'cantidad',e.target.value)} style={{...iStyle,marginTop:0}} />
              <div onClick={()=>quitarIngrediente(i)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14, textAlign:'center' }}>×</div>
            </div>
          ))}
          <datalist id="productos-disponibles">
            {productosExistentes.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} disabled={!form.nombre||!form.precio_venta} className="btn-green" style={{ flex:1 }}>{ficha ? 'Guardar cambios' : 'Crear ficha'}</button>
          <button onClick={onClose} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function ZabuFichaTecnica({ usuario }) {
  const [fichas, setFichas] = useState([])
  const [ingredientesPorFicha, setIngredientesPorFicha] = useState({})
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from('zabu_fichas_tecnicas').select('*').order('nombre'),
      supabase.from('zabu_lotes').select('*'),
    ])
    setFichas(f || []); setLotes(l || [])
    if (f && f.length > 0) {
      const { data: ings } = await supabase.from('zabu_ficha_ingredientes').select('*').in('ficha_id', f.map(x=>x.id)).order('orden')
      const agrupado = {}
      ;(ings||[]).forEach(ing => { if (!agrupado[ing.ficha_id]) agrupado[ing.ficha_id]=[]; agrupado[ing.ficha_id].push(ing) })
      setIngredientesPorFicha(agrupado)
      if (!sel) setSel(f[0])
    }
    setLoading(false)
  }

  const eliminarFicha = async (id) => { await supabase.from('zabu_fichas_tecnicas').delete().eq('id', id); setSel(null); cargar() }

  // Restricción de acceso: solo CEO ve este módulo
  if (usuario && usuario.rol !== 'ceo') {
    return (
      <div className="panel" style={{ textAlign:'center', padding:'50px 20px', maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>🔒</div>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Acceso restringido</div>
        <div style={{ fontSize:13, color:'var(--text3)' }}>La Ficha Técnica con costos reales es información confidencial — solo visible para CEO.</div>
      </div>
    )
  }

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando fichas técnicas...</div>

  const productosExistentes = [...new Set(lotes.map(l=>l.producto_nombre))]
  const ingredientesSel = sel ? (ingredientesPorFicha[sel.id] || []) : []
  const costos = ingredientesSel.map(ing => ({ ...ing, costo: costoIngrediente(ing, lotes) }))
  const faltantes = costos.filter(c => c.costo === null)
  const costoTotal = costos.reduce((s,c)=>s+(c.costo||0)*c.cantidad,0)
  const foodCost = sel && sel.precio_venta > 0 ? ((costoTotal/sel.precio_venta)*100) : 0
  const margen = sel && sel.precio_venta > 0 ? (((sel.precio_venta-costoTotal)/sel.precio_venta)*100) : 0
  const alerta = sel && foodCost > sel.food_cost_max

  const porCategoria = costos.reduce((acc,c) => { acc[c.categoria] = (acc[c.categoria]||0) + (c.costo||0)*c.cantidad; return acc }, {})

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>🔒 Solo CEO — costos reales calculados desde Inventario y Recetario</div>
        <button onClick={()=>setModal('nueva')} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva ficha técnica</button>
      </div>

      {fichas.length === 0 ? (
        <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:13, color:'var(--text4)' }}>Sin fichas técnicas creadas. Crea la primera (ej: ZABÚ).</div>
        </div>
      ) : (
        <>
          {sel && faltantes.length > 0 && (
            <div style={{ padding:'10px 16px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontSize:12, color:'var(--gold)', marginBottom:16 }}>
              ⚠️ Falta costo real de: {faltantes.map(f=>f.nombre).join(', ')}. {faltantes.some(f=>f.origen==='receta') ? 'Produce la receta correspondiente en Recetario.' : 'Registra el lote en Inventario.'}
            </div>
          )}

          {sel && (
            <div className="grid-4" style={{ marginBottom:20 }}>
              <div className="kpi-card"><div className="kpi-label">Costo total</div><div className="kpi-val" style={{ color:'var(--text)' }}>{faltantes.length>0?'Incompleto':cop(costoTotal)}</div><div className="kpi-sub">{ingredientesSel.length} ingredientes</div></div>
              <div className="kpi-card"><div className="kpi-label">Precio venta</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(sel.precio_venta)}</div><div className="kpi-sub">precio oficial</div></div>
              <div className="kpi-card"><div className="kpi-label">Food cost</div><div className="kpi-val" style={{ color: alerta?'var(--red)':'var(--green)' }}>{faltantes.length>0?'—':foodCost.toFixed(1)+'%'}</div><div className="kpi-sub">máx {sel.food_cost_max}% {alerta?'⚠️ EXCEDIDO':'✅ OK'}</div></div>
              <div className="kpi-card"><div className="kpi-label">Margen</div><div className="kpi-val" style={{ color:'var(--green)' }}>{faltantes.length>0?'—':margen.toFixed(1)+'%'}</div><div className="kpi-sub">{faltantes.length>0?'':cop(sel.precio_venta-costoTotal)+' por unidad'}</div></div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16, alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="panel">
                <div className="panel-title">Productos</div>
                {fichas.map(f => {
                  const ings = ingredientesPorFicha[f.id]||[]
                  const cs = ings.map(i=>({...i,costo:costoIngrediente(i,lotes)}))
                  const ct = cs.reduce((s,c)=>s+(c.costo||0)*c.cantidad,0)
                  const incompleto = cs.some(c=>c.costo===null)
                  const fc = f.precio_venta>0 ? (ct/f.precio_venta)*100 : 0
                  const al = fc > f.food_cost_max
                  return (
                    <div key={f.id} onClick={()=>setSel(f)} style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', marginBottom:8,
                      background: sel?.id===f.id?'var(--gold-dim)':'rgba(255,255,255,0.02)', border:`1px solid ${sel?.id===f.id?'var(--gold-border)':'var(--border)'}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:22 }}>{f.emoji}</span>
                        <span style={{ fontSize:14, fontWeight:700, color: sel?.id===f.id?'var(--gold)':'var(--text)' }}>{f.nombre}</span>
                        {al && !incompleto && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:6, background:'var(--red-dim)', color:'var(--red)' }}>FC ALTO</span>}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <span style={{ color:'var(--text3)' }}>Costo: <span style={{ color:'var(--text2)', fontWeight:600 }}>{incompleto?'incompleto':cop(ct)}</span></span>
                        {!incompleto && <span style={{ color: al?'var(--red)':'var(--green)', fontWeight:700 }}>{fc.toFixed(1)}% FC</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop:8 }}>
                        <button onClick={(e)=>{e.stopPropagation(); setModal(f)}} className="btn" style={{ fontSize:10, padding:'4px 10px' }}>Editar</button>
                        <div onClick={(e)=>{e.stopPropagation(); eliminarFicha(f.id)}} style={{ cursor:'pointer', color:'var(--text4)', fontSize:12, display:'flex', alignItems:'center' }}>×</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {sel && Object.keys(porCategoria).length > 0 && (
                <div className="panel">
                  <div className="panel-title">Costo por categoría</div>
                  {Object.entries(porCategoria).sort((a,b)=>b[1]-a[1]).map(([cat,total]) => (
                    <div key={cat} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:CATEGORIA_COLORS[cat]||'#888' }} />
                          <span style={{ color:'var(--text2)' }}>{cat}</span>
                        </div>
                        <span style={{ color:'var(--gold)', fontWeight:700 }}>{cop(total)}</span>
                      </div>
                      <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:2, height:4 }}>
                        <div style={{ height:4, borderRadius:2, width:`${costoTotal>0?(total/costoTotal)*100:0}%`, background:CATEGORIA_COLORS[cat]||'#888' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {sel && (
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div className="panel-title" style={{ marginBottom:0 }}>Ficha técnica — {sel.nombre}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
                    {['Ingrediente','Categoría','Origen','Cantidad','Costo'].map(h => (
                      <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                    ))}
                  </div>
                  {costos.map((ing,i) => (
                    <div key={ing.id||i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize:12, padding:'9px 10px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:CATEGORIA_COLORS[ing.categoria]||'#888', flexShrink:0 }} />
                        {ing.nombre} {ing.gramaje && <span style={{ color:'var(--text4)', fontSize:10 }}>({ing.gramaje})</span>}
                      </div>
                      <div style={{ fontSize:11, padding:'9px 10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{ing.categoria}</div>
                      <div style={{ fontSize:10, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ padding:'2px 7px', borderRadius:6, background: ing.origen==='receta'?'rgba(55,138,221,0.1)':'rgba(255,255,255,0.04)', color: ing.origen==='receta'?'var(--blue)':'var(--text3)' }}>{ing.origen==='receta'?'Receta':'Insumo'}</span>
                      </div>
                      <div style={{ fontSize:11, padding:'9px 10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{ing.cantidad} {ing.unidad}</div>
                      <div style={{ fontSize:13, padding:'9px 10px', fontWeight:700, color: ing.costo===null?'var(--red)':'var(--gold)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        {ing.costo===null?'sin costo':cop(ing.costo*ing.cantidad)}
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
                    <div style={{ fontSize:13, padding:'10px', color:'var(--text)', fontWeight:800, gridColumn:'1/5' }}>COSTO TOTAL POR UNIDAD</div>
                    <div style={{ fontSize:16, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{faltantes.length>0?'Incompleto':cop(costoTotal)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modal && (
        <ModalFicha
          ficha={modal==='nueva'?null:modal}
          productosExistentes={productosExistentes}
          onClose={()=>setModal(null)}
          onSaved={()=>{setModal(null); cargar()}}
        />
      )}
    </>
  )
}
