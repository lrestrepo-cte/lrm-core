import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const NEGOCIOS_INFO = [
  { id:'zabu',        nombre:'ZABÚ',            tipo:'Hot dogs premium · C01/C02',   estado:'activo', color:'#C9A84C' },
  { id:'rv',          nombre:'RV Sports',       tipo:'Calcetines deportivos',         estado:'activo', color:'#378ADD' },
  { id:'inversiones', nombre:'LRM Trade Consulting', tipo:'Gota a gota · Empeños · Libranzas', estado:'activo', color:'#9C27B0' },
  { id:'bombas',      nombre:'Las Bombas',      tipo:'Guineo verde · toppings',       estado:'dev',    color:'#4caf50' },
  { id:'coco',        nombre:'Coco Shake',      tipo:'Shakes de coco premium',        estado:'pronto', color:'#555'    },
  { id:'quesolote',   nombre:'Quesolote',       tipo:'Elotes · maíz premium',         estado:'pronto', color:'#555'    },
  { id:'puffys',      nombre:'Puffys',          tipo:'Mini panquecas premium',        estado:'pronto', color:'#444'    },
]

const PROGRESO = {
  zabu: 75, rv: 45, inversiones: 60, bombas: 35, coco: 10, quesolote: 10, puffys: 5,
}

