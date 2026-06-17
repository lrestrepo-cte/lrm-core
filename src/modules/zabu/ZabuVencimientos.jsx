// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

function diasVence(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const venc = new Date(fecha)
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

function clasificar(dias) {
  if (dias === null) return null
  if (dias <= 0) return 'vencido'
  if (dias <= 2) return 'critico'
  if (dias <= 5) return 'atencion'
  return 'orden'
}

const CLASE_INFO = {
  vencido:  { label:'Vencidos',  desc:'requieren retiro inmediato', color:'var(--red)',   bg:'rgba(224,82,82,0.08)' },
  critico:  { label:'Críticos',  desc:'vencen en 1-2 días',         color:'var(--red)',   bg:'rgba(224,82,82,0.04)' },
  atencion: { label:'Atención',  desc:'vencen en 3-5 días',         color:'var(--gold)',  bg:'rgba(201,168,76,0.05)' },
  orden:    { label:'En orden',  desc:'más de 5 días',              color:'var(--green)', bg:'rgba(76,175,80,0.04)' },
}

export default function ZabuVencimientos() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('alertas') // 'alertas' | 'todos'

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('zabu_lotes')
      .select('*')
      .eq('estado', 'activo')
      .not('fecha_vencimiento', 'is', null)
      .order('fecha_vencimiento', { ascending: true })
    if (!error && data) setLotes(data)
    setLoading(false)
  }

  const retirarLote = async (id) => {
    await supabase.from('zabu_lotes').update({ estado: 'descartado' }).eq('id', id)
    cargar()
  }

  const lotesConClase = lotes.map(l => ({ ...l, dias: diasVence(l.fecha_vencimiento), clase: clasificar(diasVence(l.fecha_vencimiento)) }))

  const vencidos  = lotesConClase.filter(l => l.clase === 'vencido')
  const criticos   = lotesConClase.filter(l => l.clase === 'critico')
  const atencion   = lotesConClase.filter(l => l.clase === 'atencion')
  const enOrden    = lotesConClase.filter(l => l.clase === 'orden')

  const mostrar = vista === 'alertas' ? [...vencidos, ...criticos, ...atencion] : lotesConClase

  return (
    <>
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Vencidos',  val: loading?'...':String(vencidos.length), color:'var(--red)',   sub:'requieren retiro inmediato' },
          { label:'Críticos',  val: loading?'...':String(criticos.length), color:'var(--red)',   sub:'vencen en 1-2 días' },
          { label:'Atención',  val: loading?'...':String(atencion.length), color:'var(--gold)',  sub:'vencen en 3-5 días' },
          { label:'En orden',  val: loading?'...':String(enOrden.length),  color:'var(--green)', sub:'más de 5 días' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div onClick={()=>setVista('alertas')} style={{ padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
          background: vista==='alertas'?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${vista==='alertas'?'var(--gold-border)':'var(--border)'}`,
          color: vista==='alertas'?'var(--gold)':'var(--text3)' }}>Alertas</div>
        <div onClick={()=>setVista('todos')} style={{ padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
          background: vista==='todos'?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${vista==='todos'?'var(--gold-border)':'var(--border)'}`,
          color: vista==='todos'?'var(--gold)':'var(--text3)' }}>Todos</div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      : mostrar.length === 0 ? (
        <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:13, color:'var(--text4)' }}>
            {vista==='alertas' ? '✅ Sin alertas de vencimiento — todo en orden' : 'Sin lotes con fecha de vencimiento registrados'}
          </div>
        </div>
      ) : (
        ['vencido','critico','atencion','orden'].map(clase => {
          const items = mostrar.filter(l => l.clase === clase)
          if (items.length === 0) return null
          const info = CLASE_INFO[clase]
          return (
            <div key={clase} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:info.color, fontWeight:700, letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>
                {info.label} — {info.desc}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {items.map(l => (
                  <div key={l.id} className="panel" style={{ background:info.bg, border:`1px solid ${info.color}22`, padding:'12px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{l.producto_nombre}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                          Lote: {l.numero_lote || l.id.slice(0,8)} · {l.cantidad_actual} {l.unidad} · {l.ubicacion}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:info.color }}>
                          {l.dias <= 0 ? `Vencido hace ${Math.abs(l.dias)}d` : `Vence en ${l.dias}d`}
                        </div>
                        <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{l.fecha_vencimiento}</div>
                      </div>
                    </div>
                    {(clase === 'vencido' || clase === 'critico') && (
                      <div onClick={()=>retirarLote(l.id)} style={{ marginTop:8, fontSize:11, color:'var(--red)', cursor:'pointer', display:'inline-block' }}>
                        🗑 Marcar como retirado/descartado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
