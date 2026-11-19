// @ts-nocheck
// LRM Trade Consulting · Clientes
// Lista de clientes y prospectos con su estado, próxima acción y botón de WhatsApp.
// Tabla en Supabase: lrm_clientes  (SQL: supabase/03_lrm_clientes.sql)
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export const NICHOS_LRM = ['Perfumes','Cosméticos','Celulares','Computadores','Tablets','Electrónica','Electrodomésticos','Partes y repuestos','Mercancía doméstica','Otro']

export const ESTADOS_CLIENTE = [
  { id:'prospecto',    nombre:'Prospecto',         color:'#8A8F98' },
  { id:'conversacion', nombre:'En conversación',   color:'#C9A84C' },
  { id:'propuesta',    nombre:'Propuesta enviada', color:'#378ADD' },
  { id:'activo',       nombre:'Cliente activo',    color:'#4caf50' },
  { id:'perdido',      nombre:'Perdido',           color:'#e05252' },
]
const ORIGENES = ['Estados Unidos','China','Panamá']

const iStyle = {
  width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)',
  border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4,
}
const FORM_VACIO = { nombre:'', empresa:'', telefono:'', correo:'', nicho:'Otro', estado:'prospecto', proxima_accion:'', fecha_accion:'', origen:'Estados Unidos', volumen_mes:'', tarifa:'', referido_por:'', notas:'', valor_mes:'', codigo:'', tarifa_kg:'' }

export const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone:'America/Bogota' })
const estadoDe = (id) => ESTADOS_CLIENTE.find(e => e.id === id) || ESTADOS_CLIENTE[0]

export function fechaCorta(iso) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('es-CO', { day:'numeric', month:'short' })
}

export function linkWhatsApp(tel, nombre) {
  const num = (tel || '').replace(/\D/g, '')
  if (!num) return null
  const conPais = num.length === 10 ? '57' + num : num
  const txt = encodeURIComponent(`Hola ${nombre?.split(' ')[0] || ''}, te escribe Luis de LRM Trade Consulting.`)
  return `https://wa.me/${conPais}?text=${txt}`
}

