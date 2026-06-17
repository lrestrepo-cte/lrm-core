// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}
const taStyle = { ...iStyle, resize:'none', lineHeight:1.6 }

const FECHA_INICIO  = '2026-06-18'
const FECHA_APERTURA = '2026-09-15'

const PISTAS = [
  { id:'producto',    label:'🌭 Producto / Receta',  color:'#C9A84C' },
  { id:'fotografia',  label:'📸 Fotografía',          color:'#E1306C' },
  { id:'expectativa', label:'📱 Expectativa / Redes', color:'#378ADD' },
  { id:'montaje',     label:'🛠️ Montaje / Carrito',  color:'#4caf50' },
  { id:'operaciones', label:'⚙️ Operaciones',        color:'#FF9800' },
  { id:'proveedores', label:'📦 Proveedores',         color:'#9C27B0' },
]

const TAREAS_INICIALES = [
  // Producto / Receta
  { pista:'producto',    nombre:'Fijar gramajes y receta final ZABÚ',     fecha_inicio:'2026-06-18', fecha_fin:'2026-06-28', estado:'pendiente', responsable:'Luis / Emelyn', orden:1 },
  { pista:'producto',    nombre:'Calcular costo real terminado',          fecha_inicio:'2026-06-22', fecha_fin:'2026-07-02', estado:'pendiente', responsable:'Luis', orden:2 },
  { pista:'producto',    nombre:'Validar tiempo de armado (<90s)',        fecha_inicio:'2026-07-01', fecha_fin:'2026-07-10', estado:'pendiente', responsable:'Emelyn', orden:3 },
  { pista:'producto',    nombre:'Pruebas piloto con clientes reales',     fecha_inicio:'2026-08-15', fecha_fin:'2026-08-30', estado:'pendiente', responsable:'Equipo', orden:4 },
  // Fotografía
  { pista:'fotografia',  nombre:'Sesión de fotos de producto (estudio)',  fecha_inicio:'2026-07-15', fecha_fin:'2026-07-20', estado:'pendiente', responsable:'Fotógrafo', orden:1 },
  { pista:'fotografia',  nombre:'Sesión cross-section (corte transversal)',fecha_inicio:'2026-07-20', fecha_fin:'2026-07-25', estado:'pendiente', responsable:'Fotógrafo', orden:2 },
  { pista:'fotografia',  nombre:'Banco de contenido para redes (30 días)',fecha_inicio:'2026-07-25', fecha_fin:'2026-08-10', estado:'pendiente', responsable:'Fotógrafo / Diseñador', orden:3 },
  // Expectativa / Redes
  { pista:'expectativa', nombre:'Crear @zabuhotdogs en Instagram y TikTok', fecha_inicio:'2026-06-20', fecha_fin:'2026-06-22', estado:'pendiente', responsable:'Emelyn', orden:1 },
  { pista:'expectativa', nombre:'Comprar dominio zabuhotdogs.com',        fecha_inicio:'2026-06-20', fecha_fin:'2026-06-22', estado:'pendiente', responsable:'Luis', orden:2 },
  { pista:'expectativa', nombre:'Contenido "detrás de cámaras" (construcción)', fecha_inicio:'2026-07-01', fecha_fin:'2026-08-30', estado:'pendiente', responsable:'Diseñador', orden:3 },
  { pista:'expectativa', nombre:'Contactar influenciadores gastronómicos locales', fecha_inicio:'2026-08-01', fecha_fin:'2026-08-20', estado:'pendiente', responsable:'Emelyn', orden:4 },
  { pista:'expectativa', nombre:'Cuenta regresiva en redes (últimos 7 días)', fecha_inicio:'2026-09-08', fecha_fin:'2026-09-14', estado:'pendiente', responsable:'Diseñador', orden:5 },
  { pista:'expectativa', nombre:'🚀 Lanzamiento — evento de apertura',     fecha_inicio:'2026-09-15', fecha_fin:'2026-09-15', estado:'pendiente', responsable:'Equipo completo', orden:6 },
  // Montaje / Carrito
  { pista:'montaje',     nombre:'Diseño y fabricación del carrito',       fecha_inicio:'2026-06-25', fecha_fin:'2026-08-05', estado:'pendiente', responsable:'Proveedor carrito', orden:1 },
  { pista:'montaje',     nombre:'Compra de equipos de cocina',            fecha_inicio:'2026-07-01', fecha_fin:'2026-07-20', estado:'pendiente', responsable:'Emelyn', orden:2 },
  { pista:'montaje',     nombre:'Diseño de uniformes',                    fecha_inicio:'2026-07-10', fecha_fin:'2026-07-25', estado:'pendiente', responsable:'Diseñador', orden:3 },
  { pista:'montaje',     nombre:'Producción de uniformes',                fecha_inicio:'2026-07-25', fecha_fin:'2026-08-15', estado:'pendiente', responsable:'Proveedor textil', orden:4 },
  { pista:'montaje',     nombre:'Montaje final del carrito en ubicación', fecha_inicio:'2026-09-05', fecha_fin:'2026-09-14', estado:'pendiente', responsable:'Equipo', orden:5 },
  // Operaciones
  { pista:'operaciones', nombre:'Definir ubicación exacta del carrito',   fecha_inicio:'2026-06-18', fecha_fin:'2026-07-05', estado:'pendiente', responsable:'Luis', orden:1 },
  { pista:'operaciones', nombre:'Trámites de permisos y legalización',    fecha_inicio:'2026-07-01', fecha_fin:'2026-08-15', estado:'pendiente', responsable:'Luis', orden:2 },
  { pista:'operaciones', nombre:'Contratar y capacitar operador',         fecha_inicio:'2026-08-01', fecha_fin:'2026-08-25', estado:'pendiente', responsable:'Luis / Emelyn', orden:3 },
  { pista:'operaciones', nombre:'Definir tasa de conversión a combo objetivo', fecha_inicio:'2026-08-15', fecha_fin:'2026-08-30', estado:'pendiente', responsable:'Luis', orden:4 },
  { pista:'operaciones', nombre:'Soft launch — prueba con público reducido', fecha_inicio:'2026-09-08', fecha_fin:'2026-09-13', estado:'pendiente', responsable:'Equipo', orden:5 },
  // Proveedores
  { pista:'proveedores', nombre:'Cotizar carrito (mín. 3 proveedores)',   fecha_inicio:'2026-06-18', fecha_fin:'2026-06-28', estado:'pendiente', responsable:'Emelyn', orden:1 },
  { pista:'proveedores', nombre:'Cotizar insumos (pan, salchicha, salsas)', fecha_inicio:'2026-06-20', fecha_fin:'2026-07-05', estado:'pendiente', responsable:'Emelyn', orden:2 },
  { pista:'proveedores', nombre:'Cotizar uniformes y empaques',           fecha_inicio:'2026-07-01', fecha_fin:'2026-07-15', estado:'pendiente', responsable:'Emelyn', orden:3 },
  { pista:'proveedores', nombre:'Cerrar contratos de suministro',         fecha_inicio:'2026-08-01', fecha_fin:'2026-08-20', estado:'pendiente', responsable:'Luis', orden:4 },
]

