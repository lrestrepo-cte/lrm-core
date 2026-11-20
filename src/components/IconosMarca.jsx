// Identidad visual de LRM Core: el logo (monograma LRM) y un ícono de línea por negocio.
// Todo en SVG para que se vea nítido en cualquier pantalla y tome el color del negocio.

export function LogoLRM({ size = 40, color = '#C9A84C', fondo = '#111' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="LRM">
      <rect x="2" y="2" width="60" height="60" rx="15" fill={fondo} stroke={color} strokeWidth="2.5" />
      <g stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 19v26h9" />
        <path d="M27 45V19h6.5a6.5 6.5 0 0 1 0 13H27M33.5 32l6 13" />
        <path d="M44 45V19l6 13 6-13v26" />
      </g>
    </svg>
  )
}

const TRAZOS = {
  // LRM Trade Consulting: el mundo y una ruta
  inversiones: <><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.5 3.6 5.4 3.6 8.5s-1.2 6-3.6 8.5"/><path d="M12 3.5C9.6 6 8.4 8.9 8.4 12s1.2 6 3.6 8.5"/></>,
  // ZABÚ: hot dog
  zabu: <><path d="M4 13.5c0 3.2 2.4 5.5 5.2 5.5h5.6c2.8 0 5.2-2.3 5.2-5.5"/><rect x="2.8" y="10" width="18.4" height="4.2" rx="2.1"/><path d="M6.5 12.1l1.8-.9 1.8.9 1.8-.9 1.8.9 1.8-.9 1.8.9"/></>,
  // RV Sports: media deportiva
  rv: <><path d="M9 3h6v8.2l3.3 4.2a3.1 3.1 0 0 1-4.8 3.9L8.4 13.6A2.6 2.6 0 0 1 9 12V3z"/><path d="M9 6.5h6"/><path d="M9 9h6"/></>,
  // LRM Inversiones: crecimiento
  'lrm-inversiones': <><path d="M4 19.5h16"/><path d="M5 15.5l4.2-4.2 3 3 6.3-7"/><path d="M14.5 7.3h4v4"/></>,
  // Las Bombas: bolón de verde
  bombas: <><circle cx="12" cy="13.5" r="6.5"/><path d="M12 7c0-2.2 1.6-3.8 3.8-3.8 0 2.2-1.6 3.8-3.8 3.8z"/><path d="M9.5 12.5h.01M14 15h.01M11 16.5h.01"/></>,
  // Coco Shake: vaso con pitillo
  coco: <><path d="M6.5 9h11l-1.3 11.5H7.8z"/><path d="M5.5 9h13"/><path d="M13.5 9l2-6h2.5"/><path d="M8 13.5h8"/></>,
  // Quesolote: mazorca
  quesolote: <><path d="M12 3c2.6 0 4.2 3.2 4.2 8.2S14.6 21 12 21s-4.2-4.8-4.2-9.8S9.4 3 12 3z"/><path d="M8.6 8.5h6.8M8 12.5h8M8.6 16.5h6.8"/><path d="M12 3v18"/></>,
  // Puffys: mini panquecas
  puffys: <><rect x="4" y="9" width="16" height="3" rx="1.5"/><rect x="3.5" y="12.8" width="17" height="3" rx="1.5"/><rect x="4" y="16.6" width="16" height="3" rx="1.5"/><path d="M9 9V6.5M12 9V5M15 9V6.5"/></>,
}

export function IconoNegocio({ id, size = 22, color = 'currentColor' }) {
  const t = TRAZOS[id]
  if (!t) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t}</svg>
  )
}
