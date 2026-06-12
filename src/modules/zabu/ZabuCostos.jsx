const SALCHICHAS = [
  { nombre:'Salchicha de Pavo',        precio:29600, uds:8  },
  { nombre:'Salchicha Hot Dog',        precio:20559, uds:7  },
  { nombre:'Salchicha Alemana',        precio:20700, uds:5  },
  { nombre:'Salchicha Parisienne',     precio:20700, uds:5  },
]

const INGREDIENTES_FIJOS = [
  { nombre:'ZaBun™',               costo:1000 },
  { nombre:'Cream Code™ (26ml)',   costo:700  },
  { nombre:'Tocineta Crispy',      costo:600  },
  { nombre:'Piña Caramelizada',    costo:400  },
]

const EMPAQUE_DIRECTO  = 860
const EMPAQUE_DOMICILIO = 2110
const COSTO_BEBIDA     = 1500
const COSTO_QUESO      = 1000

const PV = {
  zabu_solo:     17000,
  zabu_combo:    20000,
  cheez_solo:    19000,
  cheez_combo:   22000,
}

function cop(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function pct(c, v) {
  return ((c / v) * 100).toFixed(1) + '%'
}

function margenColor(m) {
  if (m >= 60) return 'var(--green)'
  if (m >= 50) return 'var(--gold)'
  return 'var(--red)'
}

export default function ZabuCostos() {
  const totalFijo = INGREDIENTES_FIJOS.reduce((s, i) => s + i.costo, 0)

  return (
    <>
      {/* KPIs empaque */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingredientes fijos',    val:cop(totalFijo),          color:'var(--text)',  sub:'sin salchicha ni empaque'   },
          { label:'Empaque venta directa', val:cop(EMPAQUE_DIRECTO),    color:'var(--text)',  sub:'bandeja + papel + sticker'  },
          { label:'Empaque domicilio',     val:cop(EMPAQUE_DOMICILIO),  color:'var(--text)',  sub:'caja + bolsa + sticker'     },
          { label:'Bebida (combo)',        val:cop(COSTO_BEBIDA),       color:'var(--text)',  sub:'Coca-Cola 250ml'            },
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

        {/* Comparativo salchichas */}
        <div className="panel">
          <div className="panel-title">Comparativo de salchichas — costo y margen por producto</div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
            {['Salchicha','C. Sal.','C. Total','Util. solo','Margen','Util. combo','Margen'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>
          {SALCHICHAS.map((s, i) => {
            const cSal   = Math.round(s.precio / s.uds)
            const cTotal = cSal + totalFijo + EMPAQUE_DIRECTO
            const uSolo  = PV.zabu_solo  - cTotal
            const uCombo = PV.zabu_combo - cTotal - COSTO_BEBIDA
            const mSolo  = ((uSolo  / PV.zabu_solo)  * 100).toFixed(1)
            const mCombo = ((uCombo / PV.zabu_combo) * 100).toFixed(1)
            return (
              <div key={s.nombre} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {[
                  { val:s.nombre,         color:'var(--text2)',  bold:true  },
                  { val:cop(cSal),        color:'var(--text3)',  bold:false },
                  { val:cop(cTotal),      color:'var(--text2)',  bold:true  },
                  { val:cop(uSolo),       color:'var(--green)',  bold:true  },
                  { val:mSolo+'%',        color:margenColor(parseFloat(mSolo)),  bold:true },
                  { val:cop(uCombo),      color:'var(--green)',  bold:true  },
                  { val:mCombo+'%',       color:margenColor(parseFloat(mCombo)), bold:true },
                ].map((cell, j) => (
                  <div key={j} style={{ fontSize:12, padding:'10px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:cell.color, fontWeight:cell.bold ? 600 : 400 }}>{cell.val}</div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Desglose ingredientes fijos */}
        <div className="grid-2" style={{ gap:14 }}>
          <div className="panel">
            <div className="panel-title">Desglose — ingredientes fijos</div>
            {INGREDIENTES_FIJOS.map((ing, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text2)' }}>{ing.nombre}</span>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:80, background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden' }}>
                    <div style={{ height:4, borderRadius:2, width:`${(ing.costo/totalFijo)*100}%`, background:'var(--gold)' }} />
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)', minWidth:50, textAlign:'right' }}>{cop(ing.costo)}</span>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Total fijos</span>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(totalFijo)}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Desglose — empaque</div>
            {[
              { nombre:'Bandeja boat kraft',  costo:400,  tipo:'Directo'  },
              { nombre:'Papel encerado',      costo:100,  tipo:'Directo'  },
              { nombre:'Servilletas x6',      costo:240,  tipo:'Directo'  },
              { nombre:'Sticker ZABÚ',        costo:120,  tipo:'Directo'  },
              { nombre:'Caja kraft ventana',  costo:1350, tipo:'Domicilio'},
              { nombre:'Bolsa papel kraft',   costo:300,  tipo:'Domicilio'},
            ].map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{e.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{e.tipo}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>{cop(e.costo)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:11, color:'var(--text3)' }}>Venta directa</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(EMPAQUE_DIRECTO)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:11, color:'var(--text3)' }}>Domicilio</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(EMPAQUE_DOMICILIO)}</span>
            </div>
          </div>
        </div>

        {/* Proyección semanal */}
        <div className="panel">
          <div className="panel-title">Proyección semanal — escenario realista (mix 50% solo / 40% combo / 10% combo+queso)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
            {['Día','Tipo','Uds','Ventas brutas','Utilidad bruta','Util/perro','Acum.'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>
          {(() => {
            const cSalPavo = Math.round(29600/8)
            const cTotalPavo = cSalPavo + totalFijo + EMPAQUE_DIRECTO
            const uSolo  = PV.zabu_solo  - cTotalPavo
            const uCombo = PV.zabu_combo - cTotalPavo - COSTO_BEBIDA
            const uQueso = PV.cheez_combo - cTotalPavo - COSTO_BEBIDA - COSTO_QUESO
            const uMix   = Math.round(uSolo*0.5 + uCombo*0.4 + uQueso*0.1)
            const pvMix  = Math.round(PV.zabu_solo*0.5 + PV.zabu_combo*0.4 + PV.cheez_combo*0.1)
            const dias = [
              { dia:'Martes',    uds:25, tipo:'Malo'   },
              { dia:'Miércoles', uds:25, tipo:'Malo'   },
              { dia:'Jueves',    uds:40, tipo:'Normal' },
              { dia:'Viernes',   uds:40, tipo:'Normal' },
              { dia:'Sábado',    uds:70, tipo:'Fuerte' },
              { dia:'Domingo',   uds:70, tipo:'Fuerte' },
            ]
            let acum = 0
            return dias.map((d, i) => {
              const ventas = d.uds * pvMix
              const util   = d.uds * uMix
              acum += util
              const bgColor = d.tipo === 'Malo' ? 'rgba(224,82,82,0.05)' : d.tipo === 'Normal' ? 'rgba(201,168,76,0.05)' : 'rgba(76,175,80,0.05)'
              const tipoColor = d.tipo === 'Malo' ? 'var(--red)' : d.tipo === 'Normal' ? 'var(--gold)' : 'var(--green)'
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr', background:bgColor }}>
                  {[
                    { val:d.dia,        color:'var(--text2)', bold:true  },
                    { val:d.tipo,       color:tipoColor,      bold:true  },
                    { val:String(d.uds),color:'var(--text3)', bold:false },
                    { val:cop(ventas),  color:'var(--text2)', bold:false },
                    { val:cop(util),    color:tipoColor,      bold:true  },
                    { val:cop(uMix),    color:'var(--text3)', bold:false },
                    { val:cop(acum),    color:'var(--gold)',  bold:true  },
                  ].map((cell, j) => (
                    <div key={j} style={{ fontSize:12, padding:'10px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:cell.color, fontWeight:cell.bold ? 700 : 400 }}>{cell.val}</div>
                  ))}
                </div>
              )
            })
          })()}
          {/* Totales */}
          {(() => {
            const cSalPavo = Math.round(29600/8)
            const cTotalPavo = cSalPavo + totalFijo + EMPAQUE_DIRECTO
            const uSolo  = PV.zabu_solo  - cTotalPavo
            const uCombo = PV.zabu_combo - cTotalPavo - COSTO_BEBIDA
            const uQueso = PV.cheez_combo - cTotalPavo - COSTO_BEBIDA - COSTO_QUESO
            const uMix   = Math.round(uSolo*0.5 + uCombo*0.4 + uQueso*0.1)
            const pvMix  = Math.round(PV.zabu_solo*0.5 + PV.zabu_combo*0.4 + PV.cheez_combo*0.1)
            const totalUds   = 270
            const totalVentas = totalUds * pvMix
            const totalUtil  = totalUds * uMix
            const gastos     = 1040000
            const salario    = 1000000
            const neto       = totalUtil - gastos
            const sobrante   = neto - salario
            return (
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  {[
                    { label:'Utilidad bruta semana', val:cop(totalUtil),  color:'var(--gold)'  },
                    { label:'(-) Gastos + personal',  val:cop(-gastos),   color:'var(--red)'   },
                    { label:'Utilidad neta',          val:cop(neto),      color:'var(--green)' },
                    { label:'(-) Salario propietario',val:cop(-salario),  color:'var(--red)'   },
                    { label:'Caja para crecimiento',  val:cop(sobrante),  color: sobrante >= 0 ? 'var(--green)' : 'var(--red)' },
                    { label:'Punto de equilibrio',    val:Math.ceil((gastos+salario)/uMix)+' perros/sem', color:'var(--text2)' },
                  ].map(r => (
                    <div key={r.label} style={{ background:'var(--bg4)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6 }}>{r.label}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:r.color }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}