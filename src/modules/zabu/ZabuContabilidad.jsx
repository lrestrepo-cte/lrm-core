import { useState } from 'react'

function cop(n) {
  const abs = Math.abs(Math.round(n))
  const fmt = '$' + abs.toLocaleString('es-CO')
  return n < 0 ? '-' + fmt : fmt
}

// ─── PLAN DE CUENTAS ────────────────────────────────────────────────────────
const PLAN_CUENTAS = [
  // ACTIVOS
  { codigo:'1105', nombre:'Caja y efectivo',          tipo:'activo',     naturaleza:'debito',  grupo:'Activo corriente'    },
  { codigo:'1110', nombre:'Bancos / Nequi / Daviplata',tipo:'activo',     naturaleza:'debito',  grupo:'Activo corriente'    },
  { codigo:'1305', nombre:'Inventario ingredientes',  tipo:'activo',     naturaleza:'debito',  grupo:'Activo corriente'    },
  { codigo:'1310', nombre:'Inventario empaque',       tipo:'activo',     naturaleza:'debito',  grupo:'Activo corriente'    },
  { codigo:'1524', nombre:'Equipos y utensilios',     tipo:'activo',     naturaleza:'debito',  grupo:'Activo no corriente' },
  { codigo:'1592', nombre:'Carrito / Punto de venta', tipo:'activo',     naturaleza:'debito',  grupo:'Activo no corriente' },
  // PASIVOS
  { codigo:'2205', nombre:'Proveedores por pagar',    tipo:'pasivo',     naturaleza:'credito', grupo:'Pasivo corriente'    },
  { codigo:'2335', nombre:'Nómina por pagar',         tipo:'pasivo',     naturaleza:'credito', grupo:'Pasivo corriente'    },
  { codigo:'2505', nombre:'Préstamos',                tipo:'pasivo',     naturaleza:'credito', grupo:'Pasivo no corriente' },
  // PATRIMONIO
  { codigo:'3105', nombre:'Capital invertido',        tipo:'patrimonio', naturaleza:'credito', grupo:'Patrimonio'          },
  { codigo:'3605', nombre:'Utilidad del ejercicio',   tipo:'patrimonio', naturaleza:'credito', grupo:'Patrimonio'          },
  // INGRESOS
  { codigo:'4135', nombre:'Ventas efectivo',          tipo:'ingreso',    naturaleza:'credito', grupo:'Ingresos operacionales' },
  { codigo:'4136', nombre:'Ventas QR / transferencia',tipo:'ingreso',    naturaleza:'credito', grupo:'Ingresos operacionales' },
  { codigo:'4137', nombre:'Ventas domicilio',         tipo:'ingreso',    naturaleza:'credito', grupo:'Ingresos operacionales' },
  // COSTOS
  { codigo:'6135', nombre:'Costo ingredientes',       tipo:'costo',      naturaleza:'debito',  grupo:'Costos de venta'     },
  { codigo:'6136', nombre:'Costo empaque',            tipo:'costo',      naturaleza:'debito',  grupo:'Costos de venta'     },
  // GASTOS
  { codigo:'5105', nombre:'Salarios personal',        tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
  { codigo:'5205', nombre:'Gas y combustible',        tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
  { codigo:'5210', nombre:'Transporte',               tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
  { codigo:'5305', nombre:'Mantenimiento equipos',    tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
  { codigo:'5505', nombre:'Marketing y publicidad',   tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
  { codigo:'5905', nombre:'Gastos varios',            tipo:'gasto',      naturaleza:'debito',  grupo:'Gastos operacionales'},
]

// ─── ASIENTOS INICIALES ──────────────────────────────────────────────────────
const ASIENTOS_INIT = [
  {
    id:1, fecha:'2026-06-08', descripcion:'Capital inicial invertido',
    partidas:[
      { codigo:'1592', nombre:'Carrito / Punto de venta', debe:1500000, haber:0 },
      { codigo:'1524', nombre:'Equipos y utensilios',     debe:800000,  haber:0 },
      { codigo:'1105', nombre:'Caja y efectivo',          debe:1200000, haber:0 },
      { codigo:'3105', nombre:'Capital invertido',        debe:0, haber:3500000  },
    ]
  },
  {
    id:2, fecha:'2026-06-08', descripcion:'Compra ingredientes iniciales',
    partidas:[
      { codigo:'1305', nombre:'Inventario ingredientes',  debe:288800, haber:0  },
      { codigo:'1105', nombre:'Caja y efectivo',          debe:0, haber:288800  },
    ]
  },
  {
    id:3, fecha:'2026-06-08', descripcion:'Compra empaque inicial',
    partidas:[
      { codigo:'1310', nombre:'Inventario empaque',       debe:85000, haber:0   },
      { codigo:'1105', nombre:'Caja y efectivo',          debe:0, haber:85000   },
    ]
  },
  {
    id:4, fecha:'2026-06-09', descripcion:'Ventas del día - efectivo',
    partidas:[
      { codigo:'1105', nombre:'Caja y efectivo',          debe:420000, haber:0  },
      { codigo:'4135', nombre:'Ventas efectivo',          debe:0, haber:420000  },
    ]
  },
  {
    id:5, fecha:'2026-06-09', descripcion:'Costo de ventas del día',
    partidas:[
      { codigo:'6135', nombre:'Costo ingredientes',       debe:180600, haber:0  },
      { codigo:'6136', nombre:'Costo empaque',            debe:36120,  haber:0  },
      { codigo:'1305', nombre:'Inventario ingredientes',  debe:0, haber:180600  },
      { codigo:'1310', nombre:'Inventario empaque',       debe:0, haber:36120   },
    ]
  },
  {
    id:6, fecha:'2026-06-09', descripcion:'Pago nómina semanal',
    partidas:[
      { codigo:'5105', nombre:'Salarios personal',        debe:840000, haber:0  },
      { codigo:'1105', nombre:'Caja y efectivo',          debe:0, haber:840000  },
    ]
  },
  {
    id:7, fecha:'2026-06-10', descripcion:'Ventas del día - efectivo',
    partidas:[
      { codigo:'1105', nombre:'Caja y efectivo',          debe:285000, haber:0  },
      { codigo:'4135', nombre:'Ventas efectivo',          debe:0, haber:285000  },
    ]
  },
  {
    id:8, fecha:'2026-06-10', descripcion:'Ventas del día - QR',
    partidas:[
      { codigo:'1110', nombre:'Bancos / Nequi / Daviplata',debe:114000, haber:0 },
      { codigo:'4136', nombre:'Ventas QR / transferencia', debe:0, haber:114000 },
    ]
  },
  {
    id:9, fecha:'2026-06-10', descripcion:'Gastos operativos - gas y transporte',
    partidas:[
      { codigo:'5205', nombre:'Gas y combustible',        debe:50000, haber:0   },
      { codigo:'5210', nombre:'Transporte',               debe:35000, haber:0   },
      { codigo:'1105', nombre:'Caja y efectivo',          debe:0, haber:85000   },
    ]
  },
]

const TIPO_COLORS = {
  activo:    { color:'#378ADD', bg:'rgba(55,138,221,0.1)',  border:'rgba(55,138,221,0.3)'  },
  pasivo:    { color:'#e05252', bg:'rgba(224,82,82,0.1)',   border:'rgba(224,82,82,0.3)'   },
  patrimonio:{ color:'#9C27B0', bg:'rgba(156,39,176,0.1)', border:'rgba(156,39,176,0.3)'  },
  ingreso:   { color:'#4caf50', bg:'rgba(76,175,80,0.1)',   border:'rgba(76,175,80,0.3)'   },
  costo:     { color:'#FF9800', bg:'rgba(255,152,0,0.1)',   border:'rgba(255,152,0,0.3)'   },
  gasto:     { color:'#C9A84C', bg:'rgba(201,168,76,0.1)', border:'rgba(201,168,76,0.3)'  },
}

export default function ZabuContabilidad() {
  const [asientos, setAsientos] = useState(ASIENTOS_INIT)
  const [tab, setTab]           = useState('diario')
  const [modalAdd, setModalAdd] = useState(false)
  const [cuentaSel, setCuentaSel] = useState(null)

  // Nuevo asiento
  const [nFecha,   setNFecha]   = useState(new Date().toISOString().split('T')[0])
  const [nDesc,    setNDesc]    = useState('')
  const [nPartidas, setNPartidas] = useState([
    { codigo:'', nombre:'', debe:0, haber:0 },
    { codigo:'', nombre:'', debe:0, haber:0 },
  ])

  // ─── CÁLCULOS ──────────────────────────────────────────────────────────────

  const saldoPorCuenta = () => {
    const saldos = {}
    PLAN_CUENTAS.forEach(c => { saldos[c.codigo] = { ...c, debe:0, haber:0, saldo:0 } })
    asientos.forEach(a => {
      a.partidas.forEach(p => {
        if (saldos[p.codigo]) {
          saldos[p.codigo].debe  += p.debe
          saldos[p.codigo].haber += p.haber
        }
      })
    })
    Object.keys(saldos).forEach(k => {
      const c = saldos[k]
      saldos[k].saldo = c.naturaleza === 'debito' ? c.debe - c.haber : c.haber - c.debe
    })
    return saldos
  }

  const saldos = saldoPorCuenta()

  const totalDebe  = Object.values(saldos).reduce((s,c) => s+c.debe, 0)
  const totalHaber = Object.values(saldos).reduce((s,c) => s+c.haber, 0)
  const cuadra     = Math.abs(totalDebe - totalHaber) < 1

  const totalIngresos = Object.values(saldos).filter(c=>c.tipo==='ingreso').reduce((s,c)=>s+c.saldo,0)
  const totalCostos   = Object.values(saldos).filter(c=>c.tipo==='costo').reduce((s,c)=>s+c.saldo,0)
  const totalGastos   = Object.values(saldos).filter(c=>c.tipo==='gasto').reduce((s,c)=>s+c.saldo,0)
  const utilidadBruta = totalIngresos - totalCostos
  const utilidadNeta  = utilidadBruta - totalGastos

  const totalActivos    = Object.values(saldos).filter(c=>c.tipo==='activo').reduce((s,c)=>s+c.saldo,0)
  const totalPasivos    = Object.values(saldos).filter(c=>c.tipo==='pasivo').reduce((s,c)=>s+c.saldo,0)
  const totalPatrimonio = Object.values(saldos).filter(c=>c.tipo==='patrimonio').reduce((s,c)=>s+c.saldo,0) + utilidadNeta

  // ─── NUEVO ASIENTO ─────────────────────────────────────────────────────────

  const totalDebeNuevo  = nPartidas.reduce((s,p) => s+Number(p.debe||0), 0)
  const totalHaberNuevo = nPartidas.reduce((s,p) => s+Number(p.haber||0), 0)
  const cuadraNuevo     = Math.abs(totalDebeNuevo - totalHaberNuevo) < 1

  const updatePartida = (i, field, val) => {
    setNPartidas(prev => {
      const next = [...prev]
      if (field === 'codigo') {
        const cuenta = PLAN_CUENTAS.find(c => c.codigo === val)
        next[i] = { ...next[i], codigo:val, nombre: cuenta?.nombre || '' }
      } else {
        next[i] = { ...next[i], [field]: val }
      }
      return next
    })
  }

  const agregarPartida = () => setNPartidas(prev => [...prev, { codigo:'', nombre:'', debe:0, haber:0 }])

  const registrarAsiento = () => {
    if (!nDesc.trim() || !cuadraNuevo) return
    setAsientos(prev => [...prev, {
      id: Date.now(), fecha: nFecha, descripcion: nDesc,
      partidas: nPartidas.filter(p => p.codigo && (p.debe>0 || p.haber>0))
        .map(p => ({ ...p, debe:Number(p.debe), haber:Number(p.haber) }))
    }])
    setNDesc(''); setNPartidas([{ codigo:'',nombre:'',debe:0,haber:0 },{ codigo:'',nombre:'',debe:0,haber:0 }])
    setModalAdd(false)
  }

  const inputStyle = {
    padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)',
    border:'1px solid var(--border)', color:'var(--text)', fontSize:13,
    fontFamily:'inherit', outline:'none',
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total ingresos',  val:cop(totalIngresos), color:'var(--green)', sub:'ventas acumuladas'    },
          { label:'Utilidad bruta',  val:cop(utilidadBruta), color: utilidadBruta>=0 ? 'var(--green)' : 'var(--red)', sub:'ingresos - costos' },
          { label:'Utilidad neta',   val:cop(utilidadNeta),  color: utilidadNeta>=0 ? 'var(--green)' : 'var(--red)',  sub:'después de gastos' },
          { label:'Balance',         val:cuadra ? '✅ Cuadra' : '⚠️ No cuadra', color: cuadra ? 'var(--green)' : 'var(--red)', sub:'partida doble'    },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color, fontSize:k.label==='Balance'?18:24 }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div className="sub-nav" style={{ marginBottom:0 }}>
          {[
            { id:'diario',      label:'Diario'           },
            { id:'mayor',       label:'Libro mayor'      },
            { id:'balance',     label:'Balance de prueba'},
            { id:'resultados',  label:'Est. resultados'  },
            { id:'general',     label:'Balance general'  },
            { id:'plan',        label:'Plan de cuentas'  },
          ].map(t => (
            <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={() => setModalAdd(true)}>+ Asiento</button>
      </div>

      {/* ── DIARIO ── */}
      {tab === 'diario' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...asientos].reverse().map(a => {
            const td = a.partidas.reduce((s,p) => s+p.debe, 0)
            const th = a.partidas.reduce((s,p) => s+p.haber, 0)
            const ok = Math.abs(td-th) < 1
            return (
              <div key={a.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{a.descripcion}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{a.fecha} · Asiento #{a.id}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(td)}</span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background: ok ? 'var(--green-dim)' : 'var(--red-dim)', color: ok ? 'var(--green)' : 'var(--red)', border:`0.5px solid ${ok ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}` }}>
                      {ok ? '✓ Cuadra' : '⚠ Error'}
                    </span>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr', marginBottom:4 }}>
                  {['Código','Cuenta','Débito','Crédito'].map(h => (
                    <div key={h} style={{ fontSize:9, color:'var(--text4)', padding:'0 8px 4px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                {a.partidas.map((p, i) => {
                  const tc = TIPO_COLORS[PLAN_CUENTAS.find(c=>c.codigo===p.codigo)?.tipo] || TIPO_COLORS.gasto
                  return (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize:11, padding:'6px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.codigo}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', paddingLeft: p.haber>0 ? 24 : 8 }}>{p.nombre}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color: p.debe>0 ? 'var(--text2)' : 'var(--text4)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.debe>0 ? cop(p.debe) : '—'}</div>
                      <div style={{ fontSize:12, padding:'6px 8px', color: p.haber>0 ? tc.color : 'var(--text4)', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{p.haber>0 ? cop(p.haber) : '—'}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── LIBRO MAYOR ── */}
      {tab === 'mayor' && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {['activo','pasivo','patrimonio','ingreso','costo','gasto'].map(t => (
              <div key={t} onClick={() => setCuentaSel(cuentaSel===t ? null : t)} style={{
                padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                background: cuentaSel===t ? TIPO_COLORS[t].bg : 'rgba(255,255,255,0.04)',
                border:`0.5px solid ${cuentaSel===t ? TIPO_COLORS[t].border : 'var(--border)'}`,
                color: cuentaSel===t ? TIPO_COLORS[t].color : 'var(--text3)',
                fontWeight: cuentaSel===t ? 700 : 400, textTransform:'capitalize',
              }}>{t}</div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PLAN_CUENTAS
              .filter(c => !cuentaSel || c.tipo === cuentaSel)
              .filter(c => saldos[c.codigo]?.debe > 0 || saldos[c.codigo]?.haber > 0)
              .map(cuenta => {
                const s = saldos[cuenta.codigo]
                const tc = TIPO_COLORS[cuenta.tipo]
                const movs = asientos.flatMap(a => a.partidas
                  .filter(p => p.codigo === cuenta.codigo)
                  .map(p => ({ ...p, fecha:a.fecha, desc:a.descripcion, asientoId:a.id }))
                )
                let saldoAcum = 0
                return (
                  <div key={cuenta.codigo} className="panel">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ fontSize:11, padding:'3px 10px', borderRadius:8, background:tc.bg, color:tc.color, border:`0.5px solid ${tc.border}`, fontWeight:600 }}>{cuenta.codigo}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{cuenta.nombre}</div>
                        <div style={{ fontSize:11, color:'var(--text4)' }}>{cuenta.grupo}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Saldo</div>
                        <div style={{ fontSize:16, fontWeight:800, color:tc.color }}>{cop(s.saldo)}</div>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', marginBottom:4 }}>
                      {['Fecha','Descripción','Débito','Crédito','Saldo'].map(h => (
                        <div key={h} style={{ fontSize:9, color:'var(--text4)', padding:'0 8px 4px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                      ))}
                    </div>

                    {movs.map((m, i) => {
                      saldoAcum += cuenta.naturaleza === 'debito' ? m.debe - m.haber : m.haber - m.debe
                      return (
                        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <div style={{ fontSize:11, padding:'7px 8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.fecha}</div>
                          <div style={{ fontSize:12, padding:'7px 8px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.desc}</div>
                          <div style={{ fontSize:12, padding:'7px 8px', color: m.debe>0 ? 'var(--text2)' : 'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.debe>0 ? cop(m.debe) : '—'}</div>
                          <div style={{ fontSize:12, padding:'7px 8px', color: m.haber>0 ? tc.color : 'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{m.haber>0 ? cop(m.haber) : '—'}</div>
                          <div style={{ fontSize:12, padding:'7px 8px', color:tc.color, fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(saldoAcum)}</div>
                        </div>
                      )
                    })}

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:4, borderRadius:8 }}>
                      <div style={{ padding:'8px', gridColumn:'1/3' }}><span style={{ fontSize:12, color:'var(--text3)', fontWeight:700 }}>TOTALES</span></div>
                      <div style={{ fontSize:13, padding:'8px', color:'var(--text2)', fontWeight:800 }}>{cop(s.debe)}</div>
                      <div style={{ fontSize:13, padding:'8px', color:tc.color, fontWeight:800 }}>{cop(s.haber)}</div>
                      <div style={{ fontSize:14, padding:'8px', color:tc.color, fontWeight:900 }}>{cop(s.saldo)}</div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── BALANCE DE PRUEBA ── */}
      {tab === 'balance' && (
        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Balance de prueba — sumas y saldos</div>
            <div style={{ fontSize:12, padding:'5px 14px', borderRadius:20, background: cuadra ? 'var(--green-dim)' : 'var(--red-dim)', color: cuadra ? 'var(--green)' : 'var(--red)', border:`0.5px solid ${cuadra ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}`, fontWeight:700 }}>
              {cuadra ? '✅ Balance cuadrado' : '⚠️ Balance no cuadra'}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', marginBottom:8 }}>
            {['Código','Cuenta','Suma débito','Suma crédito','Saldo débito','Saldo crédito'].map(h => (
              <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 8px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
            ))}
          </div>

          {PLAN_CUENTAS.filter(c => saldos[c.codigo]?.debe > 0 || saldos[c.codigo]?.haber > 0).map((c, i) => {
            const s = saldos[c.codigo]
            const tc = TIPO_COLORS[c.tipo]
            return (
              <div key={c.codigo} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:11, padding:'8px', color:'var(--text3)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{c.codigo}</div>
                <div style={{ fontSize:12, padding:'8px', color:'var(--text2)', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:tc.color, flexShrink:0 }} />
                  {c.nombre}
                </div>
                <div style={{ fontSize:12, padding:'8px', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(s.debe)}</div>
                <div style={{ fontSize:12, padding:'8px', color:tc.color, fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>{cop(s.haber)}</div>
                <div style={{ fontSize:12, padding:'8px', color: c.naturaleza==='debito' ? 'var(--text2)' : 'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  {c.naturaleza==='debito' && s.saldo>0 ? cop(s.saldo) : '—'}
                </div>
                <div style={{ fontSize:12, padding:'8px', color: c.naturaleza==='credito' ? tc.color : 'var(--text4)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  {c.naturaleza==='credito' && s.saldo>0 ? cop(s.saldo) : '—'}
                </div>
              </div>
            )
          })}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 1fr 1fr', background:'var(--bg4)', marginTop:6, borderRadius:8 }}>
            <div style={{ padding:'10px', gridColumn:'1/3' }}><span style={{ fontSize:13, color:'var(--text)', fontWeight:800 }}>TOTALES</span></div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(totalDebe)}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--gold)', fontWeight:900 }}>{cop(totalHaber)}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--green)', fontWeight:900 }}>{cop(Object.values(saldos).filter(c=>c.naturaleza==='debito').reduce((s,c)=>s+c.saldo,0))}</div>
            <div style={{ fontSize:14, padding:'10px', color:'var(--green)', fontWeight:900 }}>{cop(Object.values(saldos).filter(c=>c.naturaleza==='credito').reduce((s,c)=>s+c.saldo,0))}</div>
          </div>
        </div>
      )}

      {/* ── ESTADO DE RESULTADOS ── */}
      {tab === 'resultados' && (
        <div style={{ maxWidth:600 }}>
          <div className="panel">
            <div style={{ textAlign:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:2, fontWeight:600, marginBottom:4 }}>ZABÚ — HOT DOGS DE VERDAD</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Estado de Resultados</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Período acumulado · {new Date().toLocaleDateString('es-CO')}</div>
            </div>

            {/* Ingresos */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--green)', letterSpacing:1, fontWeight:700, marginBottom:8 }}>INGRESOS OPERACIONALES</div>
              {PLAN_CUENTAS.filter(c => c.tipo==='ingreso' && saldos[c.codigo]?.saldo>0).map(c => (
                <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)', paddingLeft:12 }}>{c.nombre}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>{cop(saldos[c.codigo].saldo)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total ingresos</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--green)' }}>{cop(totalIngresos)}</span>
              </div>
            </div>

            {/* Costos */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#FF9800', letterSpacing:1, fontWeight:700, marginBottom:8 }}>COSTO DE VENTAS</div>
              {PLAN_CUENTAS.filter(c => c.tipo==='costo' && saldos[c.codigo]?.saldo>0).map(c => (
                <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)', paddingLeft:12 }}>{c.nombre}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'#FF9800' }}>{cop(saldos[c.codigo].saldo)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total costos</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#FF9800' }}>({cop(totalCostos)})</span>
              </div>
            </div>

            {/* Utilidad bruta */}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background: utilidadBruta>=0 ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius:10, marginBottom:16, border:`1px solid ${utilidadBruta>=0 ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}` }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>UTILIDAD BRUTA</span>
              <span style={{ fontSize:16, fontWeight:900, color: utilidadBruta>=0 ? 'var(--green)' : 'var(--red)' }}>{cop(utilidadBruta)}</span>
            </div>

            {/* Gastos */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:1, fontWeight:700, marginBottom:8 }}>GASTOS OPERACIONALES</div>
              {PLAN_CUENTAS.filter(c => c.tipo==='gasto' && saldos[c.codigo]?.saldo>0).map(c => (
                <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)', paddingLeft:12 }}>{c.nombre}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--gold)' }}>{cop(saldos[c.codigo].saldo)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total gastos</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>({cop(totalGastos)})</span>
              </div>
            </div>

            {/* Utilidad neta */}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 20px', background: utilidadNeta>=0 ? 'rgba(76,175,80,0.12)' : 'var(--red-dim)', borderRadius:12, border:`2px solid ${utilidadNeta>=0 ? 'var(--green-border)' : 'rgba(224,82,82,0.4)'}` }}>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>UTILIDAD NETA</span>
              <span style={{ fontSize:22, fontWeight:900, color: utilidadNeta>=0 ? 'var(--green)' : 'var(--red)' }}>{cop(utilidadNeta)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BALANCE GENERAL ── */}
      {tab === 'general' && (
        <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
          {/* ACTIVOS */}
          <div className="panel">
            <div style={{ textAlign:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:2, fontWeight:600, marginBottom:2 }}>ZABÚ</div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Balance General</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO')}</div>
            </div>

            <div style={{ fontSize:11, color:'var(--blue)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>ACTIVOS</div>
            {['Activo corriente','Activo no corriente'].map(grupo => {
              const cuentasGrupo = PLAN_CUENTAS.filter(c => c.tipo==='activo' && c.grupo===grupo && saldos[c.codigo]?.saldo>0)
              if (cuentasGrupo.length === 0) return null
              return (
                <div key={grupo} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:1, marginBottom:6, paddingLeft:4 }}>{grupo.toUpperCase()}</div>
                  {cuentasGrupo.map(c => (
                    <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--blue)' }}>{cop(saldos[c.codigo].saldo)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 8px', borderTop:'2px solid var(--border)', marginTop:4 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>TOTAL ACTIVOS</span>
              <span style={{ fontSize:16, fontWeight:900, color:'var(--blue)' }}>{cop(totalActivos)}</span>
            </div>
          </div>

          {/* PASIVOS + PATRIMONIO */}
          <div className="panel">
            <div style={{ height:62, marginBottom:16 }} />

            <div style={{ fontSize:11, color:'var(--red)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>PASIVOS</div>
            {PLAN_CUENTAS.filter(c => c.tipo==='pasivo' && saldos[c.codigo]?.saldo>0).map(c => (
              <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--red)' }}>{cop(saldos[c.codigo].saldo)}</span>
              </div>
            ))}
            {PLAN_CUENTAS.filter(c=>c.tipo==='pasivo').every(c=>!saldos[c.codigo]?.saldo) && (
              <div style={{ fontSize:12, color:'var(--text4)', padding:'8px', textAlign:'center' }}>Sin pasivos registrados</div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px', borderTop:'1px solid var(--border)', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total pasivos</span>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--red)' }}>{cop(totalPasivos)}</span>
            </div>

            <div style={{ fontSize:11, color:'#9C27B0', letterSpacing:1, fontWeight:700, marginBottom:10 }}>PATRIMONIO</div>
            {PLAN_CUENTAS.filter(c => c.tipo==='patrimonio' && saldos[c.codigo]?.saldo>0).map(c => (
              <div key={c.codigo} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{c.nombre}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#9C27B0' }}>{cop(saldos[c.codigo].saldo)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Utilidad del ejercicio</span>
              <span style={{ fontSize:12, fontWeight:600, color: utilidadNeta>=0 ? 'var(--green)' : 'var(--red)' }}>{cop(utilidadNeta)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px', borderTop:'1px solid var(--border)', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total patrimonio</span>
              <span style={{ fontSize:14, fontWeight:800, color:'#9C27B0' }}>{cop(totalPatrimonio)}</span>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 8px', borderTop:'2px solid var(--border)' }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>PASIVOS + PATRIMONIO</span>
              <span style={{ fontSize:16, fontWeight:900, color: Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1 ? 'var(--green)' : 'var(--red)' }}>{cop(totalPasivos+totalPatrimonio)}</span>
            </div>

            <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, background: Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1 ? 'var(--green-dim)' : 'var(--red-dim)', border:`1px solid ${Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1 ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}`, textAlign:'center' }}>
              <span style={{ fontSize:13, fontWeight:700, color: Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1 ? 'var(--green)' : 'var(--red)' }}>
                {Math.abs(totalActivos-(totalPasivos+totalPatrimonio))<1 ? '✅ Balance cuadrado — Activos = Pasivos + Patrimonio' : '⚠️ Balance no cuadra'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN DE CUENTAS ── */}
      {tab === 'plan' && (
        <div className="panel">
          <div className="panel-title">Plan de cuentas ZABÚ</div>
          {['activo','pasivo','patrimonio','ingreso','costo','gasto'].map(tipo => {
            const tc = TIPO_COLORS[tipo]
            const cuentas = PLAN_CUENTAS.filter(c => c.tipo === tipo)
            return (
              <div key={tipo} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, padding:'4px 12px', borderRadius:6, display:'inline-block', background:tc.bg, color:tc.color, border:`0.5px solid ${tc.border}`, fontWeight:700, letterSpacing:1, marginBottom:10, textTransform:'uppercase' }}>{tipo}</div>
                {cuentas.map((c, i) => (
                  <div key={c.codigo} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:tc.color, minWidth:50 }}>{c.codigo}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', flex:1 }}>{c.nombre}</div>
                    <div style={{ fontSize:10, color:'var(--text4)' }}>{c.grupo}</div>
                    <div style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.04)', color:'var(--text3)' }}>
                      {c.naturaleza === 'debito' ? 'Débito' : 'Crédito'}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL NUEVO ASIENTO ── */}
      {modalAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:600, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo asiento contable</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Fecha</div>
                <input type="date" value={nFecha} onChange={e => setNFecha(e.target.value)} style={{ ...inputStyle, width:'100%' }} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Descripción</div>
                <input type="text" value={nDesc} onChange={e => setNDesc(e.target.value)} placeholder="Ej: Ventas del día..." style={{ ...inputStyle, width:'100%' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 32px', gap:6, marginBottom:8 }}>
              {['Código','Cuenta','Débito','Crédito',''].map(h => (
                <div key={h} style={{ fontSize:9, color:'var(--text3)', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {nPartidas.map((p, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 3fr 1fr 1fr 32px', gap:6, marginBottom:6 }}>
                <select value={p.codigo} onChange={e => updatePartida(i,'codigo',e.target.value)} style={{ ...inputStyle, padding:'7px 8px' }}>
                  <option value="">—</option>
                  {PLAN_CUENTAS.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo}</option>)}
                </select>
                <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center' }}>
                  {p.nombre || '—'}
                </div>
                <input type="number" value={p.debe||''} onChange={e => updatePartida(i,'debe',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign:'right' }} />
                <input type="number" value={p.haber||''} onChange={e => updatePartida(i,'haber',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign:'right' }} />
                <div onClick={() => setNPartidas(prev => prev.filter((_,j) => j!==i))} style={{ width:32, height:36, borderRadius:8, background:'rgba(224,82,82,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--red)', fontSize:16 }}>×</div>
              </div>
            ))}

            <button className="btn" style={{ marginTop:8, marginBottom:20 }} onClick={agregarPartida}>+ Agregar partida</button>

            <div style={{ padding:'12px 16px', borderRadius:10, background: cuadraNuevo ? 'var(--green-dim)' : 'var(--red-dim)', border:`1px solid ${cuadraNuevo ? 'var(--green-border)' : 'rgba(224,82,82,0.3)'}`, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text3)' }}>Total débito</span>
                <span style={{ fontWeight:700, color:'var(--text2)' }}>{cop(totalDebeNuevo)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginTop:4 }}>
                <span style={{ color:'var(--text3)' }}>Total crédito</span>
                <span style={{ fontWeight:700, color:'var(--text2)' }}>{cop(totalHaberNuevo)}</span>
              </div>
              <div style={{ marginTop:8, fontSize:13, fontWeight:700, color: cuadraNuevo ? 'var(--green)' : 'var(--red)', textAlign:'center' }}>
                {cuadraNuevo ? '✅ El asiento cuadra' : '⚠️ El asiento no cuadra — débito ≠ crédito'}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-green" style={{ flex:1 }} onClick={registrarAsiento} disabled={!cuadraNuevo || !nDesc.trim()}>
                Registrar asiento
              </button>
              <button className="btn" onClick={() => setModalAdd(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}