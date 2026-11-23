// @ts-nocheck
// LRM Trade Consulting · CRM
// Tablero de prospectos (arrastrar entre etapas), lista, pitches y enganches por nicho,
// y la ficha de cada cliente con su historial de contactos, cargas y saldo.
// Tablas: lrm_clientes, lrm_contactos, lrm_cargas, lrm_movimientos, lrm_ajustes (clave 'pitches')
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { PITCHES_LRM, ETAPAS_PITCH, PUBLICOS_PITCH, unirPitches } from './pitchesLRM'
import { cobroCarga } from './tarifasLRM'
import { linkRastreo, urlPublica } from './datosLRM'
import { FUENTES } from './marketingLRM'

export const NICHOS_LRM = ['Perfumes','Cosméticos','Celulares','Computadores','Tablets','Electrónica','Electrodomésticos','Relojes','Accesorios','Ropa y calzado','Partes y repuestos','Mercancía doméstica','Otro']
// Un cliente puede comprar varias cosas: se guardan juntas en el mismo campo, separadas por coma
export const nichosDe = c => String(c?.nicho || '').split(',').map(n => n.trim()).filter(Boolean)
export const nichoPrincipal = (c, validos) => nichosDe(c).find(n => !validos || validos.includes(n)) || null

export const ESTADOS_CLIENTE = [
  { id:'prospecto',    nombre:'Prospecto',         color:'#8A8F98' },
  { id:'conversacion', nombre:'En conversación',   color:'#C9A84C' },
  { id:'propuesta',    nombre:'Propuesta enviada', color:'#378ADD' },
  { id:'activo',       nombre:'Cliente activo',    color:'#4caf50' },
  { id:'perdido',      nombre:'Perdido',           color:'#e05252' },
]
const ORIGENES = ['Estados Unidos','China','Panamá']
const TIPOS_CONTACTO = [
  { id:'whatsapp', nombre:'WhatsApp', icono:'💬' },
  { id:'llamada',  nombre:'Llamada',  icono:'📞' },
  { id:'reunion',  nombre:'Reunión',  icono:'🤝' },
  { id:'correo',   nombre:'Correo',   icono:'✉️' },
]

const iStyle = {
  width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)',
  border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4,
}
const FORM_VACIO = { fuente:'', ciudad:'', nombre:'', empresa:'', telefono:'', correo:'', nicho:'Otro', estado:'prospecto', proxima_accion:'', fecha_accion:'', origen:'Estados Unidos', volumen_mes:'', tarifa:'', referido_por:'', notas:'', valor_mes:'', codigo:'', tarifa_kg:'' }
const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const millones = n => '$' + (Math.abs(n || 0) / 1e6).toLocaleString('es-CO', { maximumFractionDigits:1 }) + ' M'

export const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone:'America/Bogota' })
const estadoDe = (id) => ESTADOS_CLIENTE.find(e => e.id === id) || ESTADOS_CLIENTE[0]

export function fechaCorta(iso) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('es-CO', { day:'numeric', month:'short' })
}

export function linkWhatsApp(tel, nombre, texto) {
  const num = (tel || '').replace(/\D/g, '')
  if (!num) return null
  const conPais = num.length === 10 ? '57' + num : num
  const txt = encodeURIComponent(texto || `Hola ${nombre?.split(' ')[0] || ''}, te escribe Luis de LRM Trade Consulting.`)
  return `https://wa.me/${conPais}?text=${txt}`
}
const conNombre = (texto, nombre) => texto.replace(/\{nombre\}/g, (nombre || '').split(' ')[0] || '')

