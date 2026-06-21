import { useState } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const FREC_PRESETS = [
  { label:'Diario',        dias:1  },
  { label:'Cada 3 días',   dias:3  },
  { label:'Semanal',       dias:7  },
  { label:'Quincenal',     dias:15 },
  { label:'Mensual',       dias:30 },
]

// Mismo motor de amortización que ya usa el módulo de préstamos — se duplica aquí
// intencionalmente para que el simulador sea 100% independiente y no dependa de
// importar lógica interna de otro componente.
function generarTablaAmortizacion({ capital, tasaInteres, plazoCuotas, frecuenciaDias, metodo, fechaDesembolso }) {
  const cuotas = []
  const fechaBase = new Date(fechaDesembolso)

  if (metodo === 'frances') {
    const tasaPeriodo = tasaInteres / 100
    const cuotaFija = tasaPeriodo === 0
      ? capital / plazoCuotas
      : capital * (tasaPeriodo * Math.pow(1+tasaPeriodo, plazoCuotas)) / (Math.pow(1+tasaPeriodo, plazoCuotas) - 1)
    let saldo = capital
    for (let i = 1; i <= plazoCuotas; i++) {
      const interes = Math.round(saldo * tasaPeriodo)
      const capitalCuota = Math.round(cuotaFija - interes)
      saldo = Math.max(0, saldo - capitalCuota)
      const fecha = new Date(fechaBase); fecha.setDate(fecha.getDate() + frecuenciaDias * i)
      cuotas.push({ numero:i, fecha_vencimiento:fecha.toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo })
    }
  } else if (metodo === 'aleman') {
    const tasaPeriodo = tasaInteres / 100
    const capitalFijo = Math.round(capital / plazoCuotas)
    let saldo = capital
    for (let i = 1; i <= plazoCuotas; i++) {
      const interes = Math.round(saldo * tasaPeriodo)
      const capitalCuota = (i === plazoCuotas) ? saldo : capitalFijo
      saldo = Math.max(0, saldo - capitalCuota)
      const fecha = new Date(fechaBase); fecha.setDate(fecha.getDate() + frecuenciaDias * i)
      cuotas.push({ numero:i, fecha_vencimiento:fecha.toISOString().split('T')[0], capital:capitalCuota, interes, cuota_total:capitalCuota+interes, saldo_restante:saldo })
    }
  } else {
    const interesTotal = Math.round(capital * (tasaInteres/100))
    const totalAPagar = capital + interesTotal
    const cuotaFija = Math.round(totalAPagar / plazoCuotas)
    const capitalPorCuota = Math.round(capital / plazoCuotas)
    const interesPorCuota = Math.round(interesTotal / plazoCuotas)
    let saldo = capital
    for (let i = 1; i <= plazoCuotas; i++) {
      const esUltima = i === plazoCuotas
      const capitalCuota = esUltima ? saldo : capitalPorCuota
      saldo = Math.max(0, saldo - capitalCuota)
      const fecha = new Date(fechaBase); fecha.setDate(fecha.getDate() + frecuenciaDias * i)
      cuotas.push({ numero:i, fecha_vencimiento:fecha.toISOString().split('T')[0], capital:capitalCuota, interes:interesPorCuota, cuota_total: esUltima ? (totalAPagar - (cuotaFija*(plazoCuotas-1))) : cuotaFija, saldo_restante:saldo })
    }
  }
  return cuotas
}

