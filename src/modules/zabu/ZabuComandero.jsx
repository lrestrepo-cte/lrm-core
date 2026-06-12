import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function getOrdenNum(num) {
  return '#' + String(num).padStart(3, '0')
}

function tipoColor(tipo) {
  if (tipo === 'aqui')      return '#4caf50'
  if (tipo === 'llevar')    return '#C9A84C'
  if (tipo === 'domicilio') return '#378ADD'
  return '#888'
}

function tipoLabel(tipo) {
  if (tipo === 'aqui')      return '🪑 Aquí'
  if (tipo === 'llevar')    return '🛍 Llevar'
  if (tipo === 'domicilio') return '🛵 Domicilio'
  return tipo
}

export default function ZabuComandero() {
  const [ordenes, setOrdenes] = useState([])
  const [hora,    setHora]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const update = () => setHora(new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }))
    update()
    const t = setInterval(update, 10000)

    cargarOrdenes()

    const channel = supabase
      .channel('ordenes-cocina')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordenes',
      }, (payload) => {
        console.log('Realtime evento:', payload)
        if (payload.eventType === 'INSERT') {
          setOrdenes(prev => [payload.new, ...prev])
        }
        if (payload.eventType === 'UPDATE') {
          setOrdenes(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
        }
      })
      .subscribe((status) => {
        console.log('Canal status:', status)
      })

    return () => {
      clearInterval(t)
      supabase.removeChannel(channel)
    }
  }, [])

  const cargarOrdenes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    console.log('Ordenes cargadas:', data, 'Error:', error)
    if (data) setOrdenes(data)
    setLoading(false)
  }

  const marcarListo = async (id) => {
    await supabase.from('ordenes').update({ estado:'listo' }).eq('id', id)
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado:'listo' } : o))
  }

  const pendientes  = ordenes.filter(o => o.estado === 'pendiente')
  const completadas = ordenes.filter(o => o.estado === 'listo')

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>
      <div style={{ fontSize:24, marginBottom:12 }}>⏳</div>
      <div>Conectando cocina...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'80vh' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:2, marginBottom:4 }}>MÓDULO COCINA · SUPABASE REALTIME</div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>
            {pendientes.length === 0 ? '✅ Sin órdenes pendientes' : `${pendientes.length} orden${pendientes.length !== 1 ? 'es' : ''} en cocina`}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>{hora}</div>
          <div style={{ background:'#0d2b0d', border:'0.5px solid #1a4d1a', color:'#4caf50', fontSize:10, padding:'5px 14px', borderRadius:20, fontWeight:500 }}>
            ● En vivo
          </div>
        </div>
      </div>

      {pendientes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>👨‍🍳</div>
          <div style={{ fontSize:16, fontWeight:600 }}>Cocina libre</div>
          <div style={{ fontSize:13, marginTop:6 }}>Esperando nuevas órdenes en tiempo real...</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14, marginBottom:32 }}>
          {pendientes.map(o => (
            <div key={o.id} style={{ background:'var(--bg3)', borderRadius:16, border:'2px solid var(--gold-border)', padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{getOrdenNum(o.num)}</div>
                  {o.nombre_cliente && <div style={{ fontSize:14, color:'var(--text2)', fontWeight:600, marginTop:4 }}>{o.nombre_cliente}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{o.hora}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:tipoColor(o.entrega) }}>{tipoLabel(o.entrega)}</div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(o.items || []).map((item, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:3 }}>
                      {item.producto?.emoji} {item.producto?.nombre}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:2 }}>
                      🥩 {item.salchicha?.nombre}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>
                      {item.tipo === 'solo' ? '🌭 Solo' : '🥤 Combo'}
                      {item.bebida ? ` · ${item.bebida.nombre}` : ''}
                    </div>
                    {(item.extras||[]).length > 0 && (
                      <div style={{ marginTop:4 }}>
                        {item.extras.map((e,j) => (
                          <div key={j} style={{ fontSize:13, color:'var(--gold)', fontWeight:600 }}>+ {e.nombre}</div>
                        ))}
                      </div>
                    )}
                    {item.bebidaSuelta && (
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>🥤 {item.bebidaSuelta.nombre}</div>
                    )}
                  </div>
                ))}
              </div>

              {o.entrega === 'domicilio' && o.direccion && (
                <div style={{ fontSize:11, color:'var(--blue)', background:'rgba(55,138,221,0.1)', borderRadius:8, padding:'6px 10px' }}>
                  📍 {o.direccion}
                </div>
              )}

              <button onClick={() => marcarListo(o.id)} style={{
                marginTop:'auto', padding:'14px', borderRadius:10, cursor:'pointer',
                background:'rgba(76,175,80,0.15)', border:'1px solid rgba(76,175,80,0.4)',
                color:'#4caf50', fontSize:15, fontWeight:800, fontFamily:'inherit', transition:'all .15s',
              }}
                onMouseOver={e => e.currentTarget.style.background='rgba(76,175,80,0.25)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(76,175,80,0.15)'}
              >
                ✓ LISTO
              </button>
            </div>
          ))}
        </div>
      )}

      {completadas.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:2, marginBottom:12 }}>
            COMPLETADAS HOY — {completadas.length}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {completadas.map(o => (
              <div key={o.id} style={{ background:'rgba(76,175,80,0.06)', borderRadius:10, border:'1px solid rgba(76,175,80,0.15)', padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'rgba(76,175,80,0.6)' }}>{getOrdenNum(o.num)}</div>
                <div style={{ fontSize:12, color:'var(--text4)' }}>
                  {(o.items||[]).length} item{(o.items||[]).length>1?'s':''} · {tipoLabel(o.entrega)}
                </div>
                <div style={{ fontSize:12, color:'rgba(76,175,80,0.6)', fontWeight:700 }}>✓</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}