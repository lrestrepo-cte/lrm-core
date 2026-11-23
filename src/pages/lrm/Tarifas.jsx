// @ts-nocheck
// LRM Trade Consulting · Tarifas
// · Mis costos: tabla maestra de lo que te cobra cada bodega (una sola para todos)
// · Precios generales: escalera de valor por categoría
// · Por cliente: escalera propia de cada cliente en cada categoría que compra
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { NICHOS_LRM, nichosDe, linkWhatsApp } from './LRMClientes'
import { useDatosLRM, logoDocumentoHTML } from './datosLRM'
import { useTarifas, escaleraPara, costoPara, ordenar, copiar, sinMarca, LB_A_KG, UNIDADES, UNIDAD_CORTA, SERVICIOS_TARIFA } from './tarifasLRM'
const CATEGORIAS = [...NICHOS_LRM.filter(n => n !== 'Otro'), ...SERVICIOS_TARIFA]

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Titulo = ({ children, sub }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{children}</div>
    {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{sub}</div>}
  </div>
)

// Costo en COP por unidad de la escalera (para mostrar el margen de cada escalón)
function costoPorUnidad(costo, unidadEsc, trm) {
  if (!costo?.valor || (costo.moneda === 'USD' && !trm)) return null   // sin TRM no se puede calcular
  const enCOP = costo.moneda === 'USD' ? costo.valor * (trm || 0) : costo.valor
  if (costo.unidad === unidadEsc) return enCOP
  if (costo.unidad === 'kg' && unidadEsc === 'lb') return enCOP * LB_A_KG
  if (costo.unidad === 'lb' && unidadEsc === 'kg') return enCOP / LB_A_KG
  return null   // unidades distintas (ej. costo por kg y precio por unidad): no se puede comparar
}

export default function Tarifas() {
  const [tab, setTab] = useState('cliente')
  const t = useTarifas()
  const divisas = useDivisas()
  const trm = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const [bodegas, setBodegas] = useState([])
  const [clientes, setClientes] = useState([])
  const [faltaColumna, setFaltaColumna] = useState(false)
  const cargar = async () => {
    const [b, c] = await Promise.all([
      supabase.from('lrm_bodegas').select('*').order('nombre'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
    ])
    setBodegas(b.data || []); setClientes(c.data || [])
    setFaltaColumna(!!(c.data?.length && !('tarifas' in c.data[0])))
  }
  useEffect(() => { cargar() }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'inline-flex', gap:4, padding:4, borderRadius:12, background:'var(--bg3)', border:'1px solid var(--border)', alignSelf:'flex-start', flexWrap:'wrap' }}>
        {[['cliente','Precios por cliente'],['general','Precios generales'],['costos','Mis costos']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={tab === id ? 'btn-gold' : 'btn'} style={{ border:'none', fontSize:13, width:'auto', flex:'none' }}>{l}</button>
        ))}
      </div>
      {faltaColumna && tab === 'cliente' && (
        <div className="panel" style={{ border:'1px solid var(--gold-border)', fontSize:13, color:'var(--gold)' }}>
          Para guardar tarifas por cliente corre en Supabase el archivo <b>10_lrm_tarifas.sql</b>.
        </div>
      )}
      {tab === 'cliente' && <PorCliente clientes={clientes} escaleras={t.escaleras} costos={t.costos} margen={t.margen} trm={trm} onGuardado={cargar} />}
      {tab === 'general' && <Generales escaleras={t.escaleras} costos={t.costos} margen={t.margen} onMargen={t.guardarMargen} trm={trm} onGuardar={t.guardarEscaleras} />}
      {tab === 'costos'  && <Costos costos={t.costos} bodegas={bodegas} trm={trm} onGuardar={t.guardarCostos} />}
    </div>
  )
}

