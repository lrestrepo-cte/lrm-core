// @ts-nocheck
// LRM Trade Consulting · Cotizador con escalera de valor
// Pones cantidad y categoría → escalón que aplica, precio al cliente, tu costo y tu margen.
// Las escaleras se editan aquí mismo y quedan en lrm_ajustes (clave 'escaleras').
// Cada cotización se guarda en lrm_cotizaciones (SQL 08) y se manda por WhatsApp.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { NICHOS_LRM, nichoPrincipal, linkWhatsApp, fechaCorta } from './LRMClientes'
import { useDatosLRM } from './datosLRM'

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
// Acepta 2.3 · 2,3 · 24.000 · 24000 (puntos de miles o decimales)
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const LB_A_KG = 0.45359237
const AIU_LB_CAJA = 2                       // AIU interno de perfumes (lb por caja)

// Escaleras de arranque. unidad: kg | lb | unidad · moneda: COP | USD · costo en su moneda por unidad
export const ESCALERAS_LRM = {
  General:    { unidad:'kg', moneda:'COP', minimo:0,  costo:{ valor:5,     moneda:'USD' }, escalones:[ { desde:0, precio:24000 }, { desde:100, precio:22000 }, { desde:300, precio:20000 }, { desde:700, precio:19000 } ] },
  Perfumes:   { unidad:'kg', moneda:'COP', minimo:0,  costo:{ valor:5,     moneda:'USD' }, escalones:[ { desde:0, precio:24000 }, { desde:100, precio:22000 }, { desde:300, precio:20000 }, { desde:700, precio:19000 } ], aiu:true },
  Celulares:  { unidad:'unidad', moneda:'COP', minimo:50, costo:{ valor:65000, moneda:'COP' }, escalones:[ { desde:50, precio:100000 } ] },
  Cosméticos: { unidad:'lb', moneda:'USD', minimo:0,  costo:{ valor:2.3,   moneda:'USD' }, escalones:[ { desde:0, precio:3.1 } ] },
}
const UNIDAD = { kg:'kg', lb:'lb', unidad:'unidades' }
const escaleraDe = (escaleras, cat) => escaleras[cat] || escaleras.General || ESCALERAS_LRM.General
const escalonDe = (esc, cantidad) => [...esc.escalones].sort((a, b) => b.desde - a.desde).find(e => cantidad >= e.desde) || esc.escalones[0]
const siguienteDe = (esc, cantidad) => [...esc.escalones].sort((a, b) => a.desde - b.desde).find(e => e.desde > cantidad)
const iStyle = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const ESTADOS = { enviada:{ l:'Enviada', c:'#378ADD' }, aceptada:{ l:'Aceptada', c:'var(--green)' }, perdida:{ l:'Perdida', c:'var(--red)' } }

