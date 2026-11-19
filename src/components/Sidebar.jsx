const NEGOCIOS = [
  { id:'zabu',        nombre:'ZABÚ',            color:'#C9A84C', estado:'activo'  },
  { id:'rv',          nombre:'RV Sports',       color:'#378ADD', estado:'activo'  },
  { id:'inversiones', nombre:'LRM Trade Consulting', color:'#C9A84C', estado:'activo'  },
  { id:'lrm-inversiones', nombre:'LRM Inversiones', color:'#9C27B0', estado:'activo'  },
  { id:'bombas',      nombre:'Las Bombas',      color:'#4caf50', estado:'dev'     },
  { id:'coco',        nombre:'Coco Shake',      color:'#00BCD4', estado:'pronto'  },
  { id:'quesolote',   nombre:'Quesolote',       color:'#FF9800', estado:'pronto'  },
  { id:'puffys',      nombre:'Puffys',          color:'#9C27B0', estado:'pronto'  },
]
const ACTIVOS = ['zabu', 'rv', 'inversiones', 'lrm-inversiones']
const NAV_LRM = [
  {
    seccion:'General',
    items:[
      { id:'dashboard',  label:'Dashboard',       activo:true  },
      { id:'bi',         label:'BI Ejecutivo',     activo:true  },
      { id:'consolidado',label:'Consolidado',      activo:false },
      { id:'informes',   label:'Informes',         activo:false },
    ]
  },
  {
    seccion:'Comercial',
    items:[
      { id:'crm',       label:'CRM',       activo:false },
      { id:'marketing', label:'Marketing', activo:false },
    ]
  },
  {
    seccion:'Operación',
    items:[
      { id:'personal', label:'Personal', activo:false },
      { id:'calidad',  label:'Calidad',  activo:false },
      { id:'agenda',   label:'Agenda',   activo:false },
    ]
  },
  {
    seccion:'Finanzas',
    items:[
      { id:'finanzas',     label:'Plan financiero', activo:true  },
      { id:'contabilidad', label:'Contabilidad',    activo:false },
    ]
  },
  {
    seccion:'Sistema',
    items:[
      { id:'configuracion', label:'Configuración', activo:true },
    ]
  },
]
const NAV_ZABU = [
  {
    seccion:'Operación',
    items:[
      { id:'dashboard',  label:'Dashboard'  },
      { id:'pos',        label:'Ventas POS' },
      { id:'comandero',  label:'Comandero'  },
      { id:'plan', label:'📋 Plan de Negocio' },
      { id:'campana', label:'🚀 Campaña Apertura' },
    ]
  },
  {
    seccion:'Producto',
    items:[
      { id:'recetario',    label:'Recetario'      },
      { id:'fichatecnica', label:'Ficha Técnica'  },
    ]
  },
  {
    seccion:'Inventario',
    items:[
      { id:'inventario',  label:'Inventario'   },
      { id:'vencimientos',label:'Vencimientos' },
      { id:'fifo',        label:'FIFO'         },
      { id:'compras',     label:'Compras'      },
    ]
  },
  {
    seccion:'Finanzas',
    items:[
      { id:'costos',       label:'Costos'       },
      { id:'proyeccion',   label:'Proyecciones' },
      { id:'personal',     label:'Personal'     },
      { id:'contabilidad', label:'Contabilidad' },
    ]
  },
  {
    seccion:'Sistema',
    items:[
      { id:'configuracion', label:'⚙ Configuración' },
    ]
  },
]
// LRM Trade Consulting: menú propio con íconos. activo:false = "Pronto"
const NAV_TRADE = [
  { seccion:'General',   items:[ { id:'dashboard',   label:'Inicio',         icono:'inicio',     activo:true  } ] },
  { seccion:'Comercial', items:[
      { id:'clientes',    label:'CRM',            icono:'crm',        activo:true  },
      { id:'red',         label:'Red comercial',  icono:'red',        activo:true  },
      { id:'comex',       label:'Cotizador',      icono:'cotizador',  activo:true  },
  ] },
  { seccion:'Logística', items:[
      { id:'logistica',   label:'Cargas y guías', icono:'cargas',     activo:true  },
      { id:'operaciones', label:'Operaciones',    icono:'operaciones',activo:true  },
  ] },
  { seccion:'Finanzas',  items:[
      { id:'caja',        label:'Caja',           icono:'caja',       activo:true  },
      { id:'cuentas',     label:'Cuentas de cobro', icono:'cobro',    activo:true  },
  ] },
  { seccion:'Sistema',   items:[ { id:'ajustes',     label:'Ajustes',        icono:'ajustes',    activo:true  } ] },
]