// ── Editor de una escalera ─────────────────────────────────────────────────
export function EditorEscalera({ esc, onChange, costo, trm }) {
  const upd = cambio => onChange({ ...esc, ...cambio })
  const updEsc = (i, k, v) => upd({ escalones: esc.escalones.map((s, j) => j === i ? { ...s, [k]: n2(v) } : s) })
  const costoU = costoPorUnidad(costo, esc.unidad, trm)
  const precioCOP = p => esc.moneda === 'USD' ? p * (trm || 0) : p
  const lista = esc.escalones.map((s, i) => ({ ...s, i })).sort((a, b) => a.desde - b.desde)
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap:8, marginBottom:10 }}>
        <div><Etiqueta>Cobras por</Etiqueta><select value={esc.unidad} onChange={e => upd({ unidad: e.target.value })} style={iStyle}><option value="kg">kg</option><option value="lb">lb</option><option value="unidad">unidad</option><option value="cbm">m³ (CBM)</option></select></div>
        <div><Etiqueta>Moneda</Etiqueta><select value={esc.moneda} onChange={e => upd({ moneda: e.target.value })} style={iStyle}><option>COP</option><option>USD</option></select></div>
        <div><Etiqueta>Mínimo por envío</Etiqueta><input inputMode="decimal" value={esc.minimo || ''} onChange={e => upd({ minimo: n2(e.target.value) })} placeholder="0" style={iStyle} /></div>
        <div><Etiqueta>AIU interno</Etiqueta><select value={esc.aiu ? 'si' : 'no'} onChange={e => upd({ aiu: e.target.value === 'si' })} style={iStyle}><option value="no">No</option><option value="si">Sí (2 lb/caja)</option></select></div>
      </div>
      {esc.moneda === 'USD' && (esc.escalones || []).some(x => Number(x.precio) > 10000) && <div style={{ fontSize:12, color:'var(--red)', marginBottom:8 }}>⚠️ Tienes precios en pesos pero la moneda dice USD. Cámbiala a COP.</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.1fr 32px', gap:6, fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:1 }}>
        <span>Desde ({UNIDADES[esc.unidad]})</span><span>Precio ({esc.moneda} / {UNIDAD_CORTA[esc.unidad]})</span><span>Te queda por {UNIDAD_CORTA[esc.unidad]}</span><span />
      </div>
      {lista.map(s => {
        const m = costoU != null ? precioCOP(s.precio) - costoU : null
        return (
          <div key={s.i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.1fr 32px', gap:6, marginTop:6, alignItems:'center' }}>
            <input className="esc-desde" inputMode="decimal" value={s.desde} onChange={e => updEsc(s.i, 'desde', e.target.value)} style={{ ...iStyle, marginTop:0 }} />
            <input className="esc-precio" inputMode="decimal" value={s.precio} onChange={e => updEsc(s.i, 'precio', e.target.value)} style={{ ...iStyle, marginTop:0 }} />
            <div style={{ fontSize:12, fontWeight:700, color: m == null ? 'var(--text4)' : m >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {m == null ? '—' : `${m < 0 ? '−' : ''}${cop(m)}`}{m != null && precioCOP(s.precio) ? <span style={{ fontWeight:400, color:'var(--text3)' }}> · {fmt(m / precioCOP(s.precio) * 100, 0)}%</span> : null}
            </div>
            <button onClick={() => upd({ escalones: esc.escalones.filter((_, j) => j !== s.i) })} disabled={esc.escalones.length === 1} className="btn" style={{ padding:'6px 0', width:32 }}>✕</button>
          </div>
        )
      })}
      <button onClick={() => { const ult = lista[lista.length - 1]; upd({ escalones: [...esc.escalones, { desde: (ult?.desde || 0) + (esc.unidad === 'unidad' ? 10 : esc.unidad === 'cbm' ? 5 : 100), precio: ult?.precio || 0 }] }) }} className="btn" style={{ fontSize:11, marginTop:8, width:'auto' }}>+ Escalón</button>
      <div style={{ fontSize:11, color:'var(--text4)', marginTop:6 }}>
        {costo?.valor ? <>Tu costo: {costo.moneda === 'USD' ? `US$${fmt(costo.valor, 2)}` : cop(costo.valor)} por {UNIDAD_CORTA[costo.unidad]}{costo.moneda === 'USD' && trm ? ` (TRM ${fmt(trm, 0)})` : ''}{costoU == null ? ' · se cobra en otra unidad, el margen sale en el Cotizador' : ''}</> : 'Sin costo en Mis costos para esta categoría.'}
      </div>
    </div>
  )
}

const resumen = esc => ordenar(esc).map((e, i, arr) => `${arr[i + 1] ? `${fmt(e.desde, 0)}–${fmt(arr[i + 1].desde, 0)}` : `${fmt(e.desde, 0)}+`}: ${esc.moneda === 'USD' ? 'US$' + fmt(e.precio, 2) : cop(e.precio)}`).join(' · ')

// ── Precios por cliente ────────────────────────────────────────────────────
function PorCliente({ clientes, escaleras, costos, margen, trm, onGuardado }) {
  const [id, setId] = useState('')
  const [buscar, setBuscar] = useState('')
  const cli = clientes.find(c => c.id === id)
  const [tarifas, setTarifas] = useState({})
  const [extra, setExtra] = useState('')
  const [estado, setEstado] = useState('')
  const [propuesta, setPropuesta] = useState(false)
  useEffect(() => { setTarifas(copiar(cli?.tarifas || {})); setEstado('') }, [id, cli?.tarifas])
  const categorias = useMemo(() => {
    const s = [...nichosDe(cli), ...Object.keys(tarifas)].filter(n => n && n !== 'Otro')
    return [...new Set(s)]
  }, [cli, tarifas])
  const cambiado = JSON.stringify(tarifas) !== JSON.stringify(cli?.tarifas || {})
  // Solo se guarda como precio propio lo que de verdad cambiaste; lo demás sigue al general
  const igual = (a, b) => JSON.stringify(normal(a)) === JSON.stringify(normal(b))
  const normal = e => e && { unidad: e.unidad, moneda: e.moneda, minimo: Number(e.minimo || 0), aiu: !!e.aiu, escalones: ordenar(e).map(x => ({ desde: Number(x.desde), precio: Number(x.precio) })) }
  const guardar = async () => {
    const limpias = Object.fromEntries(Object.entries(tarifas).filter(([cat, esc]) => !igual(esc, escaleraPara(null, escaleras, cat).esc)))
    setTarifas(limpias)
    const { error } = await supabase.from('lrm_clientes').update({ tarifas: limpias, nicho: categorias.join(', ') || cli.nicho }).eq('id', cli.id)
    setEstado(error ? 'No se pudo guardar: ' + error.message : '✓ Tarifas guardadas')
    if (!error) onGuardado()
  }
  const lista = clientes.filter(c => !buscar.trim() || c.nombre.toLowerCase().includes(buscar.trim().toLowerCase()))

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap:14, alignItems:'start' }}>
      <div className="panel" style={{ maxHeight:'75vh', overflowY:'auto' }}>
        <Titulo sub="Elige el cliente para darle sus precios">Clientes</Titulo>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar…" style={{ ...iStyle, marginTop:0, marginBottom:8 }} />
        {lista.length === 0 && <div style={{ fontSize:12, color:'var(--text4)' }}>Crea tus clientes en el CRM.</div>}
        {lista.map(c => {
          const propias = Object.keys(c.tarifas || {}).length
          return (
            <div key={c.id} onClick={() => setId(c.id)} style={{ padding:'9px 10px', borderRadius:8, cursor:'pointer', marginBottom:4, background: c.id === id ? 'var(--gold-dim)' : 'transparent', border:`1px solid ${c.id === id ? 'var(--gold-border)' : 'transparent'}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.nombre}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{nichosDe(c).join(', ') || 'Sin categoría'} · {propias ? <span style={{ color:'var(--gold)' }}>{propias} con precio propio</span> : 'precios generales'}</div>
            </div>
          )
        })}
      </div>

      <div style={{ gridColumn:'span 2', minWidth:0, display:'flex', flexDirection:'column', gap:12 }}>
        {!cli ? <div className="panel" style={{ fontSize:13, color:'var(--text3)' }}>← Elige un cliente.</div> : (
          <>
            <div className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{cli.nombre}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>Cada categoría arranca con el precio general. Lo que cambies queda como precio propio de este cliente.</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <select value={extra} onChange={e => { const n = e.target.value; if (!n) return; setTarifas(p => ({ ...p, [n]: sinMarca(copiar(escaleraPara(null, escaleras, n).esc)) })); setExtra('') }} style={{ ...iStyle, width:'auto', marginTop:0 }}>
                  <option value="">+ Otra categoría…</option>
                  {CATEGORIAS.filter(n => !categorias.includes(n)).map(n => <option key={n}>{n}</option>)}
                </select>
                <button id="tar-guardar" onClick={guardar} disabled={!cambiado} className="btn-green" style={{ width:'auto', flex:'none' }}>Guardar tarifas</button>
                <button id="tar-propuesta" onClick={() => setPropuesta(true)} disabled={!categorias.length} title={cambiado ? 'Guarda primero los cambios' : ''} className="btn-gold" style={{ width:'auto', flex:'none' }}>📄 Propuesta para el cliente</button>
              </div>
            </div>
            {estado && <div style={{ fontSize:12, color: estado.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{estado}</div>}
            {propuesta && <PropuestaTarifas cliente={cli} categorias={categorias} escalera={cat => escaleraPara({ tarifas }, escaleras, cat).esc} trm={trm} onCerrar={() => setPropuesta(false)} />}
            {categorias.length === 0 && <div className="panel" style={{ fontSize:13, color:'var(--text3)' }}>Este cliente no tiene categorías. Márcalas en el CRM ("Qué compra") o agrégalas con "+ Otra categoría".</div>}
            {categorias.map(cat => {
              const general = escaleraPara(null, escaleras, cat).esc
              const propia = tarifas[cat] && !igual(tarifas[cat], general) ? tarifas[cat] : null
              const costo = costoPara(costos, null, cat)
              return (
                <div key={cat} className="panel" style={{ border: propia ? '1px solid var(--gold-border)' : undefined }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom: propia ? 12 : 4 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{cat} <span style={{ fontSize:11, fontWeight:600, color: propia ? 'var(--gold)' : 'var(--text3)' }}>· {propia ? 'precio propio de este cliente' : general.sugerida ? `precio sugerido: tu costo + ${margen}% (cámbialo aquí)` : 'precio general (cámbialo aquí si quieres)'}</span></div>
                    {propia && <button onClick={() => setTarifas(p => { const { [cat]: _, ...r } = p; return r })} className="btn" style={{ fontSize:11, width:'auto', color:'var(--red)' }}>↺ Volver al general</button>}
                  </div>
                  <EditorEscalera esc={tarifas[cat] || general} costo={costo} trm={trm} onChange={nueva => setTarifas(p => ({ ...p, [cat]: sinMarca(nueva) }))} />
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ── Precios generales ──────────────────────────────────────────────────────
function Generales({ escaleras, costos, margen, onMargen, trm, onGuardar }) {
  const [e, setE] = useState(copiar(escaleras))
  const [m, setM] = useState(String(margen))
  useEffect(() => { setM(String(margen)) }, [margen])
  const [cat, setCat] = useState('General')
  const [estado, setEstado] = useState('')
  useEffect(() => { setE(copiar(escaleras)) }, [escaleras])
  const x = e[cat] || e.General
  const disponibles = CATEGORIAS.filter(n => !e[n])
  const guardar = async () => { const { error } = await onGuardar(e); setEstado(error ? 'No se pudo guardar: ' + error.message : '✓ Precios generales guardados') }
  return (
    <div className="panel">
      <Titulo sub="Se usan cuando el cliente no tiene precio propio. Toda categoría de Mis costos arranca con un precio sugerido (tu costo + margen); cámbialo y guárdalo cuando quieras.">Precios generales (escalera de valor)</Titulo>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:14, padding:'10px 12px', borderRadius:10, background:'var(--bg4)', fontSize:12, color:'var(--text2)' }}>
        Precio sugerido = tu costo +
        <input id="tar-margen" inputMode="numeric" value={m} onChange={ev => setM(ev.target.value.replace(/[^\d]/g, ''))} style={{ ...iStyle, width:64, marginTop:0, textAlign:'center' }} />%
        <button onClick={() => onMargen(m)} disabled={String(margen) === m} className="btn" style={{ fontSize:11, width:'auto' }}>Aplicar</button>
        <span style={{ color:'var(--text4)' }}>Solo cambia las categorías que siguen en "sugerida".</span>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {Object.keys(e).map(k => <button key={k} onClick={() => setCat(k)} className={cat === k ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 11px', width:'auto', flex:'none', opacity: e[k]?.sugerida && cat !== k ? 0.7 : 1 }}>{k}{e[k]?.sugerida ? ' · sugerida' : ''}</button>)}
        {disponibles.length > 0 && (
          <select value="" onChange={ev => { const n = ev.target.value; if (!n) return; setE(p => ({ ...p, [n]: copiar(p.General) })); setCat(n) }} style={{ ...iStyle, width:'auto', marginTop:0, padding:'5px 8px', fontSize:11 }}>
            <option value="">+ Escalera para…</option>{disponibles.map(n => <option key={n}>{n}</option>)}
          </select>
        )}
      </div>
      {x?.sugerida && <div style={{ fontSize:12, color:'var(--gold)', marginBottom:8 }}>Precio sugerido a partir de tu costo. Si lo cambias y guardas, queda fijo.</div>}
      <EditorEscalera esc={x} costo={costoPara(costos, null, cat)} trm={trm} onChange={nueva => setE(p => ({ ...p, [cat]: sinMarca(nueva) }))} />
      <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
        <button onClick={guardar} className="btn-green" style={{ width:'auto', flex:'none' }}>Guardar precios generales</button>
        {cat !== 'General' && <button onClick={() => { setE(p => { const { [cat]: _, ...r } = p; return r }); setCat('General') }} className="btn" style={{ color:'var(--red)', width:'auto' }}>Quitar {cat}</button>}
        {estado && <span style={{ fontSize:12, alignSelf:'center', color: estado.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{estado}</span>}
      </div>
    </div>
  )
}

// ── Mis costos (tabla maestra) ─────────────────────────────────────────────
function Costos({ costos, bodegas, trm, onGuardar }) {
  const [filas, setFilas] = useState(copiar(costos))
  const [estado, setEstado] = useState('')
  useEffect(() => { setFilas(copiar(costos)) }, [costos])
  const upd = (i, k, v) => setFilas(p => p.map((f, j) => j === i ? { ...f, [k]: v } : f))
  const guardar = async () => {
    const limpias = filas.filter(f => f.categoria).map(f => ({ ...f, bodega_id: f.bodega_id || null, valor: n2(f.valor) }))
    const { error } = await onGuardar(limpias)
    setEstado(error ? 'No se pudo guardar: ' + error.message : '✓ Costos guardados')
  }
  return (
    <div className="panel">
      <Titulo sub="Lo que te cobra cada bodega. Es una sola tabla para todos los clientes. Lo que está en US$ se pasa a pesos con la TRM del día.">Mis costos</Titulo>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:620 }}>
          <thead><tr style={{ textAlign:'left', color:'var(--text3)', fontSize:11 }}>
            {['Bodega','Categoría','Te cobran por','Moneda','Valor','En pesos hoy',''].map(h => <th key={h} style={{ fontWeight:500, padding:'4px 6px' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td style={{ padding:'3px 6px' }}><select value={f.bodega_id || ''} onChange={e => upd(i, 'bodega_id', e.target.value || null)} style={{ ...iStyle, marginTop:0 }}>
                  <option value="">Todas</option>{bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}</select></td>
                <td style={{ padding:'3px 6px' }}><select value={f.categoria} onChange={e => upd(i, 'categoria', e.target.value)} style={{ ...iStyle, marginTop:0 }}>
                  {['General', ...CATEGORIAS].map(n => <option key={n}>{n}</option>)}</select></td>
                <td style={{ padding:'3px 6px' }}><select value={f.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ ...iStyle, marginTop:0 }}>
                  <option value="kg">kg (peso real)</option><option value="lb">lb (peso real)</option><option value="unidad">unidad</option><option value="cbm">m³ (CBM)</option></select></td>
                <td style={{ padding:'3px 6px' }}><select value={f.moneda} onChange={e => upd(i, 'moneda', e.target.value)} style={{ ...iStyle, marginTop:0 }}><option>USD</option><option>COP</option></select></td>
                <td style={{ padding:'3px 6px' }}><input className="costo-valor" inputMode="decimal" value={f.valor} onChange={e => upd(i, 'valor', e.target.value)} style={{ ...iStyle, marginTop:0 }} /></td>
                <td style={{ padding:'3px 6px', color:'var(--text2)', whiteSpace:'nowrap' }}>{f.moneda === 'USD' ? (trm ? cop(n2(f.valor) * trm) : '—') : cop(n2(f.valor))} / {UNIDAD_CORTA[f.unidad]}</td>
                <td><button onClick={() => setFilas(p => p.filter((_, j) => j !== i))} className="btn" style={{ padding:'6px 9px', width:'auto' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={() => setFilas(p => [...p, { bodega_id:null, categoria:'General', unidad:'kg', moneda:'USD', valor:'' }])} className="btn" style={{ width:'auto' }}>+ Costo</button>
        <button onClick={guardar} className="btn-green" style={{ width:'auto', flex:'none' }}>Guardar costos</button>
        {estado && <span style={{ fontSize:12, color: estado.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{estado}</span>}
      </div>
      <div style={{ fontSize:11, color:'var(--text4)', marginTop:10 }}>
        Si una bodega tiene un costo propio para la categoría, se usa ese. Si no, el de "Todas". Si la categoría no está, se usa el de "General".
      </div>
    </div>
  )
}

// ── Propuesta de tarifas para el cliente (sin costos ni márgenes) ─────────
const escH = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
const hoyLargo = () => new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
const UNI_TXT = { kg:['kilo','kilos'], lb:['libra','libras'], unidad:['unidad','unidades'], cbm:['m³','m³'] }
const precioTxt = (esc, p) => esc.moneda === 'USD' ? `US$${fmt(p, 2)}` : cop(p)
// "1 a 9", "10 a 49", "50 o más" (en unidades) · "0 a 100", "100 a 300", "300 o más" (en peso)
function filasEscalera(esc) {
  const arr = ordenar(esc), enteros = esc.unidad === 'unidad'
  return arr.map((e, i) => {
    const sig = arr[i + 1], [uno, varios] = UNI_TXT[esc.unidad]
    const rango = sig ? (e.desde <= 0 ? `Hasta ${fmt(sig.desde, 0)} ${varios}` : enteros ? `${fmt(e.desde, 0)} a ${fmt(sig.desde - 1, 0)} ${varios}` : `${fmt(e.desde, 0)} a ${fmt(sig.desde, 0)} ${varios}`)
      : `${fmt(e.desde, 0)} ${e.desde === 1 ? uno : varios} o más`
    return { rango, precio: precioTxt(esc, e.precio), por: uno }
  })
}

export function PropuestaTarifas({ cliente, categorias, escalera, onCerrar }) {
  const { empresa } = useDatosLRM()
  const [incluir, setIncluir] = useState(Object.fromEntries(categorias.map(c => [c, true])))
  const [vigencia, setVigencia] = useState('30')
  const [notas, setNotas] = useState([
    'Nos encargamos de todo: recibimos tu mercancía en nuestra bodega y te la entregamos en Barranquilla.',
    'El valor final se calcula con el peso o las unidades reales que reporte la bodega.',
    'Mientras más compres, mejor precio: la tarifa baja automáticamente al pasar al siguiente rango.',
    empresa.condiciones,
  ].filter(Boolean).join('\n'))
  const [copiado, setCopiado] = useState(false)
  const cats = categorias.filter(c => incluir[c])
  const primer = (cliente?.nombre || '').split(' ')[0]

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Tarifas ${escH(empresa.nombre)} · ${escH(cliente?.nombre)}</title><style>
    @page{size:letter;margin:12mm}*{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:20px;background:#fff;font-size:12px;line-height:1.4}
    .doc{max-width:760px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #C9A84C;padding-bottom:10px}
    .marca{font-size:20px;font-weight:800}.marca small{display:block;font-size:11px;font-weight:400;color:#777;margin-top:2px}
    .emp{font-size:10.5px;color:#555;margin-top:5px}.num{text-align:right}.num .t{font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
    .num .n1{font-size:16px;font-weight:800;margin:2px 0}.num div{font-size:10.5px;color:#555}
    .intro{margin:16px 0 6px;font-size:13px}
    .cats{display:grid;grid-template-columns:repeat(${cats.length > 1 ? 2 : 1},1fr);gap:12px;margin-top:12px;align-items:start}
    .cat{border:1px solid #e5dcc3;border-radius:10px;overflow:hidden;page-break-inside:avoid;break-inside:avoid}
    .cat h3{margin:0;padding:9px 12px;background:#1b1b1b;color:#fff;font-size:13px;display:flex;justify-content:space-between;align-items:center}
    .cat h3 span{color:#C9A84C;font-size:10.5px;font-weight:600}
    table{width:100%;border-collapse:collapse}td{padding:7px 12px;border-bottom:1px solid #f0eadb}tr:last-child td{border-bottom:none}
    td.p{text-align:right;font-weight:800;font-size:13px;white-space:nowrap}td.p small{font-weight:400;color:#777;font-size:10px}
    tr.mejor td{background:#faf5e6}.min{font-size:10.5px;color:#8a6d1f;padding:6px 12px;background:#faf7ee}
    .notas{margin-top:16px;font-size:11px;color:#444}.notas li{margin:3px 0}
    .pie{margin-top:18px;padding-top:10px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:10.5px;color:#555}
    @media print{body{padding:0}}@media screen and (max-width:620px){body{padding:12px!important;font-size:11px}.top{flex-direction:column;gap:8px}.num,.t{text-align:left!important}.ruta,.kpis,.k,.datos,.cats,.cols{grid-template-columns:1fr 1fr!important}table{font-size:10px}td,th{padding:5px 4px!important}img{max-width:100%}}</style></head><body><div class="doc">
    <div class="top"><div>${logoDocumentoHTML()}
      <div class="emp">${escH(empresa.ciudad)} · ${escH(empresa.whatsapp)} · ${escH(empresa.correo)}</div></div>
      <div class="num"><div class="t">PROPUESTA DE TARIFAS</div><div class="n1">${escH(cliente?.nombre)}</div><div>${hoyLargo()}${vigencia ? ` · válida ${escH(vigencia)} días` : ''}</div></div></div>
    <div class="intro">Hola ${escH(primer)}, estas son tus tarifas con <b>${escH(empresa.nombre)}</b>. Entre más compras, menos pagas por cada ${cats.some(c => escalera(c).unidad !== 'unidad') ? 'kilo o unidad' : 'unidad'}.</div>
    <div class="cats">${cats.map(c => {
      const esc = escalera(c), filas = filasEscalera(esc)
      return `<div class="cat"><h3>${escH(c)}<span>precio por ${UNI_TXT[esc.unidad][0]}</span></h3><table>
        ${filas.map((f, i) => `<tr class="${i === filas.length - 1 && filas.length > 1 ? 'mejor' : ''}"><td>${escH(f.rango)}</td><td class="p">${escH(f.precio)} <small>/ ${f.por}</small></td></tr>`).join('')}
        </table>${esc.minimo ? `<div class="min">Pedido mínimo: ${fmt(esc.minimo, 0)} ${UNI_TXT[esc.unidad][1]}</div>` : ''}</div>`
    }).join('')}</div>
    ${notas.trim() ? `<ul class="notas">${notas.split('\n').filter(l => l.trim()).map(l => `<li>${escH(l.trim())}</li>`).join('')}</ul>` : ''}
    <div class="pie"><span>${escH(empresa.responsable)} · ${escH(empresa.nombre)}</span><span>${escH(empresa.whatsapp)}</span></div>
    </div></body></html>`

  const texto = [
    `Hola ${primer}, te comparto tus tarifas con *${empresa.nombre}*:`, '',
    ...cats.flatMap(c => { const esc = escalera(c); return [`*${c}* (por ${UNI_TXT[esc.unidad][0]})`, ...filasEscalera(esc).map(f => `• ${f.rango}: ${f.precio}`), ...(esc.minimo ? [`Mínimo: ${fmt(esc.minimo, 0)} ${UNI_TXT[esc.unidad][1]}`] : []), ''] }),
    'Entre más compras, mejor precio. Cualquier duda me escribes.',
  ].join('\n')
  const wa = cliente?.telefono ? linkWhatsApp(cliente.telefono, cliente.nombre, texto) : null
  const imprimir = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close() }
  const copiarTxt = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div className="doc-split" style={{ background:'var(--bg2)', borderRadius:16, padding:18, width:'100%', maxWidth:1080, border:'1px solid var(--gold-border)', height:'94vh', display:'grid', gridTemplateColumns:'minmax(0, 300px) minmax(0, 1fr)', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:3, color:'var(--gold)', fontWeight:700 }}>PROPUESTA DE TARIFAS</div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{cliente?.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Solo sus precios. No sale tu costo ni tu margen.</div>
          </div>
          <div><Etiqueta>Categorías que van</Etiqueta>
            {categorias.map(c => (
              <label key={c} style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--text2)', marginTop:6, cursor:'pointer' }}>
                <input type="checkbox" checked={!!incluir[c]} onChange={e => setIncluir(p => ({ ...p, [c]: e.target.checked }))} /> {c}
              </label>
            ))}
          </div>
          <div><Etiqueta>Válida por (días)</Etiqueta><input inputMode="numeric" value={vigencia} onChange={e => setVigencia(e.target.value.replace(/\D/g, ''))} style={iStyle} /></div>
          <div><Etiqueta>Condiciones (una por renglón)</Etiqueta><textarea value={notas} onChange={e => setNotas(e.target.value)} style={{ ...iStyle, minHeight:150, resize:'vertical', fontSize:12 }} /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:'auto' }}>
            <button onClick={imprimir} disabled={!cats.length} className="btn-gold">Descargar PDF / Imprimir</button>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ textAlign:'center', textDecoration:'none', color:'#25D366', borderColor:'rgba(37,211,102,0.4)' }}>Enviar resumen por WhatsApp</a>}
            <button onClick={copiarTxt} className="btn">{copiado ? '✓ Copiado' : 'Copiar texto'}</button>
            <button onClick={onCerrar} className="btn">Cerrar</button>
          </div>
        </div>
        <iframe title="Propuesta" srcDoc={html} style={{ width:'100%', height:'100%', border:'none', borderRadius:10, background:'#fff' }} />
      </div>
    </div>
  )
}