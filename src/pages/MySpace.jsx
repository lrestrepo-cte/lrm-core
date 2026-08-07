import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) {
  if (!n && n !== 0) return '$0'
  return '$' + Math.round(Math.abs(n)).toLocaleString('es-CO')
}

const iStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
}

const PIN = '2794'

// ─── PERSONAS ─────────────────────────────────────────────────────────────────
const PERSONAS    = ['Hogar','Luis','Emelyn','Lucía']
const P_COLOR     = { Hogar:'var(--gold)', Luis:'var(--blue)', Emelyn:'#E1306C', Lucía:'#9C27B0' }
const P_EMOJI     = { Hogar:'🏠', Luis:'👤', Emelyn:'👩', Lucía:'👧' }

// ─── CATEGORÍAS DE GASTOS ─────────────────────────────────────────────────────
const CATS_GASTO  = {
  Hogar:  ['Arriendo','Electricidad','Agua','Gas','Internet','Alimentación','Empleada','Streaming','Mantenimiento','Gasolina','Salud','Ocio','Servicios públicos','Otro'],
  Luis:   ['Salud','Transporte','Gym','Tecnología','Ropa','Ejecutivo','Entretenimiento','Cuota crédito','Otro'],
  Emelyn: ['Salud','Gym','Ropa','Celular','Entretenimiento','Cuota crédito','Otro'],
  Lucía:  ['Colegio','Extracurriculares','Salud','Útiles','Ropa','Ahorro','Otro'],
}

// ─── CATEGORÍAS DE OPCIONES ───────────────────────────────────────────────────
const CATS_OPCION = [
  { id:'vivienda',  label:'🏠 Vivienda',    campos:['m2','estrato','piso','barrio','habitaciones','banos','parqueadero','conjunto','administracion'] },
  { id:'vehiculo',  label:'🚗 Vehículo',    campos:['marca','modelo','ano','km','color','transmision','combustible','cilindraje'] },
  { id:'viaje',     label:'✈️ Viaje',       campos:['destino','duracion_dias','personas','temporada','tipo_hospedaje','aerolinea'] },
  { id:'inversion', label:'📈 Inversión',   campos:['tipo','entidad','plazo_meses','tasa_anual','rentabilidad_esperada'] },
  { id:'educacion', label:'🎓 Educación',   campos:['institucion','programa','duracion','modalidad','ciudad'] },
  { id:'otro',      label:'🎯 Otro',        campos:['detalle1','detalle2','detalle3'] },
]

// ─── FUENTES DE INGRESO ───────────────────────────────────────────────────────
const FUENTES = [
  { id:'honorarios',label:'💼 Independiente / Honorarios', tipo:'variable'},
  { id:'zabu',      label:'🌭 Dividendos ZABÚ',       tipo:'negocio' },
  { id:'rv',        label:'⚽ Dividendos RV Sports',   tipo:'negocio' },
  { id:'inversiones',label:'📈 Dividendos LRM Trade Consulting', tipo:'negocio' },
  { id:'bombas',    label:'💣 Dividendos Las Bombas',  tipo:'negocio' },
  { id:'freelance', label:'💻 Freelance / Consultoría',tipo:'variable'},
  { id:'arriendo',  label:'🏠 Arriendo recibido',     tipo:'variable'},
  { id:'ocasional', label:'💵 Ingreso ocasional',     tipo:'variable'},
  { id:'otro',      label:'➕ Otro',                  tipo:'variable'},
]

