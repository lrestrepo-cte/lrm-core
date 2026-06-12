import { useState } from 'react'
import ZabuDashboard from './ZabuDashboard'
import ZabuPOS from './ZabuPOS'
import ZabuRecetario from './ZabuRecetario'
import ZabuInventario from './ZabuInventario'
import ZabuCostos from './ZabuCostos'
import ZabuComandero from './ZabuComandero'
import ZabuProyeccion from './ZabuProyeccion'
import ZabuPersonal from './ZabuPersonal'
import ZabuContabilidad from './ZabuContabilidad'
import ZabuVencimientos from './ZabuVencimientos'
import ZabuPEPS from './ZabuPEPS'
import ZabuFIFO from './ZabuFIFO'
import ZabuConfiguracion from './ZabuConfiguracion'

const NAV = [
  { id:'dashboard',    label:'Dashboard'    },
  { id:'pos',          label:'Ventas POS'   },
  { id:'recetario',    label:'Recetario'    },
  { id:'peps',         label:'PEPs'         },
  { id:'inventario',   label:'Inventario'   },
  { id:'fifo',         label:'FIFO'         },
  { id:'costos',       label:'Costos'       },
  { id:'comandero',    label:'Comandero'    },
  { id:'proyeccion',   label:'Proyecciones' },
  { id:'personal',     label:'Personal'     },
  { id:'contabilidad', label:'Contabilidad' },
  { id:'vencimientos', label:'Vencimientos' },
  { id:'configuracion', label:'⚙ Configuración' },
]

export default function ZabuApp({ rolForzado, navExterno, onNavChange, usuario }) {
  const [nav, setNav] = useState(rolForzado || navExterno || 'dashboard')

  const cambiarNav = (id) => {
    setNav(id)
    if (onNavChange) onNavChange(id)
  }

  const renderModulo = () => {
    switch(nav) {
      case 'dashboard':   return <ZabuDashboard />
      case 'pos':         return <ZabuPOS />
      case 'recetario':   return <ZabuRecetario />
      case 'inventario':  return <ZabuInventario />
      case 'costos':      return <ZabuCostos />
      case 'comandero':   return <ZabuComandero />
      case 'proyeccion':  return <ZabuProyeccion />
      case 'personal':    return <ZabuPersonal />
      case 'contabilidad': return <ZabuContabilidad />
      case 'vencimientos': return <ZabuVencimientos />
      case 'peps':         return <ZabuPEPS />
      case 'fifo':         return <ZabuFIFO />
      case 'configuracion': return <ZabuConfiguracion />
      default: return (
        <div className="panel" style={{ maxWidth:500 }}>
          <div className="panel-title">{NAV.find(n => n.id === nav)?.label?.toUpperCase()}</div>
          <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.8 }}>
            Módulo en construcción. Próximamente disponible.
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <div className="sub-nav" style={{ display: rolForzado ? 'none' : 'flex' }}>
        {NAV.map(n => (
          <div
            key={n.id}
            className={`sub-nav-item${nav === n.id ? ' active' : ''}`}
            onClick={() => cambiarNav(n.id)}
          >
            {n.label}
          </div>
        ))}
      </div>
      {renderModulo()}
    </>
  )
}