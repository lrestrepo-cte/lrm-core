// @ts-nocheck
import ZabuDashboard    from './ZabuDashboard'
import ZabuPOS          from './ZabuPOS'
import ZabuRecetario    from './ZabuRecetario'
import ZabuInventario   from './ZabuInventario'
import ZabuCostos       from './ZabuCostos'
import ZabuComandero    from './ZabuComandero'
import ZabuProyeccion   from './ZabuProyeccion'
import ZabuPersonal     from './ZabuPersonal'
import ZabuContabilidad from './ZabuContabilidad'
import ZabuVencimientos from './ZabuVencimientos'
import ZabuFichaTecnica from './ZabuFichaTecnica'
import ZabuFIFO         from './ZabuFIFO'
import ZabuConfiguracion from './ZabuConfiguracion'
import ZabuPlanNegocio from './ZabuPlanNegocio'
import ZabuCampanaApertura from './ZabuCampanaApertura'
import ZabuCompras      from './ZabuCompras'
import ZabuCarrito      from './ZabuCarrito'
import MySpace from './MySpace'

const NAV = [
  { id:'dashboard',    label:'Dashboard'         },
  { id:'pos',          label:'Ventas POS'        },
  { id:'recetario',    label:'Recetario'         },
  { id:'fichatecnica', label:'Ficha Técnica'     },
  { id:'inventario',   label:'Inventario'        },
  { id:'fifo',         label:'FIFO'              },
  { id:'costos',       label:'Costos'            },
  { id:'comandero',    label:'Comandero'         },
  { id:'proyeccion',   label:'Proyecciones'      },
  { id:'personal',     label:'Personal'          },
  { id:'contabilidad', label:'Contabilidad'      },
  { id:'vencimientos', label:'Vencimientos'      },
  { id:'configuracion',label:'⚙ Configuración'  },
  { id:'plan',         label:'📋 Plan Negocio'  },
  { id:'campana',      label:'🚀 Campaña Apertura' },
  { id:'compras',      label:'🛒 Compras'       },
  { id:'carrito',      label:'🚗 Carrito ZABÚ'  },
  { id:'myspace',      label:'🌌 My Space'  },
]

export default function ZabuApp({ rolForzado, navExterno, onNavChange, usuario }) {
  const nav = rolForzado || navExterno || 'dashboard'

  const renderModulo = () => {
    switch (nav) {
      case 'dashboard':     return <ZabuDashboard />
      case 'pos':           return <ZabuPOS usuario={usuario} />
      case 'recetario':     return <ZabuRecetario />
      case 'inventario':    return <ZabuInventario />
      case 'costos':        return <ZabuCostos />
      case 'comandero':     return <ZabuComandero />
      case 'proyeccion':    return <ZabuProyeccion />
      case 'personal':      return <ZabuPersonal />
      case 'contabilidad':  return <ZabuContabilidad />
      case 'vencimientos':  return <ZabuVencimientos />
      case 'fichatecnica':  return <ZabuFichaTecnica usuario={usuario} />
      case 'fifo':          return <ZabuFIFO />
      case 'configuracion': return <ZabuConfiguracion />
      case 'plan':          return <ZabuPlanNegocio />
      case 'campana':       return <ZabuCampanaApertura />
      case 'compras':       return <ZabuCompras />
      case 'carrito':       return <ZabuCarrito />
      case 'myspace':       return <MySpace />
      default: return (
        <div className="panel" style={{ maxWidth: 500 }}>
          <div className="panel-title">{NAV.find(n => n.id === nav)?.label?.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.8 }}>
            Módulo en construcción. Próximamente disponible.
          </div>
        </div>
      )
    }
  }

  return renderModulo()
}
