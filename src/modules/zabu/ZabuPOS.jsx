import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRODUCTOS = [
  { id:'zabu',     nombre:'ZABÚ',     desc:'El original',       precioSolo:17000, precioCombo:20000, emoji:'🌭' },
  { id:'cheezabu', nombre:'CheeZabú', desc:'Con queso cheddar', precioSolo:19000, precioCombo:22000, emoji:'🧀' },
]

const SALCHICHAS = [
  { id:'pavo',       nombre:'Pavo',       desc:'TurkeyLink™',  emoji:'🦃' },
  { id:'hotdog',     nombre:'Hot Dog',    desc:'Sabor clásico', emoji:'🌭' },
  { id:'alemana',    nombre:'Alemana',    desc:'Ahumada',       emoji:'🥩' },
  { id:'parisienne', nombre:'Parisienne', desc:'Suiza suave',   emoji:'⭐' },
]

const BEBIDAS = [
  { id:'coca',        nombre:'Coca Cola',       precio:3000, emoji:'🥤', color:'#e05252' },
  { id:'colaroman',   nombre:'Cola Román',       precio:3000, emoji:'🥤', color:'#9C27B0' },
  { id:'quatro',      nombre:'Quatro Toronja',   precio:3000, emoji:'🥤', color:'#FF9800' },
  { id:'cokazero',    nombre:'Coca Cola Zero',   precio:3000, emoji:'🥤', color:'#333'    },
  { id:'aquaman',     nombre:'Aqua Manzana',     precio:3000, emoji:'💧', color:'#4caf50' },
  { id:'postonaranja',nombre:'Postobón Naranja', precio:3000, emoji:'🍊', color:'#FF9800' },
  { id:'postomanz',   nombre:'Postobón Manzana', precio:3000, emoji:'🍏', color:'#4caf50' },
  { id:'postouva',    nombre:'Postobón Uva',     precio:3000, emoji:'🍇', color:'#9C27B0' },
  { id:'postcol',     nombre:'Colombiana',       precio:3000, emoji:'🥤', color:'#C9A84C' },
  { id:'hatsu',       nombre:'Té Hatsu',         precio:5000, emoji:'🍵', color:'#4caf50' },
  { id:'agua',        nombre:'Agua 500ml',       precio:2000, emoji:'💧', color:'#378ADD' },
]

const EXTRAS = [
  { id:'tocineta', nombre:'Tocineta',      precio:3000, emoji:'🥓' },
  { id:'pina',     nombre:'Piña',          precio:2000, emoji:'🍍' },
  { id:'queso',    nombre:'Queso Cheddar', precio:3000, emoji:'🧀' },
]

const UTENSILIOS = {
  aqui:      ['Porta perro', 'Servilletas', 'Porta Cream Code papel'],
  llevar:    ['Caja gaveta', 'Servilletas', 'Porta Cream Code plástico', 'Bolsa', 'Sticker'],
  domicilio: ['Caja gaveta', 'Servilletas', 'Porta Cream Code plástico', 'Bolsa', 'Sticker'],
}

