// @ts-nocheck
// LRM Trade Consulting · Cotizador con escalera de valor
// Pones cantidad y categoría → escalón que aplica, precio al cliente, tu costo y tu margen.
// Precios y costos salen de Tarifas: escalera propia del cliente o la general, y tu costo de la tabla maestra.
// Cada cotización se guarda en lrm_cotizaciones (SQL 08) y se manda por WhatsApp.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { NICHOS_LRM, nichoPrincipal, linkWhatsApp, fechaCorta } from './LRMClientes'
import { useDatosLRM } from './datosLRM'
import { useTarifas, escaleraPara, costoPara, escalonDe, siguienteDe, UNIDADES, LB_A_KG } from './tarifasLRM'
export { ESCALERAS_LRM } from './tarifasLRM'

const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
// Acepta 2.3 · 2,3 · 24.000 · 24000 (puntos de miles o decimales)
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const AIU_LB_CAJA = 2                       // AIU interno de perfumes (lb por caja)

const UNIDAD = UNIDADES
const iStyle = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const ESTADOS = { enviada:{ l:'Enviada', c:'#378ADD' }, aceptada:{ l:'Aceptada', c:'var(--green)' }, perdida:{ l:'Perdida', c:'var(--red)' } }

export default function Cotizador() {
  const divisas = useDivisas()
  const trmHoy = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const { empresa } = useDatosLRM()
  const { escaleras, costos } = useTarifas()
  const [bodegas, setBodegas] = useState([])
  const [clientes, setClientes] = useState([])
  const [historial, setHistorial] = useState([])
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [estado, setEstado] = useState('')
  const [f, setF] = useState({ cliente_id:'', cliente_nombre:'', categoria:'Perfumes', bodega_id:'', origen:'Miami', modalidad:'Marítimo', cantidad:'', unidadPeso:'kg', cajas:'', trm:'', precioManual:'' })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const cargar = async () => {
    const [bo, cl, co] = await Promise.all([
      supabase.from('lrm_bodegas').select('*').order('nombre'),
      supabase.from('lrm_clientes').select('*').order('nombre'),
      supabase.from('lrm_cotizaciones').select('*').order('created_at', { ascending:false }).limit(50),
    ])
    setBodegas((bo.data || []).filter(b => b.activa !== false))
    setClientes(cl.data || [])
    if (co.error) setFaltaTabla(true); else setHistorial(co.data || [])
  }
  useEffect(() => { cargar() }, [])

  // ── Cálculo ──
  const cli = clientes.find(c => c.id === f.cliente_id)
  const { esc, fuente } = escaleraPara(cli, escaleras, f.categoria)
  const bodega = bodegas.find(b => b.id === f.bodega_id) || null
  const costoMaestro = costoPara(costos, bodega, f.categoria)
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
  // Tu costo sobre la cantidad real, en la unidad en que te cobra la bodega
  const realKg = esc.unidad === 'kg' ? real : esc.unidad === 'lb' ? real * LB_A_KG : null
  const baseCosto = costoMaestro.unidad === 'unidad' ? (esc.unidad === 'unidad' ? real : null)
    : costoMaestro.unidad === 'kg' ? realKg : (realKg != null ? realKg / LB_A_KG : null)
  const costo = baseCosto == null ? 0 : Math.round(baseCosto * aCOP(costoMaestro.valor, costoMaestro.moneda))
  const costoSinUnidad = baseCosto == null && real > 0
  const margen = total - costo
  const bajoMinimo = !!(esc.minimo && cliente < esc.minimo)
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
                {NICHOS_LRM.map(n => <option key={n} value={n}>{n}{cli?.tarifas?.[n] ? ' (precio del cliente)' : escaleras[n] ? '' : ' (escalera general)'}</option>)}
              </select></div>
            <div><Etiqueta>Origen</Etiqueta><select value={f.origen} onChange={set('origen')} style={iStyle}>{['Miami','China','Panamá'].map(o => <option key={o}>{o}</option>)}</select></div>
            {bodegas.length > 0 && <div><Etiqueta>Bodega (para tu costo)</Etiqueta><select value={f.bodega_id} onChange={set('bodega_id')} style={iStyle}><option value="">Cualquiera</option>{bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}</select></div>}
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
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>{fuente === 'cliente' ? `PRECIO DE ${(cli?.nombre || '').toUpperCase()}` : 'PRECIO GENERAL'} · {(fuente === 'general-base' ? 'GENERAL' : f.categoria).toUpperCase()}</div>
            <span style={{ fontSize:11, color:'var(--text4)' }}>Se editan en Tarifas</span>
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
          {costoSinUnidad && <div style={{ fontSize:11, color:'#E8A23A', marginTop:8 }}>Tu costo de {f.categoria} está por {costoMaestro.unidad === 'unidad' ? 'unidad' : 'peso'} y aquí cotizas por {esc.unidad === 'unidad' ? 'unidades' : 'peso'}: revisa Tarifas → Mis costos.</div>}
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

    </div>
  )
}