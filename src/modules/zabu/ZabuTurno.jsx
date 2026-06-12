import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) {
  return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO')
}

const INVENTARIO_ITEMS = [
  { id:'salchicha_pavo',    nombre:'Salchicha Pavo',    unidad:'uds' },
  { id:'salchicha_hotdog',  nombre:'Salchicha Hot Dog', unidad:'uds' },
  { id:'salchicha_alemana', nombre:'Salchicha Alemana', unidad:'uds' },
  { id:'salchicha_paris',   nombre:'Salchicha Parisienne', unidad:'uds' },
  { id:'zabun',             nombre:'ZaBun™',            unidad:'uds' },
  { id:'cream_code',        nombre:'Cream Code™',       unidad:'%'   },
  { id:'tocineta',          nombre:'Tocineta',          unidad:'g'   },
  { id:'pina',              nombre:'Piña Caramelizada', unidad:'g'   },
  { id:'queso',             nombre:'Queso Cheddar',     unidad:'g'   },
  { id:'coca',              nombre:'Coca Cola',         unidad:'uds' },
  { id:'agua',              nombre:'Agua',              unidad:'uds' },
  { id:'otras_bebidas',     nombre:'Otras bebidas',     unidad:'uds' },
  { id:'empaque_directo',   nombre:'Empaque directo',   unidad:'uds' },
  { id:'empaque_domicilio', nombre:'Empaque domicilio', unidad:'uds' },
]

