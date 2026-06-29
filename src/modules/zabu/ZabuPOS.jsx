// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — HOT DOG
// ════════════════════════════════════════════════════════════════════════════
const PRODUCTOS = [
  { id:'zabu',     nombre:'ZABÚ',     desc:'El original',       precioSolo:18000, precioCombo:23000, emoji:'🌭' },
  { id:'cheezabu', nombre:'CheeZabú', desc:'Con queso cheddar', precioSolo:20000, precioCombo:25000, emoji:'🧀' },
]

const SALCHICHAS = [
  { id:'pavo',       nombre:'Pavo',       desc:'Ahumada',       emoji:'🦃' },
  { id:'hotdog',     nombre:'Hot Dog',    desc:'Sabor clásico', emoji:'🌭' },
  { id:'alemana',    nombre:'Alemana',    desc:'Estilo Múnich', emoji:'🥩' },
  { id:'parisienne', nombre:'Parisienne', desc:'Suiza suave',   emoji:'⭐' },
]

// Toppings base del hot dog — TODOS vienen activados por defecto. El cajero
// solo toca el topping que el cliente NO quiere para desactivarlo (check/uncheck),
// en vez de construir el hot dog desde cero. El precio NUNCA cambia por quitar
// un topping — es una preferencia de preparación, no un descuento.
const TOPPINGS_HOTDOG = [
  { id:'creamcode',     nombre:'Cream Code',         emoji:'🧈', porDefecto:true },
  { id:'tocineta',      nombre:'Tocineta crispy',    emoji:'🥓', porDefecto:true },
  { id:'pina',          nombre:'Piña caramelizada',  emoji:'🍍', porDefecto:true },
  { id:'papachongo',    nombre:'Papa chongo',        emoji:'🍟', porDefecto:true },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — HAMBURGUESAS ZABÚ
// ════════════════════════════════════════════════════════════════════════════
const BURGERS = [
  { id:'classic', nombre:'Classic Burger Z', desc:'Carne 60/30/10, Cream Code, tocineta', precio:25000, emoji:'🍔' },
  { id:'pina',     nombre:'Burger Z con piña', desc:'Classic + piña caramelizada',          precio:25000, emoji:'🍔' },
]

// Toppings base de la Classic Burger Z — todos por defecto. La variante "con
// piña" agrega piña caramelizada como topping adicional, también por defecto.
const TOPPINGS_BURGER_CLASSIC = [
  { id:'creamcode',     nombre:'Cream Code',             emoji:'🧈', porDefecto:true },
  { id:'tocineta',      nombre:'Tocineta crispy',        emoji:'🥓', porDefecto:true },
  { id:'quesocheddar',  nombre:'Queso cheddar',          emoji:'🧀', porDefecto:true },
  { id:'lechuga',       nombre:'Lechuga romana',         emoji:'🥬', porDefecto:true },
  { id:'mayoajo',       nombre:'Mayonesa de ajo ahumada',emoji:'🧄', porDefecto:true },
]
const TOPPINGS_BURGER_PINA = [
  ...TOPPINGS_BURGER_CLASSIC,
  { id:'pina', nombre:'Piña caramelizada', emoji:'🍍', porDefecto:true },
]

function toppingsDeBurger(burgerId) {
  return burgerId === 'pina' ? TOPPINGS_BURGER_PINA : TOPPINGS_BURGER_CLASSIC
}

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — FRIES Z (side, incluye Cream Code de fábrica)
// ════════════════════════════════════════════════════════════════════════════
const FRIES_Z = { id:'friesz', nombre:'Fries Z', desc:'Papa + sazonador ZABÚ + Cream Code', precio:7000, emoji:'🍟' }

// ════════════════════════════════════════════════════════════════════════════
// BEBIDAS Y EXTRAS — sin cambios respecto a la versión anterior
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// PLATAFORMAS DE DOMICILIO — para el modo "Pedido de Plataforma"
// ════════════════════════════════════════════════════════════════════════════
const PLATAFORMAS = [
  { id:'directo', nombre:'Directo',  emoji:'🏪', color:'#4caf50' },
  { id:'rappi',   nombre:'Rappi',    emoji:'🛵', color:'#FF441F' },
  { id:'didi',    nombre:'DiDi Food',emoji:'🚗', color:'#FF7E0E' },
]

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
  return { id: Date.now(), producto:null, salchicha:null, tipo:null, bebida:null, extras:[], bebidaSuelta:null, toppingsQuitados:[], paso:1 }
}

// Item de venta rápida — producto suelto (bebida o extra) sin pasar por el
// flujo de armado del hot dog. Se trata como un item ya "completo" (paso:5)
// desde el momento en que se agrega, porque no necesita configuración.
function nuevoItemSuelto(producto, tipo) {
  return { id: Date.now()+Math.random(), suelto:true, productoSuelto:producto, tipoSuelto:tipo, paso:5 }
}

