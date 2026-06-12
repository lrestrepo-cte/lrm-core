import { useState } from 'react'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import LRMDashboard from './pages/LRMDashboard'
import LRMFinanzas from './pages/LRMFinanzas'
import LRMBiEjecutivo from './pages/LRMBiEjecutivo'
import ZabuApp from './modules/zabu/ZabuApp'
import { useBreakpoint } from './hooks/useBreakpoint'

const TITULOS = {
  dashboard:    'Dashboard LRM Trade',
  finanzas:     'Plan Financiero',
  bi:           'BI Ejecutivo',
  consolidado:  'Consolidado',
  informes:     'Informes',
  crm:          'CRM',
  marketing:    'Marketing',
  personal:     'Personal',
  calidad:      'Calidad',
  agenda:       'Agenda',
  contabilidad: 'Contabilidad',
  configuracion:'Configuración',
}

export default function App() {
  const [usuario, setUsuario]   = useState(() => {
    try { const s = localStorage.getItem('lrm_usuario'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [vista,      setVista]      = useState('lrm')
  const [navActivo,  setNavActivo]  = useState('dashboard')
  const [zabuNav,    setZabuNav]    = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isMobile, isTablet } = useBreakpoint()

  const cerrarSesion = () => {
    localStorage.removeItem('lrm_usuario')
    setUsuario(null); setVista('lrm'); setNavActivo('dashboard')
  }

  const entrarNegocio = (id) => {
    setVista(id); setZabuNav('dashboard'); setNavActivo('dashboard')
    setSidebarOpen(false)
  }

  const volverLRM = () => {
    setVista('lrm'); setNavActivo('dashboard'); setSidebarOpen(false)
  }

  const handleNav = (id) => {
    if (vista === 'zabu') { setZabuNav(id); setNavActivo(id) }
    else { setNavActivo(id) }
    setSidebarOpen(false)
  }

  if (!usuario) return <Login onLogin={(u) => { localStorage.setItem('lrm_usuario', JSON.stringify(u)); setUsuario(u) }} />

  if (usuario.rol === 'vendedor') {
    return (
      <div className="app-root">
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">Ventas POS — {usuario.carrito}</div>
              <div className="topbar-sub">{usuario.nombre}</div>
            </div>
            <button onClick={cerrarSesion} className="btn">Salir</button>
          </div>
          <div className="page-content"><ZabuApp rolForzado="pos" /></div>
        </div>
      </div>
    )
  }

  if (usuario.rol === 'cocina') {
    return (
      <div className="app-root">
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">🍳 Cocina — Comandas</div>
              <div className="topbar-sub">{usuario.nombre}</div>
            </div>
            <button onClick={cerrarSesion} className="btn">Salir</button>
          </div>
          <div className="page-content"><ZabuApp rolForzado="comandero" /></div>
        </div>
      </div>
    )
  }

  const isZabu = vista === 'zabu'
  const tituloTopbar = isZabu ? 'ZABÚ — Hot Dogs de Verdad' : (TITULOS[navActivo] || 'LRM Trade')

  const renderContenido = () => {
    if (isZabu) return <ZabuApp navExterno={zabuNav} onNavChange={(id) => { setZabuNav(id); setNavActivo(id) }} />
    switch(navActivo) {
      case 'dashboard': return <LRMDashboard onEntrarNegocio={entrarNegocio} />
      case 'finanzas':  return <LRMFinanzas />
      case 'bi':        return <LRMBiEjecutivo />
      default: return (
        <div className="panel" style={{ maxWidth:500 }}>
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:2, marginBottom:12 }}>{TITULOS[navActivo]?.toUpperCase()}</div>
          <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Módulo en construcción</div>
          <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.8 }}>Próximamente disponible.</div>
        </div>
      )
    }
  }

  return (
    <div className="app-root" style={{ position:'relative' }}>

      {/* Overlay móvil */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }} />
      )}

      {/* Sidebar */}
      <div style={{
        position: (isMobile || isTablet) ? 'fixed' : 'relative',
        left: (isMobile || isTablet) ? (sidebarOpen ? 0 : -250) : 'auto',
        top: 0, bottom: 0, zIndex: 50,
        transition: 'left .25s ease',
        flexShrink: 0,
      }}>
        <Sidebar
          vista={vista} navActivo={navActivo}
          onNavLRM={handleNav} onVolverLRM={volverLRM}
          onEntrarNegocio={entrarNegocio}
          usuario={usuario} onCerrarSesion={cerrarSesion}
        />
      </div>

      {/* Main */}
      <div className="main-area">
        <Topbar
          titulo={tituloTopbar}
          usuario={usuario}
          onCerrarSesion={cerrarSesion}
          onMenuToggle={() => setSidebarOpen(p => !p)}
          showMenu={isMobile || isTablet}
        />
        <div className="page-content">
          {renderContenido()}
        </div>
      </div>
    </div>
  )
}