import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) {
  if (!n) return '$0'
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function getOrdenNum(num) {
  return '#' + String(num).padStart(3, '0')
}

function tipoLabel(t) {
  if (t === 'aqui')      return '🪑 Aquí'
  if (t === 'llevar')    return '🛍 Llevar'
  if (t === 'domicilio') return '🛵 Domicilio'
  return t
}

function metodoLabel(m) {
  if (m === 'efectivo') return '💵'
  if (m === 'qr')       return '📲'
  if (m === 'tarjeta')  return '💳'
  return m
}

export default function ZabuVentasDia() {
  const [ordenes,   setOrdenes]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState('todas')
  const [ultimaAct, setUltimaAct] = useState(null)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    cargarOrdenes()

    // Realtime — nuevas órdenes aparecen automáticamente
    const channel = supabase
      .channel('ventas-dia-ceo')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordenes',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrdenes(prev => [payload.new, ...prev])
          setUltimaAct(new Date())
        }
        if (payload.eventType === 'UPDATE') {
          setOrdenes(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
          setUltimaAct(new Date())
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const cargarOrdenes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ordenes')
      .select('*')
      .eq('fecha', hoy)
      .order('created_at', { ascending: false })
    if (data) setOrdenes(data)
    setLoading(false)
    setUltimaAct(new Date())
  }

  // ── CÁLCULOS ──
  const totalVentas    = ordenes.reduce((s, o) => s + (o.total || 0), 0)
  const totalEfectivo  = ordenes.reduce((s, o) => s + ((o.pagos||[]).filter(p=>p.metodo==='efectivo').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
  const totalQR        = ordenes.reduce((s, o) => s + ((o.pagos||[]).filter(p=>p.metodo==='qr').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
  const totalTarjeta   = ordenes.reduce((s, o) => s + ((o.pagos||[]).filter(p=>p.metodo==='tarjeta').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
  const ticketPromedio = ordenes.length > 0 ? totalVentas / ordenes.length : 0
  const metaDiaria     = 36
  const pctMeta        = Math.min(100, Math.round((ordenes.length / metaDiaria) * 100))

  const ordenesFiltradas = filtro === 'todas'
    ? ordenes
    : ordenes.filter(o => (o.pagos||[]).some(p => p.metodo === filtro))

  // Agrupar por carrito
  const porCarrito = ordenes.reduce((acc, o) => {
    const c = o.carrito_id || 'Sin carrito'
    if (!acc[c]) acc[c] = { count: 0, total: 0 }
    acc[c].count++
    acc[c].total += o.total || 0
    return acc
  }, {})

  return (
    <div>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Ventas hoy',      val: cop(totalVentas),          color: 'var(--gold)',  sub: `${ordenes.length} órdenes` },
          { label: 'Ticket promedio', val: cop(ticketPromedio),        color: 'var(--text)',  sub: 'por orden' },
          { label: 'Meta del día',    val: `${ordenes.length}/${metaDiaria}`, color: pctMeta >= 100 ? 'var(--green)' : 'var(--text)', sub: `${pctMeta}% completado` },
          { label: '💵 Efectivo',     val: cop(totalEfectivo),         color: 'var(--green)', sub: `📲 ${cop(totalQR)} · 💳 ${cop(totalTarjeta)}` },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background: k.color }} />
          </div>
        ))}
      </div>

      {/* Barra de meta */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            Progreso meta diaria — {metaDiaria} perros
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {ultimaAct && (
              <div style={{ fontSize: 11, color: 'var(--text4)' }}>
                Actualizado {ultimaAct.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#0d2b0d', border: '0.5px solid #1a4d1a', color: '#4caf50', fontWeight: 500 }}>
              ● En vivo
            </div>
            <button onClick={cargarOrdenes} style={{ padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', color: 'var(--text3)', fontFamily: 'inherit' }}>
              🔄
            </button>
          </div>
        </div>
        <div className="prog-wrap" style={{ height: 8 }}>
          <div className="prog-fill" style={{
            width: `${pctMeta}%`, height: 8,
            background: pctMeta >= 100 ? 'var(--green)' : pctMeta >= 60 ? 'var(--gold)' : 'var(--red)',
            transition: 'width .5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{ordenes.length} vendidos</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{Math.max(0, metaDiaria - ordenes.length)} restantes</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>

        {/* Órdenes del día */}
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { id: 'todas',    label: 'Todas' },
              { id: 'efectivo', label: '💵 Efectivo' },
              { id: 'qr',       label: '📲 QR' },
              { id: 'tarjeta',  label: '💳 Tarjeta' },
            ].map(f => (
              <div key={f.id} onClick={() => setFiltro(f.id)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                background: filtro === f.id ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${filtro === f.id ? 'var(--gold-border)' : 'var(--border)'}`,
                color: filtro === f.id ? 'var(--gold)' : 'var(--text3)',
                fontWeight: filtro === f.id ? 700 : 400,
              }}>{f.label}</div>
            ))}
          </div>

          <div className="panel">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
                <div style={{ fontSize: 13 }}>Cargando órdenes...</div>
              </div>
            ) : ordenesFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text4)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🌭</div>
                <div style={{ fontSize: 13 }}>Sin órdenes aún hoy</div>
              </div>
            ) : (
              <>
                {/* Header tabla */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 90px', marginBottom: 6 }}>
                  {['#', 'Detalle', 'Método', 'Entrega', 'Total'].map(h => (
                    <div key={h} style={{ fontSize: 9, color: 'var(--text4)', padding: '0 6px 6px', letterSpacing: 0.5, fontWeight: 600 }}>{h}</div>
                  ))}
                </div>

                {ordenesFiltradas.map((o, i) => (
                  <div key={o.id} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 90px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ fontSize: 12, padding: '8px 6px', color: 'var(--gold)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {getOrdenNum(o.num)}
                    </div>
                    <div style={{ fontSize: 11, padding: '8px 6px', color: 'var(--text2)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {(o.items||[]).length} item(s)
                      {o.nombre_cliente ? ` · ${o.nombre_cliente}` : ''}
                      {o.hora ? <span style={{ color: 'var(--text4)', marginLeft: 6 }}>{o.hora}</span> : null}
                    </div>
                    <div style={{ fontSize: 13, padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text3)' }}>
                      {(o.pagos||[]).map(p => metodoLabel(p.metodo)).join('+')}
                    </div>
                    <div style={{ fontSize: 11, padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text3)' }}>
                      {tipoLabel(o.entrega)}
                    </div>
                    <div style={{ fontSize: 13, padding: '8px 6px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text)' }}>
                      {cop(o.total)}
                    </div>
                  </div>
                ))}

                {/* Total filtrado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 6px', borderTop: '2px solid var(--border)', marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>
                    {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--gold)' }}>
                    {cop(ordenesFiltradas.reduce((s, o) => s + (o.total || 0), 0))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Por carrito */}
          <div className="panel">
            <div className="panel-title">Por carrito</div>
            {Object.keys(porCarrito).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text4)', textAlign: 'center', padding: '16px 0' }}>Sin datos aún</div>
            ) : Object.entries(porCarrito).map(([carrito, data]) => (
              <div key={carrito} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{carrito}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{data.count} órdenes</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>{cop(data.total)}</div>
              </div>
            ))}
          </div>

          {/* Métodos de pago */}
          <div className="panel">
            <div className="panel-title">Métodos de pago</div>
            {[
              { label: '💵 Efectivo', val: totalEfectivo, color: 'var(--green)' },
              { label: '📲 QR / Nequi', val: totalQR,      color: 'var(--blue)'  },
              { label: '💳 Tarjeta',   val: totalTarjeta,  color: 'var(--text2)' },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text3)' }}>{m.label}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>{cop(m.val)}</span>
                </div>
                <div className="prog-wrap" style={{ height: 5 }}>
                  <div className="prog-fill" style={{
                    width: totalVentas > 0 ? `${Math.round((m.val / totalVentas) * 100)}%` : '0%',
                    height: 5, background: m.color,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Resumen financiero rápido */}
          <div className="panel">
            <div className="panel-title">Caja esperada al cierre</div>
            {[
              { label: 'Ventas totales',   val: cop(totalVentas),   color: 'var(--gold)'  },
              { label: 'Ticket promedio',  val: cop(ticketPromedio),color: 'var(--text2)' },
              { label: '💵 En caja',       val: cop(totalEfectivo), color: 'var(--green)' },
              { label: '📲 QR verificar',  val: cop(totalQR),       color: 'var(--blue)'  },
              { label: '💳 Datáfono',      val: cop(totalTarjeta),  color: 'var(--text2)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
