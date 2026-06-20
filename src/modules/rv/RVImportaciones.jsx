import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const ESTADOS = [
  { id:'pedido',   label:'Pedido hecho', color:'var(--text3)' },
  { id:'transito', label:'En tránsito',  color:'var(--blue)'  },
  { id:'aduana',   label:'En aduana',    color:'var(--gold)'  },
  { id:'recibido', label:'Recibido',     color:'var(--green)' },
]

const TALLAS = ['S','M','L','XL']

// Calcula CBM, costo de flete prorrateado, y costo total por par para una línea.
function calcularLinea(item, trmManual, tarifaFleteCbm, monedaFlete) {
  const volumenCajaM3 = (item.largo_cm/100) * (item.ancho_cm/100) * (item.alto_cm/100)
  const cbmTotal = volumenCajaM3 * (item.num_cajas || 0)
  const tarifaEnCop = monedaFlete === 'USD' ? tarifaFleteCbm * trmManual : tarifaFleteCbm
  const costoFleteTotal = cbmTotal * tarifaEnCop
  const totalPares = (item.num_cajas || 0) * (item.pares_por_caja || 0)
  const costoFletePorPar = totalPares > 0 ? costoFleteTotal / totalPares : 0
  const costoMercanciaPorPar = (item.costo_unitario_usd || 0) * trmManual
  const costoTotalPorPar = costoMercanciaPorPar + costoFletePorPar
  return { volumenCajaM3, cbmTotal, costoFleteTotal, totalPares, costoFletePorPar, costoMercanciaPorPar, costoTotalPorPar }
}