export default function Cotizador() {
  const divisas = useDivisas()
  const trmHoy = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const { empresa } = useDatosLRM()
  const [escaleras, setEscaleras] = useState(ESCALERAS_LRM)
  const [clientes, setClientes] = useState([])
  const [historial, setHistorial] = useState([])
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [editarEsc, setEditarEsc] = useState(false)
  const [estado, setEstado] = useState('')
  const [f, setF] = useState({ cliente_id:'', cliente_nombre:'', categoria:'Perfumes', origen:'Miami', modalidad:'Marítimo', cantidad:'', unidadPeso:'kg', cajas:'', trm:'', precioManual:'' })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const cargar = async () => {
    const [aj, cl, co] = await Promise.all([
      supabase.from('lrm_ajustes').select('valor').eq('clave', 'escaleras').maybeSingle(),
      supabase.from('lrm_clientes').select('id,nombre,telefono,nicho,estado').order('nombre'),
      supabase.from('lrm_cotizaciones').select('*').order('created_at', { ascending:false }).limit(50),
    ])
    try { if (aj.data?.valor) setEscaleras({ ...ESCALERAS_LRM, ...JSON.parse(aj.data.valor) }) } catch { /* se quedan las de arranque */ }
    setClientes(cl.data || [])
    if (co.error) setFaltaTabla(true); else setHistorial(co.data || [])
  }
  useEffect(() => { cargar() }, [])

  // ── Cálculo ──
  const esc = escaleraDe(escaleras, f.categoria)
  const trm = n2(f.trm) || trmHoy
  const aCOP = (v, moneda) => moneda === 'USD' ? v * trm : v
  const cantIngresada = n2(f.cantidad)
  // Cantidad real en la unidad de la escalera
  const real = esc.unidad === 'unidad' ? cantIngresada
    : esc.unidad === 'kg' ? (f.unidadPeso === 'lb' ? cantIngresada * LB_A_KG : cantIngresada)
    : (f.unidadPeso === 'kg' ? cantIngresada / LB_A_KG : cantIngresada)
  // AIU interno (solo escaleras con aiu): 2 lb por caja, sumado a lo que ve el cliente
  const aiu = esc.aiu ? n2(f.cajas) * AIU_LB_CAJA * (esc.unidad === 'kg' ? LB_A_KG : 1) : 0
  const cliente = Math.round((real + aiu) * 10) / 10
  const escalon = escalonDe(esc, cliente)
  const sig = siguienteDe(esc, cliente)
  const precio = n2(f.precioManual) || aCOP(escalon.precio, esc.moneda)
  const total = Math.round(cliente * precio)
  const costo = Math.round(real * aCOP(esc.costo.valor, esc.costo.moneda))
  const margen = total - costo
  const bajoMinimo = !!(esc.minimo && cliente < esc.minimo)
  const cli = clientes.find(c => c.id === f.cliente_id)
  const nombreCli = cli?.nombre || f.cliente_nombre

  const texto = [
    `*${empresa.nombre}* · Cotización`,
    nombreCli ? `Cliente: ${nombreCli}` : null,
    ``,
    `Servicio de importación ${f.origen} → Barranquilla (${f.modalidad.toLowerCase()})`,
    `Mercancía: ${f.categoria}`,
    `Cantidad estimada: ${fmt(cliente)} ${UNIDAD[esc.unidad]}`,
    `Tarifa: ${cop(precio)} por ${esc.unidad === 'unidad' ? 'unidad' : esc.unidad}`,
    `*Total estimado: ${cop(total)}*`,
    ``,
    esc.escalones.length > 1 ? `Tarifa por volumen (${UNIDAD[esc.unidad]}):` : null,
    ...(esc.escalones.length > 1 ? [...esc.escalones].sort((a, b) => a.desde - b.desde).map((e, i, arr) => `• ${arr[i + 1] ? `${fmt(e.desde, 0)} a ${fmt(arr[i + 1].desde, 0)}` : `Más de ${fmt(e.desde, 0)}`}: ${cop(aCOP(e.precio, esc.moneda))}`) : []),
    esc.minimo ? `Mínimo por envío: ${fmt(esc.minimo, 0)} ${UNIDAD[esc.unidad]}` : null,
    ``,
    `El valor final se ajusta al peso real que reporte la bodega. Cotización válida por 8 días.`,
  ].filter(x => x !== null).join('\n')

  const guardar = async () => {
    if (!cliente) return setEstado('Pon la cantidad.')
    const { error } = await supabase.from('lrm_cotizaciones').insert({
      cliente_id: f.cliente_id || null, cliente_nombre: nombreCli || null, categoria: f.categoria, origen: f.origen, modalidad: f.modalidad,
      cantidad: cliente, unidad: esc.unidad, precio_unit: Math.round(precio), total, costo, margen,
    })
    setEstado(error ? 'No se pudo guardar: ' + error.message : '✓ Cotización guardada'); setTimeout(() => setEstado(''), 2500)
    if (!error) {
      if (f.cliente_id && ['prospecto','conversacion'].includes(cli?.estado)) await supabase.from('lrm_clientes').update({ estado:'propuesta' }).eq('id', f.cliente_id)
      cargar()
    }
  }
  const wa = cli?.telefono ? linkWhatsApp(cli.telefono, cli.nombre, texto) : null
  const cambiarEstado = async (c, estado) => { await supabase.from('lrm_cotizaciones').update({ estado }).eq('id', c.id); cargar() }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14, alignItems:'start' }}>
        {/* Datos */}
        <div className="panel">
          <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:12 }}>Nueva cotización</div>
          <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
            <div><Etiqueta>Cliente (del CRM)</Etiqueta>
              <select id="cot-cliente" value={f.cliente_id} onChange={e => { const c = clientes.find(x => x.id === e.target.value); setF(p => ({ ...p, cliente_id:e.target.value, categoria: nichoPrincipal(c, Object.keys(escaleras)) || p.categoria })) }} style={iStyle}>
                <option value="">— Sin cliente / nuevo —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select></div>
            {!f.cliente_id && <div><Etiqueta>O escribe el nombre</Etiqueta><input value={f.cliente_nombre} onChange={set('cliente_nombre')} placeholder="Prospecto" style={iStyle} /></div>}
            <div><Etiqueta>Categoría</Etiqueta>
              <select id="cot-categoria" value={f.categoria} onChange={e => setF(p => ({ ...p, categoria:e.target.value, precioManual:'' }))} style={iStyle}>
                {NICHOS_LRM.map(n => <option key={n} value={n}>{n}{escaleras[n] ? '' : ' (escalera general)'}</option>)}
              </select></div>
            <div><Etiqueta>Origen</Etiqueta><select value={f.origen} onChange={set('origen')} style={iStyle}>{['Miami','China','Panamá'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Etiqueta>Modalidad</Etiqueta><select value={f.modalidad} onChange={set('modalidad')} style={iStyle}>{['Marítimo','Aéreo'].map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
            <div><Etiqueta>{esc.unidad === 'unidad' ? 'Unidades' : 'Peso'}</Etiqueta>
              <div style={{ display:'flex', gap:6 }}>
                <input id="cot-cantidad" inputMode="decimal" value={f.cantidad} onChange={set('cantidad')} placeholder={esc.unidad === 'unidad' ? '50' : '150'} style={iStyle} autoFocus />
                {esc.unidad !== 'unidad' && <select value={f.unidadPeso} onChange={set('unidadPeso')} style={{ ...iStyle, width:76 }}><option>kg</option><option>lb</option></select>}
              </div></div>
            {esc.aiu && <div><Etiqueta>Cajas (para el AIU interno)</Etiqueta><input id="cot-cajas" inputMode="numeric" value={f.cajas} onChange={set('cajas')} placeholder="6" style={iStyle} /></div>}
            <div><Etiqueta>TRM {trmHoy ? '(hoy)' : ''}</Etiqueta><input inputMode="decimal" value={f.trm} onChange={set('trm')} placeholder={trmHoy ? fmt(trmHoy, 2) : '3326'} style={iStyle} /></div>
            <div><Etiqueta>Precio especial (opcional)</Etiqueta><input inputMode="numeric" value={f.precioManual} onChange={set('precioManual')} placeholder={`Escalera: ${cop(aCOP(escalon.precio, esc.moneda))}`} style={iStyle} /></div>
          </div>
        </div>

        {/* Resultado */}
        <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>ESCALERA · {escaleras[f.categoria] ? f.categoria.toUpperCase() : 'GENERAL'}</div>
            <button onClick={() => setEditarEsc(true)} className="btn" style={{ fontSize:11, padding:'4px 10px' }}>Editar escaleras</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
            {[...esc.escalones].sort((a, b) => a.desde - b.desde).map((e, i, arr) => {
              const activo = e === escalon && cliente > 0
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', borderRadius:8, fontSize:12,
                  background: activo ? 'var(--gold)' : 'var(--bg4)', color: activo ? '#111' : 'var(--text2)', fontWeight: activo ? 800 : 400 }}>
                  <span>{arr[i + 1] ? `${fmt(e.desde, 0)} – ${fmt(arr[i + 1].desde, 0)}` : `${fmt(e.desde, 0)}+`} {UNIDAD[esc.unidad]}</span>
                  <span>{cop(aCOP(e.precio, esc.moneda))}{esc.moneda === 'USD' ? ` (US$${fmt(e.precio, 2)})` : ''} / {esc.unidad === 'unidad' ? 'u' : esc.unidad}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['Al cliente', `${fmt(cliente)} ${UNIDAD[esc.unidad]}`, 'var(--text)'], ['Precio', `${cop(precio)} / ${esc.unidad === 'unidad' ? 'u' : esc.unidad}`, 'var(--text)'],
              ['Total cliente', cop(total), 'var(--gold)'], ['Tu costo', cop(costo), 'var(--red)'],
              ['Margen', cop(margen), margen >= 0 ? 'var(--green)' : 'var(--red)'], ['Margen %', total ? `${fmt(margen / total * 100)}%` : '—', 'var(--green)']].map(([l, v, c]) => (
              <div key={l} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg4)' }}>
                <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
                <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          {aiu > 0 && <div style={{ fontSize:11, color:'#E8A23A', marginTop:8 }}>Incluye AIU interno: {fmt(aiu)} {esc.unidad} ({f.cajas} cajas × 2 lb). No sale en el mensaje.</div>}
          {bajoMinimo && <div style={{ fontSize:12, color:'var(--red)', marginTop:8 }}>Por debajo del mínimo: {fmt(esc.minimo, 0)} {UNIDAD[esc.unidad]}.</div>}
          {sig && cliente > 0 && !bajoMinimo && (
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:8, padding:'8px 10px', borderRadius:8, background:'rgba(55,138,221,0.1)' }}>
              💡 Con {fmt(sig.desde - cliente)} {UNIDAD[esc.unidad]} más pasa a {cop(aCOP(sig.precio, esc.moneda))}. Úsalo para que el cliente suba el pedido.
            </div>
          )}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
            {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={guardar} className="btn-green" style={{ textDecoration:'none' }}>Guardar y enviar por WhatsApp</a>}
            <button onClick={guardar} className="btn-gold">Guardar</button>
            <button onClick={async () => { try { await navigator.clipboard.writeText(texto); setEstado('✓ Mensaje copiado') } catch {} }} className="btn">Copiar mensaje</button>
          </div>
          {estado && <div style={{ fontSize:12, color: estado.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginTop:8 }}>{estado}</div>}
        </div>
      </div>

      {/* Mensaje */}
      <div className="panel">
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:8 }}>ASÍ LE LLEGA AL CLIENTE</div>
        <div style={{ fontSize:12.5, color:'var(--text2)', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{texto}</div>
      </div>

      {/* Historial */}
      <div className="panel">
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:10 }}>COTIZACIONES ({historial.length})</div>
        {faltaTabla ? <div style={{ fontSize:12, color:'var(--gold)' }}>Para guardar el historial corre en Supabase el archivo <b>08_lrm_cotizaciones.sql</b>.</div>
          : historial.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)' }}>Todavía no hay cotizaciones guardadas.</div>
          : historial.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200, fontSize:12 }}>
                <div style={{ color:'var(--text)', fontWeight:700 }}>#{c.numero} · {c.cliente_nombre || 'Sin nombre'}</div>
                <div style={{ fontSize:11, color:'var(--text4)' }}>{fechaCorta(c.created_at?.slice(0, 10))} · {c.categoria} · {fmt(c.cantidad)} {UNIDAD[c.unidad] || c.unidad} × {cop(c.precio_unit)} · margen {cop(c.margen)}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(c.total)}</div>
              <select value={c.estado} onChange={e => cambiarEstado(c, e.target.value)} style={{ ...iStyle, width:'auto', marginTop:0, padding:'5px 8px', fontSize:11, color: ESTADOS[c.estado]?.c }}>
                {Object.entries(ESTADOS).map(([id, x]) => <option key={id} value={id}>{x.l}</option>)}
              </select>
            </div>
          ))}
      </div>

      {editarEsc && <EditorEscaleras escaleras={escaleras} onCerrar={() => setEditarEsc(false)}
        onGuardar={async (nuevas) => { setEscaleras(nuevas); await supabase.from('lrm_ajustes').upsert({ clave:'escaleras', valor: JSON.stringify(nuevas) }); setEditarEsc(false) }} />}
    </div>
  )
}

