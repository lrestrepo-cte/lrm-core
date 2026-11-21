// @ts-nocheck
// LRM Trade Consulting · Consolidador
// Juntas la carga de varios clientes en un mismo envío (ej. Shanghái → Barranquilla) y el sistema te dice
// cuántos contenedores llenas, qué combinación te sale más barata con las tarifas de tus aliados,
// cuánto le cobras a cada cliente y cuánto ganas.
// Tablas: lrm_consolidados, lrm_consolidado_items (SQL 12) · usa lrm_tarifas_flete (SQL 11)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { linkWhatsApp, hoyISO, fechaCorta } from './LRMClientes'
import { CONTENEDORES } from './Aliados'
import { useDatosLRM } from './datosLRM'

const usd = n => 'US$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })
const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'24px 0', textAlign:'center' }}>{children}</div>
const ESTADOS = { abierto:{ l:'Abierto · recibiendo carga', c:'#4caf50' }, cerrado:{ l:'Cerrado', c:'#E8A23A' }, despachado:{ l:'Despachado', c:'#378ADD' }, entregado:{ l:'Entregado', c:'#8A94A6' } }
const TIPOS_FCL = ['40HC', '40GP', '20GP']
const vigente = t => !t.vigente_hasta || t.vigente_hasta >= hoyISO()

// ── Cálculo: la combinación de contenedores (y carga suelta) más barata ─────
export function planes(m3, kg, tarifasRuta) {
  if (!m3) return []
  const barata = tipo => tarifasRuta.filter(t => t.tipo === tipo && vigente(t)).sort((a, b) => n2(a.costo_usd) - n2(b.costo_usd))[0]
  const costo = { '20GP': barata('20GP'), '40GP': barata('40GP'), '40HC': barata('40HC') }
  const lcl = barata('LCL')
  const sinTarifas = !costo['20GP'] && !costo['40GP'] && !costo['40HC'] && !lcl
  const max = Math.ceil(m3 / 28) + 1
  const out = []
  for (let a = 0; a <= Math.min(max, 8); a++) for (let b = 0; b <= Math.min(max, 6); b++) for (let c = 0; c <= Math.min(max, 6); c++) {
    const n = { '40HC': a, '40GP': b, '20GP': c }
    if (!sinTarifas && TIPOS_FCL.some(t => n[t] && !costo[t])) continue
    const cap = TIPOS_FCL.reduce((s, t) => s + n[t] * CONTENEDORES[t].util, 0)
    const capKg = TIPOS_FCL.reduce((s, t) => s + n[t] * CONTENEDORES[t].kg, 0)
    const resto = Math.max(0, m3 - cap)
    if (resto > 0 && (sinTarifas || !lcl)) continue
    if (resto === 0 && cap - m3 >= 28 && a + b + c > 1) continue                 // sobra un contenedor entero
    if (cap > 0 && kg > capKg + (resto ? kg * resto / m3 : 0)) continue          // se pasa de peso
    const m3Lcl = resto ? Math.max(resto, n2(lcl?.minimo_m3) || 1) : 0
    const total = sinTarifas ? null : TIPOS_FCL.reduce((s, t) => s + n[t] * n2(costo[t]?.costo_usd), 0) + m3Lcl * n2(lcl?.costo_usd)
    const partes = TIPOS_FCL.filter(t => n[t]).map(t => `${n[t]}×${t}`)
    if (resto) partes.push(`${fmt(resto)} m³ en carga suelta`)
    out.push({ n, cap, resto, total, texto: partes.join(' + '), lleno: cap ? Math.min(m3, cap) / cap : 1, contenedores: a + b + c, costo, lcl })
  }
  return out.sort((x, y) => sinTarifas ? (x.contenedores - y.contenedores || x.cap - y.cap) : (x.total - y.total || x.contenedores - y.contenedores))
    .filter((p, i, arr) => arr.findIndex(q => q.texto === p.texto) === i).slice(0, 4)
}