function ModalNuevaOrden({ onClose, onCreada, productos }) {
  const [proveedor, setProveedor]   = useState('')
  const [fecha, setFecha]           = useState(new Date().toISOString().split('T')[0])
  const [trm, setTrm]               = useState('')
  const [tarifaFlete, setTarifaFlete] = useState('')
  const [monedaFlete, setMonedaFlete] = useState('COP')
  const [notas, setNotas]           = useState('')
  const [items, setItems]           = useState([
    { referencia:'', talla:'M', costo_unitario_usd:'', num_cajas:'', pares_por_caja:'', largo_cm:'', ancho_cm:'', alto_cm:'' }
  ])
  const [guardando, setGuardando] = useState(false)

  const agregarItem = () => setItems(prev => [...prev, { referencia:'', talla:'M', costo_unitario_usd:'', num_cajas:'', pares_por_caja:'', largo_cm:'', ancho_cm:'', alto_cm:'' }])
  const quitarItem = (idx) => setItems(prev => prev.filter((_,i) => i!==idx))
  const updateItem = (idx, campo, valor) => setItems(prev => prev.map((it,i) => i===idx ? { ...it, [campo]: valor } : it))

  const trmNum = parseFloat(trm) || 0
  const tarifaNum = parseFloat(tarifaFlete) || 0

  const itemsCalculados = items.map(it => ({
    ...it,
    calc: calcularLinea(
      { ...it, costo_unitario_usd: parseFloat(it.costo_unitario_usd)||0, num_cajas: parseInt(it.num_cajas)||0,
        pares_por_caja: parseInt(it.pares_por_caja)||0, largo_cm: parseFloat(it.largo_cm)||0,
        ancho_cm: parseFloat(it.ancho_cm)||0, alto_cm: parseFloat(it.alto_cm)||0 },
      trmNum, tarifaNum, monedaFlete
    )
  }))

  const cbmTotalOrden = itemsCalculados.reduce((s,it) => s + it.calc.cbmTotal, 0)
  const costoTotalOrden = itemsCalculados.reduce((s,it) => s + (it.calc.costoTotalPorPar * it.calc.totalPares), 0)
  const paresTotalOrden = itemsCalculados.reduce((s,it) => s + it.calc.totalPares, 0)

  const puedeGuardar = proveedor && trmNum>0 && tarifaNum>0 && items.every(it => it.referencia && it.costo_unitario_usd && it.num_cajas && it.pares_por_caja && it.largo_cm && it.ancho_cm && it.alto_cm)

  const guardar = async () => {
    if (!puedeGuardar) return
    setGuardando(true)
    const { data: orden, error } = await supabase.from('rv_importaciones').insert({
      proveedor, fecha_pedido: fecha, trm_manual: trmNum, tarifa_flete_cbm: tarifaNum,
      moneda_flete: monedaFlete, estado: 'pedido', notas,
    }).select().single()

    if (error || !orden) { setGuardando(false); alert('Error al crear la orden: ' + error?.message); return }

    const lineas = items.map(it => ({
      importacion_id: orden.id,
      referencia: it.referencia, talla: it.talla,
      costo_unitario_usd: parseFloat(it.costo_unitario_usd)||0,
      num_cajas: parseInt(it.num_cajas)||0, pares_por_caja: parseInt(it.pares_por_caja)||0,
      largo_cm: parseFloat(it.largo_cm)||0, ancho_cm: parseFloat(it.ancho_cm)||0, alto_cm: parseFloat(it.alto_cm)||0,
    }))
    await supabase.from('rv_importacion_items').insert(lineas)

    setGuardando(false)
    onCreada()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:760, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Nueva orden de importación</div>

        <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Proveedor</div>
            <input type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} placeholder="Ej: Fábrica Yiwu Socks Co." style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha del pedido</div>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iStyle} />
          </div>
        </div>

        <div className="grid-3" style={{ gap:10, marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>TRM que te cobraron (manual)</div>
            <input type="number" value={trm} onChange={e=>setTrm(e.target.value)} placeholder="Ej: 4250" style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tarifa flete+legalización por CBM</div>
            <input type="number" value={tarifaFlete} onChange={e=>setTarifaFlete(e.target.value)} placeholder="Ej: 350000" style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Moneda de la tarifa</div>
            <select value={monedaFlete} onChange={e=>setMonedaFlete(e.target.value)} style={iStyle}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize:10, color:'var(--text4)', marginBottom:16 }}>
          La tarifa por CBM ya incluye flete + legalización/aduana, todo en un solo número.
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>Productos del pedido</div>
          <div onClick={agregarItem} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar producto</div>
        </div>

        {itemsCalculados.map((it, idx) => (
          <div key={idx} className="panel" style={{ marginBottom:10 }}>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input type="text" value={it.referencia} onChange={e=>updateItem(idx,'referencia',e.target.value)} placeholder="Referencia / nombre" style={{...iStyle,marginTop:0,flex:1.5,fontWeight:600}} />
              <select value={it.talla} onChange={e=>updateItem(idx,'talla',e.target.value)} style={{...iStyle,marginTop:0,width:80}}>
                {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={it.costo_unitario_usd} onChange={e=>updateItem(idx,'costo_unitario_usd',e.target.value)} placeholder="Costo USD/par" style={{...iStyle,marginTop:0,width:110}} />
              {items.length>1 && <div onClick={()=>quitarItem(idx)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14, display:'flex', alignItems:'center' }}>×</div>}
            </div>
            <div className="grid-4" style={{ gap:8, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)' }}>N° de cajas</div>
                <input type="number" value={it.num_cajas} onChange={e=>updateItem(idx,'num_cajas',e.target.value)} style={{...iStyle,fontSize:12}} />
              </div>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)' }}>Pares por caja</div>
                <input type="number" value={it.pares_por_caja} onChange={e=>updateItem(idx,'pares_por_caja',e.target.value)} style={{...iStyle,fontSize:12}} />
              </div>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)' }}>Largo cm</div>
                <input type="number" value={it.largo_cm} onChange={e=>updateItem(idx,'largo_cm',e.target.value)} style={{...iStyle,fontSize:12}} />
              </div>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)' }}>Ancho cm</div>
                <input type="number" value={it.ancho_cm} onChange={e=>updateItem(idx,'ancho_cm',e.target.value)} style={{...iStyle,fontSize:12}} />
              </div>
            </div>
            <div className="grid-2" style={{ gap:8, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:9, color:'var(--text4)' }}>Alto cm</div>
                <input type="number" value={it.alto_cm} onChange={e=>updateItem(idx,'alto_cm',e.target.value)} style={{...iStyle,fontSize:12}} />
              </div>
            </div>
            {trmNum>0 && tarifaNum>0 && it.calc.totalPares>0 && (
              <div style={{ padding:'8px 12px', background:'var(--gold-dim)', borderRadius:8, fontSize:11, color:'var(--gold)' }}>
                CBM: {it.calc.cbmTotal.toFixed(3)} · {it.calc.totalPares.toLocaleString()} pares · Costo total/par: <strong>{cop(it.calc.costoTotalPorPar)}</strong> (mercancía {cop(it.calc.costoMercanciaPorPar)} + flete/legal. {cop(it.calc.costoFletePorPar)})
              </div>
            )}
          </div>
        ))}

        {cbmTotalOrden>0 && (
          <div className="panel" style={{ border:'1px solid var(--gold-border)', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'var(--text3)' }}>CBM total del pedido</span>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>{cbmTotalOrden.toFixed(3)} CBM</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'var(--text3)' }}>Total de pares</span>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{paresTotalOrden.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, marginTop:4, borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:14, fontWeight:700 }}>COSTO TOTAL DEL PEDIDO</span>
              <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(costoTotalOrden)}</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
          <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Opcional" style={{...iStyle,height:50,resize:'none'}} />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} disabled={!puedeGuardar||guardando} className="btn-green" style={{ flex:1 }}>
            {guardando ? 'Creando...' : 'Crear orden de importación'}
          </button>
          <button onClick={onClose} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function RVImportaciones() {
  const [ordenes, setOrdenes]     = useState([])
  const [itemsPorOrden, setItemsPorOrden] = useState({})
  const [productos, setProductos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [expandida, setExpandida] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data: ords }, { data: prods }] = await Promise.all([
      supabase.from('rv_importaciones').select('*').order('created_at', { ascending:false }),
      supabase.from('rv_productos').select('*').eq('activo', true),
    ])
    if (ords) {
      setOrdenes(ords)
      const { data: items } = await supabase.from('rv_importacion_items').select('*').in('importacion_id', ords.map(o=>o.id))
      if (items) {
        const agrupado = {}
        items.forEach(it => { if (!agrupado[it.importacion_id]) agrupado[it.importacion_id] = []; agrupado[it.importacion_id].push(it) })
        setItemsPorOrden(agrupado)
      }
    }
    if (prods) setProductos(prods)
    setLoading(false)
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    await supabase.from('rv_importaciones').update({ estado: nuevoEstado }).eq('id', id)
    setOrdenes(prev => prev.map(o => o.id===id ? { ...o, estado: nuevoEstado } : o))
  }

  // Al marcar como Recibido, suma las cantidades al inventario real (rv_inventario),
  // buscando coincidencia por referencia+talla. Si no existe el registro, lo crea.
  const recibirYSumarInventario = async (orden) => {
    const items = itemsPorOrden[orden.id] || []
    if (items.length === 0) return

    const { data: invActual } = await supabase.from('rv_inventario').select('*')

    for (const item of items) {
      const totalPares = item.num_cajas * item.pares_por_caja
      const prod = productos.find(p => p.referencia === item.referencia)
      if (!prod) continue // si la referencia no existe en catálogo, se omite (debe crearse ahí primero)

      const existente = invActual?.find(i => i.producto_id===prod.id && i.talla===item.talla)
      if (existente) {
        await supabase.from('rv_inventario').update({ stock: existente.stock + totalPares, updated_at: new Date().toISOString() }).eq('id', existente.id)
      } else {
        await supabase.from('rv_inventario').insert({ producto_id: prod.id, talla: item.talla, stock: totalPares })
      }
    }
    await cambiarEstado(orden.id, 'recibido')
    alert('✅ Mercancía sumada al inventario correctamente.')
  }

  const calcularTotalesOrden = (orden) => {
    const items = itemsPorOrden[orden.id] || []
    let cbmTotal = 0, costoTotal = 0, paresTotal = 0
    items.forEach(it => {
      const c = calcularLinea(it, orden.trm_manual, orden.tarifa_flete_cbm, orden.moneda_flete)
      cbmTotal += c.cbmTotal
      costoTotal += c.costoTotalPorPar * c.totalPares
      paresTotal += c.totalPares
    })
    return { cbmTotal, costoTotal, paresTotal }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando importaciones...</div>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Importaciones</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Pedidos a fábrica, costeo por CBM y seguimiento hasta inventario</div>
        </div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva orden</button>
      </div>

      {ordenes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
          <div style={{ fontSize:14, color:'var(--text3)' }}>Sin órdenes de importación todavía</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ordenes.map(orden => {
            const { cbmTotal, costoTotal, paresTotal } = calcularTotalesOrden(orden)
            const estadoInfo = ESTADOS.find(e=>e.id===orden.estado)
            const expandido = expandida === orden.id
            return (
              <div key={orden.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer' }} onClick={()=>setExpandida(expandido?null:orden.id)}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{orden.proveedor}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      {orden.fecha_pedido} · {paresTotal.toLocaleString()} pares · {cbmTotal.toFixed(2)} CBM · TRM ${orden.trm_manual.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(costoTotal)}</div>
                    <div style={{ fontSize:10, color:'var(--text4)' }}>costo total del pedido</div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
                  {ESTADOS.map(e => (
                    <div key={e.id} onClick={(ev)=>{ ev.stopPropagation(); if (e.id==='recibido') recibirYSumarInventario(orden); else cambiarEstado(orden.id, e.id) }}
                      style={{
                        padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                        background: orden.estado===e.id ? `${e.color}22` : 'rgba(255,255,255,0.04)',
                        border:`1px solid ${orden.estado===e.id ? e.color : 'var(--border)'}`,
                        color: orden.estado===e.id ? e.color : 'var(--text3)',
                      }}>
                      {e.label}
                    </div>
                  ))}
                </div>

                {expandido && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                    {(itemsPorOrden[orden.id]||[]).map((item,i) => {
                      const c = calcularLinea(item, orden.trm_manual, orden.tarifa_flete_cbm, orden.moneda_flete)
                      return (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{item.referencia} · Talla {item.talla}</div>
                            <div style={{ fontSize:10, color:'var(--text4)' }}>{item.num_cajas} cajas × {item.pares_por_caja} pares = {c.totalPares.toLocaleString()} pares</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(c.costoTotalPorPar)}/par</div>
                            <div style={{ fontSize:10, color:'var(--text4)' }}>{c.cbmTotal.toFixed(3)} CBM</div>
                          </div>
                        </div>
                      )
                    })}
                    {orden.notas && <div style={{ fontSize:11, color:'var(--text3)', marginTop:10, fontStyle:'italic' }}>{orden.notas}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && <ModalNuevaOrden onClose={()=>setModal(false)} onCreada={cargar} productos={productos} />}
    </div>
  )
}