// Íconos de línea (mismo trazo que las puertas de LRM Core)
export function IconoNav({ tipo, size = 16 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round', style:{ flexShrink:0 } }
  switch (tipo) {
    case 'inicio':      return <svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
    case 'crm':         return <svg {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-2.5-5.1"/></svg>
    case 'red':         return <svg {...p}><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M10.8 7.2 6.2 15.8M13.2 7.2l4.6 8.6M7.5 18h9"/></svg>
    case 'cotizador':   return <svg {...p}><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/></svg>
    case 'cargas':      return <svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>
    case 'operaciones': return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10"/></svg>
    case 'caja':        return <svg {...p}><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M16 14.5h2.5"/></svg>
    case 'ajustes':     return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1"/></svg>
    case 'cobro':       return <svg {...p}><path d="M6 2.5h9l4 4v15H6z"/><path d="M15 2.5v4h4M9 12h7M9 16h5"/></svg>
    default: return null
  }
}

const NAV_RV = [
  {
    seccion:'Operación',
    items:[
      { id:'dashboard', label:'Dashboard' },
      { id:'pos',       label:'POS'       },
      { id:'pedidos',   label:'Pedidos'   },
    ]
  },
  {
    seccion:'Producto',
    items:[
      { id:'catalogo',   label:'Catálogo'   },
      { id:'inventario', label:'Inventario' },
      { id:'importaciones', label:'Importaciones' },
    ]
  },
  {
    seccion:'Clientes',
    items:[
      { id:'clientes', label:'Clientes' },
    ]
  },
]
export default function Sidebar({ vista, navActivo, onNavLRM, onVolverLRM, onIrCore, onEntrarNegocio, usuario, onCerrarSesion }) {
  const isZabu = vista === 'zabu'
  const isRV   = vista === 'rv'
  const isInv  = vista === 'inversiones'
  const isLRMInv = vista === 'lrm-inversiones'
  const isNeg  = isZabu || isRV || isInv || isLRMInv
  const navNegocio = isZabu ? NAV_ZABU : isRV ? NAV_RV : isInv ? NAV_TRADE : []
  const tituloNeg  = isZabu ? 'ZABÚ' : isRV ? 'RV Sports' : isInv ? 'LRM Trade Consulting' : isLRMInv ? 'LRM Inversiones' : ''
  const colorNeg   = isZabu ? '#C9A84C' : isRV ? '#378ADD' : isInv ? '#C9A84C' : isLRMInv ? '#9C27B0' : 'var(--gold)'
  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-trade">LRM CORE</div>
        <div className="sb-name" style={{ color: isNeg ? colorNeg : 'var(--text)' }}>
          {isNeg ? tituloNeg : 'Business'}
        </div>
        {onIrCore && (
          <div onClick={onIrCore} style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>← LRM Core</div>
        )}
      </div>
      <nav style={{ flex:1, overflowY:'auto', paddingBottom:8, minHeight:0 }}>
        {!isNeg ? (
          <>
            {NAV_LRM.map(grupo => (
              <div key={grupo.seccion}>
                <div className="sb-section-label">{grupo.seccion}</div>
                {grupo.items.map(item => (
                  <div key={item.id}
                    className={`sb-item${navActivo===item.id?' active':''}`}
                    onClick={() => item.activo && onNavLRM && onNavLRM(item.id)}
                    style={{
                      opacity: item.activo ? 1 : 0.45,
                      cursor:  item.activo ? 'pointer' : 'default',
                      ...(item.id==='configuracion' ? { color:'var(--red)' } : {}),
                    }}
                  >
                    <span className="sb-item-txt"
                      style={item.id==='configuracion' ? { color: navActivo==='configuracion'?'var(--gold)':'rgba(224,82,82,0.7)' } : {}}>
                      {item.label}
                    </span>
                    {!item.activo && (
                      <span style={{ fontSize:9, padding:'1px 6px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.2)', border:'0.5px solid rgba(255,255,255,0.08)' }}>
                        Pronto
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
            {navNegocio.map(grupo => (
              <div key={grupo.seccion}>
                <div className="sb-section-label">{grupo.seccion}</div>
                {grupo.items.map(item => {
                  const listo = item.activo !== false
                  return (
                    <div key={item.id}
                      className={`sb-item${navActivo===item.id?' active':''}`}
                      onClick={() => listo && onNavLRM && onNavLRM(item.id)}
                      style={{ cursor: listo ? 'pointer' : 'default', opacity: listo ? 1 : 0.45,
                        color: navActivo===item.id ? 'var(--gold)' : 'var(--text3)' }}
                    >
                      {item.icono && <IconoNav tipo={item.icono} />}
                      <span className="sb-item-txt">{item.label}</span>
                      {!listo && (
                        <span style={{ fontSize:9, padding:'1px 6px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)', border:'0.5px solid rgba(255,255,255,0.08)' }}>Pronto</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}
        {/* Dentro de un negocio no se ve nada de los demás */}
        {!isNeg && <div className="sb-section-label">Negocios</div>}
        {!isNeg && NEGOCIOS.map(n => (
          <div key={n.id}
            className="sb-item"
            onClick={() => ACTIVOS.includes(n.id) && onEntrarNegocio && onEntrarNegocio(n.id)}
            style={{ cursor: ACTIVOS.includes(n.id) ? 'pointer' : 'default', opacity: ACTIVOS.includes(n.id) ? 1 : 0.5 }}
          >
            <div style={{ width:7, height:7, borderRadius:'50%', background:n.color, flexShrink:0 }} />
            <span className="sb-item-txt">{n.nombre}</span>
            <span className={`badge badge-${n.estado}`}>
              {n.estado==='activo'?'Activo':n.estado==='dev'?'Dev':'Pronto'}
            </span>
          </div>
        ))}
      </nav>
      <div className="sb-user" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, width:'100%' }}>
          <div className="sb-avatar">{usuario?.nombre?.charAt(0)||'U'}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {usuario?.nombre||'Usuario'}
            </div>
            <div style={{ fontSize:10, color:'var(--gold)', textTransform:'capitalize' }}>
              {usuario?.rol||'CEO'} · {isNeg ? tituloNeg : 'LRM Core'}
            </div>
          </div>
        </div>
        <div onClick={onCerrarSesion}
          style={{ width:'100%', padding:'7px 10px', borderRadius:8, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.2)', color:'#e05252', fontSize:11, cursor:'pointer', textAlign:'center', fontWeight:600, transition:'all .15s' }}
          onMouseOver={e => e.currentTarget.style.background='rgba(224,82,82,0.15)'}
          onMouseOut={e  => e.currentTarget.style.background='rgba(224,82,82,0.08)'}
        >
          Cerrar sesión
        </div>
      </div>
    </div>
  )
}