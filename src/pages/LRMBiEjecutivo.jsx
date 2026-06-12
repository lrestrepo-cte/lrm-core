import { useState } from 'react'

function cop(n) {
  const abs = Math.abs(Math.round(n))
  const fmt = abs >= 1000000 ? '$'+(abs/1000000).toFixed(1).replace('.0','')+'M'
            : abs >= 1000    ? '$'+(abs/1000).toFixed(0)+'K'
            : '$'+abs.toLocaleString('es-CO')
  return n < 0 ? '-'+fmt : fmt
}

function pct(v, t) { return t > 0 ? ((v/t)*100).toFixed(1)+'%' : '0%' }

// ─── DATA ────────────────────────────────────────────────────────────────────

const VENTAS_ZABU = [
  { semana:'S1 Jun', zabuSolo:18, zabuCombo:24, cheezSolo:6, cheezCombo:12, total:60 },
  { semana:'S2 Jun', zabuSolo:22, zabuCombo:28, cheezSolo:9, cheezCombo:15, total:74 },
  { semana:'S3 Jun', zabuSolo:25, zabuCombo:32, cheezSolo:11, cheezCombo:18, total:86 },
]

const PRODUCTOS_ZABU = [
  { id:'zabu_combo',  nombre:'ZABÚ Combo',       precio:20000, uds:84,  color:'#C9A84C', emoji:'🌭🥤' },
  { id:'cheez_combo', nombre:'CheeZabú Combo',   precio:22000, uds:45,  color:'#FF9800', emoji:'🧀🥤' },
  { id:'zabu_solo',   nombre:'ZABÚ Solo',        precio:17000, uds:65,  color:'#C9A84CB3', emoji:'🌭'  },
  { id:'cheez_solo',  nombre:'CheeZabú Solo',    precio:19000, uds:26,  color:'#FF9800B3', emoji:'🧀'  },
]

const SALCHICHAS_ZABU = [
  { nombre:'Pavo',       uds:112, color:'#C9A84C' },
  { nombre:'Hot Dog',    uds:68,  color:'#4caf50'  },
  { nombre:'Alemana',    uds:24,  color:'#378ADD'  },
  { nombre:'Parisienne', uds:16,  color:'#9C27B0'  },
]

const METODO_PAGO = [
  { nombre:'Efectivo',        uds:142, color:'#4caf50'  },
  { nombre:'Transferencia QR',uds:78,  color:'#378ADD'  },
]

const TIPO_ENTREGA = [
  { nombre:'Comer aquí', uds:98,  color:'#4caf50'  },
  { nombre:'Para llevar',uds:86,  color:'#C9A84C'  },
  { nombre:'Domicilio',  uds:36,  color:'#378ADD'  },
]

const EXTRAS_VENDIDOS = [
  { nombre:'Queso extra',    uds:45, precio:3000, color:'#FF9800' },
  { nombre:'Tocineta extra', uds:38, precio:3000, color:'#e05252' },
  { nombre:'Piña extra',     uds:22, precio:2000, color:'#C9A84C' },
]

const DIAS_SEMANA = [
  { dia:'Mar', uds:25, ventas:462500 },
  { dia:'Mié', uds:28, ventas:518000 },
  { dia:'Jue', uds:42, ventas:777000 },
  { dia:'Vie', uds:45, ventas:832500 },
  { dia:'Sáb', uds:68, ventas:1258000 },
  { dia:'Dom', uds:72, ventas:1332000 },
]

const NEGOCIOS_KPI = [
  { nombre:'ZABÚ',       emoji:'🌭', estado:'activo',  ingresos:2736000, meta:3500000, margen:49.2, color:'#C9A84C' },
  { nombre:'Las Bombas', emoji:'💣', estado:'dev',     ingresos:0,       meta:2000000, margen:0,    color:'#4caf50' },
  { nombre:'RV Sports',  emoji:'⚽', estado:'dev',     ingresos:0,       meta:3000000, margen:0,    color:'#378ADD' },
  { nombre:'Coco Shake', emoji:'🥥', estado:'pronto',  ingresos:0,       meta:2500000, margen:0,    color:'#00BCD4' },
  { nombre:'Quesolote',  emoji:'🌽', estado:'pronto',  ingresos:0,       meta:2000000, margen:0,    color:'#FF9800' },
  { nombre:'Puffys',     emoji:'🥞', estado:'pronto',  ingresos:0,       meta:2000000, margen:0,    color:'#9C27B0' },
]