export default function LRMDashboard({ onEntrarNegocio }) {
  const [ventasZabu, setVentasZabu] = useState(0)
  const [ventasRV,   setVentasRV]   = useState(0)
  const [ordenesZabu,setOrdenesZabu]= useState(0)
  const [ordenesRV,  setOrdenesRV]  = useState(0)
  const [capitalInvActivo, setCapitalInvActivo] = useState(0)
  const [prestamosMora,    setPrestamosMora]    = useState(0)
  const [actividad,  setActividad]  = useState([])
  const [loading,    setLoading]    = useState(true)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data:oz }, { data:rv }, { data:prestamos }] = await Promise.all([
      supabase.from('ordenes').select('total, created_at, carrito_id, nombre_cliente').eq('fecha', hoy).order('created_at', { ascending:false }),
      supabase.from('rv_ordenes').select('total, created_at, nombre_cliente, canal').eq('fecha', hoy).order('created_at', { ascending:false }),
      supabase.from('inv_prestamos').select('saldo_capital, estado, cliente_nombre, created_at'),
    ])

    if (oz) {
      setVentasZabu(oz.reduce((s,o)=>s+(o.total||0),0))
      setOrdenesZabu(oz.length)
      const actZ = oz.slice(0,3).map(o => ({
        neg: `ZABÚ ${o.carrito_id||''}`,
        msg: o.nombre_cliente ? `Orden · ${o.nombre_cliente}` : 'Nueva orden registrada',
        time: new Date(o.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
        color: '#C9A84C',
      }))
      setActividad(prev => [...actZ, ...prev].slice(0,8))
    }

    if (rv) {
      setVentasRV(rv.reduce((s,o)=>s+(o.total||0),0))
      setOrdenesRV(rv.length)
      const actRV = rv.slice(0,2).map(o => ({
        neg: 'RV Sports',
        msg: o.nombre_cliente ? `Pedido · ${o.nombre_cliente}` : 'Nueva venta registrada',
        time: new Date(o.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
        color: '#378ADD',
      }))
      setActividad(prev => [...actRV, ...prev].slice(0,8))
    }

    if (prestamos) {
      const activos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'mora')
      setCapitalInvActivo(activos.reduce((s,p)=>s+(p.saldo_capital||0),0))
      setPrestamosMora(prestamos.filter(p => p.estado === 'mora').length)

      const recientes = [...prestamos].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,2)
      const actInv = recientes.map(p => ({
        neg: 'LRM Trade Consulting',
        msg: `Préstamo · ${p.cliente_nombre}`,
        time: new Date(p.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
        color: '#9C27B0',
      }))
      setActividad(prev => [...actInv, ...prev].slice(0,8))
    }

    setLoading(false)
  }

  const totalHoy     = ventasZabu + ventasRV
  const totalOrdenes = ordenesZabu + ordenesRV

  const statNegocio = (id) => {
    if (id === 'zabu') return ventasZabu > 0 ? cop(ventasZabu) + ' hoy' : 'Sin ventas hoy'
    if (id === 'rv')   return ventasRV > 0   ? cop(ventasRV)   + ' hoy' : 'Sin ventas hoy'
    if (id === 'inversiones') {
      if (capitalInvActivo === 0) return 'Sin capital activo'
      return prestamosMora > 0 ? `${cop(capitalInvActivo)} activo · ${prestamosMora} en mora` : `${cop(capitalInvActivo)} activo`
    }
    if (NEGOCIOS_INFO.find(n=>n.id===id)?.estado === 'dev') return 'En desarrollo'
    return 'Próximamente'
  }

  const esClickeable = (id) => id === 'zabu' || id === 'rv' || id === 'inversiones'
  const negociosActivos = NEGOCIOS_INFO.filter(n => n.estado === 'activo').length

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',        val: loading ? '...' : cop(totalHoy),        color:'var(--gold)',  sub:`${totalOrdenes} órdenes totales` },
          { label:'ZABÚ',              val: loading ? '...' : cop(ventasZabu),      color:'#C9A84C',     sub:`${ordenesZabu} órdenes` },
          { label:'RV Sports',         val: loading ? '...' : cop(ventasRV),        color:'#378ADD',     sub:`${ordenesRV} órdenes` },
          { label:'Negocios activos',  val:`${negociosActivos} / ${NEGOCIOS_INFO.length}`, color:'var(--green)', sub:'ZABÚ + RV Sports + Inversiones' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tarjetas negocios */}
      <div className="grid-3" style={{ marginBottom:16 }}>
        {NEGOCIOS_INFO.map(n => (
          <div key={n.id}
            onClick={() => esClickeable(n.id) && onEntrarNegocio(n.id)}
            style={{
              background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)',
              padding:16, cursor: esClickeable(n.id) ? 'pointer' : 'default', transition:'all .2s',
            }}
            onMouseOver={e => { if(esClickeable(n.id)) e.currentTarget.style.borderColor=n.color+'44' }}
            onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background: n.estado==='activo'?`${n.color}20`:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:n.color }} />
              </div>
              <span className={`badge badge-${n.estado}`}>
                {n.estado==='activo' ? 'Activo' : n.estado==='dev' ? 'En desarrollo' : 'Próximamente'}
              </span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{n.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{n.tipo}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:10, color: n.estado==='activo'?n.color:'var(--text4)' }}>
              {statNegocio(n.id)}
            </div>
            <div className="prog-wrap" style={{ height:3, marginTop:10 }}>
              <div className="prog-fill" style={{ width:`${PROGRESO[n.id]}%`, background:n.color, height:3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Progreso de negocios</div>
          {NEGOCIOS_INFO.map(n => (
            <div key={n.id} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:6 }}>
                <span>{n.nombre}</span>
                <span style={{ color:n.color, fontWeight:600 }}>{PROGRESO[n.id]}%</span>
              </div>
              <div className="prog-wrap" style={{ height:5 }}>
                <div className="prog-fill" style={{ width:`${PROGRESO[n.id]}%`, background:n.color, height:5 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Actividad reciente</div>
            <button onClick={cargar} style={{ padding:'4px 10px', borderRadius:7, cursor:'pointer', fontSize:11, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>🔄</button>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:13 }}>Cargando...</div>
          ) : actividad.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Sin actividad hoy</div>
          ) : actividad.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, paddingBottom:10, marginBottom:10, borderBottom: i < actividad.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:a.color, marginTop:4, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:600 }}>{a.neg}</span>
                <span style={{ fontSize:12, color:'var(--text3)' }}> — {a.msg}</span>
              </div>
              <span style={{ fontSize:10, color:'var(--text4)', flexShrink:0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