const PROVEEDORES_INICIALES = [
  { categoria:'Carrito',        nombre:'Por cotizar', item:'Carrito completo soldado', precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Equipos cocina', nombre:'Por cotizar', item:'Plancha + sistema de gas',  precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Insumos',        nombre:'Por cotizar', item:'Pan New England Roll',      precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Insumos',        nombre:'Por cotizar', item:'Salchicha premium',          precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Empaques',       nombre:'Por cotizar', item:'Empaques + servilletas',     precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Uniformes',      nombre:'Por cotizar', item:'Uniformes (2 sets x persona)', precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
  { categoria:'Branding',       nombre:'Por cotizar', item:'Diseño de marca + fotografía', precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' },
]

const MONTAJE_INICIALES = [
  { categoria:'Uniforme', nombre:'Gorra ZABÚ', cantidad:2, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Uniforme', nombre:'Camiseta / polo ZABÚ', cantidad:4, estado:'pendiente', costo_estimado:0, notas:'2 por persona' },
  { categoria:'Uniforme', nombre:'Delantal', cantidad:2, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Utensilio', nombre:'Pinzas de cocina', cantidad:4, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Utensilio', nombre:'Tablas de picar', cantidad:3, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Utensilio', nombre:'Cuchillos profesionales', cantidad:3, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Utensilio', nombre:'Recipientes GN (salsas)', cantidad:6, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Utensilio', nombre:'Dispensadores de salsa', cantidad:4, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Equipo', nombre:'Plancha', cantidad:1, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Equipo', nombre:'Sistema de gas', cantidad:1, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Equipo', nombre:'Nevera / hielera profesional', cantidad:1, estado:'pendiente', costo_estimado:0, notas:'' },
  { categoria:'Carrito', nombre:'Carrito completo', cantidad:1, estado:'pendiente', costo_estimado:0, notas:'' },
]

const REDES_INICIALES = [
  { red:'Instagram', usuario:'@zabuhotdogs', dominio:'', estado:'por_crear', frecuencia_posteo:'Diaria — 1 post + 2-3 historias', tipo_contenido:'Cross-section reveal, proceso, UGC, storytelling', horario_optimo:'12:00m - 1:30pm y 7:00pm - 9:00pm', metricas_clave:'Saves, shares, alcance, comentarios', meta_seguidores_mes1:500, notas:'' },
  { red:'TikTok',    usuario:'@zabuhotdogs', dominio:'', estado:'por_crear', frecuencia_posteo:'1 video diario mínimo',           tipo_contenido:'Char/smoke/flame, step-by-step 15-30s, detrás de cámaras', horario_optimo:'6:00pm - 10:00pm', metricas_clave:'Vistas completas, shares, comentarios, sonido usado', meta_seguidores_mes1:1000, notas:'Prioridad — mayor alcance orgánico en 2026' },
  { red:'Meta (Facebook)', usuario:'ZABÚ Hot Dogs', dominio:'', estado:'por_crear', frecuencia_posteo:'3-4 veces por semana',    tipo_contenido:'Repost de Reels, promociones, eventos', horario_optimo:'11:00am - 1:00pm', metricas_clave:'Alcance, clics a ubicación, reseñas', meta_seguidores_mes1:300, notas:'Útil para reseñas de Google/Maps y público mayor' },
  { red:'Dominio web', usuario:'zabuhotdogs.com', dominio:'zabuhotdogs.com', estado:'por_comprar', frecuencia_posteo:'—', tipo_contenido:'Landing de marca, menú, ubicación', horario_optimo:'—', metricas_clave:'Visitas, clics a WhatsApp', meta_seguidores_mes1:0, notas:'Comprar antes de imprimir cualquier material con el dominio' },
]

// ─── helper de fechas para el Gantt ───────────────────────────────────────────
function diasEntre(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000) }
function semanasRango(inicio, fin) {
  const semanas = []
  let cur = new Date(inicio)
  while (cur <= new Date(fin)) {
    semanas.push(new Date(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return semanas
}

function cuentaRegresiva() {
  const hoy = new Date()
  const apertura = new Date(FECHA_APERTURA)
  const dias = Math.max(0, Math.ceil((apertura - hoy) / 86400000))
  const semanas = Math.floor(dias / 7)
  const diasResto = dias % 7
  return { dias, semanas, diasResto }
}

// ════════════════════════════════════════════════════════════════════════════
// GANTT VISUAL
// ════════════════════════════════════════════════════════════════════════════
function Gantt({ tareas, onUpdate, onDelete, onAdd }) {
  const totalDias = diasEntre(FECHA_INICIO, FECHA_APERTURA)
  const semanas = semanasRango(FECHA_INICIO, FECHA_APERTURA)
  const ESTADO_COLOR = { pendiente:'var(--text4)', en_curso:'var(--blue)', completada:'var(--green)', bloqueada:'var(--red)' }

  const tareasPorPista = (pistaId) => tareas.filter(t=>t.pista===pistaId).sort((a,b)=>a.orden-b.orden)

  return (
    <div>
      <div style={{ overflowX:'auto', paddingBottom:8 }}>
        <div style={{ minWidth:900 }}>
          {/* Header de semanas */}
          <div style={{ display:'flex', marginBottom:8, paddingLeft:180 }}>
            {semanas.map((s,i) => (
              <div key={i} style={{ flex:1, minWidth:60, fontSize:9, color:'var(--text4)', textAlign:'center', borderLeft:'1px solid var(--border)', padding:'2px 0' }}>
                {s.toLocaleDateString('es-CO',{day:'2-digit',month:'short'})}
              </div>
            ))}
          </div>

          {PISTAS.map(pista => {
            const tareasP = tareasPorPista(pista.id)
            return (
              <div key={pista.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:pista.color }}>{pista.label}</div>
                  <div onClick={()=>onAdd(pista.id)} style={{ fontSize:11, color:pista.color, cursor:'pointer' }}>+ tarea</div>
                </div>
                {tareasP.length === 0 && <div style={{ fontSize:11, color:'var(--text4)', paddingLeft:180, marginBottom:6 }}>Sin tareas en esta pista</div>}
                {tareasP.map(t => {
                  const offsetDias = Math.max(0, diasEntre(FECHA_INICIO, t.fecha_inicio))
                  const durDias    = Math.max(1, diasEntre(t.fecha_inicio, t.fecha_fin))
                  const leftPct    = (offsetDias / totalDias) * 100
                  const widthPct   = (durDias / totalDias) * 100
                  const colorEstado = ESTADO_COLOR[t.estado] || 'var(--text4)'
                  return (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', marginBottom:4, position:'relative', height:28 }}>
                      <div style={{ width:180, fontSize:11, color:'var(--text2)', paddingRight:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }} title={t.nombre}>
                        {t.nombre}
                      </div>
                      <div style={{ flex:1, position:'relative', height:20, background:'rgba(255,255,255,0.03)', borderRadius:4 }}>
                        <div
                          onClick={() => {
                            const next = t.estado==='pendiente'?'en_curso':t.estado==='en_curso'?'completada':t.estado==='completada'?'bloqueada':'pendiente'
                            onUpdate(t.id, 'estado', next)
                          }}
                          title={`${t.fecha_inicio} → ${t.fecha_fin} · ${t.responsable||''} (click para cambiar estado)`}
                          style={{
                            position:'absolute', left:`${leftPct}%`, width:`${Math.max(widthPct,2)}%`, height:20, borderRadius:5, cursor:'pointer',
                            background:`${colorEstado}30`, border:`1px solid ${colorEstado}`, display:'flex', alignItems:'center', paddingLeft:6,
                          }}>
                          <span style={{ fontSize:9, color:colorEstado, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden' }}>{t.responsable}</span>
                        </div>
                      </div>
                      <div onClick={()=>onDelete(t.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:13, marginLeft:8, flexShrink:0 }}>×</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'flex', gap:14, marginTop:16, flexWrap:'wrap' }}>
        {Object.entries(ESTADO_COLOR).map(([k,c]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
            <div style={{ width:10, height:10, borderRadius:3, background:`${c}30`, border:`1px solid ${c}` }} />
            {k==='pendiente'?'Pendiente':k==='en_curso'?'En curso':k==='completada'?'Completada':'Bloqueada'}
          </div>
        ))}
        <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Click en la barra para cambiar el estado</div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ZabuCampanaApertura() {
  const [tab, setTab]               = useState('gantt')
  const [tareas, setTareas]         = useState([])
  const [proveedores, setProveedores] = useState([])
  const [montaje, setMontaje]       = useState([])
  const [redes, setRedes]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [pistaModal, setPistaModal] = useState(null)
  const [nuevaTarea, setNuevaTarea] = useState({ nombre:'', fecha_inicio:FECHA_INICIO, fecha_fin:FECHA_APERTURA, responsable:'' })

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data:t }, { data:p }, { data:m }, { data:r }] = await Promise.all([
      supabase.from('zabu_campana_tareas').select('*').order('orden'),
      supabase.from('zabu_proveedores').select('*').order('created_at'),
      supabase.from('zabu_montaje_items').select('*').order('created_at'),
      supabase.from('zabu_redes_config').select('*').order('red'),
    ])

    if (t && t.length > 0) setTareas(t)
    else { await supabase.from('zabu_campana_tareas').insert(TAREAS_INICIALES); const { data:t2 } = await supabase.from('zabu_campana_tareas').select('*').order('orden'); setTareas(t2||[]) }

    if (p && p.length > 0) setProveedores(p)
    else { await supabase.from('zabu_proveedores').insert(PROVEEDORES_INICIALES); const { data:p2 } = await supabase.from('zabu_proveedores').select('*'); setProveedores(p2||[]) }

    if (m && m.length > 0) setMontaje(m)
    else { await supabase.from('zabu_montaje_items').insert(MONTAJE_INICIALES); const { data:m2 } = await supabase.from('zabu_montaje_items').select('*'); setMontaje(m2||[]) }

    if (r && r.length > 0) setRedes(r)
    else { await supabase.from('zabu_redes_config').insert(REDES_INICIALES); const { data:r2 } = await supabase.from('zabu_redes_config').select('*'); setRedes(r2||[]) }

    setLoading(false)
  }

  // ── Tareas Gantt ──
  const actualizarTarea = async (id, campo, valor) => {
    setTareas(prev => prev.map(t => t.id===id ? { ...t, [campo]:valor } : t))
    await supabase.from('zabu_campana_tareas').update({ [campo]: valor }).eq('id', id)
  }
  const eliminarTarea = async (id) => {
    setTareas(prev => prev.filter(t => t.id !== id))
    await supabase.from('zabu_campana_tareas').delete().eq('id', id)
  }
  const agregarTarea = (pistaId) => { setPistaModal(pistaId); setNuevaTarea({ nombre:'', fecha_inicio:FECHA_INICIO, fecha_fin:FECHA_APERTURA, responsable:'' }) }
  const confirmarNuevaTarea = async () => {
    if (!nuevaTarea.nombre) return
    const orden = tareas.filter(t=>t.pista===pistaModal).length + 1
    const { data, error } = await supabase.from('zabu_campana_tareas').insert({ pista:pistaModal, ...nuevaTarea, estado:'pendiente', orden }).select().single()
    if (!error && data) setTareas(prev => [...prev, data])
    setPistaModal(null)
  }

  // ── Proveedores ──
  const actualizarProveedor = async (id, campo, valor) => {
    setProveedores(prev => prev.map(p => p.id===id ? { ...p, [campo]:valor } : p))
    await supabase.from('zabu_proveedores').update({ [campo]: valor }).eq('id', id)
  }
  const eliminarProveedor = async (id) => { setProveedores(prev=>prev.filter(p=>p.id!==id)); await supabase.from('zabu_proveedores').delete().eq('id', id) }
  const agregarProveedor = async (categoria) => {
    const { data, error } = await supabase.from('zabu_proveedores').insert({ categoria, nombre:'Nuevo proveedor', item:'', precio:0, tiempo_entrega:'', condiciones_pago:'', contacto:'', telefono:'', ganador:false, notas:'' }).select().single()
    if (!error && data) setProveedores(prev => [...prev, data])
  }
  const marcarGanador = async (id, categoria) => {
    setProveedores(prev => prev.map(p => p.categoria===categoria ? { ...p, ganador: p.id===id } : p))
    await supabase.from('zabu_proveedores').update({ ganador:false }).eq('categoria', categoria)
    await supabase.from('zabu_proveedores').update({ ganador:true }).eq('id', id)
  }

  // ── Montaje ──
  const actualizarMontaje = async (id, campo, valor) => {
    setMontaje(prev => prev.map(m => m.id===id ? { ...m, [campo]:valor } : m))
    await supabase.from('zabu_montaje_items').update({ [campo]: valor }).eq('id', id)
  }
  const eliminarMontaje = async (id) => { setMontaje(prev=>prev.filter(m=>m.id!==id)); await supabase.from('zabu_montaje_items').delete().eq('id', id) }
  const agregarMontaje = async (categoria) => {
    const { data, error } = await supabase.from('zabu_montaje_items').insert({ categoria, nombre:'Nuevo item', cantidad:1, estado:'pendiente', costo_estimado:0, notas:'' }).select().single()
    if (!error && data) setMontaje(prev => [...prev, data])
  }

  // ── Redes ──
  const actualizarRed = async (id, campo, valor) => {
    setRedes(prev => prev.map(r => r.id===id ? { ...r, [campo]:valor } : r))
    await supabase.from('zabu_redes_config').update({ [campo]: valor }).eq('id', id)
  }

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>Cargando campaña desde Supabase...</div>

  const { dias, semanas, diasResto } = cuentaRegresiva()
  const totalTareas = tareas.length
  const completadas = tareas.filter(t=>t.estado==='completada').length
  const enCurso      = tareas.filter(t=>t.estado==='en_curso').length
  const bloqueadas   = tareas.filter(t=>t.estado==='bloqueada').length
  const pctAvance    = totalTareas>0 ? Math.round((completadas/totalTareas)*100) : 0

  const TABS = [
    { id:'gantt',       label:'📅 Gantt' },
    { id:'proveedores', label:'📦 Proveedores' },
    { id:'montaje',     label:'🛠️ Montaje' },
    { id:'redes',       label:'📱 Redes' },
  ]

  const ESTADO_MONTAJE_COLOR = { pendiente:'var(--text4)', cotizado:'var(--blue)', comprado:'var(--gold)', recibido:'var(--green)' }
  const CATEGORIAS_PROV = [...new Set(proveedores.map(p=>p.categoria))]
  const CATEGORIAS_MONTAJE = [...new Set(montaje.map(m=>m.categoria))]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ fontSize:28 }}>🚀</div>
          <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>Campaña de Apertura ZABÚ</div>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>18 junio → 15 septiembre 2026 · Conectado a Supabase</div>
      </div>

      {/* Cuenta regresiva + avance */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        <div className="kpi-card" style={{ border:'1px solid var(--gold-border)' }}>
          <div className="kpi-label">⏳ Faltan para la apertura</div>
          <div className="kpi-val" style={{ color:'var(--gold)', fontSize:24 }}>{dias} días</div>
          <div className="kpi-sub">{semanas} semanas y {diasResto} días · 15 sept 2026</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avance general</div>
          <div className="kpi-val" style={{ color:'var(--green)' }}>{pctAvance}%</div>
          <div className="kpi-sub">{completadas} de {totalTareas} tareas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En curso</div>
          <div className="kpi-val" style={{ color:'var(--blue)' }}>{enCurso}</div>
          <div className="kpi-sub">tareas activas ahora</div>
        </div>
        <div className="kpi-card" style={{ border: bloqueadas>0 ? '1px solid rgba(224,82,82,0.4)' : undefined }}>
          <div className="kpi-label">Bloqueadas</div>
          <div className="kpi-val" style={{ color: bloqueadas>0 ? 'var(--red)' : 'var(--text3)' }}>{bloqueadas}</div>
          <div className="kpi-sub">{bloqueadas>0 ? '⚠️ requieren atención' : 'sin bloqueos'}</div>
        </div>
      </div>

      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {/* GANTT */}
      {tab==='gantt' && (
        <Gantt tareas={tareas} onUpdate={actualizarTarea} onDelete={eliminarTarea} onAdd={agregarTarea} />
      )}

      {/* PROVEEDORES */}
      {tab==='proveedores' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Comparativo de proveedores</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Marca el proveedor ganador por categoría con la estrella ⭐</div>
          {CATEGORIAS_PROV.map(cat => {
            const provs = proveedores.filter(p=>p.categoria===cat)
            return (
              <div key={cat} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cat}</div>
                  <div onClick={()=>agregarProveedor(cat)} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar opción</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {provs.map(p => (
                    <div key={p.id} className="panel" style={{ border: p.ganador ? '1px solid var(--green-border)' : '1px solid var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <div onClick={()=>marcarGanador(p.id, cat)} style={{ cursor:'pointer', fontSize:18, color: p.ganador?'var(--green)':'var(--text4)' }}>{p.ganador?'⭐':'☆'}</div>
                        <input type="text" value={p.nombre} onChange={e=>actualizarProveedor(p.id,'nombre',e.target.value)} style={{...iStyle,marginTop:0,flex:1,fontWeight:700}} />
                        <input type="text" value={p.item} onChange={e=>actualizarProveedor(p.id,'item',e.target.value)} placeholder="Item / descripción" style={{...iStyle,marginTop:0,flex:1.5}} />
                        <input type="number" value={p.precio} onChange={e=>actualizarProveedor(p.id,'precio',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:0,width:130,fontWeight:700,color:'var(--gold)'}} />
                        <div onClick={()=>eliminarProveedor(p.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14 }}>×</div>
                      </div>
                      <div className="grid-4" style={{ gap:8 }}>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text4)' }}>Tiempo entrega</div>
                          <input type="text" value={p.tiempo_entrega||''} onChange={e=>actualizarProveedor(p.id,'tiempo_entrega',e.target.value)} placeholder="Ej: 15 días" style={{...iStyle,marginTop:2,fontSize:11}} />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text4)' }}>Condiciones de pago</div>
                          <input type="text" value={p.condiciones_pago||''} onChange={e=>actualizarProveedor(p.id,'condiciones_pago',e.target.value)} placeholder="Ej: 50% anticipo" style={{...iStyle,marginTop:2,fontSize:11}} />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text4)' }}>Contacto</div>
                          <input type="text" value={p.contacto||''} onChange={e=>actualizarProveedor(p.id,'contacto',e.target.value)} placeholder="Nombre" style={{...iStyle,marginTop:2,fontSize:11}} />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text4)' }}>Teléfono</div>
                          <input type="text" value={p.telefono||''} onChange={e=>actualizarProveedor(p.id,'telefono',e.target.value)} placeholder="+57 300..." style={{...iStyle,marginTop:2,fontSize:11}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MONTAJE */}
      {tab==='montaje' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Uniformes, utensilios y equipos</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Checklist de todo lo que hay que comprar antes del montaje</div>
          {CATEGORIAS_MONTAJE.map(cat => {
            const items = montaje.filter(m=>m.categoria===cat)
            const totalCat = items.reduce((s,i)=>s+(i.costo_estimado*i.cantidad),0)
            return (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cat} <span style={{ fontSize:11, color:'var(--text4)', fontWeight:400 }}>· {cop(totalCat)}</span></div>
                  <div onClick={()=>agregarMontaje(cat)} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {items.map(m => (
                    <div key={m.id} className="panel" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="text" value={m.nombre} onChange={e=>actualizarMontaje(m.id,'nombre',e.target.value)} style={{...iStyle,marginTop:0,flex:1.5,fontWeight:600}} />
                      <input type="number" value={m.cantidad} onChange={e=>actualizarMontaje(m.id,'cantidad',parseInt(e.target.value)||1)} style={{...iStyle,marginTop:0,width:70}} />
                      <input type="number" value={m.costo_estimado} onChange={e=>actualizarMontaje(m.id,'costo_estimado',parseInt(e.target.value)||0)} placeholder="Costo unit." style={{...iStyle,marginTop:0,width:120,color:'var(--gold)'}} />
                      <select value={m.estado} onChange={e=>actualizarMontaje(m.id,'estado',e.target.value)} style={{...iStyle,marginTop:0,width:120,color:ESTADO_MONTAJE_COLOR[m.estado]}}>
                        <option value="pendiente">Pendiente</option><option value="cotizado">Cotizado</option><option value="comprado">Comprado</option><option value="recibido">Recibido</option>
                      </select>
                      <input type="text" value={m.notas||''} onChange={e=>actualizarMontaje(m.id,'notas',e.target.value)} placeholder="Notas" style={{...iStyle,marginTop:0,flex:1,fontSize:11,color:'var(--text3)'}} />
                      <div onClick={()=>eliminarMontaje(m.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14 }}>×</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:700 }}>TOTAL ESTIMADO MONTAJE</span>
              <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(montaje.reduce((s,i)=>s+(i.costo_estimado*i.cantidad),0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* REDES */}
      {tab==='redes' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Comportamiento de redes sociales</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Frecuencia, tipo de contenido, horario y métricas por red</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {redes.map(r => (
              <div key={r.id} className="panel">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <input type="text" value={r.red} onChange={e=>actualizarRed(r.id,'red',e.target.value)} style={{...iStyle,marginTop:0,width:160,fontWeight:800,fontSize:14,color:'var(--gold)'}} />
                  <input type="text" value={r.usuario||''} onChange={e=>actualizarRed(r.id,'usuario',e.target.value)} placeholder="@usuario" style={{...iStyle,marginTop:0,flex:1}} />
                  <select value={r.estado} onChange={e=>actualizarRed(r.id,'estado',e.target.value)} style={{...iStyle,marginTop:0,width:140}}>
                    <option value="por_crear">Por crear</option><option value="por_comprar">Por comprar</option><option value="creado">Creado</option><option value="activo">Activo</option>
                  </select>
                </div>
                <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Frecuencia de posteo</div>
                    <input type="text" value={r.frecuencia_posteo||''} onChange={e=>actualizarRed(r.id,'frecuencia_posteo',e.target.value)} style={{...iStyle,marginTop:4}} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Horario óptimo</div>
                    <input type="text" value={r.horario_optimo||''} onChange={e=>actualizarRed(r.id,'horario_optimo',e.target.value)} style={{...iStyle,marginTop:4}} />
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Tipo de contenido</div>
                  <textarea value={r.tipo_contenido||''} onChange={e=>actualizarRed(r.id,'tipo_contenido',e.target.value)} style={{...taStyle,height:40,fontSize:12}} />
                </div>
                <div className="grid-2" style={{ gap:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Métricas clave</div>
                    <input type="text" value={r.metricas_clave||''} onChange={e=>actualizarRed(r.id,'metricas_clave',e.target.value)} style={{...iStyle,marginTop:4}} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Meta seguidores mes 1</div>
                    <input type="number" value={r.meta_seguidores_mes1||0} onChange={e=>actualizarRed(r.id,'meta_seguidores_mes1',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:4,fontWeight:700,color:'var(--gold)'}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nueva tarea */}
      {pistaModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:420, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva tarea — {PISTAS.find(p=>p.id===pistaModal)?.label}</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre de la tarea</div>
              <input type="text" value={nuevaTarea.nombre} onChange={e=>setNuevaTarea(p=>({...p,nombre:e.target.value}))} style={iStyle} />
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha inicio</div>
                <input type="date" value={nuevaTarea.fecha_inicio} onChange={e=>setNuevaTarea(p=>({...p,fecha_inicio:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha fin</div>
                <input type="date" value={nuevaTarea.fecha_fin} onChange={e=>setNuevaTarea(p=>({...p,fecha_fin:e.target.value}))} style={iStyle} />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Responsable</div>
              <input type="text" value={nuevaTarea.responsable} onChange={e=>setNuevaTarea(p=>({...p,responsable:e.target.value}))} placeholder="Ej: Luis, Emelyn, Proveedor..." style={iStyle} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={confirmarNuevaTarea} disabled={!nuevaTarea.nombre} className="btn-green" style={{ flex:1 }}>Agregar tarea</button>
              <button onClick={() => setPistaModal(null)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