function cop(n) {
  if (!n) return '$0'
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function getOrdenNum(orden) {
  if (!orden) return '#000'
  if (typeof orden === 'object' && orden.codigo) return orden.codigo
  const num = typeof orden === 'number' ? orden : orden.num || 0
  return '#' + String(num).padStart(3, '0')
}

function nuevoItem() {
  return { id: Date.now(), producto:null, salchicha:null, tipo:null, bebida:null, extras:[], bebidaSuelta:null, paso:1 }
}

function precioItem(item) {
  if (!item.producto || !item.tipo) return 0
  const base = item.tipo === 'solo' ? item.producto.precioSolo : item.producto.precioCombo
  return base + item.extras.reduce((s,e) => s+e.precio, 0) + (item.bebidaSuelta?.precio || 0)
}

function ItemConstructor({ item, onChange, onAgregar, onEliminar, esUltimo, isMobile }) {
  const PASOS_LABEL = ['Producto','Salchicha','Tipo','Extras']
  const pasoNum = item.paso === 'bebida' ? 3 : (typeof item.paso === 'number' ? item.paso : 1)

  const card = (sel, color) => ({
    padding: isMobile ? 10 : 14,
    borderRadius:12, cursor:'pointer', transition:'all .15s',
    border:`1px solid ${sel ? (color||'var(--gold-border)') : 'var(--border)'}`,
    background: sel ? (color ? color+'22' : 'rgba(201,168,76,0.1)') : 'rgba(255,255,255,0.03)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:5, textAlign:'center',
  })

  const toggleExtra = (e) => {
    const existe = item.extras.find(x => x.id === e.id)
    onChange({ ...item, extras: existe ? item.extras.filter(x=>x.id!==e.id) : [...item.extras, e] })
  }

  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{item.producto?.emoji || '🌭'}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
              {item.producto ? item.producto.nombre : 'Nuevo item'}
              {item.salchicha ? ` · ${item.salchicha.nombre}` : ''}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>
              {item.tipo === 'solo' ? 'Solo' : item.tipo === 'combo' ? 'Combo' : 'Configurando...'}
              {item.bebida ? ` · ${item.bebida.nombre}` : ''}
              {item.extras.length > 0 ? ` · ${item.extras.map(e=>e.nombre).join(', ')}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {precioItem(item) > 0 && <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>}
          <div onClick={onEliminar} style={{ width:26, height:26, borderRadius:7, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, padding:'8px 14px', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
        {PASOS_LABEL.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            <div onClick={() => pasoNum > i+1 && onChange({...item, paso:i+1})}
              style={{ display:'flex', alignItems:'center', gap:4, cursor: pasoNum > i+1 ? 'pointer' : 'default' }}>
              <div style={{ width:20, height:20, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
                background: pasoNum > i+1 ? 'var(--green-dim)' : pasoNum === i+1 ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
                color: pasoNum > i+1 ? 'var(--green)' : pasoNum === i+1 ? 'var(--gold)' : 'var(--text4)',
                border:`0.5px solid ${pasoNum > i+1 ? 'var(--green-border)' : pasoNum === i+1 ? 'var(--gold-border)' : 'rgba(255,255,255,0.08)'}`,
              }}>{pasoNum > i+1 ? '✓' : i+1}</div>
              <span style={{ fontSize:10, color: pasoNum > i+1 ? 'var(--green)' : pasoNum === i+1 ? 'var(--gold)' : 'var(--text4)', fontWeight: pasoNum === i+1 ? 700 : 400 }}>{s}</span>
            </div>
            {i < 3 && <div style={{ width:10, height:1, background:'var(--border)' }} />}
          </div>
        ))}
      </div>

      <div style={{ padding:'12px 14px' }}>
        {item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {PRODUCTOS.map(p => (
              <div key={p.id} onClick={() => onChange({...item, producto:p, paso:2})} style={card(false)}>
                <div style={{ fontSize:isMobile?28:36 }}>{p.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{p.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{p.desc}</div>
                <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700 }}>{cop(p.precioSolo)} · {cop(p.precioCombo)}</div>
              </div>
            ))}
          </div>
        )}
        {item.paso === 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SALCHICHAS.map(s => (
              <div key={s.id} onClick={() => onChange({...item, salchicha:s, paso:3})} style={card(item.salchicha?.id===s.id)}>
                <div style={{ fontSize:isMobile?24:28 }}>{s.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{s.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
        {item.paso === 3 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div onClick={() => onChange({...item, tipo:'solo', bebida:null, paso:4})} style={card(item.tipo==='solo')}>
              <div style={{ fontSize:isMobile?28:32 }}>🌭</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Solo</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>Solo el perro</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(item.producto?.precioSolo)}</div>
            </div>
            <div onClick={() => onChange({...item, tipo:'combo', paso:'bebida'})} style={card(item.tipo==='combo')}>
              <div style={{ fontSize:isMobile?28:32 }}>🥤</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Combo</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>Perro + bebida</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(item.producto?.precioCombo)}</div>
            </div>
          </div>
        )}
        {item.paso === 'bebida' && (
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>SELECCIONA LA BEBIDA DEL COMBO</div>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8, marginBottom:12 }}>
              {BEBIDAS.map(b => (
                <div key={b.id} onClick={() => onChange({...item, bebida:b, paso:4})} style={card(item.bebida?.id===b.id, b.color)}>
                  <div style={{ fontSize:isMobile?20:24 }}>{b.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{b.nombre}</div>
                  <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
                </div>
              ))}
            </div>
            <button className="btn" style={{ width:'100%' }} onClick={() => onChange({...item, paso:3})}>← Volver</button>
          </div>
        )}
        {item.paso === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>EXTRAS (opcional)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {EXTRAS.map(e => {
                  const sel = item.extras.find(x=>x.id===e.id)
                  return (
                    <div key={e.id} onClick={() => toggleExtra(e)} style={card(!!sel)}>
                      <div style={{ fontSize:isMobile?22:28 }}>{e.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
                      <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>+{cop(e.precio)}</div>
                      {sel && <div style={{ fontSize:10, color:'var(--gold)' }}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>BEBIDA SUELTA (opcional)</div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8 }}>
                {BEBIDAS.map(b => (
                  <div key={b.id} onClick={() => onChange({...item, bebidaSuelta: item.bebidaSuelta?.id===b.id ? null : b})} style={card(item.bebidaSuelta?.id===b.id, b.color)}>
                    <div style={{ fontSize:isMobile?18:22 }}>{b.emoji}</div>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{b.nombre}</div>
                    <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-gold" style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700 }}
              onClick={() => onChange({...item, paso:5})}>
              ✓ Listo · {cop(precioItem(item))}
            </button>
          </div>
        )}
        {item.paso === 5 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, color:'var(--green)', fontWeight:700 }}>✓ Item completo</div>
            {esUltimo && (
              <button onClick={onAgregar} style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, background:'rgba(55,138,221,0.1)', border:'0.5px solid rgba(55,138,221,0.3)', color:'var(--blue)', fontFamily:'inherit' }}>
                + Otro item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PantallaCliente({ items, totalPrecio, confirmado, orden }) {
  if (confirmado && orden) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0a0a0a', padding:20 }}>
        <div style={{ fontSize:48, marginBottom:10 }}>✅</div>
        <div style={{ fontSize:24, fontWeight:900, color:'var(--gold)', marginBottom:4 }}>{getOrdenNum(orden.num)}</div>
        {orden.nombreCliente && <div style={{ fontSize:16, color:'var(--text2)', fontWeight:600, marginBottom:4 }}>{orden.nombreCliente}</div>}
        <div style={{ fontSize:14, fontWeight:700, color:'var(--green)', marginBottom:10 }}>¡Gracias!</div>
        <div style={{ fontSize:28, fontWeight:900, color:'var(--gold)', marginBottom:6 }}>{cop(orden.total)}</div>
        <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginBottom:12 }}>
          {orden.pagos.map((p,i) => <div key={i}>{p.metodo==='efectivo'?'💵':p.metodo==='qr'?'📲':'💳'} {cop(p.monto)}</div>)}
          {orden.cambio > 0 && <div style={{ color:'var(--green)', fontWeight:700 }}>Cambio: {cop(orden.cambio)}</div>}
        </div>
        <div style={{ padding:'6px 16px', borderRadius:20, background:'var(--green-dim)', border:'1px solid var(--green-border)', fontSize:12, color:'var(--green)', fontWeight:600 }}>
          {orden.entrega==='aqui'?'🪑 Comer aquí':orden.entrega==='llevar'?'🛍 Para llevar':'🛵 Domicilio'}
        </div>
        <div style={{ marginTop:20, fontSize:9, color:'var(--text4)', letterSpacing:2 }}>HOT DOGS DE VERDAD</div>
      </div>
    )
  }
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#0a0a0a' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'#111', textAlign:'center' }}>
        <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:3, fontWeight:600 }}>ZABÚ</div>
        <div style={{ fontSize:10, color:'var(--text3)' }}>HOT DOGS DE VERDAD</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
        {items.length === 0 || !items[0].producto ? (
          <div style={{ textAlign:'center', paddingTop:40 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Bienvenido a ZABÚ</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Tu orden aparecerá aquí</div>
          </div>
        ) : items.filter(i=>i.producto).map((item) => (
          <div key={item.id} style={{ background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)', padding:'10px 12px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.producto.emoji} {item.producto.nombre}</div>
                {item.salchicha && <div style={{ fontSize:11, color:'var(--text3)' }}>🥩 {item.salchicha.nombre}</div>}
                {item.tipo && <div style={{ fontSize:11, color:'var(--text3)' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>}
                {item.extras.map(e=><div key={e.id} style={{ fontSize:10, color:'var(--text3)' }}>+ {e.nombre}</div>)}
                {item.bebidaSuelta && <div style={{ fontSize:10, color:'var(--text3)' }}>🥤 {item.bebidaSuelta.nombre}</div>}
              </div>
              {precioItem(item)>0 && <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</div>}
            </div>
          </div>
        ))}
      </div>
      {totalPrecio > 0 && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'#111' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Total</span>
            <span style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>{cop(totalPrecio)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Ticket({ orden, onCerrar }) {
  const [telInput, setTelInput] = useState('')
  const [enviado,  setEnviado]  = useState(false)

  const textoWsp = `🌭 *ZABÚ* — Orden ${getOrdenNum(orden.num)}
${orden.nombreCliente ? `Cliente: ${orden.nombreCliente}\n` : ''}${orden.items.map(item =>
    `▸ ${item.producto.nombre} · ${item.salchicha.nombre} · ${item.tipo==='solo'?'Solo':'Combo'}${item.bebida?` (${item.bebida.nombre})`:''}${item.extras.length>0?'\n  + '+item.extras.map(e=>e.nombre).join(', '):''}${item.bebidaSuelta?`\n  🥤 ${item.bebidaSuelta.nombre}`:''} — ${cop(precioItem(item))}`
  ).join('\n')}

💰 *Total: ${cop(orden.total)}*
${orden.pagos.map(p=>`${p.metodo==='efectivo'?'💵 Efectivo':p.metodo==='qr'?'📲 QR':'💳 Tarjeta'}: ${cop(p.monto)}`).join('\n')}${orden.cambio>0?`\nCambio: ${cop(orden.cambio)}`:''}

${orden.entrega==='aqui'?'🪑 Comer aquí':orden.entrega==='llevar'?'🛍 Para llevar':'🛵 Domicilio'}${orden.direccion?`\n📍 ${orden.direccion}`:''}
¡Gracias por tu visita! 🌭`

  const enviarWhatsApp = (tel) => {
    const num = `57${(tel||'').replace(/\D/g,'')}`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(textoWsp)}`, '_blank')
    setEnviado(true)
    setTimeout(() => onCerrar(), 1500)
  }

  const descargarPDF = () => {
    window.print()
    setEnviado(true)
    setTimeout(() => onCerrar(), 2000)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, gap:16, flexWrap:'wrap', padding:16 }}>
      <div id="ticket-print" style={{ background:'#fff', borderRadius:12, padding:'18px 16px', width:260, color:'#111', fontFamily:'monospace', fontSize:11 }}>
        <div style={{ textAlign:'center', borderBottom:'1px dashed #ccc', paddingBottom:8, marginBottom:8 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#C9A84C', letterSpacing:2 }}>ZABÚ</div>
          <div style={{ fontSize:9, color:'#888' }}>HOT DOGS DE VERDAD</div>
          <div style={{ fontSize:9, color:'#888', marginTop:2 }}>{new Date().toLocaleDateString('es-CO')} · {new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontWeight:800 }}>{orden.codigo || getOrdenNum(orden.num)}</span>
          </div>
          {orden.nombreCliente && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ color:'#888' }}>Cliente</span><span style={{ fontWeight:700 }}>{orden.nombreCliente}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#888' }}>Entrega</span>
            <span style={{ fontWeight:600 }}>{orden.entrega==='aqui'?'Aquí':orden.entrega==='llevar'?'Llevar':'Domicilio'}</span>
          </div>
          {orden.direccion && <div style={{ fontSize:10, color:'#888', marginTop:2 }}>📍 {orden.direccion}</div>}
        </div>
        <div style={{ borderTop:'1px dashed #ccc', paddingTop:8, marginBottom:8 }}>
          {orden.items.map((item,i) => (
            <div key={i} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                <span>{item.producto.nombre} · {item.salchicha.nombre}</span>
                <span>{cop(precioItem(item))}</span>
              </div>
              <div style={{ color:'#555', paddingLeft:6, fontSize:10 }}>
                {item.tipo==='solo'?'Solo':'Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}
                {item.extras.map(e=><div key={e.id}>+ {e.nombre} {cop(e.precio)}</div>)}
                {item.bebidaSuelta && <div>🥤 {item.bebidaSuelta.nombre} {cop(item.bebidaSuelta.precio)}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'2px solid #111', paddingTop:6, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800 }}>
            <span>TOTAL</span><span style={{ color:'#C9A84C' }}>{cop(orden.total)}</span>
          </div>
          {orden.pagos.map((p,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', color:'#888', fontSize:10 }}>
              <span>{p.metodo==='efectivo'?'💵 Efectivo':p.metodo==='qr'?'📲 QR':'💳 Tarjeta'}</span>
              <span>{cop(p.monto)}</span>
            </div>
          ))}
          {orden.cambio > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', color:'#2e7d32', fontWeight:700, fontSize:11, marginTop:2 }}>
              <span>Cambio</span><span>{cop(orden.cambio)}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign:'center', fontSize:9, color:'#aaa', borderTop:'1px dashed #ccc', paddingTop:6 }}>
          ¡Gracias! · @zabuhotdogs
        </div>
      </div>

      <div style={{ background:'#1a1a1a', borderRadius:12, padding:'18px 16px', width:220, border:'2px solid #C9A84C' }}>
        <div style={{ textAlign:'center', borderBottom:'1px dashed #444', paddingBottom:10, marginBottom:12 }}>
          <div style={{ fontSize:10, color:'#C9A84C', letterSpacing:2, fontWeight:600 }}>COMANDA</div>
          <div style={{ fontSize:32, fontWeight:900, color:'#fff', letterSpacing:-1 }}>{orden.codigo || getOrdenNum(orden.num)}</div>
          {orden.nombreCliente && <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700, marginTop:2 }}>{orden.nombreCliente}</div>}
          <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        {orden.items.map((item,i) => (
          <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:'1px dashed #333' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{item.producto.emoji} {item.producto.nombre}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>🥩 {item.salchicha.nombre}</div>
            <div style={{ fontSize:11, color:'#888' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>
            {item.extras.map(e=><div key={e.id} style={{ fontSize:12, color:'#fff' }}>+ {e.nombre}</div>)}
            {item.bebidaSuelta && <div style={{ fontSize:11, color:'#888' }}>🥤 {item.bebidaSuelta.nombre}</div>}
          </div>
        ))}
        <div style={{ fontSize:12, fontWeight:700, marginTop:6, color: orden.entrega==='aqui'?'#4caf50':orden.entrega==='llevar'?'#C9A84C':'#378ADD' }}>
          {orden.entrega==='aqui'?'🪑 Comer aquí':orden.entrega==='llevar'?'🛍 Para llevar':'🛵 Domicilio'}
        </div>
        {orden.direccion && <div style={{ fontSize:10, color:'#888', marginTop:3 }}>📍 {orden.direccion}</div>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, width:220 }}>
        {enviado ? (
          <div style={{ textAlign:'center', padding:'20px', background:'var(--green-dim)', borderRadius:12, border:'1px solid var(--green-border)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>Listo</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Volviendo al inicio...</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:4, textAlign:'center' }}>Enviar al cliente</div>
            {orden.telefono ? (
              <button onClick={() => enviarWhatsApp(orden.telefono)} style={{ padding:'14px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:800, background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.4)', color:'#25D366', fontFamily:'inherit' }}>
                📱 Enviar WhatsApp
              </button>
            ) : (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textAlign:'center' }}>Número del cliente</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input type="tel" value={telInput} onChange={e => setTelInput(e.target.value)} placeholder="300 000 0000"
                    onKeyDown={e => e.key==='Enter' && telInput && enviarWhatsApp(telInput)}
                    style={{ flex:1, padding:'10px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                  <button onClick={() => telInput && enviarWhatsApp(telInput)}
                    style={{ padding:'10px 14px', borderRadius:8, cursor:'pointer', fontSize:18, background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.4)', color:'#25D366' }}>→</button>
                </div>
              </div>
            )}
            <button onClick={descargarPDF} style={{ padding:'12px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'rgba(55,138,221,0.1)', border:'1px solid rgba(55,138,221,0.3)', color:'var(--blue)', fontFamily:'inherit' }}>
              📄 Descargar PDF
            </button>
            {orden.entrega === 'aqui' && (
              <button onClick={() => onCerrar()} style={{ padding:'10px', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>
                ✓ Listo, sin envío
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ZabuPOS({ usuario }) {
  const [items,           setItems]           = useState([nuevoItem()])
  const [fasePago,        setFasePago]        = useState(false)
  const [entrega,         setEntrega]         = useState(null)
  const [nombreCliente,   setNombreCliente]   = useState('')
  const [direccion,       setDireccion]       = useState('')
  const [telefono,        setTelefono]        = useState('')
  const [pagos,           setPagos]           = useState([{metodo:'efectivo', monto:''}])
  const [ventas,          setVentas]          = useState([])
  const [ordenNum,        setOrdenNum]        = useState(1)
  const [ordenActual,     setOrdenActual]     = useState(null)
  const [confirmado,      setConfirmado]      = useState(false)
  const [ordenConfirmada, setOrdenConfirmada] = useState(null)

  const isMobile       = window.innerWidth < 768
  const totalPrecio    = items.reduce((s,i) => s+precioItem(i), 0)
  const itemsCompletos = items.filter(i => i.paso === 5)
  const todosCompletos = items.length > 0 && items.every(i => i.paso === 5)
  const totalPagado    = pagos.reduce((s,p) => s+(parseFloat(p.monto)||0), 0)
  const cambio         = Math.max(0, totalPagado - totalPrecio)
  const pagoCompleto   = totalPagado >= totalPrecio
  const totalSesion    = ventas.reduce((s,v)=>s+v.total,0)

  const updateItem   = (id, newItem) => setItems(prev => prev.map(i => i.id===id ? newItem : i))
  const agregarItem  = () => setItems(prev => [...prev, nuevoItem()])
  const eliminarItem = (id) => setItems(prev => prev.length > 1 ? prev.filter(i=>i.id!==id) : prev)
  const updatePago   = (i, f, v) => setPagos(prev => prev.map((p,j) => j===i ? {...p,[f]:v} : p))

  const CARRITO_ID = usuario?.carrito || 'C01'

  const getNextConsecutivo = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.rpc('incrementar_consecutivo', {
      p_carrito: CARRITO_ID, p_fecha: hoy,
    })
    if (error || !data) {
      return { num: ordenNum, codigo: `ZB-${CARRITO_ID}-${String(ordenNum).padStart(3,'0')}` }
    }
    return { num: data, codigo: `ZB-${CARRITO_ID}-${String(data).padStart(3,'0')}` }
  }

  const confirmar = async () => {
    const { num, codigo } = await getNextConsecutivo()
    const orden = {
      num, codigo, items: itemsCompletos, total: totalPrecio,
      entrega, nombreCliente, direccion, telefono, pagos, cambio,
      utensilios: UTENSILIOS[entrega]||[],
      hora: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
    }
    await supabase.from('ordenes').insert({
      num, carrito_id: CARRITO_ID, items: itemsCompletos,
      entrega, nombre_cliente: nombreCliente, direccion, telefono,
      pagos, total: totalPrecio, cambio, estado:'pendiente',
      hora: orden.hora, fecha: new Date().toISOString().split('T')[0],
    })
    await supabase.from('movimientos').insert({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Venta ${codigo} — ${itemsCompletos.length} item(s)`,
      tipo:'ingreso', categoria:'Ventas', monto: totalPrecio,
      carrito: CARRITO_ID, carrito_id: CARRITO_ID,
    })
    setVentas(prev => [orden, ...prev])
    setOrdenConfirmada(orden)
    setOrdenActual(orden)
    setConfirmado(true)
    setOrdenNum(num + 1)
  }

  const reset = () => {
    setItems([nuevoItem()]); setFasePago(false); setEntrega(null)
    setNombreCliente(''); setDireccion(''); setTelefono('')
    setPagos([{metodo:'efectivo',monto:''}])
    setConfirmado(false); setOrdenConfirmada(null); setOrdenActual(null)
  }

  const cardBase = {
    padding:12, borderRadius:12, cursor:'pointer', transition:'all .15s',
    border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:6, textAlign:'center',
  }

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
  }

  return (
    <>
      {ordenActual && confirmado && (
        <Ticket orden={ordenActual} onCerrar={() => { setOrdenActual(null); reset() }} />
      )}
      <div className="grid-4" style={{ marginBottom:14 }}>
        {[
          { label:'Ventas sesión', val:cop(totalSesion),             color:'var(--gold)',  sub:`${ventas.length} órdenes`   },
          { label:'Items orden',   val:String(itemsCompletos.length), color:'var(--text)',  sub:`de ${items.length} totales` },
          { label:'Total orden',   val:cop(totalPrecio),              color:totalPrecio>0?'var(--gold)':'var(--text4)', sub:'acumulado' },
          { label:'Meta',          val:`${ventas.length}/36`,         color:ventas.length>=36?'var(--green)':'var(--text)', sub:'equilibrio' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color, fontSize:isMobile?16:20 }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{
        display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
        gap:0, height: isMobile ? 'auto' : 'calc(100vh - 180px)',
        borderRadius:14, overflow: isMobile ? 'visible' : 'hidden', border:'1px solid var(--border)',
      }}>
        <div style={{ overflowY:'auto', padding:isMobile?'12px':'16px 20px', borderRight:isMobile?'none':'1px solid var(--border)', background:'var(--bg)', borderBottom:isMobile?'1px solid var(--border)':'none' }}>
          {!fasePago ? (
            <>
              {items.map((item, i) => (
                <ItemConstructor key={item.id} item={item}
                  onChange={(newItem) => updateItem(item.id, newItem)}
                  onAgregar={agregarItem}
                  onEliminar={() => eliminarItem(item.id)}
                  esUltimo={i === items.length-1}
                  isMobile={isMobile}
                />
              ))}
              {todosCompletos && (
                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button onClick={agregarItem} style={{ flex:1, padding:'11px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'rgba(55,138,221,0.1)', border:'0.5px solid rgba(55,138,221,0.3)', color:'var(--blue)', fontFamily:'inherit' }}>+ Otro</button>
                  <button onClick={() => setFasePago(true)} style={{ flex:3, padding:'11px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:800, background:'rgba(201,168,76,0.15)', border:'1px solid var(--gold-border)', color:'var(--gold)', fontFamily:'inherit' }}>
                    Pagar · {cop(totalPrecio)} →
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setFasePago(false)} style={{ fontSize:12, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:14 }}>← Volver a editar</button>
              <div className="panel" style={{ marginBottom:12 }}>
                <div className="panel-title">Resumen</div>
                {itemsCompletos.map((item,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>
                      {item.producto.nombre} · {item.salchicha.nombre} · {item.tipo==='solo'?'Solo':'Combo'}
                      {item.extras.length>0?` + ${item.extras.map(e=>e.nombre).join(', ')}` : ''}
                    </span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, marginTop:4 }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(totalPrecio)}</span>
                </div>
              </div>
              <div className="panel" style={{ marginBottom:12 }}>
                <div className="panel-title">¿Cómo se entrega?</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                  {[
                    {id:'aqui',label:'Aquí',emoji:'🪑',color:'var(--green)'},
                    {id:'llevar',label:'Llevar',emoji:'🛍',color:'var(--gold)'},
                    {id:'domicilio',label:'Domicilio',emoji:'🛵',color:'var(--blue)'},
                  ].map(t => (
                    <div key={t.id} onClick={() => setEntrega(t.id)} style={{ ...cardBase, border:`1px solid ${entrega===t.id?t.color+'66':'var(--border)'}`, background:entrega===t.id?t.color+'15':'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize:24 }}>{t.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:entrega===t.id?t.color:'var(--text)' }}>{t.label}</div>
                    </div>
                  ))}
                </div>
                {entrega && (
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Nombre (opcional)</div>
                    <input type="text" value={nombreCliente} onChange={e=>setNombreCliente(e.target.value)} placeholder="Nombre del cliente" style={inputStyle} />
                  </div>
                )}
                {entrega === 'domicilio' && (
                  <>
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>Dirección</div>
                      <input type="text" value={direccion} onChange={e=>setDireccion(e.target.value)} placeholder="Dirección de entrega" style={inputStyle} />
                    </div>
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>Teléfono</div>
                      <input type="tel" value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="300 000 0000" style={inputStyle} />
                    </div>
                  </>
                )}
                {entrega && (
                  <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:1, marginBottom:4 }}>UTENSILIOS</div>
                    {(UTENSILIOS[entrega]||[]).map((u,i) => <div key={i} style={{ fontSize:11, color:'var(--text3)' }}>· {u}</div>)}
                  </div>
                )}
              </div>
              {entrega && (
                <div className="panel" style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div className="panel-title" style={{ marginBottom:0 }}>Método de pago</div>
                    <button onClick={() => setPagos(prev=>[...prev,{metodo:'efectivo',monto:''}])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', color:'var(--text3)', fontFamily:'inherit' }}>+ Mixto</button>
                  </div>
                  {pagos.map((p,i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {[{id:'efectivo',emoji:'💵'},{id:'qr',emoji:'📲'},{id:'tarjeta',emoji:'💳'}].map(m => (
                          <div key={m.id} onClick={() => updatePago(i,'metodo',m.id)} style={{ flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer', textAlign:'center', background:p.metodo===m.id?'var(--gold-dim)':'rgba(255,255,255,0.04)', border:`0.5px solid ${p.metodo===m.id?'var(--gold-border)':'var(--border)'}`, fontSize:18 }}>{m.emoji}</div>
                        ))}
                      </div>
                      <input type="number" value={p.monto} onChange={e=>updatePago(i,'monto',e.target.value)} placeholder={i===0?`${totalPrecio}`:'Monto'}
                        style={{ padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, fontFamily:'inherit', outline:'none' }} />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    {[5000,10000,20000,50000,100000].map(v => (
                      <div key={v} onClick={() => { const idx=pagos.findIndex(p=>p.metodo==='efectivo'); if(idx>=0) updatePago(idx,'monto',String(v)) }}
                        style={{ padding:'5px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text3)' }}>{cop(v)}</div>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'1px solid var(--border)' }}>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>Pagado</span>
                    <span style={{ fontSize:14, fontWeight:700, color:pagoCompleto?'var(--green)':'var(--red)' }}>{cop(totalPagado)}</span>
                  </div>
                  {cambio > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 12px', background:'var(--green-dim)', borderRadius:8, border:'1px solid var(--green-border)', marginTop:6 }}>
                      <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>💰 Cambio</span>
                      <span style={{ fontSize:18, fontWeight:800, color:'var(--green)' }}>{cop(cambio)}</span>
                    </div>
                  )}
                </div>
              )}
              {entrega && pagoCompleto && (
                <button className="btn-green" onClick={confirmar} style={{ fontSize:15, fontWeight:800 }}>✓ Confirmar · {cop(totalPrecio)}</button>
              )}
              <button className="btn" style={{ width:'100%', marginTop:8 }} onClick={reset}>Cancelar</button>
            </>
          )}
        </div>
        {!isMobile && (
          <PantallaCliente items={items} totalPrecio={totalPrecio} confirmado={confirmado} orden={ordenConfirmada} />
        )}
      </div>
      {ventas.length > 0 && (
        <div className="panel" style={{ marginTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div className="panel-title" style={{ marginBottom:0 }}>Sesión</div>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(totalSesion)}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {ventas.map(v => (
              <div key={v.num} style={{ padding:'6px 12px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--gold)' }}>{getOrdenNum(v.num)}</span>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>{v.items.length} item{v.items.length>1?'s':''}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{cop(v.total)}</span>
                  <span style={{ fontSize:11 }}>{v.entrega==='aqui'?'🪑':v.entrega==='llevar'?'🛍':'🛵'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