// Genera el contenido de un archivo .ics con un evento de recordatorio por
// cada cuota — formato estándar iCalendar, compatible con Apple/Google Calendar.
function generarICS(cuotas, clienteNombre) {
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

function descargarICS(cuotas, clienteNombre) {
  const contenido = generarICS(cuotas, clienteNombre)
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Calendario_Pagos_${clienteNombre.replace(/\s+/g,'_')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function abrirWhatsApp(telefono, clienteNombre, capital, cuotaTotal, plazoCuotas, frecuenciaDias) {
  const telLimpio = (telefono||'').replace(/\D/g,'')
  const frecTexto = frecuenciaDias===1?'diaria':frecuenciaDias===7?'semanal':frecuenciaDias===15?'quincenal':frecuenciaDias===30?'mensual':`cada ${frecuenciaDias} días`
  const mensaje = `Hola ${clienteNombre}! 👋 Tu crédito por ${cop(capital)} fue aprobado.\n\nResumen:\n• Cuota ${frecTexto}: ${cop(cuotaTotal)}\n• Número de cuotas: ${plazoCuotas}\n\nTe adjunto el calendario con todas las fechas de pago para que lo agregues a tu celular y no se te olvide ninguna. ¡Gracias por confiar en nosotros! 🙌`
  const url = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
}

export default function TabSimulador({ onConvertido }) {
  const [simulaciones, setSimulaciones] = useState([])
  const [vistaActual, setVistaActual] = useState('nueva') // 'nueva' | 'guardadas'

  const [form, setForm] = useState({
    cliente_nombre:'', cliente_telefono:'', capital:'', metodo:'gota_a_gota',
    tasa_interes:'20', plazo_cuotas:'20', frecuencia_dias:1,
    fecha_simulacion: new Date().toISOString().split('T')[0],
  })
  const [cuotas, setCuotas] = useState([])
  const [simulado, setSimulado] = useState(false)
  const [simulacionGuardadaId, setSimulacionGuardadaId] = useState(null)
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [convertido, setConvertido] = useState(false)

  const simular = () => {
    const capital = parseInt(form.capital) || 0
    if (!capital) return
    const tabla = generarTablaAmortizacion({
      capital, tasaInteres: parseFloat(form.tasa_interes), plazoCuotas: parseInt(form.plazo_cuotas),
      frecuenciaDias: parseInt(form.frecuencia_dias), metodo: form.metodo, fechaDesembolso: form.fecha_simulacion,
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
      plazo_cuotas: parseInt(form.plazo_cuotas), frecuencia_dias: parseInt(form.frecuencia_dias),
      fecha_simulacion: form.fecha_simulacion, estado: 'simulada',
    }).select().single()
    if (!error && data) setSimulacionGuardadaId(data.id)
  }

  // El cliente aceptó: esta simulación se convierte en préstamo real, conectado
  // a un cliente en inv_clientes (se crea si no existe), generando también
  // las cuotas reales en inv_cuotas — usando exactamente los mismos números
  // que ya vio y aceptó el cliente, sin volver a digitarlos.
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
      tasa_interes: parseFloat(form.tasa_interes), plazo_cuotas: parseInt(form.plazo_cuotas),
      frecuencia_dias: parseInt(form.frecuencia_dias), fecha_desembolso: form.fecha_simulacion,
      saldo_capital: parseInt(form.capital), estado:'activo',
    }).select().single()

    if (error || !prestamo) { setConvirtiendo(false); alert('Error: '+(error?.message||'desconocido')); return }

    const cuotasInsert = cuotas.map(c => ({ ...c, estado:'pendiente', prestamo_id: prestamo.id }))
    await supabase.from('inv_cuotas').insert(cuotasInsert)

    if (simulacionGuardadaId) {
      await supabase.from('inv_simulaciones').update({ estado:'convertida', prestamo_id: prestamo.id }).eq('id', simulacionGuardadaId)
    }

    setConvirtiendo(false)
    setConvertido(true)
    if (onConvertido) onConvertido()
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
            {[{id:'gota_a_gota',label:'Gota a gota'},{id:'frances',label:'Francés'},{id:'aleman',label:'Alemán'}].map(m => (
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
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tasa de interés (%)</div>
            <input type="number" value={form.tasa_interes} onChange={e=>setForm(p=>({...p,tasa_interes:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Número de cuotas</div>
            <input type="number" value={form.plazo_cuotas} onChange={e=>setForm(p=>({...p,plazo_cuotas:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de desembolso (si se aprueba)</div>
            <input type="date" value={form.fecha_simulacion} onChange={e=>setForm(p=>({...p,fecha_simulacion:e.target.value}))} style={iStyle} />
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

        <button onClick={simular} disabled={!form.capital} className="btn-gold" style={{ width:'100%' }}>📊 Simular</button>
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
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={()=>descargarICS(cuotas, form.cliente_nombre)} className="btn-gold" style={{ flex:1 }}>📅 Descargar calendario (.ics)</button>
                <button onClick={()=>abrirWhatsApp(form.cliente_telefono, form.cliente_nombre, parseInt(form.capital), cuotas[0]?.cuota_total||0, form.plazo_cuotas, form.frecuencia_dias)} className="btn-green" style={{ flex:1 }}>
                  💬 Abrir WhatsApp con mensaje listo
                </button>
              </div>
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:8, textAlign:'center' }}>
                Descarga el calendario primero, luego en WhatsApp adjúntalo manualmente al mensaje que se abrió.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
