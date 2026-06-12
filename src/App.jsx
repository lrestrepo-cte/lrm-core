import { useState } from 'react'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import LRMDashboard from './pages/LRMDashboard'
import LRMFinanzas from './pages/LRMFinanzas'
import ZabuApp from './modules/zabu/ZabuApp'

const TITULOS = {
  dashboard:    'Dashboard LRM Trade',
  finanzas:     'Plan Financiero — LRM Trade',
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
  const [usuario,    setUsuario]    = useState(null)
  const [vista,      setVista]      = useState('lrm')
  const [navActivo,  setNavActivo]  = useState('dashboard')
  const [zabuNav,    setZabuNav]    = useState('dashboard')

  const cerrarSesion = () => { setUsuario(null); setVista('lrm'); setNavActivo('dashboard') }

  const entrarNegocio = (id) => {
    setVista(id)
    setZabuNav('dashboard')
    setNavActivo('dashboard')
  }

  const volverLRM = () => {
    setVista('lrm')
    setNavActivo('dashboard')
  }

  const handleNav = (id) => {
    if (vista === 'zabu') {
      setZabuNav(id)
      setNavActivo(id)
    } else {
      setNavActivo(id)
    }
  }

  if (!usuario) return <Login onLogin={setUsuario} />

  // Vendedor → directo al POS
  if (usuario.rol === 'vendedor') {
    return (
      <div className="app-root">
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">Ventas POS — {usuario.carrito}</div>
              <div className="topbar-sub">{usuario.nombre}</div>
            </div>
            <button onClick={cerrarSesion} className="btn">Cerrar sesión</button>
          </div>
          <div className="page-content">
            <ZabuApp rolForzado="pos" />
          </div>
        </div>
      </div>
    )
  }

  // Cocina → directo a comandas
  if (usuario.rol === 'cocina') {
    return (
      <div className="app-root">
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">🍳 Cocina — Comandas</div>
              <div className="topbar-sub">{usuario.nombre}</div>
            </div>
            <button onClick={cerrarSesion} className="btn">Cerrar sesión</button>
          </div>
          <div className="page-content">
            <ZabuApp rolForzado="comandero" />
          </div>
        </div>
      </div>
    )
  }

  // CEO → acceso completo
  const isZabu = vista === 'zabu'
  const tituloTopbar = isZabu ? 'ZABÚ — Hot Dogs de Verdad' : (TITULOS[navActivo] || 'LRM Trade')

  const renderContenido = () => {
    if (isZabu) return <ZabuApp navExterno={zabuNav} onNavChange={setZabuNav} />
    switch(navActivo) {
      case 'dashboard':    return <LRMDashboard onEntrarNegocio={entrarNegocio} />
      case 'finanzas':     return <LRMFinanzas />
      default: return (
        <div className="panel" style={{ maxWidth:500 }}>
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:2, marginBottom:12 }}>{TITULOS[navActivo]?.toUpperCase()}</div>
          <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Módulo en construcción</div>
          <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.8 }}>
            Este módulo está planificado y se activará próximamente. La estructura ya está lista.
          </div>
        </div>
      )
    }
  }

  return (
    <div className="app-root">
      <Sidebar
        vista={vista}
        navActivo={navActivo}
        onNavLRM={handleNav}
        onVolverLRM={volverLRM}
        onEntrarNegocio={entrarNegocio}
        usuario={usuario}
        onCerrarSesion={cerrarSesion}
      />
      <div className="main-area">
        <Topbar titulo={tituloTopbar} usuario={usuario} onCerrarSesion={cerrarSesion} />
        <div className="page-content">
          {renderContenido()}
        </div>
      </div>
    </div>
  )
}