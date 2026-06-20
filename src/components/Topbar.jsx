import { useState, useEffect } from 'react'

export default function Topbar({ titulo, onMenuToggle, showMenu }) {
  const [hora, setHora] = useState('')

  useEffect(() => {
    const update = () => setHora(new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }))
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [])

  const fecha = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div className="topbar">
      <div style={{ position:'fixed', top:4, right:4, background:'red', color:'white', fontSize:11, padding:'3px 8px', zIndex:9999, borderRadius:4, fontWeight:700 }}>
        w:{window.innerWidth} showMenu:{String(showMenu)}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {showMenu && (
          <div onClick={onMenuToggle} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:16, height:1.5, background:'var(--text2)', borderRadius:1 }} />)}
            </div>
          </div>
        )}
        <div>
          <div className="topbar-title">{titulo || 'LRM Core'}</div>
          <div className="topbar-sub">Barranquilla · {fecha} · {hora}</div>
        </div>
      </div>
      <div className="live-badge">● En vivo</div>
    </div>
  )
}