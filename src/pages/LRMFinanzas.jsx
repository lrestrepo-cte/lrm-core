import { useState } from 'react'

function cop(n) {
  const abs = Math.abs(Math.round(n))
  const fmt = abs >= 1000000 ? '$'+(abs/1000000).toFixed(1).replace('.0','')+'M'
            : abs >= 1000    ? '$'+(abs/1000).toFixed(0)+'K'
            : '$'+abs.toLocaleString('es-CO')
  return n < 0 ? '-'+fmt : fmt
}

const NEGOCIOS_DATA = [
  {
    id:'zabu', nombre:'ZABÚ', emoji:'🌭', color:'#C9A84C',
    estado:'activo', fase:'Operando',
    inversion:3500000, recuperado:820000,
    ingresosMes:2736000, utilidadMes:684000,
    metaMensual:3500000, proyeccionAnual:32832000,
    costoExpansion:3500000, semanasOperando:3,
    semanasMeta:8, foodCostActual:43.8,
    descripcion:'3 carritos proyectados · 1 activo',
  },
  {
    id:'bombas', nombre:'Las Bombas', emoji:'💣', color:'#4caf50',
    estado:'dev', fase:'En desarrollo',
    inversion:800000, recuperado:0,
    ingresosMes:0, utilidadMes:0,
    metaMensual:2000000, proyeccionAnual:0,
    costoExpansion:2500000, semanasOperando:0,
    semanasMeta:0, foodCostActual:0,
    descripcion:'Guineo verde · toppings múltiples',
  },
  {
    id:'rv', nombre:'RV Sports', emoji:'⚽', color:'#378ADD',
    estado:'dev', fase:'En desarrollo',
    inversion:1200000, recuperado:0,
    ingresosMes:0, utilidadMes:0,
    metaMensual:3000000, proyeccionAnual:0,
    costoExpansion:1200000, semanasOperando:0,
    semanasMeta:0, foodCostActual:0,
    descripcion:'Calcetines deportivos premium',
  },
  {
    id:'coco', nombre:'Coco Shake', emoji:'🥥', color:'#00BCD4',
    estado:'pronto', fase:'Próximamente',
    inversion:0, recuperado:0,
    ingresosMes:0, utilidadMes:0,
    metaMensual:2500000, proyeccionAnual:0,
    costoExpansion:4000000, semanasOperando:0,
    semanasMeta:0, foodCostActual:0,
    descripcion:'Shakes de coco premium',
  },
  {
    id:'quesolote', nombre:'Quesolote', emoji:'🌽', color:'#FF9800',
    estado:'pronto', fase:'Próximamente',
    inversion:0, recuperado:0,
    ingresosMes:0, utilidadMes:0,
    metaMensual:2000000, proyeccionAnual:0,
    costoExpansion:3000000, semanasOperando:0,
    semanasMeta:0, foodCostActual:0,
    descripcion:'Elotes y maíz premium',
  },
  {
    id:'puffys', nombre:'Puffys', emoji:'🥞', color:'#9C27B0',
    estado:'pronto', fase:'Próximamente',
    inversion:0, recuperado:0,
    ingresosMes:0, utilidadMes:0,
    metaMensual:2000000, proyeccionAnual:0,
    costoExpansion:3500000, semanasOperando:0,
    semanasMeta:0, foodCostActual:0,
    descripcion:'Mini panquecas premium',
  },
]

const MESES = ['Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun']

const FLUJO_BASE = {
  conservador: [2100000, 2300000, 2500000, 3200000, 3500000, 4000000, 4200000, 4500000, 5000000, 5500000, 6000000, 7000000],
  realista:    [2736000, 3200000, 3800000, 4500000, 5200000, 6000000, 6500000, 7000000, 8000000, 9000000, 10000000, 12000000],
  optimista:   [3500000, 4500000, 5500000, 7000000, 8500000, 10000000, 12000000, 14000000, 16000000, 18000000, 20000000, 25000000],
}

