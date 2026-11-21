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
const C = { fondo:'#F6F3EC', papel:'#FFFFFF', tinta:'#16140F', suave:'#6B655A', linea:'#E7E1D3', oro:'#B8922F', oroClaro:'#F3EAD2', verde:'#2E8B57' }

const fecha = (iso, conHora) => {
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
              {activas.length ? `Tienes ${activas.length} ${activas.length === 1 ? 'carga en camino' : 'cargas en camino'}.` : 'No tienes cargas en camino en este momento.'}
            </p>

            {activas.map(c => <Carga key={c.guia + c.fecha_recibo} c={c} />)}

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

function Caja({ children, pad = '18px' }) {
  return <div style={{ background:C.papel, border:`1px solid ${C.linea}`, borderRadius:16, padding:pad, marginBottom:12, boxShadow:'0 1px 2px rgba(22,20,15,0.04)' }}>{children}</div>
}

function Carga({ c }) {
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