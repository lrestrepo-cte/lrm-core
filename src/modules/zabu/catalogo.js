// @ts-nocheck
// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO ZABÚ — fuente única de verdad para precios y productos.
// Importado por ZabuPOS.jsx, ZabuDashboard.jsx y cualquier módulo que
// necesite mostrar o calcular precios del menú. Un solo lugar para
// actualizar precios sin tocar múltiples archivos.
// ════════════════════════════════════════════════════════════════════════════

export const PRODUCTOS = [
  { id:'zabu', nombre:'ZABÚ', desc:'Pan ZaBun™ · Elige tu salchicha y tu queso', precioSolo:18000, precioCombo:25000, emoji:'🌭' },
]

export const SALCHICHAS = [
  { id:'pavo',      nombre:'Pavo Ahumada', desc:'Ahumada · ancla de la marca', emoji:'🦃', gramos:62.5,  costoUnidad:3700 },
  { id:'americana', nombre:'Americana',    desc:'Gruesa',                       emoji:'🌭', gramos:71.4,  costoUnidad:2943 },
  { id:'suiza',     nombre:'Suiza',        desc:'Clásica',                      emoji:'🥩', gramos:100,   costoUnidad:4140 },
  { id:'polaca',    nombre:'Polaca',       desc:'Tradicional',                  emoji:'🥩', gramos:90,    costoUnidad:4180 },
  { id:'alemana',   nombre:'Alemana',      desc:'Estilo Múnich',                emoji:'🥩', gramos:100,   costoUnidad:4140 },
  { id:'frankfurt', nombre:'Frankfurt',    desc:'Tradicional alemana',          emoji:'⭐', gramos:55.6,  costoUnidad:2433 },
]

export const QUESOS_HOTDOG = [
  { id:'cheddar',   nombre:'Cheddar',    emoji:'🧀' },
  { id:'coljack',   nombre:'Colby Jack', emoji:'🧀' },
  { id:'provolone', nombre:'Provolone',  emoji:'🧀' },
  { id:'suizo',     nombre:'Suizo',      emoji:'🧀' },
]

export const BURGERS = [
  { id:'classic',      nombre:'Classic Burger Z',  desc:'Blend ZABÚ · Cream Code · Cheddar · Lechuga · Mayo ajo',  precio:25000, precioCombo:32000, emoji:'🍔' },
  { id:'hawaii',       nombre:'Hawaii',             desc:'Blend ZABÚ · Cheddar · Piña caramelizada · Mayo ajo',     precio:25000, precioCombo:32000, emoji:'🍔' },
  { id:'cheesez',      nombre:'CheesBurger Z',      desc:'Blend ZABÚ · Cheddar · Salsa ZABÚ',                       precio:23000, precioCombo:30000, emoji:'🧀' },
  { id:'cheesezdoble', nombre:'CheesBurger Doble',  desc:'Doble Blend ZABÚ · Doble cheddar · Salsa ZABÚ',          precio:31000, precioCombo:38000, emoji:'🧀' },
]

export const SALCHIPAPA_Z = {
  id:'salchipapaz', nombre:'Salchipapa ZABÚ', precio:29000, emoji:'🍟',
  desc:'2 salchichas · papas · queso rayado · piña · tocineta · papa chongo · salsas ZABÚ · perejil',
}

export const FRIES_ITEMS = [
  { id:'friesz',    nombre:'Fries',      desc:'Papa a la francesa + sazonador ZABÚ',              precio:7000,  emoji:'🥔' },
  { id:'friesZabu', nombre:'Fries ZABÚ', desc:'Papa + sazonador + tocineta crispy + Cream Code™', precio:10000, emoji:'🍟' },
]

export const PALETAS = [
  { id:'pal_frutosrojos',  nombre:'Frutos Rojos',    desc:'Artesanal', precio:7000, emoji:'🍡' },
  { id:'pal_mango',        nombre:'Mango',            desc:'Artesanal', precio:7000, emoji:'🍡' },
  { id:'pal_cookiescream', nombre:'Cookies & Cream',  desc:'Artesanal', precio:7000, emoji:'🍡' },
  { id:'pal_chocobelga',   nombre:'Chocolate Belga',  desc:'Artesanal', precio:7000, emoji:'🍡' },
]

export const KIDS_OPCIONES = [
  { id:'kids_hotdog',  nombre:'Mini Hot Dog', desc:'Salchicha · ZaBún · queso · salsas',  emoji:'🌭' },
  { id:'kids_burger',  nombre:'Mini Burger',  desc:'Carne · ZaBún · queso · salsas',      emoji:'🍔' },
  { id:'kids_nuggets', nombre:'Nuggets x8',   desc:'8 nuggets de pollo · sin toppings',   emoji:'🍗' },
]
export const KIDS_PRECIO = 18000

export const GRANIZADOS = [
  { id:'luna_azul',   nombre:'Luna Azul',   desc:'Maracuyá + Whisky · 500ml',        precio:20000, emoji:'🧊' },
  { id:'codigo_rojo', nombre:'Código Rojo', desc:'Fruit Punch + Ron · 500ml',        precio:20000, emoji:'🧊' },
  { id:'blend',       nombre:'Blend',       desc:'Luna Azul + Código Rojo · 500ml',  precio:20000, emoji:'🧊' },
]
export const EXTRA_SHOT = { precio:7000, nombre:'Extra Shot' }

export const BEBIDAS_COMBO = [
  { id:'coca_combo',    nombre:'Coca Cola 250ml',    precio:0, emoji:'🥤', color:'#e05252' },
  { id:'cokazero_combo',nombre:'Coca Zero 250ml',    precio:0, emoji:'🥤', color:'#333'    },
  { id:'aguamanz_combo',nombre:'Agua Manzana 250ml', precio:0, emoji:'💧', color:'#4caf50' },
  { id:'agualim_combo', nombre:'Agua Limón 250ml',   precio:0, emoji:'💧', color:'#C9A84C' },
]

export const BEBIDAS = [
  { id:'coca',       nombre:'Coca Cola 350ml',  precio:4000, emoji:'🥤', color:'#e05252' },
  { id:'colaroman',  nombre:'Cola Román 350ml', precio:4000, emoji:'🥤', color:'#9C27B0' },
  { id:'quatro',     nombre:'Quatro 350ml',     precio:4000, emoji:'🥤', color:'#FF9800' },
  { id:'cokazero',   nombre:'Coca Zero 350ml',  precio:4000, emoji:'🥤', color:'#333'    },
  { id:'colombiana', nombre:'Colombiana 350ml', precio:4000, emoji:'🥤', color:'#C9A84C' },
  { id:'hatsu',      nombre:'Té Hatsu 400ml',   precio:6000, emoji:'🍵', color:'#4caf50' },
  { id:'agua500',    nombre:'Agua MS 500ml',    precio:4000, emoji:'💧', color:'#378ADD' },
]

export const BEBIDAS_KIDS = [
  { id:'hit_kids',  nombre:'Jugo Hit 200ml', emoji:'🧃', color:'#FF9800' },
  { id:'agua_kids', nombre:'Agua 236ml',     emoji:'💧', color:'#378ADD' },
]

export const EXTRAS = [
  { id:'tocineta', nombre:'Tocineta crispy',   precio:3000, emoji:'🥓' },
  { id:'pina',     nombre:'Piña caramelizada', precio:2000, emoji:'🍍' },
  { id:'cheddar',  nombre:'Queso Cheddar',     precio:3000, emoji:'🧀' },
]

export const COMBO_EXTRA = 7000 // precio adicional del combo sobre el precio solo