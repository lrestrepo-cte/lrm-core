import { useState } from 'react'

function cop(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

const DIAS = ['Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const TIPO_DIA = ['Malo','Malo','Normal','Normal','Fuerte','Fuerte']
const UDIAS_BASE = {
  conservador: [18, 18, 28, 28, 45, 45],
  realista:    [25, 25, 40, 40, 70, 70],
  optimista:   [35, 35, 55, 55, 90, 90],
}

function colorTipo(t) {
  if (t === 'Malo')   return 'var(--red)'
  if (t === 'Normal') return 'var(--gold)'
  return 'var(--green)'
}

function bgTipo(t) {
  if (t === 'Malo')   return 'rgba(224,82,82,0.05)'
  if (t === 'Normal') return 'rgba(201,168,76,0.05)'
  return 'rgba(76,175,80,0.05)'
}

export default function ZabuProyeccion() {
  const [carritos,    setCarritos]    = useState(1)
  const [escenario,   setEscenario]   = useState('realista')
  const [pvMix,       setPvMix]       = useState(18500)
  const [costoUd,     setCostoUd]     = useState(7400)
  const [salCocinero, setSalCocinero] = useState(80000)
  const [salAyudante, setSalAyudante] = useState(60000)
  const [gasOp,       setGasOp]       = useState(200000)
  const [salProp,     setSalProp]     = useState(1000000)
  const [inversion,   setInversion]   = useState(3500000)

  const udsDia    = UDIAS_BASE[escenario].map(u => u * carritos)
  const utilUd    = pvMix - costoUd
  const personal  = (salCocinero + salAyudante) * carritos * 6
  const gastosFijos = personal + gasOp
  const totalNecesario = gastosFijos + salProp

  const semana = DIAS.map((dia, i) => ({
    dia,
    tipo: TIPO_DIA[i],
    uds:  udsDia[i],
    ventas:   udsDia[i] * pvMix,
    utilidad: udsDia[i] * utilUd,
  }))

  const totalVentasSem  = semana.reduce((s, d) => s + d.ventas, 0)
  const totalUtilidadSem = semana.reduce((s, d) => s + d.utilidad, 0)
  const utilidadNeta    = totalUtilidadSem - gastosFijos
  const cajaLibre       = utilidadNeta - salProp
  const pePerros        = Math.ceil(totalNecesario / utilUd)
  const peDiario        = Math.ceil(pePerros / 6)
  const semRecupero     = Math.ceil(inversion / Math.max(cajaLibre, 1))
  const totalPerrosSem  = semana.reduce((s, d) => s + d.uds, 0)

  const sliderStyle = {
    width:'100%', accentColor:'var(--gold)',
    marginTop:6, cursor:'pointer',
  }

  const inputNum = (val, set, min, max, step, label, fmt) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
        <span style={{ color:'var(--text3)' }}>{label}</span>
        <span style={{ color:'var(--gold)', fontWeight:700 }}>{fmt ? fmt(val) : val}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(Number(e.target.value))} style={sliderStyle} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text4)', marginTop:2 }}>
        <span>{fmt ? fmt(min) : min}</span><span>{fmt ? fmt(max) : max}</span>
      </div>
    </div>
  )

  return (
    <>
      {/* KPIs principales */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas semana',     val:cop(totalVentasSem),   color:'var(--gold)',  sub:`${totalPerrosSem} perros · ${carritos} carrito${carritos>1?'s':''}` },
          { label:'Utilidad neta',     val:cop(utilidadNeta),     color: utilidadNeta > 0 ? 'var(--green)' : 'var(--red)', sub:'después de gastos fijos' },
          { label:'Caja libre',        val:cop(cajaLibre),        color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)', sub:'después de tu salario' },
          { label:'Punto equilibrio',  val:`${peDiario} perros`,  color:'var(--text)',  sub:'diarios por carrito' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16, alignItems:'start' }}>

        {/* Panel de configuración */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Escenario */}
          <div className="panel">
            <div className="panel-title">Escenario de ventas</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {['conservador','realista','optimista'].map(e => (
                <div key={e} onClick={() => setEscenario(e)} style={{
                  padding:'10px 14px', borderRadius:10, cursor:'pointer',
                  background: escenario === e ? 'var(--gold-dim)' : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${escenario === e ? 'var(--gold-border)' : 'var(--border)'}`,
                  transition:'all .15s',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: escenario === e ? 'var(--gold)' : 'var(--text)', textTransform:'capitalize' }}>{e}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                        {e === 'conservador' ? '18-45 perros/día' : e === 'realista' ? '25-70 perros/día' : '35-90 perros/día'}
                      </div>
                    </div>
                    {escenario === e && <div style={{ color:'var(--gold)', fontSize:16 }}>✓</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="panel">
            <div className="panel-title">Configuración</div>

            {/* Carritos */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}>
                <span style={{ color:'var(--text3)' }}>Carritos activos</span>
                <span style={{ color:'var(--gold)', fontWeight:700 }}>{carritos}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3].map(n => (
                  <div key={n} onClick={() => setCarritos(n)} style={{
                    flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                    background: carritos === n ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${carritos === n ? 'var(--gold-border)' : 'var(--border)'}`,
                    fontSize:16, fontWeight:800, color: carritos === n ? 'var(--gold)' : 'var(--text3)',
                    transition:'all .15s',
                  }}>{n}</div>
                ))}
              </div>
            </div>

            {inputNum(pvMix, setPvMix, 17000, 22000, 500, 'Ticket promedio', cop)}
            {inputNum(costoUd, setCostoUd, 5000, 10000, 100, 'Costo por perro', cop)}
            {inputNum(salCocinero, setSalCocinero, 60000, 120000, 5000, 'Salario cocinero/día', cop)}
            {inputNum(salAyudante, setSalAyudante, 40000, 100000, 5000, 'Salario ayudante/día', cop)}
            {inputNum(gasOp, setGasOp, 50000, 500000, 10000, 'Gastos operativos/sem', cop)}
            {inputNum(salProp, setSalProp, 500000, 3000000, 100000, 'Tu salario semanal', cop)}
          </div>

          {/* Inversión y retorno */}
          <div className="panel">
            <div className="panel-title">Retorno de inversión</div>
            {inputNum(inversion, setInversion, 500000, 15000000, 100000, 'Inversión inicial', cop)}
            <div className="divider" />
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Caja libre/semana</span>
              <span style={{ fontSize:13, fontWeight:700, color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)' }}>{cop(cajaLibre)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Semanas para recuperar</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cajaLibre > 0 ? semRecupero : '∞'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Meses aprox.</span>
              <span style={{ fontSize:16, fontWeight:800, color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)' }}>
                {cajaLibre > 0 ? (semRecupero / 4.3).toFixed(1) + ' meses' : 'Ajusta los valores'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Proyección semanal */}
          <div className="panel">
            <div className="panel-title">Proyección semanal — escenario {escenario}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
              {['Día','Tipo','Perros','Ventas','Utilidad'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>
            {semana.map((d, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', background:bgTipo(d.tipo) }}>
                <div style={{ fontSize:12, padding:'10px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.dia}</div>
                <div style={{ fontSize:12, padding:'10px', color:colorTipo(d.tipo), fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.tipo}</div>
                <div style={{ fontSize:12, padding:'10px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{d.uds}</div>
                <div style={{ fontSize:12, padding:'10px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{cop(d.ventas)}</div>
                <div style={{ fontSize:12, padding:'10px', color:colorTipo(d.tipo), fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{cop(d.utilidad)}</div>
              </div>
            ))}
            {/* Totales */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
              <div style={{ fontSize:12, padding:'10px', color:'var(--text)', fontWeight:700 }}>TOTAL</div>
              <div style={{ fontSize:12, padding:'10px' }} />
              <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800 }}>{totalPerrosSem}</div>
              <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800 }}>{cop(totalVentasSem)}</div>
              <div style={{ fontSize:13, padding:'10px', color:'var(--gold)', fontWeight:800 }}>{cop(totalUtilidadSem)}</div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="grid-2" style={{ gap:12 }}>
            <div className="panel">
              <div className="panel-title">Estructura de gastos semana</div>
              {[
                { label:`Personal (${carritos} carrito${carritos>1?'s':''})`, val:personal,    color:'var(--red)'   },
                { label:'Gastos operativos',                                   val:gasOp,       color:'var(--red)'   },
                { label:'Total gastos fijos',                                  val:gastosFijos, color:'var(--gold)'  },
                { label:'Tu salario',                                          val:salProp,     color:'var(--red)'   },
                { label:'Total a cubrir',                                      val:totalNecesario, color:'var(--text)'},
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{cop(r.val)}</span>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title">Resultado final semana</div>
              {[
                { label:'Utilidad bruta',   val:totalUtilidadSem,  color:'var(--green)' },
                { label:'(-) Gastos fijos', val:-gastosFijos,       color:'var(--red)'   },
                { label:'Utilidad neta',    val:utilidadNeta,       color: utilidadNeta > 0 ? 'var(--green)' : 'var(--red)' },
                { label:'(-) Tu salario',   val:-salProp,           color:'var(--red)'   },
                { label:'Caja libre',       val:cajaLibre,          color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{cop(r.val)}</span>
                </div>
              ))}
              <div style={{ marginTop:10, padding:'12px 14px', background: cajaLibre > 0 ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius:10, border:`1px solid ${cajaLibre > 0 ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}` }}>
                <div style={{ fontSize:11, color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)', marginBottom:4 }}>
                  {cajaLibre > 0 ? '✅ El negocio es viable con este escenario' : '⚠️ Ajusta los parámetros — el negocio no cubre gastos'}
                </div>
                <div style={{ fontSize:20, fontWeight:800, color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)' }}>{cop(cajaLibre)}/semana</div>
              </div>
            </div>
          </div>

          {/* Proyección mensual */}
          <div className="panel">
            <div className="panel-title">Proyección mensual y anual</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { label:'Ventas mes',      val:cop(totalVentasSem * 4.3),   color:'var(--gold)'  },
                { label:'Utilidad mes',    val:cop(utilidadNeta * 4.3),     color: utilidadNeta > 0 ? 'var(--green)' : 'var(--red)' },
                { label:'Caja libre mes',  val:cop(cajaLibre * 4.3),        color: cajaLibre > 0 ? 'var(--green)' : 'var(--red)'   },
                { label:'Ventas año',      val:cop(totalVentasSem * 52),    color:'var(--gold)'  },
              ].map(k => (
                <div key={k.label} style={{ background:'var(--bg4)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:k.color }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}