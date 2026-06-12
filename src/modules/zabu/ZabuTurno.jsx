import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) {
  return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO')
}

const INVENTARIO_ITEMS = [
  { id:'salchicha_pavo',    nombre:'Salchicha Pavo',       unidad:'uds' },
  { id:'salchicha_hotdog',  nombre:'Salchicha Hot Dog',    unidad:'uds' },
  { id:'salchicha_alemana', nombre:'Salchicha Alemana',    unidad:'uds' },
  { id:'salchicha_paris',   nombre:'Salchicha Parisienne', unidad:'uds' },
  { id:'zabun',             nombre:'ZaBun™',               unidad:'uds' },
  { id:'cream_code',        nombre:'Cream Code™',          unidad:'%'   },
  { id:'tocineta',          nombre:'Tocineta',             unidad:'g'   },
  { id:'pina',              nombre:'Piña Caramelizada',    unidad:'g'   },
  { id:'queso',             nombre:'Queso Cheddar',        unidad:'g'   },
  { id:'bebidas',           nombre:'Bebidas totales',      unidad:'uds' },
  { id:'empaque',           nombre:'Empaque',              unidad:'uds' },
]

// ─── APERTURA DE TURNO ────────────────────────────────────────────────────────
export function AperturaTurno({ usuario, onTurnoAbierto }) {
  const [efectivoIni, setEfectivoIni] = useState('')
  const [procesando,  setProcesando]  = useState(false)
  const [cargando,    setCargando]    = useState(true)

  const carrito = usuario?.carrito || 'C01'
  const hoy     = new Date().toISOString().split('T')[0]

  useEffect(() => { verificarTurnoExistente() }, [])

  const verificarTurnoExistente = async () => {
    const { data } = await supabase
      .from('turnos').select('*')
      .eq('carrito_id', carrito).eq('fecha', hoy).eq('estado', 'abierto')
      .maybeSingle()
    if (data) onTurnoAbierto(data)
    else setCargando(false)
  }

  const abrirTurno = async () => {
    if (!efectivoIni) return
    setProcesando(true)
    const { data } = await supabase.from('turnos').insert({
      carrito_id: carrito,
      operador_nombre: usuario?.nombre || 'Operador',
      operador_id: usuario?.id,
      fecha: hoy,
      efectivo_inicial: parseInt(efectivoIni),
      estado: 'abierto',
    }).select().single()
    if (data) {
      // Asiento apertura
      const { data: asiento } = await supabase.from('asientos').insert({
        fecha: hoy,
        descripcion: `Apertura turno ${carrito} — ${usuario?.nombre} — Base: ${cop(parseInt(efectivoIni))}`,
        carrito_id: carrito,
      }).select().single()
      if (asiento && parseInt(efectivoIni) > 0) {
        await supabase.from('partidas').insert([
          { asiento_id:asiento.id, codigo:'1105', nombre:'Caja general', debe:parseInt(efectivoIni), haber:0 },
          { asiento_id:asiento.id, codigo:'3105', nombre:'Capital invertido', debe:0, haber:parseInt(efectivoIni) },
        ])
      }
      onTurnoAbierto(data)
    }
    setProcesando(false)
  }

  if (cargando) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'var(--text3)' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
        <div style={{ fontSize:14 }}>Verificando turno...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🕐</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Abrir turno</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{carrito} · {usuario?.nombre}</div>
          <div style={{ fontSize:12, color:'var(--text4)', marginTop:4 }}>{hoy}</div>
        </div>

        <div className="panel">
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Base de caja inicial</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>¿Cuánto efectivo tienes para empezar?</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {[0,10000,20000,50000,100000].map(v => (
              <div key={v} onClick={() => setEfectivoIni(String(v))} style={{
                padding:'7px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                background: parseInt(efectivoIni)===v ? 'var(--gold-dim)' : 'rgba(255,255,255,0.05)',
                border:`0.5px solid ${parseInt(efectivoIni)===v ? 'var(--gold-border)' : 'var(--border)'}`,
                color: parseInt(efectivoIni)===v ? 'var(--gold)' : 'var(--text3)',
              }}>{v===0?'$0':'$'+v.toLocaleString('es-CO')}</div>
            ))}
          </div>
          <input type="number" value={efectivoIni} onChange={e=>setEfectivoIni(e.target.value)}
            placeholder="O escribe el monto exacto..."
            style={{ width:'100%', padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'var(--text)', fontSize:16, fontFamily:'inherit', outline:'none', textAlign:'center', fontWeight:700, marginTop:4 }} />
          {efectivoIni && (
            <div style={{ marginTop:10, padding:'10px', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', borderRadius:8, textAlign:'center', fontSize:14, color:'var(--gold)', fontWeight:700 }}>
              Base: {cop(parseInt(efectivoIni))}
            </div>
          )}
          <button onClick={abrirTurno} disabled={!efectivoIni||procesando} style={{
            width:'100%', marginTop:14, padding:'14px', borderRadius:12, cursor:'pointer',
            background: !efectivoIni ? 'rgba(76,175,80,0.05)' : 'rgba(76,175,80,0.15)',
            border:'1px solid rgba(76,175,80,0.4)', color:'#4caf50',
            fontSize:15, fontWeight:800, fontFamily:'inherit', opacity: !efectivoIni ? 0.5 : 1,
          }}>
            {procesando ? 'Abriendo turno...' : '✓ Abrir turno y entrar al POS'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PANEL DE TURNO (overlay sobre el POS) ────────────────────────────────────
export function PanelTurno({ turno, usuario, onCerrar, onTurnoCerrado }) {
  const [tab,         setTab]         = useState('resumen')
  const [ordenes,     setOrdenes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filtroMet,   setFiltroMet]   = useState('todos')
  const [efectivoFis, setEfectivoFis] = useState('')
  const [qrFis,       setQrFis]       = useState('')
  const [tarjetaFis,  setTarjetaFis]  = useState('')
  const [inventario,  setInventario]  = useState({})
  const [obs,         setObs]         = useState('')
  const [procesando,  setProcesando]  = useState(false)
  const [cerrado,     setCerrado]     = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargarOrdenes() }, [])

  const cargarOrdenes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ordenes').select('*')
      .eq('carrito_id', turno.carrito_id).eq('fecha', hoy)
      .order('created_at', { ascending:false })
    if (data) setOrdenes(data)
    setLoading(false)
  }

  // ── CÁLCULOS ──
  const totalVentas   = ordenes.reduce((s,o)=>s+o.total,0)
  const totalEfectivo = ordenes.reduce((s,o)=>s+((o.pagos||[]).filter(p=>p.metodo==='efectivo').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)),0)
  const totalQR       = ordenes.reduce((s,o)=>s+((o.pagos||[]).filter(p=>p.metodo==='qr').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)),0)
  const totalTarjeta  = ordenes.reduce((s,o)=>s+((o.pagos||[]).filter(p=>p.metodo==='tarjeta').reduce((a,p)=>a+(parseFloat(p.monto)||0),0)),0)

  const base              = turno?.efectivo_inicial || 0
  const efectivoEsperado  = base + totalEfectivo

  // Arqueo
  const eFis  = parseInt(efectivoFis||0)
  const qFis  = parseInt(qrFis||0)
  const tFis  = parseInt(tarjetaFis||0)
  const difEf = eFis  - efectivoEsperado
  const difQR = qFis  - totalQR
  const difTa = tFis  - totalTarjeta
  const arqueoCompleto = efectivoFis !== '' && qrFis !== '' && tarjetaFis !== ''

  const cerrarTurno = async () => {
    if (!arqueoCompleto) return
    setProcesando(true)

    await supabase.from('turnos').update({
      hora_cierre: new Date().toISOString(),
      efectivo_sistema: efectivoEsperado,
      efectivo_fisico: eFis,
      diferencia_efectivo: difEf,
      total_qr: totalQR,
      total_tarjeta: totalTarjeta,
      total_ventas: totalVentas,
      ordenes_count: ordenes.length,
      estado: 'cerrado',
      observaciones: obs,
      inventario_cierre: inventario,
    }).eq('id', turno.id)

    // Asiento contable
    const { data: asiento } = await supabase.from('asientos').insert({
      fecha: hoy,
      descripcion: `Cierre turno ${turno.carrito_id} — ${usuario?.nombre} — ${ordenes.length} órdenes`,
      carrito_id: turno.carrito_id,
    }).select().single()

    if (asiento) {
      const partidas = []
      if (totalEfectivo > 0) partidas.push({ asiento_id:asiento.id, codigo:'1105', nombre:'Caja general', debe:totalEfectivo, haber:0 })
      if (totalQR > 0)       partidas.push({ asiento_id:asiento.id, codigo:'1112', nombre:'Nequi/Daviplata', debe:totalQR, haber:0 })
      if (totalTarjeta > 0)  partidas.push({ asiento_id:asiento.id, codigo:'1110', nombre:'Bancos', debe:totalTarjeta, haber:0 })
      if (totalVentas > 0)   partidas.push({ asiento_id:asiento.id, codigo:'4106', nombre:'Ventas ZABÚ', debe:0, haber:totalVentas })
      if (partidas.length > 0) await supabase.from('partidas').insert(partidas)
    }

    setCerrado(true)
    setProcesando(false)
    onTurnoCerrado && onTurnoCerrado()
  }

  const inputArqueo = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:15, fontFamily:'inherit', outline:'none',
    textAlign:'center', fontWeight:700, marginTop:6,
  }

  const FilaDif = ({ label, sistema, fisico, diferencia }) => (
    <div style={{ background:'var(--bg3)', borderRadius:12, padding:'14px 16px', border:`1px solid ${diferencia===0?'var(--green-border)':diferencia>0?'rgba(55,138,221,0.3)':'rgba(224,82,82,0.3)'}` }}>
      <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:10 }}>{label}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <div style={{ background:'var(--bg4)', borderRadius:8, padding:'10px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4 }}>SISTEMA</div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(sistema)}</div>
        </div>
        <div style={{ background:'var(--bg4)', borderRadius:8, padding:'10px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'var(--text4)', marginBottom:4 }}>FÍSICO</div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{fisico!==''?cop(parseInt(fisico||0)):'—'}</div>
        </div>
      </div>
      {fisico !== '' && (
        <div style={{ textAlign:'center', padding:'6px', borderRadius:8,
          background: diferencia===0?'var(--green-dim)':diferencia>0?'rgba(55,138,221,0.1)':'var(--red-dim)',
          color: diferencia===0?'var(--green)':diferencia>0?'var(--blue)':'var(--red)',
          fontSize:14, fontWeight:800,
        }}>
          {diferencia===0?'✅ Cuadra':diferencia>0?`🔵 Sobran ${cop(diferencia)}`:`🔴 Faltan ${cop(Math.abs(diferencia))}`}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:200, display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:11, color: cerrado?'var(--text3)':'var(--green)', letterSpacing:2, fontWeight:600, marginBottom:2 }}>
            {cerrado ? 'TURNO CERRADO' : '● TURNO ACTIVO'}
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>
            {turno.carrito_id} · {usuario?.nombre}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(totalVentas)}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{ordenes.length} órdenes</div>
          </div>
          <div onClick={onCerrar} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18, color:'var(--text3)' }}>×</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'0 20px', display:'flex', gap:4, flexShrink:0 }}>
        {[
          { id:'resumen',   label:'Resumen'   },
          { id:'facturas',  label:'Facturas'  },
          { id:'arqueo',    label:'Arqueo'    },
          { id:'cierre',    label:'Cierre'    },
        ].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'12px 16px', fontSize:13, cursor:'pointer', fontWeight: tab===t.id ? 700 : 400,
            color: tab===t.id ? 'var(--gold)' : 'var(--text3)',
            borderBottom: tab===t.id ? '2px solid var(--gold)' : '2px solid transparent',
            transition:'all .15s',
          }}>{t.label}</div>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>

        {/* ── RESUMEN ── */}
        {tab === 'resumen' && (
          <div style={{ maxWidth:600, margin:'0 auto' }}>
            <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
              {[
                { label:'Ventas totales',  val:cop(totalVentas),       color:'var(--gold)'  },
                { label:'Órdenes',         val:String(ordenes.length), color:'var(--text)'  },
                { label:'💵 Efectivo',     val:cop(totalEfectivo),     color:'var(--green)' },
                { label:'📲 QR',           val:cop(totalQR),           color:'var(--blue)'  },
                { label:'💳 Tarjeta',      val:cop(totalTarjeta),      color:'var(--text2)' },
                { label:'Base inicial',    val:cop(base),              color:'var(--text3)' },
              ].map(k => (
                <div key={k.label} className="kpi-card">
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-val" style={{ color:k.color, fontSize:20 }}>{k.val}</div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title">Caja esperada al cierre</div>
              {[
                { label:'Base inicial',      val:cop(base)              },
                { label:'+ Ventas efectivo', val:cop(totalEfectivo)     },
                { label:'= Efectivo en caja',val:cop(efectivoEsperado), bold:true },
                { label:'QR / Nequi',        val:cop(totalQR)           },
                { label:'Tarjeta',           val:cop(totalTarjeta)      },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontSize:r.bold?16:13, fontWeight:r.bold?900:600, color:r.bold?'var(--gold)':'var(--text2)' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FACTURAS ── */}
        {tab === 'facturas' && (
          <div style={{ maxWidth:700, margin:'0 auto' }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {['todos','efectivo','qr','tarjeta'].map(f => (
                <div key={f} onClick={() => setFiltroMet(f)} style={{
                  padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                  background:filtroMet===f?'var(--gold-dim)':'rgba(255,255,255,0.04)',
                  border:`0.5px solid ${filtroMet===f?'var(--gold-border)':'var(--border)'}`,
                  color:filtroMet===f?'var(--gold)':'var(--text3)', fontWeight:filtroMet===f?700:400,
                }}>{f==='todos'?'Todas':f==='efectivo'?'💵 Efectivo':f==='qr'?'📲 QR':'💳 Tarjeta'}</div>
              ))}
              <button onClick={cargarOrdenes} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>
                🔄 Actualizar
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando órdenes...</div>
            ) : (
              <div className="panel">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr', marginBottom:8 }}>
                  {['Orden','Descripción','Método','Entrega','Total'].map(h => (
                    <div key={h} style={{ fontSize:9, color:'var(--text3)', padding:'0 8px 8px', letterSpacing:0.5, fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                {ordenes
                  .filter(o => filtroMet==='todos' || (o.pagos||[]).some(p=>p.metodo===filtroMet))
                  .map((o,i) => (
                  <div key={o.id} style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr', background:i%2===0?'transparent':'rgba(255,255,255,0.02)', cursor:'pointer' }}>
                    <div style={{ fontSize:12, padding:'8px', color:'var(--gold)', fontWeight:800, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      #{String(o.num).padStart(3,'0')}
                    </div>
                    <div style={{ fontSize:11, padding:'8px', color:'var(--text2)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      {(o.items||[]).length} item(s)
                      {o.nombre_cliente ? ` · ${o.nombre_cliente}` : ''}
                    </div>
                    <div style={{ fontSize:11, padding:'8px', borderBottom:'1px solid rgba(255,255,255,0.03)', color:'var(--text3)' }}>
                      {(o.pagos||[]).map(p=>p.metodo==='efectivo'?'💵':p.metodo==='qr'?'📲':'💳').join('+')}
                    </div>
                    <div style={{ fontSize:11, padding:'8px', borderBottom:'1px solid rgba(255,255,255,0.03)', color:'var(--text3)' }}>
                      {o.entrega==='aqui'?'🪑':o.entrega==='llevar'?'🛍':'🛵'} {o.entrega}
                    </div>
                    <div style={{ fontSize:13, padding:'8px', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)', color:'var(--text)' }}>
                      {cop(o.total)}
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 8px', borderTop:'2px solid var(--border)', marginTop:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Total filtrado</span>
                  <span style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>
                    {cop(ordenes.filter(o=>filtroMet==='todos'||(o.pagos||[]).some(p=>p.metodo===filtroMet)).reduce((s,o)=>s+o.total,0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARQUEO ── */}
        {tab === 'arqueo' && (
          <div style={{ maxWidth:560, margin:'0 auto' }}>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20, lineHeight:1.7 }}>
              El sistema te dice cuánto debería haber. Tú declaras cuánto hay físicamente. Cada método cruza con su par.
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Base */}
              <div style={{ background:'var(--bg3)', borderRadius:12, padding:'14px 16px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>BASE DE CAJA</div>
                <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)', textAlign:'center' }}>{cop(base)}</div>
                <div style={{ fontSize:11, color:'var(--text4)', textAlign:'center', marginTop:4 }}>Base declarada al abrir turno — ya incluida en efectivo esperado</div>
              </div>

              {/* Efectivo */}
              <div>
                <FilaDif label="💵 EFECTIVO EN CAJA (base + ventas efectivo)" sistema={efectivoEsperado} fisico={efectivoFis} diferencia={difEf} />
                <input type="number" value={efectivoFis} onChange={e=>setEfectivoFis(e.target.value)}
                  placeholder={`Escribe cuánto hay físicamente (sistema espera ${cop(efectivoEsperado)})`}
                  style={inputArqueo} />
              </div>

              {/* QR */}
              <div>
                <FilaDif label="📲 QR / NEQUI / DAVIPLATA" sistema={totalQR} fisico={qrFis} diferencia={difQR} />
                <input type="number" value={qrFis} onChange={e=>setQrFis(e.target.value)}
                  placeholder={`Verifica en la app (sistema registra ${cop(totalQR)})`}
                  style={inputArqueo} />
              </div>

              {/* Tarjeta */}
              <div>
                <FilaDif label="💳 TARJETA / DATAFONO" sistema={totalTarjeta} fisico={tarjetaFis} diferencia={difTa} />
                <input type="number" value={tarjetaFis} onChange={e=>setTarjetaFis(e.target.value)}
                  placeholder={`Verifica en el datáfono (sistema registra ${cop(totalTarjeta)})`}
                  style={inputArqueo} />
              </div>

              {/* Resumen total */}
              {arqueoCompleto && (
                <div style={{ background:'var(--bg3)', borderRadius:14, padding:'16px', border:`1px solid ${(difEf+difQR+difTa)===0?'var(--green-border)':'rgba(224,82,82,0.3)'}` }}>
                  <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:12 }}>RESUMEN DEL ARQUEO</div>
                  {[
                    { label:'Efectivo', dif:difEf },
                    { label:'QR',       dif:difQR },
                    { label:'Tarjeta',  dif:difTa },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color: r.dif===0?'var(--green)':r.dif>0?'var(--blue)':'var(--red)' }}>
                        {r.dif===0?'✅ Cuadra':r.dif>0?`+${cop(r.dif)}`:`-${cop(Math.abs(r.dif))}`}
                      </span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Diferencia total</span>
                    <span style={{ fontSize:18, fontWeight:900, color:(difEf+difQR+difTa)===0?'var(--green)':'var(--red)' }}>
                      {(difEf+difQR+difTa)===0?'✅ Todo cuadrado':cop(difEf+difQR+difTa)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CIERRE ── */}
        {tab === 'cierre' && (
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            {cerrado ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Turno cerrado</div>
                <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>Asiento contable generado automáticamente</div>
                <div className="panel" style={{ textAlign:'left' }}>
                  {[
                    { label:'Ventas totales',  val:cop(totalVentas),         color:'var(--gold)'  },
                    { label:'Órdenes',         val:String(ordenes.length),   color:'var(--text)'  },
                    { label:'💵 Efectivo',     val:cop(totalEfectivo),       color:'var(--green)' },
                    { label:'📲 QR',           val:cop(totalQR),             color:'var(--blue)'  },
                    { label:'💳 Tarjeta',      val:cop(totalTarjeta),        color:'var(--text2)' },
                    { label:'Diferencia caja', val:difEf===0?'✅ Cuadrada':cop(difEf), color:difEf===0?'var(--green)':'var(--red)' },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {!arqueoCompleto && (
                  <div style={{ padding:'14px 16px', background:'var(--gold-dim)', border:'1px solid var(--gold-border)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--gold)' }}>
                    ⚠️ Completa el arqueo primero antes de cerrar el turno.
                    <span onClick={() => setTab('arqueo')} style={{ cursor:'pointer', textDecoration:'underline', marginLeft:6 }}>Ir al arqueo →</span>
                  </div>
                )}

                <div className="panel" style={{ marginBottom:14 }}>
                  <div className="panel-title">Resumen final del turno</div>
                  {[
                    { label:'Ventas totales',        val:cop(totalVentas),      color:'var(--gold)'  },
                    { label:'Órdenes procesadas',    val:String(ordenes.length),color:'var(--text)'  },
                    { label:'💵 Efectivo sistema',   val:cop(efectivoEsperado), color:'var(--text2)' },
                    { label:'📲 QR sistema',         val:cop(totalQR),          color:'var(--text2)' },
                    { label:'💳 Tarjeta sistema',    val:cop(totalTarjeta),     color:'var(--text2)' },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.val}</span>
                    </div>
                  ))}
                </div>

                {/* Inventario */}
                <div className="panel" style={{ marginBottom:14 }}>
                  <div className="panel-title">Inventario al cierre</div>
                  {INVENTARIO_ITEMS.map(item => (
                    <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:12, color:'var(--text2)' }}>{item.nombre}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="number" value={inventario[item.id]||''} onChange={e=>setInventario(p=>({...p,[item.id]:e.target.value}))}
                          placeholder="0" style={{ width:65, padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', textAlign:'center' }} />
                        <span style={{ fontSize:10, color:'var(--text4)', minWidth:22 }}>{item.unidad}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Observaciones */}
                <div className="panel" style={{ marginBottom:16 }}>
                  <div className="panel-title">Observaciones</div>
                  <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Novedades del turno..."
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', height:70, marginTop:4 }} />
                </div>

                <button onClick={cerrarTurno} disabled={!arqueoCompleto||procesando} style={{
                  width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
                  background: arqueoCompleto ? 'rgba(224,82,82,0.12)' : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${arqueoCompleto?'rgba(224,82,82,0.4)':'var(--border)'}`,
                  color: arqueoCompleto ? 'var(--red)' : 'var(--text4)',
                  fontSize:15, fontWeight:800, fontFamily:'inherit',
                }}>
                  {procesando ? 'Cerrando turno...' : '🔒 Confirmar cierre de turno'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}