export default function Consolidador() {
  const [lista, setLista] = useState([])
  const [items, setItems] = useState([])
  const [tarifas, setTarifas] = useState([])
  const [clientes, setClientes] = useState([])
  const [abierto, setAbierto] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const cargar = async () => {
    const [c, i, t, cl] = await Promise.all([
      supabase.from('lrm_consolidados').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_consolidado_items').select('*').order('created_at'),
      supabase.from('lrm_tarifas_flete').select('*'),
      supabase.from('lrm_clientes').select('id,nombre,telefono').order('nombre'),
    ])
    if (c.error || i.error) { setFaltaTabla(true); return }
    setLista(c.data || []); setItems(i.data || []); setTarifas(t.data || []); setClientes(cl.data || [])
  }
  useEffect(() => { cargar() }, [])
  if (faltaTabla) return <div className="panel" style={{ border:'1px solid var(--gold-border)', color:'var(--gold)', fontSize:13 }}>Para usar el Consolidador corre en Supabase el archivo <b>12_lrm_consolidados.sql</b>.</div>

  const cons = lista.find(c => c.id === abierto)
  if (cons) return <Detalle cons={cons} items={items.filter(i => i.consolidado_id === cons.id)} tarifas={tarifas} clientes={clientes} onVolver={() => setAbierto(null)} onCambio={cargar} />
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:13, color:'var(--text3)' }}>Junta la carga de varios clientes y llena contenedores.</div>
        <button id="cs-nuevo" onClick={() => setNuevo(true)} className="btn-gold" style={{ width:'auto' }}>+ Nuevo consolidado</button>
      </div>
      {lista.length === 0 ? <div className="panel"><Vacio>Crea tu primer consolidado, por ejemplo "Shanghái · diciembre".</Vacio></div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap:12 }}>
          {lista.map(c => {
            const its = items.filter(i => i.consolidado_id === c.id)
            const m3 = its.reduce((s, i) => s + n2(i.cbm), 0)
            const nCli = new Set(its.map(i => i.cliente_id)).size
            const mejor = planes(m3, its.reduce((s, i) => s + n2(i.peso_kg), 0), tarifas.filter(t => t.origen === c.origen && t.destino === c.destino))[0]
            const e = ESTADOS[c.estado] || ESTADOS.abierto
            return (
              <div key={c.id} onClick={() => setAbierto(c.id)} className="panel cs-card" style={{ cursor:'pointer', borderLeft:`3px solid ${e.c}` }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>CONS-{String(c.numero || '').padStart(3, '0')} · {c.origen} → {c.destino}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
                <div style={{ fontSize:12, color:e.c, marginTop:2 }}>{e.l}{c.fecha_cierre ? ` · cierra ${fechaCorta(c.fecha_cierre)}` : ''}</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginTop:8 }}><b style={{ color:'var(--text)' }}>{fmt(m3)} m³</b> · {nCli} cliente{nCli === 1 ? '' : 's'} · {its.length} carga{its.length === 1 ? '' : 's'}</div>
                {mejor && <div style={{ fontSize:12, color:'var(--gold)', marginTop:4 }}>{mejor.texto}{mejor.cap ? ` · ${fmt(mejor.lleno * 100, 0)}% lleno` : ''}</div>}
              </div>
            )
          })}
        </div>
      )}
      {nuevo && <ModalConsolidado tarifas={tarifas} onCerrar={() => setNuevo(false)} onGuardado={async (id) => { setNuevo(false); await cargar(); setAbierto(id) }} />}
    </div>
  )
}