// ══════════════════════════════════════════════════════════════════════════
export default function LRMClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorTabla, setErrorTabla] = useState(false)
  const [vista, setVista] = useState('tablero')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [ficha, setFicha] = useState(null)

  const cargar = async () => {
    const { data, error } = await supabase.from('lrm_clientes').select('*').order('created_at', { ascending:false })
    if (error) setErrorTabla(true)
    else { setClientes(data || []); setErrorTabla(false) }
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const abrirNuevo  = (estado = 'prospecto') => { setEditando(null); setForm({ ...FORM_VACIO, estado }); setModal(true) }
  const abrirEditar = (c) => {
    setEditando(c); setConfirmarBorrar(false)
    setForm(Object.fromEntries(Object.keys(FORM_VACIO).map(k => [k, c[k] ?? ''])))
    setModal(true)
  }
  const guardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    const payload = { ...form, fecha_accion: form.fecha_accion || null, valor_mes: Number(String(form.valor_mes).replace(/\D/g, '')) || 0, tarifa_kg: Number(String(form.tarifa_kg).replace(/\D/g, '')) || 0, codigo: String(form.codigo || '').trim() || null }
    // fuente y ciudad son del SQL 23: si están vacías no se mandan; si la base aún no las tiene, se guarda sin ellas
    if (!payload.fuente) delete payload.fuente
    if (!payload.ciudad) delete payload.ciudad
    const enviar = d => editando ? supabase.from('lrm_clientes').update(d).eq('id', editando.id) : supabase.from('lrm_clientes').insert(d)
    const r = await enviar(payload)
    if (r.error && /fuente|ciudad/.test(r.error.message)) { const { fuente, ciudad, ...sin } = payload; await enviar(sin) }
    setGuardando(false); setModal(false); cargar()
    if (editando && ficha?.id === editando.id) setFicha({ ...editando, ...payload })
  }
  const cambiarEstado = async (c, estado) => {
    if (c.estado === estado) return
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, estado } : x))
    await supabase.from('lrm_clientes').update({ estado }).eq('id', c.id)
  }
  const eliminar = async (c) => {
    if (!confirmarBorrar) { setConfirmarBorrar(true); return }
    setConfirmarBorrar(false)
    await supabase.from('lrm_clientes').delete().eq('id', c.id)
    setClientes(prev => prev.filter(x => x.id !== c.id)); setModal(false); setFicha(null)
  }

  const hoy = hoyISO()
  const enJuego = clientes.filter(c => c.estado !== 'perdido')
  const kpis = [
    { label:'Clientes activos',   val:clientes.filter(c => c.estado === 'activo').length,  color:'var(--green)' },
    { label:'En proceso',         val:clientes.filter(c => ['prospecto','conversacion','propuesta'].includes(c.estado)).length, color:'var(--gold)' },
    { label:'Acciones para hoy',  val:enJuego.filter(c => c.fecha_accion === hoy).length, color:'var(--text)' },
    { label:'Acciones atrasadas', val:enJuego.filter(c => c.fecha_accion && c.fecha_accion < hoy).length, color:'var(--red)' },
  ]

  if (errorTabla) return (
    <div className="panel" style={{ fontSize:13, color:'var(--gold)', lineHeight:1.7 }}>
      Falta crear la tabla de clientes en Supabase. Corre <b>LRM_TRADE_TODO.sql</b> en Supabase → SQL Editor y vuelve a abrir esta pestaña.
    </div>
  )

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:12, marginBottom:16 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:16 }}>
        <div style={{ display:'flex', gap:4, padding:4, borderRadius:12, background:'var(--bg3)', border:'1px solid var(--border)' }}>
          {[['tablero','Tablero'],['lista','Lista'],['pitches','Pitches y enganches']].map(([id, l]) => (
            <button key={id} onClick={() => setVista(id)} style={{ padding:'7px 14px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700,
              background: vista === id ? 'var(--gold)' : 'transparent', color: vista === id ? '#111' : 'var(--text3)' }}>{l}</button>
          ))}
        </div>
        {vista !== 'pitches' && <button onClick={() => abrirNuevo()} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo cliente</button>}
      </div>

      {cargando ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
        : vista === 'tablero' ? <Tablero clientes={clientes} onMover={cambiarEstado} onAbrir={setFicha} onNuevo={abrirNuevo} />
        : vista === 'lista'   ? <Lista clientes={clientes} onAbrir={setFicha} onEditar={abrirEditar} onEstado={cambiarEstado} />
        : <Pitches clientes={clientes} />}

      {ficha && !modal && <Ficha cliente={clientes.find(c => c.id === ficha.id) || ficha} onCerrar={() => setFicha(null)} onEditar={abrirEditar} onEstado={cambiarEstado} onCambio={cargar} />}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:120, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:24, width:'100%', maxWidth:520, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</div>
            <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>¿Cómo llegó?</div>
                <select id="cli-fuente" value={form.fuente || ''} onChange={e => setForm(p => ({ ...p, fuente:e.target.value }))} style={iStyle}>
                  <option value="">—</option>{Object.entries(FUENTES).map(([k, f]) => <option key={k} value={k}>{f.icono} {f.l}</option>)}
                </select></div>
              {[['nombre','Nombre *'],['empresa','Empresa'],['telefono','WhatsApp'],['correo','Correo'],['ciudad','Ciudad'],['referido_por','Referido por']].map(([k,l]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                  <input id={`cli-${k}`} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]:e.target.value }))} style={iStyle} /></div>
              ))}
              <div style={{ gridColumn:'1 / -1' }}><div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Qué compra <span style={{ color:'var(--text4)' }}>(puedes marcar varios; el primero es el principal)</span></div>
                <div id="cli-nichos" style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {NICHOS_LRM.map(n => {
                    const sel = nichosDe(form), i = sel.indexOf(n)
                    const toggle = () => setForm(p => { const a = nichosDe(p); return { ...p, nicho: (a.includes(n) ? a.filter(x => x !== n) : [...a.filter(x => x !== 'Otro' || n === 'Otro'), n]).join(', ') } })
                    return <button key={n} type="button" onClick={toggle} className={i >= 0 ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 11px', width:'auto', flex:'none' }}>{i === 0 && sel.length > 1 ? '★ ' : i >= 0 ? '✓ ' : ''}{n}</button>
                  })}
                </div></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Estado</div>
                <select id="cli-estado" value={form.estado} onChange={e => setForm(p => ({ ...p, estado:e.target.value }))} style={iStyle}>
                  {ESTADOS_CLIENTE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Origen de la carga</div>
                <select id="cli-origen" value={form.origen} onChange={e => setForm(p => ({ ...p, origen:e.target.value }))} style={iStyle}>
                  {ORIGENES.map(o => <option key={o}>{o}</option>)}
                </select></div>
              {[['volumen_mes','Volumen al mes'],['tarifa','Tarifa (nota)']].map(([k,l]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                  <input id={`cli-${k}`} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]:e.target.value }))} style={iStyle} /></div>
              ))}
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Le cobras por kg (COP)</div>
                <input id="cli-tarifa-kg" inputMode="numeric" value={form.tarifa_kg} onChange={e => setForm(p => ({ ...p, tarifa_kg:e.target.value }))} placeholder="20000" style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Lo que te deja al mes (COP)</div>
                <input id="cli-valor" inputMode="numeric" value={form.valor_mes} onChange={e => setForm(p => ({ ...p, valor_mes:e.target.value }))} placeholder="2000000" style={iStyle} /></div>
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Próxima acción</div>
                <input id="cli-accion" value={form.proxima_accion} onChange={e => setForm(p => ({ ...p, proxima_accion:e.target.value }))} placeholder="Ej: mandarle cotización" style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div>
                <input id="cli-fecha" type="date" value={form.fecha_accion} onChange={e => setForm(p => ({ ...p, fecha_accion:e.target.value }))} style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:16 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
              <textarea id="cli-notas" value={form.notas} onChange={e => setForm(p => ({ ...p, notas:e.target.value }))} style={{ ...iStyle, minHeight:70, resize:'vertical' }} /></div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.nombre.trim() || guardando} className="btn-green" style={{ flex:1 }}>{guardando ? 'Guardando…' : 'Guardar'}</button>
              <button onClick={() => setModal(false)} className="btn">Cancelar</button>
            </div>
            {editando && (
              <div onClick={() => eliminar(editando)} style={{ fontSize:11, color:'var(--red)', cursor:'pointer', marginTop:14, textAlign:'center' }}>{confirmarBorrar ? '¿Seguro? Toca otra vez para eliminar' : 'Eliminar cliente'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tablero: columnas por etapa, se arrastra la tarjeta para cambiarla ───────
function Tablero({ clientes, onMover, onAbrir, onNuevo }) {
  const [sobre, setSobre] = useState(null)
  const hoy = hoyISO()
  return (
    <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, alignItems:'flex-start' }}>
      {ESTADOS_CLIENTE.map(e => {
        const lista = clientes.filter(c => c.estado === e.id).sort((a, b) => (a.fecha_accion || '9999').localeCompare(b.fecha_accion || '9999'))
        const total = lista.reduce((s, c) => s + Number(c.valor_mes || 0), 0)
        return (
          <div key={e.id}
            onDragOver={ev => { ev.preventDefault(); setSobre(e.id) }} onDragLeave={() => setSobre(null)}
            onDrop={ev => { ev.preventDefault(); setSobre(null); const c = clientes.find(x => x.id === ev.dataTransfer.getData('text/plain')); if (c) onMover(c, e.id) }}
            style={{ flex:'0 0 240px', minHeight:200, borderRadius:14, padding:10, background: sobre === e.id ? `${e.color}18` : 'var(--bg3)', border:`1px solid ${sobre === e.id ? e.color : 'var(--border)'}`, transition:'background .15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontSize:12, fontWeight:800, color:e.color }}>{e.nombre} <span style={{ color:'var(--text3)', fontWeight:600 }}>{lista.length}</span></div>
              <button onClick={() => onNuevo(e.id)} title="Agregar aquí" style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>+</button>
            </div>
            <div style={{ fontSize:10, color:'var(--text4)', marginBottom:10 }}>{total ? `${millones(total)}/mes` : ' '}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {lista.map(c => {
                const atrasada = c.fecha_accion && c.fecha_accion < hoy && c.estado !== 'perdido'
                const esHoy = c.fecha_accion === hoy
                const wa = linkWhatsApp(c.telefono, c.nombre)
                return (
                  <div key={c.id} draggable onDragStart={ev => ev.dataTransfer.setData('text/plain', c.id)} onClick={() => onAbrir(c)}
                    style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:`3px solid ${e.color}`, cursor:'grab' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
                      {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()} title="WhatsApp" style={{ textDecoration:'none', fontSize:13 }}>💬</a>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{[c.empresa, c.nicho].filter(Boolean).join(' · ')}</div>
                    {c.proxima_accion && (
                      <div style={{ fontSize:11, marginTop:6, color: atrasada ? 'var(--red)' : esHoy ? 'var(--gold)' : 'var(--text2)' }}>
                        → {c.proxima_accion}{c.fecha_accion ? ` · ${esHoy ? 'hoy' : fechaCorta(c.fecha_accion)}` : ''}
                      </div>
                    )}
                    {Number(c.valor_mes) > 0 && <div style={{ fontSize:10, color:'var(--green)', marginTop:4 }}>{millones(c.valor_mes)}/mes</div>}
                  </div>
                )
              })}
              {lista.length === 0 && <div style={{ fontSize:11, color:'var(--text4)', textAlign:'center', padding:'16px 0' }}>Arrastra aquí</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lista con filtros ──────────────────────────────────────────────────────
function Lista({ clientes, onAbrir, onEditar, onEstado }) {
  const [filtro, setFiltro] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const hoy = hoyISO()
  const q = buscar.trim().toLowerCase()
  const visibles = clientes
    .filter(c => filtro === 'todos' || c.estado === filtro)
    .filter(c => !q || [c.nombre, c.empresa, c.nicho, c.notas, c.telefono].some(v => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => (a.fecha_accion || '9999') < (b.fecha_accion || '9999') ? -1 : 1)
  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <div className="sub-nav" style={{ marginBottom:0, flexWrap:'wrap' }}>
          <div className={`sub-nav-item${filtro==='todos'?' active':''}`} onClick={() => setFiltro('todos')}>Todos ({clientes.length})</div>
          {ESTADOS_CLIENTE.map(e => (
            <div key={e.id} className={`sub-nav-item${filtro===e.id?' active':''}`} onClick={() => setFiltro(e.id)}>{e.nombre} ({clientes.filter(c => c.estado === e.id).length})</div>
          ))}
        </div>
        <input id="clientes-buscar" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar nombre, empresa, nicho o teléfono…" style={{ ...iStyle, marginTop:0, maxWidth:280 }} />
      </div>
      {visibles.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)', fontSize:13 }}>{clientes.length === 0 ? 'Todavía no hay clientes. Dale a "+ Nuevo cliente".' : 'Nadie en este filtro.'}</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {visibles.map(c => {
            const est = estadoDe(c.estado)
            const atrasada = c.fecha_accion && c.fecha_accion < hoy && c.estado !== 'perdido'
            const esHoy = c.fecha_accion === hoy
            const wa = linkWhatsApp(c.telefono, c.nombre)
            return (
              <div key={c.id} className="panel" style={{ borderLeft:`3px solid ${est.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200, cursor:'pointer' }} onClick={() => onAbrir(c)}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{c.nombre}</span>
                      {c.empresa && <span style={{ fontSize:12, color:'var(--text3)' }}>· {c.empresa}</span>}
                      {nichosDe(c).map(n => <span key={n} style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)' }}>{n}</span>)}
                    </div>
                    {c.proxima_accion && (
                      <div style={{ fontSize:12, marginTop:6, color: atrasada ? 'var(--red)' : esHoy ? 'var(--gold)' : 'var(--text2)' }}>
                        → {c.proxima_accion}{c.fecha_accion ? ` · ${esHoy ? 'hoy' : atrasada ? 'atrasada desde el ' + fechaCorta(c.fecha_accion) : fechaCorta(c.fecha_accion)}` : ''}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'var(--text4)', marginTop:4 }}>
                      {[c.origen, c.volumen_mes, c.tarifa_kg ? `${cop(c.tarifa_kg)}/kg` : c.tarifa, c.referido_por && `Referido por ${c.referido_por}`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <select value={c.estado} onChange={e => onEstado(c, e.target.value)}
                    style={{ ...iStyle, width:'auto', marginTop:0, padding:'6px 10px', fontSize:12, color:est.color, borderColor:est.color + '55' }}>
                    {ESTADOS_CLIENTE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--green)', textDecoration:'none' }}>💬 WhatsApp</a>}
                  <div onClick={() => onAbrir(c)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>📇 Ficha</div>
                  <div onClick={() => onEditar(c)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>✏️ Editar</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Ficha del cliente: datos, próxima acción, historial, cargas y saldo ──────
function Ficha({ cliente: c, onCerrar, onEditar, onEstado, onCambio }) {
  const [contactos, setContactos] = useState([])
  const [cargas, setCargas] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [nuevo, setNuevo] = useState({ tipo:'whatsapp', resumen:'' })
  const [accion, setAccion] = useState({ proxima_accion: c.proxima_accion || '', fecha_accion: c.fecha_accion || '' })
  const [aviso, setAviso] = useState('')

  const cargar = async () => {
    const [co, ca, mo] = await Promise.all([
      supabase.from('lrm_contactos').select('*').eq('cliente_id', c.id).order('fecha', { ascending:false }),
      supabase.from('lrm_cargas').select('*').eq('cliente_id', c.id).order('fecha_recibo', { ascending:false }),
      supabase.from('lrm_movimientos').select('tipo,monto').eq('cliente_id', c.id),
    ])
    setContactos(co.data || []); setCargas(ca.data || [])
    setSaldo((mo.data || []).reduce((s, m) => s + (m.tipo === 'cobro_cliente' ? 1 : m.tipo === 'abono_cliente' ? -1 : 0) * Number(m.monto || 0), 0))
  }
  useEffect(() => { cargar(); setAccion({ proxima_accion: c.proxima_accion || '', fecha_accion: c.fecha_accion || '' }) }, [c.id])

  const registrar = async () => {
    if (!nuevo.resumen.trim()) return
    await supabase.from('lrm_contactos').insert({ cliente_id: c.id, tipo: nuevo.tipo, resumen: nuevo.resumen.trim() })
    setNuevo(p => ({ ...p, resumen:'' })); cargar()
  }
  const guardarAccion = async () => {
    await supabase.from('lrm_clientes').update({ proxima_accion: accion.proxima_accion || null, fecha_accion: accion.fecha_accion || null }).eq('id', c.id)
    setAviso('✓ Guardada'); setTimeout(() => setAviso(''), 1500); onCambio()
  }
  const est = estadoDe(c.estado)
  const wa = linkWhatsApp(c.telefono, c.nombre)
  const ETAPA = { bodega:'En bodega', transito:'En tránsito', aduana:'Aduana', destino:'En Barranquilla', entregada:'Entregada' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', justifyContent:'flex-end', zIndex:110 }} onClick={onCerrar}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:520, height:'100%', overflowY:'auto', background:'var(--bg2)', borderLeft:'1px solid var(--border)', padding:22 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, color:est.color, fontWeight:700 }}>{est.nombre.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{[c.empresa, c.nicho, c.origen].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={onCerrar} className="btn">✕</button>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', margin:'14px 0' }}>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ color:'#25D366', borderColor:'rgba(37,211,102,0.4)', textDecoration:'none' }}>💬 WhatsApp</a>}
          {c.correo && <a href={`mailto:${c.correo}`} className="btn" style={{ textDecoration:'none' }}>✉️ Correo</a>}
          <button onClick={() => onEditar(c)} className="btn">✏️ Editar</button>
          <BotonRastreo cliente={c} />
          <BotonPortal cliente={c} />
          <select value={c.estado} onChange={e => onEstado(c, e.target.value)} style={{ ...iStyle, width:'auto', marginTop:0, padding:'6px 10px', fontSize:12, color:est.color }}>
            {ESTADOS_CLIENTE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[['WhatsApp', c.telefono], ['Correo', c.correo], ['Tarifa', c.tarifa_kg ? `${cop(c.tarifa_kg)}/kg` : c.tarifa], ['Volumen', c.volumen_mes],
            ['Te deja al mes', Number(c.valor_mes) ? cop(c.valor_mes) : ''], ['Referido por', c.referido_por]].map(([l, v]) => (
            <div key={l} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg4)' }}>
              <div style={{ fontSize:10, color:'var(--text4)' }}>{l}</div>
              <div style={{ fontSize:13, color: v ? 'var(--text)' : 'var(--text4)' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
        {c.notas && <div style={{ fontSize:12, color:'var(--text2)', padding:'10px 12px', borderRadius:8, background:'var(--bg4)', marginBottom:16, whiteSpace:'pre-wrap' }}>{c.notas}</div>}

        <Titulo>Próxima acción</Titulo>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
          <input id="ficha-accion" value={accion.proxima_accion} onChange={e => setAccion(p => ({ ...p, proxima_accion:e.target.value }))} placeholder="Qué sigue con este cliente" style={{ ...iStyle, marginTop:0, flex:'1 1 220px', width:'auto', minWidth:0 }} />
          <input type="date" value={accion.fecha_accion} onChange={e => setAccion(p => ({ ...p, fecha_accion:e.target.value }))} style={{ ...iStyle, marginTop:0, flex:'1 1 140px', width:'auto', minWidth:0 }} />
          <button onClick={guardarAccion} className="btn-gold">{aviso || 'Guardar'}</button>
        </div>

        <Titulo>Registrar contacto</Titulo>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          {TIPOS_CONTACTO.map(t => (
            <button key={t.id} onClick={() => setNuevo(p => ({ ...p, tipo:t.id }))} className={nuevo.tipo === t.id ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 10px' }}>{t.icono} {t.nombre}</button>
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
          <input id="ficha-contacto" value={nuevo.resumen} onChange={e => setNuevo(p => ({ ...p, resumen:e.target.value }))} onKeyDown={e => e.key === 'Enter' && registrar()} placeholder="Qué hablaron o qué quedó pendiente" style={{ ...iStyle, marginTop:0, flex:'1 1 220px', width:'auto', minWidth:0 }} />
          <button onClick={registrar} className="btn">Registrar</button>
        </div>

        <Titulo>Historial ({contactos.length})</Titulo>
        <div style={{ borderLeft:'2px solid var(--border2)', marginLeft:6, paddingLeft:14, marginBottom:18 }}>
          {contactos.length === 0 && <div style={{ fontSize:12, color:'var(--text4)' }}>Sin contactos registrados.</div>}
          {contactos.map(k => {
            const t = TIPOS_CONTACTO.find(x => x.id === k.tipo) || TIPOS_CONTACTO[0]
            return (
              <div key={k.id} style={{ marginBottom:10 }}>
                <div style={{ fontSize:12, color:'var(--text)' }}>{t.icono} {k.resumen || t.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text4)' }}>{new Date(k.fecha).toLocaleString('es-CO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            )
          })}
        </div>

        <Titulo>Cargas ({cargas.length}) · {saldo > 0 ? <span style={{ color:'var(--gold)' }}>te debe {cop(saldo)}</span> : <span style={{ color:'var(--green)' }}>al día</span>}</Titulo>
        {cargas.length === 0 && <div style={{ fontSize:12, color:'var(--text4)' }}>Todavía no tiene cargas.</div>}
        {cargas.map(k => (
          <div key={k.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
            <span style={{ color:'var(--text2)' }}>#{k.orden} · WR {k.guia} · {fechaCorta(k.fecha_recibo)}</span>
            <span style={{ color:'var(--text3)' }}>{ETAPA[k.etapa] || k.etapa} · {cop(cobroCarga(k))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
const Titulo = ({ children }) => <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>{children}</div>

// ── Pitches y enganches por nicho ──────────────────────────────────────────
function Pitches({ clientes }) {
  const [lista, setLista] = useState(PITCHES_LRM)
  const [borrados, setBorrados] = useState([])
  const [publico, setPublico] = useState('Todos')
  const [nicho, setNicho] = useState('Todos')
  const [etapa, setEtapa] = useState('todas')
  const [editando, setEditando] = useState(null)
  const [enviar, setEnviar] = useState(null)        // pitch que se va a mandar a un cliente
  const [estado, setEstado] = useState('')

  useEffect(() => {
    supabase.from('lrm_ajustes').select('valor').eq('clave', 'pitches').maybeSingle()
      .then(({ data }) => { try { const u = unirPitches(data?.valor ? JSON.parse(data.valor) : []); setLista(u.items); setBorrados(u.borrados) } catch { /* se quedan los de arranque */ } })
  }, [])
  const guardarLista = async (nueva, nuevosBorrados = borrados) => {
    setLista(nueva); setBorrados(nuevosBorrados)
    const { error } = await supabase.from('lrm_ajustes').upsert({ clave:'pitches', valor: JSON.stringify({ items: nueva, borrados: nuevosBorrados }) })
    setEstado(error ? 'No se pudo guardar: ' + error.message : '✓ Guardado'); setTimeout(() => setEstado(''), 2000)
  }
  const borrarPitch = (id) => guardarLista(lista.filter(x => x.id !== id), PITCHES_LRM.some(p => p.id === id) ? [...borrados, id] : borrados)

  const nichos = ['Todos', ...NICHOS_LRM.filter(n => lista.some(p => p.nicho === n))]
  const visibles = lista.filter(p => (publico === 'Todos' || p.publico === publico || (p.publico || 'Todos') === 'Todos') && (nicho === 'Todos' || p.nicho === nicho || p.nicho === 'Todos') && (etapa === 'todas' || p.etapa === etapa))
    .sort((a, b) => ((a.nicho === 'Todos' ? 1 : 0) + ((a.publico || 'Todos') === 'Todos' ? 1 : 0)) - ((b.nicho === 'Todos' ? 1 : 0) + ((b.publico || 'Todos') === 'Todos' ? 1 : 0)))   // lo específico primero
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); setEstado('✓ Copiado'); setTimeout(() => setEstado(''), 1500) } catch {} }

  return (
    <div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text3)', width:56 }}>Para</span>
        {['Todos', ...PUBLICOS_PITCH].map(x => <button key={x} onClick={() => setPublico(x)} className={publico === x ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>{x === 'Todos' ? 'Todos' : x}</button>)}
        <span style={{ fontSize:11, color:'var(--text4)', marginLeft:'auto' }}>{visibles.length} mensajes</span>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text3)', width:56 }}>Nicho</span>
        {nichos.map(n => <button key={n} onClick={() => setNicho(n)} className={nicho === n ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>{n}</button>)}
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text3)', width:56 }}>Etapa</span>
        <button onClick={() => setEtapa('todas')} className={etapa === 'todas' ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>Todas</button>
        {ETAPAS_PITCH.map(e => <button key={e.id} onClick={() => setEtapa(e.id)} title={e.desc} className={etapa === e.id ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 12px' }}>{e.nombre}</button>)}
        <button onClick={() => setEditando({ id:'n' + Date.now(), publico, nicho: nicho === 'Todos' ? 'Todos' : nicho, etapa: etapa === 'todas' ? 'enganche' : etapa, titulo:'', texto:'', nuevo:true })} className="btn" style={{ fontSize:11, marginLeft:'auto' }}>+ Nuevo pitch</button>
        {estado && <span style={{ fontSize:11, color:'var(--green)' }}>{estado}</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap:12 }}>
        {visibles.map(p => {
          const et = ETAPAS_PITCH.find(e => e.id === p.etapa)
          return (
            <div key={p.id} className="panel" style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)' }}>{et?.nombre || p.etapa}</span>
                {(p.publico || 'Todos') !== 'Todos' && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(55,138,221,0.12)', color:'#6aa7e8' }}>{p.publico}</span>}
                {p.nicho !== 'Todos' && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.05)', color:'var(--text3)' }}>{p.nicho}</span>}
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{p.titulo}</div>
              <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.6, flex:1, whiteSpace:'pre-wrap' }}>{p.texto}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={() => copiar(p.texto)} className="btn" style={{ fontSize:11 }}>Copiar</button>
                <button onClick={() => setEnviar(p)} className="btn" style={{ fontSize:11, color:'#25D366', borderColor:'rgba(37,211,102,0.4)' }}>Enviar a…</button>
                <button onClick={() => setEditando({ ...p })} className="btn" style={{ fontSize:11 }}>Editar</button>
              </div>
            </div>
          )
        })}
      </div>

      {editando && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:16 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:12 }}>{editando.nuevo ? 'Nuevo pitch' : 'Editar pitch'}</div>
            <div className="grid-2" style={{ gap:8, marginBottom:8 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Para</div>
                <select value={editando.publico || 'Todos'} onChange={e => setEditando(p => ({ ...p, publico:e.target.value }))} style={iStyle}>{['Todos', ...PUBLICOS_PITCH].map(n => <option key={n}>{n}</option>)}</select></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Nicho</div>
                <select value={editando.nicho} onChange={e => setEditando(p => ({ ...p, nicho:e.target.value }))} style={iStyle}>{['Todos', ...NICHOS_LRM].map(n => <option key={n}>{n}</option>)}</select></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Etapa</div>
                <select value={editando.etapa} onChange={e => setEditando(p => ({ ...p, etapa:e.target.value }))} style={iStyle}>{ETAPAS_PITCH.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
            </div>
            <div style={{ marginBottom:8 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Título</div>
              <input value={editando.titulo} onChange={e => setEditando(p => ({ ...p, titulo:e.target.value }))} style={iStyle} /></div>
            <div style={{ marginBottom:6 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Mensaje · usa {'{nombre}'} para el nombre del cliente</div>
              <textarea value={editando.texto} onChange={e => setEditando(p => ({ ...p, texto:e.target.value }))} style={{ ...iStyle, minHeight:140, resize:'vertical', lineHeight:1.5 }} /></div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button disabled={!editando.titulo.trim() || !editando.texto.trim()} className="btn-green" style={{ flex:1 }}
                onClick={() => { const { nuevo, ...p } = editando; guardarLista(nuevo ? [...lista, p] : lista.map(x => x.id === p.id ? p : x)); setEditando(null) }}>Guardar</button>
              {!editando.nuevo && <button onClick={() => { borrarPitch(editando.id); setEditando(null) }} className="btn" style={{ color:'var(--red)' }}>Borrar</button>}
              <button onClick={() => setEditando(null)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {enviar && <EnviarPitch pitch={enviar} clientes={clientes} onCerrar={() => setEnviar(null)} />}
    </div>
  )
}

function EnviarPitch({ pitch, clientes, onCerrar }) {
  const [clienteId, setClienteId] = useState('')
  const c = clientes.find(x => x.id === clienteId)
  const [texto, setTexto] = useState(pitch.texto)
  useEffect(() => { setTexto(conNombre(pitch.texto, c?.nombre)) }, [clienteId])
  const wa = c ? linkWhatsApp(c.telefono, c.nombre, texto) : null
  const registrar = () => c && supabase.from('lrm_contactos').insert({ cliente_id: c.id, tipo:'whatsapp', resumen: `Pitch: ${pitch.titulo}` })
  const ordenados = useMemo(() => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [clientes])
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:16 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:500, border:'1px solid rgba(37,211,102,0.3)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'#25D366' }}>ENVIAR POR WHATSAPP</div>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:'4px 0 12px' }}>{pitch.titulo}</div>
        <select id="pitch-cliente" value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ ...iStyle, marginTop:0, marginBottom:10 }}>
          <option value="">Elegir cliente…</option>
          {ordenados.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.telefono ? '' : ' (sin WhatsApp)'}</option>)}
        </select>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} style={{ ...iStyle, minHeight:150, resize:'vertical', lineHeight:1.5 }} />
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {wa ? <a href={wa} target="_blank" rel="noreferrer" onClick={() => { registrar(); onCerrar() }} className="btn-green" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>Abrir WhatsApp</a>
            : <button disabled className="btn" style={{ flex:1 }}>{c ? 'Este cliente no tiene WhatsApp' : 'Elige un cliente'}</button>}
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
        <div style={{ fontSize:11, color:'var(--text4)', marginTop:8 }}>Queda registrado en el historial del cliente.</div>
      </div>
    </div>
  )
}
// Link del portal de rastreo: copiar o mandarlo por WhatsApp
function BotonRastreo({ cliente }) {
  const [abierto, setAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const link = linkRastreo(cliente)
  if (!link) return <button className="btn" title="Corre en Supabase el archivo 15_lrm_portal_rastreo.sql" style={{ opacity:0.6 }} onClick={() => setAbierto(a => !a)}>📍 Rastreo{abierto ? ': corre el SQL 15' : ''}</button>
  const texto = `Hola ${(cliente.nombre || '').split(' ')[0]}, aquí puedes ver en todo momento dónde va tu carga con LRM Trade Consulting:\n${link}\n\nGuárdalo, es tu link personal.`
  const wa = linkWhatsApp(cliente.telefono, cliente.nombre, texto)
  return (
    <div style={{ position:'relative' }}>
      <button id="cl-rastreo" onClick={() => setAbierto(a => !a)} className="btn">📍 Rastreo</button>
      {abierto && (
        <div style={{ position:'absolute', top:'110%', right:0, zIndex:5, width:'min(300px, 80vw)', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, padding:12, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Link personal de {cliente.nombre}. Ve solo sus cargas, sin precios.</div>
          <div id="cl-rastreo-link" style={{ fontSize:11.5, color:'var(--gold)', wordBreak:'break-all', marginBottom:10 }}>{link}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button onClick={async () => { try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }} className="btn" style={{ fontSize:11 }}>{copiado ? '✓ Copiado' : 'Copiar'}</button>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ fontSize:11, color:'#25D366', textDecoration:'none' }}>Enviar por WhatsApp</a>}
            <a href={link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize:11, textDecoration:'none' }}>Ver</a>
          </div>
        </div>
      )}
    </div>
  )
}
// Acceso del cliente al portal (#/clientes) con usuario y clave
const sinTildes = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const usuarioSugerido = nombre => { const p = sinTildes(nombre).replace(/[^a-z ]/g, '').split(' ').filter(Boolean); return (p[0] || 'cliente') + (p[1] ? '.' + p[1] : '') }
const claveAleatoria = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)]; return s }
function BotonPortal({ cliente }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button id="cl-portal" onClick={() => setAbierto(true)} className="btn">🔑 Portal</button>
      {abierto && <ModalPortal cliente={cliente} onCerrar={() => setAbierto(false)} />}
    </>
  )
}
function ModalPortal({ cliente, onCerrar }) {
  const [acceso, setAcceso] = useState(undefined)     // undefined cargando · null sin acceso
  const [falta, setFalta] = useState(false)
  const [usuario, setUsuario] = useState(usuarioSugerido(cliente.nombre))
  const [clave, setClave] = useState(claveAleatoria())
  const [nuevaClave, setNuevaClave] = useState(null)   // la clave que acabas de crear o cambiar (solo se ve ahora)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const cargar = async () => {
    const { data, error } = await supabase.from('lrm_portal_usuarios').select('*').eq('cliente_id', cliente.id).maybeSingle()
    if (error) { setFalta(true); return }
    setAcceso(data || null)
  }
  useEffect(() => { cargar() }, [cliente.id])
  const link = `${urlPublica()}/#/clientes`
  const mensaje = (u, c) => [`Hola ${(cliente.nombre || '').split(' ')[0]}, ya tienes tu acceso al portal de clientes de LRM Trade Consulting.`, '', `Entra aquí: ${link}`, `Usuario: ${u}`, ...(c ? [`Clave: ${c}`] : []), '', 'Ahí ves tus envíos, cotizaciones, estado de cuenta y documentos.'].join('\n')
  const crear = async () => {
    setTrabajando(true); setError('')
    const { error } = await supabase.rpc('lrm_crear_acceso_cliente', { p_cliente: cliente.id, p_usuario: usuario, p_clave: clave })
    setTrabajando(false)
    if (error) return setError(error.message)
    setNuevaClave(clave); cargar()
  }
  const cambiarClave = async () => {
    const c = claveAleatoria()
    setTrabajando(true); setError('')
    const { error } = await supabase.rpc('lrm_clave_acceso_cliente', { p_user: acceso.user_id, p_clave: c })
    setTrabajando(false)
    if (error) return setError(error.message)
    setNuevaClave(c)
  }
  const activar = async () => { await supabase.from('lrm_portal_usuarios').update({ activo: !acceso.activo }).eq('user_id', acceso.user_id); cargar() }
  const borrar = async () => {
    if (!confirmar) return setConfirmar(true)
    const { error } = await supabase.rpc('lrm_borrar_acceso_cliente', { p_user: acceso.user_id })
    if (error) return setError(error.message)
    setConfirmar(false); setNuevaClave(null); setAcceso(null); setUsuario(usuarioSugerido(cliente.nombre)); setClave(claveAleatoria())
  }
  const wa = acceso ? linkWhatsApp(cliente.telefono, cliente.nombre, mensaje(acceso.usuario, nuevaClave)) : null
  return (
    <div onClick={e => e.stopPropagation()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:460, border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>PORTAL DE CLIENTES</div>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{cliente.nombre}</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Entra en <span style={{ color:'var(--gold)' }}>{link}</span> y ve sus envíos, cotizaciones (las puede aceptar), estado de cuenta y documentos. Nunca ve tus costos.</div>
        {falta ? <div style={{ fontSize:13, color:'var(--gold)' }}>Para crear accesos corre en Supabase el archivo <b>22_lrm_portal_clientes.sql</b>.</div>
          : acceso === undefined ? <div style={{ fontSize:13, color:'var(--text3)' }}>Cargando…</div>
          : acceso === null ? (
            <>
              <div className="grid-2" style={{ gap:10 }}>
                <div><div style={{ fontSize:11, color:'var(--text3)' }}>Usuario</div><input id="pt-usuario" value={usuario} onChange={e => setUsuario(sinTildes(e.target.value).replace(/[^a-z0-9._-]/g, ''))} style={iStyle} /></div>
                <div><div style={{ fontSize:11, color:'var(--text3)' }}>Clave</div><input id="pt-clave" value={clave} onChange={e => setClave(e.target.value)} style={iStyle} /></div>
              </div>
              {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button id="pt-crear" onClick={crear} disabled={trabajando} className="btn-green" style={{ flex:1 }}>{trabajando ? 'Creando…' : 'Crear acceso'}</button>
                <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cerrar</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg4)', fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>
                <div>Usuario: <b id="pt-usuario-ok" style={{ color:'var(--text)' }}>{acceso.usuario}</b></div>
                {nuevaClave && <div>Clave: <b id="pt-clave-ok" style={{ color:'var(--gold)' }}>{nuevaClave}</b> <span style={{ fontSize:11, color:'var(--text3)' }}>· mándasela ahora, después no se vuelve a ver</span></div>}
                <div style={{ fontSize:12, color: acceso.activo ? 'var(--green)' : 'var(--red)' }}>{acceso.activo ? '● Activo' : '● Desactivado'}{acceso.ultimo_ingreso ? ` · entró por última vez el ${new Date(acceso.ultimo_ingreso).toLocaleDateString('es-CO', { day:'numeric', month:'short' })}` : ' · todavía no ha entrado'}</div>
              </div>
              {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{error}</div>}
              <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                {wa && <a id="pt-wa" href={wa} target="_blank" rel="noreferrer" className="btn" style={{ textDecoration:'none', color:'#25D366' }}>💬 Enviar acceso por WhatsApp</a>}
                <button onClick={cambiarClave} disabled={trabajando} className="btn" style={{ width:'auto' }}>🔁 Nueva clave</button>
                <button onClick={activar} className="btn" style={{ width:'auto' }}>{acceso.activo ? 'Desactivar' : 'Activar'}</button>
                <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Borrar acceso?' : 'Borrar'}</button>
                <button onClick={onCerrar} className="btn" style={{ width:'auto', marginLeft:'auto' }}>Cerrar</button>
              </div>
            </>
          )}
      </div>
    </div>
  )
}