// ── Editor de escaleras de valor ───────────────────────────────────────────
function EditorEscaleras({ escaleras, onCerrar, onGuardar }) {
  const [e, setE] = useState(JSON.parse(JSON.stringify(escaleras)))
  const [cat, setCat] = useState(Object.keys(escaleras)[0])
  const x = e[cat]
  const upd = (cambio) => setE(p => ({ ...p, [cat]: { ...p[cat], ...cambio } }))
  const updEsc = (i, k, v) => upd({ escalones: x.escalones.map((s, j) => j === i ? { ...s, [k]: n2(v) } : s) })
  const disponibles = NICHOS_LRM.filter(n => !e[n])
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:130, padding:16 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:560, border:'1px solid var(--gold-border)', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Escaleras de valor</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>"General" aplica a las categorías que no tengan escalera propia.</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {Object.keys(e).map(k => <button key={k} onClick={() => setCat(k)} className={cat === k ? 'btn-gold' : 'btn'} style={{ fontSize:11, padding:'5px 10px' }}>{k}</button>)}
          {disponibles.length > 0 && (
            <select value="" onChange={ev => { if (!ev.target.value) return; setE(p => ({ ...p, [ev.target.value]: JSON.parse(JSON.stringify(p.General)) })); setCat(ev.target.value) }} style={{ ...iStyle, width:'auto', marginTop:0, padding:'5px 8px', fontSize:11 }}>
              <option value="">+ Escalera para…</option>{disponibles.map(n => <option key={n}>{n}</option>)}
            </select>
          )}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12 }}>
          <div><Etiqueta>Cobras por</Etiqueta><select value={x.unidad} onChange={ev => upd({ unidad: ev.target.value })} style={iStyle}><option value="kg">kg</option><option value="lb">lb</option><option value="unidad">unidad</option></select></div>
          <div><Etiqueta>Moneda</Etiqueta><select value={x.moneda} onChange={ev => upd({ moneda: ev.target.value })} style={iStyle}><option>COP</option><option>USD</option></select></div>
          <div><Etiqueta>Mínimo</Etiqueta><input inputMode="decimal" value={x.minimo || ''} onChange={ev => upd({ minimo: n2(ev.target.value) })} style={iStyle} /></div>
          <div><Etiqueta>AIU interno</Etiqueta><select value={x.aiu ? 'si' : 'no'} onChange={ev => upd({ aiu: ev.target.value === 'si' })} style={iStyle}><option value="no">No</option><option value="si">Sí (2 lb/caja)</option></select></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          <div><Etiqueta>Tu costo por {x.unidad}</Etiqueta><input inputMode="decimal" value={x.costo.valor} onChange={ev => upd({ costo: { ...x.costo, valor: n2(ev.target.value) } })} style={iStyle} /></div>
          <div><Etiqueta>Moneda del costo</Etiqueta><select value={x.costo.moneda} onChange={ev => upd({ costo: { ...x.costo, moneda: ev.target.value } })} style={iStyle}><option>USD</option><option>COP</option></select></div>
        </div>
        <Etiqueta>Escalones (desde cuánto · precio al cliente en {x.moneda})</Etiqueta>
        {x.escalones.map((s, i) => (
          <div key={i} style={{ display:'flex', gap:6, marginTop:6 }}>
            <input inputMode="decimal" value={s.desde} onChange={ev => updEsc(i, 'desde', ev.target.value)} style={{ ...iStyle, marginTop:0 }} />
            <input inputMode="decimal" value={s.precio} onChange={ev => updEsc(i, 'precio', ev.target.value)} style={{ ...iStyle, marginTop:0 }} />
            <button onClick={() => upd({ escalones: x.escalones.filter((_, j) => j !== i) })} disabled={x.escalones.length === 1} className="btn">✕</button>
          </div>
        ))}
        <button onClick={() => upd({ escalones: [...x.escalones, { desde: (Math.max(...x.escalones.map(s => s.desde)) || 0) + 100, precio: x.escalones[x.escalones.length - 1].precio }] })} className="btn" style={{ fontSize:11, marginTop:8 }}>+ Escalón</button>
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button onClick={() => onGuardar(e)} className="btn-green" style={{ flex:1 }}>Guardar escaleras</button>
          {cat !== 'General' && <button onClick={() => { const { [cat]: _, ...resto } = e; setE(resto); setCat('General') }} className="btn" style={{ color:'var(--red)' }}>Quitar {cat}</button>}
          <button onClick={onCerrar} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}