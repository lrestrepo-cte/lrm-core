// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}
const taStyle = { ...iStyle, resize:'none', lineHeight:1.6 }

const CATEGORIAS = ['salsa', 'topping', 'proteina', 'pan', 'queso', 'empaque', 'bebida']
const CATEGORIA_LABEL = { salsa:'Salsa', topping:'Topping', proteina:'Proteína', pan:'Pan', queso:'Queso', empaque:'Empaque', bebida:'Bebida' }

function diasVence(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const venc = new Date(fecha)
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

// ════════════════════════════════════════════════════════════════════════════
// MOTOR DE PRODUCCIÓN — descuenta insumos por FIFO real, crea lote del resultado
// ════════════════════════════════════════════════════════════════════════════
async function ejecutarProduccion({ receta, ingredientes, factor, lotesDisponibles, fechaVencimientoResultado, ubicacion, responsable }) {
  const consumos = []
  let costoTotal = 0

  for (const ing of ingredientes) {
    const necesario = ing.cantidad * factor
    let restante = necesario

    // Lotes activos de este insumo, ordenados FIFO (más próximo a vencer primero)
    const lotesInsumo = lotesDisponibles
      .filter(l => l.producto_nombre === ing.insumo_nombre && l.estado === 'activo' && l.cantidad_actual > 0)
      .map(l => ({ ...l, dias: diasVence(l.fecha_vencimiento) }))
      .sort((a, b) => {
        if (a.dias === null && b.dias === null) return 0
        if (a.dias === null) return 1
        if (b.dias === null) return -1
        return a.dias - b.dias
      })

    const stockDisponible = lotesInsumo.reduce((s, l) => s + parseFloat(l.cantidad_actual), 0)
    if (stockDisponible < necesario) {
      return { error: `Stock insuficiente de "${ing.insumo_nombre}": necesitas ${necesario} ${ing.unidad}, hay ${stockDisponible} ${ing.unidad}` }
    }

    for (const lote of lotesInsumo) {
      if (restante <= 0) break
      const disponibleEnLote = parseFloat(lote.cantidad_actual)
      const aDescontar = Math.min(disponibleEnLote, restante)
      const nuevaCantidad = disponibleEnLote - aDescontar

      await supabase.from('zabu_lotes').update({
        cantidad_actual: nuevaCantidad,
        estado: nuevaCantidad === 0 ? 'agotado' : 'activo',
      }).eq('id', lote.id)

      const costoConsumo = aDescontar * lote.costo_unitario
      costoTotal += costoConsumo
      consumos.push({ insumo: ing.insumo_nombre, lote_id: lote.id, numero_lote: lote.numero_lote, cantidad_descontada: aDescontar, unidad: ing.unidad, costo: costoConsumo })
      restante -= aDescontar
    }
  }

  // Crear el lote nuevo del producto preparado
  const cantidadProducida = receta.rendimiento * factor
  const { data: loteNuevo, error: errLote } = await supabase.from('zabu_lotes').insert({
    producto_nombre: receta.nombre, categoria: receta.categoria,
    cantidad_inicial: cantidadProducida, cantidad_actual: cantidadProducida,
    unidad: receta.unidad_rendimiento, costo_unitario: Math.round(costoTotal / cantidadProducida) || 0,
    proveedor: 'Producción propia', ubicacion: ubicacion || 'C01',
    fecha_compra: new Date().toISOString().split('T')[0],
    fecha_vencimiento: fechaVencimientoResultado || null,
    estado: 'activo', notas: `Producido desde receta: ${receta.nombre}`,
  }).select().single()

  if (errLote) return { error: 'Error al crear el lote del producto: ' + errLote.message }

  await supabase.from('zabu_producciones').insert({
    receta_id: receta.id, receta_nombre: receta.nombre,
    cantidad_producida: cantidadProducida, unidad: receta.unidad_rendimiento,
    lote_resultado_id: loteNuevo.id, costo_total: Math.round(costoTotal),
    insumos_consumidos: consumos, responsable: responsable || 'Sin asignar',
  })

  return { ok: true, loteNuevo, costoTotal, consumos }
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: Crear / Editar receta
// ════════════════════════════════════════════════════════════════════════════
function ModalReceta({ receta, productosExistentes, onClose, onSaved }) {
  const [form, setForm] = useState(receta || {
    nombre:'', categoria:'salsa', rendimiento:1, unidad_rendimiento:'litros', tiempo_preparacion:'', instrucciones:'',
  })
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(!!receta)

  useEffect(() => { if (receta) cargarIngredientes() }, [receta])

  const cargarIngredientes = async () => {
    const { data } = await supabase.from('zabu_receta_ingredientes').select('*').eq('receta_id', receta.id).order('orden')
    setIngredientes(data || [])
    setLoading(false)
  }

  const agregarIngrediente = () => setIngredientes(prev => [...prev, { insumo_nombre:'', cantidad:'', unidad:'unidades', _nuevo:true }])
  const actualizarIngrediente = (i, campo, valor) => setIngredientes(prev => prev.map((ing, idx) => idx === i ? { ...ing, [campo]: valor } : ing))
  const quitarIngrediente = (i) => setIngredientes(prev => prev.filter((_, idx) => idx !== i))

  const guardar = async () => {
    if (!form.nombre || ingredientes.length === 0) return
    let recetaId = receta?.id

    if (recetaId) {
      await supabase.from('zabu_recetas').update({ ...form, updated_at: new Date().toISOString() }).eq('id', recetaId)
      await supabase.from('zabu_receta_ingredientes').delete().eq('receta_id', recetaId)
    } else {
      const { data, error } = await supabase.from('zabu_recetas').insert(form).select().single()
      if (error) { alert('Error: ' + error.message); return }
      recetaId = data.id
    }

    const ingredientesInsert = ingredientes.filter(i => i.insumo_nombre && i.cantidad).map((ing, idx) => ({
      receta_id: recetaId, insumo_nombre: ing.insumo_nombre, cantidad: parseFloat(ing.cantidad), unidad: ing.unidad, orden: idx,
    }))
    if (ingredientesInsert.length > 0) await supabase.from('zabu_receta_ingredientes').insert(ingredientesInsert)

    onSaved()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:560, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>{receta ? 'Editar receta' : 'Nueva receta'}</div>

        <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre del producto preparado</div>
            <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Cream Code™, Salsa Sriracha Casera..." style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
            <select value={form.categoria} onChange={e=>setForm(p=>({...p,categoria:e.target.value}))} style={iStyle}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tiempo de preparación</div>
            <input type="text" value={form.tiempo_preparacion||''} onChange={e=>setForm(p=>({...p,tiempo_preparacion:e.target.value}))} placeholder="Ej: 30 min" style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Rendimiento por tanda</div>
            <input type="number" value={form.rendimiento} onChange={e=>setForm(p=>({...p,rendimiento:parseFloat(e.target.value)||0}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Unidad de rendimiento</div>
            <select value={form.unidad_rendimiento} onChange={e=>setForm(p=>({...p,unidad_rendimiento:e.target.value}))} style={iStyle}>
              <option value="litros">Litros</option><option value="kg">Kilogramos</option><option value="g">Gramos</option><option value="ml">Mililitros</option><option value="unidades">Unidades</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>Instrucciones (opcional)</div>
          <textarea value={form.instrucciones||''} onChange={e=>setForm(p=>({...p,instrucciones:e.target.value}))} style={{...taStyle,height:50}} />
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Ingredientes (por tanda estándar)</div>
            <div onClick={agregarIngrediente} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar ingrediente</div>
          </div>
          <div style={{ fontSize:10, color:'var(--text4)', marginBottom:8 }}>El nombre debe coincidir exactamente con el producto registrado en Inventario para que el descuento automático funcione.</div>
          {loading ? <div style={{ fontSize:12, color:'var(--text3)', padding:'10px 0' }}>Cargando...</div>
          : ingredientes.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)', padding:'10px 0' }}>Sin ingredientes — agrega al menos uno</div>
          : ingredientes.map((ing, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
              <input type="text" list="productos-existentes" value={ing.insumo_nombre} onChange={e=>actualizarIngrediente(i,'insumo_nombre',e.target.value)} placeholder="Nombre del insumo" style={{...iStyle,marginTop:0,flex:1.5}} />
              <input type="number" value={ing.cantidad} onChange={e=>actualizarIngrediente(i,'cantidad',e.target.value)} placeholder="Cant." style={{...iStyle,marginTop:0,width:80}} />
              <select value={ing.unidad} onChange={e=>actualizarIngrediente(i,'unidad',e.target.value)} style={{...iStyle,marginTop:0,width:100}}>
                <option value="unidades">uds</option><option value="kg">kg</option><option value="g">g</option><option value="litros">L</option><option value="ml">ml</option>
              </select>
              <div onClick={()=>quitarIngrediente(i)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14 }}>×</div>
            </div>
          ))}
          <datalist id="productos-existentes">
            {productosExistentes.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} disabled={!form.nombre} className="btn-green" style={{ flex:1 }}>{receta ? 'Guardar cambios' : 'Crear receta'}</button>
          <button onClick={onClose} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: Producir
// ════════════════════════════════════════════════════════════════════════════
function ModalProducir({ receta, lotes, onClose, onProducido }) {
  const [ingredientes, setIngredientes] = useState([])
  const [factor, setFactor] = useState(1)
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [ubicacion, setUbicacion] = useState('C01')
  const [loading, setLoading] = useState(true)
  const [produciendo, setProduciendo] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from('zabu_receta_ingredientes').select('*').eq('receta_id', receta.id).order('orden')
    setIngredientes(data || [])
    setLoading(false)
  }

  const stockDisponible = (nombreInsumo) => lotes.filter(l => l.producto_nombre === nombreInsumo && l.estado === 'activo').reduce((s,l)=>s+parseFloat(l.cantidad_actual),0)

  const verificarStock = ingredientes.map(ing => {
    const necesario = ing.cantidad * factor
    const disponible = stockDisponible(ing.insumo_nombre)
    return { ...ing, necesario, disponible, suficiente: disponible >= necesario }
  })
  const hayFaltantes = verificarStock.some(v => !v.suficiente)

  const producir = async () => {
    setProduciendo(true)
    const res = await ejecutarProduccion({
      receta, ingredientes, factor, lotesDisponibles: lotes,
      fechaVencimientoResultado: fechaVencimiento, ubicacion, responsable: 'Luis Restrepo',
    })
    setProduciendo(false)
    if (res.error) { setResultado({ ok:false, msg:res.error }); return }
    setResultado({ ok:true, msg:`✅ Se produjeron ${receta.rendimiento*factor} ${receta.unidad_rendimiento} de ${receta.nombre}. Costo total: ${cop(res.costoTotal)}` })
    setTimeout(() => { onProducido() }, 1800)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:520, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>🍳 Producir — {receta.nombre}</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Rendimiento estándar: {receta.rendimiento} {receta.unidad_rendimiento} por tanda</div>

        <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Multiplicador de tanda</div>
            <input type="number" step="0.5" value={factor} onChange={e=>setFactor(parseFloat(e.target.value)||1)} style={iStyle} />
            <div style={{ fontSize:10, color:'var(--gold)', marginTop:4 }}>Producirás: {receta.rendimiento*factor} {receta.unidad_rendimiento}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Ubicación del lote resultante</div>
            <select value={ubicacion} onChange={e=>setUbicacion(e.target.value)} style={iStyle}>
              <option value="C01">Carrito 01</option><option value="C02">Carrito 02</option><option value="C03">Carrito 03</option><option value="CEDIS">CEDIS</option>
            </select>
          </div>
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de vencimiento del producto resultante</div>
            <input type="date" value={fechaVencimiento} onChange={e=>setFechaVencimiento(e.target.value)} style={iStyle} />
          </div>
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Insumos a consumir (FIFO automático)</div>
        {loading ? <div style={{ fontSize:12, color:'var(--text3)' }}>Cargando...</div>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
            {verificarStock.map((v, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderRadius:8,
                background: v.suficiente ? 'rgba(255,255,255,0.02)' : 'rgba(224,82,82,0.08)', border:`1px solid ${v.suficiente?'var(--border)':'rgba(224,82,82,0.3)'}` }}>
                <span style={{ fontSize:12, color:'var(--text2)' }}>{v.insumo_nombre}</span>
                <span style={{ fontSize:12, fontWeight:600, color: v.suficiente?'var(--text3)':'var(--red)' }}>
                  {v.necesario} {v.unidad} <span style={{ color:'var(--text4)' }}>de {v.disponible} disp.</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {hayFaltantes && (
          <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:10, fontSize:12, color:'var(--red)', marginBottom:16 }}>
            ⚠️ No hay suficiente stock de uno o más insumos. Registra más lotes en Inventario antes de producir.
          </div>
        )}

        {resultado && (
          <div style={{ padding:'12px 14px', borderRadius:10, fontSize:13, fontWeight:600, marginBottom:16, background: resultado.ok?'var(--green-dim)':'var(--red-dim)', color: resultado.ok?'var(--green)':'var(--red)', border:`1px solid ${resultado.ok?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
            {resultado.msg}
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={producir} disabled={hayFaltantes||produciendo||resultado?.ok} className="btn-green" style={{ flex:1 }}>
            {produciendo ? '⏳ Produciendo...' : '🍳 Confirmar producción'}
          </button>
          <button onClick={onClose} className="btn">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ZabuRecetario() {
  const [recetas, setRecetas] = useState([])
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalReceta, setModalReceta] = useState(null) // null | 'nueva' | receta object
  const [modalProducir, setModalProducir] = useState(null)
  const [producciones, setProducciones] = useState([])
  const [tab, setTab] = useState('recetas')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data: r }, { data: l }, { data: p }] = await Promise.all([
      supabase.from('zabu_recetas').select('*').order('nombre'),
      supabase.from('zabu_lotes').select('*'),
      supabase.from('zabu_producciones').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    setRecetas(r || []); setLotes(l || []); setProducciones(p || [])
    setLoading(false)
  }

  const eliminarReceta = async (id) => {
    await supabase.from('zabu_recetas').delete().eq('id', id)
    cargar()
  }

  const productosExistentes = [...new Set(lotes.map(l => l.producto_nombre))]

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Recetas de producción interna — Cream Code, salsas, toppings preparados</div>
        <button onClick={() => setModalReceta('nueva')} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva receta</button>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Recetas activas</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{loading?'...':recetas.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Producciones registradas</div><div className="kpi-val" style={{ color:'var(--blue)' }}>{loading?'...':producciones.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Costo total producido</div><div className="kpi-val" style={{ color:'var(--green)' }}>{loading?'...':cop(producciones.reduce((s,p)=>s+p.costo_total,0))}</div></div>
      </div>

      <div className="sub-nav" style={{ marginBottom:20 }}>
        <div className={`sub-nav-item${tab==='recetas'?' active':''}`} onClick={()=>setTab('recetas')}>Recetas</div>
        <div className={`sub-nav-item${tab==='historial'?' active':''}`} onClick={()=>setTab('historial')}>Historial de producción</div>
      </div>

      {tab === 'recetas' && (
        loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
        : recetas.length === 0 ? (
          <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:13, color:'var(--text4)' }}>Sin recetas registradas. Crea tu primera receta (ej: Cream Code™).</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {recetas.map(r => (
              <div key={r.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{r.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      {CATEGORIA_LABEL[r.categoria]} · Rinde {r.rendimiento} {r.unidad_rendimiento} · {r.tiempo_preparacion || 'Tiempo no especificado'}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setModalProducir(r)} className="btn-green" style={{ fontSize:11, padding:'7px 14px' }}>🍳 Producir</button>
                    <button onClick={() => setModalReceta(r)} className="btn" style={{ fontSize:11, padding:'7px 14px' }}>Editar</button>
                    <div onClick={() => eliminarReceta(r.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14, display:'flex', alignItems:'center', padding:'0 6px' }}>×</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'historial' && (
        loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
        : producciones.length === 0 ? (
          <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:13, color:'var(--text4)' }}>Sin producciones registradas todavía.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {producciones.map(p => (
              <div key={p.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{p.receta_nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      {p.cantidad_producida} {p.unidad} · {p.fecha} · {p.responsable}
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(p.costo_total)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modalReceta && (
        <ModalReceta
          receta={modalReceta === 'nueva' ? null : modalReceta}
          productosExistentes={productosExistentes}
          onClose={() => setModalReceta(null)}
          onSaved={() => { setModalReceta(null); cargar() }}
        />
      )}

      {modalProducir && (
        <ModalProducir
          receta={modalProducir}
          lotes={lotes}
          onClose={() => setModalProducir(null)}
          onProducido={() => { setModalProducir(null); cargar() }}
        />
      )}
    </>
  )
}
