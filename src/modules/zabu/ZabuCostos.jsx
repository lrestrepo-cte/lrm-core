// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }
function margenColor(m) { if (m >= 60) return 'var(--green)'; if (m >= 50) return 'var(--gold)'; return 'var(--red)' }

// ════════════════════════════════════════════════════════════════════════════
// PRECIOS DE VENTA — menú ZABÚ confirmado (julio 2026)
// ════════════════════════════════════════════════════════════════════════════
const PRECIOS = {
  zabu_solo: 18000, zabu_combo: 25000,
  classic_solo: 25000, classic_combo: 32000,
  hawaii_solo: 25000, hawaii_combo: 32000,
  cheesez_solo: 23000, cheesez_combo: 30000,
  cheesezdoble_solo: 31000, cheesezdoble_combo: 38000,
  salchipapa: 29000,
  fries: 7000, fries_zabu: 10000,
  kids: 18000,
  granizado: 20000, granizado_extra: 27000,
  paleta: 7000,
}
const COSTO_BEBIDA_COMBO = 1200

// Ingredientes fijos del ZABÚ — sin salchicha (varía por tipo) y sin
// Tocineta Crispy (va dentro de la Salsa ZABÚ como ingrediente interno)
const INGREDIENTES_BASE_HOTDOG = [
  'ZaBun™ (pan top-split)',
  'Cream Code™',
  'Piña Caramelizada',
]
const INGREDIENTES_BASE_BURGER = [
  'ZaBún Burger (pan)',
  'Cream Code™',
]
const EMPAQUE_DIRECTO = ['Bandeja boat kraft', 'Papel encerado', 'Servilletas x6', 'Sticker ZABÚ']
const EMPAQUE_DOMICILIO_EXTRA = ['Caja kraft ventana', 'Bolsa papel kraft']

function costoPromedio(lotes, nombreProducto) {
  const activos = lotes.filter(l => l.producto_nombre === nombreProducto && l.estado === 'activo')
  if (activos.length === 0) return null
  return activos.reduce((s,l)=>s+l.costo_unitario,0) / activos.length
}

