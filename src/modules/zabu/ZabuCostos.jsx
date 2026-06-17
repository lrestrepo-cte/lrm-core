// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }
function margenColor(m) { if (m >= 60) return 'var(--green)'; if (m >= 50) return 'var(--gold)'; return 'var(--red)' }

// Precios de venta — referencia fija del menú (parámetro de negocio, no dato de inventario)
const PV = { zabu_solo: 17000, zabu_combo: 20000, cheez_solo: 19000, cheez_combo: 22000 }
const COSTO_BEBIDA = 1500
const COSTO_QUESO_EXTRA = 1000

// Productos "fijos" del ZABÚ base (no incluye la salchicha, que varía por tipo)
const INGREDIENTES_BASE = ['ZaBun™ (pan top-split)', 'Cream Code™', 'Tocineta Crispy', 'Piña Caramelizada']
const EMPAQUE_DIRECTO = ['Bandeja boat kraft', 'Papel encerado', 'Servilletas x6', 'Sticker ZABÚ']
const EMPAQUE_DOMICILIO_EXTRA = ['Caja kraft ventana', 'Bolsa papel kraft']

// Costo promedio real de un producto: promedio del costo_unitario de sus lotes activos
function costoPromedio(lotes, nombreProducto) {
  const activos = lotes.filter(l => l.producto_nombre === nombreProducto && l.estado === 'activo')
  if (activos.length === 0) return null
  return activos.reduce((s,l)=>s+l.costo_unitario,0) / activos.length
}

export default function ZabuCostos() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('zabu_lotes').select('*')
    setLotes(data || [])
    setLoading(false)
  }

  const productosUnicos = [...new Set(lotes.map(l => l.producto_nombre))]
  const salchichas = productosUnicos.filter(p => p.toLowerCase().includes('salchicha'))

  const costosBase = INGREDIENTES_BASE.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const totalFijo = costosBase.reduce((s,i) => s + (i.costo || 0), 0)
  const faltanIngredientesBase = costosBase.some(i => i.costo === null)

  const empaqueDirecto = EMPAQUE_DIRECTO.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const totalEmpaqueDirecto = empaqueDirecto.reduce((s,i)=>s+(i.costo||0),0)
  const empaqueDomicilioExtra = EMPAQUE_DOMICILIO_EXTRA.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const totalEmpaqueDomicilio = totalEmpaqueDirecto + empaqueDomicilioExtra.reduce((s,i)=>s+(i.costo||0),0)

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando costos desde inventario...</div>

  return (
    <>
      {faltanIngredientesBase && (
        <div style={{ padding:'12px 16px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontSize:12, color:'var(--gold)', marginBottom:16 }}>
          ⚠️ Faltan lotes activos de uno o más ingredientes base ({INGREDIENTES_BASE.filter((_,i)=>costosBase[i].costo===null).join(', ')}) para calcular el costo completo. Registra lotes en Inventario o produce las recetas correspondientes.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingredientes fijos',    val: totalFijo>0?cop(totalFijo):'—',        color:'var(--text)', sub:'sin salchicha ni empaque' },
          { label:'Empaque venta directa', val: totalEmpaqueDirecto>0?cop(totalEmpaqueDirecto):'—', color:'var(--text)', sub:'desde inventario' },
          { label:'Empaque domicilio',     val: totalEmpaqueDomicilio>0?cop(totalEmpaqueDomicilio):'—', color:'var(--text)', sub:'desde inventario' },
          { label:'Bebida (combo)',        val:cop(COSTO_BEBIDA),  color:'var(--text)', sub:'parámetro fijo de menú' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        <div className="panel">
          <div className="panel-title">Comparativo de salchichas — costo y margen real por producto</div>
          {salchichas.length === 0 ? (
            <div style={{ fontSize:13, color:'var(--text4)', padding:'20px 0', textAlign:'center' }}>Sin lotes de salchicha registrados en Inventario</div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
                {['Salchicha','C. Sal.','C. Total','Util. solo','Margen','Util. combo','Margen'].map(h => (
                  <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                ))}
              </div>
              {salchichas.map((nombre, i) => {
                const cSal = costoPromedio(lotes, nombre)
                if (cSal === null || totalFijo === 0 || totalEmpaqueDirecto === 0) return (
                  <div key={nombre} style={{ padding:'10px', fontSize:12, color:'var(--text4)' }}>{nombre} — faltan costos base para calcular</div>
                )
                const cTotal = Math.round(cSal + totalFijo + totalEmpaqueDirecto)
                const uSolo  = PV.zabu_solo  - cTotal
                const uCombo = PV.zabu_combo - cTotal - COSTO_BEBIDA
                const mSolo  = ((uSolo  / PV.zabu_solo)  * 100).toFixed(1)
                const mCombo = ((uCombo / PV.zabu_combo) * 100).toFixed(1)
                return (
                  <div key={nombre} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    {[
                      { val:nombre.replace('Salchicha ',''), color:'var(--text2)', bold:true },
                      { val:cop(cSal),   color:'var(--text3)', bold:false },
                      { val:cop(cTotal), color:'var(--text2)', bold:true },
                      { val:cop(uSolo),  color:'var(--green)', bold:true },
                      { val:mSolo+'%',   color:margenColor(parseFloat(mSolo)),  bold:true },
                      { val:cop(uCombo), color:'var(--green)', bold:true },
                      { val:mCombo+'%',  color:margenColor(parseFloat(mCombo)), bold:true },
                    ].map((cell, j) => (
                      <div key={j} style={{ fontSize:12, padding:'10px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:cell.color, fontWeight:cell.bold ? 600 : 400 }}>{cell.val}</div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="grid-2" style={{ gap:14 }}>
          <div className="panel">
            <div className="panel-title">Desglose — ingredientes fijos (costo real del inventario)</div>
            {costosBase.map((ing, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color: ing.costo===null?'var(--text4)':'var(--text2)' }}>{ing.nombre}</span>
                {ing.costo === null ? (
                  <span style={{ fontSize:11, color:'var(--red)' }}>sin lote activo</span>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:80, background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden' }}>
                      <div style={{ height:4, borderRadius:2, width:`${totalFijo>0?(ing.costo/totalFijo)*100:0}%`, background:'var(--gold)' }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)', minWidth:50, textAlign:'right' }}>{cop(ing.costo)}</span>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Total fijos</span>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{totalFijo>0?cop(totalFijo):'—'}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Desglose — empaque (costo real del inventario)</div>
            {[...empaqueDirecto.map(e=>({...e,tipo:'Directo'})), ...empaqueDomicilioExtra.map(e=>({...e,tipo:'Domicilio'}))].map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:12, color: e.costo===null?'var(--text4)':'var(--text2)' }}>{e.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{e.tipo}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:600, color: e.costo===null?'var(--red)':'var(--text2)' }}>{e.costo===null?'sin lote':cop(e.costo)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:11, color:'var(--text3)' }}>Venta directa</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{totalEmpaqueDirecto>0?cop(totalEmpaqueDirecto):'—'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:11, color:'var(--text3)' }}>Domicilio</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{totalEmpaqueDomicilio>0?cop(totalEmpaqueDomicilio):'—'}</span>
            </div>
          </div>
        </div>

        <div className="panel" style={{ border:'1px solid var(--border)', background:'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.7 }}>
            💡 Las proyecciones de venta semanal (escenarios, punto de equilibrio, utilidad acumulada) viven en el módulo <strong style={{color:'var(--gold)'}}>Proyecciones</strong>, que usa estos costos reales como base de cálculo.
          </div>
        </div>
      </div>
    </>
  )
}
