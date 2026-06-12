import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function getOrdenNum(num) {
  return '#' + String(num).padStart(3, '0')
}

function cop(n) {
  if (!n) return '$0'
  return '$' + Math.round(n).toLocaleString('es-CO')
}

export default function ZabuComandero() {
  const [ordenes, setOrdenes] = useState([])
  const [hora, setHora]       = useState('')
  const [cargando, setCargando] = useState(true)

  // Hora en vivo
  useEffect(() => {
    const update = () => setHora(new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }))
    update()
    const t = setInterval(update, 10000)
    return () => clearInterval(t)
  }, [])

  // Cargar órdenes del día + escuchar nuevas en tiempo real
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]

    // Cargar órdenes pendientes del día
    const cargarOrdenes = async () => {
      const { data } = await supabase
        .from('ventas')
        .select('*')
        .eq('fecha', hoy)
        .order('num', { ascending: true })
      if (data) {
        setOrdenes(data.map(v => ({ ...v, estado: v.estado || 'pendiente' })))
      }
      setCargando(false)
    }
    cargarOrdenes()

    // Realtime — escuchar nuevas ventas
    const canal = supabase
      .channel('comandero-ventas')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'ventas',
      }, (payload) => {
        const nueva = { ...payload.new, estado: 'pendiente' }
        setOrdenes(prev => {
          // Evitar duplicados
          if (prev.find(o => o.id === nueva.id)) return prev
          return [...prev, nueva].sort((a,b) => a.num - b.num)
        })
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  const marcarListo = async (id) => {
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado:'listo' } : o))
    // Opcional: guardar estado en Supabase cuando agreguemos columna estado
  }

  const pendientes  = ordenes.filter(o => o.estado === 'pendiente')
  const completadas = ordenes.filter(o => o.estado === 'listo')

  const tipoColor = (tipo) => {
    if (tipo === 'aqui')      return '#4caf50'
    if (tipo === 'llevar')    return '#C9A84C'
    if (tipo === 'domicilio') return '#378ADD'
    return '#888'
  }

  const tipoLabel = (tipo) => {
    if (tipo === 'aqui')      return '🪑 Aquí'
    if (tipo === 'llevar')    return '🛍 Llevar'
    if (tipo === 'domicilio') return '🛵 Domicilio'
    return tipo
  }

  if (cargando) return (
    <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text4)' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>👨‍🍳</div>
      <div style={{ fontSize:13 }}>Conectando cocina...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'80vh' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:2, marginBottom:4 }}>MÓDULO COCINA — TIEMPO REAL</div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>
            {pendientes.length === 0
              ? '✅ Sin órdenes pendientes'
              : `${pendientes.length} orden${pendientes.length !== 1 ? 'es' : ''} en cocina`}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>{hora}</div>
          <div style={{ background:'#0d2b0d', border:'0.5px solid #1a4d1a', color:'#4caf50', fontSize:10, padding:'5px 14px', borderRadius:20, fontWeight:500 }}>
            ● En vivo
          </div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>
            {completadas.length} completadas hoy
          </div>
        </div>
      </div>

      {/* Órdenes pendientes */}
      {pendientes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text4)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>👨‍🍳</div>
          <div style={{ fontSize:16, fontWeight:600 }}>Cocina libre</div>
          <div style={{ fontSize:13, marginTop:6 }}>Las nuevas órdenes aparecerán aquí automáticamente</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14, marginBottom:32 }}>
          {pendientes.map(o => (
            <div key={o.id} style={{
              background:'var(--bg3)', borderRadius:16,
              border:'2px solid var(--gold-border)',
              padding:'20px', display:'flex', flexDirection:'column', gap:12,
            }}>
              {/* Cabecera */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{getOrdenNum(o.num)}</div>
                  {o.nombre_cliente && (
                    <div style={{ fontSize:14, color:'var(--text2)', fontWeight:600, marginTop:4 }}>{o.nombre_cliente}</div>
                  )}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{o.hora}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:tipoColor(o.tipo_entrega) }}>{tipoLabel(o.tipo_entrega)}</div>
                </div>
              </div>

              {/* Producto */}
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:4 }}>
                  {o.producto_id === 'zabu' ? '🌭' : '🧀'} {o.producto_nombre}
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text2)', marginBottom:4 }}>
                  🥩 {o.salchicha}
                </div>
                <div style={{ fontSize:13, color:'var(--text3)' }}>
                  {o.modalidad === 'solo' ? '🌭 Solo' : '🥤 Combo + bebida'}
                </div>
              </div>

              {/* Extras */}
              {o.extras && o.extras.length > 0 && (
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
                  <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:6 }}>EXTRAS</div>
                  {o.extras.map((e, i) => (
                    <div key={i} style={{ fontSize:14, color:'var(--gold)', fontWeight:600, marginBottom:3 }}>
                      + {e.nombre}
                    </div>
                  ))}
                </div>
              )}

              {/* Precio */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--text3)' }}>
                  {o.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📲 QR'}
                </span>
                <span style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(o.precio)}</span>
              </div>

              {/* Botón listo */}
              <button
                onClick={() => marcarListo(o.id)}
                style={{
                  marginTop:'auto', padding:'14px', borderRadius:10, cursor:'pointer',
                  background:'rgba(76,175,80,0.15)', border:'1px solid rgba(76,175,80,0.4)',
                  color:'#4caf50', fontSize:15, fontWeight:800, fontFamily:'inherit',
                  transition:'all .15s', letterSpacing:0.5,
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

      {/* Completadas */}
      {completadas.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:2, marginBottom:12 }}>
            COMPLETADAS HOY — {completadas.length}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {completadas.map(o => (
              <div key={o.id} style={{
                background:'rgba(76,175,80,0.06)', borderRadius:10,
                border:'1px solid rgba(76,175,80,0.15)',
                padding:'10px 16px', display:'flex', alignItems:'center', gap:10,
              }}>
                <div style={{ fontSize:14, fontWeight:800, color:'rgba(76,175,80,0.6)' }}>{getOrdenNum(o.num)}</div>
                <div style={{ fontSize:12, color:'var(--text4)' }}>{o.producto_nombre} · {o.salchicha}</div>
                <div style={{ fontSize:12, color:'rgba(76,175,80,0.6)', fontWeight:700 }}>✓</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}