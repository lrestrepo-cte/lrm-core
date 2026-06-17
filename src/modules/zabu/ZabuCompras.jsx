// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}

const CATEGORIAS = ['pan','salsa','proteina','topping','queso','empaque','bebida']
const CATEGORIA_LABEL = { pan:'Pan', salsa:'Salsa', proteina:'Proteína', topping:'Topping', queso:'Queso', empaque:'Empaque', bebida:'Bebida' }

function nuevaLinea() {
  return { producto_nombre:'', categoria:'pan', cantidad:'', unidad:'unidades', costo_unitario:'', fecha_vencimiento:'' }
}

export default function ZabuCompras() {
  const [compras, setCompras] = useState([])
  const [productosExistentes, setProductosExistentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  const [proveedor, setProveedor] = useState('')
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0])
  const [ubicacion, setUbicacion] = useState('C01')
  const [metodoPago, setMetodoPago] = useState('caja') // 'caja' | 'bancos' | 'credito'
  const [lineas, setLineas] = useState([nuevaLinea()])
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const [{ data: lotes }] = await Promise.all([
      supabase.from('zabu_lotes').select('producto_nombre').order('producto_nombre'),
    ])
    setProductosExistentes([...new Set((lotes||[]).map(l=>l.producto_nombre))])
    // Historial de compras: lo derivamos de asientos con descripción que empiece "Compra —"
    const { data: asientosCompra } = await supabase
      .from('asientos').select('*, partidas(*)')
      .ilike('descripcion', 'Compra —%')
      .order('fecha', { ascending: false })
      .limit(30)
    setCompras(asientosCompra || [])
    setLoading(false)
  }

  const actualizarLinea = (i, campo, valor) => setLineas(prev => prev.map((l,idx) => idx===i ? {...l,[campo]:valor} : l))
  const agregarLinea = () => setLineas(prev => [...prev, nuevaLinea()])
  const quitarLinea = (i) => setLineas(prev => prev.filter((_,idx) => idx!==i))

  const totalCompra = lineas.reduce((s,l) => s + (parseFloat(l.cantidad)||0) * (parseInt(l.costo_unitario)||0), 0)
  const lineasValidas = lineas.filter(l => l.producto_nombre && l.cantidad && l.costo_unitario)

  const registrarCompra = async () => {
    if (lineasValidas.length === 0 || !proveedor.trim()) return
    setGuardando(true)

    // 1. Crear un lote en zabu_lotes por cada línea de la factura
    const lotesInsert = lineasValidas.map(l => ({
      producto_nombre: l.producto_nombre, categoria: l.categoria,
      cantidad_inicial: parseFloat(l.cantidad), cantidad_actual: parseFloat(l.cantidad),
      unidad: l.unidad, costo_unitario: parseInt(l.costo_unitario),
      proveedor: proveedor.trim(), ubicacion,
      fecha_compra: fechaCompra, fecha_vencimiento: l.fecha_vencimiento || null,
      estado: 'activo',
    }))
    const { error: errLotes } = await supabase.from('zabu_lotes').insert(lotesInsert)
    if (errLotes) { alert('Error al crear lotes: ' + errLotes.message); setGuardando(false); return }

    // 2. Generar el asiento contable de la compra completa
    //    Débito: Inventario (1405 materia prima / 1455 empaques según categoría predominante)
    //    Crédito: según método de pago elegido
    const cuentaCredito = metodoPago === 'caja' ? '1105' : metodoPago === 'bancos' ? '1120' : '2205'
    const nombreCuentaCredito = metodoPago === 'caja' ? 'Caja general' : metodoPago === 'bancos' ? 'Bancos — cuenta de ahorros' : 'Proveedores nacionales'

    // Si todo es empaque va a 1455, si no, a 1405 (simplificación razonable; se puede refinar por línea más adelante)
    const esTodoEmpaque = lineasValidas.every(l => l.categoria === 'empaque')
    const cuentaDebito = esTodoEmpaque ? '1455' : '1405'
    const nombreCuentaDebito = esTodoEmpaque ? 'Inventario de empaques y desechables' : 'Materias primas — insumos sin transformar'

    const descripcion = `Compra — ${proveedor.trim()} — ${lineasValidas.length} producto(s)`
    const { data: asiento, error: errAsiento } = await supabase.from('asientos').insert({
      fecha: fechaCompra, descripcion,
    }).select().single()

    if (!errAsiento && asiento) {
      await supabase.from('partidas').insert([
        { asiento_id: asiento.id, codigo: cuentaDebito, nombre: nombreCuentaDebito, debe: Math.round(totalCompra), haber: 0 },
        { asiento_id: asiento.id, codigo: cuentaCredito, nombre: nombreCuentaCredito, debe: 0, haber: Math.round(totalCompra) },
      ])
    }

    setGuardando(false)
    setResultado({ ok:true, msg: `✅ Compra registrada: ${lineasValidas.length} lote(s) creados en Inventario y asiento contable generado (${cop(totalCompra)}).` })
    setTimeout(() => {
      setModal(false); setResultado(null); setProveedor(''); setLineas([nuevaLinea()])
      cargar()
    }, 2000)
  }

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Registra una factura de compra completa — crea todos los lotes y el asiento contable en un solo paso</div>
        <button onClick={() => setModal(true)} className="btn-gold" style={{ padding:'8px 16px', fontSize:12 }}>+ Nueva compra / factura</button>
      </div>

      <div className="panel">
        <div className="panel-title">Compras registradas</div>
        {loading ? <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'20px 0' }}>Cargando...</div>
        : compras.length === 0 ? <div style={{ fontSize:13, color:'var(--text4)', textAlign:'center', padding:'30px 0' }}>Sin compras registradas todavía</div>
        : compras.map(c => {
          const total = (c.partidas||[]).reduce((s,p)=>s+p.debe,0)
          return (
            <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>{c.descripcion}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{c.fecha}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>{cop(total)}</div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:100, padding:20, overflowY:'auto' }}>
          <div style={{ background:'var(--bg2)', borderRadius:16, padding:28, width:'100%', maxWidth:720, border:'1px solid var(--border)', margin:'auto' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Nueva compra / factura</div>

            <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Proveedor</div>
                <input type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} placeholder="Ej: Surtidora Barranquilla" style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Fecha de compra</div>
                <input type="date" value={fechaCompra} onChange={e=>setFechaCompra(e.target.value)} style={iStyle} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Ubicación / Carrito destino</div>
                <select value={ubicacion} onChange={e=>setUbicacion(e.target.value)} style={iStyle}>
                  <option value="C01">Carrito 01</option><option value="C02">Carrito 02</option><option value="C03">Carrito 03</option><option value="CEDIS">CEDIS</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Método de pago</div>
                <select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} style={iStyle}>
                  <option value="caja">Caja (efectivo)</option>
                  <option value="bancos">Bancos (transferencia)</option>
                  <option value="credito">A crédito (cuenta por pagar a proveedor)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Productos de esta factura</div>
                <div onClick={agregarLinea} style={{ cursor:'pointer', fontSize:11, color:'var(--gold)' }}>+ agregar producto</div>
              </div>
              {lineas.map((l, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 0.8fr 1fr 1fr 1fr 24px', gap:6, marginBottom:6, alignItems:'center' }}>
                  <input type="text" list="productos-compra" value={l.producto_nombre} onChange={e=>actualizarLinea(i,'producto_nombre',e.target.value)} placeholder="Producto" style={{...iStyle,marginTop:0}} />
                  <select value={l.categoria} onChange={e=>actualizarLinea(i,'categoria',e.target.value)} style={{...iStyle,marginTop:0}}>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
                  </select>
                  <input type="number" value={l.cantidad} onChange={e=>actualizarLinea(i,'cantidad',e.target.value)} placeholder="Cant." style={{...iStyle,marginTop:0}} />
                  <select value={l.unidad} onChange={e=>actualizarLinea(i,'unidad',e.target.value)} style={{...iStyle,marginTop:0}}>
                    <option value="unidades">uds</option><option value="kg">kg</option><option value="g">g</option><option value="litros">L</option><option value="ml">ml</option>
                  </select>
                  <input type="number" value={l.costo_unitario} onChange={e=>actualizarLinea(i,'costo_unitario',e.target.value)} placeholder="Costo/ud" style={{...iStyle,marginTop:0}} />
                  <input type="date" value={l.fecha_vencimiento} onChange={e=>actualizarLinea(i,'fecha_vencimiento',e.target.value)} style={{...iStyle,marginTop:0,fontSize:10}} />
                  <div onClick={()=>quitarLinea(i)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14, textAlign:'center' }}>×</div>
                </div>
              ))}
              <datalist id="productos-compra">
                {productosExistentes.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg4)', borderRadius:10, marginBottom:16, marginTop:14 }}>
              <span style={{ fontSize:13, color:'var(--text3)' }}>Total de la factura</span>
              <span style={{ fontSize:18, fontWeight:800, color:'var(--gold)' }}>{cop(totalCompra)}</span>
            </div>

            <div style={{ padding:'10px 14px', background:'rgba(55,138,221,0.06)', border:'1px solid rgba(55,138,221,0.2)', borderRadius:10, fontSize:11, color:'var(--blue)', marginBottom:16 }}>
              📋 Al confirmar: se crearán {lineasValidas.length} lote(s) en Inventario y un asiento contable autom\u00e1tico — Débito Inventario {cop(totalCompra)} / Crédito {metodoPago==='caja'?'Caja':metodoPago==='bancos'?'Bancos':'Proveedores (cuenta por pagar)'}.
            </div>

            {resultado && (
              <div style={{ padding:'12px 14px', borderRadius:10, fontSize:13, fontWeight:600, marginBottom:16, background:'var(--green-dim)', color:'var(--green)', border:'1px solid var(--green-border)' }}>
                {resultado.msg}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={registrarCompra} disabled={lineasValidas.length===0||!proveedor.trim()||guardando||resultado} className="btn-green" style={{ flex:1 }}>
                {guardando ? '⏳ Registrando...' : 'Confirmar compra'}
              </button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