export default function ZabuTurno({ usuario, onTurnoActivo }) {
  const [turnoActivo, setTurnoActivo]   = useState(null)
  const [loading,     setLoading]       = useState(true)
  const [fase,        setFase]          = useState('check') // check | abrir | abierto | cerrar
  const [efectivoInicial, setEfectivoInicial] = useState('')
  const [efectivoFisico,  setEfectivoFisico]  = useState('')
  const [observaciones,   setObservaciones]   = useState('')
  const [inventario,      setInventario]      = useState({})
  const [ordenesTurno,    setOrdenesTurno]    = useState([])
  const [procesando,      setProcesando]      = useState(false)
  const [resumenCierre,   setResumenCierre]   = useState(null)

  const carrito = usuario?.carrito || 'C01'
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { verificarTurno() }, [])

  const verificarTurno = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('turnos')
      .select('*')
      .eq('carrito_id', carrito)
      .eq('fecha', hoy)
      .eq('estado', 'abierto')
      .maybeSingle()

    if (data) {
      setTurnoActivo(data)
      setFase('abierto')
      await cargarOrdenesTurno(data.id)
      onTurnoActivo && onTurnoActivo(data)
    } else {
      setFase('abrir')
    }
    setLoading(false)
  }

  const cargarOrdenesTurno = async (turnoId) => {
    const { data } = await supabase
      .from('ordenes')
      .select('*')
      .eq('carrito_id', carrito)
      .eq('fecha', hoy)
      .order('created_at')
    if (data) setOrdenesTurno(data)
  }

  const abrirTurno = async () => {
    if (!efectivoInicial) return
    setProcesando(true)
    const { data: turno } = await supabase.from('turnos').insert({
      carrito_id: carrito,
      operador_nombre: usuario?.nombre || 'Operador',
      operador_id: usuario?.id,
      fecha: hoy,
      efectivo_inicial: parseInt(efectivoInicial),
      estado: 'abierto',
    }).select().single()

    if (turno) {
      // Asiento contable apertura
      const { data: asiento } = await supabase.from('asientos').insert({
        fecha: hoy,
        descripcion: `Apertura de turno — ${carrito} — ${usuario?.nombre}`,
        carrito_id: carrito,
      }).select().single()

      if (asiento && parseInt(efectivoInicial) > 0) {
        await supabase.from('partidas').insert([
          { asiento_id: asiento.id, codigo:'1105', nombre:'Caja general', debe: parseInt(efectivoInicial), haber:0 },
          { asiento_id: asiento.id, codigo:'3105', nombre:'Capital invertido', debe:0, haber: parseInt(efectivoInicial) },
        ])
      }

      setTurnoActivo(turno)
      setFase('abierto')
      onTurnoActivo && onTurnoActivo(turno)
    }
    setProcesando(false)
  }

  const calcularResumen = () => {
    const totalVentas   = ordenesTurno.reduce((s,o) => s+o.total, 0)
    const totalEfectivo = ordenesTurno.reduce((s,o) => s+((o.pagos||[]).filter(p=>p.metodo==='efectivo').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
    const totalQR       = ordenesTurno.reduce((s,o) => s+((o.pagos||[]).filter(p=>p.metodo==='qr').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
    const totalTarjeta  = ordenesTurno.reduce((s,o) => s+((o.pagos||[]).filter(p=>p.metodo==='tarjeta').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)), 0)
    const efectivoEsperado = (turnoActivo?.efectivo_inicial||0) + totalEfectivo
    return { totalVentas, totalEfectivo, totalQR, totalTarjeta, efectivoEsperado }
  }

  const cerrarTurno = async () => {
    if (!efectivoFisico) return
    setProcesando(true)

    const { totalVentas, totalEfectivo, totalQR, totalTarjeta, efectivoEsperado } = calcularResumen()
    const fisico = parseInt(efectivoFisico)
    const diferencia = fisico - efectivoEsperado

    // Actualizar turno
    await supabase.from('turnos').update({
      hora_cierre: new Date().toISOString(),
      efectivo_sistema: efectivoEsperado,
      efectivo_fisico: fisico,
      diferencia_efectivo: diferencia,
      total_qr: totalQR,
      total_tarjeta: totalTarjeta,
      total_ventas: totalVentas,
      ordenes_count: ordenesTurno.length,
      estado: 'cerrado',
      observaciones,
      inventario_cierre: inventario,
    }).eq('id', turnoActivo.id)

    // Asiento contable cierre
    const { data: asiento } = await supabase.from('asientos').insert({
      fecha: hoy,
      descripcion: `Cierre de turno — ${carrito} — ${usuario?.nombre} — ${ordenesTurno.length} órdenes`,
      carrito_id: carrito,
    }).select().single()

    if (asiento) {
      const partidas = []
      if (totalEfectivo > 0) partidas.push({ asiento_id:asiento.id, codigo:'1105', nombre:'Caja general', debe:totalEfectivo, haber:0 })
      if (totalQR > 0)       partidas.push({ asiento_id:asiento.id, codigo:'1112', nombre:'Nequi', debe:totalQR, haber:0 })
      if (totalTarjeta > 0)  partidas.push({ asiento_id:asiento.id, codigo:'1110', nombre:'Bancos cuenta corriente', debe:totalTarjeta, haber:0 })
      if (totalVentas > 0)   partidas.push({ asiento_id:asiento.id, codigo:'4106', nombre:'Ventas ZABÚ', debe:0, haber:totalVentas })
      if (partidas.length > 0) await supabase.from('partidas').insert(partidas)
    }

    setResumenCierre({ totalVentas, totalEfectivo, totalQR, totalTarjeta, efectivoEsperado, fisico, diferencia, ordenes: ordenesTurno.length })
    setFase('cerrado')
    setProcesando(false)
  }

  const inputStyle = {
    width:'100%', padding:'12px 14px', borderRadius:10,
    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
    color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', marginTop:8,
    textAlign:'center', fontWeight:700,
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'var(--text3)' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
        <div>Verificando turno...</div>
      </div>
    </div>
  )

  // ── ABRIR TURNO ──────────────────────────────────────────────────────────

  if (fase === 'abrir') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🕐</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Abrir turno</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{carrito} · {usuario?.nombre} · {hoy}</div>
        </div>

        <div className="panel">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Base de caja inicial</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>¿Cuánto efectivo tienes en caja para empezar el turno?</div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {[0,10000,20000,50000,100000].map(v => (
              <div key={v} onClick={() => setEfectivoInicial(String(v))} style={{
                padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                background: parseInt(efectivoInicial)===v ? 'var(--gold-dim)' : 'rgba(255,255,255,0.05)',
                border:`0.5px solid ${parseInt(efectivoInicial)===v ? 'var(--gold-border)' : 'var(--border)'}`,
                color: parseInt(efectivoInicial)===v ? 'var(--gold)' : 'var(--text3)',
              }}>{v===0?'Sin base':'$'+v.toLocaleString('es-CO')}</div>
            ))}
          </div>

          <input type="number" value={efectivoInicial} onChange={e=>setEfectivoInicial(e.target.value)}
            placeholder="O escribe el monto..." style={inputStyle} />

          {efectivoInicial && (
            <div style={{ marginTop:10, padding:'10px 14px', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', borderRadius:8, textAlign:'center' }}>
              <span style={{ fontSize:14, color:'var(--gold)', fontWeight:700 }}>Base: ${parseInt(efectivoInicial||0).toLocaleString('es-CO')}</span>
            </div>
          )}

          <button onClick={abrirTurno} disabled={!efectivoInicial||procesando} style={{
            width:'100%', marginTop:16, padding:'14px', borderRadius:12, cursor:'pointer',
            background:'rgba(76,175,80,0.15)', border:'1px solid rgba(76,175,80,0.4)',
            color:'#4caf50', fontSize:15, fontWeight:800, fontFamily:'inherit',
            opacity: !efectivoInicial ? 0.5 : 1,
          }}>
            {procesando ? 'Abriendo...' : '✓ Abrir turno'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── TURNO ABIERTO ─────────────────────────────────────────────────────────

  if (fase === 'abierto') {
    const { totalVentas, totalEfectivo, totalQR, totalTarjeta, efectivoEsperado } = calcularResumen()
    return (
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:11, color:'var(--green)', letterSpacing:2, fontWeight:600, marginBottom:6 }}>● TURNO ACTIVO</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{carrito} · {usuario?.nombre}</div>
            <div style={{ fontSize:13, color:'var(--text3)' }}>Abierto: {new Date(turnoActivo?.hora_apertura).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>

          <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
            {[
              { label:'Ventas totales',  val:cop(totalVentas),   color:'var(--gold)'  },
              { label:'Órdenes',         val:String(ordenesTurno.length), color:'var(--text)'  },
              { label:'💵 Efectivo',     val:cop(totalEfectivo), color:'var(--green)' },
              { label:'📲 QR',           val:cop(totalQR),       color:'var(--blue)'  },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val" style={{ color:k.color, fontSize:20 }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>Resumen de caja</div>
            {[
              { label:'Base inicial',      val:cop(turnoActivo?.efectivo_inicial||0) },
              { label:'Ventas efectivo',   val:cop(totalEfectivo)                    },
              { label:'Efectivo esperado', val:cop(efectivoEsperado),                bold:true },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                <span style={{ fontSize:r.bold?15:13, fontWeight:r.bold?800:600, color:r.bold?'var(--gold)':'var(--text2)' }}>{r.val}</span>
              </div>
            ))}
          </div>

          <button onClick={() => { setFase('cerrar'); cargarOrdenesTurno(turnoActivo?.id) }} style={{
            width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
            background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)',
            color:'var(--red)', fontSize:15, fontWeight:800, fontFamily:'inherit',
          }}>
            🔒 Cerrar turno
          </button>
        </div>
      </div>
    )
  }

  // ── CERRAR TURNO ──────────────────────────────────────────────────────────

  if (fase === 'cerrar') {
    const { totalVentas, totalEfectivo, totalQR, totalTarjeta, efectivoEsperado } = calcularResumen()
    const fisico = parseInt(efectivoFisico||0)
    const diferencia = fisico - efectivoEsperado

    return (
      <div style={{ minHeight:'100vh', background:'#0a0a0a', padding:20, overflowY:'auto' }}>
        <div style={{ maxWidth:500, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Cierre de turno</div>
            <div style={{ fontSize:13, color:'var(--text3)' }}>{carrito} · {usuario?.nombre} · {hoy}</div>
          </div>

          {/* Resumen del sistema */}
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="panel-title">Resumen del sistema</div>
            {[
              { label:'Total ventas',    val:cop(totalVentas),   color:'var(--gold)'  },
              { label:'Órdenes',         val:String(ordenesTurno.length), color:'var(--text)' },
              { label:'💵 Efectivo',     val:cop(totalEfectivo), color:'var(--green)' },
              { label:'📲 QR',           val:cop(totalQR),       color:'var(--blue)'  },
              { label:'💳 Tarjeta',      val:cop(totalTarjeta),  color:'var(--text2)' },
              { label:'Base inicial',    val:cop(turnoActivo?.efectivo_inicial||0), color:'var(--text2)' },
              { label:'Efectivo esperado en caja', val:cop(efectivoEsperado), color:'var(--gold)', bold:true },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                <span style={{ fontSize:r.bold?15:13, fontWeight:r.bold?800:600, color:r.color||'var(--text2)' }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Arqueo */}
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="panel-title">Arqueo de caja</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>¿Cuánto efectivo físico tienes en caja ahora?</div>
            <input type="number" value={efectivoFisico} onChange={e=>setEfectivoFisico(e.target.value)}
              placeholder="Cuenta el efectivo físico..." style={inputStyle} />

            {efectivoFisico && (
              <div style={{ marginTop:12, padding:'14px', borderRadius:10,
                background: diferencia===0 ? 'var(--green-dim)' : diferencia>0 ? 'rgba(55,138,221,0.1)' : 'var(--red-dim)',
                border:`1px solid ${diferencia===0 ? 'var(--green-border)' : diferencia>0 ? 'rgba(55,138,221,0.3)' : 'rgba(224,82,82,0.3)'}`,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>Sistema espera</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text2)' }}>{cop(efectivoEsperado)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>Físico contado</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text2)' }}>{cop(fisico)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Diferencia</span>
                  <span style={{ fontSize:18, fontWeight:900, color: diferencia===0?'var(--green)':diferencia>0?'var(--blue)':'var(--red)' }}>
                    {diferencia>0?'+':''}{cop(diferencia)}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:6, textAlign:'center' }}>
                  {diferencia===0 ? '✅ Caja cuadrada' : diferencia>0 ? '🔵 Sobrante de caja' : '🔴 Faltante de caja'}
                </div>
              </div>
            )}
          </div>

          {/* Inventario físico */}
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="panel-title">Inventario al cierre</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>Declara cuánto queda físicamente en el carrito</div>
            {INVENTARIO_ITEMS.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, color:'var(--text2)' }}>{item.nombre}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="number" value={inventario[item.id]||''} onChange={e=>setInventario(prev=>({...prev,[item.id]:e.target.value}))}
                    placeholder="0" style={{ width:70, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', textAlign:'center' }} />
                  <span style={{ fontSize:11, color:'var(--text4)', minWidth:24 }}>{item.unidad}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Observaciones */}
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="panel-title">Observaciones (opcional)</div>
            <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)}
              placeholder="Novedades del turno, incidentes, etc."
              style={{ width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', height:80, marginTop:4 }} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setFase('abierto')} style={{ flex:1, padding:'12px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>
              ← Volver
            </button>
            <button onClick={cerrarTurno} disabled={!efectivoFisico||procesando} style={{
              flex:3, padding:'12px', borderRadius:10, cursor:'pointer',
              fontSize:14, fontWeight:800, fontFamily:'inherit',
              background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)',
              color:'var(--red)', opacity:!efectivoFisico?0.5:1,
            }}>
              {procesando ? 'Cerrando...' : '🔒 Confirmar cierre de turno'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── TURNO CERRADO ─────────────────────────────────────────────────────────

  if (fase === 'cerrado' && resumenCierre) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Turno cerrado</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>{carrito} · {hoy}</div>

        <div className="panel" style={{ textAlign:'left', marginBottom:16 }}>
          <div className="panel-title">Resumen final</div>
          {[
            { label:'Ventas totales',    val:cop(resumenCierre.totalVentas),   color:'var(--gold)'  },
            { label:'Órdenes',           val:String(resumenCierre.ordenes),    color:'var(--text)'  },
            { label:'Efectivo sistema',  val:cop(resumenCierre.efectivoEsperado), color:'var(--text2)' },
            { label:'Efectivo físico',   val:cop(resumenCierre.fisico),        color:'var(--text2)' },
            { label:'Diferencia',        val:(resumenCierre.diferencia>0?'+':'')+cop(resumenCierre.diferencia), color:resumenCierre.diferencia===0?'var(--green)':resumenCierre.diferencia>0?'var(--blue)':'var(--red)' },
            { label:'QR',                val:cop(resumenCierre.totalQR),       color:'var(--blue)'  },
            { label:'Tarjeta',           val:cop(resumenCierre.totalTarjeta),  color:'var(--text2)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:'12px 16px', background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--green)' }}>
          ✅ Asiento contable generado automáticamente
        </div>

        <div style={{ fontSize:13, color:'var(--text3)' }}>
          El turno está cerrado. Para abrir uno nuevo, cierra sesión e ingresa de nuevo.
        </div>
      </div>
    </div>
  )

  return null
}