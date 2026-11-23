// Portal de rastreo para clientes de LRM Trade Consulting.
// Página pública: #/rastreo/<código del cliente>. No necesita usuario.
// Lee todo por la función lrm_rastreo (SQL 15), que solo devuelve las cargas de ese cliente,
// sin precios, costos ni notas internas.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ETAPAS = [
  { id:'bodega',    label:'Recibida en bodega', corto:'Bodega' },
  { id:'transito',  label:'En camino',          corto:'En camino' },
  { id:'aduana',    label:'En aduana',          corto:'Aduana' },
  { id:'destino',   label:'Lista en Barranquilla', corto:'Lista' },
  { id:'entregada', label:'Entregada',          corto:'Entregada' },
]
const DIAS_TRANSITO = { maritimo: 8, aereo: 3 }
const idx = e => Math.max(0, ETAPAS.findIndex(x => x.id === e))
export const C = { fondo:'#F6F3EC', papel:'#FFFFFF', tinta:'#16140F', suave:'#6B655A', linea:'#E7E1D3', oro:'#B8922F', oroClaro:'#F3EAD2', verde:'#2E8B57' }

export const fecha = (iso, conHora) => {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso)
  return d.toLocaleDateString('es-CO', { day:'numeric', month:'short', ...(conHora ? { hour:'numeric', minute:'2-digit' } : {}) })
}
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const kg = v => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })

