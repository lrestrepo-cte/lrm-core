// MySpace · Plata (Fase 1): cuentas, gasto en una línea, pagos fijos y el orden de la plata
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PERSONAS, CATS_GASTO, DUENOS, TIPOS_CUENTA, esCredito, saldos, leerLinea, BOLSAS, bolsaDe } from './Finanzas'

const AZUL = '#7B93FF'
export const cop = n => (Number(n) < 0 ? '−' : '') + '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('es-CO')
const iStyle = { width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', marginTop:6, boxSizing:'border-box' }
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const Etq = ({ children }) => <div style={{ fontSize:11.5, color:'var(--text3)', fontWeight:600 }}>{children}</div>
const Titulo = ({ children, sub, derecha }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14, flexWrap:'wrap' }}>
    <div><div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{children}</div>{sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{sub}</div>}</div>
    {derecha}
  </div>
)
function Modal({ titulo, onCerrar, children }) {
  return (
    <div onClick={onCerrar} style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} className="panel" style={{ width:'100%', maxWidth:440, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{titulo}</div>
          <button type="button" onClick={onCerrar} className="btn" style={{ width:'auto', padding:'4px 10px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Datos de la plata (cuentas + todos sus movimientos) ──────────────────────
export function useCuentas() {
  const [d, setD] = useState({ cuentas: [], saldo: {}, listo: false, falta: false })
  const cargar = async () => {
    const [c, g, i, t, a] = await Promise.all([
      supabase.from('my_space_cuentas').select('*').order('orden').order('created_at'),
      supabase.from('my_space_gastos_v2').select('monto,cuenta_id').not('cuenta_id', 'is', null),
      supabase.from('my_space_ingresos_v2').select('monto,cuenta_id').not('cuenta_id', 'is', null),
      supabase.from('my_space_traslados').select('*'),
      supabase.from('my_space_pagos_deuda').select('monto,cuenta_id').not('cuenta_id', 'is', null),
    ])
    if (c.error) return setD({ cuentas: [], saldo: {}, listo: true, falta: true })
    const cuentas = c.data || []
    setD({ cuentas, saldo: saldos(cuentas, { gastos: g.data || [], ingresos: i.data || [], traslados: t.data || [], abonos: a.data || [] }), traslados: t.data || [], listo: true, falta: false })
  }
  useEffect(() => { cargar() }, [])
  return { ...d, recargar: cargar }
}

export function SelectCuenta({ value, onChange, etiqueta = 'Cuenta', id }) {
  const [cuentas, setCuentas] = useState([])
  useEffect(() => { supabase.from('my_space_cuentas').select('id,nombre,dueno,activa').eq('activa', true).order('orden').then(r => setCuentas(r.data || [])) }, [])
  if (!cuentas.length) return null
  return (
    <div style={{ marginBottom:12 }}>
      <Etq>{etiqueta}</Etq>
      <select id={id} value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...iStyle, fontSize:14 }}>
        <option value="">Sin cuenta</option>
        {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.dueno !== 'luis' ? ` · ${DUENOS[c.dueno]?.l}` : ''}</option>)}
      </select>
    </div>
  )
}

// ─── El gasto en una línea ────────────────────────────────────────────────────
export function RegistroRapido({ onGuardado, compacto }) {
  const [texto, setTexto] = useState('')
  const [cuentas, setCuentas] = useState([])
  const [g, setG] = useState(null)
  const [estado, setEstado] = useState('')
  const porDefecto = () => { try { return localStorage.getItem('ms_cuenta_def') || null } catch { return null } }
  useEffect(() => { supabase.from('my_space_cuentas').select('id,nombre,tipo,dueno,activa').eq('activa', true).order('orden').then(r => setCuentas((r.data || []).filter(c => c.dueno === 'luis'))) }, [])
  useEffect(() => { setG(texto.trim() ? leerLinea(texto, cuentas, porDefecto() || cuentas[0]?.id || null) : null); if (texto.trim()) setEstado('') }, [texto, cuentas])
  const cambia = (k, v) => setG(p => ({ ...p, [k]: v, ...(k === 'persona' ? { categoria: (CATS_GASTO[v] || []).includes(p.categoria) ? p.categoria : 'Otro' } : {}) }))
  const guardar = async () => {
    if (!g?.monto) return setEstado('Escribe el monto. Ej: café 8000')
    const fila = { fecha: g.fecha || hoyISO(), persona: g.persona, categoria: g.categoria, descripcion: g.descripcion, monto: g.monto, recurrente: false, cuenta_id: g.cuenta_id || null }
    let r = await supabase.from('my_space_gastos_v2').insert(fila)
    if (r.error && /cuenta_id/.test(r.error.message || '')) { delete fila.cuenta_id; r = await supabase.from('my_space_gastos_v2').insert(fila) }
    if (r.error) return setEstado('No se guardó: ' + r.error.message)
    try { if (g.cuenta_id) localStorage.setItem('ms_cuenta_def', g.cuenta_id) } catch { /* nada */ }
    setEstado(`✓ ${g.descripcion} · ${cop(g.monto)} · ${new Date().toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}`); setTexto(''); onGuardado?.()
  }
  const chip = { padding:'6px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', maxWidth:'100%' }
  return (
    <div className="panel" style={{ padding: compacto ? 14 : undefined }}>
      <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Gasté…</div>
      <div style={{ display:'flex', gap:8 }}>
        <input id="rr-texto" value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardar()}
          placeholder="café 8000 · helado Lucía 12000 · o pega el mensaje del banco" style={{ ...iStyle, marginTop:0, flex:1 }} />
        <button id="rr-guardar" type="button" onClick={guardar} disabled={!g?.monto} style={{ flexShrink:0, padding:'0 16px', borderRadius:10, border:'none', background: g?.monto ? AZUL : 'rgba(255,255,255,0.08)', color: g?.monto ? '#0b0b0b' : 'var(--text4)', fontWeight:800, fontSize:14, fontFamily:'inherit', cursor:'pointer' }}>Anotar</button>
      </div>
      {g && (
        <div id="rr-vista" style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10, alignItems:'center' }}>
          <b style={{ fontSize:16, color: g.monto ? 'var(--red)' : 'var(--text4)', marginRight:4 }}>{g.monto ? cop(g.monto) : 'sin monto'}</b>
          <select id="rr-persona" value={g.persona} onChange={e => cambia('persona', e.target.value)} style={chip}>{PERSONAS.map(p => <option key={p}>{p}</option>)}</select>
          <select id="rr-categoria" value={g.categoria} onChange={e => cambia('categoria', e.target.value)} style={chip}>{(CATS_GASTO[g.persona] || []).map(c => <option key={c}>{c}</option>)}</select>
          {cuentas.length > 0 && <select id="rr-cuenta" value={g.cuenta_id || ''} onChange={e => cambia('cuenta_id', e.target.value || null)} style={chip}><option value="">Sin cuenta</option>{cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
          {g.fecha && g.fecha !== hoyISO() && <span style={{ fontSize:12, color:'var(--text3)' }}>{g.fecha}</span>}
        </div>
      )}
      {estado && <div id="rr-estado" style={{ fontSize:12.5, marginTop:8, color: estado.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{estado}</div>}
    </div>
  )
}

// ─── Cuentas ──────────────────────────────────────────────────────────────────
export function Cuentas() {
  const { cuentas, saldo, listo, falta, recargar, traslados = [] } = useCuentas()
  const [editar, setEditar] = useState(null)     // {} nueva · cuenta
  const [traslado, setTraslado] = useState(false)
  if (!listo) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (falta) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>26_myspace_plata_habitos.sql</b> en Supabase para usar tus cuentas.</div>
  const activas = cuentas.filter(c => c.activa)
  const totalLuis = activas.filter(c => c.dueno === 'luis' && c.moneda === 'COP').reduce((t, c) => t + (saldo[c.id]?.disponible || 0), 0)
  const nombre = id => cuentas.find(c => c.id === id)?.nombre || '—'
  return (
    <div>
      <Titulo sub="Cada cuenta con su dueño. Solo nombre y saldo: nunca números de cuenta ni de tarjeta."
        derecha={<div style={{ display:'flex', gap:8 }}>
          {activas.length > 1 && <button id="cu-traslado" type="button" className="btn" onClick={() => setTraslado(true)} style={{ width:'auto' }}>⇄ Traslado</button>}
          <button id="cu-nueva" type="button" className="btn-gold" onClick={() => setEditar({})} style={{ width:'auto' }}>+ Cuenta</button>
        </div>}>Tus cuentas</Titulo>

      {activas.length === 0 && <div className="panel" style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.6 }}>Agrega tus cuentas: Bancolombia, Nubank, ARQ, efectivo y las de tus negocios. Pon el saldo que tienen hoy y desde ahí cada gasto e ingreso lo mueve solo.</div>}
      {activas.length > 0 && (
        <div className="panel" style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div><Etq>Disponible de Luis (pesos)</Etq><div id="cu-total" style={{ fontSize:24, fontWeight:800, color: totalLuis < 0 ? 'var(--red)' : 'var(--green)' }}>{cop(totalLuis)}</div></div>
          <div style={{ fontSize:12, color:'var(--text3)', maxWidth:300 }}>Suma lo disponible de tus cuentas y tarjetas a nombre tuyo. Lo de los negocios va aparte.</div>
        </div>
      )}

      {Object.entries(DUENOS).map(([k, d]) => {
        const lista = activas.filter(c => c.dueno === k)
        if (!lista.length) return null
        return (
          <div key={k} style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.2, textTransform:'uppercase', color:d.c, margin:'0 2px 8px' }}>{d.l}</div>
            <div className="ms-cuentas" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:10 }}>
              {lista.map(c => {
                const s = saldo[c.id] || {}, cred = esCredito(c), pct = cred && c.cupo ? Math.min(100, Math.max(0, (s.usado / c.cupo) * 100)) : 0
                return (
                  <div key={c.id} id={`cu-${c.nombre.replace(/\W/g, '')}`} className="panel" onClick={() => setEditar(c)} style={{ cursor:'pointer', borderLeft:`4px solid ${d.c}`, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                      <div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{TIPOS_CUENTA[c.tipo]}{c.moneda === 'USD' ? ' · USD' : ''}</div>
                    </div>
                    <div className="cu-saldo" style={{ fontSize:20, fontWeight:800, marginTop:6, color: s.disponible < 0 ? 'var(--red)' : 'var(--text)' }}>{c.moneda === 'USD' ? 'US' : ''}{cop(s.disponible)}</div>
                    <div style={{ fontSize:11.5, color:'var(--text3)' }}>{cred ? `disponible de ${cop(c.cupo)} · usado ${cop(s.usado)}` : 'disponible'}</div>
                    {cred && <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', marginTop:8, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background: pct > 80 ? 'var(--red)' : AZUL }} /></div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {traslados.length > 0 && (
        <div className="panel">
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.2, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Últimos traslados</div>
          {[...traslados].sort((a, b) => String(b.fecha).localeCompare(a.fecha)).slice(0, 8).map(t => (
            <div key={t.id} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'8px 0', borderTop:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text2)' }}>{t.fecha} · {nombre(t.de_cuenta)} → {nombre(t.a_cuenta)}{t.nota ? ` · ${t.nota}` : ''}</span>
              <b style={{ color:'var(--text)', whiteSpace:'nowrap' }}>{cop(t.monto)}</b>
            </div>
          ))}
        </div>
      )}
      {editar && <ModalCuenta c={editar} onCerrar={() => setEditar(null)} onListo={() => { setEditar(null); recargar() }} />}
      {traslado && <ModalTraslado cuentas={activas} onCerrar={() => setTraslado(false)} onListo={() => { setTraslado(false); recargar() }} />}
    </div>
  )
}

function ModalCuenta({ c, onCerrar, onListo }) {
  const nueva = !c.id
  const [f, setF] = useState({ nombre: c.nombre || '', tipo: c.tipo || 'ahorros', dueno: c.dueno || 'luis', moneda: c.moneda || 'COP', saldo_inicial: String(c.saldo_inicial ?? ''), cupo: String(c.cupo ?? '') })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const num = v => Number(String(v).replace(/[^\d.-]/g, '')) || 0
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Ponle un nombre. Ej: Bancolombia ahorros')
    if (/\d{6,}/.test(f.nombre)) return setError('No pongas números de cuenta o tarjeta en el nombre.')
    const fila = { nombre: f.nombre.trim(), tipo: f.tipo, dueno: f.dueno, moneda: f.moneda, saldo_inicial: num(f.saldo_inicial), cupo: f.tipo === 'credito' ? num(f.cupo) : null }
    const r = nueva ? await supabase.from('my_space_cuentas').insert(fila) : await supabase.from('my_space_cuentas').update(fila).eq('id', c.id)
    if (r.error) return setError(r.error.message)
    onListo()
  }
  const archivar = async () => { await supabase.from('my_space_cuentas').update({ activa: false }).eq('id', c.id); onListo() }
  const cred = f.tipo === 'credito'
  return (
    <Modal titulo={nueva ? 'Nueva cuenta' : c.nombre} onCerrar={onCerrar}>
      <div style={{ marginBottom:12 }}><Etq>Nombre</Etq><input id="mc-nombre" value={f.nombre} onChange={set('nombre')} placeholder="Bancolombia ahorros, Nubank, ARQ, Efectivo" style={iStyle} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>Tipo</Etq><select id="mc-tipo" value={f.tipo} onChange={set('tipo')} style={iStyle}>{Object.entries(TIPOS_CUENTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><Etq>De quién es</Etq><select id="mc-dueno" value={f.dueno} onChange={set('dueno')} style={iStyle}>{Object.entries(DUENOS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}</select></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns: cred ? '1fr 1fr' : '1fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>Moneda</Etq><select value={f.moneda} onChange={set('moneda')} style={iStyle}><option>COP</option><option>USD</option></select></div>
        {cred && <div><Etq>Cupo total</Etq><input id="mc-cupo" inputMode="numeric" value={f.cupo} onChange={set('cupo')} placeholder="2000000" style={iStyle} /></div>}
      </div>
      <div style={{ marginBottom:6 }}><Etq>{cred ? 'Lo que ya debes en la tarjeta hoy' : 'Saldo que tiene hoy'}</Etq><input id="mc-saldo" inputMode="numeric" value={f.saldo_inicial} onChange={set('saldo_inicial')} placeholder={cred ? '1900000' : '100000'} style={iStyle} /></div>
      <div style={{ fontSize:11.5, color:'var(--text3)', marginBottom:14 }}>{cred ? 'Ej: cupo $2.000.000 y debes $1.900.000 → tienes $100.000 disponibles.' : 'Desde aquí cada gasto e ingreso con esta cuenta mueve el saldo.'}</div>
      {error && <div style={{ fontSize:12.5, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="mc-guardar" type="button" className="btn-gold" onClick={guardar}>Guardar</button>
        {!nueva && <button type="button" className="btn" onClick={archivar} style={{ color:'var(--red)', width:'auto' }}>Archivar</button>}
      </div>
    </Modal>
  )
}

function ModalTraslado({ cuentas, onCerrar, onListo }) {
  const [f, setF] = useState({ de: cuentas[0]?.id || '', a: cuentas[1]?.id || '', monto: '', nota: '', fecha: hoyISO() })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    const monto = Number(String(f.monto).replace(/\D/g, ''))
    if (!monto) return setError('Escribe el monto')
    if (f.de === f.a) return setError('Elige dos cuentas distintas')
    const r = await supabase.from('my_space_traslados').insert({ de_cuenta: f.de, a_cuenta: f.a, monto, nota: f.nota || null, fecha: f.fecha })
    if (r.error) return setError(r.error.message)
    onListo()
  }
  return (
    <Modal titulo="Traslado entre cuentas" onCerrar={onCerrar}>
      <div style={{ fontSize:12.5, color:'var(--text3)', marginBottom:12 }}>Ej: de LRM Core a tu cuenta cuando te pagas, o pagar la tarjeta desde ahorros. No cuenta como gasto.</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>Sale de</Etq><select id="tr-de" value={f.de} onChange={set('de')} style={iStyle}>{cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
        <div><Etq>Entra a</Etq><select id="tr-a" value={f.a} onChange={set('a')} style={iStyle}>{cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>Monto</Etq><input id="tr-monto" inputMode="numeric" value={f.monto} onChange={set('monto')} style={iStyle} /></div>
        <div><Etq>Fecha</Etq><input type="date" value={f.fecha} onChange={set('fecha')} style={iStyle} /></div>
      </div>
      <div style={{ marginBottom:14 }}><Etq>Nota</Etq><input value={f.nota} onChange={set('nota')} placeholder="Pago de honorarios, pago tarjeta…" style={iStyle} /></div>
      {error && <div style={{ fontSize:12.5, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <button id="tr-guardar" type="button" className="btn-gold" onClick={guardar}>Guardar traslado</button>
    </Modal>
  )
}

// ─── Pagos fijos y suscripciones ──────────────────────────────────────────────
export function Fijos() {
  const [lista, setLista] = useState(null)
  const [editar, setEditar] = useState(null)
  const [aviso, setAviso] = useState('')
  const cargar = async () => {
    const r = await supabase.from('my_space_fijos').select('*').order('dia')
    setLista(r.error ? false : (r.data || []))
  }
  useEffect(() => { cargar() }, [])
  const anotar = async () => {
    const { data, error } = await supabase.rpc('myspace_aplicar_fijos')
    setAviso(error ? 'No se pudo: ' + error.message : data ? `✓ Anoté ${data} pago${data === 1 ? '' : 's'} fijo${data === 1 ? '' : 's'} de este mes` : 'Los fijos de este mes ya estaban anotados')
  }
  if (lista === null) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (lista === false) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>26_myspace_plata_habitos.sql</b> en Supabase.</div>
  const activos = lista.filter(f => f.activo), total = activos.reduce((t, f) => t + Number(f.monto || 0), 0)
  return (
    <div>
      <Titulo sub="Celular, streaming, Claude, arriendo, colegio… Se anotan solos en gastos cada mes cuando llega su día."
        derecha={<div style={{ display:'flex', gap:8 }}><button id="fi-anotar" type="button" className="btn" onClick={anotar} style={{ width:'auto' }}>Anotar los de este mes</button><button id="fi-nuevo" type="button" className="btn-gold" onClick={() => setEditar({})} style={{ width:'auto' }}>+ Fijo</button></div>}>
        Pagos fijos y suscripciones
      </Titulo>
      {aviso && <div style={{ fontSize:12.5, color: aviso.startsWith('✓') ? 'var(--green)' : 'var(--text2)', marginBottom:10 }}>{aviso}</div>}
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><Etq>Total al mes</Etq><b id="fi-total" style={{ color:'var(--red)' }}>{cop(total)}</b></div>
        {lista.length === 0 && <div style={{ fontSize:13, color:'var(--text3)', padding:'8px 0' }}>Todavía no hay fijos.</div>}
        {lista.map(f => (
          <div key={f.id} onClick={() => setEditar(f)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'10px 0', borderTop:'1px solid var(--border)', cursor:'pointer', opacity: f.activo ? 1 : 0.45 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.05)', display:'grid', placeItems:'center', fontSize:12, fontWeight:800, color:'var(--text2)', flexShrink:0 }}>{f.dia}</div>
              <div style={{ minWidth:0 }}><div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{f.nombre}</div><div style={{ fontSize:11.5, color:'var(--text3)' }}>{f.persona} · {f.categoria}{f.activo ? '' : ' · pausado'}</div></div>
            </div>
            <b style={{ whiteSpace:'nowrap', color:'var(--text)' }}>{cop(f.monto)}</b>
          </div>
        ))}
      </div>
      {editar && <ModalFijo f0={editar} onCerrar={() => setEditar(null)} onListo={() => { setEditar(null); cargar() }} />}
    </div>
  )
}
function ModalFijo({ f0, onCerrar, onListo }) {
  const nuevo = !f0.id
  const [f, setF] = useState({ nombre: f0.nombre || '', monto: String(f0.monto ?? ''), dia: String(f0.dia ?? '1'), persona: f0.persona || 'Luis', categoria: f0.categoria || 'Suscripciones', cuenta_id: f0.cuenta_id || '', activo: f0.activo ?? true })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    const monto = Number(String(f.monto).replace(/\D/g, '')), dia = Math.min(31, Math.max(1, Number(f.dia) || 1))
    if (!f.nombre.trim() || !monto) return setError('Nombre y monto')
    const fila = { nombre: f.nombre.trim(), monto, dia, persona: f.persona, categoria: f.categoria, cuenta_id: f.cuenta_id || null, activo: f.activo }
    const r = nuevo ? await supabase.from('my_space_fijos').insert(fila) : await supabase.from('my_space_fijos').update(fila).eq('id', f0.id)
    if (r.error) return setError(r.error.message)
    onListo()
  }
  const borrar = async () => { await supabase.from('my_space_fijos').delete().eq('id', f0.id); onListo() }
  return (
    <Modal titulo={nuevo ? 'Nuevo pago fijo' : f0.nombre} onCerrar={onCerrar}>
      <div style={{ marginBottom:12 }}><Etq>Qué es</Etq><input id="mf-nombre" value={f.nombre} onChange={set('nombre')} placeholder="Netflix, plan celular, colegio Lucía" style={iStyle} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>Monto al mes</Etq><input id="mf-monto" inputMode="numeric" value={f.monto} onChange={set('monto')} style={iStyle} /></div>
        <div><Etq>Día del mes</Etq><input id="mf-dia" inputMode="numeric" value={f.dia} onChange={set('dia')} style={iStyle} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div><Etq>De quién</Etq><select value={f.persona} onChange={e => setF(p => ({ ...p, persona: e.target.value, categoria: (CATS_GASTO[e.target.value] || [])[0] }))} style={iStyle}>{PERSONAS.map(p => <option key={p}>{p}</option>)}</select></div>
        <div><Etq>Categoría</Etq><select id="mf-cat" value={f.categoria} onChange={set('categoria')} style={iStyle}>{(CATS_GASTO[f.persona] || []).map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <SelectCuenta value={f.cuenta_id} onChange={v => setF(p => ({ ...p, cuenta_id: v }))} etiqueta="Se paga con" />
      <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--text2)', marginBottom:14 }}><input type="checkbox" checked={f.activo} onChange={e => setF(p => ({ ...p, activo: e.target.checked }))} /> Activo</label>
      {error && <div style={{ fontSize:12.5, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="mf-guardar" type="button" className="btn-gold" onClick={guardar}>Guardar</button>
        {!nuevo && <button type="button" className="btn" onClick={borrar} style={{ color:'var(--red)', width:'auto' }}>Borrar</button>}
      </div>
    </Modal>
  )
}

// ─── El orden de la plata ─────────────────────────────────────────────────────
export function useOrden() {
  const [d, setD] = useState(null)
  const cargar = async () => {
    const hoy = hoyISO(), mes = hoy.slice(0, 7) + '-01'
    const [b, ing, gas, ab] = await Promise.all([
      supabase.from('my_space_bolsas').select('*'),
      supabase.from('my_space_ingresos_v2').select('monto').gte('fecha', mes),
      supabase.from('my_space_gastos_v2').select('monto,persona,categoria,meta_id').gte('fecha', mes),
      supabase.from('my_space_pagos_deuda').select('monto').gte('fecha', mes),
    ])
    const meta = Object.fromEntries((b.data || []).map(x => [x.id, Number(x.monto) || 0]))
    const usado = { lucia: 0, fijos: 0, deudas: 0, ahorro: 0, libre: 0 }
    ;(gas.data || []).forEach(g => { usado[bolsaDe(g)] += Number(g.monto) || 0 })
    ;(ab.data || []).forEach(a => { usado.deudas += Number(a.monto) || 0 })
    const ingresos = (ing.data || []).reduce((t, x) => t + Number(x.monto || 0), 0)
    const apartado = BOLSAS.reduce((t, x) => t + Math.max(meta[x.id] || 0, usado[x.id]), 0)
    setD({ meta, usado, ingresos, libre: ingresos - apartado - usado.libre, falta: !!b.error })
  }
  useEffect(() => { cargar() }, [])
  return { d, recargar: cargar }
}

export function Orden() {
  const { d, recargar } = useOrden()
  const [editar, setEditar] = useState(false)
  const [m, setM] = useState({})
  useEffect(() => { if (d) setM(Object.fromEntries(BOLSAS.map(b => [b.id, String(d.meta[b.id] || '')]))) }, [d])
  if (!d) return <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
  if (d.falta) return <div className="panel" style={{ fontSize:13, color:'var(--text2)' }}>Corre el archivo <b>26_myspace_plata_habitos.sql</b> en Supabase.</div>
  const guardar = async () => {
    for (const b of BOLSAS) await supabase.from('my_space_bolsas').upsert({ id: b.id, monto: Number(String(m[b.id]).replace(/\D/g, '')) || 0 })
    setEditar(false); recargar()
  }
  return (
    <div>
      <Titulo sub="Cada peso que entra se reparte en este orden. Lucía primero."
        derecha={<button id="or-editar" type="button" className={editar ? 'btn-gold' : 'btn'} onClick={() => editar ? guardar() : setEditar(true)} style={{ width:'auto' }}>{editar ? 'Guardar montos' : 'Cambiar montos'}</button>}>
        El orden de la plata
      </Titulo>
      <div className="panel" style={{ marginBottom:12 }}><Etq>Entró este mes</Etq><div style={{ fontSize:22, fontWeight:800, color:'var(--green)' }}>{cop(d.ingresos)}</div></div>
      {BOLSAS.map((b, i) => {
        const meta = d.meta[b.id] || 0, us = d.usado[b.id], pct = meta ? Math.min(100, (us / meta) * 100) : 0
        return (
          <div key={b.id} id={`or-${b.id}`} className="panel" style={{ marginBottom:10, padding:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:0 }}>
                <div style={{ width:30, height:30, borderRadius:10, background:`${AZUL}22`, color:AZUL, display:'grid', placeItems:'center', fontWeight:900, flexShrink:0 }}>{i + 1}</div>
                <div style={{ minWidth:0 }}><div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)' }}>{b.icono} {b.l}</div><div style={{ fontSize:11.5, color:'var(--text3)' }}>{b.d}</div></div>
              </div>
              {editar
                ? <input id={`or-m-${b.id}`} inputMode="numeric" value={m[b.id] || ''} onChange={e => setM(p => ({ ...p, [b.id]: e.target.value }))} placeholder="al mes" style={{ ...iStyle, width:130, marginTop:0, textAlign:'right' }} />
                : <div style={{ textAlign:'right', flexShrink:0 }}><b style={{ color:'var(--text)' }}>{cop(us)}</b><div style={{ fontSize:11, color:'var(--text3)' }}>de {meta ? cop(meta) : 'sin monto'}</div></div>}
            </div>
            {!editar && meta > 0 && <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.07)', marginTop:10, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background: pct >= 100 ? 'var(--green)' : AZUL }} /></div>}
          </div>
        )
      })}
      <div className="panel" style={{ padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ width:30, height:30, borderRadius:10, background:'rgba(76,175,80,0.15)', color:'var(--green)', display:'grid', placeItems:'center', fontWeight:900 }}>5</div>
          <div><div style={{ fontSize:14.5, fontWeight:800, color:'var(--text)' }}>✨ Libre</div><div style={{ fontSize:11.5, color:'var(--text3)' }}>Lo que queda después de lo de arriba, menos lo ya gastado libre ({cop(d.usado.libre)})</div></div>
        </div>
        <b id="or-libre" style={{ whiteSpace:'nowrap', fontSize:18, color: d.libre < 0 ? 'var(--red)' : 'var(--green)' }}>{cop(d.libre)}</b>
      </div>
    </div>
  )
}