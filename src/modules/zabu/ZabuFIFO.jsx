// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function diasVence(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const venc = new Date(fecha)
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

// Agrupa lotes activos por producto y los ordena por fecha de vencimiento ascendente
// (el más próximo a vencer queda primero = el que se debe usar primero)
function calcularFIFO(lotes) {
  const grupos = {}
  lotes.filter(l => l.estado === 'activo' && l.cantidad_actual > 0).forEach(l => {
    if (!grupos[l.producto_nombre]) grupos[l.producto_nombre] = []
    grupos[l.producto_nombre].push({ ...l, dias: diasVence(l.fecha_vencimiento) })
  })
  Object.values(grupos).forEach(lista => {
    lista.sort((a, b) => {
      // Lotes sin vencimiento van al final (no son urgentes)
      if (a.dias === null && b.dias === null) return 0
      if (a.dias === null) return 1
      if (b.dias === null) return -1
      return a.dias - b.dias
    })
  })
  return grupos
}

export default function ZabuFIFO() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('zabu_lotes').select('*').order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    if (!error && data) setLotes(data)
    setLoading(false)
  }

  const consumirLote = async (loteId, cantidadActual, unidad) => {
    const usar = window.prompt(`¿Cuánto vas a consumir de este lote? (${unidad} disponibles: ${cantidadActual})`, '1')
    if (usar === null) return
    const cantidad = parseFloat(usar)
    if (isNaN(cantidad) || cantidad <= 0) return
    const nuevaCantidad = Math.max(0, cantidadActual - cantidad)
    await supabase.from('zabu_lotes').update({ cantidad_actual: nuevaCantidad, estado: nuevaCantidad === 0 ? 'agotado' : 'activo' }).eq('id', loteId)
    cargar()
  }

  const grupos = calcularFIFO(lotes)
  const productos = Object.keys(grupos).sort((a, b) => {
    const da = grupos[a][0]?.dias, db = grupos[b][0]?.dias
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  const urgentes = productos.filter(p => { const d = grupos[p][0]?.dias; return d !== null && d <= 1 })
  const atencion = productos.filter(p => { const d = grupos[p][0]?.dias; return d !== null && d > 1 && d <= 5 })
  const enOrden  = productos.filter(p => { const d = grupos[p][0]?.dias; return d === null || d > 5 })
  const totalConStock = productos.length

  return (
    <>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Sistema FIFO automático</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>El sistema ordena automáticamente por fecha de vencimiento. Usa siempre el lote indicado primero.</div>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingredientes',       val: loading?'...':String(totalConStock), color:'var(--text)',  sub:'con stock activo' },
          { label:'Críticos',           val: loading?'...':String(urgentes.length), color:'var(--red)',  sub:'usar HOY o mañana' },
          { label:'Atención',          val: loading?'...':String(atencion.length), color:'var(--gold)', sub:'vencen en 3-5 días' },
          { label:'En orden',          val: loading?'...':String(enOrden.length),  color:'var(--green)', sub:'sin urgencia' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      : productos.length === 0 ? (
        <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:13, color:'var(--text4)' }}>Sin lotes activos en inventario. Registra compras en el módulo Inventario.</div>
        </div>
      ) : (
        <>
          {urgentes.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>🚨</span>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--red)', letterSpacing:1, textTransform:'uppercase' }}>Usar hoy — vencimiento crítico</span>
              </div>
              <div className="grid-3" style={{ gap:10 }}>
                {urgentes.map(prod => {
                  const lote = grupos[prod][0]
                  return (
                    <div key={prod} className="panel" style={{ background:'rgba(224,82,82,0.08)', border:'1px solid rgba(224,82,82,0.3)' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{prod}</div>
                      <div style={{ fontSize:11, color:'var(--red)', marginBottom:2 }}>
                        Lote: {lote.numero_lote || lote.id.slice(0,8)}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>
                        {lote.dias <= 0 ? `Vencido hace ${Math.abs(lote.dias)}d` : `Vence en ${lote.dias}d`} · {lote.cantidad_actual} {lote.unidad}
                      </div>
                      <div onClick={()=>consumirLote(lote.id, lote.cantidad_actual, lote.unidad)} style={{ marginTop:8, fontSize:11, color:'var(--gold)', cursor:'pointer' }}>
                        📤 Registrar consumo
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-title">Orden de uso por producto — usa primero el lote más antiguo</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {productos.map(prod => {
                const lista = grupos[prod]
                const usar = lista[0]
                const siguiente = lista[1]
                const stockTotal = lista.reduce((s,l)=>s+parseFloat(l.cantidad_actual),0)
                const colorBorde = usar.dias !== null && usar.dias <= 1 ? 'rgba(224,82,82,0.3)' : usar.dias !== null && usar.dias <= 5 ? 'rgba(201,168,76,0.3)' : 'var(--border)'
                return (
                  <div key={prod} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${colorBorde}`, background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{prod}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>
                          <span style={{ fontWeight:600, color:'var(--gold)' }}>Usar primero:</span> Lote {usar.numero_lote || usar.id.slice(0,8)} · {usar.cantidad_actual} {usar.unidad}
                          {usar.dias !== null && <span style={{ color: usar.dias<=1?'var(--red)':'var(--text3)' }}> · {usar.dias<=0?'Vencido':`vence en ${usar.dias}d`}</span>}
                        </div>
                        {siguiente && (
                          <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>
                            Siguiente: Lote {siguiente.numero_lote || siguiente.id.slice(0,8)} · {siguiente.cantidad_actual} {siguiente.unidad}
                            {siguiente.dias !== null && ` · vence en ${siguiente.dias}d`}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{stockTotal} {usar.unidad}</div>
                        <div style={{ fontSize:9, color:'var(--text4)' }}>stock total · {lista.length} lote{lista.length!==1?'s':''}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