// Item de hamburguesa — burger seleccionada con sus toppings base activados.
// burger puede ser null al crearse (selección pendiente): el item se agrega
// como "en construcción" (paso:1) y ItemBurgerCard se encarga de mostrar la
// grilla de selección hasta que el cajero elija una. Nunca se marca paso:5
// sin burger, así el resto del flujo (precioItem, toppingsActivos, render)
// nunca asume que item.burger existe cuando en realidad puede ser null.
function nuevoItemBurger(burger) {
  return { id: Date.now()+Math.random(), esBurger:true, burger: burger || null, toppingsQuitados:[], bebidaSuelta:null, paso: burger ? 5 : 1 }
}

// Item de Fries Z — producto fijo, sin pasos de armado, solo cantidad implícita
// de 1 por item (se agrega varias veces si se quieren varias unidades).
function nuevoItemFries() {
  return { id: Date.now()+Math.random(), esFries:true, paso:5 }
}

function precioItem(item) {
  if (item.suelto) return item.productoSuelto?.precio || 0
  if (item.esBurger) return (item.burger?.precio || 0) + (item.bebidaSuelta?.precio || 0)
  if (item.esFries) return FRIES_Z.precio
  if (!item.producto || !item.tipo) return 0
  const base = item.tipo === 'solo' ? item.producto.precioSolo : item.producto.precioCombo
  return base + item.extras.reduce((s,e) => s+e.precio, 0) + (item.bebidaSuelta?.precio || 0)
}

// Lista de toppings activos de un item (hot dog o burger), aplicando lo que
// el cliente quitó. Devuelve [] para items que no tienen toppings (suelto, fries,
// o burger sin elegir todavía).
function toppingsActivos(item) {
  if (item.esBurger) {
    if (!item.burger) return []
    const base = toppingsDeBurger(item.burger.id)
    return base.filter(t => !(item.toppingsQuitados||[]).includes(t.id))
  }
  if (item.producto) {
    return TOPPINGS_HOTDOG.filter(t => !(item.toppingsQuitados||[]).includes(t.id))
  }
  return []
}