export default function LRMClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorTabla, setErrorTabla] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const { data, error } = await supabase.from('lrm_clientes').select('*').order('created_at', { ascending:false })
    if (error) setErrorTabla(true)
    else { setClientes(data || []); setErrorTabla(false) }
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const abrirNuevo  = () => { setEditando(null); setForm(FORM_VACIO); setModal(true) }
  const abrirEditar = (c) => {
    setEditando(c); setConfirmarBorrar(false)
    setForm(Object.fromEntries(Object.keys(FORM_VACIO).map(k => [k, c[k] ?? ''])))
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    const payload = { ...form, fecha_accion: form.fecha_accion || null, valor_mes: Number(String(form.valor_mes).replace(/\D/g, '')) || 0, tarifa_kg: Number(String(form.tarifa_kg).replace(/\D/g, '')) || 0, codigo: String(form.codigo || '').trim() || null }
    if (editando) await supabase.from('lrm_clientes').update(payload).eq('id', editando.id)
    else await supabase.from('lrm_clientes').insert(payload)
    setGuardando(false); setModal(false); cargar()
  }

  const cambiarEstado = async (c, estado) => {
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, estado } : x))
    await supabase.from('lrm_clientes').update({ estado }).eq('id', c.id)
  }

  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const eliminar = async (c) => {
    if (!confirmarBorrar) { setConfirmarBorrar(true); return }
    setConfirmarBorrar(false)
    await supabase.from('lrm_clientes').delete().eq('id', c.id)
    setClientes(prev => prev.filter(x => x.id !== c.id)); setModal(false)
  }

  const hoy = hoyISO()
  const enJuego = clientes.filter(c => c.estado !== 'perdido')
  const kpis = [
    { label:'Clientes activos',   val:clientes.filter(c => c.estado === 'activo').length,  color:'var(--green)' },
    { label:'En proceso',         val:clientes.filter(c => ['prospecto','conversacion','propuesta'].includes(c.estado)).length, color:'var(--gold)' },
    { label:'Acciones para hoy',  val:enJuego.filter(c => c.fecha_accion === hoy).length, color:'var(--text)' },
    { label:'Acciones atrasadas', val:enJuego.filter(c => c.fecha_accion && c.fecha_accion < hoy).length, color:'var(--red)' },
  ]

  const q = buscar.trim().toLowerCase()
  const visibles = clientes
    .filter(c => filtro === 'todos' || c.estado === filtro)
    .filter(c => !q || [c.nombre, c.empresa, c.nicho, c.notas].some(v => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => (a.fecha_accion || '9999') < (b.fecha_accion || '9999') ? -1 : 1)

  if (errorTabla) return (
    <div className="panel" style={{ fontSize:13, color:'var(--gold)', lineHeight:1.7 }}>
      Falta crear la tabla de clientes en Supabase. Corre el archivo <b>supabase/03_lrm_clientes.sql</b> en Supabase → SQL Editor y vuelve a abrir esta pestaña.
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Clientes</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Quién es, en qué va y qué sigue con cada uno</div>
        </div>
        <button onClick={abrirNuevo} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo cliente</button>
      </div>

      <div className="grid-4" style={{ marginBottom:16 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <div className="sub-nav" style={{ marginBottom:0, flexWrap:'wrap' }}>
          <div className={`sub-nav-item${filtro==='todos'?' active':''}`} onClick={() => setFiltro('todos')}>Todos ({clientes.length})</div>
          {ESTADOS_CLIENTE.map(e => (
            <div key={e.id} className={`sub-nav-item${filtro===e.id?' active':''}`} onClick={() => setFiltro(e.id)}>
              {e.nombre} ({clientes.filter(c => c.estado === e.id).length})
            </div>
          ))}
        </div>
        <input id="clientes-buscar" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar nombre, empresa o nicho…" style={{ ...iStyle, marginTop:0, maxWidth:260 }} />
      </div>

      {cargando ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : visibles.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)', fontSize:13 }}>
          {clientes.length === 0 ? 'Todavía no hay clientes. Dale a "+ Nuevo cliente" para agregar el primero.' : 'Nadie en este filtro.'}
        </div>
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
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{c.nombre}</span>
                      {c.empresa && <span style={{ fontSize:12, color:'var(--text3)' }}>· {c.empresa}</span>}
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)' }}>{c.nicho}</span>
                    </div>
                    {c.proxima_accion && (
                      <div style={{ fontSize:12, marginTop:6, color: atrasada ? 'var(--red)' : esHoy ? 'var(--gold)' : 'var(--text2)' }}>
                        → {c.proxima_accion}{c.fecha_accion ? ` · ${esHoy ? 'hoy' : atrasada ? 'atrasada desde el ' + fechaCorta(c.fecha_accion) : fechaCorta(c.fecha_accion)}` : ''}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'var(--text4)', marginTop:4 }}>
                      {[c.codigo && `Casillero ${c.codigo}`, c.origen, c.volumen_mes, c.tarifa, c.referido_por && `Referido por ${c.referido_por}`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <select value={c.estado} onChange={e => cambiarEstado(c, e.target.value)}
                    style={{ ...iStyle, width:'auto', marginTop:0, padding:'6px 10px', fontSize:12, color:est.color, borderColor:est.color + '55' }}>
                    {ESTADOS_CLIENTE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--green)', textDecoration:'none' }}>💬 WhatsApp</a>}
                  <div onClick={() => abrirEditar(c)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>✏️ Editar</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:24, width:'100%', maxWidth:520, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</div>
            <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
              {[['nombre','Nombre *'],['empresa','Empresa'],['telefono','WhatsApp'],['correo','Correo'],['referido_por','Referido por']].map(([k,l]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                  <input id={`cli-${k}`} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]:e.target.value }))} style={iStyle} /></div>
              ))}
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Nicho</div>
                <select id="cli-nicho" value={form.nicho} onChange={e => setForm(p => ({ ...p, nicho:e.target.value }))} style={iStyle}>
                  {NICHOS_LRM.map(n => <option key={n}>{n}</option>)}
                </select></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Estado</div>
                <select id="cli-estado" value={form.estado} onChange={e => setForm(p => ({ ...p, estado:e.target.value }))} style={iStyle}>
                  {ESTADOS_CLIENTE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Origen de la carga</div>
                <select id="cli-origen" value={form.origen} onChange={e => setForm(p => ({ ...p, origen:e.target.value }))} style={iStyle}>
                  {ORIGENES.map(o => <option key={o}>{o}</option>)}
                </select></div>
              {[['volumen_mes','Volumen al mes'],['tarifa','Tarifa']].map(([k,l]) => (
                <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                  <input id={`cli-${k}`} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]:e.target.value }))} style={iStyle} /></div>
              ))}
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Código de casillero (ej. 608)</div>
                <input id="cli-codigo" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo:e.target.value }))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Le cobras por kg (COP)</div>
                <input id="cli-tarifa-kg" inputMode="numeric" value={form.tarifa_kg} onChange={e => setForm(p => ({ ...p, tarifa_kg:e.target.value }))} placeholder="20000" style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:10 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Lo que te deja al mes (COP) · para la proyección</div>
              <input id="cli-valor" inputMode="numeric" value={form.valor_mes} onChange={e => setForm(p => ({ ...p, valor_mes:e.target.value }))} placeholder="Ej: 2000000" style={iStyle} /></div>
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