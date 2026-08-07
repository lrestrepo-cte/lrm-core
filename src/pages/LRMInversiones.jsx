// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }
const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}
const taStyle = { ...iStyle, resize:'none', lineHeight:1.6 }
const FREC_PRESETS = [
  { label:'Diario',        dias:1  },
  { label:'Cada 3 días',   dias:3  },
  { label:'Semanal',       dias:7  },
  { label:'Quincenal',     dias:15 },
  { label:'Mensual',       dias:30 },
  { label:'Cada 45 días',  dias:45 },
]
// ════════════════════════════════════════════════════════════════════════════
// MOTOR DE AMORTIZACIÓN — Francés, Alemán, Gota a Gota
// ════════════════════════════════════════════════════════════════════════════
// Genera la lista de fechas de corte: [desembolso, cuota1, cuota2, ..., límite]
function generarFechasPeriodos(fechaDesembolso, fechaLimite, frecuenciaDias) {
  const d1 = new Date(fechaDesembolso)
  const dLimite = new Date(fechaLimite)
  const fechas = [new Date(d1)]
  let actual = new Date(d1)
  while (true) {
    const siguiente = new Date(actual)
    siguiente.setDate(siguiente.getDate() + frecuenciaDias)
    if (siguiente >= dLimite) { fechas.push(new Date(dLimite)); break }
    fechas.push(new Date(siguiente))
    actual = siguiente
  }
  return fechas
}
function diasEntre(a, b) { return Math.round((b - a) / 86400000) }
function tasaPeriodo(tasaMensual, diasPeriodo) { return (tasaMensual/100) * (diasPeriodo/30) }
// MOTOR DE AMORTIZACIÓN POR FECHAS — Francés, Alemán, Americano, Gota a Gota.
// No se ingresa número de cuotas: se da fecha de desembolso + fecha límite +
// frecuencia, y el sistema genera las fechas de cada cuota automáticamente.
// La tasa siempre es % MENSUAL; el interés de cada cuota es proporcional a
// los días reales de su período (la última cuota se ajusta para cerrar
// exacto en la fecha límite, sin importar si ese período quedó más corto
// o más largo que los anteriores).
function generarTablaAmortizacion({ capital, tasaInteres, fechaDesembolso, fechaLimite, frecuenciaDias, metodo }) {
  const fechas = generarFechasPeriodos(fechaDesembolso, fechaLimite, frecuenciaDias)
  const n = fechas.length - 1
  const cuotas = []
  if (metodo === 'frances') {
    const tasas = []
    for (let i = 1; i < fechas.length; i++) tasas.push(tasaPeriodo(tasaInteres, diasEntre(fechas[i-1], fechas[i])))
    let acumulado = 1
    const factores = tasas.map(r => { acumulado *= (1+r); return acumulado })
    const sumaInversos = factores.reduce((s,f) => s + 1/f, 0)
    const cuotaFija = capital / sumaInversos
    let saldo = capital
    for (let i = 0; i < n; i++) {
      const interes = Math.round(saldo * tasas[i])
      const esUltima = i === n-1
      let capitalCuota = esUltima ? saldo : Math.round(cuotaFija - interes)
      saldo = Math.max(0, saldo - capitalCuota)
      cuotas.push({ numero:i+1, fecha_vencimiento:fechas[i+1].toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo, estado:'pendiente' })
    }
  } else if (metodo === 'aleman') {
    const capitalFijo = Math.round(capital / n)
    let saldo = capital
    for (let i = 0; i < n; i++) {
      const diasPeriodo = diasEntre(fechas[i], fechas[i+1])
      const interes = Math.round(saldo * tasaPeriodo(tasaInteres, diasPeriodo))
      const esUltima = i === n-1
      const capitalCuota = esUltima ? saldo : capitalFijo
      saldo = Math.max(0, saldo - capitalCuota)
      cuotas.push({ numero:i+1, fecha_vencimiento:fechas[i+1].toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo, estado:'pendiente' })
    }
  } else if (metodo === 'americano') {
    for (let i = 0; i < n; i++) {
      const diasPeriodo = diasEntre(fechas[i], fechas[i+1])
      const interes = Math.round(capital * tasaPeriodo(tasaInteres, diasPeriodo))
      const esUltima = i === n-1
      const capitalCuota = esUltima ? capital : 0
      const saldo = esUltima ? 0 : capital
      cuotas.push({ numero:i+1, fecha_vencimiento:fechas[i+1].toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo, estado:'pendiente' })
    }
  } else {
    const diasTotal = diasEntre(fechas[0], fechas[n])
    const interesTotal = Math.round(capital * (tasaInteres/100) * (diasTotal/30))
    const capitalPorCuota = Math.round(capital / n)
    let saldo = capital
    let interesAcumulado = 0
    for (let i = 0; i < n; i++) {
      const diasPeriodo = diasEntre(fechas[i], fechas[i+1])
      const esUltima = i === n-1
      const capitalCuota = esUltima ? saldo : capitalPorCuota
      const interes = esUltima ? (interesTotal - interesAcumulado) : Math.round(interesTotal * (diasPeriodo/diasTotal))
      interesAcumulado += interes
      saldo = Math.max(0, saldo - capitalCuota)
      cuotas.push({ numero:i+1, fecha_vencimiento:fechas[i+1].toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo, estado:'pendiente' })
    }
  }
  return cuotas
}
function resumenPrestamo(prestamo, cuotas) {
  const totalCuotas   = cuotas.reduce((s,c)=>s+c.cuota_total,0)
  const pagado        = cuotas.filter(c=>c.estado==='pagada').reduce((s,c)=>s+c.cuota_total,0)
  const pendiente     = totalCuotas - pagado
  const hoy           = new Date()
  const vencidas      = cuotas.filter(c=>c.estado==='pendiente' && new Date(c.fecha_vencimiento) < hoy).length
  return { totalCuotas, pagado, pendiente, vencidas }
}
// ════════════════════════════════════════════════════════════════════════════
// .ICS / WHATSAPP — utilidades compartidas para el simulador
// ════════════════════════════════════════════════════════════════════════════
function generarICS(cuotas) {
  const pad = n => String(n).padStart(2,'0')
  const formatoFecha = (fechaStr) => {
    const f = new Date(fechaStr + 'T09:00:00')
    return `${f.getFullYear()}${pad(f.getMonth()+1)}${pad(f.getDate())}T${pad(f.getHours())}${pad(f.getMinutes())}00`
  }
  const ahora = formatoFecha(new Date().toISOString().split('T')[0])
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LRM Inversiones//Calendario de Pagos//ES\r\n'
  cuotas.forEach(c => {
    const fechaInicio = formatoFecha(c.fecha_vencimiento)
    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:${c.numero}-${c.fecha_vencimiento}-${Date.now()}@lrminversiones\r\n`
    ics += `DTSTAMP:${ahora}\r\n`
    ics += `DTSTART:${fechaInicio}\r\n`
    ics += `SUMMARY:💰 Pago cuota ${c.numero} - ${cop(c.cuota_total)}\r\n`
    ics += `DESCRIPTION:Recordatorio de pago. Cuota ${c.numero}. Capital: ${cop(c.capital)}. Interés: ${cop(c.interes)}. Total: ${cop(c.cuota_total)}.\r\n`
    ics += 'BEGIN:VALARM\r\nTRIGGER:-PT2H\r\nACTION:DISPLAY\r\nDESCRIPTION:Recordatorio de pago\r\nEND:VALARM\r\n'
    ics += 'END:VEVENT\r\n'
  })
  ics += 'END:VCALENDAR\r\n'
  return ics
}
async function subirICSysObtenerURL(cuotas, clienteNombre, prestamoId) {
  const contenido = generarICS(cuotas)
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' })
  const nombreArchivo = `calendario_${prestamoId}_${Date.now()}.ics`
  const { error } = await supabase.storage
    .from('calendarios-pagos')
    .upload(nombreArchivo, blob, { contentType: 'text/calendar', upsert: true })
  if (error) { console.error('Error subiendo calendario:', error); return null }
  const { data } = supabase.storage.from('calendarios-pagos').getPublicUrl(nombreArchivo)
  return data?.publicUrl || null
}
function abrirWhatsApp(telefono, clienteNombre, capital, cuotas, plazoCuotas, frecuenciaDias, urlCalendario) {
  const telLimpio = (telefono||'').replace(/\D/g,'')
  const frecTexto = frecuenciaDias===1?'diaria':frecuenciaDias===7?'semanal':frecuenciaDias===15?'quincenal':frecuenciaDias===30?'mensual':`cada ${frecuenciaDias} días`
  const tablaPagos = cuotas.map(c => `${c.numero}. ${c.fecha_vencimiento} — ${cop(c.cuota_total)}`).join('\n')
  let mensaje = `Hola ${clienteNombre}! 👋 Tu crédito por ${cop(capital)} fue aprobado.\n\n`
  mensaje += `📋 *Resumen*\n• Cuota ${frecTexto}: ${cop(cuotas[0]?.cuota_total||0)}\n• Número de cuotas: ${plazoCuotas}\n\n`
  mensaje += `📅 *Tus fechas de pago*\n${tablaPagos}\n\n`
  if (urlCalendario) {
    mensaje += `📲 Agrega todas estas fechas a tu calendario con un solo toque:\n${urlCalendario}\n\n`
  }
  mensaje += `Por favor cumple cada fecha para mantener tu crédito al día. ¡Gracias por confiar en nosotros! 🙌`
  const url = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
}
// ════════════════════════════════════════════════════════════════════════════
// GOTA A GOTA — línea operativa principal
// ════════════════════════════════════════════════════════════════════════════
function TabPrestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [cuotasPorPrestamo, setCuotasPorPrestamo] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [expandido, setExpandido] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [form, setForm] = useState({
    cliente_nombre:'', cliente_telefono:'', cliente_cedula:'', cliente_direccion:'',
    capital:'', metodo:'gota_a_gota', tasa_interes:'20', frecuencia_dias:1,
    fecha_desembolso: new Date().toISOString().split('T')[0],
    fecha_limite: '', notas:'',
  })
  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('inv_prestamos').select('*').order('created_at',{ascending:false})
    if (data) setPrestamos(data)
    setLoading(false)
  }
  const cargarCuotas = async (prestamoId) => {
    const { data } = await supabase.from('inv_cuotas').select('*').eq('prestamo_id',prestamoId).order('numero')
    setCuotasPorPrestamo(prev => ({ ...prev, [prestamoId]: data||[] }))
  }
  const toggleExpandir = (id) => {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!cuotasPorPrestamo[id]) cargarCuotas(id)
  }
  const crearPrestamo = async () => {
    if (!form.cliente_nombre || !form.capital || !form.fecha_limite) return
    const capital = parseInt(form.capital)
    const tasa = parseFloat(form.tasa_interes)
    const frecDias = parseInt(form.frecuencia_dias)
    const tabla = generarTablaAmortizacion({ capital, tasaInteres:tasa, fechaDesembolso:form.fecha_desembolso, fechaLimite:form.fecha_limite, frecuenciaDias:frecDias, metodo:form.metodo })
    const { data: prestamo, error } = await supabase.from('inv_prestamos').insert({
      cliente_nombre: form.cliente_nombre, cliente_telefono: form.cliente_telefono,
      cliente_cedula: form.cliente_cedula, cliente_direccion: form.cliente_direccion,
      capital, metodo: form.metodo, tasa_interes: tasa, plazo_cuotas: tabla.length,
      frecuencia_dias: frecDias, fecha_desembolso: form.fecha_desembolso, fecha_limite: form.fecha_limite,
      saldo_capital: capital, notas: form.notas, estado:'activo',
    }).select().single()
    if (error || !prestamo) { alert('Error: '+(error?.message||'desconocido')); return }
    const cuotasInsert = tabla.map(c => ({ ...c, prestamo_id: prestamo.id }))
    await supabase.from('inv_cuotas').insert(cuotasInsert)
    setForm({ cliente_nombre:'', cliente_telefono:'', cliente_cedula:'', cliente_direccion:'', capital:'', metodo:'gota_a_gota', tasa_interes:'20', frecuencia_dias:1, fecha_desembolso:new Date().toISOString().split('T')[0], fecha_limite:'', notas:'' })
    setModal(false); cargar()
  }
  const registrarPago = async (prestamoId, cuota, montoParam) => {
    const monto = montoParam ?? cuota.cuota_total
    await supabase.from('inv_pagos').insert({ prestamo_id: prestamoId, cuota_id: cuota.id, monto, fecha: new Date().toISOString().split('T')[0] })
    const pagadaCompleta = monto >= cuota.cuota_total
    await supabase.from('inv_cuotas').update({ estado: pagadaCompleta?'pagada':'parcial', fecha_pago: new Date().toISOString().split('T')[0], monto_pagado: monto }).eq('id', cuota.id)
    const { data: cuotasActuales } = await supabase.from('inv_cuotas').select('*').eq('prestamo_id', prestamoId)
    const todasPagadas = cuotasActuales.every(c => c.id===cuota.id ? pagadaCompleta : c.estado==='pagada')
    const saldoCapitalRestante = cuotasActuales.reduce((s,c) => s + (c.id===cuota.id && pagadaCompleta ? 0 : (c.estado==='pagada' ? 0 : c.capital)), 0)
    await supabase.from('inv_prestamos').update({ saldo_capital: saldoCapitalRestante, estado: todasPagadas?'pagado':'activo' }).eq('id', prestamoId)
    cargarCuotas(prestamoId); cargar()
  }
  const marcarMora = async (prestamoId) => {
    await supabase.from('inv_prestamos').update({ estado:'mora' }).eq('id', prestamoId)
    cargar()
  }
  const eliminarPrestamo = async (id) => {
    await supabase.from('inv_prestamos').delete().eq('id', id)
    setPrestamos(prev => prev.filter(p=>p.id!==id))
  }
  const ESTADO_COLOR = { activo:'var(--blue)', pagado:'var(--green)', mora:'var(--red)', castigado:'#666' }
  const METODO_LABEL = { frances:'Francés', aleman:'Alemán', americano:'Americano', gota_a_gota:'Gota a gota' }
  const prestamosFiltrados = filtroEstado==='todos' ? prestamos : prestamos.filter(p=>p.estado===filtroEstado)
  const totalPrestado = prestamos.reduce((s,p)=>s+p.capital,0)
  const totalActivo   = prestamos.filter(p=>p.estado==='activo').reduce((s,p)=>s+p.saldo_capital,0)
  const totalMora     = prestamos.filter(p=>p.estado==='mora').length
  const totalGanado   = prestamos.reduce((s,p)=>s+Math.round(p.capital*(p.tasa_interes/100)),0)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Préstamos — Gota a gota</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Francés, Alemán o Gota a gota — frecuencia de cobro libre en días</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo préstamo</button>
      </div>
      <div className="grid-4" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Capital total prestado</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(totalPrestado)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Capital activo (pendiente)</div><div className="kpi-val" style={{ color:'var(--blue)' }}>{cop(totalActivo)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Interés total proyectado</div><div className="kpi-val" style={{ color:'var(--green)' }}>{cop(totalGanado)}</div></div>
        <div className="kpi-card" style={{ border: totalMora>0?'1px solid rgba(224,82,82,0.4)':undefined }}><div className="kpi-label">En mora</div><div className="kpi-val" style={{ color: totalMora>0?'var(--red)':'var(--text3)' }}>{totalMora}</div></div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {['todos','activo','pagado','mora','castigado'].map(e => (
          <div key={e} onClick={()=>setFiltroEstado(e)} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
            background: filtroEstado===e?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${filtroEstado===e?'var(--gold-border)':'var(--border)'}`,
            color: filtroEstado===e?'var(--gold)':'var(--text3)', textTransform:'capitalize' }}>{e}</div>
        ))}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : prestamosFiltrados.length === 0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin préstamos registrados</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {prestamosFiltrados.map(p => {
            const cuotas = cuotasPorPrestamo[p.id] || []
            const { totalCuotas, pagado, pendiente, vencidas } = resumenPrestamo(p, cuotas)
            return (
              <div key={p.id} className="panel" style={{ border:`1px solid ${ESTADO_COLOR[p.estado]}33` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={()=>toggleExpandir(p.id)}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:`${ESTADO_COLOR[p.estado]}15`, border:`1px solid ${ESTADO_COLOR[p.estado]}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:ESTADO_COLOR[p.estado] }}>
                      {p.cliente_nombre.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{p.cliente_nombre}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{METODO_LABEL[p.metodo]} · {cop(p.capital)} · {p.tasa_interes}%/mes · cada {p.frecuencia_dias}d · {p.plazo_cuotas} cuotas</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {vencidas > 0 && <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'var(--red-dim)', color:'var(--red)', border:'0.5px solid rgba(224,82,82,0.3)', fontWeight:700 }}>{vencidas} vencidas</span>}
                    <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${ESTADO_COLOR[p.estado]}15`, color:ESTADO_COLOR[p.estado], border:`0.5px solid ${ESTADO_COLOR[p.estado]}44`, fontWeight:700, textTransform:'capitalize' }}>{p.estado}</span>
                    <div style={{ fontSize:18, color:'var(--text3)' }}>{expandido===p.id?'▲':'▼'}</div>
                  </div>
                </div>
                {expandido === p.id && (
                  <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                    <div className="grid-3" style={{ gap:10, marginBottom:14 }}>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>📞 {p.cliente_telefono||'—'} · 🪪 {p.cliente_cedula||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>📍 {p.cliente_direccion||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>📅 Desembolso: {p.fecha_desembolso}</div>
                    </div>
                    <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                      <div className="kpi-card" style={{ flex:1, padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Total a pagar</div><div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{cop(totalCuotas)}</div></div>
                      <div className="kpi-card" style={{ flex:1, padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Pagado</div><div style={{ fontSize:15, fontWeight:800, color:'var(--green)' }}>{cop(pagado)}</div></div>
                      <div className="kpi-card" style={{ flex:1, padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Pendiente</div><div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{cop(pendiente)}</div></div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                      {p.estado === 'activo' && (
                        <div onClick={()=>marcarMora(p.id)} style={{ display:'inline-block', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:11, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.25)', color:'var(--red)' }}>⚠️ Marcar en mora</div>
                      )}
                      <div onClick={async ()=>{
                        const url = await subirICSysObtenerURL(cuotas, p.cliente_nombre, p.id)
                        abrirWhatsApp(p.cliente_telefono, p.cliente_nombre, p.capital, cuotas, p.plazo_cuotas, p.frecuencia_dias, url)
                      }} style={{ display:'inline-block', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:11, background:'var(--green-dim)', border:'0.5px solid var(--green-border)', color:'var(--green)' }}>💬 Enviar calendario y tabla por WhatsApp</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Tabla de cuotas</div>
                    <div style={{ maxHeight:320, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8 }}>
                      <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
                        <thead style={{ position:'sticky', top:0, background:'var(--bg3)' }}>
                          <tr>
                            <th style={{ padding:'6px 8px', textAlign:'left', color:'var(--text3)' }}>#</th>
                            <th style={{ padding:'6px 8px', textAlign:'left', color:'var(--text3)' }}>Vence</th>
                            <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Capital</th>
                            <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Interés</th>
                            <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Cuota</th>
                            <th style={{ padding:'6px 8px', textAlign:'center', color:'var(--text3)' }}>Estado</th>
                            <th style={{ padding:'6px 8px', textAlign:'center', color:'var(--text3)' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cuotas.map(c => {
                            const vencida = c.estado==='pendiente' && new Date(c.fecha_vencimiento) < new Date()
                            return (
                              <tr key={c.id} style={{ borderTop:'1px solid var(--border)' }}>
                                <td style={{ padding:'6px 8px' }}>{c.numero}</td>
                                <td style={{ padding:'6px 8px', color: vencida?'var(--red)':'var(--text2)' }}>{c.fecha_vencimiento}</td>
                                <td style={{ padding:'6px 8px', textAlign:'right' }}>{cop(c.capital)}</td>
                                <td style={{ padding:'6px 8px', textAlign:'right', color:'var(--gold)' }}>{cop(c.interes)}</td>
                                <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700 }}>{cop(c.cuota_total)}</td>
                                <td style={{ padding:'6px 8px', textAlign:'center' }}>
                                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, fontWeight:700,
                                    background: c.estado==='pagada'?'var(--green-dim)':vencida?'var(--red-dim)':'rgba(255,255,255,0.05)',
                                    color: c.estado==='pagada'?'var(--green)':vencida?'var(--red)':'var(--text4)' }}>
                                    {c.estado==='pagada'?'Pagada':vencida?'Vencida':c.estado==='parcial'?'Parcial':'Pendiente'}
                                  </span>
                                </td>
                                <td style={{ padding:'6px 8px', textAlign:'center' }}>
                                  {c.estado !== 'pagada' && (
                                    <div onClick={()=>registrarPago(p.id, c)} style={{ cursor:'pointer', fontSize:10, padding:'3px 10px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)', display:'inline-block' }}>💰 Pagar</div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div onClick={()=>eliminarPrestamo(p.id)} style={{ marginTop:12, fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar préstamo completo</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:480, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo préstamo</div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Nombre del cliente</div><input type="text" value={form.cliente_nombre} onChange={e=>setForm(p=>({...p,cliente_nombre:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div><input type="text" value={form.cliente_telefono} onChange={e=>setForm(p=>({...p,cliente_telefono:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cédula</div><input type="text" value={form.cliente_cedula} onChange={e=>setForm(p=>({...p,cliente_cedula:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Dirección</div><input type="text" value={form.cliente_direccion} onChange={e=>setForm(p=>({...p,cliente_direccion:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Método de amortización</div>
              <div style={{ display:'flex', gap:8 }}>
                {[{id:'gota_a_gota',label:'Gota a gota'},{id:'frances',label:'Francés'},{id:'aleman',label:'Alemán'},{id:'americano',label:'Americano'}].map(m => (
                  <div key={m.id} onClick={()=>setForm(p=>({...p,metodo:m.id}))} style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', textAlign:'center', fontSize:11, fontWeight:600,
                    background: form.metodo===m.id?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${form.metodo===m.id?'var(--gold-border)':'var(--border)'}`,
                    color: form.metodo===m.id?'var(--gold)':'var(--text3)' }}>{m.label}</div>
                ))}
              </div>
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Capital (COP)</div><input type="number" value={form.capital} onChange={e=>setForm(p=>({...p,capital:e.target.value}))} placeholder="Ej: 500000" style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tasa de interés MENSUAL (%)</div><input type="number" value={form.tasa_interes} onChange={e=>setForm(p=>({...p,tasa_interes:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha desembolso</div><input type="date" value={form.fecha_desembolso} onChange={e=>setForm(p=>({...p,fecha_desembolso:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha límite de pago</div><input type="date" value={form.fecha_limite} onChange={e=>setForm(p=>({...p,fecha_limite:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Frecuencia de cobro — cada cuántos días (libre)</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                {FREC_PRESETS.map(f => (
                  <div key={f.dias} onClick={()=>setForm(p=>({...p,frecuencia_dias:f.dias}))} style={{ padding:'5px 10px', borderRadius:7, cursor:'pointer', fontSize:10, fontWeight:600,
                    background: form.frecuencia_dias===f.dias?'var(--blue)':'rgba(255,255,255,0.04)', border:`1px solid ${form.frecuencia_dias===f.dias?'var(--blue)':'var(--border)'}`,
                    color: form.frecuencia_dias===f.dias?'white':'var(--text3)' }}>{f.label}</div>
                ))}
              </div>
              <input type="number" value={form.frecuencia_dias} onChange={e=>setForm(p=>({...p,frecuencia_dias:parseInt(e.target.value)||1}))} placeholder="Días personalizados, ej: 10" style={iStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
              <textarea value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{...taStyle,height:50}} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={crearPrestamo} disabled={!form.cliente_nombre||!form.capital||!form.fecha_limite} className="btn-green" style={{ flex:1 }}>Crear préstamo</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// SIMULADOR DE CRÉDITO — simula libre, convierte a préstamo real si se acepta
// ════════════════════════════════════════════════════════════════════════════
function TabSimulador() {
  const [form, setForm] = useState({
    cliente_nombre:'', cliente_telefono:'', capital:'', metodo:'gota_a_gota',
    tasa_interes:'20', frecuencia_dias:1,
    fecha_simulacion: new Date().toISOString().split('T')[0],
    fecha_limite: '',
  })
  const [cuotas, setCuotas] = useState([])
  const [simulado, setSimulado] = useState(false)
  const [simulacionGuardadaId, setSimulacionGuardadaId] = useState(null)
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [convertido, setConvertido] = useState(false)
  const [urlCalendario, setUrlCalendario] = useState(null)
  const simular = () => {
    const capital = parseInt(form.capital) || 0
    if (!capital || !form.fecha_limite) return
    const tabla = generarTablaAmortizacion({
      capital, tasaInteres: parseFloat(form.tasa_interes),
      fechaDesembolso: form.fecha_simulacion, fechaLimite: form.fecha_limite,
      frecuenciaDias: parseInt(form.frecuencia_dias), metodo: form.metodo,
    })
    setCuotas(tabla)
    setSimulado(true)
    setSimulacionGuardadaId(null)
    setConvertido(false)
  }
  const totalCuotas = cuotas.reduce((s,c)=>s+c.cuota_total,0)
  const totalInteres = cuotas.reduce((s,c)=>s+c.interes,0)
  const guardarSimulacion = async () => {
    const { data, error } = await supabase.from('inv_simulaciones').insert({
      cliente_nombre: form.cliente_nombre || 'Sin nombre', cliente_telefono: form.cliente_telefono,
      capital: parseInt(form.capital), metodo: form.metodo, tasa_interes: parseFloat(form.tasa_interes),
      plazo_cuotas: cuotas.length, frecuencia_dias: parseInt(form.frecuencia_dias),
      fecha_simulacion: form.fecha_simulacion, fecha_limite: form.fecha_limite, estado: 'simulada',
    }).select().single()
    if (!error && data) setSimulacionGuardadaId(data.id)
  }
  const convertirEnPrestamo = async () => {
    setConvirtiendo(true)
    let clienteId = null
    const { data: clienteExistente } = await supabase.from('inv_clientes').select('id').eq('nombre', form.cliente_nombre).maybeSingle()
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: clienteNuevo } = await supabase.from('inv_clientes').insert({
        nombre: form.cliente_nombre, telefono: form.cliente_telefono,
      }).select().single()
      clienteId = clienteNuevo?.id
    }
    const { data: prestamo, error } = await supabase.from('inv_prestamos').insert({
      cliente_nombre: form.cliente_nombre, cliente_telefono: form.cliente_telefono,
      cliente_id: clienteId, capital: parseInt(form.capital), metodo: form.metodo,
      tasa_interes: parseFloat(form.tasa_interes), plazo_cuotas: cuotas.length,
      frecuencia_dias: parseInt(form.frecuencia_dias), fecha_desembolso: form.fecha_simulacion,
      fecha_limite: form.fecha_limite, saldo_capital: parseInt(form.capital), estado:'activo',
    }).select().single()
    if (error || !prestamo) { setConvirtiendo(false); alert('Error: '+(error?.message||'desconocido')); return }
    const cuotasInsert = cuotas.map(c => ({ ...c, prestamo_id: prestamo.id }))
    await supabase.from('inv_cuotas').insert(cuotasInsert)
    if (simulacionGuardadaId) {
      await supabase.from('inv_simulaciones').update({ estado:'convertida', prestamo_id: prestamo.id }).eq('id', simulacionGuardadaId)
    }
    const urlCal = await subirICSysObtenerURL(cuotas, form.cliente_nombre, prestamo.id)
    setUrlCalendario(urlCal)
    setConvirtiendo(false)
    setConvertido(true)
  }
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Simulador de crédito</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Simula libremente — solo se convierte en préstamo real si el cliente acepta</div>
      </div>
      <div className="panel" style={{ marginBottom:16 }}>
        <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre del cliente</div>
            <input type="text" value={form.cliente_nombre} onChange={e=>setForm(p=>({...p,cliente_nombre:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>WhatsApp del cliente</div>
            <input type="text" value={form.cliente_telefono} onChange={e=>setForm(p=>({...p,cliente_telefono:e.target.value}))} placeholder="Ej: 3001234567" style={iStyle} />
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Método de amortización</div>
          <div style={{ display:'flex', gap:8 }}>
            {[{id:'gota_a_gota',label:'Gota a gota'},{id:'frances',label:'Francés'},{id:'aleman',label:'Alemán'},{id:'americano',label:'Americano'}].map(m => (
              <div key={m.id} onClick={()=>setForm(p=>({...p,metodo:m.id}))} style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', textAlign:'center', fontSize:11, fontWeight:600,
                background: form.metodo===m.id?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${form.metodo===m.id?'var(--gold-border)':'var(--border)'}`,
                color: form.metodo===m.id?'var(--gold)':'var(--text3)' }}>{m.label}</div>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Capital (COP)</div>
            <input type="number" value={form.capital} onChange={e=>setForm(p=>({...p,capital:e.target.value}))} placeholder="Ej: 500000" style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tasa de interés MENSUAL (%)</div>
            <input type="number" value={form.tasa_interes} onChange={e=>setForm(p=>({...p,tasa_interes:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de desembolso (si se aprueba)</div>
            <input type="date" value={form.fecha_simulacion} onChange={e=>setForm(p=>({...p,fecha_simulacion:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha límite de pago</div>
            <input type="date" value={form.fecha_limite} onChange={e=>setForm(p=>({...p,fecha_limite:e.target.value}))} style={iStyle} />
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Frecuencia de cobro</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {FREC_PRESETS.map(f => (
              <div key={f.dias} onClick={()=>setForm(p=>({...p,frecuencia_dias:f.dias}))} style={{ padding:'5px 10px', borderRadius:7, cursor:'pointer', fontSize:10, fontWeight:600,
                background: form.frecuencia_dias===f.dias?'var(--blue)':'rgba(255,255,255,0.04)', border:`1px solid ${form.frecuencia_dias===f.dias?'var(--blue)':'var(--border)'}`,
                color: form.frecuencia_dias===f.dias?'white':'var(--text3)' }}>{f.label}</div>
            ))}
          </div>
        </div>
        <button onClick={simular} disabled={!form.capital||!form.fecha_limite} className="btn-gold" style={{ width:'100%' }}>📊 Simular</button>
      </div>
      {simulado && (
        <div className="panel" style={{ border:'1px solid var(--gold-border)', marginBottom:16 }}>
          <div className="grid-3" style={{ gap:10, marginBottom:14 }}>
            <div className="kpi-card" style={{ padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Total a pagar</div><div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{cop(totalCuotas)}</div></div>
            <div className="kpi-card" style={{ padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Interés total</div><div style={{ fontSize:16, fontWeight:800, color:'var(--gold)' }}>{cop(totalInteres)}</div></div>
            <div className="kpi-card" style={{ padding:'10px 12px' }}><div className="kpi-label" style={{ fontSize:9 }}>Cuota por pago</div><div style={{ fontSize:16, fontWeight:800, color:'var(--blue)' }}>{cop(cuotas[0]?.cuota_total||0)}</div></div>
          </div>
          <div style={{ maxHeight:280, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8, marginBottom:14 }}>
            <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
              <thead style={{ position:'sticky', top:0, background:'var(--bg3)' }}>
                <tr>
                  <th style={{ padding:'6px 8px', textAlign:'left', color:'var(--text3)' }}>#</th>
                  <th style={{ padding:'6px 8px', textAlign:'left', color:'var(--text3)' }}>Fecha</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Capital</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Interés</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', color:'var(--text3)' }}>Cuota</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map(c => (
                  <tr key={c.numero} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ padding:'6px 8px' }}>{c.numero}</td>
                    <td style={{ padding:'6px 8px' }}>{c.fecha_vencimiento}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}>{cop(c.capital)}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:'var(--gold)' }}>{cop(c.interes)}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700 }}>{cop(c.cuota_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!convertido ? (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {!simulacionGuardadaId && (
                <button onClick={guardarSimulacion} className="btn" style={{ flex:1 }}>💾 Guardar simulación</button>
              )}
              {simulacionGuardadaId && (
                <div style={{ flex:1, padding:'10px', textAlign:'center', fontSize:12, color:'var(--green)', background:'var(--green-dim)', borderRadius:8 }}>✅ Simulación guardada</div>
              )}
              <button onClick={convertirEnPrestamo} disabled={!form.cliente_nombre||convirtiendo} className="btn-green" style={{ flex:1 }}>
                {convirtiendo ? 'Convirtiendo...' : '✅ Cliente acepta — convertir en préstamo'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ padding:'12px 14px', background:'var(--green-dim)', borderRadius:10, fontSize:13, color:'var(--green)', fontWeight:600, marginBottom:12, textAlign:'center' }}>
                ✅ Préstamo creado correctamente. Ahora puedes enviarle el calendario y la confirmación al cliente.
              </div>
              <button onClick={()=>abrirWhatsApp(form.cliente_telefono, form.cliente_nombre, parseInt(form.capital), cuotas, cuotas.length, form.frecuencia_dias, urlCalendario)} className="btn-green" style={{ width:'100%' }}>
                💬 Abrir WhatsApp con calendario y tabla de pagos
              </button>
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:8, textAlign:'center' }}>
                {urlCalendario ? '✅ Calendario listo — el mensaje ya incluye el link y la tabla completa de pagos.' : '⏳ Subiendo calendario...'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// EMPEÑOS
// ════════════════════════════════════════════════════════════════════════════
function TabEmpenos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente_nombre:'', cliente_telefono:'', cliente_cedula:'', articulo:'', valor_avaluo:'', monto_prestado:'', tasa_interes_mensual:'15', fecha_inicio:new Date().toISOString().split('T')[0], fecha_vencimiento:'', notas:'' })
  useEffect(() => { cargar() }, [])
  const cargar = async () => { setLoading(true); const { data } = await supabase.from('inv_empenos').select('*').order('created_at',{ascending:false}); if(data) setItems(data); setLoading(false) }
  const guardar = async () => {
    if (!form.cliente_nombre || !form.monto_prestado) return
    await supabase.from('inv_empenos').insert({ ...form, valor_avaluo:parseInt(form.valor_avaluo)||0, monto_prestado:parseInt(form.monto_prestado), tasa_interes_mensual:parseFloat(form.tasa_interes_mensual), estado:'activo' })
    setForm({ cliente_nombre:'', cliente_telefono:'', cliente_cedula:'', articulo:'', valor_avaluo:'', monto_prestado:'', tasa_interes_mensual:'15', fecha_inicio:new Date().toISOString().split('T')[0], fecha_vencimiento:'', notas:'' })
    setModal(false); cargar()
  }
  const cambiarEstado = async (id, estado) => { await supabase.from('inv_empenos').update({estado}).eq('id',id); cargar() }
  const eliminar = async (id) => { await supabase.from('inv_empenos').delete().eq('id',id); setItems(prev=>prev.filter(i=>i.id!==id)) }
  const ESTADO_COLOR = { activo:'var(--blue)', recuperado:'var(--green)', vencido:'var(--red)', vendido:'#666' }
  const totalPrestado = items.reduce((s,i)=>s+i.monto_prestado,0)
  const totalAvaluo = items.reduce((s,i)=>s+i.valor_avaluo,0)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Empeños</div><div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Artículos en garantía a cambio de préstamo</div></div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo empeño</button>
      </div>
      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Total prestado</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(totalPrestado)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Valor en avalúos</div><div className="kpi-val" style={{ color:'var(--blue)' }}>{cop(totalAvaluo)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Artículos activos</div><div className="kpi-val" style={{ color:'var(--text)' }}>{items.filter(i=>i.estado==='activo').length}</div></div>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : items.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin empeños registrados</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(it => (
            <div key={it.id} className="panel" style={{ border:`1px solid ${ESTADO_COLOR[it.estado]}33` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{it.articulo}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{it.cliente_nombre} · 📞 {it.cliente_telefono||'—'}</div>
                  <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>Avalúo: {cop(it.valor_avaluo)} · Tasa: {it.tasa_interes_mensual}%/mes · Vence: {it.fecha_vencimiento||'—'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(it.monto_prestado)}</div>
                  <select value={it.estado} onChange={e=>cambiarEstado(it.id,e.target.value)} style={{ ...iStyle, marginTop:6, width:140, fontSize:11, color:ESTADO_COLOR[it.estado] }}>
                    <option value="activo">Activo</option><option value="recuperado">Recuperado</option><option value="vencido">Vencido</option><option value="vendido">Vendido</option>
                  </select>
                </div>
              </div>
              <div onClick={()=>eliminar(it.id)} style={{ marginTop:8, fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar</div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo empeño</div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cliente</div><input type="text" value={form.cliente_nombre} onChange={e=>setForm(p=>({...p,cliente_nombre:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div><input type="text" value={form.cliente_telefono} onChange={e=>setForm(p=>({...p,cliente_telefono:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:12 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Artículo</div><input type="text" value={form.articulo} onChange={e=>setForm(p=>({...p,articulo:e.target.value}))} placeholder="Ej: iPhone 14, Cadena de oro 18k..." style={iStyle} /></div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Valor avalúo</div><input type="number" value={form.valor_avaluo} onChange={e=>setForm(p=>({...p,valor_avaluo:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Monto prestado</div><input type="number" value={form.monto_prestado} onChange={e=>setForm(p=>({...p,monto_prestado:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tasa mensual (%)</div><input type="number" value={form.tasa_interes_mensual} onChange={e=>setForm(p=>({...p,tasa_interes_mensual:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha vencimiento</div><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm(p=>({...p,fecha_vencimiento:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.cliente_nombre||!form.monto_prestado} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// LIBRANZAS
// ════════════════════════════════════════════════════════════════════════════
function TabLibranzas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ empleado_nombre:'', empleado_cedula:'', empresa:'', cargo:'', capital:'', tasa_interes:'2', plazo_cuotas:'12', fecha_desembolso:new Date().toISOString().split('T')[0], notas:'' })
  useEffect(() => { cargar() }, [])
  const cargar = async () => { setLoading(true); const { data } = await supabase.from('inv_libranzas').select('*').order('created_at',{ascending:false}); if(data) setItems(data); setLoading(false) }
  const guardar = async () => {
    if (!form.empleado_nombre || !form.capital) return
    const capital = parseInt(form.capital), tasa = parseFloat(form.tasa_interes), plazo = parseInt(form.plazo_cuotas)
    const cuotaMensual = Math.round((capital*(1+tasa/100*plazo))/plazo)
    await supabase.from('inv_libranzas').insert({ ...form, capital, tasa_interes:tasa, plazo_cuotas:plazo, cuota_mensual:cuotaMensual, saldo_capital:capital, estado:'activo' })
    setForm({ empleado_nombre:'', empleado_cedula:'', empresa:'', cargo:'', capital:'', tasa_interes:'2', plazo_cuotas:'12', fecha_desembolso:new Date().toISOString().split('T')[0], notas:'' })
    setModal(false); cargar()
  }
  const eliminar = async (id) => { await supabase.from('inv_libranzas').delete().eq('id',id); setItems(prev=>prev.filter(i=>i.id!==id)) }
  const ESTADO_COLOR = { activo:'var(--blue)', pagado:'var(--green)', mora:'var(--red)' }
  const totalCapital = items.reduce((s,i)=>s+i.capital,0)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Libranzas</div><div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Préstamos con descuento de nómina</div></div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva libranza</button>
      </div>
      <div className="kpi-card" style={{ marginBottom:20 }}><div className="kpi-label">Capital total en libranzas</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(totalCapital)}</div></div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : items.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin libranzas registradas</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(it => (
            <div key={it.id} className="panel" style={{ border:`1px solid ${ESTADO_COLOR[it.estado]}33` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{it.empleado_nombre}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{it.cargo} · {it.empresa}</div>
                  <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>Tasa: {it.tasa_interes}% · {it.plazo_cuotas} cuotas · Cuota: {cop(it.cuota_mensual)}/mes</div>
                </div>
                <div style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(it.capital)}</div>
              </div>
              <div onClick={()=>eliminar(it.id)} style={{ marginTop:8, fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar</div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva libranza</div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Empleado</div><input type="text" value={form.empleado_nombre} onChange={e=>setForm(p=>({...p,empleado_nombre:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cédula</div><input type="text" value={form.empleado_cedula} onChange={e=>setForm(p=>({...p,empleado_cedula:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Empresa</div><input type="text" value={form.empresa} onChange={e=>setForm(p=>({...p,empresa:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cargo</div><input type="text" value={form.cargo} onChange={e=>setForm(p=>({...p,cargo:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Capital</div><input type="number" value={form.capital} onChange={e=>setForm(p=>({...p,capital:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tasa mensual (%)</div><input type="number" value={form.tasa_interes} onChange={e=>setForm(p=>({...p,tasa_interes:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Plazo (cuotas)</div><input type="number" value={form.plazo_cuotas} onChange={e=>setForm(p=>({...p,plazo_cuotas:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.empleado_nombre||!form.capital} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// PORTAFOLIO TRADICIONAL
// ════════════════════════════════════════════════════════════════════════════
function TabPortafolio() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipo:'CDT', nombre:'', entidad:'', monto_invertido:'', valor_actual:'', tasa_esperada:'', fecha_inicio:new Date().toISOString().split('T')[0], fecha_vencimiento:'', notas:'' })
  useEffect(() => { cargar() }, [])
  const cargar = async () => { setLoading(true); const { data } = await supabase.from('inv_portafolio').select('*').order('created_at',{ascending:false}); if(data) setItems(data); setLoading(false) }
  const guardar = async () => {
    if (!form.nombre || !form.monto_invertido) return
    await supabase.from('inv_portafolio').insert({ ...form, monto_invertido:parseInt(form.monto_invertido), valor_actual:parseInt(form.valor_actual)||parseInt(form.monto_invertido), tasa_esperada:parseFloat(form.tasa_esperada)||0, estado:'activo' })
    setForm({ tipo:'CDT', nombre:'', entidad:'', monto_invertido:'', valor_actual:'', tasa_esperada:'', fecha_inicio:new Date().toISOString().split('T')[0], fecha_vencimiento:'', notas:'' })
    setModal(false); cargar()
  }
  const eliminar = async (id) => { await supabase.from('inv_portafolio').delete().eq('id',id); setItems(prev=>prev.filter(i=>i.id!==id)) }
  const totalInvertido = items.reduce((s,i)=>s+i.monto_invertido,0)
  const totalActual = items.reduce((s,i)=>s+(i.valor_actual||i.monto_invertido),0)
  const rendimiento = totalInvertido>0 ? Math.round(((totalActual-totalInvertido)/totalInvertido)*100) : 0
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Portafolio tradicional</div><div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>CDTs, acciones, fondos, finca raíz, cripto</div></div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva inversión</button>
      </div>
      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Total invertido</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(totalInvertido)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Valor actual</div><div className="kpi-val" style={{ color:'var(--blue)' }}>{cop(totalActual)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Rendimiento</div><div className="kpi-val" style={{ color:rendimiento>=0?'var(--green)':'var(--red)' }}>{rendimiento>=0?'+':''}{rendimiento}%</div></div>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : items.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin inversiones registradas</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(it => {
            const rend = it.monto_invertido>0 ? Math.round(((it.valor_actual-it.monto_invertido)/it.monto_invertido)*100) : 0
            return (
              <div key={it.id} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{it.nombre} <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', marginLeft:6 }}>{it.tipo}</span></div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{it.entidad} · Tasa esperada: {it.tasa_esperada}% anual</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:'var(--text)' }}>{cop(it.valor_actual)}</div>
                    <div style={{ fontSize:11, color:rend>=0?'var(--green)':'var(--red)' }}>{rend>=0?'+':''}{rend}% · invertido {cop(it.monto_invertido)}</div>
                  </div>
                </div>
                <div onClick={()=>eliminar(it.id)} style={{ marginTop:8, fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar</div>
              </div>
            )
          })}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva inversión</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Tipo</div>
              <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={iStyle}>
                <option>CDT</option><option>Acciones</option><option>Fondo</option><option>Finca raíz</option><option>Cripto</option><option>Otro</option>
              </select>
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Nombre</div><input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Entidad</div><input type="text" value={form.entidad} onChange={e=>setForm(p=>({...p,entidad:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Monto invertido</div><input type="number" value={form.monto_invertido} onChange={e=>setForm(p=>({...p,monto_invertido:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Valor actual</div><input type="number" value={form.valor_actual} onChange={e=>setForm(p=>({...p,valor_actual:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tasa esperada (% anual)</div><input type="number" value={form.tasa_esperada} onChange={e=>setForm(p=>({...p,tasa_esperada:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Vencimiento</div><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm(p=>({...p,fecha_vencimiento:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.nombre||!form.monto_invertido} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// CATEGORÍAS DE IMPORTACIÓN — LRM Trade
// ════════════════════════════════════════════════════════════════════════════
const CATEGORIAS_LRM = ['Perfumes','Celulares','Ropa','Cosméticos','Electrónica','Calzado','Joyería','Consultoría','Otro']

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD — ingresos por categoría
// ════════════════════════════════════════════════════════════════════════════
function TabDashboardLRM() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalTraslado, setModalTraslado] = useState(false)
  const [montoTraslado, setMontoTraslado] = useState('')
  const [fechaTraslado, setFechaTraslado] = useState(new Date().toISOString().split('T')[0])
  const [notaTraslado, setNotaTraslado] = useState('')
  const [guardandoTraslado, setGuardandoTraslado] = useState(false)
  const [trasladoOk, setTrasladoOk] = useState(false)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('lrm_operaciones').select('*').order('fecha',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const totalIngresos = items.reduce((s,i)=>s+i.monto,0)
  const totalCobrado = items.filter(i=>i.estado==='cobrado').reduce((s,i)=>s+i.monto,0)
  const totalPendiente = items.filter(i=>i.estado==='pendiente').reduce((s,i)=>s+i.monto,0)

  const porCategoria = CATEGORIAS_LRM.map(cat => ({
    categoria: cat,
    total: items.filter(i=>i.categoria===cat).reduce((s,i)=>s+i.monto,0),
    count: items.filter(i=>i.categoria===cat).length,
  })).filter(c=>c.count>0).sort((a,b)=>b.total-a.total)

  const maxCategoria = porCategoria.length>0 ? Math.max(...porCategoria.map(c=>c.total)) : 1

  const abrirTraslado = () => {
    setMontoTraslado(totalCobrado>0 ? String(totalCobrado) : '')
    setNotaTraslado('')
    setFechaTraslado(new Date().toISOString().split('T')[0])
    setTrasladoOk(false)
    setModalTraslado(true)
  }

  const confirmarTraslado = async () => {
    if (!montoTraslado) return
    setGuardandoTraslado(true)
    await supabase.from('my_space_ingresos_v2').insert({
      fecha: fechaTraslado,
      fuente: 'inversiones',
      descripcion: notaTraslado || 'Utilidad LRM Trade Consulting',
      monto: parseInt(montoTraslado),
      tipo: 'negocio',
      recurrente: false,
    })
    setGuardandoTraslado(false)
    setTrasladoOk(true)
    setTimeout(() => { setModalTraslado(false) }, 1500)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Dashboard LRM Trade</div>
        <button onClick={abrirTraslado} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>💸 Trasladar utilidad a My Space</button>
      </div>
      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Total ingresos</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cop(totalIngresos)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Cobrado</div><div className="kpi-val" style={{ color:'var(--green)' }}>{cop(totalCobrado)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Pendiente</div><div className="kpi-val" style={{ color:'var(--red)' }}>{cop(totalPendiente)}</div></div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Ingresos por categoría</div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : porCategoria.length===0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>Sin operaciones registradas</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {porCategoria.map(c => (
            <div key={c.categoria} className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.categoria} <span style={{ fontSize:11, color:'var(--text3)' }}>({c.count})</span></div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(c.total)}</div>
              </div>
              <div style={{ height:6, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round((c.total/maxCategoria)*100)}%`, background:'var(--gold)', borderRadius:4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalTraslado && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:400, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Trasladar utilidad a My Space</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Se registra como ingreso "Dividendos LRM Trade Consulting"</div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Monto a trasladar (COP)</div>
              <input type="number" value={montoTraslado} onChange={e=>setMontoTraslado(e.target.value)} style={iStyle} autoFocus />
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>Sugerido según lo cobrado: {cop(totalCobrado)}</div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div>
              <input type="date" value={fechaTraslado} onChange={e=>setFechaTraslado(e.target.value)} style={iStyle} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nota (opcional)</div>
              <input type="text" value={notaTraslado} onChange={e=>setNotaTraslado(e.target.value)} placeholder="Ej: Utilidad julio" style={iStyle} />
            </div>

            {trasladoOk ? (
              <div style={{ padding:'12px 14px', background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:10, fontSize:13, color:'var(--green)', fontWeight:600, textAlign:'center' }}>
                ✅ Trasladado a My Space
              </div>
            ) : (
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={confirmarTraslado} disabled={!montoTraslado||guardandoTraslado} className="btn-green" style={{ flex:1 }}>
                  {guardandoTraslado ? 'Guardando...' : 'Confirmar traslado'}
                </button>
                <button onClick={()=>setModalTraslado(false)} className="btn">Cancelar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// OPERACIONES — CRUD por categoría de importación
// ════════════════════════════════════════════════════════════════════════════
function TabOperaciones() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filtro, setFiltro] = useState('Todas')
  const [form, setForm] = useState({ cliente:'', telefono:'', categoria:'Perfumes', descripcion:'', monto:'', fecha:new Date().toISOString().split('T')[0], estado:'pendiente', notas:'' })

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('lrm_operaciones').select('*').order('fecha',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.cliente || !form.monto) return
    await supabase.from('lrm_operaciones').insert({ ...form, monto:parseInt(form.monto) })
    setForm({ cliente:'', telefono:'', categoria:'Perfumes', descripcion:'', monto:'', fecha:new Date().toISOString().split('T')[0], estado:'pendiente', notas:'' })
    setModal(false); cargar()
  }

  const marcarCobrado = async (id) => {
    await supabase.from('lrm_operaciones').update({ estado:'cobrado' }).eq('id', id)
    cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('lrm_operaciones').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const visibles = filtro==='Todas' ? items : items.filter(i => i.categoria===filtro)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Operaciones</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Por categoría de importación</div>
        </div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva operación</button>
      </div>
      <div className="sub-nav" style={{ marginBottom:16, flexWrap:'wrap' }}>
        <div className={`sub-nav-item${filtro==='Todas'?' active':''}`} onClick={()=>setFiltro('Todas')}>Todas</div>
        {CATEGORIAS_LRM.map(cat => (
          <div key={cat} className={`sub-nav-item${filtro===cat?' active':''}`} onClick={()=>setFiltro(cat)}>{cat}</div>
        ))}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : visibles.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin operaciones en esta categoría</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {visibles.map(it => (
            <div key={it.id} className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{it.cliente} <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', marginLeft:6 }}>{it.categoria}</span></div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{it.descripcion || 'Sin descripción'} · {it.fecha}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:900, color:'var(--text)' }}>{cop(it.monto)}</div>
                  <div style={{ fontSize:11, color:it.estado==='cobrado'?'var(--green)':'var(--red)' }}>{it.estado==='cobrado' ? '✅ Cobrado' : '⏳ Pendiente'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:14, marginTop:10 }}>
                {it.estado!=='cobrado' && <div onClick={()=>marcarCobrado(it.id)} style={{ fontSize:11, color:'var(--green)', cursor:'pointer' }}>✅ Marcar cobrado</div>}
                <div onClick={()=>eliminar(it.id)} style={{ fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva operación</div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cliente</div><input type="text" value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div><input type="text" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} style={iStyle} /></div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Categoría</div>
                <select value={form.categoria} onChange={e=>setForm(p=>({...p,categoria:e.target.value}))} style={iStyle}>
                  {CATEGORIAS_LRM.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Monto</div><input type="number" value={form.monto} onChange={e=>setForm(p=>({...p,monto:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div><input type="date" value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))} style={iStyle} /></div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Estado</div>
                <select value={form.estado} onChange={e=>setForm(p=>({...p,estado:e.target.value}))} style={iStyle}>
                  <option value="pendiente">Pendiente</option>
                  <option value="cobrado">Cobrado</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Descripción</div>
              <textarea value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))} style={{ ...taStyle, minHeight:60 }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.cliente||!form.monto} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CUENTAS DE COBRO — genera texto WhatsApp con datos Bancolombia
// ════════════════════════════════════════════════════════════════════════════
const DATOS_BANCARIOS_LRM = {
  titular: 'Luis Pablo Restrepo Valderrama',
  cedula: 'CC 1.082.938.048',
  banco: 'Bancolombia',
  tipoCuenta: 'Ahorros',
  cuenta: '483-865611-01',
}

function TabCuentasCobro() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(null)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('lrm_operaciones').select('*').eq('estado','pendiente').order('fecha',{ascending:true})
    setItems(data||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const porCliente = {}
  items.forEach(it => {
    const key = it.cliente
    if (!porCliente[key]) porCliente[key] = { cliente: it.cliente, telefono: it.telefono, ops: [] }
    porCliente[key].ops.push(it)
  })
  const clientes = Object.values(porCliente)

  const generarTexto = (grupo) => {
    const total = grupo.ops.reduce((s,o)=>s+o.monto,0)
    let texto = `Hola ${grupo.cliente}, te comparto la cuenta de cobro de LRM Trade Consulting:\n\n`
    grupo.ops.forEach(o => {
      texto += `• ${o.categoria}${o.descripcion ? ' — ' + o.descripcion : ''}: ${cop(o.monto)}\n`
    })
    texto += `\nTotal a pagar: ${cop(total)}\n\n`
    texto += `Datos para transferencia:\n`
    texto += `${DATOS_BANCARIOS_LRM.banco} · ${DATOS_BANCARIOS_LRM.tipoCuenta}\n`
    texto += `Cuenta: ${DATOS_BANCARIOS_LRM.cuenta}\n`
    texto += `Titular: ${DATOS_BANCARIOS_LRM.titular}\n`
    texto += `${DATOS_BANCARIOS_LRM.cedula}\n\n`
    texto += `Gracias por tu confianza.`
    return texto
  }

  const copiar = async (grupo) => {
    try {
      await navigator.clipboard.writeText(generarTexto(grupo))
      setCopiado(grupo.cliente)
      setTimeout(()=>setCopiado(null), 2000)
    } catch (e) {}
  }

  const enviarWhatsapp = (grupo) => {
    const numero = (grupo.telefono||'').replace(/\D/g,'')
    const texto = encodeURIComponent(generarTexto(grupo))
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
  }

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Cuentas de cobro</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Agrupadas por cliente · Solo operaciones pendientes</div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : clientes.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin cuentas pendientes por cobrar</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {clientes.map(grupo => {
            const total = grupo.ops.reduce((s,o)=>s+o.monto,0)
            return (
              <div key={grupo.cliente} className="panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{grupo.cliente}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{grupo.ops.length} operación{grupo.ops.length>1?'es':''} pendiente{grupo.ops.length>1?'s':''}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>{cop(total)}</div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>enviarWhatsapp(grupo)} className="btn-green" style={{ flex:1, fontSize:12 }}>📲 Enviar por WhatsApp</button>
                  <button onClick={()=>copiar(grupo)} className="btn" style={{ fontSize:12 }}>{copiado===grupo.cliente ? '✅ Copiado' : '💬 Copiar texto'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO INVERSIONES — conserva el módulo original (gota a gota, simulador, empeños, libranzas, portafolio)
// ════════════════════════════════════════════════════════════════════════════
function TabInversionesModulo() {
  const [tab, setTab] = useState('prestamos')
  const TABS = [
    { id:'prestamos',  label:'💧 Gota a gota'  },
    { id:'simulador',  label:'🧮 Simulador'    },
    { id:'empenos',    label:'💎 Empeños'      },
    { id:'libranzas',  label:'📋 Libranzas'    },
    { id:'portafolio', label:'📈 Portafolio'   },
  ]
  return (
    <div>
      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>
      {tab==='prestamos'  && <TabPrestamos />}
      {tab==='simulador'  && <TabSimulador />}
      {tab==='empenos'    && <TabEmpenos />}
      {tab==='libranzas'  && <TabLibranzas />}
      {tab==='portafolio' && <TabPortafolio />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMEX — Comercio Exterior: cotizador de carga por rutas configurables
// ════════════════════════════════════════════════════════════════════════════
function fmtMoneda(n, moneda) {
  if (moneda === 'USD') return '$' + (n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' USD'
  return cop(n) + ' COP'
}

function TabComexDashboard() {
  const [rutas, setRutas] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const [{ data:r }, { data:c }] = await Promise.all([
      supabase.from('lrm_comex_rutas').select('*'),
      supabase.from('lrm_comex_cotizaciones').select('*').order('fecha',{ascending:false}),
    ])
    setRutas(r||[])
    setCotizaciones(c||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const totalCotizado = cotizaciones.reduce((s,c)=>s+(c.moneda==='USD'?c.total:0),0)
  const esteMes = new Date().toISOString().slice(0,7)
  const cotizacionesMes = cotizaciones.filter(c => (c.fecha||'').startsWith(esteMes))

  const porRuta = {}
  cotizaciones.forEach(c => {
    porRuta[c.ruta_nombre] = (porRuta[c.ruta_nombre]||0) + 1
  })
  const rutaTop = Object.entries(porRuta).sort((a,b)=>b[1]-a[1])[0]

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Dashboard Comex</div>
      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Cotizaciones totales</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{cotizaciones.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Cotizaciones este mes</div><div className="kpi-val" style={{ color:'var(--green)' }}>{cotizacionesMes.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Ruta más cotizada</div><div className="kpi-val" style={{ color:'var(--blue)', fontSize:14 }}>{rutaTop ? rutaTop[0] : '—'}</div></div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Rutas activas ({rutas.filter(r=>r.activa).length})</div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : rutas.length===0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text4)' }}>Sin rutas configuradas — ve a "Rutas y tarifas" para crear la primera</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rutas.filter(r=>r.activa).map(r => (
            <div key={r.id} className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{r.nombre}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Divisor: {r.divisor_volumetrico} · {porRuta[r.nombre]||0} cotizaciones</div>
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{fmtMoneda(r.tarifa_kg, r.moneda)}/kg</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabComexCotizador() {
  const [rutas, setRutas] = useState([])
  const [form, setForm] = useState({ cliente:'', telefono:'', ruta_id:'', largo:'', ancho:'', alto:'', bultos:1, peso_real:'', notas:'' })
  const [guardando, setGuardando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)

  const cargarRutas = async () => {
    const { data } = await supabase.from('lrm_comex_rutas').select('*').eq('activa', true).order('nombre')
    setRutas(data||[])
    if (data && data.length>0 && !form.ruta_id) setForm(p=>({...p, ruta_id:data[0].id}))
  }

  useEffect(() => { cargarRutas() }, [])

  const ruta = rutas.find(r => r.id === form.ruta_id)

  const largo = parseFloat(form.largo)||0
  const ancho = parseFloat(form.ancho)||0
  const alto  = parseFloat(form.alto)||0
  const bultos = parseInt(form.bultos)||1
  const pesoReal = parseFloat(form.peso_real)||0
  const divisor = ruta?.divisor_volumetrico || 5000
  const pesoVolumetrico = ruta ? (largo*ancho*alto*bultos)/divisor : 0
  const pesoFacturable = Math.max(pesoReal, pesoVolumetrico)
  let total = ruta ? pesoFacturable * ruta.tarifa_kg : 0
  if (ruta && ruta.tarifa_minima && total < ruta.tarifa_minima) total = ruta.tarifa_minima

  const calculoListo = ruta && largo>0 && ancho>0 && alto>0 && form.cliente

  const guardarCotizacion = async () => {
    if (!calculoListo) return
    setGuardando(true)
    const payload = {
      cliente: form.cliente,
      telefono: form.telefono,
      ruta_id: ruta.id,
      ruta_nombre: ruta.nombre,
      largo_cm: largo, ancho_cm: ancho, alto_cm: alto,
      bultos, peso_real_kg: pesoReal,
      peso_volumetrico_kg: pesoVolumetrico,
      peso_facturable_kg: pesoFacturable,
      tarifa_kg: ruta.tarifa_kg,
      moneda: ruta.moneda,
      total, notas: form.notas,
    }
    await supabase.from('lrm_comex_cotizaciones').insert(payload)
    setUltimoResultado({ ...payload })
    setForm(p => ({ ...p, cliente:'', telefono:'', largo:'', ancho:'', alto:'', bultos:1, peso_real:'', notas:'' }))
    setGuardando(false)
  }

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Cotizador Comex</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Calcula peso volumétrico y tarifa según la ruta seleccionada</div>

      {rutas.length===0 ? (
        <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>No hay rutas activas — crea una en "Rutas y tarifas" primero</div>
      ) : (
        <>
          <div className="grid-2" style={{ gap:12, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Cliente</div>
              <input type="text" value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))} style={iStyle} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div>
              <input type="text" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} style={iStyle} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Ruta</div>
            <select value={form.ruta_id} onChange={e=>setForm(p=>({...p,ruta_id:e.target.value}))} style={iStyle}>
              {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>

          <div className="grid-4" style={{ gap:10, marginBottom:14 }}>
            <div><div style={{ fontSize:11, color:'var(--text3)' }}>Largo (cm)</div><input type="number" value={form.largo} onChange={e=>setForm(p=>({...p,largo:e.target.value}))} style={iStyle} /></div>
            <div><div style={{ fontSize:11, color:'var(--text3)' }}>Ancho (cm)</div><input type="number" value={form.ancho} onChange={e=>setForm(p=>({...p,ancho:e.target.value}))} style={iStyle} /></div>
            <div><div style={{ fontSize:11, color:'var(--text3)' }}>Alto (cm)</div><input type="number" value={form.alto} onChange={e=>setForm(p=>({...p,alto:e.target.value}))} style={iStyle} /></div>
            <div><div style={{ fontSize:11, color:'var(--text3)' }}>Bultos</div><input type="number" value={form.bultos} onChange={e=>setForm(p=>({...p,bultos:e.target.value}))} style={iStyle} /></div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Peso real total (kg)</div>
            <input type="number" value={form.peso_real} onChange={e=>setForm(p=>({...p,peso_real:e.target.value}))} style={iStyle} />
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
            <textarea value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{ ...taStyle, minHeight:50 }} />
          </div>

          {ruta && (largo>0 && ancho>0 && alto>0) && (
            <div className="panel" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Resultado del cálculo</div>
              <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
                <div><div style={{ fontSize:11, color:'var(--text3)' }}>Peso real</div><div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{pesoReal.toFixed(2)} kg</div></div>
                <div><div style={{ fontSize:11, color:'var(--text3)' }}>Peso volumétrico</div><div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{pesoVolumetrico.toFixed(2)} kg</div></div>
              </div>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Peso facturable (mayor de los dos)</div>
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{pesoFacturable.toFixed(2)} kg</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Total cotización</div>
                  <div style={{ fontSize:20, fontWeight:900, color:'var(--green)' }}>{fmtMoneda(total, ruta.moneda)}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={guardarCotizacion} disabled={!calculoListo || guardando} className="btn-gold" style={{ width:'100%' }}>
            {guardando ? 'Guardando...' : '💾 Guardar cotización'}
          </button>

          {ultimoResultado && (
            <div className="panel" style={{ marginTop:14, borderColor:'var(--green)' }}>
              <div style={{ fontSize:12, color:'var(--green)', fontWeight:700 }}>✅ Cotización guardada — {ultimoResultado.cliente} · {ultimoResultado.ruta_nombre} · {fmtMoneda(ultimoResultado.total, ultimoResultado.moneda)}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TabComexRutas() {
  const [rutas, setRutas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre:'', divisor_volumetrico:5000, tarifa_kg:'', tarifa_minima:'', moneda:'USD', notas:'' })

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('lrm_comex_rutas').select('*').order('created_at',{ascending:false})
    setRutas(data||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const abrirNueva = () => {
    setEditando(null)
    setForm({ nombre:'', divisor_volumetrico:5000, tarifa_kg:'', tarifa_minima:'', moneda:'USD', notas:'' })
    setModal(true)
  }

  const abrirEditar = (r) => {
    setEditando(r)
    setForm({ nombre:r.nombre, divisor_volumetrico:r.divisor_volumetrico, tarifa_kg:r.tarifa_kg, tarifa_minima:r.tarifa_minima||'', moneda:r.moneda, notas:r.notas||'' })
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre || !form.tarifa_kg) return
    const payload = {
      nombre: form.nombre,
      divisor_volumetrico: parseFloat(form.divisor_volumetrico)||5000,
      tarifa_kg: parseFloat(form.tarifa_kg),
      tarifa_minima: parseFloat(form.tarifa_minima)||0,
      moneda: form.moneda,
      notas: form.notas,
    }
    if (editando) await supabase.from('lrm_comex_rutas').update(payload).eq('id', editando.id)
    else await supabase.from('lrm_comex_rutas').insert({ ...payload, activa:true })
    setModal(false); cargar()
  }

  const toggleActiva = async (r) => {
    await supabase.from('lrm_comex_rutas').update({ activa: !r.activa }).eq('id', r.id)
    cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('lrm_comex_rutas').delete().eq('id', id)
    setRutas(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Rutas y tarifas</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Divisor volumétrico y tarifa 100% editables por ruta</div>
        </div>
        <button onClick={abrirNueva} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva ruta</button>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : rutas.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin rutas creadas todavía</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rutas.map(r => (
            <div key={r.id} className="panel" style={{ opacity: r.activa ? 1 : 0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{r.nombre} {!r.activa && <span style={{ fontSize:10, color:'var(--text4)' }}>(inactiva)</span>}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Divisor: {r.divisor_volumetrico} · Mínimo: {fmtMoneda(r.tarifa_minima||0, r.moneda)}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{fmtMoneda(r.tarifa_kg, r.moneda)}/kg</div>
              </div>
              <div style={{ display:'flex', gap:14, marginTop:10 }}>
                <div onClick={()=>abrirEditar(r)} style={{ fontSize:11, color:'var(--blue)', cursor:'pointer' }}>✏️ Editar</div>
                <div onClick={()=>toggleActiva(r)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>{r.activa ? '⏸ Desactivar' : '▶ Activar'}</div>
                <div onClick={()=>eliminar(r.id)} style={{ fontSize:11, color:'var(--text4)', cursor:'pointer' }}>🗑 Eliminar</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>{editando ? 'Editar ruta' : 'Nueva ruta'}</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre de la ruta</div>
              <input type="text" placeholder="Ej. Miami → Colombia (Aéreo)" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} style={iStyle} />
            </div>
            <div className="grid-2" style={{ gap:10, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Divisor volumétrico</div><input type="number" value={form.divisor_volumetrico} onChange={e=>setForm(p=>({...p,divisor_volumetrico:e.target.value}))} style={iStyle} /></div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Moneda</div>
                <select value={form.moneda} onChange={e=>setForm(p=>({...p,moneda:e.target.value}))} style={iStyle}>
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                </select>
              </div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tarifa por kg</div><input type="number" value={form.tarifa_kg} onChange={e=>setForm(p=>({...p,tarifa_kg:e.target.value}))} style={iStyle} /></div>
              <div><div style={{ fontSize:11, color:'var(--text3)' }}>Tarifa mínima</div><input type="number" value={form.tarifa_minima} onChange={e=>setForm(p=>({...p,tarifa_minima:e.target.value}))} style={iStyle} /></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Notas</div>
              <textarea value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{ ...taStyle, minHeight:60 }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={guardar} disabled={!form.nombre||!form.tarifa_kg} className="btn-green" style={{ flex:1 }}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabComexHistorial() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('lrm_comex_cotizaciones').select('*').order('fecha',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const visibles = busqueda
    ? items.filter(i => i.cliente.toLowerCase().includes(busqueda.toLowerCase()) || i.ruta_nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : items

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Historial de cotizaciones</div>
      <input type="text" placeholder="Buscar por cliente o ruta..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ ...iStyle, marginBottom:16 }} />
      {loading ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)' }}>Cargando...</div>
      : visibles.length===0 ? <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text4)' }}>Sin cotizaciones registradas</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {visibles.map(it => (
            <div key={it.id} className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{it.cliente}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{it.ruta_nombre} · {it.bultos} bulto{it.bultos>1?'s':''} · {it.fecha}</div>
                  <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{it.largo_cm}×{it.ancho_cm}×{it.alto_cm}cm · {it.peso_facturable_kg.toFixed(2)}kg facturable</div>
                </div>
                <div style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>{fmtMoneda(it.total, it.moneda)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabComexModulo() {
  const [tab, setTab] = useState('dashboard')
  const TABS = [
    { id:'dashboard',  label:'📊 Dashboard' },
    { id:'cotizador',  label:'🧮 Cotizador' },
    { id:'rutas',      label:'🛣️ Rutas y tarifas' },
    { id:'historial',  label:'📋 Historial' },
  ]
  return (
    <div>
      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>
      {tab==='dashboard' && <TabComexDashboard />}
      {tab==='cotizador' && <TabComexCotizador />}
      {tab==='rutas'     && <TabComexRutas />}
      {tab==='historial' && <TabComexHistorial />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function LRMInversiones() {
  const [tab, setTab] = useState('dashboard')
  const TABS = [
    { id:'dashboard',   label:'📊 Dashboard' },
    { id:'operaciones', label:'📦 Operaciones' },
    { id:'cuentas',     label:'📲 Cuentas de cobro' },
    { id:'inversiones', label:'💰 Inversiones' },
    { id:'comex',       label:'🌐 Comex' },
  ]
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ fontSize:28 }}>📈</div>
          <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>LRM Trade Consulting</div>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Trading & International Commerce Consulting — Conectado a Supabase</div>
      </div>
      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>
      {tab==='dashboard'   && <TabDashboardLRM />}
      {tab==='operaciones' && <TabOperaciones />}
      {tab==='cuentas'     && <TabCuentasCobro />}
      {tab==='inversiones' && <TabInversionesModulo />}
      {tab==='comex'       && <TabComexModulo />}
    </div>
  )
}