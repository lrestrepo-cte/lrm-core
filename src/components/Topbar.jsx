import { useState, useEffect } from 'react'

export default function Topbar({ titulo, usuario, onCerrarSesion }) {
  const [hora, setHora] = useState('')

  useEffect(() => {
    const update = () => setHora(new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }))
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [])

  const fecha = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{titulo || 'LRM Core'}</div>
        <div className="topbar-sub">Barranquilla · {fecha} · {hora}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div className="live-badge">● En vivo</div>
      </div>
    </div>
  )
}