const GASTOS_BASE = [1040000, 1040000, 1200000, 1400000, 1600000, 1800000, 2000000, 2200000, 2400000, 2600000, 2800000, 3200000]

function generarAlertas(negocios, escenario) {
  const alertas = []
  const zabu = negocios.find(n => n.id === 'zabu')
  const capitalDisponible = zabu.recuperado

  // Expansión
  if (zabu.semanasOperando >= 6 && zabu.utilidadMes > 500000) {
    alertas.push({
      tipo:'expansion', urgencia:'verde',
      titulo:'ZABÚ listo para Carrito 02',
      desc:`Llevas ${zabu.semanasOperando} semanas operando con utilidad consistente. Considera activar el segundo carrito.`,
      accion:'Activar Carrito 02', negocio:'ZABÚ'
    })
  }

  if (zabu.recuperado / zabu.inversion >= 0.5) {
    alertas.push({
      tipo:'expansion', urgencia:'verde',
      titulo:'ROI de ZABÚ al 50%+',
      desc:`Has recuperado ${cop(zabu.recuperado)} de ${cop(zabu.inversion)} invertidos. Buen momento para planear el tercer carrito.`,
      accion:'Ver proyección Carrito 03', negocio:'ZABÚ'
    })
  }

  // Inversión en pendientes
  const flujoMes = FLUJO_BASE[escenario][2]
  const gastoMes = GASTOS_BASE[2]
  const cajaLibreMes = (flujoMes - gastoMes) * 0.7

  if (cajaLibreMes > 1500000) {
    alertas.push({
      tipo:'inversion', urgencia:'amarillo',
      titulo:'Capital disponible para Las Bombas',
      desc:`Con la caja libre proyectada de ${cop(cajaLibreMes)}/mes, puedes comenzar la inversión inicial de Las Bombas en 3-4 meses.`,
      accion:'Ver plan Las Bombas', negocio:'Las Bombas'
    })
  }

  negocios.filter(n => n.estado === 'dev' && n.semanasOperando === 0).forEach(n => {
    alertas.push({
      tipo:'inversion', urgencia:'amarillo',
      titulo:`${n.nombre} — Define fecha de inicio`,
      desc:`${n.nombre} lleva tiempo en desarrollo sin fecha de arranque. Define un cronograma o reasigna el capital.`,
      accion:'Definir cronograma', negocio:n.nombre
    })
  })

  // Riesgo
  if (zabu.foodCostActual > 44) {
    alertas.push({
      tipo:'riesgo', urgencia:'rojo',
      titulo:'Food cost de ZABÚ cerca del límite',
      desc:`Food cost actual ${zabu.foodCostActual}% — límite 45%. Revisa costos de ingredientes o ajusta precios.`,
      accion:'Ver PEPs', negocio:'ZABÚ'
    })
  }

  const flujoNegativo = FLUJO_BASE[escenario].findIndex((f, i) => f - GASTOS_BASE[i] < 0)
  if (flujoNegativo >= 0) {
    alertas.push({
      tipo:'riesgo', urgencia:'rojo',
      titulo:`Flujo negativo proyectado en ${MESES[flujoNegativo]}`,
      desc:`En el escenario ${escenario}, el mes ${MESES[flujoNegativo]} muestra flujo negativo. Ajusta gastos o acelera ingresos.`,
      accion:'Ver flujo de caja', negocio:'LRM Trade'
    })
  }

  return alertas
}

