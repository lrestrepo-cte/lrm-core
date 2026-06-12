import { useState } from 'react'
const RECETAS = [
  {
    id: 'zabu',
    nombre: 'ZABÚ',
    emoji: '🌭',
    descripcion: 'El producto insignia. Sin queso. El equivalente al Big Mac de ZABÚ.',
    tiempo: '20-30 seg',
    ingredientes: [
      { nombre: 'ZaBun™ (pan top-split)',      cantidad: '1 ud',        gramaje: '~160g',  costo: 1000, proceso: 'Mantequilla ~3g por lado · plancha 180-200°C · 35-45 seg · color dorado miel' },
      { nombre: 'TurkeyLink™ (salchicha pavo)',cantidad: '1 ud',        gramaje: '80-100g', costo: 3700, proceso: 'Plancha 180-200°C · 90-120 seg · girar cada 30 seg · no perforar' },
      { nombre: 'Cream Code™',                cantidad: '1 pulsación', gramaje: '26ml',    costo: 700,  proceso: 'Dispensador One Shot · una pulsación · baño uniforme · nunca zigzag' },
      { nombre: 'Tocineta Crispy',            cantidad: '1 porción',   gramaje: '15g',     costo: 600,  proceso: 'Cuchara Z15 · distribuir uniformemente · acento visual crujiente' },
      { nombre: 'Piña Caramelizada',          cantidad: '1 porción',   gramaje: '20g',     costo: 400,  proceso: 'Cuchara Z20 · toque final · opcional · no debe dominar' },
      { nombre: 'Bandeja boat kraft',         cantidad: '1 ud',        gramaje: '—',       costo: 400,  proceso: 'Venta directa · papel encerado interior · sticker ZABÚ' },
      { nombre: 'Papel encerado',             cantidad: '1 lámina',    gramaje: '—',       costo: 100,  proceso: 'Base interior de la bandeja' },
      { nombre: 'Servilletas x6',             cantidad: '6 uds',       gramaje: '—',       costo: 240,  proceso: 'Entrega al cliente con el pedido' },
      { nombre: 'Sticker ZABÚ',               cantidad: '1 ud',        gramaje: '—',       costo: 120,  proceso: 'Sella la bandeja o la bolsa de domicilio' },
    ],
    pasos: [
      { n:1, titulo:'ZaBun™ — ZaBun Butter Seal™',  desc:'Aplicar mantequilla ~3g por lado. Plancha 180-200°C. Sellar 35-45 seg por lado. Objetivo: color dorado miel, micro caramelización, interior suave.' },
      { n:2, titulo:'TurkeyLink™ — cocción',         desc:'Plancha 180-200°C. 90-120 seg total. Girar cada 30 seg. No perforar. Exterior brillante con marcas suaves. Interior jugoso.' },
      { n:3, titulo:'Armar base',                    desc:'Abrir ZaBun™ por apertura superior. Colocar TurkeyLink™ centrada. Debe sobresalir 0.5-1 cm por cada extremo.' },
      { n:4, titulo:'Tocineta Crispy — Cuchara Z15', desc:'15g exactos. Deslizar sobre la salchicha en una sola pasada. Distribución uniforme. Acento visual crujiente.' },
      { n:5, titulo:'Piña ZABÚ — Cuchara Z20',       desc:'20g exactos. Toque final opcional. Poca cantidad. Complementa el sabor, no lo domina.' },
      { n:6, titulo:'Cream Code™ — One Shot',        desc:'Una sola pulsación = 26ml. Baño uniforme y elegante. Cobertura homogénea. Nunca en zigzag ni desordenada.' },
      { n:7, titulo:'Empacar y entregar',            desc:'Papel encerado en bandeja boat. Colocar el perro. Sticker ZABÚ. 6 servilletas. Entregar.' },
    ]
  },
  {
    id: 'cheezabu',
    nombre: 'CheeZabú',
    emoji: '🧀',
    descripcion: 'Con queso cheddar derretido. $2.000 más que el ZABÚ. Máxima indulgencia.',
    tiempo: '20-35 seg',
    ingredientes: [
      { nombre: 'ZaBun™ (pan top-split)',      cantidad: '1 ud',        gramaje: '~160g',  costo: 1000, proceso: 'Mismo proceso que ZABÚ · ZaBun Butter Seal™' },
      { nombre: 'TurkeyLink™ (salchicha pavo)',cantidad: '1 ud',        gramaje: '80-100g', costo: 3700, proceso: 'Mismo proceso que ZABÚ' },
      { nombre: 'Queso Cheddar',              cantidad: '1 porción',   gramaje: '~20g',    costo: 1000, proceso: 'Aplicar sobre la salchicha caliente · dejar derretir antes del Cream Code' },
      { nombre: 'Cream Code™',                cantidad: '1 pulsación', gramaje: '26ml',    costo: 700,  proceso: 'Dispensador One Shot · sobre el queso ya derretido' },
      { nombre: 'Tocineta Crispy',            cantidad: '1 porción',   gramaje: '15g',     costo: 600,  proceso: 'Cuchara Z15 · sobre el queso y la Cream Code' },
      { nombre: 'Piña Caramelizada',          cantidad: '1 porción',   gramaje: '20g',     costo: 400,  proceso: 'Cuchara Z20 · opcional · toque final' },
      { nombre: 'Bandeja boat kraft',         cantidad: '1 ud',        gramaje: '—',       costo: 400,  proceso: 'Venta directa · papel encerado interior' },
      { nombre: 'Papel encerado',             cantidad: '1 lámina',    gramaje: '—',       costo: 100,  proceso: 'Base interior de la bandeja' },
      { nombre: 'Servilletas x6',             cantidad: '6 uds',       gramaje: '—',       costo: 240,  proceso: 'Entrega al cliente' },
      { nombre: 'Sticker ZABÚ',               cantidad: '1 ud',        gramaje: '—',       costo: 120,  proceso: 'Sella la bandeja' },
    ],
    pasos: [
      { n:1, titulo:'ZaBun™ — ZaBun Butter Seal™',  desc:'Mismo proceso que ZABÚ. Mantequilla, plancha 180-200°C, 35-45 seg por lado, dorado miel.' },
      { n:2, titulo:'TurkeyLink™ — cocción',         desc:'Mismo proceso que ZABÚ. Plancha 180-200°C, 90-120 seg, girar cada 30 seg.' },
      { n:3, titulo:'Armar base + queso',            desc:'Abrir ZaBun™. Colocar TurkeyLink™. Aplicar queso cheddar (~20g) sobre la salchicha caliente. Esperar 10-15 seg para que derrita.' },
      { n:4, titulo:'Tocineta Crispy — Cuchara Z15', desc:'15g exactos sobre el queso. Distribución uniforme.' },
      { n:5, titulo:'Piña ZABÚ — Cuchara Z20',       desc:'20g opcionales. Toque final. No domina.' },
      { n:6, titulo:'Cream Code™ — One Shot',        desc:'Una sola pulsación = 26ml. Baño uniforme sobre todo. El queso ya derretido queda debajo.' },
      { n:7, titulo:'Empacar y entregar',            desc:'Papel encerado · bandeja boat · sticker · 6 servilletas.' },
    ]
  },
]

