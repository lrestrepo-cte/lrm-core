// LRM Trade Consulting · Casillero virtual: la dirección en Miami de cada cliente, lista para copiar en Amazon o cualquier tienda.
// La dirección de la bodega se guarda una vez (lrm_ajustes 'casillero'); cada cliente tiene su código (LRM-1001…).

export const CASILLERO_BASE = {
  prefijo: 'LRM',
  bodega: '',            // nombre de la bodega (no se muestra al cliente si se deja vacío)
  direccion1: '',        // calle y número de la bodega en Miami
  linea2: 'Suite {codigo}',   // cómo va el código en la línea 2 ({codigo} se reemplaza)
  ciudad: 'Doral',
  estado: 'FL',
  zip: '',
  telefono: '',
  nota: '',              // instrucción extra de la bodega
}

export const leerConfig = valor => { try { return { ...CASILLERO_BASE, ...(typeof valor === 'string' ? JSON.parse(valor || '{}') : (valor || {})) } } catch { return { ...CASILLERO_BASE } } }
export const configCompleta = c => !!(c.direccion1 && c.ciudad && c.estado && c.zip)

// Las líneas tal como se llenan en el formulario de dirección de una tienda de EE.UU.
export function lineasCasillero(cfg, codigo, nombre) {
  const c = leerConfig(cfg)
  return [
    ['Full name (Nombre)', `${nombre || ''} ${codigo || ''}`.trim()],
    ['Address line 1 (Dirección)', c.direccion1 || '—'],
    ['Address line 2 (Apto / Suite)', (c.linea2 || 'Suite {codigo}').replace('{codigo}', codigo || '')],
    ['City (Ciudad)', c.ciudad || '—'],
    ['State (Estado)', c.estado || '—'],
    ['ZIP code (Código postal)', c.zip || '—'],
    ['Country (País)', 'United States'],
    ...(c.telefono ? [['Phone (Teléfono)', c.telefono]] : []),
  ]
}

export const PASOS_COMPRA = [
  'Compra en Amazon, eBay, Walmart, Shein o la tienda que quieras.',
  'En la dirección de envío pega tu casillero tal cual: tu nombre con tu código y la Suite con tu código.',
  'Cuando la tienda te dé el número de rastreo, mándanoslo por WhatsApp con una foto de la factura.',
  'Cuando llegue a la bodega en Miami te avisamos y la ves en "Mis envíos".',
  'Nosotros la traemos a Colombia y te avisamos cuando esté lista para entrega.',
]

export const NO_TRAER = [
  'Armas, municiones y réplicas', 'Baterías de litio sueltas', 'Aerosoles, gases y líquidos inflamables',
  'Medicamentos sin fórmula y suplementos sin registro', 'Dinero en efectivo y joyas de alto valor sin declarar',
  'Alimentos perecederos', 'Productos falsificados',
]

export function textoWhatsApp(cfg, codigo, nombre, empresa = 'LRM Trade Consulting') {
  const l = lineasCasillero(cfg, codigo, nombre)
  return [
    `Hola ${String(nombre || '').split(' ')[0]} 👋 Este es tu casillero en Miami con ${empresa}.`,
    ``, `📦 Tu código: *${codigo}*`, ``,
    `Cuando compres en Amazon o cualquier tienda, usa esta dirección de envío:`,
    ...l.map(([k, v]) => `• ${k.split(' (')[0]}: ${v}`),
    ``, `Tu código siempre va junto a tu nombre y en la Suite: así sabemos que el paquete es tuyo.`,
    ``, `🚢 Marítimo (perfumes y carga general): cargamos lunes y viernes. Lo que llega de lunes a miércoles sale el viernes; de jueves a sábado, el lunes. Entre 10 y 15 días en total.`,
    `✈️ Aéreo (celulares y Apple): sale los jueves y se entrega martes o miércoles.`, ``,
    `Cuando compres, mándame el número de rastreo y la factura por aquí.`,
  ].join('\n')
}

// Busca el código de casillero dentro de un texto (referencia o consignatario de un recibo)
export function clientePorCasillero(texto, clientes) {
  const t = String(texto || '').toUpperCase().replace(/\s+/g, '')
  if (!t) return null
  return clientes.filter(c => c.casillero).sort((a, b) => b.casillero.length - a.casillero.length)
    .find(c => t.includes(String(c.casillero).toUpperCase().replace(/\s+/g, ''))) || null
}