// Resta el cambio del/los pago(s) en efectivo, para que lo que se registra
// como "recibido" sea el monto NETO que realmente se queda en caja — nunca
// el monto bruto que el cliente entregó antes de recibir su cambio.
function ajustarPagosNetos(pagos, cambio) {
  let cambioRestante = cambio
  return pagos.map(p => {
    if (p.metodo === 'efectivo' && cambioRestante > 0) {
      const montoActual = parseFloat(p.monto) || 0
      const descuento = Math.min(montoActual, cambioRestante)
      cambioRestante -= descuento
      return { ...p, monto: montoActual - descuento }
    }
    return { ...p, monto: parseFloat(p.monto) || 0 }
  })
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE DE TOPPINGS — componente reutilizable para hot dog y hamburguesa.
// Muestra todos los toppings del producto, activados por defecto; un toque
// los desactiva (tachado/atenuado) sin tocar el precio.
// ════════════════════════════════════════════════════════════════════════════
function ToppingsToggle({ toppings, quitados, onToggle, isMobile }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:3},1fr)`, gap:8 }}>
      {toppings.map(t => {
        const activo = !quitados.includes(t.id)
        return (
          <div key={t.id} onClick={() => onToggle(t.id)} style={{
            padding:isMobile?8:10, borderRadius:10, cursor:'pointer', textAlign:'center',
            border:`1px solid ${activo ? 'var(--green-border)' : 'var(--border)'}`,
            background: activo ? 'var(--green-dim)' : 'rgba(255,255,255,0.02)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            opacity: activo ? 1 : 0.5,
          }}>
            <div style={{ fontSize:isMobile?18:22, textDecoration: activo?'none':'line-through' }}>{t.emoji}</div>
            <div style={{ fontSize:10, fontWeight:600, color: activo?'var(--text)':'var(--text4)', textDecoration: activo?'none':'line-through' }}>{t.nombre}</div>
            <div style={{ fontSize:9, color: activo?'var(--green)':'var(--text4)', fontWeight:700 }}>{activo?'✓ Incluido':'Sin esto'}</div>
          </div>
        )
      })}
    </div>
  )
}

function VentaRapida({ onAgregar, onCerrar, isMobile }) {
  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--gold-border)', overflow:'hidden', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gold-dim)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>⚡ Venta rápida — solo bebidas y extras</div>
        <div onClick={onCerrar} style={{ width:26, height:26, borderRadius:7, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>×</div>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>BEBIDAS</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8, marginBottom:14 }}>
          {BEBIDAS.map(b => (
            <div key={b.id} onClick={() => onAgregar(b, 'bebida')} style={{
              padding:isMobile?8:10, borderRadius:10, cursor:'pointer', textAlign:'center',
              border:`1px solid ${b.color}33`, background:b.color+'11', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <div style={{ fontSize:isMobile?18:22 }}>{b.emoji}</div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.2 }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>EXTRAS SUELTOS</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {EXTRAS.map(e => (
            <div key={e.id} onClick={() => onAgregar(e, 'extra')} style={{
              padding:isMobile?8:10, borderRadius:10, cursor:'pointer', textAlign:'center',
              border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <div style={{ fontSize:isMobile?20:24 }}>{e.emoji}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(e.precio)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemSueltoCard({ item, onEliminar }) {
  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{item.productoSuelto.emoji}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.productoSuelto.nombre}</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>Venta suelta</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
        <div onClick={onEliminar} style={{ width:26, height:26, borderRadius:7, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD DE FRIES Z — sin pasos de armado, solo agregar/quitar
// ════════════════════════════════════════════════════════════════════════════
function ItemFriesCard({ item, onEliminar }) {
  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{FRIES_Z.emoji}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{FRIES_Z.nombre}</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{FRIES_Z.desc}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
        <div onClick={onEliminar} style={{ width:26, height:26, borderRadius:7, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD DE HAMBURGUESA — elegir cuál, luego personalizar toppings (todos
// activados por defecto), opcional bebida suelta. Sin pasos de tarjetas
// múltiples como el hot dog — todo en una sola tarjeta expandida.
// ════════════════════════════════════════════════════════════════════════════
function ItemBurgerCard({ item, onChange, onEliminar, isMobile }) {
  const toggleTopping = (toppingId) => {
    const quitados = item.toppingsQuitados || []
    const yaQuitado = quitados.includes(toppingId)
    onChange({ ...item, toppingsQuitados: yaQuitado ? quitados.filter(id=>id!==toppingId) : [...quitados, toppingId] })
  }

  if (!item.burger) {
    return (
      <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12, padding:'12px 14px' }}>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:10 }}>ELIGE LA HAMBURGUESA</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {BURGERS.map(b => (
            <div key={b.id} onClick={() => onChange({ ...item, burger:b, paso:5 })} style={{
              padding:isMobile?10:14, borderRadius:12, cursor:'pointer', textAlign:'center',
              border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:5,
            }}>
              <div style={{ fontSize:isMobile?28:36 }}>{b.emoji}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{b.desc}</div>
              <div style={{ fontSize:13, color:'var(--gold)', fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const toppings = toppingsDeBurger(item.burger.id)

  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{item.burger.emoji}</span>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.burger.nombre}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
          <div onClick={onEliminar} style={{ width:26, height:26, borderRadius:7, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
        </div>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>TOPPINGS (toca para quitar)</div>
        <ToppingsToggle toppings={toppings} quitados={item.toppingsQuitados||[]} onToggle={toggleTopping} isMobile={isMobile} />
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>BEBIDA SUELTA (opcional)</div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8 }}>
            {BEBIDAS.map(b => (
              <div key={b.id} onClick={() => onChange({...item, bebidaSuelta: item.bebidaSuelta?.id===b.id ? null : b})} style={{
                padding:isMobile?6:8, borderRadius:10, cursor:'pointer', textAlign:'center',
                border:`1px solid ${item.bebidaSuelta?.id===b.id ? b.color+'66' : 'var(--border)'}`,
                background: item.bebidaSuelta?.id===b.id ? b.color+'15' : 'rgba(255,255,255,0.03)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              }}>
                <div style={{ fontSize:isMobile?16:18 }}>{b.emoji}</div>
                <div style={{ fontSize:9, fontWeight:600, color:'var(--text)' }}>{b.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemConstructor({ item, onChange, onAgregar, onEliminar, esUltimo, isMobile }) {
  const PASOS_LABEL = ['Producto','Salchicha','Tipo','Toppings']
  const pasoNum = item.paso === 'bebida' ? 3 : (typeof item.paso === 'number' ? item.paso : 1)

  const toggleTopping = (toppingId) => {
    const quitados = item.toppingsQuitados || []
    const yaQuitado = quitados.includes(toppingId)
    onChange({ ...item, toppingsQuitados: yaQuitado ? quitados.filter(id=>id!==toppingId) : [...quitados, toppingId] })
  }

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
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>TOPPINGS DEL HOT DOG (toca para quitar)</div>
              <ToppingsToggle toppings={TOPPINGS_HOTDOG} quitados={item.toppingsQuitados||[]} onToggle={toggleTopping} isMobile={isMobile} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>EXTRAS ADICIONALES (con costo extra)</div>
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
        {items.length === 0 || (!items[0].producto && !items[0].suelto && !items[0].esBurger && !items[0].esFries) ? (
          <div style={{ textAlign:'center', paddingTop:40 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Bienvenido a ZABÚ</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Tu orden aparecerá aquí</div>
          </div>
        ) : items.filter(i=>i.producto || i.suelto || i.esBurger || i.esFries).map((item) => (
          <div key={item.id} style={{ background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)', padding:'10px 12px', marginBottom:8 }}>
            {item.suelto ? (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.productoSuelto.emoji} {item.productoSuelto.nombre}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</div>
              </div>
            ) : item.esFries ? (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{FRIES_Z.emoji} {FRIES_Z.nombre}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</div>
              </div>
            ) : item.esBurger ? (
              item.burger ? (
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.burger.emoji} {item.burger.nombre}</div>
                    {(item.toppingsQuitados||[]).length > 0 && (
                      <div style={{ fontSize:10, color:'var(--text3)' }}>Sin: {toppingsDeBurger(item.burger.id).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>
                    )}
                    {item.bebidaSuelta && <div style={{ fontSize:10, color:'var(--text3)' }}>🥤 {item.bebidaSuelta.nombre}</div>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</div>
                </div>
              ) : (
                <div style={{ fontSize:12, color:'var(--text3)' }}>🍔 Eligiendo hamburguesa...</div>
              )
            ) : (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.producto.emoji} {item.producto.nombre}</div>
                  {item.salchicha && <div style={{ fontSize:11, color:'var(--text3)' }}>🥩 {item.salchicha.nombre}</div>}
                  {item.tipo && <div style={{ fontSize:11, color:'var(--text3)' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>}
                  {(item.toppingsQuitados||[]).length > 0 && (
                    <div style={{ fontSize:10, color:'var(--text3)' }}>Sin: {TOPPINGS_HOTDOG.filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>
                  )}
                  {item.extras.map(e=><div key={e.id} style={{ fontSize:10, color:'var(--text3)' }}>+ {e.nombre}</div>)}
                  {item.bebidaSuelta && <div style={{ fontSize:10, color:'var(--text3)' }}>🥤 {item.bebidaSuelta.nombre}</div>}
                </div>
                {precioItem(item)>0 && <div style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</div>}
              </div>
            )}
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

function lineaItemTexto(item) {
  if (item.suelto) return `▸ ${item.productoSuelto.nombre} (suelto) — ${cop(precioItem(item))}`
  if (item.esFries) return `▸ ${FRIES_Z.nombre} — ${cop(precioItem(item))}`
  if (item.esBurger) {
    if (!item.burger) return `▸ Hamburguesa (sin elegir)`
    const quitados = (item.toppingsQuitados||[]).length > 0
      ? `\n  Sin: ${toppingsDeBurger(item.burger.id).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}` : ''
    const beb = item.bebidaSuelta ? `\n  🥤 ${item.bebidaSuelta.nombre}` : ''
    return `▸ ${item.burger.nombre}${quitados}${beb} — ${cop(precioItem(item))}`
  }
  const quitadosHotdog = (item.toppingsQuitados||[]).length > 0
    ? `\n  Sin: ${TOPPINGS_HOTDOG.filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}` : ''
  return `▸ ${item.producto.nombre} · ${item.salchicha.nombre} · ${item.tipo==='solo'?'Solo':'Combo'}${item.bebida?` (${item.bebida.nombre})`:''}${quitadosHotdog}${item.extras.length>0?'\n  + '+item.extras.map(e=>e.nombre).join(', '):''}${item.bebidaSuelta?`\n  🥤 ${item.bebidaSuelta.nombre}`:''} — ${cop(precioItem(item))}`
}

function Ticket({ orden, onCerrar }) {
  const [telInput, setTelInput] = useState('')
  const [enviado,  setEnviado]  = useState(false)

  const PLATAFORMA_INFO = PLATAFORMAS.find(p => p.id === orden.plataforma) || PLATAFORMAS[0]

  const textoWsp = `🌭 *ZABÚ* — Orden ${getOrdenNum(orden.num)}
