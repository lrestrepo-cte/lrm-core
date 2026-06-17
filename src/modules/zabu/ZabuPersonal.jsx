// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const TIPO_MOVIMIENTO_LABEL = {
  ingreso:'Ingreso', cambio_cargo:'Cambio de cargo', cambio_carrito:'Cambio de punto',
  cambio_salario:'Ajuste de salario', salida:'Salida', reingreso:'Reingreso',
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: Nuevo empleado
// ════════════════════════════════════════════════════════════════════════════
function ModalNuevoEmpleado({ onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:'', cedula:'', telefono:'', fecha_ingreso: new Date().toISOString().split('T')[0],
    tipo_contrato:'informal', eps:'', arl:'', pension:'',
    cargo_actual:'Vendedor', carrito_actual:'C01', salario_actual:'', tipo_salario:'por_dia', notas:'', pin:'',
  })
  const [pinError, setPinError] = useState('')

  const guardar = async () => {
    if (!form.nombre) return
    setPinError('')
    if (form.pin) {
      const { data: existente } = await supabase.from('zabu_empleados').select('id').eq('pin', form.pin).maybeSingle()
      if (existente) { setPinError('Ese PIN ya está en uso por otro empleado. Elige otro.'); return }
    }
    const { data, error } = await supabase.from('zabu_empleados').insert({
      ...form, salario_actual: parseInt(form.salario_actual) || 0, pin: form.pin || null,
    }).select().single()
    if (error) { alert('Error: ' + error.message); return }
    await supabase.from('zabu_empleado_movimientos').insert({
      empleado_id: data.id, tipo:'ingreso', valor_nuevo: form.cargo_actual, fecha: form.fecha_ingreso,
      notas: `Ingresa como ${form.cargo_actual} en ${form.carrito_actual} con salario ${cop(form.salario_actual)}`,
    })
    onSaved()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:520, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nuevo empleado</div>

        <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>DATOS BÁSICOS</div>
        <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre completo *</div>
            <input type="text" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Cargo</div>
            <input type="text" value={form.cargo_actual} onChange={e=>setForm(p=>({...p,cargo_actual:e.target.value}))} placeholder="Vendedor, Cocinero..." style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Punto / Carrito</div>
            <select value={form.carrito_actual} onChange={e=>setForm(p=>({...p,carrito_actual:e.target.value}))} style={iStyle}>
              <option value="C01">Carrito 01</option><option value="C02">Carrito 02</option><option value="C03">Carrito 03</option><option value="CEDIS">CEDIS</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Salario</div>
            <input type="number" value={form.salario_actual} onChange={e=>setForm(p=>({...p,salario_actual:e.target.value}))} style={iStyle} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tipo de salario</div>
            <select value={form.tipo_salario} onChange={e=>setForm(p=>({...p,tipo_salario:e.target.value}))} style={iStyle}>
              <option value="por_dia">Por día trabajado</option><option value="quincenal">Quincenal fijo</option><option value="mensual">Mensual fijo</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>PIN de acceso al POS (4 dígitos)</div>
            <input type="text" maxLength={4} value={form.pin} onChange={e=>setForm(p=>({...p,pin:e.target.value.replace(/\D/g,'')}))} placeholder="Ej: 1234" style={iStyle} />
          </div>
        </div>
        {pinError && <div style={{ padding:'8px 12px', background:'var(--red-dim)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'var(--red)', marginBottom:14 }}>{pinError}</div>}

        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>CONTACTO Y CONTRATO (opcional)</div>
        <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>Cédula</div><input type="text" value={form.cedula} onChange={e=>setForm(p=>({...p,cedula:e.target.value}))} style={iStyle} /></div>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div><input type="text" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} style={iStyle} /></div>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de ingreso</div><input type="date" value={form.fecha_ingreso} onChange={e=>setForm(p=>({...p,fecha_ingreso:e.target.value}))} style={iStyle} /></div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tipo de contrato</div>
            <select value={form.tipo_contrato} onChange={e=>setForm(p=>({...p,tipo_contrato:e.target.value}))} style={iStyle}>
              <option value="informal">Informal</option><option value="prestacion_servicios">Prestación de servicios</option><option value="termino_fijo">Término fijo</option><option value="termino_indefinido">Término indefinido</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>SEGURIDAD SOCIAL (opcional — agrega lo que ya tengas)</div>
        <div className="grid-3" style={{ gap:10, marginBottom:20 }}>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>ARL</div><input type="text" value={form.arl} onChange={e=>setForm(p=>({...p,arl:e.target.value}))} placeholder="Ej: Sura" style={iStyle} /></div>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>EPS</div><input type="text" value={form.eps} onChange={e=>setForm(p=>({...p,eps:e.target.value}))} placeholder="Pendiente" style={iStyle} /></div>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>Pensión</div><input type="text" value={form.pension} onChange={e=>setForm(p=>({...p,pension:e.target.value}))} placeholder="Pendiente" style={iStyle} /></div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={guardar} disabled={!form.nombre} className="btn-green" style={{ flex:1 }}>Crear empleado</button>
          <button onClick={onClose} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: Registrar movimiento (cambio de cargo/carrito/salario/salida/reingreso)
// ════════════════════════════════════════════════════════════════════════════
function ModalMovimiento({ empleado, onClose, onSaved }) {
  const [tipo, setTipo] = useState('cambio_carrito')
  const [valorNuevo, setValorNuevo] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')

  const valorAnteriorActual = () => {
    if (tipo === 'cambio_cargo') return empleado.cargo_actual
    if (tipo === 'cambio_carrito') return empleado.carrito_actual
    if (tipo === 'cambio_salario') return String(empleado.salario_actual)
    return ''
  }

  const confirmar = async () => {
    const updates = { updated_at: new Date().toISOString() }
    if (tipo === 'cambio_cargo')    updates.cargo_actual = valorNuevo
    if (tipo === 'cambio_carrito')  updates.carrito_actual = valorNuevo
    if (tipo === 'cambio_salario')  updates.salario_actual = parseInt(valorNuevo) || 0
    if (tipo === 'salida')          { updates.estado = 'inactivo'; updates.fecha_salida = fecha; updates.motivo_salida = notas }
    if (tipo === 'reingreso')       { updates.estado = 'activo'; updates.fecha_salida = null; updates.motivo_salida = null }

    await supabase.from('zabu_empleados').update(updates).eq('id', empleado.id)
    await supabase.from('zabu_empleado_movimientos').insert({
      empleado_id: empleado.id, tipo, valor_anterior: valorAnteriorActual(),
      valor_nuevo: tipo==='cambio_salario' ? cop(valorNuevo) : valorNuevo, fecha, notas,
    })
    onSaved()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:440, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Registrar movimiento</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>{empleado.nombre}</div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Tipo de movimiento</div>
          <select value={tipo} onChange={e=>{setTipo(e.target.value); setValorNuevo('')}} style={iStyle}>
            <option value="cambio_carrito">Cambio de punto/carrito</option>
            <option value="cambio_cargo">Cambio de cargo</option>
            <option value="cambio_salario">Ajuste de salario</option>
            {empleado.estado === 'activo' ? <option value="salida">Salida</option> : <option value="reingreso">Reingreso</option>}
          </select>
        </div>

        {(tipo === 'cambio_carrito' || tipo === 'cambio_cargo' || tipo === 'cambio_salario') && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>
              Valor actual: <strong style={{color:'var(--text2)'}}>{tipo==='cambio_salario'?cop(valorAnteriorActual()):valorAnteriorActual()}</strong>
            </div>
            {tipo === 'cambio_carrito' ? (
              <select value={valorNuevo} onChange={e=>setValorNuevo(e.target.value)} style={iStyle}>
                <option value="">Seleccionar nuevo punto</option>
                <option value="C01">Carrito 01</option><option value="C02">Carrito 02</option><option value="C03">Carrito 03</option><option value="CEDIS">CEDIS</option>
              </select>
            ) : (
              <input type={tipo==='cambio_salario'?'number':'text'} value={valorNuevo} onChange={e=>setValorNuevo(e.target.value)} placeholder="Nuevo valor" style={iStyle} />
            )}
          </div>
        )}

        <div className="grid-2" style={{ gap:10, marginBottom:14 }}>
          <div><div style={{ fontSize:11, color:'var(--text3)' }}>Fecha</div><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iStyle} /></div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>Notas {tipo==='salida'?'(motivo de salida)':''}</div>
          <input type="text" value={notas} onChange={e=>setNotas(e.target.value)} style={iStyle} />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={confirmar} disabled={(tipo==='cambio_carrito'||tipo==='cambio_cargo'||tipo==='cambio_salario')&&!valorNuevo} className="btn-green" style={{ flex:1 }}>Confirmar</button>
          <button onClick={onClose} className="btn">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PANEL DETALLE DE EMPLEADO — historial, dotación, pagos
// ════════════════════════════════════════════════════════════════════════════
function PanelEmpleado({ empleado, onClose, onRefresh }) {
  const [tab, setTab] = useState('historial')
  const [movimientos, setMovimientos] = useState([])
  const [dotacion, setDotacion] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalMov, setModalMov] = useState(false)
  const [formDotacion, setFormDotacion] = useState({ item:'', cantidad:1, fecha_entrega: new Date().toISOString().split('T')[0] })
  const [formPago, setFormPago] = useState({ concepto:'salario', monto:'', dias_trabajados:'', fecha_pago: new Date().toISOString().split('T')[0], metodo_pago:'efectivo' })

  useEffect(() => { cargar() }, [empleado.id])

  const cargar = async () => {
    setLoading(true)
    const [{ data: m }, { data: d }, { data: p }] = await Promise.all([
      supabase.from('zabu_empleado_movimientos').select('*').eq('empleado_id', empleado.id).order('fecha', { ascending: false }),
      supabase.from('zabu_dotacion').select('*').eq('empleado_id', empleado.id).order('fecha_entrega', { ascending: false }),
      supabase.from('zabu_pagos_personal').select('*').eq('empleado_id', empleado.id).order('fecha_pago', { ascending: false }),
    ])
    setMovimientos(m || []); setDotacion(d || []); setPagos(p || [])
    setLoading(false)
  }

  const entregarDotacion = async () => {
    if (!formDotacion.item) return
    await supabase.from('zabu_dotacion').insert({ empleado_id: empleado.id, ...formDotacion, cantidad: parseInt(formDotacion.cantidad) || 1 })
    setFormDotacion({ item:'', cantidad:1, fecha_entrega: new Date().toISOString().split('T')[0] })
    cargar()
  }

  const registrarPago = async () => {
    if (!formPago.monto) return
    await supabase.from('zabu_pagos_personal').insert({ empleado_id: empleado.id, ...formPago, monto: parseInt(formPago.monto), dias_trabajados: parseInt(formPago.dias_trabajados) || null })
    setFormPago({ concepto:'salario', monto:'', dias_trabajados:'', fecha_pago: new Date().toISOString().split('T')[0], metodo_pago:'efectivo' })
    cargar()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:680, border:'1px solid var(--border)', margin:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>{empleado.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
              {empleado.cargo_actual} · {empleado.carrito_actual} · {cop(empleado.salario_actual)} ({empleado.tipo_salario === 'por_dia' ? 'por día' : empleado.tipo_salario})
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setModalMov(true)} className="btn-gold" style={{ fontSize:11, padding:'7px 14px' }}>+ Movimiento</button>
            <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text4)', fontSize:18, padding:'0 6px' }}>×</div>
          </div>
        </div>

        <div className="sub-nav" style={{ marginBottom:16 }}>
          <div className={`sub-nav-item${tab==='historial'?' active':''}`} onClick={()=>setTab('historial')}>Historial</div>
          <div className={`sub-nav-item${tab==='dotacion'?' active':''}`} onClick={()=>setTab('dotacion')}>Dotación</div>
          <div className={`sub-nav-item${tab==='pagos'?' active':''}`} onClick={()=>setTab('pagos')}>Pagos</div>
        </div>

        {tab === 'historial' && (
          loading ? <div style={{ fontSize:12, color:'var(--text3)' }}>Cargando...</div>
          : movimientos.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin movimientos registrados</div>
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {movimientos.map(m => (
                <div key={m.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--gold)' }}>{TIPO_MOVIMIENTO_LABEL[m.tipo] || m.tipo}</span>
                    {m.valor_anterior && m.valor_nuevo && <span style={{ fontSize:12, color:'var(--text2)' }}> · {m.valor_anterior} → {m.valor_nuevo}</span>}
                    {m.notas && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{m.notas}</div>}
                  </div>
                  <span style={{ fontSize:11, color:'var(--text4)', flexShrink:0 }}>{m.fecha}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'dotacion' && (
          <div>
            <div className="grid-3" style={{ gap:8, marginBottom:14 }}>
              <input type="text" value={formDotacion.item} onChange={e=>setFormDotacion(p=>({...p,item:e.target.value}))} placeholder="Item (ej: Gorra ZABÚ)" style={{...iStyle,marginTop:0}} />
              <input type="number" value={formDotacion.cantidad} onChange={e=>setFormDotacion(p=>({...p,cantidad:e.target.value}))} style={{...iStyle,marginTop:0}} />
              <input type="date" value={formDotacion.fecha_entrega} onChange={e=>setFormDotacion(p=>({...p,fecha_entrega:e.target.value}))} style={{...iStyle,marginTop:0}} />
            </div>
            <button onClick={entregarDotacion} disabled={!formDotacion.item} className="btn-green" style={{ width:'100%', marginBottom:16, padding:'8px' }}>+ Registrar entrega</button>
            {loading ? <div style={{ fontSize:12, color:'var(--text3)' }}>Cargando...</div>
            : dotacion.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin dotación registrada</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {dotacion.map(d => (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{d.item} ×{d.cantidad}</span>
                    <span style={{ fontSize:11, color:'var(--text4)' }}>{d.fecha_entrega}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'pagos' && (
          <div>
            <div className="grid-3" style={{ gap:8, marginBottom:8 }}>
              <select value={formPago.concepto} onChange={e=>setFormPago(p=>({...p,concepto:e.target.value}))} style={{...iStyle,marginTop:0}}>
                <option value="salario">Salario</option><option value="bono">Bono</option><option value="arl">ARL</option><option value="prestamo">Préstamo</option><option value="otro">Otro</option>
              </select>
              <input type="number" value={formPago.monto} onChange={e=>setFormPago(p=>({...p,monto:e.target.value}))} placeholder="Monto" style={{...iStyle,marginTop:0}} />
              <input type="number" value={formPago.dias_trabajados} onChange={e=>setFormPago(p=>({...p,dias_trabajados:e.target.value}))} placeholder="Días (opcional)" style={{...iStyle,marginTop:0}} />
            </div>
            <div className="grid-2" style={{ gap:8, marginBottom:14 }}>
              <input type="date" value={formPago.fecha_pago} onChange={e=>setFormPago(p=>({...p,fecha_pago:e.target.value}))} style={{...iStyle,marginTop:0}} />
              <select value={formPago.metodo_pago} onChange={e=>setFormPago(p=>({...p,metodo_pago:e.target.value}))} style={{...iStyle,marginTop:0}}>
                <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
              </select>
            </div>
            <button onClick={registrarPago} disabled={!formPago.monto} className="btn-green" style={{ width:'100%', marginBottom:16, padding:'8px' }}>+ Registrar pago</button>
            {loading ? <div style={{ fontSize:12, color:'var(--text3)' }}>Cargando...</div>
            : pagos.length === 0 ? <div style={{ fontSize:12, color:'var(--text4)', textAlign:'center', padding:'20px 0' }}>Sin pagos registrados</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {pagos.map(pg => (
                  <div key={pg.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)' }}>
                    <div><span style={{ fontSize:12, fontWeight:600, color:'var(--text2)', textTransform:'capitalize' }}>{pg.concepto}</span>{pg.dias_trabajados && <span style={{ fontSize:11, color:'var(--text4)' }}> · {pg.dias_trabajados}d</span>}</div>
                    <div style={{ textAlign:'right' }}><div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(pg.monto)}</div><div style={{ fontSize:10, color:'var(--text4)' }}>{pg.fecha_pago}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {modalMov && <ModalMovimiento empleado={empleado} onClose={()=>setModalMov(false)} onSaved={()=>{setModalMov(false); cargar(); onRefresh()}} />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ZabuPersonal() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [empleadoSel, setEmpleadoSel] = useState(null)
  const [filtro, setFiltro] = useState('activos')

  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('zabu_empleados').select('*').order('nombre')
    setEmpleados(data || [])
    setLoading(false)
  }

  const filtrados = filtro === 'activos' ? empleados.filter(e => e.estado === 'activo')
    : filtro === 'inactivos' ? empleados.filter(e => e.estado === 'inactivo')
    : empleados

  const activos = empleados.filter(e => e.estado === 'activo')
  const nominaTotal = activos.reduce((s,e) => s + e.salario_actual, 0)

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Empleados, dotación y pagos — historial completo de cada movimiento</div>
        <button onClick={() => setModalNuevo(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nuevo empleado</button>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="kpi-card"><div className="kpi-label">Empleados activos</div><div className="kpi-val" style={{ color:'var(--text)' }}>{loading?'...':activos.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Nómina base (suma salarios)</div><div className="kpi-val" style={{ color:'var(--gold)' }}>{loading?'...':cop(nominaTotal)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Inactivos / histórico</div><div className="kpi-val" style={{ color:'var(--text3)' }}>{loading?'...':empleados.filter(e=>e.estado==='inactivo').length}</div></div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{id:'activos',label:'Activos'},{id:'inactivos',label:'Inactivos'},{id:'todos',label:'Todos'}].map(f => (
          <div key={f.id} onClick={()=>setFiltro(f.id)} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
            background: filtro===f.id?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`1px solid ${filtro===f.id?'var(--gold-border)':'var(--border)'}`,
            color: filtro===f.id?'var(--gold)':'var(--text3)' }}>{f.label}</div>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Cargando...</div>
      : filtrados.length === 0 ? (
        <div className="panel" style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:13, color:'var(--text4)' }}>Sin empleados en esta vista. Crea el primero con "+ Nuevo empleado".</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtrados.map(e => (
            <div key={e.id} onClick={() => setEmpleadoSel(e)} className="panel" style={{ cursor:'pointer', opacity: e.estado==='inactivo'?0.55:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'var(--gold)' }}>
                    {e.nombre.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{e.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{e.cargo_actual} · {e.carrito_actual} · {e.pin ? `PIN: ${e.pin}` : 'Sin PIN asignado'}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(e.salario_actual)}</div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background: e.estado==='activo'?'var(--green-dim)':'rgba(255,255,255,0.05)', color: e.estado==='activo'?'var(--green)':'var(--text4)' }}>
                    {e.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && <ModalNuevoEmpleado onClose={()=>setModalNuevo(false)} onSaved={()=>{setModalNuevo(false); cargar()}} />}
      {empleadoSel && <PanelEmpleado empleado={empleadoSel} onClose={()=>setEmpleadoSel(null)} onRefresh={cargar} />}
    </>
  )
}