export default function LRMFinanzas() {
  const [tab, setTab]           = useState('resumen')
  const [escenario, setEscenario] = useState('realista')
  const [negocios]              = useState(NEGOCIOS_DATA)

  const alertas = generarAlertas(negocios, escenario)
  const alertasVerdes   = alertas.filter(a => a.urgencia === 'verde')
  const alertasAmarillos = alertas.filter(a => a.urgencia === 'amarillo')
  const alertasRojos    = alertas.filter(a => a.urgencia === 'rojo')

  const totalInvertido  = negocios.reduce((s,n) => s+n.inversion, 0)
  const totalRecuperado = negocios.reduce((s,n) => s+n.recuperado, 0)
  const ingresosMes     = negocios.reduce((s,n) => s+n.ingresosMes, 0)
  const utilidadMes     = negocios.reduce((s,n) => s+n.utilidadMes, 0)

  const flujo = FLUJO_BASE[escenario]
  const utilidadAnual = flujo.reduce((s,f,i) => s+(f-GASTOS_BASE[i]), 0)
  const maxFlujo = Math.max(...flujo)

  const colorUrgencia = (u) => u==='verde' ? 'var(--green)' : u==='amarillo' ? 'var(--gold)' : 'var(--red)'
  const bgUrgencia    = (u) => u==='verde' ? 'var(--green-dim)' : u==='amarillo' ? 'var(--gold-dim)' : 'var(--red-dim)'
  const borderUrgencia = (u) => u==='verde' ? 'var(--green-border)' : u==='amarillo' ? 'var(--gold-border)' : 'rgba(224,82,82,0.3)'
  const emojiUrgencia = (u) => u==='verde' ? '🚀' : u==='amarillo' ? '💡' : '⚠️'

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total invertido',    val:cop(totalInvertido),  color:'var(--text)',  sub:'en todos los negocios'     },
          { label:'Recuperado',         val:cop(totalRecuperado), color:'var(--green)', sub:`${((totalRecuperado/totalInvertido)*100).toFixed(1)}% del total invertido` },
          { label:'Ingresos este mes',  val:cop(ingresosMes),     color:'var(--gold)',  sub:'negocios activos'          },
          { label:'Alertas activas',    val:String(alertas.length), color: alertasRojos.length>0 ? 'var(--red)' : 'var(--gold)', sub:`${alertasRojos.length} críticas · ${alertasVerdes.length} oportunidades` },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div className="sub-nav" style={{ marginBottom:0 }}>
          {[
            { id:'resumen',    label:'Resumen'         },
            { id:'alertas',    label:`Alertas (${alertas.length})` },
            { id:'flujo',      label:'Flujo de caja'   },
            { id:'negocios',   label:'Por negocio'     },
            { id:'cronograma', label:'Cronograma'      },
          ].map(t => (
            <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['conservador','realista','optimista'].map(e => (
            <div key={e} onClick={() => setEscenario(e)} style={{
              padding:'5px 12px', borderRadius:8, fontSize:11, cursor:'pointer',
              background: escenario===e ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
              border:`0.5px solid ${escenario===e ? 'var(--gold-border)' : 'var(--border)'}`,
              color: escenario===e ? 'var(--gold)' : 'var(--text3)',
              fontWeight: escenario===e ? 700 : 400, textTransform:'capitalize',
            }}>{e}</div>
          ))}
        </div>
      </div>

      {/* ── RESUMEN ── */}
      {tab === 'resumen' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Alertas rápidas */}
          {alertas.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...alertasRojos, ...alertasAmarillos, ...alertasVerdes].slice(0,3).map((a,i) => (
                <div key={i} style={{ padding:'12px 16px', background:bgUrgencia(a.urgencia), border:`1px solid ${borderUrgencia(a.urgencia)}`, borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:18 }}>{emojiUrgencia(a.urgencia)}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:colorUrgencia(a.urgencia), marginBottom:2 }}>{a.titulo}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{a.desc}</div>
                  </div>
                  <div style={{ fontSize:10, padding:'3px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'var(--text3)', flexShrink:0 }}>{a.negocio}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid-2" style={{ gap:14 }}>
            {/* Inversión por negocio */}
            <div className="panel">
              <div className="panel-title">Inversión y recuperación por negocio</div>
              {negocios.filter(n => n.inversion > 0).map(n => {
                const roi = n.inversion > 0 ? (n.recuperado/n.inversion)*100 : 0
                return (
                  <div key={n.id} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:16 }}>{n.emoji}</span>
                        <span style={{ color:'var(--text2)', fontWeight:600 }}>{n.nombre}</span>
                      </div>
                      <div style={{ display:'flex', gap:12 }}>
                        <span style={{ color:'var(--text3)' }}>{cop(n.recuperado)} / {cop(n.inversion)}</span>
                        <span style={{ color: roi>=50 ? 'var(--green)' : roi>=25 ? 'var(--gold)' : 'var(--red)', fontWeight:700 }}>{roi.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="prog-wrap" style={{ height:6 }}>
                      <div className="prog-fill" style={{ width:`${Math.min(roi,100)}%`, background:n.color, height:6 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Proyección anual */}
            <div className="panel">
              <div className="panel-title">Proyección anual — escenario {escenario}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                {flujo.map((f, i) => {
                  const util = f - GASTOS_BASE[i]
                  const pct  = (f / maxFlujo) * 100
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ fontSize:11, color:'var(--text3)', minWidth:28 }}>{MESES[i]}</div>
                      <div style={{ flex:1, background:'rgba(255,255,255,0.06)', borderRadius:3, height:16, overflow:'hidden', position:'relative' }}>
                        <div style={{ height:16, borderRadius:3, width:`${pct}%`, background: util>0 ? '#C9A84C33' : 'rgba(224,82,82,0.3)', transition:'width .3s' }} />
                        <div style={{ position:'absolute', left:8, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:10, color:'var(--text2)', fontWeight:600 }}>{cop(f)}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color: util>0 ? 'var(--green)' : 'var(--red)', minWidth:60, textAlign:'right' }}>{cop(util)}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Utilidad anual proyectada</span>
                <span style={{ fontSize:16, fontWeight:800, color: utilidadAnual>0 ? 'var(--green)' : 'var(--red)' }}>{cop(utilidadAnual)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTAS ── */}
      {tab === 'alertas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { lista:alertasRojos,    titulo:'⚠️ Riesgos — Acción inmediata',     color:'var(--red)'   },
            { lista:alertasAmarillos,titulo:'💡 Oportunidades de inversión',      color:'var(--gold)'  },
            { lista:alertasVerdes,   titulo:'🚀 Señales de expansión',            color:'var(--green)' },
          ].map(grupo => grupo.lista.length > 0 && (
            <div key={grupo.titulo}>
              <div style={{ fontSize:13, fontWeight:700, color:grupo.color, marginBottom:10 }}>{grupo.titulo}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {grupo.lista.map((a, i) => (
                  <div key={i} style={{ padding:'16px 18px', background:bgUrgencia(a.urgencia), border:`1px solid ${borderUrgencia(a.urgencia)}`, borderRadius:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:colorUrgencia(a.urgencia) }}>{a.titulo}</div>
                      <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'var(--text3)' }}>{a.negocio}</div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:12 }}>{a.desc}</div>
                    <button style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', background:bgUrgencia(a.urgencia), border:`1px solid ${borderUrgencia(a.urgencia)}`, color:colorUrgencia(a.urgencia) }}>
                      {a.accion} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {alertas.length === 0 && (
            <div className="panel" style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--green)' }}>Sin alertas activas</div>
              <div style={{ fontSize:13, color:'var(--text4)', marginTop:6 }}>El grupo está en buen estado financiero</div>
            </div>
          )}
        </div>
      )}

      {/* ── FLUJO DE CAJA ── */}
      {tab === 'flujo' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="panel">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="panel-title" style={{ marginBottom:0 }}>Flujo de caja — 12 meses · escenario {escenario}</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
              {['Mes','Ingresos','Gastos','Utilidad','Acumulado'].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 10px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {(() => {
              let acum = 0
              return flujo.map((f, i) => {
                const gastos = GASTOS_BASE[i]
                const util   = f - gastos
                acum += util
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', background: util<0 ? 'rgba(224,82,82,0.04)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize:12, padding:'9px 10px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{MESES[i]}</div>
                    <div style={{ fontSize:12, padding:'9px 10px', color:'var(--green)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(f)}</div>
                    <div style={{ fontSize:12, padding:'9px 10px', color:'var(--red)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(gastos)}</div>
                    <div style={{ fontSize:12, padding:'9px 10px', color: util>0 ? 'var(--gold)' : 'var(--red)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(util)}</div>
                    <div style={{ fontSize:12, padding:'9px 10px', color: acum>0 ? 'var(--green)' : 'var(--red)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(acum)}</div>
                  </div>
                )
              })
            })()}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
              <div style={{ fontSize:13, padding:'10px', color:'var(--text)', fontWeight:800 }}>TOTAL AÑO</div>
              <div style={{ fontSize:13, padding:'10px', color:'var(--green)', fontWeight:800 }}>{cop(flujo.reduce((s,f)=>s+f,0))}</div>
              <div style={{ fontSize:13, padding:'10px', color:'var(--red)', fontWeight:800 }}>{cop(GASTOS_BASE.reduce((s,g)=>s+g,0))}</div>
              <div style={{ fontSize:14, padding:'10px', color: utilidadAnual>0 ? 'var(--gold)' : 'var(--red)', fontWeight:900 }}>{cop(utilidadAnual)}</div>
              <div style={{ fontSize:13, padding:'10px', color:'var(--text3)' }}>—</div>
            </div>
          </div>
        </div>
      )}

      {/* ── POR NEGOCIO ── */}
      {tab === 'negocios' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {negocios.map(n => {
            const roi = n.inversion > 0 ? (n.recuperado/n.inversion)*100 : 0
            const pendiente = n.estado !== 'activo'
            const mesesRecupero = n.utilidadMes > 0 ? Math.ceil((n.inversion-n.recuperado)/n.utilidadMes) : null
            return (
              <div key={n.id} style={{ background:'var(--bg3)', borderRadius:14, border:`1px solid ${n.estado==='activo' ? n.color+'33' : 'var(--border)'}`, padding:'18px 20px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:n.color+'15', border:`1px solid ${n.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{n.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{n.nombre}</div>
                      <span style={{ fontSize:10, padding:'2px 10px', borderRadius:20, fontWeight:700,
                        background: n.estado==='activo' ? 'var(--green-dim)' : n.estado==='dev' ? 'var(--gold-dim)' : 'var(--bg4)',
                        color: n.estado==='activo' ? 'var(--green)' : n.estado==='dev' ? 'var(--gold)' : 'var(--text4)',
                        border:`0.5px solid ${n.estado==='activo' ? 'var(--green-border)' : n.estado==='dev' ? 'var(--gold-border)' : 'var(--border)'}`,
                      }}>{n.fase}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{n.descripcion}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    {n.estado === 'activo' ? (
                      <>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Ingresos mes</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--gold)' }}>{cop(n.ingresosMes)}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Inversión requerida</div>
                        <div style={{ fontSize:18, fontWeight:800, color:n.color }}>{cop(n.costoExpansion)}</div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[
                    { label:'Invertido',     val:cop(n.inversion),          color:'var(--text2)'  },
                    { label:'Recuperado',    val:cop(n.recuperado),         color:'var(--green)'  },
                    { label:'ROI actual',    val: n.inversion>0 ? roi.toFixed(1)+'%' : '—', color: roi>=50 ? 'var(--green)' : roi>=25 ? 'var(--gold)' : 'var(--red)' },
                    { label: pendiente ? 'Costo inicio' : 'Meses para recuperar', val: pendiente ? cop(n.costoExpansion) : mesesRecupero ? mesesRecupero+' meses' : '—', color:'var(--text2)' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--bg4)', borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {n.inversion > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4 }}>Recuperación: {roi.toFixed(1)}%</div>
                    <div className="prog-wrap" style={{ height:6 }}>
                      <div className="prog-fill" style={{ width:`${Math.min(roi,100)}%`, background:n.color, height:6 }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── CRONOGRAMA ── */}
      {tab === 'cronograma' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="panel">
            <div className="panel-title">Cronograma de activación — LRM Trade</div>
            <div style={{ position:'relative', paddingLeft:24 }}>
              <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:'var(--border)' }} />
              {[
                { mes:'Jun 2026', evento:'ZABÚ Carrito 01 operando', estado:'hecho',    negocio:'ZABÚ',       color:'#C9A84C', desc:'Primer carrito activo. Validando producto y demanda.' },
                { mes:'Ago 2026', evento:'ZABÚ Carrito 02',          estado:'proximo',  negocio:'ZABÚ',       color:'#C9A84C', desc:'Si se mantiene meta de 36 perros/día por 8 semanas.' },
                { mes:'Sep 2026', evento:'Las Bombas — arranque',    estado:'planeado', negocio:'Las Bombas', color:'#4caf50', desc:'Con caja libre acumulada de ZABÚ + inversión adicional.' },
                { mes:'Oct 2026', evento:'ZABÚ Carrito 03',          estado:'planeado', negocio:'ZABÚ',       color:'#C9A84C', desc:'Tercer carrito para completar la red inicial.' },
                { mes:'Nov 2026', evento:'RV Sports — lanzamiento',  estado:'planeado', negocio:'RV Sports',  color:'#378ADD', desc:'Preventa de calcetines + validación de mercado.' },
                { mes:'Ene 2027', evento:'Coco Shake — arranque',    estado:'futuro',   negocio:'Coco Shake', color:'#00BCD4', desc:'Pendiente de definir formato y ubicación.' },
                { mes:'Mar 2027', evento:'Quesolote — arranque',     estado:'futuro',   negocio:'Quesolote',  color:'#FF9800', desc:'Concepto definido. Pendiente inversión.' },
                { mes:'Jun 2027', evento:'Puffys — arranque',        estado:'futuro',   negocio:'Puffys',     color:'#9C27B0', desc:'Pendiente de definir.' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:16, marginBottom:20, paddingLeft:16, position:'relative' }}>
                  <div style={{ position:'absolute', left:-8, top:4, width:14, height:14, borderRadius:'50%', border:`2px solid ${item.color}`, background: item.estado==='hecho' ? item.color : 'var(--bg)', flexShrink:0 }} />
                  <div style={{ flex:1, background:'var(--bg3)', borderRadius:12, padding:'14px 16px', border:`1px solid ${item.estado==='hecho' ? item.color+'33' : 'var(--border)'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:11, color:item.color, fontWeight:700, marginBottom:3 }}>{item.mes}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{item.evento}</div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:600,
                          background: item.estado==='hecho' ? 'var(--green-dim)' : item.estado==='proximo' ? 'var(--gold-dim)' : item.estado==='planeado' ? 'rgba(55,138,221,0.1)' : 'var(--bg4)',
                          color: item.estado==='hecho' ? 'var(--green)' : item.estado==='proximo' ? 'var(--gold)' : item.estado==='planeado' ? 'var(--blue)' : 'var(--text4)',
                          border:`0.5px solid ${item.estado==='hecho' ? 'var(--green-border)' : item.estado==='proximo' ? 'var(--gold-border)' : item.estado==='planeado' ? 'rgba(55,138,221,0.3)' : 'var(--border)'}`,
                        }}>
                          {item.estado==='hecho' ? '✓ Activo' : item.estado==='proximo' ? 'Próximo' : item.estado==='planeado' ? 'Planeado' : 'Futuro'}
                        </span>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:item.color+'15', color:item.color, border:`0.5px solid ${item.color}33` }}>{item.negocio}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}