const totalUds      = PRODUCTOS_ZABU.reduce((s,p) => s+p.uds, 0)
const totalVentas   = PRODUCTOS_ZABU.reduce((s,p) => s+(p.uds*p.precio), 0)
const totalSal      = SALCHICHAS_ZABU.reduce((s,p) => s+p.uds, 0)
const totalPago     = METODO_PAGO.reduce((s,p) => s+p.uds, 0)
const totalEntrega  = TIPO_ENTREGA.reduce((s,p) => s+p.uds, 0)
const maxDia        = Math.max(...DIAS_SEMANA.map(d => d.uds))

export default function LRMBiEjecutivo() {
  const [tab, setTab]       = useState('zabu')
  const [periodo, setPeriodo] = useState('semana')

  return (
    <>
      {/* KPIs grupo */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ingresos grupo',    val:cop(2736000),  color:'var(--gold)',  sub:'1 negocio activo'         },
          { label:'Perros vendidos',   val:String(totalUds), color:'var(--text)', sub:'ZABÚ · todas las semanas' },
          { label:'Ticket promedio',   val:cop(Math.round(totalVentas/totalUds)), color:'var(--green)', sub:'mix real de ventas' },
          { label:'Negocios activos',  val:'1 / 6',       color:'var(--text)',  sub:'5 en desarrollo'          },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs negocios */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div className="sub-nav" style={{ marginBottom:0 }}>
          {[
            { id:'zabu',   label:'🌭 ZABÚ'       },
            { id:'grupo',  label:'Grupo LRM'      },
          ].map(t => (
            <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['semana','mes','total'].map(p => (
            <div key={p} onClick={() => setPeriodo(p)} style={{
              padding:'5px 12px', borderRadius:8, fontSize:11, cursor:'pointer',
              background: periodo===p ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
              border:`0.5px solid ${periodo===p ? 'var(--gold-border)' : 'var(--border)'}`,
              color: periodo===p ? 'var(--gold)' : 'var(--text3)',
              fontWeight: periodo===p ? 700 : 400, textTransform:'capitalize',
            }}>{p === 'semana' ? 'Esta semana' : p === 'mes' ? 'Este mes' : 'Total'}</div>
          ))}
        </div>
      </div>

      {/* ── ZABÚ BI ── */}
      {tab === 'zabu' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Productos más vendidos */}
          <div className="grid-2" style={{ gap:14 }}>
            <div className="panel">
              <div className="panel-title">Productos más vendidos — ZABÚ</div>
              {PRODUCTOS_ZABU.sort((a,b) => b.uds-a.uds).map((p, i) => (
                <div key={p.id} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:p.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{p.emoji}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{p.nombre}</div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>{cop(p.precio)} · {p.uds} uds vendidas</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:p.color }}>{pct(p.uds, totalUds)}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{cop(p.uds*p.precio)}</div>
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height:6 }}>
                    <div className="prog-fill" style={{ width:pct(p.uds,totalUds), background:p.color, height:6 }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Total vendido</span>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{cop(totalVentas)}</span>
              </div>
            </div>

            {/* Rendimiento por día */}
            <div className="panel">
              <div className="panel-title">Rendimiento por día de la semana</div>
              {DIAS_SEMANA.map(d => {
                const pctDia = (d.uds / maxDia) * 100
                const esFuerte = d.dia === 'Sáb' || d.dia === 'Dom'
                const esNormal = d.dia === 'Jue' || d.dia === 'Vie'
                const color = esFuerte ? 'var(--green)' : esNormal ? 'var(--gold)' : 'var(--red)'
                return (
                  <div key={d.dia} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ color:'var(--text2)', fontWeight:600, minWidth:28 }}>{d.dia}</span>
                        <span style={{ fontSize:10, padding:'1px 8px', borderRadius:6,
                          background: esFuerte ? 'var(--green-dim)' : esNormal ? 'var(--gold-dim)' : 'var(--red-dim)',
                          color, border:`0.5px solid ${esFuerte ? 'var(--green-border)' : esNormal ? 'var(--gold-border)' : 'rgba(224,82,82,0.3)'}`,
                        }}>{esFuerte ? 'Fuerte' : esNormal ? 'Normal' : 'Bajo'}</span>
                      </div>
                      <div style={{ display:'flex', gap:12 }}>
                        <span style={{ color:'var(--text3)' }}>{d.uds} perros</span>
                        <span style={{ color, fontWeight:700 }}>{cop(d.ventas)}</span>
                      </div>
                    </div>
                    <div className="prog-wrap" style={{ height:8 }}>
                      <div className="prog-fill" style={{ width:`${pctDia}%`, background:color, height:8 }} />
                    </div>
                  </div>
                )
              })}
              <div className="divider" />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'var(--text3)' }}>Los fines de semana generan</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>
                  {pct(DIAS_SEMANA.filter(d=>d.dia==='Sáb'||d.dia==='Dom').reduce((s,d)=>s+d.ventas,0), DIAS_SEMANA.reduce((s,d)=>s+d.ventas,0))} de los ingresos
                </span>
              </div>
            </div>
          </div>

          {/* Segunda fila */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>

            {/* Salchichas */}
            <div className="panel">
              <div className="panel-title">Salchicha más pedida</div>
              {SALCHICHAS_ZABU.sort((a,b) => b.uds-a.uds).map(s => (
                <div key={s.nombre} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'var(--text2)', fontWeight:500 }}>{s.nombre}</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ color:'var(--text3)' }}>{s.uds} uds</span>
                      <span style={{ color:s.color, fontWeight:700 }}>{pct(s.uds,totalSal)}</span>
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height:5 }}>
                    <div className="prog-fill" style={{ width:pct(s.uds,totalSal), background:s.color, height:5 }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Pavo domina con <span style={{ color:'var(--gold)', fontWeight:700 }}>{pct(SALCHICHAS_ZABU[0].uds,totalSal)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="panel">
              <div className="panel-title">Método de pago</div>
              {METODO_PAGO.map(m => (
                <div key={m.nombre} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                    <span style={{ color:'var(--text2)', fontWeight:500 }}>{m.nombre}</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ color:'var(--text3)' }}>{m.uds} uds</span>
                      <span style={{ color:m.color, fontWeight:700 }}>{pct(m.uds,totalPago)}</span>
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height:8 }}>
                    <div className="prog-fill" style={{ width:pct(m.uds,totalPago), background:m.color, height:8 }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Efectivo lidera con <span style={{ color:'var(--green)', fontWeight:700 }}>{pct(METODO_PAGO[0].uds,totalPago)}</span>
              </div>
            </div>

            {/* Tipo entrega */}
            <div className="panel">
              <div className="panel-title">Tipo de entrega</div>
              {TIPO_ENTREGA.map(t => (
                <div key={t.nombre} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'var(--text2)', fontWeight:500 }}>{t.nombre}</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ color:'var(--text3)' }}>{t.uds} uds</span>
                      <span style={{ color:t.color, fontWeight:700 }}>{pct(t.uds,totalEntrega)}</span>
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height:5 }}>
                    <div className="prog-fill" style={{ width:pct(t.uds,totalEntrega), background:t.color, height:5 }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Comer aquí + llevar = <span style={{ color:'var(--gold)', fontWeight:700 }}>{pct(TIPO_ENTREGA[0].uds+TIPO_ENTREGA[1].uds,totalEntrega)}</span>
              </div>
            </div>
          </div>

          {/* Extras y tendencia */}
          <div className="grid-2" style={{ gap:14 }}>
            <div className="panel">
              <div className="panel-title">Extras más vendidos</div>
              {EXTRAS_VENDIDOS.map(e => (
                <div key={e.nombre} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:e.color }} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{e.uds} uds · {cop(e.precio)} c/u</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:e.color }}>{cop(e.uds*e.precio)}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>ingreso adicional</div>
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>Total extras</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(EXTRAS_VENDIDOS.reduce((s,e)=>s+e.uds*e.precio,0))}</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Tendencia semanal — perros vendidos</div>
              {VENTAS_ZABU.map((s, i) => {
                const max = Math.max(...VENTAS_ZABU.map(v=>v.total))
                return (
                  <div key={s.semana} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                      <span style={{ color:'var(--text2)', fontWeight:600 }}>{s.semana}</span>
                      <div style={{ display:'flex', gap:12 }}>
                        <span style={{ color:'var(--text3)' }}>{s.total} perros</span>
                        {i > 0 && (
                          <span style={{ color:'var(--green)', fontWeight:700 }}>
                            ↑ +{s.total - VENTAS_ZABU[i-1].total}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:2, height:20 }}>
                      {[
                        { val:s.zabuSolo,  color:'#C9A84C' },
                        { val:s.zabuCombo, color:'#C9A84CBB' },
                        { val:s.cheezSolo, color:'#FF9800' },
                        { val:s.cheezCombo,color:'#FF9800BB' },
                      ].map((b, j) => (
                        <div key={j} style={{ flex:b.val, background:b.color, borderRadius:3, opacity:0.85 }} title={b.val} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                {[
                  { label:'ZABÚ Solo',      color:'#C9A84C'   },
                  { label:'ZABÚ Combo',     color:'#C9A84CBB' },
                  { label:'CheeZabú Solo',  color:'#FF9800'   },
                  { label:'CheeZabú Combo', color:'#FF9800BB' },
                ].map(l => (
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GRUPO LRM ── */}
      {tab === 'grupo' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="panel">
            <div className="panel-title">Rendimiento por negocio — LRM Trade</div>
            {NEGOCIOS_KPI.map(n => {
              const pctMeta = n.meta > 0 ? (n.ingresos/n.meta)*100 : 0
              return (
                <div key={n.nombre} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{n.emoji}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{n.nombre}</div>
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>
                          Meta: {cop(n.meta)}/mes
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:15, fontWeight:800, color: n.ingresos>0 ? n.color : 'var(--text4)' }}>
                        {n.ingresos > 0 ? cop(n.ingresos) : n.estado==='dev' ? 'En desarrollo' : 'Próximamente'}
                      </div>
                      {n.ingresos > 0 && (
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>
                          {pctMeta.toFixed(0)}% de la meta · Margen {n.margen}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height:6 }}>
                    <div className="prog-fill" style={{ width:`${Math.min(pctMeta,100)}%`, background:n.color, height:6 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid-2" style={{ gap:14 }}>
            <div className="panel">
              <div className="panel-title">Ingresos consolidados del grupo</div>
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Total ingresos este mes</div>
                <div style={{ fontSize:40, fontWeight:900, color:'var(--gold)', letterSpacing:-1 }}>{cop(2736000)}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>100% generado por ZABÚ</div>
              </div>
              <div className="divider" />
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.8 }}>
                Cuando Las Bombas y RV Sports arranquen, este panel consolidará todos los ingresos automáticamente.
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Próximos negocios a activar</div>
              {NEGOCIOS_KPI.filter(n => n.estado !== 'activo').map(n => (
                <div key={n.nombre} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:20 }}>{n.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{n.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Meta: {cop(n.meta)}/mes</div>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:600,
                    background: n.estado==='dev' ? 'var(--gold-dim)' : 'var(--bg4)',
                    color: n.estado==='dev' ? 'var(--gold)' : 'var(--text4)',
                    border:`0.5px solid ${n.estado==='dev' ? 'var(--gold-border)' : 'var(--border)'}`,
                  }}>{n.estado==='dev' ? 'En desarrollo' : 'Próximamente'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}