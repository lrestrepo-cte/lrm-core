// Las tres puertas de LRM Corp: Business, MySpace y Capitán en Silencio.
// Se usa en la entrada (antes del login) y en el inicio (ya dentro).
import { ESPACIOS, NEGOCIOS } from '../lib/espacios'
import { LogoCorp, IconoNegocio } from './IconosMarca'

export function IconoEspacio({ tipo, size = 26 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' }
  if (tipo === 'business') return (
    <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12.5h18"/><path d="M10.5 12.5v1.5h3v-1.5"/></svg>
  )
  if (tipo === 'myspace') return (
    <svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.4"/></svg>
  )
  return (
    <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.2l2.6 1.9-1 3.1h-3.2l-1-3.1z"/><path d="M12 3.5v3.7M14.6 9.1l3.5-1.2M13.6 12.2l2.2 3M10.4 12.2l-2.2 3M9.4 9.1L5.9 7.9"/></svg>
  )
}

export default function PuertasCore({ onElegir, subtitulo }) {
  return (
    <div className="core-wrap">
      <div className="core-glow" aria-hidden="true" />
      <div className="core-inner">
        <header className="core-head">
          <h1 style={{ display:'flex', justifyContent:'center', margin:'0 0 6px' }}><LogoCorp ancho={300} /></h1>
          {subtitulo && <p className="core-sub" style={{ marginTop:6 }}>{subtitulo}</p>}
        </header>

        <div className="core-puertas">
          {ESPACIOS.map((e, i) => (
            <button key={e.id} type="button" className="core-puerta" onClick={() => onElegir(e.id)}
              style={{ '--acento': e.color, animationDelay: `${i * 70}ms` }}>
              <span className="core-puerta-icono"><IconoEspacio tipo={e.icono} /></span>
              <span className="core-puerta-txt">
                <span className="core-puerta-nombre">{e.nombre}</span>
                <span className="core-puerta-desc">{e.desc}</span>
              </span>
              <span className="core-puerta-flecha" aria-hidden="true">→</span>
            </button>
          ))}
        </div>

        <footer className="core-pie">Barranquilla · LRM Corp</footer>
      </div>
    </div>
  )
}
// Ya dentro: Business → elige el negocio (mismo listado de la entrada)
export function PuertasNegocios({ onElegir, onVolver }) {
  return (
    <div className="core-wrap">
      <div className="core-glow" aria-hidden="true" />
      <div className="core-inner">
        <button type="button" onClick={onVolver} className="btn" style={{ marginBottom:18, width:'auto', alignSelf:'flex-start' }}>← LRM Corp</button>
        <header className="core-head">
          <div className="core-eyebrow">LRM CORP</div>
          <h1 className="core-title">Business</h1>
          <p className="core-sub">Elige el negocio</p>
        </header>
        <div className="core-puertas">
          {NEGOCIOS.map((n, i) => (
            <button key={n.id} type="button" className="core-puerta" disabled={!n.activo} onClick={() => n.activo && onElegir(n.id)}
              style={{ '--acento': n.color, animationDelay: `${i * 50}ms`, ...(n.activo ? {} : { opacity:0.45, cursor:'default' }) }}>
              <span className="core-puerta-icono"><IconoNegocio id={n.id} size={24} color={n.color} /></span>
              <span className="core-puerta-txt">
                <span className="core-puerta-nombre">{n.nombre}</span>
                <span className="core-puerta-desc">{n.activo ? n.desc : 'Próximamente'}</span>
              </span>
              <span className="core-puerta-flecha" aria-hidden="true">{n.activo ? '→' : ''}</span>
            </button>
          ))}
        </div>
        <footer className="core-pie">Barranquilla · LRM Corp</footer>
      </div>
    </div>
  )
}