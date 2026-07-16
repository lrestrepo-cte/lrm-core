// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — CATEGORÍAS (paso 1, mismo peso visual para todas)
// ════════════════════════════════════════════════════════════════════════════
const CATEGORIAS = [
  { id:'hotdog',  nombre:'Hot Dog',     emoji:'🌭' },
  { id:'burger',  nombre:'Hamburguesa', emoji:'🍔' },
  { id:'fries',   nombre:'Fries Z',     emoji:'🍟' },
  { id:'paleta',  nombre:'Paleta Z',    emoji:'🍡' },
  { id:'kids',    nombre:'Kids ZABÚ',   emoji:'🎈' },
  { id:'bebida',  nombre:'Bebida',      emoji:'🥤' },
  { id:'extra',   nombre:'Extra',       emoji:'➕' },
]

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
// CATÁLOGO — FRIES Z (producto único, sin variantes ni toppings)
// ════════════════════════════════════════════════════════════════════════════
const FRIES_Z = { id:'friesz', nombre:'Fries Z', desc:'Papa + sazonador ZABÚ + Cream Code', precio:7000, emoji:'🍟' }

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — PALETA Z  ⚠️ PLACEHOLDER — sabores y precio PENDIENTES de costeo real.
// Hardcodeado para destrabar el desarrollo del POS; ajustar aquí cuando haya
// ficha técnica definitiva (ver DOCUMENTO_MAESTRO_ZABU — sección Paletas: "cero
// desarrollo" al momento de escribir esto).
// ════════════════════════════════════════════════════════════════════════════
const PALETAS = [
  { id:'pal_mora',     nombre:'Paleta Z · Mora',     desc:'Pulpa de mora',     precio:4000, emoji:'🍡' }, // TODO PRECIO REAL
  { id:'pal_mango',    nombre:'Paleta Z · Mango',    desc:'Pulpa de mango',    precio:4000, emoji:'🍡' }, // TODO PRECIO REAL
  { id:'pal_coco',     nombre:'Paleta Z · Coco',     desc:'Coco cremoso',      precio:4000, emoji:'🍡' }, // TODO PRECIO REAL
  { id:'pal_maracuya', nombre:'Paleta Z · Maracuyá', desc:'Pulpa de maracuyá', precio:4000, emoji:'🍡' }, // TODO PRECIO REAL
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — KIDS ZABÚ  ⚠️ PLACEHOLDER — precio de nuggets pendiente de costeo
// real (bloqueaba el menú infantil según DOCUMENTO_MAESTRO_ZABU). Combo cerrado,
// sin toppings ni variantes: 8 nuggets + papas + jugo + sorpresa.
// ════════════════════════════════════════════════════════════════════════════
const KIDS_ZABU = {
  id:'kidszabu', nombre:'Kids ZABÚ', desc:'8 nuggets + papas + juguito + sorpresa',
  precio:17000, emoji:'🎈', // TODO PRECIO REAL (depende del costeo final de nuggets)
}

// ════════════════════════════════════════════════════════════════════════════
// BEBIDAS Y EXTRAS
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

// ════════════════════════════════════════════════════════════════════════════
// MODELO DE ITEM UNIFICADO
// ════════════════════════════════════════════════════════════════════════════
// Todo item (sin importar la categoría) comparte la misma forma de objeto.
// `categoria` decide qué pasos aplican; `paso` avanza por una secuencia común:
//
//   0  → elegir categoría (Hot Dog / Burger / Fries Z / Paleta Z / Kids / Bebida / Extra)
//   1  → elegir producto específico dentro de la categoría (si tiene más de uno)
//   2  → elegir variante (hoy solo Hot Dog: salchicha)
//   3  → elegir tipo solo/combo (hoy solo Hot Dog) → sub-paso 'bebida' si combo
//   4  → toppings + extras + bebida suelta (si la categoría tiene toppings)
//   5  → completo
//
// Categorías sin un paso lo saltan automáticamente (ver avanzarPaso()).
function nuevoItemVacio() {
  return {
    id: Date.now()+Math.random(),
    categoria: null,
    producto: null,      // hot dog elegido
    burger: null,        // burger elegido
    paleta: null,         // sabor de paleta elegido
    bebidaItem: null,     // bebida elegida (cuando categoria==='bebida')
    extraItem: null,      // extra elegido (cuando categoria==='extra')
    salchicha: null, tipo: null, bebida: null,
    extras: [], bebidaSuelta: null, toppingsQuitados: [],
    paso: 0,
  }
}

function tieneToppings(item) {
  return (item.categoria === 'hotdog' && item.producto) || (item.categoria === 'burger' && item.burger)
}

function toppingsDe(item) {
  if (item.categoria === 'hotdog') return TOPPINGS_HOTDOG
  if (item.categoria === 'burger' && item.burger) return toppingsDeBurger(item.burger.id)
  return []
}

function nombreCategoria(id) {
  return CATEGORIAS.find(c => c.id === id)?.nombre || ''
}

function precioItem(item) {
  if (item.categoria === 'hotdog') {
    if (!item.producto || !item.tipo) return 0
    const base = item.tipo === 'solo' ? item.producto.precioSolo : item.producto.precioCombo
    return base + item.extras.reduce((s,e) => s+e.precio, 0) + (item.bebidaSuelta?.precio || 0)
  }
  if (item.categoria === 'burger') {
    return (item.burger?.precio || 0) + (item.bebidaSuelta?.precio || 0)
  }
  if (item.categoria === 'fries')  return FRIES_Z.precio
  if (item.categoria === 'paleta') return item.paleta?.precio || 0
  if (item.categoria === 'kids')   return KIDS_ZABU.precio
  if (item.categoria === 'bebida') return item.bebidaItem?.precio || 0
  if (item.categoria === 'extra')  return item.extraItem?.precio || 0
  return 0
}

function emojiItem(item) {
  if (item.categoria === 'hotdog')  return item.producto?.emoji || '🌭'
  if (item.categoria === 'burger')  return item.burger?.emoji || '🍔'
  if (item.categoria === 'fries')   return FRIES_Z.emoji
  if (item.categoria === 'paleta')  return item.paleta?.emoji || '🍡'
  if (item.categoria === 'kids')    return KIDS_ZABU.emoji
  if (item.categoria === 'bebida')  return item.bebidaItem?.emoji || '🥤'
  if (item.categoria === 'extra')   return item.extraItem?.emoji || '➕'
  return '🍽️'
}

function nombreItem(item) {
  if (item.categoria === 'hotdog')  return item.producto?.nombre || 'Hot Dog'
  if (item.categoria === 'burger')  return item.burger?.nombre || 'Hamburguesa'
  if (item.categoria === 'fries')   return FRIES_Z.nombre
  if (item.categoria === 'paleta')  return item.paleta?.nombre || 'Paleta Z'
  if (item.categoria === 'kids')    return KIDS_ZABU.nombre
  if (item.categoria === 'bebida')  return item.bebidaItem?.nombre || 'Bebida'
  if (item.categoria === 'extra')   return item.extraItem?.nombre || 'Extra'
  return ''
}

// Lista de toppings activos de un item, aplicando lo que el cliente quitó.
function toppingsActivos(item) {
  const base = toppingsDe(item)
  if (base.length === 0) return []
  return base.filter(t => !(item.toppingsQuitados||[]).includes(t.id))
}

function itemEstaCompleto(item) {
  return item.paso === 5
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

// Tarjeta de selección genérica usada en cada paso (categoría, producto,
// variante, tipo) — mismo tamaño/forma sin importar qué se esté eligiendo,
// así ningún producto se siente "más importante" que otro.
function CardSeleccion({ sel, color, isMobile, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      padding: isMobile ? 10 : 14,
      borderRadius:12, cursor:'pointer', transition:'all .15s',
      border:`1px solid ${sel ? (color||'var(--gold-border)') : 'var(--border)'}`,
      background: sel ? (color ? color+'22' : 'rgba(201,168,76,0.1)') : 'rgba(255,255,255,0.03)',
      display:'flex', flexDirection:'column', alignItems:'center', gap:5, textAlign:'center',
    }}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR UNIFICADO — un solo componente para TODAS las categorías.
// La barra de pasos se calcula dinámicamente según lo que aplique a la
// categoría elegida, para que la navegación (avanzar, volver, "← Volver a
// editar") sea siempre la misma mecánica sin importar el producto.
// ════════════════════════════════════════════════════════════════════════════
function pasosDe(categoria) {
  // Cada entrada: { paso, label } — el paso 0 (categoría) es implícito y
  // siempre el primero; no se repite en la barra para no ser redundante.
  if (categoria === 'hotdog') return [{paso:1,label:'Producto'},{paso:2,label:'Salchicha'},{paso:3,label:'Tipo'},{paso:4,label:'Toppings'}]
  if (categoria === 'burger') return [{paso:1,label:'Producto'},{paso:4,label:'Toppings'}]
  if (categoria === 'paleta') return [{paso:1,label:'Sabor'}]
  if (categoria === 'bebida') return [{paso:1,label:'Bebida'}]
  if (categoria === 'extra')  return [{paso:1,label:'Extra'}]
  if (categoria === 'fries')  return [{paso:1,label:'Confirmar'}]
  if (categoria === 'kids')   return [{paso:1,label:'Confirmar'}]
  return []
}

function ItemConstructor({ item, onChange, onAgregar, onEliminar, esUltimo, isMobile }) {
  const cat = item.categoria

  const toggleTopping = (toppingId) => {
    const quitados = item.toppingsQuitados || []
    const yaQuitado = quitados.includes(toppingId)
    onChange({ ...item, toppingsQuitados: yaQuitado ? quitados.filter(id=>id!==toppingId) : [...quitados, toppingId] })
  }

  const toggleExtra = (e) => {
    const existe = item.extras.find(x => x.id === e.id)
    onChange({ ...item, extras: existe ? item.extras.filter(x=>x.id!==e.id) : [...item.extras, e] })
  }

  const card = (sel, color) => ({
    padding: isMobile ? 10 : 14,
    borderRadius:12, cursor:'pointer', transition:'all .15s',
    border:`1px solid ${sel ? (color||'var(--gold-border)') : 'var(--border)'}`,
    background: sel ? (color ? color+'22' : 'rgba(201,168,76,0.1)') : 'rgba(255,255,255,0.03)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:5, textAlign:'center',
  })

  // ── PASO 0 — Elegir categoría. Grilla pareja, mismo tamaño para todas. ──
  if (item.paso === 0) {
    return (
      <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Nuevo item</div>
          <div onClick={onEliminar} style={{ width:26, height:26, borderRadius:7, background:'rgba(224,82,82,0.1)', border:'0.5px solid rgba(224,82,82,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--red)' }}>×</div>
        </div>
        <div style={{ padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:10 }}>ELIGE LA CATEGORÍA</div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:8 }}>
            {CATEGORIAS.map(c => (
              <CardSeleccion key={c.id} isMobile={isMobile} sel={false}
                onClick={() => onChange({ ...item, categoria:c.id, paso:1 })}>
                <div style={{ fontSize:isMobile?26:30 }}>{c.emoji}</div>
                <div style={{ fontSize:12, fontWeight:800, color:'var(--text)' }}>{c.nombre}</div>
              </CardSeleccion>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const PASOS = pasosDe(cat)
  const pasoVisual = item.paso === 'bebida' ? 3 : item.paso
  const idxActual = PASOS.findIndex(p => p.paso === pasoVisual)

  return (
    <div style={{ background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:12 }}>
      {/* Header — mismo formato sin importar la categoría */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{emojiItem(item)}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
              {item.paso === 1 && !item.producto && !item.burger && !item.paleta && !item.bebidaItem && !item.extraItem && cat !== 'fries' && cat !== 'kids' ? nombreCategoria(cat) : nombreItem(item)}
              {item.salchicha ? ` · ${item.salchicha.nombre}` : ''}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>
              {nombreCategoria(cat)}
              {item.tipo === 'solo' ? ' · Solo' : item.tipo === 'combo' ? ' · Combo' : ''}
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

      {/* Barra de pasos — dinámica según categoría, misma mecánica de navegación */}
      <div style={{ display:'flex', gap:4, padding:'8px 14px', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
        <div onClick={() => onChange({ ...item, categoria:null, paso:0 })}
          style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:20, height:20, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
            background:'var(--green-dim)', color:'var(--green)', border:'0.5px solid var(--green-border)' }}>✓</div>
          <span style={{ fontSize:10, color:'var(--green)' }}>{nombreCategoria(cat)}</span>
        </div>
        {PASOS.map((p, i) => (
          <div key={p.paso} style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            <div style={{ width:10, height:1, background:'var(--border)' }} />
            <div onClick={() => idxActual > i && onChange({...item, paso:p.paso})}
              style={{ display:'flex', alignItems:'center', gap:4, cursor: idxActual > i ? 'pointer' : 'default' }}>
              <div style={{ width:20, height:20, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
                background: idxActual > i ? 'var(--green-dim)' : idxActual === i ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
                color: idxActual > i ? 'var(--green)' : idxActual === i ? 'var(--gold)' : 'var(--text4)',
                border:`0.5px solid ${idxActual > i ? 'var(--green-border)' : idxActual === i ? 'var(--gold-border)' : 'rgba(255,255,255,0.08)'}`,
              }}>{idxActual > i ? '✓' : i+1}</div>
              <span style={{ fontSize:10, color: idxActual > i ? 'var(--green)' : idxActual === i ? 'var(--gold)' : 'var(--text4)', fontWeight: idxActual === i ? 700 : 400 }}>{p.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:'12px 14px' }}>

        {/* ── HOT DOG ── */}
        {cat === 'hotdog' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {PRODUCTOS.map(p => (
              <CardSeleccion key={p.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, producto:p, paso:2})}>
                <div style={{ fontSize:isMobile?28:36 }}>{p.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{p.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{p.desc}</div>
                <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700 }}>{cop(p.precioSolo)} · {cop(p.precioCombo)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}
        {cat === 'hotdog' && item.paso === 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SALCHICHAS.map(s => (
              <CardSeleccion key={s.id} isMobile={isMobile} sel={item.salchicha?.id===s.id} onClick={() => onChange({...item, salchicha:s, paso:3})}>
                <div style={{ fontSize:isMobile?24:28 }}>{s.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{s.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.desc}</div>
              </CardSeleccion>
            ))}
          </div>
        )}
        {cat === 'hotdog' && item.paso === 3 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <CardSeleccion isMobile={isMobile} sel={item.tipo==='solo'} onClick={() => onChange({...item, tipo:'solo', bebida:null, paso:4})}>
              <div style={{ fontSize:isMobile?28:32 }}>🌭</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Solo</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>Solo el perro</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(item.producto?.precioSolo)}</div>
            </CardSeleccion>
            <CardSeleccion isMobile={isMobile} sel={item.tipo==='combo'} onClick={() => onChange({...item, tipo:'combo', paso:'bebida'})}>
              <div style={{ fontSize:isMobile?28:32 }}>🥤</div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>Combo</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>Perro + bebida</div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>{cop(item.producto?.precioCombo)}</div>
            </CardSeleccion>
          </div>
        )}
        {cat === 'hotdog' && item.paso === 'bebida' && (
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:1, fontWeight:700, marginBottom:10 }}>SELECCIONA LA BEBIDA DEL COMBO</div>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8, marginBottom:12 }}>
              {BEBIDAS.map(b => (
                <CardSeleccion key={b.id} isMobile={isMobile} sel={item.bebida?.id===b.id} color={b.color} onClick={() => onChange({...item, bebida:b, paso:4})}>
                  <div style={{ fontSize:isMobile?20:24 }}>{b.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{b.nombre}</div>
                  <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
                </CardSeleccion>
              ))}
            </div>
            <button className="btn" style={{ width:'100%' }} onClick={() => onChange({...item, paso:3})}>← Volver</button>
          </div>
        )}
        {cat === 'hotdog' && item.paso === 4 && (
          <PasoToppingsExtra item={item} isMobile={isMobile} onChange={onChange} toggleTopping={toggleTopping} toggleExtra={toggleExtra} toppings={TOPPINGS_HOTDOG} conExtras />
        )}

        {/* ── HAMBURGUESA ── */}
        {cat === 'burger' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {BURGERS.map(b => (
              <CardSeleccion key={b.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, burger:b, paso:4})}>
                <div style={{ fontSize:isMobile?28:36 }}>{b.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{b.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{b.desc}</div>
                <div style={{ fontSize:13, color:'var(--gold)', fontWeight:700 }}>{cop(b.precio)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}
        {cat === 'burger' && item.paso === 4 && (
          <PasoToppingsExtra item={item} isMobile={isMobile} onChange={onChange} toggleTopping={toggleTopping} toggleExtra={toggleExtra} toppings={toppingsDeBurger(item.burger?.id)} conExtras={false} />
        )}

        {/* ── PALETA Z ── */}
        {cat === 'paleta' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {PALETAS.map(p => (
              <CardSeleccion key={p.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, paleta:p, paso:5})}>
                <div style={{ fontSize:isMobile?28:36 }}>{p.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{p.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{p.desc}</div>
                <div style={{ fontSize:13, color:'var(--gold)', fontWeight:700 }}>{cop(p.precio)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}

        {/* ── BEBIDA SUELTA (como producto principal del item) ── */}
        {cat === 'bebida' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8 }}>
            {BEBIDAS.map(b => (
              <CardSeleccion key={b.id} isMobile={isMobile} sel={false} color={b.color} onClick={() => onChange({...item, bebidaItem:b, paso:5})}>
                <div style={{ fontSize:isMobile?20:24 }}>{b.emoji}</div>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{b.nombre}</div>
                <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}

        {/* ── EXTRA SUELTO (como producto principal del item) ── */}
        {cat === 'extra' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {EXTRAS.map(e => (
              <CardSeleccion key={e.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, extraItem:e, paso:5})}>
                <div style={{ fontSize:isMobile?22:28 }}>{e.emoji}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
                <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(e.precio)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}

        {/* ── FRIES Z — confirmar (producto único) ── */}
        {cat === 'fries' && item.paso === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center', textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:40 }}>{FRIES_Z.emoji}</div>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{FRIES_Z.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{FRIES_Z.desc}</div>
            <div style={{ fontSize:16, color:'var(--gold)', fontWeight:800 }}>{cop(FRIES_Z.precio)}</div>
            <button className="btn-gold" style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700 }} onClick={() => onChange({...item, paso:5})}>✓ Agregar</button>
          </div>
        )}

        {/* ── KIDS ZABÚ — confirmar (combo único) ── */}
        {cat === 'kids' && item.paso === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center', textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:40 }}>{KIDS_ZABU.emoji}</div>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{KIDS_ZABU.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{KIDS_ZABU.desc}</div>
            <div style={{ fontSize:16, color:'var(--gold)', fontWeight:800 }}>{cop(KIDS_ZABU.precio)}</div>
            <button className="btn-gold" style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700 }} onClick={() => onChange({...item, paso:5})}>✓ Agregar</button>
          </div>
        )}

        {/* ── COMPLETO — mismo indicador para cualquier categoría ── */}
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

// Paso de toppings (+ extras opcionales + bebida suelta) — compartido entre
// Hot Dog y Hamburguesa, mismo componente visual para ambos.
function PasoToppingsExtra({ item, isMobile, onChange, toggleTopping, toggleExtra, toppings, conExtras }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>TOPPINGS (toca para quitar)</div>
        <ToppingsToggle toppings={toppings} quitados={item.toppingsQuitados||[]} onToggle={toggleTopping} isMobile={isMobile} />
      </div>
      {conExtras && (
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>EXTRAS ADICIONALES (con costo extra)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {EXTRAS.map(e => {
              const sel = item.extras.find(x=>x.id===e.id)
              return (
                <CardSeleccion key={e.id} isMobile={isMobile} sel={!!sel} onClick={() => toggleExtra(e)}>
                  <div style={{ fontSize:isMobile?22:28 }}>{e.emoji}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{e.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>+{cop(e.precio)}</div>
                  {sel && <div style={{ fontSize:10, color:'var(--gold)' }}>✓</div>}
                </CardSeleccion>
              )
            })}
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>BEBIDA SUELTA (opcional)</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?3:4},1fr)`, gap:8 }}>
          {BEBIDAS.map(b => (
            <CardSeleccion key={b.id} isMobile={isMobile} sel={item.bebidaSuelta?.id===b.id} color={b.color}
              onClick={() => onChange({...item, bebidaSuelta: item.bebidaSuelta?.id===b.id ? null : b})}>
              <div style={{ fontSize:isMobile?18:22 }}>{b.emoji}</div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
            </CardSeleccion>
          ))}
        </div>
      </div>
      <button className="btn-gold" style={{ width:'100%', padding:'12px', fontSize:14, fontWeight:700 }}
        onClick={() => onChange({...item, paso:5})}>
        ✓ Listo · {cop(precioItem(item))}
      </button>
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
        {items.length === 0 || !items.some(i => i.categoria && itemEstaCompleto(i)) ? (
          <div style={{ textAlign:'center', paddingTop:40 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Bienvenido a ZABÚ</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Tu orden aparecerá aquí</div>
          </div>
        ) : items.filter(i => i.categoria && itemEstaCompleto(i)).map((item) => (
          <div key={item.id} style={{ background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)', padding:'10px 12px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{emojiItem(item)} {nombreItem(item)}</div>
                {item.salchicha && <div style={{ fontSize:11, color:'var(--text3)' }}>🥩 {item.salchicha.nombre}</div>}
                {item.tipo && <div style={{ fontSize:11, color:'var(--text3)' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>}
                {(item.toppingsQuitados||[]).length > 0 && (
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Sin: {toppingsDe(item).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>
                )}
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

function lineaItemTexto(item) {
  const quitados = (item.toppingsQuitados||[]).length > 0
    ? `\n  Sin: ${toppingsDe(item).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}` : ''
  const beb = item.bebidaSuelta ? `\n  🥤 ${item.bebidaSuelta.nombre}` : ''
  const extrasTxt = item.extras?.length>0 ? '\n  + '+item.extras.map(e=>e.nombre).join(', ') : ''
  if (item.categoria === 'hotdog') {
    return `▸ ${item.producto?.nombre} · ${item.salchicha?.nombre} · ${item.tipo==='solo'?'Solo':'Combo'}${item.bebida?` (${item.bebida.nombre})`:''}${quitados}${extrasTxt}${beb} — ${cop(precioItem(item))}`
  }
  return `▸ ${nombreItem(item)}${quitados}${beb} — ${cop(precioItem(item))}`
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
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                <span>{nombreItem(item)}{item.categoria==='hotdog' && item.salchicha ? ` · ${item.salchicha.nombre}` : ''}</span>
                <span>{cop(precioItem(item))}</span>
              </div>
              <div style={{ color:'#555', paddingLeft:6, fontSize:10 }}>
                {item.categoria==='hotdog' && (item.tipo==='solo'?'Solo':'Combo')}{item.bebida?` · ${item.bebida.nombre}`:''}
                {(item.toppingsQuitados||[]).length > 0 && <div>Sin: {toppingsDe(item).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>}
                {item.extras?.map(e=><div key={e.id}>+ {e.nombre} {cop(e.precio)}</div>)}
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
          {orden.plataforma && orden.plataforma !== 'directo' && (
            <div style={{ fontSize:12, fontWeight:700, color:'#FF441F', marginTop:2 }}>{PLATAFORMA_INFO.emoji} {PLATAFORMA_INFO.nombre}</div>
          )}
          {orden.nombreCliente && <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700, marginTop:2 }}>{orden.nombreCliente}</div>}
          <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        {orden.items.map((item,i) => (
          <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:'1px dashed #333' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#C9A84C' }}>{emojiItem(item)} {nombreItem(item)}</div>
            {item.categoria==='hotdog' && item.salchicha && <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>🥩 {item.salchicha.nombre}</div>}
            {item.categoria==='hotdog' && <div style={{ fontSize:11, color:'#888' }}>{item.tipo==='solo'?'🌭 Solo':'🥤 Combo'}{item.bebida?` · ${item.bebida.nombre}`:''}</div>}
            {(item.toppingsQuitados||[]).length > 0 && <div style={{ fontSize:11, color:'#e05252' }}>SIN: {toppingsDe(item).filter(t=>item.toppingsQuitados.includes(t.id)).map(t=>t.nombre).join(', ')}</div>}
            {item.extras?.map(e=><div key={e.id} style={{ fontSize:12, color:'#fff' }}>+ {e.nombre}</div>)}
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

// ════════════════════════════════════════════════════════════════════════════
// MODO PEDIDO DE PLATAFORMA — única pantalla genuinamente distinta del resto:
// es un flujo exprés sin pasos para replicar un pedido que ya llegó armado
// de Rappi/DiDi. Usa el mismo catálogo y el mismo ToppingsToggle que el flujo
// normal, pero sin la navegación paso a paso (porque el pedido ya viene
// decidido por el cliente en la app — el cajero solo lo transcribe rápido).
// ════════════════════════════════════════════════════════════════════════════
function PedidoPlataforma({ onConfirmar, onCerrar, isMobile }) {
  const [plataforma, setPlataforma] = useState(null)
  const [itemsPlat,  setItemsPlat]  = useState([])

  const agregarRapido = (categoria, extra) => {
    const base = { ...nuevoItemVacio(), categoria, paso:5, ...extra }
    setItemsPlat(prev => [...prev, base])
  }
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
        {/* Grilla única de TODOS los productos de TODAS las categorías — un
            toque agrega ya completo, sin pasos. Mismo tamaño de tarjeta para
            cualquier producto, igual que en el flujo normal. */}
        <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>TOCA PARA AGREGAR</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:8, marginBottom:16 }}>
          {PRODUCTOS.map(p => (
            <div key={p.id} onClick={() => agregarRapido('hotdog', { producto:p, salchicha:SALCHICHAS[0], tipo:'solo' })} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{p.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{p.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(p.precioSolo)}</div>
            </div>
          ))}
          {BURGERS.map(b => (
            <div key={b.id} onClick={() => agregarRapido('burger', { burger:b })} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{b.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
          <div onClick={() => agregarRapido('fries', {})} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize:24 }}>{FRIES_Z.emoji}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{FRIES_Z.nombre}</div>
            <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(FRIES_Z.precio)}</div>
          </div>
          {PALETAS.map(p => (
            <div key={p.id} onClick={() => agregarRapido('paleta', { paleta:p })} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:24 }}>{p.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{p.nombre}</div>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(p.precio)}</div>
            </div>
          ))}
          <div onClick={() => agregarRapido('kids', {})} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize:24 }}>{KIDS_ZABU.emoji}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{KIDS_ZABU.nombre}</div>
            <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>{cop(KIDS_ZABU.precio)}</div>
          </div>
          {BEBIDAS.map(b => (
            <div key={b.id} onClick={() => agregarRapido('bebida', { bebidaItem:b })} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:`1px solid ${b.color}33`, background:b.color+'11' }}>
              <div style={{ fontSize:24 }}>{b.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{b.nombre}</div>
              <div style={{ fontSize:10, color:b.color, fontWeight:700 }}>{cop(b.precio)}</div>
            </div>
          ))}
          {EXTRAS.map(e => (
            <div key={e.id} onClick={() => agregarRapido('extra', { extraItem:e })} style={{ padding:10, borderRadius:10, cursor:'pointer', textAlign:'center', border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
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
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: tieneToppings(item) ? 8 : 0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{emojiItem(item)} {nombreItem(item)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--gold)' }}>{cop(precioItem(item))}</span>
                    <div onClick={() => eliminarItem(item.id)} style={{ cursor:'pointer', color:'var(--text4)', fontSize:14 }}>×</div>
                  </div>
                </div>
                {tieneToppings(item) && (
                  <ToppingsToggle toppings={toppingsDe(item)} quitados={item.toppingsQuitados||[]}
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
  const [items,           setItems]           = useState([nuevoItemVacio()])
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
  const [modoPlataforma,  setModoPlataforma]  = useState(false)
  const [plataformaActiva,setPlataformaActiva]= useState('directo') // se fija al confirmar un pedido de plataforma

  const isMobile       = window.innerWidth < 768
  const totalPrecio    = items.reduce((s,i) => s+precioItem(i), 0)
  const itemsCompletos = items.filter(i => itemEstaCompleto(i))
  const todosCompletos = items.length > 0 && items.every(i => itemEstaCompleto(i))
  const totalPagado    = pagos.reduce((s,p) => s+(parseFloat(p.monto)||0), 0)
  const cambio         = Math.max(0, totalPagado - totalPrecio)
  const pagoCompleto   = totalPagado >= totalPrecio
  const totalSesion    = ventas.reduce((s,v)=>s+v.total,0)

  const updateItem   = (id, newItem) => setItems(prev => prev.map(i => i.id===id ? newItem : i))
  const agregarItem  = () => setItems(prev => [...prev, nuevoItemVacio()])
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
    setItems([nuevoItemVacio()]); setFasePago(false); setEntrega(null)
    setNombreCliente(''); setDireccion(''); setTelefono('')
    setPagos([{metodo:'efectivo',monto:''}])
    setConfirmado(false); setOrdenConfirmada(null); setOrdenActual(null)
    setModoPlataforma(false); setPlataformaActiva('directo')
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
              {/* Único modo aparte del flujo normal: Pedido de Plataforma.
                  "Venta rápida" ya no existe como modo separado — ahora
                  Bebida y Extra son categorías más dentro del mismo selector
                  unificado de abajo, con el mismo peso visual que Hot Dog,
                  Hamburguesa, Fries Z, Paleta Z y Kids ZABÚ. */}
              {!modoPlataforma && (
                <div onClick={() => setModoPlataforma(true)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'rgba(255,68,31,0.1)', border:'1px solid rgba(255,68,31,0.3)', color:'#FF441F', marginBottom:12 }}>
                  📲 Pedido de Plataforma
                </div>
              )}
              {modoPlataforma && (
                <PedidoPlataforma isMobile={isMobile} onCerrar={() => setModoPlataforma(false)} onConfirmar={confirmarDesdePlataforma} />
              )}
              {!modoPlataforma && items.map((item, i) => (
                <ItemConstructor key={item.id} item={item}
                  onChange={(newItem) => updateItem(item.id, newItem)}
                  onAgregar={agregarItem}
                  onEliminar={() => eliminarItem(item.id)}
                  esUltimo={i === items.length-1}
                  isMobile={isMobile}
                />
              ))}
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
                      {item.categoria === 'hotdog'
                        ? `${item.producto?.nombre} · ${item.salchicha?.nombre} · ${item.tipo==='solo'?'Solo':'Combo'}${item.extras?.length>0?` + ${item.extras.map(e=>e.nombre).join(', ')}` : ''}`
                        : `${nombreItem(item)}${(item.toppingsQuitados||[]).length>0?' (sin '+item.toppingsQuitados.length+' topping(s))':''}`}
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
