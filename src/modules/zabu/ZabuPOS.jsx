// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — CATEGORÍAS (paso 1, mismo peso visual para todas)
// ════════════════════════════════════════════════════════════════════════════
const CATEGORIAS = [
  { id:'hotdog',     nombre:'Hot Dog',        emoji:'🌭' },
  { id:'burger',     nombre:'Hamburguesa',    emoji:'🍔' },
  { id:'salchipapa', nombre:'Salchipapa ZABÚ',emoji:'🍟' },
  { id:'fries',      nombre:'Fries',          emoji:'🥔' },
  { id:'paleta',     nombre:'Paleta',         emoji:'🍡' },
  { id:'kids',       nombre:'Kids ZABÚ',      emoji:'🎈' },
  { id:'granizado',  nombre:'Granizado',      emoji:'🧊' },
  { id:'bebida',     nombre:'Bebida',         emoji:'🥤' },
  { id:'extra',      nombre:'Extra',          emoji:'➕' },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — HOT DOG
// ZABÚ: $18.000 solo / $25.000 combo (incluye Fries + Gaseosa 250ml)
// El cliente elige su salchicha y su queso — el resto de toppings vienen
// activados por defecto (Cream Code™, Tocineta Crispy, Piña, Papa Chongo).
// ════════════════════════════════════════════════════════════════════════════
const PRODUCTOS = [
  { id:'zabu', nombre:'ZABÚ', desc:'Pan ZaBun™ · Elige tu salchicha y tu queso', precioSolo:18000, precioCombo:25000, emoji:'🌭' },
]

// Catálogo real de salchichas (jun-2026). Gramaje = peso paquete ÷ unidades.
// Costo = precio paquete ÷ unidades. La Polaca ($4.180/ud) es referencia de
// costeo conservador. La Pavo Ahumada es la salchicha ancla de la marca.
const SALCHICHAS = [
  { id:'pavo',      nombre:'Pavo Ahumada', desc:'Ahumada · ancla de la marca', emoji:'🦃', gramos:62.5, costoUnidad:3700 },
  { id:'americana', nombre:'Americana',    desc:'Gruesa',                       emoji:'🌭', gramos:71.4, costoUnidad:2943 },
  { id:'suiza',     nombre:'Suiza',        desc:'Clásica',                      emoji:'🥩', gramos:100,  costoUnidad:4140 },
  { id:'polaca',    nombre:'Polaca',       desc:'Tradicional',                  emoji:'🥩', gramos:90,   costoUnidad:4180 },
  { id:'alemana',   nombre:'Alemana',      desc:'Estilo Múnich',                emoji:'🥩', gramos:100,  costoUnidad:4140 },
  { id:'frankfurt', nombre:'Frankfurt',    desc:'Tradicional alemana',          emoji:'⭐', gramos:55.6, costoUnidad:2433 },
]

// Quesos disponibles para el hot dog — el cliente elige uno.
const QUESOS_HOTDOG = [
  { id:'cheddar',   nombre:'Cheddar',    emoji:'🧀' },
  { id:'coljack',   nombre:'Colby Jack', emoji:'🧀' },
  { id:'provolone', nombre:'Provolone',  emoji:'🧀' },
  { id:'suizo',     nombre:'Suizo',      emoji:'🧀' },
]

// Toppings base del hot dog — TODOS activados por defecto. El cajero solo
// toca lo que el cliente NO quiere. Precio nunca cambia por quitar toppings.
const TOPPINGS_HOTDOG = [
  { id:'creamcode',  nombre:'Cream Code™',       emoji:'🧈', porDefecto:true },
  { id:'tocineta',   nombre:'Tocineta crispy',   emoji:'🥓', porDefecto:true },
  { id:'pina',       nombre:'Piña caramelizada', emoji:'🍍', porDefecto:true },
  { id:'papachongo', nombre:'Papa chongo',       emoji:'🍟', porDefecto:true },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — HAMBURGUESAS ZABÚ (Blend ZABÚ: Res Angus + Cerdo + Chorizo res)
// Todas incluyen el combo: Fries + Gaseosa 250ml al precio indicado.
// ════════════════════════════════════════════════════════════════════════════
const BURGERS = [
  { id:'classic',      nombre:'Classic Burger Z',   desc:'Blend ZABÚ · Cream Code · Cheddar · Tocineta · Lechuga · Mayo ajo', precio:25000, precioCombo:32000, emoji:'🍔' },
  { id:'hawaii',       nombre:'Hawaii',              desc:'Blend ZABÚ · Cheddar · Piña caramelizada · Tocineta · Mayo ajo',    precio:25000, precioCombo:32000, emoji:'🍔' },
  { id:'cheesez',      nombre:'CheesBurger Z',       desc:'Blend ZABÚ · Cheddar · Salsa ZABÚ',                                 precio:23000, precioCombo:30000, emoji:'🧀' },
  { id:'cheesezdoble', nombre:'CheesBurger Doble',   desc:'Doble Blend ZABÚ · Doble cheddar · Salsa ZABÚ',                    precio:31000, precioCombo:38000, emoji:'🧀' },
]

const TOPPINGS_BURGER_CLASSIC = [
  { id:'creamcode',    nombre:'Cream Code™',          emoji:'🧈', porDefecto:true },
  { id:'tocineta',     nombre:'Tocineta crispy',      emoji:'🥓', porDefecto:true },
  { id:'quesocheddar', nombre:'Queso cheddar',        emoji:'🧀', porDefecto:true },
  { id:'lechuga',      nombre:'Lechuga romana',       emoji:'🥬', porDefecto:true },
  { id:'mayoajo',      nombre:'Mayo de ajo ahumada',  emoji:'🧄', porDefecto:true },
]
const TOPPINGS_BURGER_HAWAII = [
  { id:'quesocheddar', nombre:'Queso cheddar',        emoji:'🧀', porDefecto:true },
  { id:'pina',         nombre:'Piña caramelizada',    emoji:'🍍', porDefecto:true },
  { id:'tocineta',     nombre:'Tocineta crispy',      emoji:'🥓', porDefecto:true },
  { id:'mayoajo',      nombre:'Mayo de ajo ahumada',  emoji:'🧄', porDefecto:true },
]
const TOPPINGS_BURGER_CHEESEZ = [
  { id:'salsazabu',    nombre:'Salsa ZABÚ',           emoji:'🧈', porDefecto:true },
  { id:'quesocheddar', nombre:'Queso cheddar',        emoji:'🧀', porDefecto:true },
]
const TOPPINGS_BURGER_CHEESEZDOBLE = [
  { id:'salsazabu',    nombre:'Salsa ZABÚ',           emoji:'🧈', porDefecto:true },
  { id:'quesocheddar', nombre:'Doble queso cheddar',  emoji:'🧀', porDefecto:true },
]

function toppingsDeBurger(burgerId) {
  if (burgerId === 'hawaii')       return TOPPINGS_BURGER_HAWAII
  if (burgerId === 'cheesez')      return TOPPINGS_BURGER_CHEESEZ
  if (burgerId === 'cheesezdoble') return TOPPINGS_BURGER_CHEESEZDOBLE
  return TOPPINGS_BURGER_CLASSIC
}

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — SALCHIPAPA ZABÚ $29.000
// Incluye: papas a la francesa + 2 salchichas ZABÚ + queso para rayar
// + piña caramelizada + tocineta crispy + papa chongo + salsas ZABÚ + perejil
// El cajero elige el queso para rayar (mismo portafolio de quesos del hot dog).
// ════════════════════════════════════════════════════════════════════════════
const SALCHIPAPA_Z = {
  id:'salchipapaz', nombre:'Salchipapa ZABÚ', precio:29000, emoji:'🍟',
  desc:'2 salchichas · papas · queso rayado · piña · tocineta · papa chongo · salsas ZABÚ · perejil',
}
// Quesos disponibles para rayar en la Salchipapa (mismo portafolio)
const QUESOS_SALCHIPAPA = QUESOS_HOTDOG

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — FRIES
// Fries Z: $7.000 (papas + sazonador ZABÚ)
// Fries ZABÚ: $10.000 (papas + sazonador + tocineta crispy + Cream Code™)
// ════════════════════════════════════════════════════════════════════════════
const FRIES_ITEMS = [
  { id:'friesz',    nombre:'Fries',      desc:'Papa a la francesa + sazonador ZABÚ',              precio:7000,  emoji:'🥔' },
  { id:'friesZabu', nombre:'Fries ZABÚ', desc:'Papa + sazonador + tocineta crispy + Cream Code™', precio:10000, emoji:'🍟' },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — PALETAS ARTESANALES $7.000 c/u
// Sabores pendientes de definir con el proveedor. Se muestran como
// "sabores de temporada" hasta confirmar el portafolio definitivo.
// ════════════════════════════════════════════════════════════════════════════
const PALETAS = [
  { id:'pal_frutosrojos', nombre:'Frutos Rojos',    desc:'Artesanal',    precio:7000, emoji:'🍡' },
  { id:'pal_mango',       nombre:'Mango',           desc:'Artesanal',    precio:7000, emoji:'🍡' },
  { id:'pal_cookiescream',nombre:'Cookies & Cream', desc:'Artesanal',    precio:7000, emoji:'🍡' },
  { id:'pal_chocobelga',  nombre:'Chocolate Belga', desc:'Artesanal',    precio:7000, emoji:'🍡' },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — KIDS ZABÚ $18.000 — menú infantil unificado.
// Tres opciones al mismo precio. Incluye papas + Jugo Hit 200ml + sorpresa.
// ⚠️ Mini hot dog: pendiente conseguir salchicha americana de tamaño pequeño.
// ════════════════════════════════════════════════════════════════════════════
const KIDS_OPCIONES = [
  { id:'kids_hotdog',  nombre:'Mini Hot Dog', desc:'Salchicha · ZaBún · queso · Salsa ZABÚ · papas · Hit 200ml · sorpresa', emoji:'🌭' },
  { id:'kids_burger',  nombre:'Mini Burger',  desc:'Carne · queso · Salsa ZABÚ · papas · Hit 200ml · sorpresa',            emoji:'🍔' },
  { id:'kids_nuggets', nombre:'Nuggets x8',   desc:'8 nuggets de pollo · papas · Hit 200ml · sorpresa',                    emoji:'🍗' },
]
const KIDS_PRECIO = 18000

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO — CÓCTELES GRANIZADOS $20.000 c/u (500ml) · Extra shot +$7.000
// Luna Azul: Maracuyá + Whisky
// Código Rojo: Fruit Punch + Ron
// ════════════════════════════════════════════════════════════════════════════
const GRANIZADOS = [
  { id:'luna_azul',    nombre:'Luna Azul',    desc:'Maracuyá + Whisky · 500ml',   precio:20000, emoji:'🧊' },
  { id:'codigo_rojo',  nombre:'Código Rojo',  desc:'Fruit Punch + Ron · 500ml',   precio:20000, emoji:'🧊' },
]
const EXTRA_SHOT = { precio:7000, nombre:'Extra Shot' }

// ════════════════════════════════════════════════════════════════════════════
// BEBIDAS Y EXTRAS
// ════════════════════════════════════════════════════════════════════════════
const BEBIDAS = [
  { id:'coca',      nombre:'Coca Cola 350ml',  precio:4000, emoji:'🥤', color:'#e05252' },
  { id:'colaroman', nombre:'Cola Román 350ml', precio:4000, emoji:'🥤', color:'#9C27B0' },
  { id:'quatro',    nombre:'Quatro 350ml',     precio:4000, emoji:'🥤', color:'#FF9800' },
  { id:'cokazero',  nombre:'Coca Zero 350ml',  precio:4000, emoji:'🥤', color:'#333'    },
  { id:'colombiana',nombre:'Colombiana 350ml', precio:4000, emoji:'🥤', color:'#C9A84C' },
  { id:'hitjugo',   nombre:'Jugo Hit 200ml',   precio:4000, emoji:'🧃', color:'#FF9800' },
  { id:'hatsu',     nombre:'Té Hatsu 400ml',   precio:6000, emoji:'🍵', color:'#4caf50' },
  { id:'agua',      nombre:'Agua Mineral 500ml',precio:4000, emoji:'💧', color:'#378ADD' },
]

const EXTRAS = [
  { id:'tocineta',  nombre:'Tocineta crispy', precio:3000, emoji:'🥓' },
  { id:'pina',      nombre:'Piña caramelizada',precio:2000, emoji:'🍍' },
  { id:'cheddar',   nombre:'Queso Cheddar',   precio:3000, emoji:'🧀' },
  { id:'extrashot', nombre:'Extra Shot',       precio:7000, emoji:'🥃' },
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
  if (item.categoria === 'salchipapa') return SALCHIPAPA_Z.precio
  if (item.categoria === 'fries')      return item.friesItem?.precio || FRIES_ITEMS[0].precio
  if (item.categoria === 'paleta')     return item.paleta?.precio || 0
  if (item.categoria === 'kids')       return KIDS_PRECIO
  if (item.categoria === 'granizado')  return item.granizado?.precio || 0
  if (item.categoria === 'bebida')     return item.bebidaItem?.precio || 0
  if (item.categoria === 'extra')      return item.extraItem?.precio || 0
  return 0
}

function emojiItem(item) {
  if (item.categoria === 'hotdog')     return item.producto?.emoji || '🌭'
  if (item.categoria === 'burger')     return item.burger?.emoji || '🍔'
  if (item.categoria === 'salchipapa') return SALCHIPAPA_Z.emoji
  if (item.categoria === 'fries')      return item.friesItem?.emoji || FRIES_ITEMS[0].emoji
  if (item.categoria === 'paleta')     return item.paleta?.emoji || '🍡'
  if (item.categoria === 'kids')       return item.kidsOpcion?.emoji || '🎈'
  if (item.categoria === 'granizado')  return item.granizado?.emoji || '🧊'
  if (item.categoria === 'bebida')     return item.bebidaItem?.emoji || '🥤'
  if (item.categoria === 'extra')      return item.extraItem?.emoji || '➕'
  return '🍽️'
}

function nombreItem(item) {
  if (item.categoria === 'hotdog')     return item.producto?.nombre || 'Hot Dog'
  if (item.categoria === 'burger')     return item.burger?.nombre || 'Hamburguesa'
  if (item.categoria === 'salchipapa') return `Salchipapa Z${item.salchicha ? ` · ${item.salchicha.nombre}` : ''}`
  if (item.categoria === 'fries')      return item.friesItem?.nombre || FRIES_ITEMS[0].nombre
  if (item.categoria === 'paleta')     return `Paleta Z · ${item.paleta?.nombre || '...'}`
  if (item.categoria === 'kids')       return `Kids ZABÚ · ${item.kidsOpcion?.nombre || '...'}`
  if (item.categoria === 'granizado')  return item.granizado?.nombre || 'Granizado'
  if (item.categoria === 'bebida')     return item.bebidaItem?.nombre || 'Bebida'
  if (item.categoria === 'extra')      return item.extraItem?.nombre || 'Extra'
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
  if (categoria === 'hotdog')     return [{paso:1,label:'Producto'},{paso:2,label:'Salchicha'},{paso:'queso',label:'Queso'},{paso:3,label:'Tipo'},{paso:4,label:'Toppings'}]
  if (categoria === 'burger')     return [{paso:1,label:'Producto'},{paso:4,label:'Toppings'}]
  if (categoria === 'salchipapa') return [{paso:1,label:'Queso'}]
  if (categoria === 'fries')      return [{paso:1,label:'Tipo'}]
  if (categoria === 'paleta')     return [{paso:1,label:'Sabor'}]
  if (categoria === 'kids')       return [{paso:1,label:'Opción'}]
  if (categoria === 'granizado')  return [{paso:1,label:'Sabor'}]
  if (categoria === 'bebida')     return [{paso:1,label:'Bebida'}]
  if (categoria === 'extra')      return [{paso:1,label:'Extra'}]
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
  // 'bebida' y 'queso' son pasos string — se mapean a su valor real para
  // que findIndex los encuentre correctamente en el array de PASOS.
  const pasoVisual = item.paso === 'bebida' ? 3 : item.paso
  const idxActual = item.paso === 5 ? PASOS.length : PASOS.findIndex(p => p.paso === pasoVisual)

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
              <CardSeleccion key={s.id} isMobile={isMobile} sel={item.salchicha?.id===s.id} onClick={() => onChange({...item, salchicha:s, paso:'queso'})}>
                <div style={{ fontSize:isMobile?24:28 }}>{s.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{s.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.desc}</div>
              </CardSeleccion>
            ))}
          </div>
        )}
        {cat === 'hotdog' && item.paso === 'queso' && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>ELIGE TU QUESO</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {QUESOS_HOTDOG.map(q => (
                <CardSeleccion key={q.id} isMobile={isMobile} sel={item.quesoElegido?.id===q.id} onClick={() => onChange({...item, quesoElegido:q, paso:3})}>
                  <div style={{ fontSize:isMobile?24:28 }}>{q.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{q.nombre}</div>
                </CardSeleccion>
              ))}
            </div>
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

        {/* ── SALCHIPAPA ZABÚ — elige queso para rayar ── */}
        {cat === 'salchipapa' && item.paso === 1 && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:4 }}>ELIGE EL QUESO PARA RAYAR</div>
            <div style={{ fontSize:10, color:'var(--text4)', marginBottom:10 }}>Incluye 2 salchichas ZABÚ · papas · piña · tocineta · papa chongo · salsas · perejil · {cop(SALCHIPAPA_Z.precio)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {QUESOS_SALCHIPAPA.map(q => (
                <CardSeleccion key={q.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, quesoElegido:q, paso:5})}>
                  <div style={{ fontSize:isMobile?24:28 }}>{q.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{q.nombre}</div>
                </CardSeleccion>
              ))}
            </div>
          </div>
        )}

        {/* ── KIDS ZABÚ — elige opción (mini hot dog / mini burger / nuggets) ── */}
        {cat === 'kids' && item.paso === 1 && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>ELIGE LA OPCIÓN</div>
            <div style={{ fontSize:10, color:'var(--text4)', marginBottom:10 }}>Todas incluyen papas + bebida cajita + sorpresa · {cop(KIDS_PRECIO)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
              {KIDS_OPCIONES.map(o => (
                <CardSeleccion key={o.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, kidsOpcion:o, paso:5})}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left' }}>
                    <div style={{ fontSize:isMobile?28:32 }}>{o.emoji}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{o.nombre}</div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>{o.desc}</div>
                    </div>
                  </div>
                </CardSeleccion>
              ))}
            </div>
          </div>
        )}

        {/* ── GRANIZADO — elige Luna Azul o Código Rojo ── */}
        {cat === 'granizado' && item.paso === 1 && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>ELIGE EL CÓCTEL · 500ml · Extra shot +{cop(EXTRA_SHOT.precio)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {GRANIZADOS.map(g => (
                <CardSeleccion key={g.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, granizado:g, paso:5})}>
                  <div style={{ fontSize:isMobile?28:36 }}>{g.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{g.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{g.desc}</div>
                  <div style={{ fontSize:14, color:'var(--gold)', fontWeight:800 }}>{cop(g.precio)}</div>
                </CardSeleccion>
              ))}
            </div>
          </div>
        )}

        {/* ── FRIES — elige Fries o Fries ZABÚ ── */}
        {cat === 'fries' && item.paso === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {FRIES_ITEMS.map(f => (
              <CardSeleccion key={f.id} isMobile={isMobile} sel={false} onClick={() => onChange({...item, friesItem:f, paso:5})}>
                <div style={{ fontSize:isMobile?28:36 }}>{f.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{f.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{f.desc}</div>
                <div style={{ fontSize:14, color:'var(--gold)', fontWeight:800 }}>{cop(f.precio)}</div>
              </CardSeleccion>
            ))}
          </div>
        )}

        {/* ── COMPLETO — mismo indicador para cualquier categoría. Aun
             completo, el item sigue editable: el botón "Editar" lo regresa
             al primer paso de su categoría (conservando lo ya elegido), y el
             header de arriba siempre tiene el × para eliminarlo del todo.
             Ningún item queda "trabado" antes de facturar. ── */}
        {item.paso === 5 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div style={{ fontSize:13, color:'var(--green)', fontWeight:700 }}>✓ Item completo</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onChange({ ...item, paso: pasosDe(cat)[0]?.paso ?? 1 })}
                style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.05)', border:'0.5px solid var(--border)', color:'var(--text2)', fontFamily:'inherit' }}>
                ✏️ Editar
              </button>
              {esUltimo && (
                <button onClick={onAgregar} style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, background:'rgba(55,138,221,0.1)', border:'0.5px solid rgba(55,138,221,0.3)', color:'var(--blue)', fontFamily:'inherit' }}>
                  + Otro item
                </button>
              )}
            </div>
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
${orden.plataforma && orden.plataforma !== 'directo' ? `Canal: ${PLATAFORMA_INFO.emoji} ${PLATAFORMA_INFO.nombre}${orden.codigoPlataforma?` · Pedido ${orden.codigoPlataforma}`:''}\n` : ''}${orden.nombreCliente ? `Cliente: ${orden.nombreCliente}\n` : ''}${orden.items.map(lineaItemTexto).join('\n')}

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
          {orden.plataforma && orden.plataforma !== 'directo' && orden.codigoPlataforma && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ color:'#888' }}>Pedido {PLATAFORMA_INFO.nombre}</span><span style={{ fontWeight:700 }}>{orden.codigoPlataforma}</span>
            </div>
          )}
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
          {orden.plataforma && orden.plataforma !== 'directo' && orden.codigoPlataforma && (
            <div style={{ fontSize:11, color:'#888', marginTop:1 }}>Pedido {orden.codigoPlataforma}</div>
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
  // plataformaActiva ahora se fija directamente al elegir la entrega
  // (Rappi/DiDi como opción de primer nivel, junto a Aquí/Llevar/Domicilio
  // directo) — ya no existe un modo de captura aparte para plataformas,
  // todo pedido se arma con el mismo flujo de categorías para minimizar
  // error de transcripción.
  const [plataformaActiva,setPlataformaActiva]= useState('directo')
  const [numPedidoPlataforma, setNumPedidoPlataforma] = useState('') // código/número que asigna Rappi o DiDi

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
      codigoPlataforma: numPedidoPlataforma || null,
      hora: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
    }
    await supabase.from('ordenes').insert({
      num, carrito_id: CARRITO_ID, items: orden.items,
      entrega, nombre_cliente: nombreCliente, direccion, telefono,
      pagos: pagosNetos, total: totalPrecio, cambio, estado:'pendiente',
      canal: plataformaActiva, codigo_plataforma: numPedidoPlataforma || null,
      hora: orden.hora, fecha: new Date().toISOString().split('T')[0],
    })
    await supabase.from('movimientos').insert({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Venta ${codigo} — ${orden.items.length} item(s)${plataformaActiva!=='directo'?` · ${plataformaActiva}${numPedidoPlataforma?` (${numPedidoPlataforma})`:''}`:''}`,
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

      // Crédito de ingreso DISCRIMINADO por línea de producto — nunca un
      // único código genérico. Regla acordada con Luis (jun-2026):
      //   - Si la orden es domicilio (incluye plataformas Rappi/DiDi), TODO
      //     el total va a 4145 "Ventas — domicilios", sin importar qué se
      //     vendió — el canal manda sobre el producto en ese caso.
      //   - Si NO es domicilio, cada línea va a su propia cuenta según tipo
      //     de producto y si lleva combo o no, para que el Estado de
      //     Resultados pueda discriminar de verdad (hot dog vs burger vs
      //     combos vs sueltos), en vez de ocultarlo todo en un solo número.
      const codigoIngresoDeItem = (item) => {
        if (entrega === 'domicilio') return { codigo:'4145', nombre:'Ventas — domicilios' }
        if (item.categoria === 'hotdog') return item.tipo === 'combo'
          ? { codigo:'4140', nombre:'Ventas — combos con bebida' }
          : { codigo:'4135', nombre:'Ventas — ZABÚ (venta directa)' }
        if (item.categoria === 'burger') return item.bebidaSuelta
          ? { codigo:'4140', nombre:'Ventas — combos con bebida' }
          : { codigo:'4137', nombre:'Ventas — Hamburguesa (venta directa)' }
        if (item.categoria === 'paleta')     return { codigo:'4152', nombre:'Ventas — Paleta Z' }
        if (item.categoria === 'kids')       return { codigo:'4154', nombre:'Ventas — Kids ZABÚ' }
        // Salchipapa Z, Fries Z, Granizado, Bebida suelta, Extra → venta suelta
        return { codigo:'4150', nombre:'Ventas — bebidas y extras sueltos' }
      }

      // Agrupa por código para no generar una partida de crédito por cada
      // item individual cuando varios caen en la misma cuenta (ej: 3 hot
      // dogs solos → 1 sola línea de 4135 con el total sumado).
      const creditosPorCodigo = {}
      ;(itemsCompletos.length ? itemsCompletos : items).forEach(item => {
        const { codigo: cod, nombre } = codigoIngresoDeItem(item)
        if (!creditosPorCodigo[cod]) creditosPorCodigo[cod] = { nombre, monto:0 }
        creditosPorCodigo[cod].monto += precioItem(item)
      })
      Object.entries(creditosPorCodigo).forEach(([cod, { nombre, monto }]) => {
        if (monto > 0) {
          partidasVenta.push({
            asiento_id: asientoVenta.id, codigo: cod, nombre,
            debe: 0, haber: monto, carrito_id: CARRITO_ID,
          })
        }
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
    setPlataformaActiva('directo'); setNumPedidoPlataforma('')
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
        {(() => {
          // Semáforo de cumplimiento de la meta (punto de equilibrio = 36
          // órdenes/sesión). Umbrales simples y ajustables: <50% rojo,
          // 50-89% amarillo, ≥90% verde. Solo cambia el color/emoji — la
          // meta numérica sigue siendo la misma de siempre.
          const pctMeta = Math.min(100, Math.round((ventas.length/36)*100))
          const semaforo = ventas.length>=36 ? {emoji:'🟢', color:'var(--green)'} : pctMeta>=50 ? {emoji:'🟡', color:'var(--gold)'} : {emoji:'🔴', color:'var(--red)'}

          // ⚠️ PLACEHOLDER — Alerta de Inventario: el POS todavía no descuenta
          // insumos por venta (no hay tabla de stock conectada). Este KPI es
          // solo visual por ahora; cuando se conecte el inventario real, esta
          // misma tarjeta debe mostrar cuántos insumos están en nivel bajo.
          // El conteo de itemsCompletos de toda la sesión (no solo la orden
          // actual) ya queda disponible aquí para alimentar ese consumo real
          // más adelante sin tener que rediseñar el KPI otra vez.
          const inventarioOK = true // TODO: conectar a stock real

          return [
            { label:'Ventas sesión', val:cop(totalSesion), color:'var(--gold)', sub:`${ventas.length} órdenes` },
            { label:'Meta', val:`${semaforo.emoji} ${ventas.length}/36`, color:semaforo.color, sub:`${pctMeta}% del equilibrio` },
            { label:'Total orden', val:cop(totalPrecio), color:totalPrecio>0?'var(--gold)':'var(--text4)', sub:'acumulado' },
            { label:'Alerta de Inventario', val: inventarioOK ? '✓ OK' : '⚠️ Bajo', color: inventarioOK ? 'var(--green)' : 'var(--red)', sub:'próximamente' },
          ]
        })().map(k => (
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
              {/* Ya no existe ningún modo de captura aparte. TODO pedido —
                  sin importar de dónde llegue (mostrador, Rappi, DiDi)— se
                  arma con el mismo flujo de categorías de abajo, para
                  minimizar el riesgo de transcribir mal un producto o
                  topping. La plataforma se elige al final, junto con el
                  resto de opciones de entrega (ver fase de pago). */}
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
                {/* 5 opciones de entrega al mismo nivel — Rappi y DiDi ya no
                    son un sub-paso escondido dentro de "Domicilio", son tan
                    visibles como Aquí/Llevar. Internamente las 3 últimas
                    siguen siendo entrega='domicilio' (mismos utensilios,
                    misma dirección/teléfono), pero plataformaActiva guarda
                    cuál de las 3 fue exactamente, para el asiento contable
                    (4145) y para discriminar el canal en reportes. */}
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:5},1fr)`, gap:8, marginBottom:12 }}>
                  {[
                    {id:'aqui',    plat:'directo', label:'Aquí',             emoji:'🪑', color:'var(--green)'},
                    {id:'llevar',  plat:'directo', label:'Llevar',           emoji:'🛍', color:'var(--gold)'},
                    {id:'domicilio',plat:'directo',label:'Domicilio directo',emoji:'🛵', color:'var(--blue)'},
                    {id:'domicilio',plat:'rappi',  label:'Rappi',            emoji:'🛵', color:'#FF441F'},
                    {id:'domicilio',plat:'didi',   label:'DiDi Food',        emoji:'🚗', color:'#FF7E0E'},
                  ].map((t,i) => {
                    const activo = entrega===t.id && plataformaActiva===t.plat
                    return (
                      <div key={i} onClick={() => { setEntrega(t.id); setPlataformaActiva(t.plat) }} style={{ ...cardBase, border:`1px solid ${activo?t.color+'66':'var(--border)'}`, background:activo?t.color+'15':'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize:24 }}>{t.emoji}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:activo?t.color:'var(--text)', textAlign:'center' }}>{t.label}</div>
                      </div>
                    )
                  })}
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
                {entrega === 'domicilio' && (plataformaActiva === 'rappi' || plataformaActiva === 'didi') && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>N° de pedido en {plataformaActiva === 'rappi' ? 'Rappi' : 'DiDi Food'}</div>
                    <input type="text" value={numPedidoPlataforma} onChange={e=>setNumPedidoPlataforma(e.target.value)}
                      placeholder={plataformaActiva === 'rappi' ? 'Ej: RP-48213' : 'Ej: DD-29104'} style={inputStyle} />
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:4 }}>Se guarda junto a nuestro consecutivo para poder cruzarlos.</div>
                  </div>
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
