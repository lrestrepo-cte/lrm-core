import { useState } from 'react'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import LRMDashboard from './pages/LRMDashboard'
import LRMFinanzas from './pages/LRMFinanzas'
import LRMBiEjecutivo from './pages/LRMBiEjecutivo'
import LRMConfiguracion from './pages/LRMConfiguracion'
import LRMInversiones from './pages/LRMInversiones'
import ZabuApp from './modules/zabu/ZabuApp'
import ZabuComandero from './modules/zabu/ZabuComandero'
import RVApp from './modules/rv/RVApp'
import MySpace from './pages/MySpace'
import { AperturaTurno, PanelTurno } from './modules/zabu/ZabuTurno'
import { useBreakpoint } from './hooks/useBreakpoint'

const TITULOS = {
  dashboard:     'Dashboard LRM Trade',
  finanzas:      'Plan Financiero',
  bi:            'BI Ejecutivo',
  consolidado:   'Consolidado',
  informes:      'Informes',
  crm:           'CRM',
  marketing:     'Marketing',
  personal:      'Personal',
  calidad:       'Calidad',
  agenda:        'Agenda',
  contabilidad:  'Contabilidad',
  configuracion: 'Configuración LRM Core',
  myspace:       'My Space',
  inversiones:   'LRM Inversiones',
}

function VendedorApp({ usuario, onCerrarSesion }) {
  const [turno,    setTurno]    = useState(null)
  const [verTurno, setVerTurno] = useState(false)
  const { isMobile } = useBreakpoint()

  if (!turno) return <AperturaTurno usuario={usuario} onTurnoAbierto={setTurno} />

  return (
    <div className="app-root">
      {verTurno && (
        <PanelTurno
          turno={turno} usuario={usuario}
          onCerrar={() => setVerTurno(false)}
          onTurnoCerrado={() => { setVerTurno(false); setTurno(null) }}
        />
      )}
      <div className="main-area">
        <div className="topbar">
          <div>
            <div className="topbar-title">POS — {usuario.carrito}</div>
            <div className="topbar-sub">
              {usuario.nombre}
              {turno.hora_apertura
                ? ` · Turno desde ${new Date(turno.hora_apertura).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}`
                : ' · Turno activo'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setVerTurno(true)} style={{
              padding:isMobile?'6px 10px':'7px 14px', borderRadius:8, cursor:'pointer',
              fontSize:isMobile?11:12, fontWeight:600,
              background:'rgba(201,168,76,0.1)', border:'0.5px solid var(--gold-border)',
              color:'var(--gold)', fontFamily:'inherit',
            }}>
              {isMobile ? '📊' : '📊 Turno'}
            </button>
            <button onClick={onCerrarSesion} className="btn" style={{ fontSize:isMobile?11:12 }}>
              {isMobile ? '✕' : 'Salir'}
            </button>
          </div>
        </div>
        <div className="page-content">
          <ZabuApp rolForzado="pos" usuario={usuario} />
        </div>
      </div>
    </div>
  )
}

function CocinaApp({ usuario, onCerrarSesion }) {
  const { isMobile } = useBreakpoint()
  return (
    <div className="app-root">
      <div className="main-area">
        <div className="topbar">
          <div>
            <div className="topbar-title">Cocina — Comandero</div>
            <div className="topbar-sub">{usuario.nombre} · {usuario.carrito}</div>
          </div>
          <button onClick={onCerrarSesion} className="btn" style={{ fontSize:isMobile?11:12 }}>
            {isMobile ? '✕' : 'Salir'}
          </button>
        </div>
        <div className="page-content"><ZabuComandero /></div>
      </div>
    </div>
  )
}

export default function App() {
  useState(() => { localStorage.removeItem('lrm_usuario') })

  const [usuario,     setUsuario]     = useState(null)
  const [vista,       setVista]       = useState('lrm')
  const [navActivo,   setNavActivo]   = useState('dashboard')
  const [negNav,      setNegNav]      = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isMobile, isTablet } = useBreakpoint()
  const esMovilOTablet = isMobile || isTablet

  const handleLogin   = (u) => { localStorage.setItem('lrm_usuario', JSON.stringify(u)); setUsuario(u) }
  const cerrarSesion  = () => { localStorage.removeItem('lrm_usuario'); setUsuario(null); setVista('lrm'); setNavActivo('dashboard'); setSidebarOpen(false) }
  const entrarNegocio = (id) => { setVista(id); setNegNav('dashboard'); setNavActivo('dashboard'); setSidebarOpen(false) }
  const volverLRM     = () => { setVista('lrm'); setNavActivo('dashboard'); setSidebarOpen(false) }
  const handleNav     = (id) => {
    if (vista==='zabu'||vista==='rv') { setNegNav(id); setNavActivo(id) }
    else { setNavActivo(id) }
    setSidebarOpen(false)
  }

  if (!usuario)                 return <Login onLogin={handleLogin} />
  if (usuario.rol==='vendedor') return <VendedorApp usuario={usuario} onCerrarSesion={cerrarSesion} />
  if (usuario.rol==='cocina')   return <CocinaApp   usuario={usuario} onCerrarSesion={cerrarSesion} />

  // IMPORTANTE: estas variables se usan dentro de renderContenido() y del JSX de retorno.
  // 'inversiones' se trata exactamente igual que zabu/rv: una vista de negocio con su propio
  // layout completo (sidebar + topbar), NO un return temprano fuera del layout.
  const isZabu = vista === 'zabu'
  const isRV   = vista === 'rv'
  const isInversiones = vista === 'inversiones'

  const tituloTopbar = isZabu ? 'ZABÚ — Hot Dogs de Verdad'
    : isRV   ? 'RV Sports — Calcetines'
    : isInversiones ? 'LRM Inversiones'
    : (TITULOS[navActivo] || 'LRM Trade')

  const renderContenido = () => {
    if (navActivo === 'myspace')       return <MySpace />
    if (navActivo === 'configuracion') return <LRMConfiguracion />
    if (isZabu)        return <ZabuApp navExterno={negNav} onNavChange={(id)=>{setNegNav(id);setNavActivo(id)}} usuario={usuario} />
    if (isRV)          return <RVApp   navExterno={negNav} onNavChange={(id)=>{setNegNav(id);setNavActivo(id)}} usuario={usuario} />
    if (isInversiones) return <LRMInversiones />
    switch (navActivo) {
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
      {esMovilOTablet && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }} />
      )}
      <div style={{
        position:   esMovilOTablet ? 'fixed' : 'relative',
        left:       esMovilOTablet ? (sidebarOpen ? 0 : -260) : 'auto',
        top:0, bottom:0, zIndex:50,
        transition:'left .25s ease', flexShrink:0,
      }}>
        <Sidebar
          vista={vista} navActivo={navActivo}
          onNavLRM={handleNav} onVolverLRM={volverLRM}
          onEntrarNegocio={entrarNegocio}
          usuario={usuario} onCerrarSesion={cerrarSesion}
        />
      </div>
      <div className="main-area">
        <Topbar
          titulo={tituloTopbar} usuario={usuario}
          onCerrarSesion={cerrarSesion}
          onMenuToggle={() => setSidebarOpen(p=>!p)}
          showMenu={esMovilOTablet}
        />
        <div className="page-content">{renderContenido()}</div>
      </div>
    </div>
  )
}