export const tokenDesdeHash = () => (window.location.hash.match(/^#\/rastreo\/([A-Za-z0-9]+)/) || [])[1] || null

export default function Rastreo({ token }) {
  const [d, setD] = useState(undefined)   // undefined cargando · null no existe
  const [error, setError] = useState(false)
  useEffect(() => {
    document.title = 'Rastreo · LRM Trade Consulting'
    supabase.rpc('lrm_rastreo', { p_token: token }).then(({ data, error }) => {
      if (error) { setError(true); setD(null) } else setD(data || null)
    })
  }, [token])

  const consolidados = d?.consolidados || []
  const servicios = d?.servicios || []
  const srvActivos = servicios.filter(x => x.activo)
  const consActivos = consolidados.filter(x => x.estado !== 'entregado')
  const activas = (d?.cargas || []).filter(c => c.etapa !== 'entregada')
  const entregadas = (d?.cargas || []).filter(c => c.etapa === 'entregada')
  const wa = d?.empresa?.whatsapp ? `https://wa.me/${(d.empresa.whatsapp.replace(/\D/g, '').length === 10 ? '57' : '') + d.empresa.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, soy ${d.cliente}. Quiero preguntar por mi carga.`)}` : null

  return (
    <div style={{ minHeight:'100vh', background:C.fondo, color:C.tinta, fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'28px 16px 48px' }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:28 }}>
          <img src="/marca/logo-documento.png" alt="LRM Trade Consulting" style={{ height:46, maxWidth:'60%', objectFit:'contain' }} />
          <span style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:C.oro }}>RASTREO</span>
        </header>

        {d === undefined && <Caja><div style={{ color:C.suave, fontSize:14 }}>Buscando tus cargas…</div></Caja>}

        {d === null && (
          <Caja>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>{error ? 'No pudimos cargar el rastreo' : 'Este link no es válido'}</div>
            <div style={{ fontSize:14, color:C.suave, lineHeight:1.6 }}>{error ? 'Intenta de nuevo en unos minutos.' : 'Revisa que lo hayas copiado completo o pídenos uno nuevo por WhatsApp.'}</div>
          </Caja>
        )}

        {d && (
          <>
            <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px', letterSpacing:-0.5 }}>Hola{d.cliente ? `, ${d.cliente}` : ''}</h1>
            <p style={{ fontSize:14, color:C.suave, margin:'0 0 22px' }}>
              {activas.length + consActivos.length + srvActivos.length ? `Tienes ${activas.length + consActivos.length + srvActivos.length} ${activas.length + consActivos.length + srvActivos.length === 1 ? 'envío en curso' : 'envíos en curso'}.` : 'No tienes cargas en camino en este momento.'}
            </p>

            {srvActivos.map(x => <Servicio key={'s' + x.numero} x={x} />)}
            {consActivos.map((x, k) => <Consolidado key={'c' + k} x={x} />)}
            {activas.map(c => <Carga key={c.guia + c.fecha_recibo} c={c} />)}

            {consolidados.filter(x => x.estado === 'entregado').map((x, k) => (
              <Caja key={'ce' + k} pad="12px 18px"><div style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:13 }}>
                <div><b>{x.nombre}</b> <span style={{ color:C.suave }}>· {x.origen} → {x.destino}</span></div>
                <div style={{ color:C.verde, fontWeight:700 }}>✓ Entregado</div></div></Caja>
            ))}
            {entregadas.length > 0 && (
              <>
                <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:C.suave, margin:'28px 0 10px' }}>ENTREGADAS · ÚLTIMOS 90 DÍAS</div>
                <Caja pad="4px 18px">
                  {entregadas.map((c, i) => (
                    <div key={c.guia + i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'12px 0', borderTop: i ? `1px solid ${C.linea}` : 'none', fontSize:13 }}>
                      <div><b>WR {c.guia}</b> <span style={{ color:C.suave }}>· {c.descripcion || 'Mercancía'} · {c.piezas} {c.piezas === 1 ? 'pieza' : 'piezas'}</span></div>
                      <div style={{ color:C.verde, fontWeight:700, whiteSpace:'nowrap' }}>✓ {fecha(c.fecha_entrega || c.fecha_recibo)}</div>
                    </div>
                  ))}
                </Caja>
              </>
            )}

            {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ display:'block', textAlign:'center', marginTop:26, padding:'14px', borderRadius:12, background:C.tinta, color:'#fff', textDecoration:'none', fontWeight:700, fontSize:14 }}>¿Dudas? Escríbenos por WhatsApp</a>}
          </>
        )}

        <footer style={{ textAlign:'center', marginTop:36, fontSize:12, color:C.suave }}>
          <div style={{ fontWeight:700, color:C.oro, letterSpacing:0.5 }}>We bring it. Safe and on time.</div>
          <div style={{ marginTop:4 }}>{d?.empresa?.nombre || 'LRM Trade Consulting'} · Barranquilla, Colombia</div>
        </footer>
      </div>
    </div>
  )
}

export function Caja({ children, pad = '18px' }) {
  return <div style={{ background:C.papel, border:`1px solid ${C.linea}`, borderRadius:16, padding:pad, marginBottom:12, boxShadow:'0 1px 2px rgba(22,20,15,0.04)' }}>{children}</div>
}

export function Carga({ c }) {
  const i = idx(c.etapa)
  // Fecha de cada etapa: la última vez que la carga entró a esa etapa
  const fechas = {}
  ;(c.eventos || []).forEach(ev => { fechas[ev.etapa] = ev.fecha })
  if (!fechas.bodega && c.fecha_recibo) fechas.bodega = c.fecha_recibo
  const llegada = c.etapa === 'transito' && c.fecha_salida ? masDias(c.fecha_salida, DIAS_TRANSITO[c.modalidad] || 8) : null
  const actual = ETAPAS[i]
  return (
    <Caja>
      <div className="rt-carga" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, color:C.suave }}>Recibo WR {c.guia}</div>
          <div style={{ fontSize:17, fontWeight:800, marginTop:2 }}>{c.descripcion || 'Mercancía'}</div>
          <div style={{ fontSize:13, color:C.suave, marginTop:2 }}>
            {c.piezas} {c.piezas === 1 ? 'pieza' : 'piezas'}{Number(c.kg) ? ` · ${kg(c.kg)} kg` : ''} · {c.modalidad === 'aereo' ? 'Aéreo' : 'Marítimo'}
          </div>
        </div>
        <span style={{ flexShrink:0, fontSize:12, fontWeight:700, padding:'6px 10px', borderRadius:999, background:C.oroClaro, color:'#7A5E14' }}>{actual.label}</span>
      </div>

      {/* Línea de tiempo */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${ETAPAS.length}, 1fr)`, gap:4 }}>
        {ETAPAS.map((e, k) => (
          <div key={e.id} style={{ height:6, borderRadius:3, background: k <= i ? C.oro : C.linea }} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${ETAPAS.length}, 1fr)`, gap:4, marginTop:6 }}>
        {ETAPAS.map((e, k) => (
          <div key={e.id} style={{ fontSize:10.5, lineHeight:1.3, color: k <= i ? C.tinta : '#A9A294', fontWeight: k === i ? 800 : 500, minWidth:0 }}>
            {e.corto}
            {k <= i && fechas[e.id] ? <div style={{ color:C.suave, fontWeight:500 }}>{fecha(fechas[e.id])}</div> : null}
          </div>
        ))}
      </div>

      {llegada && (
        <div style={{ marginTop:14, fontSize:13, background:C.fondo, borderRadius:10, padding:'10px 12px' }}>
          Llegada estimada a Barranquilla: <b>{fecha(llegada)}</b>
        </div>
      )}
      {c.etapa === 'destino' && (
        <div style={{ marginTop:14, fontSize:13, background:'#EAF5EE', color:'#1F5F3B', borderRadius:10, padding:'10px 12px' }}>
          Tu mercancía ya está en Barranquilla. Te contactamos para coordinar la entrega.
        </div>
      )}
    </Caja>
  )
}
// Carga dentro de un consolidado (China u otro origen)
const ETAPAS_CONS = [
  { id:'abierto',    corto:'En bodega origen' },
  { id:'cerrado',    corto:'Lista para zarpar' },
  { id:'despachado', corto:'En camino' },
  { id:'entregado',  corto:'Entregada' },
]
const ESTADO_ITEM = { por_llegar:'Por llegar a la bodega', en_bodega:'✓ En bodega', novedad:'Con novedad · te contactamos' }
export function Consolidado({ x }) {
  const i = Math.max(0, ETAPAS_CONS.findIndex(e => e.id === x.estado))
  const items = x.items || []
  const tot = items.reduce((t, it) => ({ b: t.b + Number(it.bultos || 0), kg: t.kg + Number(it.kg || 0), m3: t.m3 + Number(it.cbm || 0) }), { b:0, kg:0, m3:0 })
  const etiqueta = x.estado === 'abierto' ? 'Recibiendo carga' : x.estado === 'cerrado' ? 'Lista para zarpar' : x.estado === 'despachado' ? 'En camino' : 'Entregada'
  return (
    <Caja>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, color:C.suave }}>Carga consolidada · {x.origen} → {x.destino}{x.mercancia === 'especial' ? ' · mercancía especial' : ''}</div>
          <div style={{ fontSize:17, fontWeight:800, marginTop:2 }}>{x.nombre}</div>
          <div style={{ fontSize:13, color:C.suave, marginTop:2 }}>
            {tot.b ? `${kg(tot.b)} bultos · ` : ''}{tot.kg ? `${kg(tot.kg)} kg · ` : ''}{Number(tot.m3).toLocaleString('es-CO', { maximumFractionDigits: 2 })} m³ · Marítimo
          </div>
        </div>
        <span style={{ flexShrink:0, fontSize:12, fontWeight:700, padding:'6px 10px', borderRadius:999, background:C.oroClaro, color:'#7A5E14' }}>{etiqueta}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${ETAPAS_CONS.length}, 1fr)`, gap:4 }}>
        {ETAPAS_CONS.map((e, k) => <div key={e.id} style={{ height:6, borderRadius:3, background: k <= i ? C.oro : C.linea }} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${ETAPAS_CONS.length}, 1fr)`, gap:4, marginTop:6 }}>
        {ETAPAS_CONS.map((e, k) => <div key={e.id} style={{ fontSize:10.5, lineHeight:1.3, color: k <= i ? C.tinta : '#A9A294', fontWeight: k === i ? 800 : 500 }}>{e.corto}</div>)}
      </div>
      {(x.etd || x.eta) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
          <div style={{ fontSize:13, background:C.fondo, borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:C.suave }}>Salida estimada</div><b>{x.etd ? fecha(x.etd) : 'Por confirmar'}</b></div>
          <div style={{ fontSize:13, background:C.fondo, borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:C.suave }}>Llegada estimada</div><b>{x.eta ? fecha(x.eta) : 'Por confirmar'}</b></div>
        </div>
      )}
      {(x.hitos || []).length > 0 && (
        <div style={{ marginTop:14, borderLeft:`2px solid ${C.linea}`, paddingLeft:12, display:'flex', flexDirection:'column', gap:8 }}>
          {[...x.hitos].reverse().map((h, k) => (
            <div key={k} className="rt-hito" style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:-18, top:4, width:10, height:10, borderRadius:5, background: k === 0 ? C.oro : C.linea }} />
              <div style={{ fontSize:13, fontWeight: k === 0 ? 800 : 600, color: k === 0 ? C.tinta : C.suave }}>{h.titulo}</div>
              <div style={{ fontSize:11.5, color:C.suave }}>{fecha(h.fecha)}{h.lugar ? ` · ${h.lugar}` : ''}{h.nota ? ` · ${h.nota}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {x.estado === 'abierto' && items.length > 0 && (
        <div style={{ marginTop:12, borderTop:`1px solid ${C.linea}`, paddingTop:8 }}>
          {items.map((it, k) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:12.5, padding:'5px 0' }}>
              <span>{it.descripcion || 'Mercancía'}{it.productos ? <span style={{ color:C.suave }}> · {it.productos} producto{it.productos === 1 ? '' : 's'}</span> : null}</span>
              <span style={{ color: it.estado === 'en_bodega' ? C.verde : it.estado === 'novedad' ? '#B4442F' : C.suave, fontWeight:600, whiteSpace:'nowrap' }}>{ESTADO_ITEM[it.estado] || ''}</span>
            </div>
          ))}
          {x.fecha_cierre && <div style={{ fontSize:12, color:C.suave, marginTop:4 }}>Recibimos carga hasta el {fecha(x.fecha_cierre)}.</div>}
        </div>
      )}
    </Caja>
  )
}
// Servicio de transporte / coteros / escolta
const ETAPAS_SRV = [
  { id:'aceptado',   corto:'Confirmado' },
  { id:'programado', corto:'Programado' },
  { id:'en_curso',   corto:'En camino' },
  { id:'completado', corto:'Completado' },
]
export function Servicio({ x }) {
  const i = Math.max(0, ETAPAS_SRV.findIndex(e => e.id === x.estado))
  return (
    <Caja>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, color:C.suave }}>Servicio SRV-{String(x.numero || '').padStart(4, '0')}</div>
          <div style={{ fontSize:17, fontWeight:800, marginTop:2 }}>{x.titulo || [x.origen, x.destino].filter(Boolean).join(' → ') || 'Servicio'}</div>
          {(x.origen || x.destino) && <div style={{ fontSize:13, color:C.suave, marginTop:2 }}>{[x.origen, x.destino].filter(Boolean).join(' → ')}</div>}
        </div>
        <span style={{ flexShrink:0, fontSize:12, fontWeight:700, padding:'6px 10px', borderRadius:999, background:C.oroClaro, color:'#7A5E14' }}>{ETAPAS_SRV[i].corto}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${ETAPAS_SRV.length}, 1fr)`, gap:4 }}>
        {ETAPAS_SRV.map((e, k) => <div key={e.id} style={{ height:6, borderRadius:3, background: k <= i ? C.oro : C.linea }} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
        <div style={{ fontSize:13, background:C.fondo, borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:C.suave }}>Fecha</div><b>{x.fecha ? fecha(x.fecha) : 'Por confirmar'}{x.hora ? ` · ${x.hora}` : ''}</b></div>
        <div style={{ fontSize:13, background:C.fondo, borderRadius:10, padding:'10px 12px' }}><div style={{ fontSize:11, color:C.suave }}>Vehículo</div><b>{[x.vehiculo, x.placa].filter(Boolean).join(' · ') || 'Por asignar'}</b>{x.conductor ? <div style={{ fontSize:12, color:C.suave }}>Conductor: {x.conductor}</div> : null}</div>
      </div>
    </Caja>
  )
}