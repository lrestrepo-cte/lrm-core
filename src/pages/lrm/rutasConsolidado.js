// @ts-nocheck
// LRM Trade Consulting · Rutas de consolidado y sus hitos
// Miami: frecuencia semanal, mercancía especial · Panamá (Colón) · China: mercancía general, por contenedor
// Cada hito puede mover el estado del consolidado y las fechas (zarpe → ETD).

export const RUTAS = {
  miami: {
    l:'Miami', bandera:'🇺🇸', origen:'Miami', mercancia:'especial', frecuencia:'semanal', diaCierre:4,
    hitos: [
      { id:'cierre',          titulo:'Cerró la recepción de la semana',           estado:'cerrado' },
      { id:'cargado',         titulo:'Carga embarcada en Miami' },
      { id:'zarpe',           titulo:'Salió de Miami',                             estado:'despachado', fecha:'etd' },
      { id:'llegada',         titulo:'Llegó a {destino}' },
      { id:'nacionalizacion', titulo:'En nacionalización' },
      { id:'disponible',      titulo:'Lista para entrega en {destino}' },
      { id:'entregado',       titulo:'Entregado',                                  estado:'entregado' },
    ],
  },
  panama: {
    l:'Panamá', bandera:'🇵🇦', origen:'Colón (Panamá)', mercancia:'general', frecuencia:'quincenal',
    hitos: [
      { id:'cierre',          titulo:'Cerró la recepción en Colón',                estado:'cerrado' },
      { id:'cargado',         titulo:'Contenedor cargado y sellado en Colón' },
      { id:'zarpe',           titulo:'Zarpó de Colón',                             estado:'despachado', fecha:'etd' },
      { id:'llegada',         titulo:'Llegó al puerto de {destino}' },
      { id:'nacionalizacion', titulo:'En nacionalización' },
      { id:'disponible',      titulo:'Lista para entrega en {destino}' },
      { id:'entregado',       titulo:'Entregado',                                  estado:'entregado' },
    ],
  },
  china: {
    l:'China', bandera:'🇨🇳', origen:'Shanghái', mercancia:'general', frecuencia:'por_contenedor',
    hitos: [
      { id:'cierre',          titulo:'Cerró la recepción en bodega de {origen}',   estado:'cerrado' },
      { id:'cargado',         titulo:'Contenedor cargado y sellado' },
      { id:'zarpe',           titulo:'Zarpó de {origen}',                          estado:'despachado', fecha:'etd' },
      { id:'transbordo',      titulo:'En transbordo' },
      { id:'colon',           titulo:'Pasó por Panamá (Colón)' },
      { id:'llegada',         titulo:'Llegó al puerto de {destino}' },
      { id:'nacionalizacion', titulo:'En nacionalización' },
      { id:'disponible',      titulo:'Lista para entrega en {destino}' },
      { id:'entregado',       titulo:'Entregado',                                  estado:'entregado' },
    ],
  },
  otro: {
    l:'Otra ruta', bandera:'🌎', origen:'', mercancia:'general', frecuencia:'por_contenedor',
    hitos: [
      { id:'cierre',          titulo:'Cerró la recepción',                         estado:'cerrado' },
      { id:'cargado',         titulo:'Carga embarcada' },
      { id:'zarpe',           titulo:'Salió de {origen}',                          estado:'despachado', fecha:'etd' },
      { id:'llegada',         titulo:'Llegó a {destino}' },
      { id:'nacionalizacion', titulo:'En nacionalización' },
      { id:'disponible',      titulo:'Lista para entrega' },
      { id:'entregado',       titulo:'Entregado',                                  estado:'entregado' },
    ],
  },
}
export const EXTRA_HITOS = [
  { id:'novedad', titulo:'Novedad en el envío' },
  { id:'otro',    titulo:'' },
]
export const MERCANCIA = { general:'Mercancía general', especial:'Mercancía especial' }
export const FRECUENCIAS = { semanal:'Semanal', quincenal:'Quincenal', por_contenedor:'Por contenedor' }
export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const ORDEN_ESTADO = ['abierto', 'cerrado', 'despachado', 'entregado']

export const rutaDe = c => RUTAS[c?.ruta] || RUTAS[rutaPorOrigen(c?.origen)] || RUTAS.otro
export function rutaPorOrigen(origen) {
  const o = String(origen || '').toLowerCase()
  if (/miami|doral|florida/.test(o)) return 'miami'
  if (/col[oó]n|panam/.test(o)) return 'panama'
  if (/shangh|ningbo|shenzhen|guangzhou|yiwu|china|hong kong|qingdao|xiamen|tianjin/.test(o)) return 'china'
  return 'otro'
}
export const tituloHito = (h, c) => String(h.titulo || '').replace('{origen}', c?.origen || 'origen').replace('{destino}', c?.destino || 'destino')
// El siguiente hito que falta registrar
export function siguienteHito(c, hitos) {
  const hechos = new Set(hitos.map(h => h.hito))
  return rutaDe(c).hitos.find(h => !hechos.has(h.id)) || null
}
// Solo avanza el estado, nunca lo devuelve
export const estadoTrasHito = (actual, def) => def?.estado && ORDEN_ESTADO.indexOf(def.estado) > ORDEN_ESTADO.indexOf(actual || 'abierto') ? def.estado : null

// Semana del año (ISO) para nombrar los semanales: "Miami · semana 48"
export function semanaISO(iso) {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const ini = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - ini) / 86400000 + 1) / 7)
}
// Próxima fecha (desde hoy) que cae en ese día de la semana (1=lunes)
export function proximoDia(desdeISO, dia) {
  const d = new Date(desdeISO + 'T12:00:00')
  const hoy = d.getDay() || 7
  d.setDate(d.getDate() + ((dia - hoy + 7) % 7))
  return d.toISOString().slice(0, 10)
}
export const masDias = (iso, n) => { if (!iso) return null; const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }