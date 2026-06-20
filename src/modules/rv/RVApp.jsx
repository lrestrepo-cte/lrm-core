import { useState, useEffect } from 'react'
import RVDashboard      from './RVDashboard'
import RVPOS            from './RVPOS'
import RVPedidos        from './RVPedidos'
import RVCatalogo       from './RVCatalogo'
import RVInventario     from './RVInventario'
import RVClientes       from './RVClientes'
import RVImportaciones  from './RVImportaciones'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const NAV = [
  { id:'dashboard',      label:'Dashboard'       },
  { id:'pos',            label:'POS'             },
  { id:'pedidos',        label:'Pedidos'         },
  { id:'catalogo',       label:'Catálogo'        },
  { id:'inventario',     label:'Inventario'      },
  { id:'importaciones',  label:'Importaciones'   },
  { id:'clientes',       label:'Clientes'        },
]

export default function RVApp({ navExterno, onNavChange, usuario }) {
  const [nav, setNav] = useState(navExterno || 'dashboard')
  const { isMobile, isTablet } = useBreakpoint()
  const mostrarSubNav = isMobile || isTablet

  // El sidebar (en App.jsx, componente padre) controla la navegación real vía
  // navExterno. Sin este efecto, el estado interno "nav" se queda congelado en
  // su valor inicial la primera vez que se monta el componente, y un clic en
  // el sidebar (ej. "Importaciones") nunca se refleja aquí — por eso no pasaba
  // nada al hacer clic. Este efecto sincroniza nav cada vez que navExterno cambia.
  useEffect(() => {
    if (navExterno && navExterno !== nav) setNav(navExterno)
  }, [navExterno])

  const cambiarNav = (id) => {
    setNav(id)
    if (onNavChange) onNavChange(id)
  }

  const renderModulo = () => {
    switch (nav) {
      case 'dashboard':     return <RVDashboard />
      case 'pos':           return <RVPOS usuario={usuario} />
      case 'pedidos':       return <RVPedidos usuario={usuario} />
      case 'catalogo':      return <RVCatalogo />
      case 'inventario':    return <RVInventario />
      case 'importaciones': return <RVImportaciones />
      case 'clientes':      return <RVClientes />
      default: return (
        <div className="panel" style={{ maxWidth:500 }}>
          <div className="panel-title">{NAV.find(n=>n.id===nav)?.label?.toUpperCase()}</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>Módulo en construcción.</div>
        </div>
      )
    }
  }

  return (
    <>
      {mostrarSubNav && (
        <div className="sub-nav">
          {NAV.map(n => (
            <div key={n.id} className={`sub-nav-item${nav===n.id?' active':''}`} onClick={() => cambiarNav(n.id)}>
              {n.label}
            </div>
          ))}
        </div>
      )}
      {renderModulo()}
    </>
  )
}
