import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

export default function RVDashboard() {
  const [ordenes,  setOrdenes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('rv_ordenes').select('*').eq('fecha', hoy).order('created_at', { ascending:false })
    if (data) setOrdenes(data)
    setLoading(false)
  }

  const totalVentas   = ordenes.reduce((s,o)=>s+(o.total||0), 0)
  const totalPOS      = ordenes.filter(o=>o.canal==='pos').reduce((s,o)=>s+(o.total||0),0)
  const totalWsp      = ordenes.filter(o=>o.canal==='whatsapp').reduce((s,o)=>s+(o.total||0),0)
  const totalIG       = ordenes.filter(o=>o.canal==='instagram').reduce((s,o)=>s+(o.total||0),0)
  const metaDiaria    = 10
  const pctMeta       = Math.min(100, Math.round((ordenes.length/metaDiaria)*100))

  const porCanal = [
    { label:'🏪 POS',       val:totalPOS,  count: ordenes.filter(o=>o.canal==='pos').length,       color:'var(--gold)'  },
    { label:'📱 WhatsApp',  val:totalWsp,  count: ordenes.filter(o=>o.canal==='whatsapp').length,   color:'#25D366'      },
    { label:'📸 Instagram', val:totalIG,   count: ordenes.filter(o=>o.canal==='instagram').length,  color:'#E1306C'      },
    { label:'🛒 Otro',      val:ordenes.filter(o=>!['pos','whatsapp','instagram'].includes(o.canal)).reduce((s,o)=>s+(o.total||0),0),
      count: ordenes.filter(o=>!['pos','whatsapp','instagram'].includes(o.canal)).length, color:'var(--blue)' },
  ]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>RV Sports — Dashboard</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',     val:cop(totalVentas),          color:'var(--gold)',  sub:`${ordenes.length} órdenes`        },
          { label:'Meta del día',   val:`${ordenes.length}/${metaDiaria}`, color:pctMeta>=100?'var(--green)':'var(--text)', sub:`${pctMeta}% completado` },
          { label:'Ticket promedio',val:ordenes.length>0?cop(totalVentas/ordenes.length):cop(0), color:'var(--text)', sub:'por orden' },
          { label:'Precio unitario',val:cop(27000),                color:'var(--text3)', sub:'calcetín estándar'               },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="panel" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Progreso meta diaria — {metaDiaria} pares</div>
          <button onClick={cargar} style={{ padding:'4px 10px', borderRadius:7, cursor:'pointer', fontSize:11, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>🔄</button>
        </div>
        <div className="prog-wrap" style={{ height:8 }}>
          <div className="prog-fill" style={{ width:`${pctMeta}%`, height:8, background:pctMeta>=100?'var(--green)':pctMeta>=60?'var(--gold)':'var(--red)', transition:'width .5s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{ordenes.length} vendidos</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{Math.max(0,metaDiaria-ordenes.length)} restantes</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap:16 }}>
        {/* Por canal */}
        <div className="panel">
          <div className="panel-title">Ventas por canal</div>
          {porCanal.map(c => (
            <div key={c.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.label}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{c.count} órdenes</div>
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:c.color }}>{cop(c.val)}</div>
            </div>
          ))}
        </div>

        {/* Últimas órdenes */}
        <div className="panel">
          <div className="panel-title">Últimas órdenes</div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:13 }}>Cargando...</div>
          ) : ordenes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text4)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⚽</div>
              <div style={{ fontSize:13 }}>Sin órdenes hoy</div>
            </div>
          ) : ordenes.slice(0,6).map((o,i) => (
            <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--gold)' }}>{o.consecutivo || `#${String(i+1).padStart(3,'0')}`}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  {o.canal==='pos'?'🏪':o.canal==='whatsapp'?'📱':o.canal==='instagram'?'📸':'🛒'} {o.nombre_cliente || 'Cliente'}
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{cop(o.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