function cop(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

export default function ZabuRecetario() {
  const [sel, setSel] = useState(RECETAS[0])
  const [infoAbierta, setInfoAbierta] = useState(null)

  const costoTotal = sel.ingredientes.reduce((s, i) => s + i.costo, 0)
  const precioVenta = sel.id === 'zabu' ? 17000 : 19000
  const utilidad = precioVenta - costoTotal
  const margen = ((utilidad / precioVenta) * 100).toFixed(1)

  return (
    <div className="grid-1-2" style={{ gap:16, alignItems:'start' }}>

      {/* Panel izquierdo */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Selector */}
        <div className="panel">
          <div className="panel-title">Recetas activas</div>
          {RECETAS.map(r => {
            const ct = r.ingredientes.reduce((s,i) => s+i.costo, 0)
            const pv = r.id === 'zabu' ? 17000 : 19000
            return (
              <div key={r.id} onClick={() => { setSel(r); setInfoAbierta(null) }} style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 8,
                background: sel.id === r.id ? 'var(--gold-dim)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${sel.id === r.id ? 'var(--gold-border)' : 'var(--border)'}`,
                transition: 'all .15s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:22 }}>{r.emoji}</span>
                  <span style={{ fontSize:14, fontWeight:700, color: sel.id === r.id ? 'var(--gold)' : 'var(--text)' }}>{r.nombre}</span>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>{r.descripcion}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text3)' }}>Costo: <span style={{ color:'var(--text2)', fontWeight:600 }}>{cop(ct)}</span></span>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>{cop(pv)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* PEP resumen */}
        <div className="panel">
          <div className="panel-title">PEP — {sel.nombre}</div>
          {[
            { label:'Ingredientes',    val:sel.ingredientes.length + ' items',  color:'var(--text2)' },
            { label:'Costo total',     val:cop(costoTotal),                      color:'var(--text2)' },
            { label:'Precio de venta', val:cop(precioVenta),                     color:'var(--gold)'  },
            { label:'Utilidad',        val:cop(utilidad),                        color:'var(--green)' },
            { label:'Tiempo',          val:sel.tiempo,                           color:'var(--text2)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:r.color }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:2 }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Margen</span>
            <span style={{ fontSize:18, fontWeight:800, color: parseFloat(margen) >= 55 ? 'var(--green)' : 'var(--gold)' }}>{margen}%</span>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Header receta */}
        <div className="panel">
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ fontSize:52 }}>{sel.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:-0.5, marginBottom:4 }}>{sel.nombre}</div>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:14 }}>{sel.descripcion}</div>
              <div style={{ display:'flex', gap:24 }}>
                {[
                  { label:'INGREDIENTES', val:sel.ingredientes.length },
                  { label:'PASOS',        val:sel.pasos.length        },
                  { label:'TIEMPO',       val:sel.tiempo              },
                  { label:'MARGEN',       val:margen+'%'              },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:1, marginBottom:3 }}>{s.label}</div>
                    <div style={{ fontSize:16, fontWeight:700, color: s.label === 'MARGEN' ? 'var(--green)' : 'var(--text)' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="panel">
          <div className="panel-title">Ingredientes y PEPs — toca para ver el proceso</div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', marginBottom:6 }}>
            {['Ingrediente','Cantidad','Gramaje','Costo'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>
          {sel.ingredientes.map((ing, i) => (
            <div key={i}>
              <div onClick={() => setInfoAbierta(infoAbierta === i ? null : i)} style={{
                display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', cursor:'pointer',
                background: infoAbierta === i ? 'rgba(201,168,76,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderLeft: infoAbierta === i ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all .15s',
              }}>
                {[ing.nombre, ing.cantidad, ing.gramaje, cop(ing.costo)].map((val, j) => (
                  <div key={j} style={{ fontSize:12, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,0.03)', color: j===3 ? 'var(--gold)' : j===0 ? 'var(--text2)' : 'var(--text3)', fontWeight: j===3 ? 700 : j===0 ? 500 : 400 }}>{val}</div>
                ))}
              </div>
              {infoAbierta === i && (
                <div style={{ padding:'10px 12px 10px 14px', background:'rgba(201,168,76,0.05)', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:11, color:'var(--text3)', lineHeight:1.7 }}>
                  <span style={{ color:'var(--gold)', fontWeight:600 }}>Proceso: </span>{ing.proceso}
                </div>
              )}
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 10px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
            <span style={{ fontSize:12, color:'var(--text3)', marginRight:16 }}>Costo total</span>
            <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(costoTotal)}</span>
          </div>
        </div>

        {/* Pasos */}
        <div className="panel">
          <div className="panel-title">Línea de ensamblaje — proceso paso a paso</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {sel.pasos.map((p) => (
              <div key={p.n} style={{ display:'flex', gap:14, padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', transition:'border-color .15s' }}
                onMouseOver={e => e.currentTarget.style.borderColor='var(--gold-border)'}
                onMouseOut={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                <div style={{ width:28, height:28, borderRadius:8, background:'var(--gold-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'var(--gold)', flexShrink:0 }}>{p.n}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{p.titulo}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.7 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}