export default function ZabuCostos() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState('hotdog')

  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('zabu_lotes').select('*')
    setLotes(data || [])
    setLoading(false)
  }

  const productosUnicos = [...new Set(lotes.map(l => l.producto_nombre))]
  const salchichas = productosUnicos.filter(p =>
    ['pavo','americana','suiza','polaca','alemana','frankfurt'].some(s => p.toLowerCase().includes(s))
  )

  const costosBaseHotdog = INGREDIENTES_BASE_HOTDOG.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const costosBaseBurger = INGREDIENTES_BASE_BURGER.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const totalFijoHotdog = costosBaseHotdog.reduce((s,i) => s+(i.costo||0), 0)
  const totalFijoBurger = costosBaseBurger.reduce((s,i) => s+(i.costo||0), 0)
  const faltanBase = costosBaseHotdog.some(i => i.costo===null)

  const empaqueDirecto = EMPAQUE_DIRECTO.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const empaqueDomicilioExtra = EMPAQUE_DOMICILIO_EXTRA.map(nombre => ({ nombre, costo: costoPromedio(lotes, nombre) }))
  const totalEmpaqueDirecto = empaqueDirecto.reduce((s,i)=>s+(i.costo||0),0)
  const totalEmpaqueDomicilio = totalEmpaqueDirecto + empaqueDomicilioExtra.reduce((s,i)=>s+(i.costo||0),0)

  const filaSalchicha = (nombre) => {
    const cSal = costoPromedio(lotes, nombre)
    if (cSal === null || totalFijoHotdog === 0) return null
    const cTotal = Math.round(cSal + totalFijoHotdog + totalEmpaqueDirecto)
    const uSolo = PRECIOS.zabu_solo - cTotal
    const uCombo = PRECIOS.zabu_combo - cTotal - COSTO_BEBIDA_COMBO
    const mSolo = ((uSolo / PRECIOS.zabu_solo) * 100).toFixed(1)
    const mCombo = ((uCombo / PRECIOS.zabu_combo) * 100).toFixed(1)
    return { nombre: nombre.replace('Salchicha ',''), cSal, cTotal, uSolo, uCombo, mSolo, mCombo }
  }

  const TABS = [
    { id:'hotdog', label:'🌭 Hot Dog' },
    { id:'burger', label:'🍔 Burgers' },
    { id:'sides',  label:'🍟 Sides'  },
    { id:'otros',  label:'🧊 Otros'  },
  ]

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando costos desde inventario...</div>

  return (
    <>
      {faltanBase && (
        <div style={{ padding:'12px 16px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontSize:12, color:'var(--gold)', marginBottom:16 }}>
          ⚠️ Faltan lotes activos de uno o más ingredientes base ({INGREDIENTES_BASE_HOTDOG.filter((_,i)=>costosBaseHotdog[i].costo===null).join(', ')}) para calcular el costo completo. Registra lotes en Inventario o produce las recetas correspondientes.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'ZABÚ solo',         val:cop(PRECIOS.zabu_solo),         sub:'precio de venta' },
          { label:'ZABÚ combo',        val:cop(PRECIOS.zabu_combo),        sub:'+$7.000 sobre solo' },
          { label:'Burger más cara',   val:cop(PRECIOS.cheesezdoble_solo), sub:'CheesBurger Doble' },
          { label:'Granizado + extra', val:cop(PRECIOS.granizado_extra),   sub:'con Extra Shot' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:'var(--gold)' }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:'var(--gold)' }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTabActivo(t.id)} style={{
            padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700,
            background: tabActivo===t.id ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${tabActivo===t.id ? 'var(--gold-border)' : 'var(--border)'}`,
            color: tabActivo===t.id ? 'var(--gold)' : 'var(--text3)',
          }}>{t.label}</div>
        ))}
      </div>

      {tabActivo === 'hotdog' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="panel">
            <div className="panel-title">Comparativo de salchichas — costo y margen real</div>
            {salchichas.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--text4)', padding:'20px 0', textAlign:'center' }}>Sin lotes de salchicha en inventario. Registra compras en el módulo Compras.</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
                  {['Salchicha','C. Sal.','C. Total','Util. solo','Margen','Util. combo','Margen'].map(h => (
                    <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 8px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                {salchichas.map((nombre, i) => {
                  const f = filaSalchicha(nombre)
                  if (!f) return <div key={nombre} style={{ padding:'10px', fontSize:12, color:'var(--text4)' }}>{nombre} — faltan costos base</div>
                  return (
                    <div key={nombre} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                      {[
                        { val:f.nombre, color:'var(--text2)', bold:true },
                        { val:cop(f.cSal), color:'var(--text3)', bold:false },
                        { val:cop(f.cTotal), color:'var(--text2)', bold:true },
                        { val:cop(f.uSolo), color:'var(--green)', bold:true },
                        { val:f.mSolo+'%', color:margenColor(parseFloat(f.mSolo)), bold:true },
                        { val:cop(f.uCombo), color:'var(--green)', bold:true },
                        { val:f.mCombo+'%', color:margenColor(parseFloat(f.mCombo)), bold:true },
                      ].map((cell,j) => (
                        <div key={j} style={{ fontSize:11, padding:'10px 8px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:cell.color, fontWeight:cell.bold?600:400 }}>{cell.val}</div>
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </div>
          <div className="panel">
            <div className="panel-title">Ingredientes fijos del ZABÚ (sin salchicha)</div>
            {costosBaseHotdog.map((ing,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:ing.costo===null?'var(--text4)':'var(--text2)' }}>{ing.nombre}</span>
                {ing.costo===null
                  ? <span style={{ fontSize:11, color:'var(--red)' }}>sin lote activo</span>
                  : <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(ing.costo)}</span>
                }
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Total fijos</span>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{totalFijoHotdog>0?cop(totalFijoHotdog):'—'}</span>
            </div>
          </div>
        </div>
      )}

      {tabActivo === 'burger' && (
        <div className="panel">
          <div className="panel-title">Margen por hamburguesa</div>
          {[
            { nombre:'Classic Burger Z',  solo:PRECIOS.classic_solo,     combo:PRECIOS.classic_combo     },
            { nombre:'Hawaii',            solo:PRECIOS.hawaii_solo,       combo:PRECIOS.hawaii_combo      },
            { nombre:'CheesBurger Z',     solo:PRECIOS.cheesez_solo,      combo:PRECIOS.cheesez_combo     },
            { nombre:'CheesBurger Doble', solo:PRECIOS.cheesezdoble_solo, combo:PRECIOS.cheesezdoble_combo},
          ].map((b,i) => {
            const cBase = totalFijoBurger + totalEmpaqueDirecto
            const uSolo  = cBase > 0 ? b.solo  - cBase : null
            const uCombo = cBase > 0 ? b.combo - cBase - COSTO_BEBIDA_COMBO : null
            const mSolo  = uSolo  ? ((uSolo  / b.solo)  * 100).toFixed(1) : null
            const mCombo = uCombo ? ((uCombo / b.combo) * 100).toFixed(1) : null
            return (
              <div key={b.nombre} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'10px 0', borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', padding:'0 8px' }}>{b.nombre}</div>
                <div style={{ fontSize:12, color:'var(--gold)', padding:'0 8px', fontWeight:700 }}>{cop(b.solo)}</div>
                <div style={{ fontSize:12, color:'var(--text3)', padding:'0 8px' }}>Combo {cop(b.combo)}</div>
                <div style={{ fontSize:12, color:mSolo?margenColor(parseFloat(mSolo)):'var(--text4)', padding:'0 8px', fontWeight:700 }}>{mSolo?mSolo+'%':'—'}</div>
                <div style={{ fontSize:12, color:mCombo?margenColor(parseFloat(mCombo)):'var(--text4)', padding:'0 8px', fontWeight:700 }}>{mCombo?mCombo+'%':'—'}</div>
              </div>
            )
          })}
          {totalFijoBurger === 0 && (
            <div style={{ fontSize:11, color:'var(--gold)', marginTop:12 }}>⚠️ Registra lotes de ZaBún Burger y Cream Code para ver los márgenes reales.</div>
          )}
        </div>
      )}

      {tabActivo === 'sides' && (
        <div className="panel">
          <div className="panel-title">Sides — precios de venta</div>
          {[
            { nombre:'Salchipapa ZABÚ', precio:PRECIOS.salchipapa, desc:'2 salchichas + papas + queso + toppings' },
            { nombre:'Fries Z',         precio:PRECIOS.fries,      desc:'Papa + sazonador ZABÚ' },
            { nombre:'Fries ZABÚ',      precio:PRECIOS.fries_zabu, desc:'Papa + sazonador + Cream Code' },
          ].map((s,i) => (
            <div key={s.nombre} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.nombre}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{s.desc}</div>
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(s.precio)}</div>
            </div>
          ))}
        </div>
      )}

      {tabActivo === 'otros' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="panel">
            <div className="panel-title">Otros productos</div>
            {[
              { nombre:'Kids ZABÚ',             precio:PRECIOS.kids,            desc:'Mini Hot Dog / Mini Burger / Nuggets x8 + papas + bebida' },
              { nombre:'Granizado',             precio:PRECIOS.granizado,       desc:'Luna Azul / Código Rojo / Blend · 500ml' },
              { nombre:'Granizado + Extra Shot',precio:PRECIOS.granizado_extra, desc:'+$7.000 sobre el granizado base' },
              { nombre:'Paleta Artesanal',      precio:PRECIOS.paleta,          desc:'Frutos Rojos / Mango / Cookies & Cream / Chocolate Belga' },
            ].map((p,i) => (
              <div key={p.nombre} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{p.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{p.desc}</div>
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(p.precio)}</div>
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ gap:14 }}>
            <div className="panel">
              <div className="panel-title">Empaque — costo real del inventario</div>
              {[...empaqueDirecto.map(e=>({...e,tipo:'Directo'})),...empaqueDomicilioExtra.map(e=>({...e,tipo:'Domicilio'}))].map((e,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:12, color:e.costo===null?'var(--text4)':'var(--text2)' }}>{e.nombre}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{e.tipo}</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:e.costo===null?'var(--red)':'var(--text2)' }}>{e.costo===null?'sin lote':cop(e.costo)}</span>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="panel-title">Nota de costeo</div>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.8 }}>
                Los márgenes usan costos reales de <strong style={{color:'var(--gold)'}}>zabu_lotes</strong>.<br/><br/>
                Registra compras en <strong style={{color:'var(--gold)'}}>Compras</strong> y produce recetas en <strong style={{color:'var(--gold)'}}>Recetario</strong> para ver márgenes completos.<br/><br/>
                Proyecciones y punto de equilibrio en <strong style={{color:'var(--gold)'}}>Proyecciones</strong>.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