${orden.plataforma && orden.plataforma !== 'directo' ? `Canal: ${PLATAFORMA_INFO.emoji} ${PLATAFORMA_INFO.nombre}\n` : ''}${orden.nombreCliente ? `Cliente: ${orden.nombreCliente}\n` : ''}${orden.items.map(lineaItemTexto).join('\n')}

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
            {orden.plataforma && orden.plataforma !== 'directo' && (
              <span style={{ fontSize:10, fontWeight:700, color:'#FF441F' }}>{PLATAFORMA_INFO.emoji} {PLATAFORMA_INFO.nombre}</span>
            )}
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
              {item.suelto ? (
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                  <span>{item.productoSuelto.nombre} (suelto)</span>
                  <span>{cop(precioItem(item))}</span>
                </div>
              ) : item.esFries ? (
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                  <span>{FRIES_Z.nombre}</span>
                  <span>{cop(precioItem(item))}</span>
                </div>
              ) : item.esBurger ? (
                item.burger ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                      <span>{item.burger.nombre}</span>
                      <span>{cop(precioItem(item))}</span>
                    </div>
                    {(item.toppingsQuitados||[]).length > 0 && (
                      <div style={{ color:'#555', paddingLeft:6, fontSize:10 }}>Sin: {toppingsDeBurger(item.burger.id).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>
                    )}
                    {item.bebidaSuelta && <div style={{ color:'#555', paddingLeft:6, fontSize:10 }}>🥤 {item.bebidaSuelta.nombre} {cop(item.bebidaSuelta.precio)}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight:700 }}>Hamburguesa (sin elegir)</div>
                )
              ) : (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                    <span>{item.producto.nombre} · {item.salchicha.nombre}</span>
                    <span>{cop(precioItem(item))}</span>
                  </div>
                  <div style={{ color:'#555', paddingLeft:6, fontSize:10 }}>
                    {item.tipo==='solo'?'Solo':'Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}
                    {(item.toppingsQuitados||[]).length > 0 && <div>Sin: {TOPPINGS_HOTDOG.filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>}
                    {item.extras.map(e=><div key={e.id}>+ {e.nombre} {cop(e.precio)}</div>)}
                    {item.bebidaSuelta && <div>🥤 {item.bebidaSuelta.nombre} {cop(item.bebidaSuelta.precio)}</div>}
                  </div>
                </>
              )}
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
          {orden.plataforma && orden.plataforma !== 'directo' && (
            <div style={{ fontSize:12, fontWeight:700, color:'#FF441F', marginTop:2 }}>{PLATAFORMA_INFO.emoji} {PLATAFORMA_INFO.nombre}</div>
          )}
          {orden.nombreCliente && <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700, marginTop:2 }}>{orden.nombreCliente}</div>}
          <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        {orden.items.map((item,i) => (
          <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:'1px dashed #333' }}>
            {item.suelto ? (
              <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{item.productoSuelto.emoji} {item.productoSuelto.nombre} (suelto)</div>
            ) : item.esFries ? (
              <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{FRIES_Z.emoji} {FRIES_Z.nombre}</div>
            ) : item.esBurger ? (
              item.burger ? (
                <>
                  <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{item.burger.emoji} {item.burger.nombre}</div>
                  {(item.toppingsQuitados||[]).length > 0 && <div style={{ fontSize:11, color:'#e05252' }}>SIN: {toppingsDeBurger(item.burger.id).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>}
                  {item.bebidaSuelta && <div style={{ fontSize:11, color:'#888' }}>🥤 {item.bebidaSuelta.nombre}</div>}
                </>
              ) : (
                <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>🍔 Hamburguesa (sin elegir)</div>
              )
            ) : (
              <>
                <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{item.producto.emoji} {item.producto.nombre}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>🥩 {item.salchicha.nombre}</div>
                <div style={{ fontSize:11, color:'#888' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>
                {(item.toppingsQuitados||[]).length > 0 && <div style={{ fontSize:11, color:'#e05252' }}>SIN: {TOPPINGS_HOTDOG.filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>}
                {item.extras.map(e=><div key={e.id} style={{ fontSize:12, color:'#fff' }}>+ {e.nombre}</div>)}
                {item.bebidaSuelta && <div style={{ fontSize:11, color:'#888' }}>🥤 {item.bebidaSuelta.nombre}</div>}
              </>
            )}
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

// ════════════════════════════════════════════════════════════════════════════
// MODO PEDIDO DE PLATAFORMA — pantalla aparte, simplificada. Replica el pedido
// que llegó por la app de delivery (Rappi/DiDi) en pocos toques: elegir
// plataforma, tocar productos directo de una grilla única (sin pasos de
// tarjetas), ajustar toppings con el mismo toggle, y confirmar. Se registra
// igual que una venta normal, pero con canal = la plataforma elegida, para
// que la proyección financiera pueda diferenciarlo más adelante.
// ════════════════════════════════════════════════════════════════════════════
function PedidoPlataforma({ onConfirmar, onCerrar, isMobile }) {
  const [plataforma, setPlataforma] = useState(null)
  const [itemsPlat,  setItemsPlat]  = useState([])

  const agregarHotdog = (producto) => setItemsPlat(prev => [...prev, { id:Date.now()+Math.random(), producto, salchicha:SALCHICHAS[0], tipo:'solo', bebida:null, extras:[], bebidaSuelta:null, toppingsQuitados:[], paso:5 }])
  const agregarBurger = (burger) => setItemsPlat(prev => [...prev, nuevoItemBurger(burger)])
  const agregarFries  = () => setItemsPlat(prev => [...prev, nuevoItemFries()])
  const agregarSuelto = (producto, tipo) => setItemsPlat(prev => [...prev, nuevoItemSuelto(producto, tipo)])
  const actualizarItem = (id, nuevo) => setItemsPlat(prev => prev.map(i => i.id===id ? nuevo : i))
  const eliminarItem   = (id) => setItemsPlat(prev => prev.filter(i=>i.id!==id))

  const total = itemsPlat.reduce((s,i)=>s+precioItem(i), 0)
  const colorPlat = PLATAFORMAS.find(p=>p.id===plataforma)?.color || 'var(--gold)'

  if (!plataforma) {
    return (
      <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--gold-border)', overflow:'hidden', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--gold-dim)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>📲 Pedido de Plataforma</div>
          <div onClick={onCerrar} style={{ width:26, height:26, borderRadius:7, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>×</div>
        </div>
        <div style={{ padding:'16px 14px' }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, textAlign:'center' }}>¿De dónde llegó el pedido?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {PLATAFORMAS.map(p => (
              <div key={p.id} onClick={() => setPlataforma(p.id)} style={{
                padding:isMobile?12:16, borderRadius:12, cursor:'pointer', textAlign:'center',
                border:`1px solid ${p.color}44`, background:p.color+'15',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              }}>
                <div style={{ fontSize:isMobile?28:32 }}>{p.emoji}</div>
                <div style={{ fontSize:12, fontWeight:800, color:p.color }}>{p.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:`1px solid ${colorPlat}44`, overflow:'hidden', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:colorPlat+'15' }}>
        <div style={{ fontSize:13, fontWeight:700, color:colorPlat }}>
          {PLATAFORMAS.find(p=>p.id===plataforma)?.emoji} Pedido {PLATAFORMAS.find(p=>p.id===plataforma)?.nombre}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div onClick={() => setPlataforma(null)} style={{ fontSize:11, color:'var(--text3)', cursor:'pointer' }}>Cambiar</div>
          <div onClick={onCerrar} style={{ width:26, height:26, borderRadius:7, background:'rgba(255,255,255,0.06)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>×</div>
        </div>
      </div>

      <div style={{ padding:'12px 14px' }}>
        {/* Grilla única de TODOS los productos — un toque agrega, sin pasos */}
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>TOCA PARA AGREGAR</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:8, marginBottom:16 }}>
          {PRODUCTOS.map(p => (
            <div key={p.id} onClick={() => agregarHotdog(p)} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{p.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{p.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(p.precioSolo)}</div>
            </div>
          ))}
          {BURGERS.map(b => (
            <div key={b.id} onClick={() => agregarBurger(b)} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{b.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
          <div onClick={agregarFries} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize:24 }}>{FRIES_Z.emoji}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{FRIES_Z.nombre}</div>
            <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(FRIES_Z.precio)}</div>
          </div>
          {BEBIDAS.map(b => (
            <div key={b.id} onClick={() => agregarSuelto(b,'bebida')} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:`1px solid ${b.color}33`, background:b.color+'11' }}>
              <div style={{ fontSize:24 }}>{b.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
          {EXTRAS.map(e => (
            <div key={e.id} onClick={() => agregarSuelto(e,'extra')} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{e.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{e.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(e.precio)}</div>
            </div>
          ))}
        </div>

        {/* Items ya agregados — personalización rápida de toppings inline */}
        {itemsPlat.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>EN EL PEDIDO ({itemsPlat.length})</div>
            {itemsPlat.map(item => (
              <div key={item.id} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid var(--border)', padding:'10px 12px', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: (item.producto || (item.esBurger && item.burger)) ? 8 : 0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>
                    {item.suelto ? `${item.productoSuelto.emoji} ${item.productoSuelto.nombre}` :
                     item.esFries ? `${FRIES_Z.emoji} ${FRIES_Z.nombre}` :
                     item.esBurger ? (item.burger ? `${item.burger.emoji} ${item.burger.nombre}` : '🍔 Eligiendo...') :
                     `${item.producto.emoji} ${item.producto.nombre}`}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
                    <div onClick={() => eliminarItem(item.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14 }}>×</div>
                  </div>
                </div>
                {item.esBurger && item.burger && (
                  <ToppingsToggle toppings={toppingsDeBurger(item.burger.id)} quitados={item.toppingsQuitados||[]}
                    onToggle={(id) => { const q=item.toppingsQuitados||[]; actualizarItem(item.id, {...item, toppingsQuitados: q.includes(id)?q.filter(x=>x!==id):[...q,id]}) }}
                    isMobile={isMobile} />
                )}
                {item.producto && (
                  <ToppingsToggle toppings={TOPPINGS_HOTDOG} quitados={item.toppingsQuitados||[]}
                    onToggle={(id) => { const q=item.toppingsQuitados||[]; actualizarItem(item.id, {...item, toppingsQuitados: q.includes(id)?q.filter(x=>x!==id):[...q,id]}) }}
                    isMobile={isMobile} />
                )}
              </div>
            ))}
          </div>
        )}

        {itemsPlat.length > 0 && (
          <button className="btn-gold" style={{ width:'100%', padding:'14px', fontSize:15, fontWeight:800 }}
            onClick={() => onConfirmar(plataforma, itemsPlat, total)}>
            Continuar a pago · {cop(total)} →
          </button>
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
  const [ventaRapida,     setVentaRapida]     = useState(false)
  const [modoPlataforma,  setModoPlataforma]  = useState(false)
  const [plataformaActiva,setPlataformaActiva]= useState('directo') // se fija al confirmar un pedido de plataforma

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

  // Agrega un producto suelto (bebida/extra) directo al carrito, sin pasar
  // por el flujo de armado del hot dog. Si el primer item del carrito está
  // vacío (sin producto ni suelto), lo reemplaza; si no, lo agrega aparte.
  const agregarItemSuelto = (producto, tipo) => {
    const nuevo = nuevoItemSuelto(producto, tipo)
    setItems(prev => {
      const primerVacio = prev.length === 1 && !prev[0].producto && !prev[0].suelto && !prev[0].esBurger && !prev[0].esFries
      return primerVacio ? [nuevo] : [...prev, nuevo]
    })
  }

  // Agrega una hamburguesa al carrito (reemplaza el primer item vacío, o
  // se agrega aparte si ya hay algo en construcción). Se crea SIN burger
  // elegido (nuevoItemBurger(null)) — ItemBurgerCard mostrará la grilla de
  // selección "ELIGE LA HAMBURGUESA" hasta que el cajero toque una.
  const agregarItemBurger = () => {
    const nuevo = nuevoItemBurger(null)
    setItems(prev => {
      const primerVacio = prev.length === 1 && !prev[0].producto && !prev[0].suelto && !prev[0].esBurger && !prev[0].esFries
      return primerVacio ? [nuevo] : [...prev, nuevo]
    })
  }

  const agregarItemFries = () => {
    const nuevo = nuevoItemFries()
    setItems(prev => {
      const primerVacio = prev.length === 1 && !prev[0].producto && !prev[0].suelto && !prev[0].esBurger && !prev[0].esFries
      return primerVacio ? [nuevo] : [...prev, nuevo]
    })
  }

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
    // Los pagos se guardan NETOS (después de restar el cambio) — así lo que
    // queda registrado siempre coincide con lo que realmente entra a caja,
    // sin importar con cuánto haya pagado el cliente físicamente.
    const pagosNetos = ajustarPagosNetos(pagos, cambio)
    const orden = {
      num, codigo, items: itemsCompletos.length?itemsCompletos:items, total: totalPrecio,
      entrega, nombreCliente, direccion, telefono, pagos: pagosNetos, cambio,
      utensilios: UTENSILIOS[entrega]||[], plataforma: plataformaActiva,
      hora: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
    }
    await supabase.from('ordenes').insert({
      num, carrito_id: CARRITO_ID, items: orden.items,
      entrega, nombre_cliente: nombreCliente, direccion, telefono,
      pagos: pagosNetos, total: totalPrecio, cambio, estado:'pendiente',
      canal: plataformaActiva,
      hora: orden.hora, fecha: new Date().toISOString().split('T')[0],
    })
    await supabase.from('movimientos').insert({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Venta ${codigo} — ${orden.items.length} item(s)${plataformaActiva!=='directo'?` · ${plataformaActiva}`:''}`,
      tipo:'ingreso', categoria:'Ventas', monto: totalPrecio,
      carrito: CARRITO_ID, carrito_id: CARRITO_ID,
    })

    // Genera también el asiento contable real de partida doble, para que la
    // venta se refleje en Libro Mayor / Balance General / Estado de Resultados,
    // no solo en el registro simple de "movimientos". Un débito por cada
    // método de pago usado (ya neto, sin el cambio) y un crédito total a
    // Ventas ZABÚ.
    const CODIGO_METODO = { efectivo:'1105', qr:'1112', tarjeta:'1110' }
    const NOMBRE_METODO  = { efectivo:'Caja general', qr:'Nequi/Daviplata', tarjeta:'Bancos' }

    const { data: asientoVenta } = await supabase.from('asientos').insert({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Venta ${codigo} — ${orden.items.length} item(s)`,
      carrito_id: CARRITO_ID,
    }).select().single()

    if (asientoVenta) {
      const partidasVenta = pagosNetos
        .filter(p => p.monto > 0)
        .map(p => ({
          asiento_id: asientoVenta.id,
          codigo: CODIGO_METODO[p.metodo] || '1105',
          nombre: NOMBRE_METODO[p.metodo] || 'Caja general',
          debe: p.monto, haber: 0, carrito_id: CARRITO_ID,
        }))
      partidasVenta.push({
        asiento_id: asientoVenta.id, codigo:'4106', nombre:'Ventas ZABÚ',
        debe: 0, haber: totalPrecio, carrito_id: CARRITO_ID,
      })
      await supabase.from('partidas').insert(partidasVenta)
    }

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
    setVentaRapida(false); setModoPlataforma(false); setPlataformaActiva('directo')
  }

  // Cuando se confirma un "Pedido de Plataforma": toma los items armados en
  // esa pantalla simplificada, los carga al carrito normal, fija la
  // plataforma, y entrega automáticamente de una vez (los domicilios de
  // plataforma siempre son "domicilio" — la app del repartidor lo recoge).
  const confirmarDesdePlataforma = (plataforma, itemsDePlat, total) => {
    setItems(itemsDePlat)
    setPlataformaActiva(plataforma)
    setEntrega('domicilio')
    setModoPlataforma(false)
    setFasePago(true)
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
              {!modoPlataforma && !ventaRapida && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:8 }}>
                  <div onClick={() => setVentaRapida(true)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', color:'var(--gold)' }}>
                    ⚡ Venta rápida
                  </div>
                  <div onClick={() => setModoPlataforma(true)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'rgba(255,68,31,0.1)', border:'1px solid rgba(255,68,31,0.3)', color:'#FF441F' }}>
                    📲 Pedido de Plataforma
                  </div>
                </div>
              )}
              {modoPlataforma && (
                <PedidoPlataforma isMobile={isMobile} onCerrar={() => setModoPlataforma(false)} onConfirmar={confirmarDesdePlataforma} />
              )}
              {ventaRapida && (
                <VentaRapida isMobile={isMobile} onCerrar={() => setVentaRapida(false)}
                  onAgregar={(producto, tipo) => agregarItemSuelto(producto, tipo)} />
              )}
              {!modoPlataforma && (
                <>
                  {/* Selector rápido para iniciar burger o fries sin pasar por el flujo de tarjetas del hot dog.
                      Misma grilla pareja de 3 columnas para que las 3 categorías (Hot Dog ya está representado
                      por los ItemConstructor de abajo, así que aquí van Hamburguesa y Fries Z) queden uniformes
                      visualmente con Venta rápida / Pedido de Plataforma arriba. */}
                  {items.length === 1 && !items[0].producto && !items[0].suelto && !items[0].esBurger && !items[0].esFries && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }}>
                      <div onClick={agregarItemBurger} style={{ padding:'10px', borderRadius:10, cursor:'pointer', textAlign:'center', fontSize:13, fontWeight:700, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', color:'var(--text2)' }}>
                        🍔 Hamburguesa
                      </div>
                      <div onClick={agregarItemFries} style={{ padding:'10px', borderRadius:10, cursor:'pointer', textAlign:'center', fontSize:13, fontWeight:700, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', color:'var(--text2)' }}>
                        🍟 Fries Z
                      </div>
                    </div>
                  )}
                  {items.map((item, i) => (
                    item.suelto ? (
                      <ItemSueltoCard key={item.id} item={item} onEliminar={() => eliminarItem(item.id)} />
                    ) : item.esFries ? (
                      <ItemFriesCard key={item.id} item={item} onEliminar={() => eliminarItem(item.id)} />
                    ) : item.esBurger ? (
                      <ItemBurgerCard key={item.id} item={item} onChange={(n)=>updateItem(item.id,n)} onEliminar={() => eliminarItem(item.id)} isMobile={isMobile} />
                    ) : (
                      <ItemConstructor key={item.id} item={item}
                        onChange={(newItem) => updateItem(item.id, newItem)}
                        onAgregar={agregarItem}
                        onEliminar={() => eliminarItem(item.id)}
                        esUltimo={i === items.length-1}
                        isMobile={isMobile}
                      />
                    )
                  ))}
                </>
              )}
              {!modoPlataforma && todosCompletos && (
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
              {plataformaActiva !== 'directo' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, marginBottom:12, background:'rgba(255,68,31,0.1)', border:'1px solid rgba(255,68,31,0.3)' }}>
                  <span style={{ fontSize:16 }}>{PLATAFORMAS.find(p=>p.id===plataformaActiva)?.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#FF441F' }}>Pedido de {PLATAFORMAS.find(p=>p.id===plataformaActiva)?.nombre}</span>
                </div>
              )}
              <div className="panel" style={{ marginBottom:12 }}>
                <div className="panel-title">Resumen</div>
                {itemsCompletos.map((item,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>
                      {item.suelto ? `${item.productoSuelto.nombre} (suelto)` :
                       item.esFries ? FRIES_Z.nombre :
                       item.esBurger ? `${item.burger?.nombre || 'Hamburguesa'}${(item.toppingsQuitados||[]).length>0?' (sin '+item.toppingsQuitados.length+' topping(s))':''}` :
                       `${item.producto.nombre} · ${item.salchicha.nombre} · ${item.tipo==='solo'?'Solo':'Combo'}${item.extras.length>0?` + ${item.extras.map(e=>e.nombre).join(', ')}` : ''}`}
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
                  <div style={{ fontSize:10, color:'var(--text4)', marginTop:6, textAlign:'center' }}>
                    El cambio nunca se cuenta como efectivo recibido — solo se registra lo que realmente queda en caja.
                  </div>
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
                  {v.plataforma && v.plataforma !== 'directo' && <span style={{ fontSize:11 }}>{PLATAFORMAS.find(p=>p.id===v.plataforma)?.emoji}</span>}
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