function parsearTextoFactura(texto) {
  return texto
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(linea => {
      const partes = linea.split('|').map(p => p.trim())
      if (partes.length < 2) return null
      const descripcion = partes[0]
      const monto = parseInt(partes[1].replace(/[^\d]/g, ''))
      if (!descripcion || !monto || isNaN(monto)) return null
      return { descripcion, monto }
    })
    .filter(Boolean)
}

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
function PinLock({ onUnlock }) {
  const [pin, setPin]   = useState('')
  const [error, setError] = useState(false)

  const add = (d) => {
    if (pin.length >= 4) return
    const n = pin + d
    setPin(n); setError(false)
    if (n.length === 4) setTimeout(() => {
      if (n === PIN) onUnlock()
      else { setError(true); setPin('') }
    }, 300)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:320, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:4 }}>My Space</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:32 }}>Acceso privado · Luis Restrepo</div>
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:14, height:14, borderRadius:'50%', transition:'all .2s',
              background: i < pin.length ? (error?'var(--red)':'var(--gold)') : 'rgba(255,255,255,0.1)',
              border:`1px solid ${error?'rgba(224,82,82,0.4)':'rgba(201,168,76,0.3)'}`,
            }} />
          ))}
        </div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:16 }}>PIN incorrecto</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:260, margin:'0 auto' }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i) => (
            <div key={i} onClick={() => { if(d==='⌫'){setPin(p=>p.slice(0,-1));setError(false)} else if(d!=='') add(String(d)) }}
              style={{ padding:'16px', borderRadius:12, textAlign:'center', cursor:d===''?'default':'pointer', visibility:d===''?'hidden':'visible',
                background:d==='⌫'?'rgba(224,82,82,0.1)':'rgba(255,255,255,0.06)',
                border:`1px solid ${d==='⌫'?'rgba(224,82,82,0.2)':'rgba(255,255,255,0.08)'}`,
                fontSize:d==='⌫'?18:20, fontWeight:700, color:d==='⌫'?'var(--red)':'var(--text)',
              }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── RESUMEN ──────────────────────────────────────────────────────────────────
function Resumen() {
  const [data, setData]     = useState({ ingresos:[], gastos:[], deudas:[], metas:[] })
  const [loading, setLoading] = useState(true)
  const mes = new Date().toISOString().slice(0,7)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:ing }, { data:gas }, { data:deu }, { data:met }] = await Promise.all([
      supabase.from('my_space_ingresos_v2').select('*').gte('fecha', mes+'-01'),
      supabase.from('my_space_gastos_v2').select('*').gte('fecha', mes+'-01'),
      supabase.from('my_space_deudas').select('*'),
      supabase.from('my_space_metas_v2').select('*').eq('estado','activa').gt('cuota_mensual',0),
    ])
    setData({ ingresos:ing||[], gastos:gas||[], deudas:deu||[], metas:met||[] })
    setLoading(false)
  }

  const totalIngresos   = data.ingresos.reduce((s,i)=>s+i.monto,0)
  const totalGastos     = data.gastos.reduce((s,g)=>s+g.monto,0)
  const totalCuotas     = data.metas.reduce((s,m)=>s+m.cuota_mensual,0)
  const saldo           = totalIngresos - totalGastos - totalCuotas
  const totalDebo       = data.deudas.filter(d=>d.tipo==='debo').reduce((s,d)=>s+d.saldo_total,0)
  const totalMeDeben    = data.deudas.filter(d=>d.tipo==='me_deben').reduce((s,d)=>s+d.saldo_total,0)

  const porPersona = PERSONAS.map(p => ({
    p, gastado: data.gastos.filter(g=>g.persona===p).reduce((s,g)=>s+g.monto,0)
  }))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Resumen financiero</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</div>
        </div>
        <button onClick={cargar} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:11, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>🔄</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div> : (
        <>
          {/* KPIs principales */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Ingresos del mes',  val:cop(totalIngresos), color:'var(--green)', sub:`${data.ingresos.length} fuentes` },
              { label:'Gastos del mes',    val:cop(totalGastos),   color:'var(--red)',   sub:`${data.gastos.length} registros` },
              { label:'Cuotas metas',      val:cop(totalCuotas),   color:'var(--gold)',  sub:`${data.metas.filter(m=>m.cuota_mensual>0).length} metas financiadas` },
              { label:'Saldo disponible',  val:cop(saldo),         color:saldo>=0?'var(--gold)':'var(--red)', sub:saldo>=0?'Positivo':'⚠️ Déficit' },
              { label:'Lo que debo',       val:cop(totalDebo),     color:'var(--red)',   sub:'Deudas activas' },
              { label:'Me deben a mí',     val:cop(totalMeDeben),  color:'var(--green)', sub:'Activo pendiente' },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div style={{ fontSize:18, fontWeight:800, color:k.color, margin:'4px 0' }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
                <div className="kpi-accent" style={{ background:k.color }} />
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ gap:16 }}>
            {/* Gastos por persona */}
            <div className="panel">
              <div className="panel-title">Gastos por persona</div>
              {porPersona.map(({ p, gastado }) => (
                <div key={p} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{P_EMOJI[p]}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{p}</span>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:P_COLOR[p] }}>{cop(gastado)}</span>
                </div>
              ))}
            </div>

            {/* Ingresos del mes */}
            <div className="panel">
              <div className="panel-title">Ingresos del mes</div>
              {data.ingresos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Sin ingresos registrados</div>
              ) : data.ingresos.map((ing,i) => {
                const f = FUENTES.find(f=>f.id===ing.fuente)
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:13, color:'var(--text2)' }}>{f?.label || ing.fuente} {ing.descripcion ? `· ${ing.descripcion}` : ''}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>{cop(ing.monto)}</div>
                  </div>
                )
              })}
              {data.ingresos.length > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:16, fontWeight:900, color:'var(--green)' }}>{cop(totalIngresos)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metas con cuotas */}
          {data.metas.filter(m=>m.cuota_mensual>0).length > 0 && (
            <div className="panel" style={{ marginTop:16 }}>
              <div className="panel-title">Compromisos mensuales (metas financiadas)</div>
              {data.metas.filter(m=>m.cuota_mensual>0).map((m,i) => {
                const pct = Math.min(100, Math.round((m.valor_actual/m.valor_total)*100))
                return (
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <div style={{ fontSize:13, color:'var(--text)' }}>{m.emoji} {m.nombre}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(m.cuota_mensual)}/mes</div>
                    </div>
                    <div className="prog-wrap" style={{ height:5 }}>
                      <div className="prog-fill" style={{ width:`${pct}%`, height:5, background:'var(--gold)' }} />
                    </div>
                    <div style={{ fontSize:11, color:'var(--text4)', marginTop:3 }}>{pct}% completado · {cop(m.valor_actual)} de {cop(m.valor_total)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── INGRESOS ─────────────────────────────────────────────────────────────────
function Ingresos() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [fuente,   setFuente]   = useState('salario')
  const [desc,     setDesc]     = useState('')
  const [monto,    setMonto]    = useState('')
  const [fecha,    setFecha]    = useState(new Date().toISOString().split('T')[0])
  const [recur,    setRecur]    = useState(false)
  const [filtroMes,setFiltroMes]= useState(new Date().toISOString().slice(0,7))

  useEffect(() => { cargar() }, [filtroMes])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_ingresos_v2').select('*')
      .gte('fecha', filtroMes+'-01')
      .lte('fecha', filtroMes+'-31')
      .order('fecha', { ascending:false })
    if (data) setItems(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!monto) return
    const f = FUENTES.find(f=>f.id===fuente)
    await supabase.from('my_space_ingresos_v2').insert({
      fecha, fuente, descripcion:desc||f?.label, monto:parseInt(monto), tipo:f?.tipo||'variable', recurrente:recur
    })
    setMonto(''); setDesc(''); setRecur(false)
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_ingresos_v2').delete().eq('id', id)
    setItems(prev=>prev.filter(i=>i.id!==id))
  }

  const total = items.reduce((s,i)=>s+i.monto,0)
  const porTipo = ['fijo','variable','negocio'].map(t => ({
    t, val: items.filter(i=>i.tipo===t).reduce((s,i)=>s+i.monto,0),
    label: t==='fijo'?'💼 Fijo':t==='variable'?'💵 Variable':'🏢 Negocios'
  }))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Ingresos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Todas las fuentes de ingreso</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
          <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Registrar</button>
        </div>
      </div>

      <div className="kpi-card" style={{ marginBottom:20 }}>
        <div className="kpi-label">Total ingresos del mes</div>
        <div className="kpi-val" style={{ color:'var(--green)', fontSize:28 }}>{cop(total)}</div>
        <div className="kpi-sub">{items.length} registros</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {porTipo.map(t => (
          <div key={t.t} className="kpi-card">
            <div className="kpi-label">{t.label}</div>
            <div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(t.val)}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        : items.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin ingresos este mes</div>
        : items.map((item,i) => {
          const f = FUENTES.find(f=>f.id===item.fuente)
          return (
            <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:20 }}>{f?.label.split(' ')[0]||'💵'}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.descripcion}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                    {item.fecha}
                    {item.recurrente && <span style={{ marginLeft:6, fontSize:9, padding:'1px 6px', borderRadius:6, background:'rgba(55,138,221,0.1)', color:'var(--blue)' }}>Recurrente</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{cop(item.monto)}</div>
                <div onClick={() => eliminar(item.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:420, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Registrar ingreso</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Fuente</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {FUENTES.map(f => (
                  <div key={f.id} onClick={() => setFuente(f.id)} style={{
                    padding:'10px 14px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                    background: fuente===f.id?'var(--green-dim)':'rgba(255,255,255,0.04)',
                    border:`1px solid ${fuente===f.id?'var(--green-border)':'var(--border)'}`,
                  }}>
                    <span style={{ fontSize:16 }}>{f.label.split(' ')[0]}</span>
                    <span style={{ fontSize:13, color:fuente===f.id?'var(--green)':'var(--text3)', fontWeight:fuente===f.id?700:400 }}>{f.label.slice(f.label.indexOf(' ')+1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción (opcional)</div>
              <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Salario junio, bono..." style={iStyle} />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto (COP)</div>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 5000000" style={iStyle} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iStyle} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer' }} onClick={()=>setRecur(p=>!p)}>
              <div style={{ width:18, height:18, borderRadius:5, border:'1px solid var(--border)', background:recur?'var(--gold-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--gold)' }}>{recur&&'✓'}</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Ingreso recurrente mensual</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!monto} className="btn-green" style={{ flex:1 }}>Guardar ingreso</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GASTOS ───────────────────────────────────────────────────────────────────
function Gastos() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [modoCarga, setModoCarga] = useState('manual') // 'manual' | 'pegar'
  const [persona,   setPersona]   = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcat,    setSubcat]    = useState('')
  const [desc,      setDesc]      = useState('')
  const [monto,     setMonto]     = useState('')
  const [fecha,     setFecha]     = useState(new Date().toISOString().split('T')[0])
  const [recur,     setRecur]     = useState(false)
  const [metaId,    setMetaId]    = useState('')
  const [metas,     setMetas]     = useState([])
  const [filtroP,   setFiltroP]   = useState('Todos')
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0,7))
  const [textoPegado, setTextoPegado]     = useState('')
  const [guardandoLote, setGuardandoLote] = useState(false)
  const [resultadoLote, setResultadoLote] = useState(null)
  const [subcatsExistentes, setSubcatsExistentes] = useState([])
  const [intentoSinClasificar, setIntentoSinClasificar] = useState(false)
  const [proveedor,     setProveedor]     = useState('')
  const [nit,            setNit]           = useState('')
  const [numeroFactura,  setNumeroFactura] = useState('')
  const [formaPago,      setFormaPago]     = useState('')

  useEffect(() => { cargar(); cargarMetas(); cargarSubcats() }, [filtroMes, filtroP])

  // Devuelve el último día real del mes (28, 29, 30 o 31) para no pedirle a
  // Supabase fechas que no existen, como "2026-06-31".
  const ultimoDiaMes = (ym) => {
    const [anio, mes] = ym.split('-').map(Number)
    return new Date(anio, mes, 0).getDate()
  }

  const cargar = async () => {
    setLoading(true)
    const ultimoDia = ultimoDiaMes(filtroMes)
    let q = supabase.from('my_space_gastos_v2').select('*')
      .gte('fecha', filtroMes+'-01')
      .lte('fecha', filtroMes+'-'+String(ultimoDia).padStart(2,'0'))
      .order('fecha', { ascending:false })
    if (filtroP !== 'Todos') q = q.eq('persona', filtroP)
    const { data, error } = await q
    if (error) console.error('Error cargando gastos:', error)
    if (data) setItems(data)
    setLoading(false)
  }

  const cargarMetas = async () => {
    const { data } = await supabase.from('my_space_metas_v2').select('id,nombre,emoji').eq('estado','activa')
    if (data) setMetas(data)
  }

  // Toma todas las subcategorías que ya se han escrito antes, para sugerirlas
  // como autocompletado y evitar errores de tipeo (ej: "Netflix" vs "netflix").
  const cargarSubcats = async () => {
    const { data } = await supabase.from('my_space_gastos_v2').select('subcategoria').not('subcategoria','is',null)
    if (data) {
      const unicas = [...new Set(data.map(d => d.subcategoria).filter(Boolean))].sort()
      setSubcatsExistentes(unicas)
    }
  }

  // Persona y categoría son obligatorias siempre — sin esto, no se guarda nada.
  const faltaClasificar = !persona || !categoria

  const guardar = async () => {
    if (faltaClasificar || !monto) { setIntentoSinClasificar(true); return }
    await supabase.from('my_space_gastos_v2').insert({
      fecha, persona, categoria, subcategoria:subcat, descripcion:desc,
      monto:parseInt(monto), recurrente:recur, meta_id:metaId||null,
      proveedor:proveedor||null, nit:nit||null, numero_factura:numeroFactura||null, forma_pago:formaPago||null
    })
    if (metaId) {
      const { data:meta } = await supabase.from('my_space_metas_v2').select('valor_actual').eq('id',metaId).single()
      if (meta) await supabase.from('my_space_metas_v2').update({ valor_actual: meta.valor_actual + parseInt(monto) }).eq('id', metaId)
    }
    setCategoria(''); setSubcat(''); setDesc(''); setMonto(''); setRecur(false); setMetaId(''); setIntentoSinClasificar(false)
    setProveedor(''); setNit(''); setNumeroFactura(''); setFormaPago('')
    setModal(false); cargar(); cargarSubcats()
  }

  // Crea un gasto por cada línea pegada de la factura, usando persona/categoría/
  // fecha/proveedor/nit/numero de factura/forma de pago elegidas una sola vez
  // en el modal — obligatorias antes de avanzar (persona y categoría).
  const guardarLotePegado = async () => {
    const lineas = parsearTextoFactura(textoPegado)
    if (faltaClasificar || lineas.length === 0) { setIntentoSinClasificar(true); return }
    setGuardandoLote(true)

    const registros = lineas.map(l => ({
      fecha, persona, categoria, subcategoria: subcat, descripcion: l.descripcion,
      monto: l.monto, recurrente: false, meta_id: null,
      proveedor: proveedor||null, nit: nit||null, numero_factura: numeroFactura||null, forma_pago: formaPago||null,
    }))
    const { error } = await supabase.from('my_space_gastos_v2').insert(registros)

    setGuardandoLote(false)
    if (error) { setResultadoLote({ ok:false, msg:'Error: '+error.message }); return }

    const totalLote = registros.reduce((s,r)=>s+r.monto,0)
    setResultadoLote({ ok:true, msg:`✅ Se crearon ${registros.length} gastos por un total de ${cop(totalLote)}.` })
    setTimeout(() => {
      setTextoPegado(''); setResultadoLote(null); setCategoria(''); setSubcat(''); setIntentoSinClasificar(false)
      setProveedor(''); setNit(''); setNumeroFactura(''); setFormaPago('')
      setModal(false); cargar(); cargarSubcats()
    }, 1800)
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_gastos_v2').delete().eq('id', id)
    setItems(prev=>prev.filter(i=>i.id!==id))
  }

  const total = items.reduce((s,i)=>s+i.monto,0)
  const porPersona = PERSONAS.map(p => ({ p, val: items.filter(i=>i.persona===p).reduce((s,i)=>s+i.monto,0) }))

  const lineasPreview = textoPegado ? parsearTextoFactura(textoPegado) : []
  const totalPreview = lineasPreview.reduce((s,l)=>s+l.monto,0)

  const cerrarModal = () => {
    setModal(false); setModoCarga('manual'); setTextoPegado(''); setResultadoLote(null)
    setPersona(''); setCategoria(''); setIntentoSinClasificar(false)
    setProveedor(''); setNit(''); setNumeroFactura(''); setFormaPago('')
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Gastos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Registro de todos los gastos familiares</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
          <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Registrar</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {['Todos',...PERSONAS].map(p => (
          <div key={p} onClick={() => setFiltroP(p)} style={{
            padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
            background: filtroP===p?`${P_COLOR[p]||'var(--gold)'}22`:'rgba(255,255,255,0.04)',
            border:`1px solid ${filtroP===p?P_COLOR[p]||'var(--gold)':'var(--border)'}`,
            color: filtroP===p?P_COLOR[p]||'var(--gold)':'var(--text3)',
            display:'flex', alignItems:'center', gap:5,
          }}>
            {P_EMOJI[p]||'📊'} {p}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {porPersona.map(({ p, val }) => (
          <div key={p} className="kpi-card" style={{ border:`1px solid ${P_COLOR[p]}33` }}>
            <div className="kpi-label">{P_EMOJI[p]} {p}</div>
            <div style={{ fontSize:16, fontWeight:800, color:P_COLOR[p], margin:'4px 0' }}>{cop(val)}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total: <span style={{ color:'var(--red)' }}>{cop(total)}</span></span>
          <span style={{ fontSize:12, color:'var(--text3)' }}>{items.length} registros</span>
        </div>
        {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        : items.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin gastos registrados</div>
        : items.map((item,i) => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${P_COLOR[item.persona]||'var(--gold)'}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                {P_EMOJI[item.persona]||'💸'}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {item.descripcion || item.subcategoria || item.categoria}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                  {item.persona} · {item.categoria} · {item.fecha}
                  {item.proveedor && ` · ${item.proveedor}`}
                  {item.recurrente && <span style={{ marginLeft:6, fontSize:9, padding:'1px 6px', borderRadius:6, background:'rgba(55,138,221,0.1)', color:'var(--blue)' }}>Recurrente</span>}
                  {item.meta_id && <span style={{ marginLeft:4, fontSize:9, padding:'1px 6px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)' }}>Meta</span>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--red)' }}>{cop(item.monto)}</div>
              <div onClick={() => eliminar(item.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Registrar gasto</div>

            <div style={{ display:'flex', gap:8, marginBottom:18 }}>
              {[{id:'manual',label:'✍️ Manual'},{id:'pegar',label:'📋 Pegar de factura'}].map(m => (
                <div key={m.id} onClick={() => setModoCarga(m.id)} style={{
                  flex:1, padding:'9px', borderRadius:8, cursor:'pointer', textAlign:'center', fontSize:12, fontWeight:600,
                  background: modoCarga===m.id?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${modoCarga===m.id?'var(--gold-border)':'var(--border)'}`,
                  color: modoCarga===m.id?'var(--gold)':'var(--text3)',
                }}>{m.label}</div>
              ))}
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:intentoSinClasificar&&!persona?'var(--red)':'var(--text3)', marginBottom:8, fontWeight:intentoSinClasificar&&!persona?700:400 }}>
                ¿Para quién? {intentoSinClasificar&&!persona && '— obligatorio'}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {PERSONAS.map(p => (
                  <div key={p} onClick={() => { setPersona(p); setCategoria('') }} style={{
                    padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                    background: persona===p?`${P_COLOR[p]}22`:'rgba(255,255,255,0.04)',
                    border:`1px solid ${persona===p?P_COLOR[p]:(intentoSinClasificar&&!persona?'var(--red)':'var(--border)')}`,
                    color: persona===p?P_COLOR[p]:'var(--text3)',
                  }}>{P_EMOJI[p]} {p}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:intentoSinClasificar&&!categoria?'var(--red)':'var(--text3)', fontWeight:intentoSinClasificar&&!categoria?700:400 }}>
                Categoría {intentoSinClasificar&&!categoria && '— obligatorio'} {modoCarga==='pegar' && !(intentoSinClasificar&&!categoria) && '(se aplica a todas las líneas pegadas)'}
              </div>
              <select value={categoria} onChange={e=>setCategoria(e.target.value)}
                style={{ ...iStyle, border: intentoSinClasificar&&!categoria?'1px solid var(--red)':iStyle.border }}>
                <option value="">Seleccionar...</option>
                {(CATS_GASTO[persona]||[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {intentoSinClasificar && faltaClasificar && (
              <div style={{ padding:'10px 14px', background:'var(--red-dim)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:10, fontSize:12, color:'var(--red)', marginBottom:14 }}>
                ⚠️ Debes elegir a quién pertenece y la categoría antes de continuar.
              </div>
            )}

            {modoCarga === 'manual' ? (
              <>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Subcategoría / Detalle</div>
                  <input type="text" list="subcats-existentes" value={subcat} onChange={e=>setSubcat(e.target.value)} placeholder="Ej: Netflix, Gasolina Full, D1..." style={iStyle} />
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción adicional</div>
                  <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Nota opcional" style={iStyle} />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Monto (COP)</div>
                    <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 150000" style={iStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div>
                    <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iStyle} />
                  </div>
                </div>

                {metas.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>¿Asociar a una meta? (opcional)</div>
                    <select value={metaId} onChange={e=>setMetaId(e.target.value)} style={iStyle}>
                      <option value="">Sin meta asociada</option>
                      {metas.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nombre}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer' }} onClick={()=>setRecur(p=>!p)}>
                  <div style={{ width:18, height:18, borderRadius:5, border:'1px solid var(--border)', background:recur?'var(--gold-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--gold)' }}>{recur&&'✓'}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>Gasto recurrente mensual</div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={guardar} className="btn-green" style={{ flex:1, opacity:(!monto)?0.5:1 }}>Guardar gasto</button>
                  <button onClick={cerrarModal} className="btn">Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de la factura (se aplica a todas las líneas)</div>
                  <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iStyle} />
                </div>

                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Subcategoría / Proveedor corto (opcional, se aplica a todas)</div>
                  <input type="text" list="subcats-existentes" value={subcat} onChange={e=>setSubcat(e.target.value)} placeholder="Ej: D1, Air-e, AAA..." style={iStyle} />
                </div>

                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:10, marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10, fontWeight:700 }}>Datos de la factura (opcional, se guardan en cada línea)</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>Proveedor</div>
                      <input type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} placeholder="Ej: D1 SAS" style={{ ...iStyle, fontSize:12 }} />
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>NIT</div>
                      <input type="text" value={nit} onChange={e=>setNit(e.target.value)} placeholder="Ej: 900276962-1" style={{ ...iStyle, fontSize:12 }} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>N° Factura/Recibo</div>
                      <input type="text" value={numeroFactura} onChange={e=>setNumeroFactura(e.target.value)} placeholder="Ej: 141657" style={{ ...iStyle, fontSize:12 }} />
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>Forma de pago</div>
                      <input type="text" value={formaPago} onChange={e=>setFormaPago(e.target.value)} placeholder="Ej: Contado, Tarjeta" style={{ ...iStyle, fontSize:12 }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Pega aquí el texto que Claude te dio (formato: descripción|monto, una línea por unidad)</div>
                  <textarea value={textoPegado} onChange={e=>setTextoPegado(e.target.value)}
                    placeholder={"Toalla de cocina|1750\nCrema dental|5300\nTocineta ahumada|6600"}
                    style={{ ...iStyle, height:140, resize:'vertical', fontFamily:'monospace', fontSize:12 }} />
                </div>

                {lineasPreview.length > 0 && (
                  <div style={{ padding:'10px 14px', background:'rgba(55,138,221,0.06)', border:'1px solid rgba(55,138,221,0.2)', borderRadius:10, fontSize:12, color:'var(--blue)', marginBottom:14 }}>
                    📋 Se detectaron {lineasPreview.length} línea(s) — total {cop(totalPreview)}
                  </div>
                )}

                {resultadoLote && (
                  <div style={{ padding:'12px 14px', borderRadius:10, fontSize:13, fontWeight:600, marginBottom:14,
                    background: resultadoLote.ok?'var(--green-dim)':'var(--red-dim)',
                    color: resultadoLote.ok?'var(--green)':'var(--red)',
                    border:`1px solid ${resultadoLote.ok?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
                    {resultadoLote.msg}
                  </div>
                )}

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={guardarLotePegado} disabled={lineasPreview.length===0||guardandoLote||resultadoLote?.ok} className="btn-green" style={{ flex:1 }}>
                    {guardandoLote ? '⏳ Creando...' : `Crear ${lineasPreview.length||''} gasto(s)`}
                  </button>
                  <button onClick={cerrarModal} className="btn">Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <datalist id="subcats-existentes">
        {subcatsExistentes.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  )
}

// ─── COMPARADOR ───────────────────────────────────────────────────────────────
function Comparador() {
  const [opciones,  setOpciones]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [catSel,    setCatSel]    = useState('vivienda')
  const [nombre,    setNombre]    = useState('')
  const [desc,      setDesc]      = useState('')
  const [valor,     setValor]     = useState('')
  const [atribs,    setAtribs]    = useState({})
  const [filtroC,   setFiltroC]   = useState('todos')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_opciones').select('*').order('created_at', { ascending:false })
    if (data) setOpciones(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre || !valor) return
    await supabase.from('my_space_opciones').insert({
      categoria:catSel, nombre, descripcion:desc, valor_total:parseInt(valor), atributos:atribs
    })
    setNombre(''); setDesc(''); setValor(''); setAtribs({})
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_opciones').delete().eq('id', id)
    setOpciones(prev=>prev.filter(o=>o.id!==id))
  }

  const pasarAMeta = async (op) => {
    await supabase.from('my_space_metas_v2').insert({
      nombre: op.nombre, categoria: op.categoria,
      emoji: CATS_OPCION.find(c=>c.id===op.categoria)?.label.split(' ')[0]||'🎯',
      valor_total: op.valor_total, valor_actual: 0,
      estado:'activa', opcion_id: op.id,
      notas: op.descripcion,
    })
    await supabase.from('my_space_opciones').update({ paso_a_meta:true }).eq('id', op.id)
    setOpciones(prev=>prev.map(o=>o.id===op.id?{...o,paso_a_meta:true}:o))
    alert(`✅ "${op.nombre}" pasó a Metas`)
  }

  const catActual = CATS_OPCION.find(c=>c.id===catSel)
  const opsFiltradas = filtroC==='todos' ? opciones : opciones.filter(o=>o.categoria===filtroC)

  // Agrupar por categoría para comparar
  const porCategoria = opsFiltradas.reduce((acc,o) => {
    if (!acc[o.categoria]) acc[o.categoria] = []
    acc[o.categoria].push(o)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Comparador de opciones</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Compara viviendas, carros, viajes, inversiones y más</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar opción</button>
      </div>

      {/* Filtro categoría */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <div onClick={() => setFiltroC('todos')} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, background:filtroC==='todos'?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${filtroC==='todos'?'var(--gold-border)':'var(--border)'}`, color:filtroC==='todos'?'var(--gold)':'var(--text3)' }}>Todos</div>
        {CATS_OPCION.map(c => (
          <div key={c.id} onClick={() => setFiltroC(c.id)} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, background:filtroC===c.id?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${filtroC===c.id?'var(--gold-border)':'var(--border)'}`, color:filtroC===c.id?'var(--gold)':'var(--text3)' }}>
            {c.label}
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      : opciones.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:14, color:'var(--text3)', marginBottom:8 }}>Sin opciones todavía</div>
          <div style={{ fontSize:12 }}>Agrega apartamentos, carros, viajes o inversiones para compararlos</div>
        </div>
      ) : Object.entries(porCategoria).map(([cat, ops]) => {
        const catInfo = CATS_OPCION.find(c=>c.id===cat)
        const mejor = ops.reduce((min,o)=>o.valor_total<min.valor_total?o:min, ops[0])
        return (
          <div key={cat} style={{ marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)', marginBottom:12 }}>{catInfo?.label}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {ops.map(op => (
                <div key={op.id} className="panel" style={{ border:`1px solid ${op.id===mejor.id?'var(--green-border)':op.paso_a_meta?'var(--gold-border)':'var(--border)'}`, position:'relative' }}>
                  {op.id===mejor.id && ops.length>1 && (
                    <div style={{ position:'absolute', top:-10, right:12, fontSize:10, padding:'2px 10px', borderRadius:10, background:'var(--green)', color:'white', fontWeight:700 }}>✓ Mejor precio</div>
                  )}
                  {op.paso_a_meta && (
                    <div style={{ position:'absolute', top:-10, left:12, fontSize:10, padding:'2px 10px', borderRadius:10, background:'var(--gold)', color:'#000', fontWeight:700 }}>En metas</div>
                  )}
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:6 }}>{op.nombre}</div>
                  {op.descripcion && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>{op.descripcion}</div>}
                  <div style={{ fontSize:24, fontWeight:900, color:'var(--gold)', marginBottom:10 }}>{cop(op.valor_total)}</div>

                  {/* Atributos */}
                  {op.atributos && Object.keys(op.atributos).length > 0 && (
                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
                      {Object.entries(op.atributos).filter(([k,v])=>v).map(([k,v]) => (
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', fontSize:11 }}>
                          <span style={{ color:'var(--text4)', textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</span>
                          <span style={{ color:'var(--text2)', fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:8 }}>
                    {!op.paso_a_meta && (
                      <button onClick={() => pasarAMeta(op)} style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, background:'var(--gold-dim)', border:'0.5px solid var(--gold-border)', color:'var(--gold)', fontFamily:'inherit' }}>
                        🎯 Pasar a Meta
                      </button>
                    )}
                    <div onClick={() => eliminar(op.id)} style={{ width:32, height:32, borderRadius:8, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva opción para comparar</div>

            {/* Categoría */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Categoría</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {CATS_OPCION.map(c => (
                  <div key={c.id} onClick={() => { setCatSel(c.id); setAtribs({}) }} style={{
                    padding:'7px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                    background:catSel===c.id?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                    border:`1px solid ${catSel===c.id?'var(--gold-border)':'var(--border)'}`,
                    color:catSel===c.id?'var(--gold)':'var(--text3)',
                  }}>{c.label}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder={catSel==='vivienda'?'Ej: Edificio Napoli Apto 502':catSel==='vehiculo'?'Ej: Toyota Corolla 2023':catSel==='viaje'?'Ej: Miami 5 días julio':'Nombre'} style={iStyle} />
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción</div>
              <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Notas, observaciones, contacto..." style={iStyle} />
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Valor total (COP)</div>
              <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="Ej: 500000000" style={iStyle} />
            </div>

            {/* Campos específicos por categoría */}
            {catActual && catActual.campos.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Detalles específicos</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {catActual.campos.map(campo => (
                    <div key={campo}>
                      <div style={{ fontSize:10, color:'var(--text4)', textTransform:'capitalize', marginBottom:3 }}>{campo.replace(/_/g,' ')}</div>
                      <input type="text" value={atribs[campo]||''} onChange={e=>setAtribs(p=>({...p,[campo]:e.target.value}))}
                        placeholder={campo==='m2'?'Ej: 70':campo==='estrato'?'Ej: 4':campo==='piso'?'Ej: 8':campo==='barrio'?'Ej: El Prado':campo==='marca'?'Ej: Toyota':campo==='modelo'?'Ej: Corolla':campo==='ano'?'Ej: 2023':campo==='destino'?'Ej: Miami':''}
                        style={{ width:'100%', padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!nombre||!valor} className="btn-green" style={{ flex:1 }}>Agregar opción</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── METAS ────────────────────────────────────────────────────────────────────
function Metas() {
  const [metas,    setMetas]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [cat,      setCat]      = useState('vivienda')
  const [emoji,    setEmoji]    = useState('🎯')
  const [valor,    setValor]    = useState('')
  const [actual,   setActual]   = useState('')
  const [financiado,setFinanciado]=useState(false)
  const [cuota,    setCuota]    = useState('')
  const [plazo,    setPlazo]    = useState('')
  const [tasa,     setTasa]     = useState('')
  const [fechaObj, setFechaObj] = useState('')
  const [notas,    setNotas]    = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_metas_v2').select('*').order('created_at', { ascending:false })
    if (data) setMetas(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!nombre || !valor) return
    await supabase.from('my_space_metas_v2').insert({
      nombre, categoria:cat, emoji, valor_total:parseInt(valor), valor_actual:parseInt(actual||0),
      financiado, cuota_mensual:parseInt(cuota||0), plazo_meses:parseInt(plazo||0),
      tasa_interes:parseFloat(tasa||0), fecha_objetivo:fechaObj||null, estado:'activa', notas
    })
    setNombre(''); setValor(''); setActual(''); setCuota(''); setPlazo(''); setTasa(''); setFechaObj(''); setNotas(''); setFinanciado(false)
    setModal(false); cargar()
  }

  const actualizarAvance = async (id, nuevoVal) => {
    await supabase.from('my_space_metas_v2').update({ valor_actual:parseInt(nuevoVal) }).eq('id', id)
    setMetas(prev=>prev.map(m=>m.id===id?{...m,valor_actual:parseInt(nuevoVal)}:m))
  }

  const cambiarEstado = async (id, estado) => {
    await supabase.from('my_space_metas_v2').update({ estado }).eq('id', id)
    setMetas(prev=>prev.map(m=>m.id===id?{...m,estado}:m))
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_metas_v2').delete().eq('id', id)
    setMetas(prev=>prev.filter(m=>m.id!==id))
  }

  const EMOJIS_CAT = { vivienda:'🏠', vehiculo:'🚗', viaje:'✈️', inversion:'📈', educacion:'🎓', otro:'🎯' }
  const EMOJIS_LIST = ['🏠','🚗','✈️','📈','🎓','🎯','🏖️','💰','👨‍👩‍👧','🌎','🏆','💎','🛥️','🏋️','📚','🌱']

  const metasActivas  = metas.filter(m=>m.estado==='activa')
  const metasLogradas = metas.filter(m=>m.estado==='lograda')

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Metas y sueños</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{metasActivas.length} activas · {metasLogradas.length} logradas</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva meta</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      : metas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:14, color:'var(--text3)', marginBottom:8 }}>Sin metas todavía</div>
          <div style={{ fontSize:12 }}>Agrega tus metas o pásalas desde el Comparador</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {metas.map(m => {
            const pct       = m.valor_total>0 ? Math.min(100, Math.round((m.valor_actual/m.valor_total)*100)) : 0
            const lograda   = m.estado==='lograda'
            const pausada   = m.estado==='pausada'
            const colorBar  = lograda?'var(--green)':pct>=60?'var(--gold)':'var(--red)'
            const mesesFalt = m.cuota_mensual>0&&m.valor_total>0 ? Math.ceil((m.valor_total-m.valor_actual)/m.cuota_mensual) : null

            return (
              <div key={m.id} className="panel" style={{ opacity:pausada?0.6:1, border:`1px solid ${lograda?'var(--green-border)':pausada?'var(--border)':'var(--border)'}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:36 }}>{m.emoji}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:lograda?'var(--green)':'var(--text)' }}>
                        {m.nombre} {lograda&&'✅'}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                        {m.categoria} · {cop(m.valor_actual)} de {cop(m.valor_total)}
                        {m.fecha_objetivo && ` · Objetivo: ${m.fecha_objetivo}`}
                      </div>
                      {m.notas && <div style={{ fontSize:11, color:'var(--text4)', marginTop:2, fontStyle:'italic' }}>{m.notas}</div>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:lograda?'var(--green)':'var(--gold)' }}>{pct}%</div>
                    <div onClick={() => eliminar(m.id)} style={{ width:24, height:24, borderRadius:6, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'var(--red)' }}>×</div>
                  </div>
                </div>

                <div className="prog-wrap" style={{ height:10, marginBottom:10 }}>
                  <div className="prog-fill" style={{ width:`${pct}%`, height:10, background:colorBar, transition:'width .5s' }} />
                </div>

                {/* Financiamiento */}
                {m.financiado && m.cuota_mensual>0 && (
                  <div style={{ padding:'8px 12px', background:'var(--gold-dim)', border:'0.5px solid var(--gold-border)', borderRadius:8, marginBottom:10, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color:'var(--gold)' }}>💳 Cuota mensual: <strong>{cop(m.cuota_mensual)}</strong></span>
                    {mesesFalt && <span style={{ fontSize:11, color:'var(--text3)' }}>~{mesesFalt} meses restantes</span>}
                  </div>
                )}

                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Avance:</div>
                  <input type="number" defaultValue={m.valor_actual}
                    onBlur={e=>actualizarAvance(m.id,e.target.value)}
                    style={{ width:130, padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }} />
                  {!lograda && <button onClick={() => cambiarEstado(m.id,'lograda')} style={{ padding:'5px 12px', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600, background:'var(--green-dim)', border:'0.5px solid var(--green-border)', color:'var(--green)', fontFamily:'inherit' }}>✅ Lograda</button>}
                  {!pausada && !lograda && <button onClick={() => cambiarEstado(m.id,'pausada')} style={{ padding:'5px 12px', borderRadius:7, cursor:'pointer', fontSize:11, background:'rgba(255,255,255,0.04)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>⏸ Pausar</button>}
                  {pausada && <button onClick={() => cambiarEstado(m.id,'activa')} style={{ padding:'5px 12px', borderRadius:7, cursor:'pointer', fontSize:11, background:'var(--gold-dim)', border:'0.5px solid var(--gold-border)', color:'var(--gold)', fontFamily:'inherit' }}>▶ Reactivar</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:460, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva meta</div>

            {/* Emoji */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Emoji</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {EMOJIS_LIST.map(e => (
                  <div key={e} onClick={() => setEmoji(e)} style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', background:emoji===e?'var(--gold-dim)':'rgba(255,255,255,0.05)', border:`1px solid ${emoji===e?'var(--gold-border)':'var(--border)'}` }}>{e}</div>
                ))}
              </div>
            </div>

            {/* Categoría */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Categoría</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {CATS_OPCION.map(c => (
                  <div key={c.id} onClick={() => { setCat(c.id); setEmoji(EMOJIS_CAT[c.id]||'🎯') }} style={{
                    padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                    background:cat===c.id?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                    border:`1px solid ${cat===c.id?'var(--gold-border)':'var(--border)'}`,
                    color:cat===c.id?'var(--gold)':'var(--text3)',
                  }}>{c.label}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre de la meta</div>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Apartamento Edificio Napoli 502" style={iStyle} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Valor total (COP)</div>
                <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="Ej: 500000000" style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Ya tengo ahorrado</div>
                <input type="number" value={actual} onChange={e=>setActual(e.target.value)} placeholder="Ej: 10000000" style={iStyle} />
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha objetivo</div>
              <input type="date" value={fechaObj} onChange={e=>setFechaObj(e.target.value)} style={iStyle} />
            </div>

            {/* Financiamiento */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, cursor:'pointer' }} onClick={()=>setFinanciado(p=>!p)}>
              <div style={{ width:18, height:18, borderRadius:5, border:'1px solid var(--border)', background:financiado?'var(--gold-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--gold)' }}>{financiado&&'✓'}</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>¿Es un crédito / financiado?</div>
            </div>

            {financiado && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12, padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Cuota/mes</div>
                  <input type="number" value={cuota} onChange={e=>setCuota(e.target.value)} placeholder="Ej: 2000000" style={{ ...iStyle, fontSize:12 }} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Plazo (meses)</div>
                  <input type="number" value={plazo} onChange={e=>setPlazo(e.target.value)} placeholder="Ej: 120" style={{ ...iStyle, fontSize:12 }} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Tasa E.A. (%)</div>
                  <input type="number" value={tasa} onChange={e=>setTasa(e.target.value)} placeholder="Ej: 12.5" style={{ ...iStyle, fontSize:12 }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Notas / Detalles</div>
              <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Ej: 70m², estrato 4, piso 8, conjunto cerrado..." style={{ ...iStyle, height:60, resize:'none' }} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!nombre||!valor} className="btn-green" style={{ flex:1 }}>Guardar meta</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DEUDAS ───────────────────────────────────────────────────────────────────
function Deudas() {
  const [deudas,   setDeudas]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [tipo,     setTipo]     = useState('debo')
  const [acreedor, setAcreedor] = useState('')
  const [total,    setTotal]    = useState('')
  const [cuota,    setCuota]    = useState('')
  const [vence,    setVence]    = useState('')
  const [desc,     setDesc]     = useState('')

  // Abonos
  const [modalAbono,   setModalAbono]   = useState(null) // deuda seleccionada, o null
  const [montoAbono,   setMontoAbono]   = useState('')
  const [fechaAbono,   setFechaAbono]   = useState(new Date().toISOString().split('T')[0])
  const [notaAbono,    setNotaAbono]    = useState('')
  const [guardandoAbono, setGuardandoAbono] = useState(false)
  const [abonosAbiertos, setAbonosAbiertos] = useState(null) // id de deuda con historial visible
  const [abonosPorDeuda, setAbonosPorDeuda] = useState({})   // cache: { [deudaId]: [abonos] }
  const [cargandoAbonos, setCargandoAbonos] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('my_space_deudas').select('*').order('created_at', { ascending:false })
    if (data) setDeudas(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!acreedor||!total) return
    await supabase.from('my_space_deudas').insert({ tipo, acreedor, saldo_total:parseInt(total), cuota_mensual:parseInt(cuota||0), fecha_vencimiento:vence||null, descripcion:desc })
    setAcreedor(''); setTotal(''); setCuota(''); setVence(''); setDesc('')
    setModal(false); cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('my_space_deudas').delete().eq('id', id)
    setDeudas(prev=>prev.filter(d=>d.id!==id))
  }

  // ── Abonos ──
  const abrirAbono = (deuda) => {
    setModalAbono(deuda)
    setMontoAbono(''); setNotaAbono('')
    setFechaAbono(new Date().toISOString().split('T')[0])
  }

  const guardarAbono = async () => {
    if (!modalAbono || !montoAbono) return
    setGuardandoAbono(true)
    const monto = parseInt(montoAbono)
    const nuevoSaldo = Math.max(0, modalAbono.saldo_total - monto)

    await supabase.from('my_space_pagos_deuda').insert({
      deuda_id: modalAbono.id, monto, fecha: fechaAbono, notas: notaAbono||null,
    })
    await supabase.from('my_space_deudas').update({ saldo_total: nuevoSaldo }).eq('id', modalAbono.id)

    setDeudas(prev => prev.map(d => d.id===modalAbono.id ? { ...d, saldo_total:nuevoSaldo } : d))
    // Invalida el cache de historial de esa deuda para que se recargue al abrirlo
    setAbonosPorDeuda(prev => { const n = {...prev}; delete n[modalAbono.id]; return n })

    setGuardandoAbono(false)
    setModalAbono(null); setMontoAbono(''); setNotaAbono('')
  }

  const toggleHistorialAbonos = async (deudaId) => {
    if (abonosAbiertos === deudaId) { setAbonosAbiertos(null); return }
    setAbonosAbiertos(deudaId)
    if (!abonosPorDeuda[deudaId]) {
      setCargandoAbonos(true)
      const { data } = await supabase.from('my_space_pagos_deuda').select('*').eq('deuda_id', deudaId).order('fecha', { ascending:false })
      setAbonosPorDeuda(prev => ({ ...prev, [deudaId]: data||[] }))
      setCargandoAbonos(false)
    }
  }

  const debo    = deudas.filter(d=>d.tipo==='debo')
  const meDeben = deudas.filter(d=>d.tipo==='me_deben')
  const totalDebo    = debo.reduce((s,d)=>s+d.saldo_total,0)
  const totalMeDeben = meDeben.reduce((s,d)=>s+d.saldo_total,0)

  const renderTarjetaDeuda = (d, colorTema) => {
    const pagada = d.saldo_total <= 0
    return (
      <div key={d.id} className="panel" style={{ border:`1px solid ${pagada?'var(--green-border)':colorTema}`, opacity:pagada?0.75:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>
              {d.acreedor} {pagada && <span style={{ fontSize:10, color:'var(--green)', fontWeight:700 }}>✓ Pagada</span>}
            </div>
            {d.descripcion && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{d.descripcion}</div>}
            {d.cuota_mensual>0 && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Cuota: {cop(d.cuota_mensual)}/mes</div>}
            {d.fecha_vencimiento && <div style={{ fontSize:11, color:'var(--gold)', marginTop:2 }}>Vence: {d.fecha_vencimiento}</div>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:18, fontWeight:900, color:pagada?'var(--green)':(d.tipo==='debo'?'var(--red)':'var(--green)') }}>{cop(d.saldo_total)}</div>
            <div onClick={() => eliminar(d.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)' }}>×</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:14, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
          {!pagada && (
            <div onClick={() => abrirAbono(d)} style={{ fontSize:11, color:'var(--gold)', cursor:'pointer', fontWeight:600 }}>
              💵 {d.tipo==='debo' ? 'Abonar / Pagar' : 'Registrar pago recibido'}
            </div>
          )}
          <div onClick={() => toggleHistorialAbonos(d.id)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>
            📋 {abonosAbiertos===d.id ? 'Ocultar abonos' : 'Ver abonos'}
          </div>
        </div>
        {abonosAbiertos === d.id && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
            {cargandoAbonos ? (
              <div style={{ fontSize:12, color:'var(--text4)' }}>Cargando...</div>
            ) : (abonosPorDeuda[d.id]||[]).length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text4)' }}>Sin abonos registrados todavía</div>
            ) : (abonosPorDeuda[d.id]||[]).map(a => (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:12 }}>
                <span style={{ color:'var(--text3)' }}>{a.fecha}{a.notas ? ` · ${a.notas}` : ''}</span>
                <span style={{ color:'var(--gold)', fontWeight:700 }}>{cop(a.monto)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Deudas y créditos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Independientes — no se cruzan entre sí</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Agregar</button>
      </div>

      {/* KPIs separados */}
      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="kpi-card" style={{ border:'1px solid rgba(224,82,82,0.3)' }}>
          <div className="kpi-label">🔴 Lo que debo</div>
          <div className="kpi-val" style={{ color:'var(--red)' }}>{cop(totalDebo)}</div>
          <div className="kpi-sub">{debo.length} deudas · Sale de mi bolsillo</div>
          <div className="kpi-accent" style={{ background:'var(--red)' }} />
        </div>
        <div className="kpi-card" style={{ border:'1px solid var(--green-border)' }}>
          <div className="kpi-label">🟢 Me deben a mí</div>
          <div className="kpi-val" style={{ color:'var(--green)' }}>{cop(totalMeDeben)}</div>
          <div className="kpi-sub">{meDeben.length} créditos · Activo pendiente</div>
          <div className="kpi-accent" style={{ background:'var(--green)' }} />
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div> : (
        <>
          {/* Lo que debo */}
          {debo.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10, letterSpacing:1 }}>LO QUE DEBO</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {debo.map(d => renderTarjetaDeuda(d, 'rgba(224,82,82,0.2)'))}
              </div>
            </div>
          )}

          {/* Me deben */}
          {meDeben.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--green)', marginBottom:10, letterSpacing:1 }}>ME DEBEN A MÍ</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {meDeben.map(d => renderTarjetaDeuda(d, 'var(--green-border)'))}
              </div>
            </div>
          )}

          {deudas.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)', fontSize:13 }}>Sin deudas registradas</div>}
        </>
      )}

      {/* Modal: nueva deuda */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva deuda / crédito</div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[{id:'debo',label:'Le debo a alguien'},{id:'me_deben',label:'Me deben a mí'}].map(t => (
                <div key={t.id} onClick={() => setTipo(t.id)} style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', textAlign:'center',
                  background:tipo===t.id?(t.id==='debo'?'var(--red-dim)':'var(--green-dim)'):'rgba(255,255,255,0.04)',
                  border:`1px solid ${tipo===t.id?(t.id==='debo'?'rgba(224,82,82,0.3)':'var(--green-border)'):'var(--border)'}`,
                  color:tipo===t.id?(t.id==='debo'?'var(--red)':'var(--green)'):'var(--text3)', fontSize:11, fontWeight:600,
                }}>{t.label}</div>
              ))}
            </div>
            {[
              {label:'Nombre / Entidad', val:acreedor, set:setAcreedor, ph:'Ej: Banco, Jorge', type:'text'},
              {label:'Saldo total',      val:total,    set:setTotal,    ph:'Ej: 2900000',     type:'number'},
              {label:'Cuota mensual',    val:cuota,    set:setCuota,    ph:'Opcional',        type:'number'},
              {label:'Fecha vencimiento',val:vence,    set:setVence,    ph:'',                type:'date'},
              {label:'Descripción',      val:desc,     set:setDesc,     ph:'Ej: Datacredito, préstamo', type:'text'},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={iStyle} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={guardar} disabled={!acreedor||!total} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: abonar */}
      {modalAbono && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>
              {modalAbono.tipo==='debo' ? 'Abonar a' : 'Registrar pago de'} {modalAbono.acreedor}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Saldo actual: {cop(modalAbono.saldo_total)}</div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto del abono</div>
              <input type="number" value={montoAbono} onChange={e=>setMontoAbono(e.target.value)} placeholder="Ej: 500000" style={iStyle} autoFocus />
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div>
              <input type="date" value={fechaAbono} onChange={e=>setFechaAbono(e.target.value)} style={iStyle} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nota (opcional)</div>
              <input type="text" value={notaAbono} onChange={e=>setNotaAbono(e.target.value)} placeholder="Ej: Transferencia Bancolombia" style={iStyle} />
            </div>

            {montoAbono && (
              <div style={{ padding:'10px 14px', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', borderRadius:10, fontSize:12, color:'var(--gold)', marginBottom:16 }}>
                Nuevo saldo: {cop(Math.max(0, modalAbono.saldo_total - (parseInt(montoAbono)||0)))}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardarAbono} disabled={!montoAbono||guardandoAbono} className="btn-green" style={{ flex:1 }}>
                {guardandoAbono ? 'Guardando...' : 'Confirmar abono'}
              </button>
              <button onClick={() => setModalAbono(null)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SIMULADOR ────────────────────────────────────────────────────────────────
function Simulador() {
  const [ingresoBase,  setIngresoBase]  = useState(0)
  const [metas,        setMetas]        = useState([])
  const [negocios, setNegocios] = useState({
    zabu:   { label:'ZABÚ 🌭',        semana:0, activo:false },
    rv:     { label:'RV Sports ⚽',    semana:0, activo:false },
    bombas: { label:'Las Bombas 💣',   semana:0, activo:false },
    coco:   { label:'Coco Shake 🥥',  semana:0, activo:false },
  })
  const [gastosFijos,  setGastosFijos]  = useState(13830000) // ref inicial
  const [escenarios,   setEscenarios]   = useState([])
  const [nombreEsc,    setNombreEsc]    = useState('')
  const [guardando,    setGuardando]    = useState(false)

  useEffect(() => { cargarMetas(); cargarEscenarios() }, [])

  const cargarMetas = async () => {
    const { data } = await supabase.from('my_space_metas_v2').select('*').eq('estado','activa')
    if (data) setMetas(data)
  }

  const cargarEscenarios = async () => {
    const { data } = await supabase.from('my_space_escenarios').select('*').order('created_at', { ascending:false })
    if (data) setEscenarios(data)
  }

  const updateNeg = (id, campo, val) => setNegocios(prev=>({...prev,[id]:{...prev[id],[campo]:val}}))

  const totalNegocios  = Object.values(negocios).filter(n=>n.activo).reduce((s,n)=>s+(n.semana*4.3),0)
  const totalIngresos  = ingresoBase + totalNegocios
  const totalCuotas    = metas.filter(m=>m.cuota_mensual>0).reduce((s,m)=>s+m.cuota_mensual,0)
  const saldo          = totalIngresos - gastosFijos - totalCuotas
  const saldoAnual     = saldo * 12

  const guardarEscenario = async () => {
    if (!nombreEsc) return
    setGuardando(true)
    await supabase.from('my_space_escenarios').insert({ nombre:nombreEsc, ingreso_base:ingresoBase, negocios })
    setNombreEsc(''); setGuardando(false); cargarEscenarios()
  }

  const cargarEscenario = (esc) => {
    setIngresoBase(esc.ingreso_base||0)
    if (esc.negocios) setNegocios(esc.negocios)
  }

  const eliminarEsc = async (id) => {
    await supabase.from('my_space_escenarios').delete().eq('id', id)
    setEscenarios(prev=>prev.filter(e=>e.id!==id))
  }

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>Simulador de escenarios</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>¿Qué pasa si...? Proyecta tu futuro financiero</div>
      </div>

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
        {/* Controles */}
        <div>
          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">Ingreso base mensual</div>
            <input type="number" value={ingresoBase||''} onChange={e=>setIngresoBase(parseInt(e.target.value)||0)}
              placeholder="Salario + ingresos fijos" style={iStyle} />
            {ingresoBase>0 && <div style={{ marginTop:10, fontSize:22, fontWeight:800, color:'var(--green)', textAlign:'center' }}>{cop(ingresoBase)}</div>}
          </div>

          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">Gastos fijos mensuales (referencia)</div>
            <input type="number" value={gastosFijos||''} onChange={e=>setGastosFijos(parseInt(e.target.value)||0)}
              placeholder="Total gastos fijos" style={iStyle} />
          </div>

          <div className="panel" style={{ marginBottom:12 }}>
            <div className="panel-title">Proyección negocios</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>¿Cuánto generaría cada negocio por semana?</div>
            {Object.entries(negocios).map(([id, neg]) => (
              <div key={id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div onClick={() => updateNeg(id,'activo',!neg.activo)} style={{ width:18, height:18, borderRadius:5, cursor:'pointer', border:`1px solid ${neg.activo?'var(--green-border)':'var(--border)'}`, background:neg.activo?'var(--green-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--green)' }}>{neg.activo&&'✓'}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:neg.activo?'var(--text)':'var(--text4)' }}>{neg.label}</span>
                  {neg.activo && <span style={{ marginLeft:'auto', fontSize:12, color:'var(--gold)', fontWeight:700 }}>{cop(neg.semana*4.3)}/mes</span>}
                </div>
                {neg.activo && (
                  <>
                    <input type="range" min={0} max={5000000} step={50000} value={neg.semana}
                      onChange={e=>updateNeg(id,'semana',parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--gold)', cursor:'pointer' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text4)', marginTop:2 }}>
                      <span>$0</span>
                      <span style={{ color:'var(--gold)', fontWeight:600 }}>{cop(neg.semana)}/semana</span>
                      <span>$5M</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-title">Guardar escenario</div>
            <input type="text" value={nombreEsc} onChange={e=>setNombreEsc(e.target.value)} placeholder='Ej: "Solo Oh Wow", "ZABÚ + RV full"' style={iStyle} />
            <button onClick={guardarEscenario} disabled={!nombreEsc||guardando} className="btn-gold" style={{ width:'100%', marginTop:10 }}>
              {guardando?'Guardando...':'💾 Guardar escenario'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div>
          <div className="panel" style={{ marginBottom:12, border:`1px solid ${saldo>=0?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
            <div className="panel-title">Resultado del escenario</div>
            {[
              { label:'Ingreso base',      val:cop(ingresoBase),   color:'var(--text2)'  },
              { label:'Negocios (mes)',     val:cop(totalNegocios), color:'var(--gold)'   },
              { label:'Total ingresos',     val:cop(totalIngresos), color:'var(--green)',  bold:true },
              { label:'Gastos fijos',       val:cop(gastosFijos),  color:'var(--red)'    },
              { label:'Cuotas metas',       val:cop(totalCuotas),  color:'var(--gold)'   },
              { label:'Saldo mensual',      val:cop(saldo),        color:saldo>=0?'var(--green)':'var(--red)', bold:true },
              { label:'Proyección anual',   val:cop(saldoAnual),   color:saldoAnual>=0?'var(--gold)':'var(--red)', bold:true },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                <span style={{ fontSize:r.bold?16:13, fontWeight:r.bold?900:600, color:r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Metas con este escenario */}
          {metas.length > 0 && (
            <div className="panel" style={{ marginBottom:12 }}>
              <div className="panel-title">¿Cuándo logro mis metas?</div>
              {saldo <= 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>⚠️ Saldo negativo. Ajusta los ingresos.</div>
              ) : metas.map(m => {
                const restante = m.valor_total - m.valor_actual
                const mesesFalt = m.cuota_mensual>0 ? Math.ceil(restante/m.cuota_mensual) : saldo>0 ? Math.ceil(restante/saldo) : null
                return (
                  <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.emoji} {m.nombre}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{cop(m.valor_total)} · Falta {cop(restante)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>
                        {mesesFalt ? (mesesFalt>120?'+10 años':mesesFalt>12?`${Math.floor(mesesFalt/12)}a ${mesesFalt%12}m`:`${mesesFalt}m`) : '—'}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text4)' }}>{m.cuota_mensual>0?`${cop(m.cuota_mensual)}/mes`:'ahorrando saldo'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Escenarios guardados */}
          {escenarios.length > 0 && (
            <div className="panel">
              <div className="panel-title">Escenarios guardados</div>
              {escenarios.map(e => (
                <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{e.nombre}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => cargarEscenario(e)} className="btn" style={{ fontSize:11, padding:'4px 10px' }}>Cargar</button>
                    <div onClick={() => eliminarEsc(e.id)} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)', display:'flex', alignItems:'center' }}>×</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MY SPACE PRINCIPAL ───────────────────────────────────────────────────────
export default function MySpace() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab,      setTab]      = useState('resumen')

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />

  const TABS = [
    { id:'resumen',    label:'📊 Resumen'     },
    { id:'ingresos',   label:'💰 Ingresos'    },
    { id:'gastos',     label:'💸 Gastos'      },
    { id:'deudas',     label:'💳 Deudas'      },
    { id:'comparador', label:'🔍 Comparador'  },
    { id:'metas',      label:'🎯 Metas'       },
    { id:'simulador',  label:'🔮 Simulador'   },
  ]

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>My Space 🔐</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Centro de control financiero personal · Luis Restrepo</div>
      </div>

      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab==='resumen'    && <Resumen />}
      {tab==='ingresos'   && <Ingresos />}
      {tab==='gastos'     && <Gastos />}
      {tab==='deudas'     && <Deudas />}
      {tab==='comparador' && <Comparador />}
      {tab==='metas'      && <Metas />}
      {tab==='simulador'  && <Simulador />}
    </div>
  )
}
