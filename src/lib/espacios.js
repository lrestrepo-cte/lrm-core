// Estructura de LRM Core: tres espacios y los negocios que cuelgan de Business.
// Cada negocio tiene su "slug": el link directo es  https://<dominio>/#/<slug>
// (ej. #/lrm-trade, #/rv-sports, #/zabu) y abre la entrada propia de ese negocio.

export const ESPACIOS = [
  { id:'business', nombre:'Business',            desc:'LRM Trade, ZABÚ, RV Sports, Inversiones y los que vienen', color:'#C9A84C', icono:'business' },
  { id:'myspace',  nombre:'MySpace',             desc:'Finanzas, Lucía, fitness, espiritualidad y lo personal',   color:'#7B93FF', icono:'myspace'  },
  { id:'capitan',  nombre:'Capitán en Silencio', desc:'La serie: fútbol, fe, música y contenido',                  color:'#3FB68B', icono:'capitan'  },
]

// acceso: 'ceo'  → entra con correo y contraseña
//         'pin'  → el equipo entra con rol + PIN; el dueño entra con correo y contraseña
export const NEGOCIOS = [
  { id:'inversiones',     slug:'lrm-trade',       nombre:'LRM Trade Consulting', desc:'Comercio internacional e importaciones', color:'#C9A84C', emoji:'🌐', acceso:'ceo', activo:true  },
  { id:'zabu',            slug:'zabu',            nombre:'ZABÚ',                 desc:'Hot Dogs de Verdad',                     color:'#E8A23A', emoji:'🌭', acceso:'pin', activo:true  },
  { id:'rv',              slug:'rv-sports',       nombre:'RV Sports',            desc:'Calcetines deportivos',                  color:'#378ADD', emoji:'⚽', acceso:'pin', activo:true  },
  { id:'lrm-inversiones', slug:'lrm-inversiones', nombre:'LRM Inversiones',      desc:'Préstamos, portafolio y simulador',      color:'#9C27B0', emoji:'📈', acceso:'ceo', activo:true  },
  { id:'bombas',          slug:'las-bombas',      nombre:'Las Bombas',           desc:'Bolón de verde',                         color:'#4caf50', emoji:'💣', acceso:'pin', activo:false },
  { id:'coco',            slug:'coco-shake',      nombre:'Coco Shake',           desc:'Shakes de coco',                         color:'#00BCD4', emoji:'🥥', acceso:'pin', activo:false },
  { id:'quesolote',       slug:'quesolote',       nombre:'Quesolote',            desc:'Esquites mexicanos',                     color:'#FF9800', emoji:'🌽', acceso:'pin', activo:false },
  { id:'puffys',          slug:'puffys',          nombre:'Puffys',               desc:'Mini panquecas',                         color:'#E04F9C', emoji:'🥞', acceso:'pin', activo:false },
]

export const negocioPorId   = (id)   => NEGOCIOS.find(n => n.id === id)
export const negocioPorSlug = (slug) => NEGOCIOS.find(n => n.slug === slug)

export function slugDesdeHash() {
  return (window.location.hash || '').replace(/^#\/?/, '').split('/')[0] || ''
}

export function ponerHash(slug) {
  const url = slug ? `#/${slug}` : window.location.pathname + window.location.search
  window.history.replaceState(null, '', url)
}