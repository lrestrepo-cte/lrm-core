// MySpace · La Matriz: tus negocios en un solo lugar.
// Cada negocio con su logo, cómo va, lo que le falta, y el botón para pasar plata a lo personal.
// LRM Trade lee su caja real (lrm_cuentas, lrm_movimientos, lrm_cargas). LRM Inversiones lee sus préstamos.
// ZABÚ y RV Sports llevan su lista de lo que falta para arrancar (my_space_ajustes 'negocios').
// Pasar plata: RPC myspace_retirar (SQL 30) → retiro en el negocio + ingreso en tu cuenta, juntos.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { saldoCuenta, resumenDelMes } from '../lrm/Caja'
import { useAjuste } from './MiDia'
import { hoyISO } from './Rutina'

const cop = n => (Number(n) < 0 ? '−' : '') + '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('es-CO')
const copCorto = n => { const v = Math.abs(Number(n) || 0), s = Number(n) < 0 ? '−' : ''; return v >= 1e6 ? `${s}$${(v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `${s}$${Math.round(v / 1e3).toLocaleString('es-CO')} mil` : cop(n) }
const num = v => Number(String(v ?? '').replace(/\D/g, '')) || 0
const iStyle = { width:'100%', padding:'11px 12px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

// El orden en que aparecen y cómo se ven
export const MIS_NEGOCIOS = [
  { id:'lrm-trade',       nombre:'LRM Trade', sub:'Importaciones y casillero', color:'#C9A84C', logo:'/marca/isotipo.png', emoji:'🌐', slug:'lrm-trade', estado:'operando' },
  { id:'zabu',            nombre:'ZABÚ',                 sub:'Hot Dogs de Verdad',        color:'#E8A23A', emoji:'🌭', slug:'zabu',            estado:'2027' },
  { id:'rv',              nombre:'RV Sports',            sub:'Calcetines deportivos',     color:'#378ADD', emoji:'⚽', slug:'rv-sports',       estado:'2027' },
  { id:'lrm-inversiones', nombre:'LRM Inversiones',      sub:'Préstamos y portafolio',    color:'#9C7BFF', emoji:'📈', slug:'lrm-inversiones', estado:'construccion' },
]
const ESTADOS = {
  operando:     { l:'Operando',         c:'var(--green)' },
  '2027':       { l:'Arranca en 2027',  c:'#E8A23A' },
  construccion: { l:'En construcción',  c:'#9C7BFF' },
}
// Lo que falta para arrancar (se edita en la tarjeta)
const PENDIENTES_BASE = {
  zabu: ['Definir socio y acuerdo por escrito', 'Cocina o local', 'Cámara de Comercio, RUT y permiso sanitario', 'Carrito y equipos', 'Proveedores y costo por receta', 'Menú y precios', 'Marca y redes listas', 'Plan de apertura'],
  rv: ['Acuerdo de socios con Ozzy', 'Proveedor y muestras de calcetines', 'Costeo de la importación', 'Marca, logo y empaque', 'Catálogo y precios', 'Canales de venta: Instagram, tiendas y equipos', 'Inventario inicial'],
  'lrm-inversiones': ['Reglas de préstamo: tasas, plazos y garantías', 'Contrato y pagaré modelo', 'Capital disponible para prestar', 'Primeros clientes'],
}

// ─── Datos de cada negocio ────────────────────────────────────────────────────
function useLRMTrade() {
  const [d, setD] = useState(null)
  const cargar = async () => {
    const [cu, mo, ca] = await Promise.all([
      supabase.from('lrm_cuentas').select('*').order('created_at'),
      supabase.from('lrm_movimientos').select('tipo,monto,fecha,cuenta_id,cuenta_destino_id,concepto,categoria'),
      supabase.from('lrm_cargas').select('etapa,activa'),
    ])
    if (cu.error || mo.error) return setD({ falta: true })
    const cuentas = (cu.data || []).filter(c => c.activa !== false), movs = mo.data || []
    const mes = hoyISO().slice(0, 7)
    const r = resumenDelMes(mes, movs, cuentas)
    const suma = t => movs.filter(m => m.tipo === t).reduce((s, m) => s + Number(m.monto || 0), 0)
    setD({
      cuentas: cuentas.map(c => ({ ...c, saldo: saldoCuenta(c, movs) })),
      caja: cuentas.reduce((s, c) => s + saldoCuenta(c, movs), 0),
      utilidad: r.utilidad, retiros: r.retiros,
      porCobrar: Math.max(0, suma('cobro_cliente') - suma('abono_cliente')),
      porPagar: Math.max(0, suma('costo_proveedor') - suma('pago_proveedor')),
      enCurso: (ca.data || []).filter(c => c.etapa !== 'entregada' && c.activa !== false).length,
    })
  }
  useEffect(() => { cargar() }, [])
  return { d, recargar: cargar }
}
function useInversiones() {
  const [d, setD] = useState(null)
  useEffect(() => {
    supabase.from('inv_prestamos').select('estado,saldo_capital').then(r => {
      if (r.error) return setD({ falta: true })
      const p = r.data || []
      setD({ activos: p.filter(x => x.estado === 'activo').length, mora: p.filter(x => x.estado === 'mora').length,
        cartera: p.filter(x => x.estado === 'activo' || x.estado === 'mora').reduce((s, x) => s + Number(x.saldo_capital || 0), 0) })
    })
  }, [])
  return d
}

// ─── Piezas ───────────────────────────────────────────────────────────────────
function Logo({ n, size = 46 }) {
  return n.logo
    ? <img src={n.logo} alt="" style={{ width:size, height:size, objectFit:'contain', borderRadius:12, background:'#0b0a08', padding:5, boxSizing:'border-box', border:`1px solid ${n.color}55`, flexShrink:0 }} />
    : <div aria-hidden="true" style={{ width:size, height:size, borderRadius:12, display:'grid', placeItems:'center', fontSize:size * 0.5, background:`${n.color}1c`, border:`1px solid ${n.color}55`, flexShrink:0 }}>{n.emoji}</div>
}
function Dato({ l, v, c, id }) {
  return (
    <div style={{ minWidth:0, padding:'9px 11px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
      <div style={{ fontSize:10.5, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l}</div>
      <div id={id} style={{ fontSize:16, fontWeight:800, color: c || 'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
    </div>
  )
}
const abrirNegocio = slug => { window.location.hash = '#/' + slug; window.location.reload() }

function Tarjeta({ n, children, pie }) {
  const e = ESTADOS[n.estado]
  return (
    <div className="panel" style={{ borderTop:`3px solid ${n.color}`, display:'flex', flexDirection:'column', gap:12, minWidth:0 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <Logo n={n} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15.5, fontWeight:800, color:'var(--text)', lineHeight:1.25 }}>{n.nombre}</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{n.sub}</div>
        </div>
        <span style={{ flexShrink:0, fontSize:10.5, fontWeight:800, padding:'3px 9px', borderRadius:999, color:e.c, border:`1px solid ${e.c}`, opacity:0.9 }}>{e.l}</span>
      </div>
      {children}
      {pie && <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:'auto' }}>{pie}</div>}
    </div>
  )
}

// Lista de lo que falta para arrancar
function Pendientes({ n, lista, onCambiar }) {
  const [nuevo, setNuevo] = useState('')
  const [abierta, setAbierta] = useState(false)
  const hechos = lista.filter(x => x.hecho).length, pct = lista.length ? Math.round(hechos / lista.length * 100) : 0
  const cambiar = nueva => onCambiar(nueva)
  return (
    <div>
      <button type="button" onClick={() => setAbierta(a => !a)} style={{ width:'100%', background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--text2)', marginBottom:6 }}>
          <span>Listo para arrancar</span><b id={`neg-pct-${n.id}`} style={{ color:n.color }}>{pct}% · {hechos}/{lista.length}</b>
        </div>
        <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background:n.color }} /></div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>
          {abierta ? 'Ocultar la lista ▲' : (lista.find(x => !x.hecho) ? <>Sigue: <span style={{ color:'var(--text)' }}>{lista.find(x => !x.hecho).t}</span> · ver todo ▼</> : 'Todo listo ✓')}
        </div>
      </button>
      {abierta && (
        <div style={{ marginTop:8 }}>
          {lista.map((x, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop:'1px solid var(--border)' }}>
              <button type="button" aria-label={x.hecho ? 'Marcar como pendiente' : 'Marcar como hecho'} onClick={() => cambiar(lista.map((y, j) => j === i ? { ...y, hecho: !y.hecho } : y))}
                style={{ width:24, height:24, flexShrink:0, borderRadius:8, cursor:'pointer', display:'grid', placeItems:'center', fontWeight:900, fontSize:13, color:'#0b0b0b',
                  background: x.hecho ? n.color : 'transparent', border: x.hecho ? 'none' : '2px solid rgba(255,255,255,0.2)' }}>{x.hecho ? '✓' : ''}</button>
              <span style={{ flex:1, fontSize:13, color:'var(--text)', textDecoration: x.hecho ? 'line-through' : 'none', opacity: x.hecho ? 0.6 : 1 }}>{x.t}</span>
              <button type="button" aria-label="Quitar" onClick={() => cambiar(lista.filter((_, j) => j !== i))} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:16, padding:4 }}>×</button>
            </div>
          ))}
          <form onSubmit={e => { e.preventDefault(); if (!nuevo.trim()) return; cambiar([...lista, { t: nuevo.trim(), hecho: false }]); setNuevo('') }} style={{ display:'flex', gap:8, marginTop:8 }}>
            <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Agregar algo que falta" style={{ ...iStyle, padding:'9px 11px', fontSize:14 }} />
            <button type="submit" className="btn" style={{ width:'auto', flexShrink:0 }}>＋</button>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Pasar plata del negocio a lo personal ───────────────────────────────────
function ModalPasar({ n, cuentasNegocio, onCerrar, onListo }) {
  const [personales, setPersonales] = useState([])
  const [f, setF] = useState({ monto:'', de: cuentasNegocio[0]?.id || '', a:'', fecha: hoyISO(), nota:'' })
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    supabase.from('my_space_cuentas').select('id,nombre,dueno,tipo,activa').eq('activa', true).eq('dueno', 'luis').order('orden').then(r => {
      const l = (r.data || []).filter(c => c.tipo !== 'credito'); setPersonales(l); setF(p => ({ ...p, a: p.a || l[0]?.id || '' }))
    })
  }, [])
  const de = cuentasNegocio.find(c => c.id === f.de), monto = num(f.monto)
  const pasar = async () => {
    if (!monto) return setError('Escribe cuánto vas a pasar.')
    if (!f.de || !f.a) return setError('Elige de qué cuenta sale y a cuál llega.')
    setOcupado(true); setError('')
    const { data, error } = await supabase.rpc('myspace_retirar', { p_negocio: n.id, p_cuenta_negocio: f.de, p_cuenta_personal: f.a, p_monto: monto, p_fecha: f.fecha, p_nota: f.nota || null })
    setOcupado(false)
    if (error) return setError(/function|does not exist/i.test(error.message) ? 'Corre en Supabase el archivo 30_myspace_matriz.sql' : error.message)
    onListo(`✓ ${cop(monto)} pasaron de ${data?.de} a ${data?.a}`)
  }
  return (
    <div onClick={onCerrar} style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Pasar plata a lo personal" style={{ width:'100%', maxWidth:460, background:'var(--bg2, #141416)', border:'1px solid var(--border)', borderRadius:'22px 22px 0 0', padding:'20px 18px calc(20px + env(safe-area-inset-bottom, 0px))', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <Logo n={n} size={40} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Pasar a lo personal</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Sale de {n.nombre} como retiro del socio</div>
          </div>
          <button type="button" onClick={onCerrar} className="btn" aria-label="Cerrar" style={{ width:'auto' }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>¿Cuánto?</div>
        <input id="ms-pasar-monto" inputMode="numeric" autoFocus value={f.monto ? Number(num(f.monto)).toLocaleString('es-CO') : ''} onChange={e => setF(p => ({ ...p, monto: e.target.value }))} placeholder="$0"
          style={{ ...iStyle, fontSize:28, fontWeight:800, padding:'12px 14px', marginBottom:14 }} />
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Sale de (cuenta de {n.nombre})</div>
        <select id="ms-pasar-de" value={f.de} onChange={e => setF(p => ({ ...p, de: e.target.value }))} style={{ ...iStyle, marginBottom:4 }}>
          {cuentasNegocio.map(c => <option key={c.id} value={c.id}>{c.nombre} · {cop(c.saldo)}</option>)}
        </select>
        {de && monto > de.saldo && <div style={{ fontSize:12, color:'#E8A23A', marginBottom:4 }}>Esa cuenta tiene {cop(de.saldo)}: quedaría en negativo.</div>}
        <div style={{ textAlign:'center', fontSize:18, color:n.color, margin:'6px 0' }} aria-hidden="true">↓</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Llega a (tu cuenta personal)</div>
        {personales.length ? (
          <select id="ms-pasar-a" value={f.a} onChange={e => setF(p => ({ ...p, a: e.target.value }))} style={{ ...iStyle, marginBottom:14 }}>
            {personales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        ) : <div style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Primero crea tu cuenta personal en Plata → Cuentas.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.4fr)', gap:10, marginBottom:14 }}>
          <div><div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Fecha</div><input type="date" value={f.fecha} onChange={e => setF(p => ({ ...p, fecha: e.target.value }))} style={iStyle} /></div>
          <div><div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Para qué (opcional)</div><input id="ms-pasar-nota" value={f.nota} onChange={e => setF(p => ({ ...p, nota: e.target.value }))} placeholder="Ej: gastos de diciembre" style={iStyle} /></div>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5, marginBottom:14 }}>En {n.nombre} queda como <b>retiro del socio</b>: sale de la caja pero no cuenta como gasto, así que la utilidad no cambia. En MySpace entra como ingreso en tu cuenta.</div>
        {error && <div style={{ fontSize:13, color:'var(--red)', marginBottom:10 }}>{error}</div>}
        <button id="ms-pasar-ok" type="button" className="btn-gold" disabled={ocupado || !personales.length} onClick={pasar} style={{ width:'100%' }}>{ocupado ? 'Pasando…' : monto ? `Pasar ${cop(monto)}` : 'Pasar'}</button>
      </div>
    </div>
  )
}

// ─── La sección de negocios ──────────────────────────────────────────────────
export default function Negocios({ onCambio }) {
  const lrm = useLRMTrade()
  const inv = useInversiones()
  const ajuste = useAjuste('negocios')
  const [pasar, setPasar] = useState(null)
  const [aviso, setAviso] = useState('')

  const listaDe = id => ajuste.valor?.[id]?.pendientes || (PENDIENTES_BASE[id] || []).map(t => ({ t, hecho: false }))
  const guardarLista = (id, pendientes) => ajuste.guardar({ ...(ajuste.valor || {}), [id]: { ...(ajuste.valor?.[id] || {}), pendientes } })
  const t = lrm.d && !lrm.d.falta ? lrm.d : null

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase' }}>Tus negocios</div>
        {t && <div style={{ fontSize:12.5, color:'var(--text2)' }}>En caja <b id="neg-caja-total" style={{ color:'var(--text)' }}>{copCorto(t.caja)}</b></div>}
      </div>
      {aviso && <div id="neg-aviso" className="panel" style={{ marginBottom:10, padding:'10px 14px', fontSize:13.5, color:'var(--green)', fontWeight:700 }}>{aviso}</div>}
      <div className="neg-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap:12 }}>
        {MIS_NEGOCIOS.map(n => {
          if (n.id === 'lrm-trade') return (
            <Tarjeta key={n.id} n={n} pie={<>
              <button id="neg-pasar" type="button" className="btn-gold" disabled={!t?.cuentas?.length} onClick={() => { setAviso(''); setPasar(n) }} style={{ flex:1, minWidth:150 }}>↓ Pasar a lo personal</button>
              <button type="button" className="btn" onClick={() => abrirNegocio(n.slug)} style={{ width:'auto' }}>Abrir →</button>
            </>}>
              {!lrm.d ? <div style={{ fontSize:12.5, color:'var(--text3)' }}>Cargando…</div>
                : lrm.d.falta ? <div style={{ fontSize:12.5, color:'var(--text3)' }}>Todavía no hay caja de LRM Trade para leer.</div>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8 }}>
                    <Dato id="neg-lrm-caja" l="Plata en caja" v={cop(t.caja)} c={t.caja < 0 ? 'var(--red)' : 'var(--text)'} />
                    <Dato id="neg-lrm-utilidad" l="Utilidad del mes" v={cop(t.utilidad)} c={t.utilidad < 0 ? 'var(--red)' : 'var(--green)'} />
                    <Dato l="Te deben los clientes" v={cop(t.porCobrar)} c={t.porCobrar ? '#E8A23A' : 'var(--text)'} />
                    <Dato l="Cargas en curso" v={t.enCurso} />
                    {t.retiros > 0 && <div style={{ gridColumn:'1 / -1', fontSize:12, color:'var(--text3)' }}>Este mes ya pasaste {cop(t.retiros)} a lo personal.</div>}
                    {t.porPagar > 0 && <div style={{ gridColumn:'1 / -1', fontSize:12, color:'var(--text3)' }}>Le debes a proveedores {cop(t.porPagar)}.</div>}
                  </div>}
            </Tarjeta>
          )
          if (n.id === 'lrm-inversiones') return (
            <Tarjeta key={n.id} n={n} pie={<button type="button" className="btn" onClick={() => abrirNegocio(n.slug)} style={{ width:'auto' }}>Abrir →</button>}>
              {inv && !inv.falta && (inv.activos > 0 || inv.mora > 0) && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8 }}>
                  <Dato l="Prestado en la calle" v={cop(inv.cartera)} />
                  <Dato l="Préstamos activos" v={`${inv.activos}${inv.mora ? ` · ${inv.mora} en mora` : ''}`} c={inv.mora ? 'var(--red)' : 'var(--text)'} />
                </div>
              )}
              {ajuste.valor !== undefined && <Pendientes n={n} lista={listaDe(n.id)} onCambiar={l => guardarLista(n.id, l)} />}
            </Tarjeta>
          )
          return (
            <Tarjeta key={n.id} n={n} pie={<button type="button" className="btn" onClick={() => abrirNegocio(n.slug)} style={{ width:'auto' }}>Abrir →</button>}>
              {ajuste.valor !== undefined && <Pendientes n={n} lista={listaDe(n.id)} onCambiar={l => guardarLista(n.id, l)} />}
              <div style={{ fontSize:12, color:'var(--text3)' }}>Cuando tenga caja en la app, aquí verás su plata y su utilidad, y podrás pasar a lo personal.</div>
            </Tarjeta>
          )
        })}
      </div>
      {ajuste.falta && <div style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>Para guardar las listas de cada negocio corre el SQL 27 en Supabase.</div>}
      {pasar && <ModalPasar n={pasar} cuentasNegocio={t?.cuentas || []} onCerrar={() => setPasar(null)}
        onListo={msg => { setPasar(null); setAviso(msg); lrm.recargar(); onCambio?.() }} />}
    </div>
  )
}
