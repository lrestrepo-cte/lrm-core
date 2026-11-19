import { useState, useEffect } from 'react'
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
import PuertasCore from './components/PuertasCore'
import CapitanEnSilencio from './pages/CapitanEnSilencio'
import { negocioPorId, ponerHash } from './lib/espacios'

const TITULOS = {
  dashboard:     'Business · Grupo LRM',
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
  inversiones:   'LRM Trade Consulting',
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
  useEffect(() => { localStorage.removeItem('lrm_usuario') }, [])
  const [usuario,     setUsuario]     = useState(null)
  const [vista,       setVista]       = useState('core')   // core | lrm | zabu | rv | inversiones | lrm-inversiones | myspace | capitan
  const [navActivo,   setNavActivo]   = useState('dashboard')
  const [negNav,      setNegNav]      = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isMobile, isTablet } = useBreakpoint()
  const esMovilOTablet = isMobile || isTablet

  // Entra a un negocio y deja el link directo en la barra (#/lrm-trade, #/zabu, ...)
  const entrarNegocio = (id) => {
    const n = negocioPorId(id)
    setVista(id)
    setNegNav('dashboard'); setNavActivo('dashboard'); setSidebarOpen(false)
    ponerHash(n?.slug || '')
  }
  const irCore    = () => { setVista('core'); setNavActivo('dashboard'); setSidebarOpen(false); ponerHash('') }
  const volverLRM = () => { setVista('lrm'); setNavActivo('dashboard'); setSidebarOpen(false); ponerHash('') }
  const elegirEspacio = (id) => {
    if (id === 'business') return volverLRM()
    setVista(id); setSidebarOpen(false); ponerHash('')
  }

  const handleLogin = (u, destino = {}) => {
    setUsuario(u)
    if (destino.negocio) entrarNegocio(destino.negocio)
    else if (destino.espacio === 'myspace' || destino.espacio === 'capitan') setVista(destino.espacio)
    else setVista('core')
  }
  const cerrarSesion  = () => { localStorage.removeItem('lrm_usuario'); setUsuario(null); setVista('core'); setNavActivo('dashboard'); setSidebarOpen(false); ponerHash('') }
  const handleNav     = (id) => {
    if (vista==='zabu'||vista==='rv') { setNegNav(id); setNavActivo(id) }
    else { setNavActivo(id) }
    setSidebarOpen(false)
  }

  if (!usuario)                 return <Login onLogin={handleLogin} />
  if (usuario.rol==='vendedor') return <VendedorApp usuario={usuario} onCerrarSesion={cerrarSesion} />
  if (usuario.rol==='cocina')   return <CocinaApp   usuario={usuario} onCerrarSesion={cerrarSesion} />

  // LRM Core: las tres puertas
  if (vista === 'core') return <PuertasCore onElegir={elegirEspacio} subtitulo={`Hola, ${usuario.nombre?.split(' ')[0] || ''}. ¿A dónde vamos?`} />

  // MySpace y Capitán en Silencio: espacios privados, sin la barra de negocios
  if (vista === 'myspace' || vista === 'capitan') return (
    <div className="app-root">
      <div className="main-area">
        <div className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={irCore} className="btn" style={{ fontSize:12 }}>← LRM Core</button>
            <div className="topbar-title">{vista === 'myspace' ? 'MySpace' : 'Capitán en Silencio'}</div>
          </div>
          <button onClick={cerrarSesion} className="btn" style={{ fontSize:12 }}>Salir</button>
        </div>
        <div className="page-content">{vista === 'myspace' ? <MySpace /> : <CapitanEnSilencio />}</div>
      </div>
    </div>
  )

  // Cada negocio es una vista con su propio layout (sidebar + topbar)
  const isZabu = vista === 'zabu'
  const isRV   = vista === 'rv'
  const isInversiones = vista === 'inversiones'
  const isLRMInv = vista === 'lrm-inversiones'

  const tituloTopbar = isZabu ? 'ZABÚ — Hot Dogs de Verdad'
    : isRV   ? 'RV Sports — Calcetines'
    : isInversiones ? 'LRM Trade Consulting'
    : isLRMInv ? 'LRM Inversiones'
    : (TITULOS[navActivo] || 'Business')

  const renderContenido = () => {
    // "configuracion" y "myspace" solo existen fuera de los negocios
    if (!isZabu && !isRV && !isInversiones && !isLRMInv) {
      if (navActivo === 'myspace')       return <MySpace />
      if (navActivo === 'configuracion') return <LRMConfiguracion />
    }
    if (isZabu)        return <ZabuApp navExterno={negNav} onNavChange={(id)=>{setNegNav(id);setNavActivo(id)}} usuario={usuario} />
    if (isRV)          return <RVApp   navExterno={negNav} onNavChange={(id)=>{setNegNav(id);setNavActivo(id)}} usuario={usuario} />
    if (isInversiones) return <LRMInversiones modo="trade" tab={navActivo} onTab={setNavActivo} />
    if (isLRMInv)      return <LRMInversiones modo="inversiones" />
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
          onNavLRM={handleNav} onVolverLRM={volverLRM} onIrCore={irCore}
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