function ModalConsolidado({ cons, tarifas, onCerrar, onGuardado }) {
  const origenes = [...new Set(['Shanghái', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Colón (Panamá)', ...tarifas.map(t => t.origen)])]
  const [f, setF] = useState({ nombre:'', origen:'Shanghái', destino:'Barranquilla', fecha_cierre:'', notas:'', ...(cons || {}) })
  const [error, setError] = useState('')
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Ponle un nombre, ej. "Shanghái · diciembre".')
    const datos = { nombre: f.nombre.trim(), origen: f.origen, destino: f.destino, fecha_cierre: f.fecha_cierre || null, notas: f.notas || null }
    const r = f.id ? await supabase.from('lrm_consolidados').update(datos).eq('id', f.id).select().single() : await supabase.from('lrm_consolidados').insert(datos).select().single()
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado(r.data?.id || f.id)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:480, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{f.id ? 'Editar consolidado' : 'Nuevo consolidado'}</div>
        <div style={{ marginBottom:10 }}><Etiqueta>Nombre</Etiqueta><input id="cs-nombre" value={f.nombre} onChange={set('nombre')} placeholder="Shanghái · diciembre" style={iStyle} autoFocus /></div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Origen</Etiqueta><input id="cs-origen" list="cs-origenes" value={f.origen} onChange={set('origen')} style={iStyle} /><datalist id="cs-origenes">{origenes.map(o => <option key={o} value={o} />)}</datalist></div>
          <div><Etiqueta>Destino</Etiqueta><input value={f.destino} onChange={set('destino')} style={iStyle} /></div>
          <div><Etiqueta>Recibe carga hasta</Etiqueta><input type="date" value={f.fecha_cierre || ''} onChange={set('fecha_cierre')} style={iStyle} /></div>
        </div>
        <div style={{ marginBottom:14 }}><Etiqueta>Notas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button id="cs-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Un consolidado por dentro ──────────────────────────────────────────────
function Detalle({ cons, items, tarifas, clientes, onVolver, onCambio }) {
  const divisas = useDivisas()
  const trm = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const { empresa } = useDatosLRM()
  const [item, setItem] = useState(null)
  const [editar, setEditar] = useState(false)
  const [copiado, setCopiado] = useState('')
  const ruta = tarifas.filter(t => t.origen === cons.origen && t.destino === cons.destino)
  const lclVenta = ruta.filter(t => t.tipo === 'LCL' && vigente(t)).map(t => n2(t.costo_usd) + n2(t.margen_usd)).sort((a, b) => a - b)[0]
  const m3 = items.reduce((s, i) => s + n2(i.cbm), 0)
  const kg = items.reduce((s, i) => s + n2(i.peso_kg), 0)
  const ingreso = items.reduce((s, i) => s + n2(i.cbm) * n2(i.tarifa_m3_usd), 0)
  const opciones = useMemo(() => planes(m3, kg, ruta), [m3, kg, ruta.length])
  const elegido = opciones.find(o => o.texto === cons.plan) || opciones[0]
  const costo = elegido?.total ?? null
  const nombreCli = id => clientes.find(c => c.id === id)?.nombre || 'Sin cliente'
  const porCliente = [...new Set(items.map(i => i.cliente_id))].map(id => {
    const its = items.filter(i => i.cliente_id === id)
    return { id, nombre: nombreCli(id), tel: clientes.find(c => c.id === id)?.telefono, its, m3: its.reduce((s, i) => s + n2(i.cbm), 0), kg: its.reduce((s, i) => s + n2(i.peso_kg), 0), bultos: its.reduce((s, i) => s + n2(i.bultos), 0), total: its.reduce((s, i) => s + n2(i.cbm) * n2(i.tarifa_m3_usd), 0) }
  }).sort((a, b) => b.m3 - a.m3)

  const setEstado = async e => { await supabase.from('lrm_consolidados').update({ estado: e.target.value }).eq('id', cons.id); onCambio() }
  const usarPlan = async p => { await supabase.from('lrm_consolidados').update({ plan: p.texto }).eq('id', cons.id); onCambio() }
  const textoCliente = c => [
    `Hola ${c.nombre.split(' ')[0]}, este es el resumen de tu carga en nuestro consolidado *${cons.nombre}* (${cons.origen} → ${cons.destino}):`, '',
    ...c.its.map(i => `• ${i.descripcion || 'Mercancía'}${i.bultos ? ` · ${i.bultos} bultos` : ''} · ${fmt(i.cbm, 2)} m³${i.peso_kg ? ` · ${fmt(i.peso_kg, 0)} kg` : ''}${i.estado === 'en_bodega' ? ' · ✓ en bodega' : ' · por llegar'}`),
    '', `Total: ${fmt(c.m3, 2)} m³ · *${usd(c.total)}*${trm ? ` (aprox. ${cop(c.total * trm)})` : ''}`,
    ...(cons.fecha_cierre ? [`Recibimos carga hasta el ${fechaCorta(cons.fecha_cierre)}.`] : []), '', `*${empresa.nombre}* · We bring it. Safe and on time.`,
  ].join('\n')
  const copiar = async (t, k) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 2000) } catch {} }
  const e = ESTADOS[cons.estado] || ESTADOS.abierto

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div>
          <button onClick={onVolver} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto', marginBottom:6 }}>← Consolidados</button>
          <div style={{ fontSize:11, color:'var(--text3)' }}>CONS-{String(cons.numero || '').padStart(3, '0')} · {cons.origen} → {cons.destino}{cons.fecha_cierre ? ` · recibe hasta ${fechaCorta(cons.fecha_cierre)}` : ''}</div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>{cons.nombre}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select value={cons.estado} onChange={setEstado} style={{ ...iStyle, marginTop:0, width:'auto', color:e.c }}>{Object.entries(ESTADOS).map(([k, x]) => <option key={k} value={k}>{x.l}</option>)}</select>
          <button onClick={() => setEditar(true)} className="btn" style={{ width:'auto' }}>Editar</button>
          <button id="cs-item-nuevo" onClick={() => setItem({ consolidado_id: cons.id, cliente_id:'', descripcion:'', proveedor:'', bultos:'', cbm:'', peso_kg:'', tarifa_m3_usd: lclVenta ? String(lclVenta) : '', estado:'por_llegar' })} className="btn-gold" style={{ width:'auto' }}>+ Carga de un cliente</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap:10 }}>
        {[['Volumen', `${fmt(m3, 2)} m³`, 'var(--text)'], ['Peso', `${fmt(kg, 0)} kg`, 'var(--text)'], ['Clientes', porCliente.length, 'var(--text)'],
          ['Le cobras', usd(ingreso), 'var(--gold)'], ['Te cuesta', costo == null ? '—' : usd(costo), 'var(--red)'], ['Ganas', costo == null ? '—' : usd(ingreso - costo), ingreso - (costo || 0) >= 0 ? 'var(--green)' : 'var(--red)']].map(([l, v, c]) => (
          <div key={l} className="panel" style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', fontWeight:700 }}>{l}</div>
            <div style={{ fontSize:19, fontWeight:800, color:c, marginTop:2 }}>{v}</div>
            {l === 'Ganas' && costo != null && trm ? <div style={{ fontSize:11, color:'var(--text3)' }}>{cop((ingreso - costo) * trm)}</div> : null}
          </div>
        ))}
      </div>

      {/* Planeador de contenedores */}
      <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)', marginBottom:10 }}>CÓMO SE LLENA</div>
        {!m3 ? <Vacio>Agrega la carga de tus clientes y aquí te digo cuántos contenedores llenas.</Vacio> : (
          <>
            {!ruta.length && <div style={{ fontSize:12, color:'#E8A23A', marginBottom:8 }}>No tienes tarifas para {cons.origen} → {cons.destino} en Aliados y fletes: te muestro solo por espacio, sin costos.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {opciones.map((p, i) => {
                const activo = p === elegido
                return (
                  <div key={p.texto} className="cs-plan" style={{ padding:'10px 12px', borderRadius:10, background: activo ? 'var(--gold-dim)' : 'var(--bg4)', border:`1px solid ${activo ? 'var(--gold-border)' : 'transparent'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{i === 0 && p.total != null ? '★ ' : ''}{p.texto}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>
                          {p.cap ? `Capacidad ${fmt(p.cap, 0)} m³ · ${fmt(p.lleno * 100, 0)}% lleno${p.cap > m3 ? ` · te sobran ${fmt(p.cap - m3)} m³ para vender` : ''}` : 'Todo en carga suelta'}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        {p.total != null && <div style={{ textAlign:'right' }}><div style={{ fontSize:15, fontWeight:800, color:'var(--red)' }}>{usd(p.total)}</div><div style={{ fontSize:11, color:'var(--green)' }}>ganas {usd(ingreso - p.total)}</div></div>}
                        {!activo && <button onClick={() => usarPlan(p)} className="btn" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>Usar este</button>}
                      </div>
                    </div>
                    {p.cap > 0 && (
                      <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                        {(() => { let resta = m3; return TIPOS_FCL.flatMap(t => Array.from({ length: p.n[t] }, (_, k) => { const cap = CONTENEDORES[t].util, usa = Math.min(resta, cap); resta -= usa; return (
                          <div key={t + k} style={{ flex:'1 1 120px', minWidth:110 }}>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{t} · {fmt(usa)} / {cap} m³</div>
                            <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden', marginTop:2 }}><div style={{ width:`${usa / cap * 100}%`, height:'100%', background: usa / cap > 0.85 ? 'var(--green)' : 'var(--gold)' }} /></div>
                          </div>
                        ) })) })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Carga por cliente */}
      <div className="panel">
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:10 }}>CARGA POR CLIENTE</div>
        {porCliente.length === 0 ? <Vacio>Sin carga todavía.</Vacio> : porCliente.map(c => {
          const txt = textoCliente(c), wa = c.tel ? linkWhatsApp(c.tel, c.nombre, txt) : null
          return (
            <div key={c.id || 'x'} style={{ borderBottom:'1px solid var(--border)', padding:'10px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{c.nombre} <span style={{ fontSize:12, fontWeight:400, color:'var(--text3)' }}>· {fmt(c.m3, 2)} m³ · {fmt(c.kg, 0)} kg{c.bultos ? ` · ${c.bultos} bultos` : ''} · {fmt(m3 ? c.m3 / m3 * 100 : 0, 0)}% del envío</span></div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <b style={{ color:'var(--gold)' }}>{usd(c.total)}</b>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ fontSize:11, padding:'4px 9px', textDecoration:'none', color:'#25D366' }}>WhatsApp</a>}
                  <button onClick={() => copiar(txt, c.id)} className="btn" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>{copiado === c.id ? '✓' : 'Copiar'}</button>
                </div>
              </div>
              {c.its.map(i => (
                <div key={i.id} onClick={() => setItem(i)} className="cs-item" style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:12, color:'var(--text2)', padding:'5px 8px', marginTop:4, borderRadius:8, background:'var(--bg4)', cursor:'pointer' }}>
                  <span>{i.descripcion || 'Mercancía'}{i.proveedor ? ` · ${i.proveedor}` : ''}{i.bultos ? ` · ${i.bultos} bultos` : ''} · {fmt(i.cbm, 2)} m³{i.peso_kg ? ` · ${fmt(i.peso_kg, 0)} kg` : ''}</span>
                  <span style={{ color: i.estado === 'en_bodega' ? 'var(--green)' : '#E8A23A', whiteSpace:'nowrap' }}>{i.estado === 'en_bodega' ? '✓ En bodega' : 'Por llegar'} · {usd(n2(i.cbm) * n2(i.tarifa_m3_usd))}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {item && <ModalItem item={item} clientes={clientes} onCerrar={() => setItem(null)} onGuardado={() => { setItem(null); onCambio() }} />}
      {editar && <ModalConsolidado cons={cons} tarifas={tarifas} onCerrar={() => setEditar(false)} onGuardado={() => { setEditar(false); onCambio() }} />}
    </div>
  )
}

function ModalItem({ item, clientes, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...item, bultos: String(item.bultos ?? ''), cbm: String(item.cbm ?? ''), peso_kg: String(item.peso_kg ?? ''), tarifa_m3_usd: String(item.tarifa_m3_usd ?? '') })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.cliente_id) return setError('Elige el cliente.')
    if (!n2(f.cbm)) return setError('Pon los m³.')
    const { id, created_at, ...d } = f
    const datos = { ...d, bultos: Math.round(n2(d.bultos)), cbm: n2(d.cbm), peso_kg: n2(d.peso_kg), tarifa_m3_usd: n2(d.tarifa_m3_usd) }
    const r = id ? await supabase.from('lrm_consolidado_items').update(datos).eq('id', id) : await supabase.from('lrm_consolidado_items').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_consolidado_items').delete().eq('id', f.id); onGuardado() }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:520, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:14 }}>{f.id ? 'Editar carga' : 'Carga de un cliente'}</div>
        <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
          <div><Etiqueta>Cliente</Etiqueta><select id="ci-cliente" value={f.cliente_id || ''} onChange={set('cliente_id')} style={iStyle}><option value="">Elegir…</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><Etiqueta>Estado</Etiqueta><select value={f.estado} onChange={set('estado')} style={iStyle}><option value="por_llegar">Por llegar a bodega</option><option value="en_bodega">En bodega</option></select></div>
          <div><Etiqueta>Mercancía</Etiqueta><input id="ci-desc" value={f.descripcion || ''} onChange={set('descripcion')} placeholder="Ej: accesorios para celular" style={iStyle} /></div>
          <div><Etiqueta>Proveedor / fábrica</Etiqueta><input value={f.proveedor || ''} onChange={set('proveedor')} style={iStyle} /></div>
          <div><Etiqueta>Volumen (m³)</Etiqueta><input id="ci-cbm" inputMode="decimal" value={f.cbm} onChange={set('cbm')} style={iStyle} /></div>
          <div><Etiqueta>Peso (kg)</Etiqueta><input id="ci-kg" inputMode="decimal" value={f.peso_kg} onChange={set('peso_kg')} style={iStyle} /></div>
          <div><Etiqueta>Bultos</Etiqueta><input inputMode="numeric" value={f.bultos} onChange={set('bultos')} style={iStyle} /></div>
          <div><Etiqueta>Le cobras (US$ por m³)</Etiqueta><input id="ci-tarifa" inputMode="decimal" value={f.tarifa_m3_usd} onChange={set('tarifa_m3_usd')} style={iStyle} /></div>
        </div>
        <div style={{ marginBottom:14 }}><Etiqueta>Notas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
        <div style={{ fontSize:14, color:'var(--text2)', marginBottom:12 }}>Total al cliente: <b style={{ color:'var(--gold)' }}>{usd(n2(f.cbm) * n2(f.tarifa_m3_usd))}</b></div>
        {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button id="ci-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
          {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro?' : 'Borrar'}</button>}
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}