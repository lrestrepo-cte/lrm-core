const NEGOCIOS = [
  { id:'zabu',      nombre:'ZABÚ',       color:'#C9A84C', estado:'activo'  },
  { id:'bombas',    nombre:'Las Bombas', color:'#4caf50', estado:'dev'     },
  { id:'rv',        nombre:'RV Sports',  color:'#378ADD', estado:'dev'     },
  { id:'coco',      nombre:'Coco Shake', color:'#00BCD4', estado:'pronto'  },
  { id:'quesolote', nombre:'Quesolote',  color:'#FF9800', estado:'pronto'  },
  { id:'puffys',    nombre:'Puffys',     color:'#9C27B0', estado:'pronto'  },
]

const NAV_LRM = [
  {
    seccion:'General',
    items:[
      { id:'dashboard',  label:'Dashboard',    activo:true  },
      { id:'bi', label:'BI Ejecutivo', activo:true },
      { id:'consolidado',label:'Consolidado',   activo:false },
      { id:'informes',   label:'Informes',      activo:false },
    ]
  },
  {
    seccion:'Comercial',
    items:[
      { id:'crm',        label:'CRM',           activo:false },
      { id:'marketing',  label:'Marketing',     activo:false },
    ]
  },
  {
    seccion:'Operación',
    items:[
      { id:'personal',   label:'Personal',      activo:false },
      { id:'calidad',    label:'Calidad',       activo:false },
      { id:'agenda',     label:'Agenda',        activo:false },
    ]
  },
  {
    seccion:'Finanzas',
    items:[
      { id:'finanzas',      label:'Plan financiero', activo:true  },
      { id:'contabilidad',  label:'Contabilidad',    activo:false },
    ]
  },
  {
    seccion:'Sistema',
    items:[
      { id:'configuracion', label:'Configuración',   activo:false },
    ]
  },
]

const NAV_ZABU = [
  {
    seccion:'Operación',
    items:[
      { id:'dashboard',     label:'Dashboard'     },
      { id:'pos',           label:'Ventas POS'    },
      { id:'comandero',     label:'Comandero'     },
    ]
  },
  {
    seccion:'Producto',
    items:[
      { id:'recetario',     label:'Recetario'     },
      { id:'peps',          label:'PEPs'          },
    ]
  },
  {
    seccion:'Inventario',
    items:[
      { id:'inventario',    label:'Inventario'    },
      { id:'vencimientos',  label:'Vencimientos'  },
      { id:'fifo',          label:'FIFO'          },
    ]
  },
  {
    seccion:'Finanzas',
    items:[
      { id:'costos',        label:'Costos'        },
      { id:'proyeccion',    label:'Proyecciones'  },
      { id:'personal',      label:'Personal'      },
      { id:'contabilidad',  label:'Contabilidad'  },
    ]
  },
  {
    seccion:'Sistema',
    items:[
      { id:'configuracion', label:'⚙ Configuración' },
    ]
  },
]

export default function Sidebar({ vista, navActivo, onNavLRM, onVolverLRM, onEntrarNegocio, usuario, onCerrarSesion }) {
  const isZabu = vista === 'zabu'

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-trade">LRM TRADE</div>
        <div className="sb-name">Core</div>
      </div>

      <nav style={{ flex:1, overflowY:'auto' }}>
        {!isZabu ? (
          <>
            {NAV_LRM.map(grupo => (
              <div key={grupo.seccion}>
                <div className="sb-section-label">{grupo.seccion}</div>
                {grupo.items.map(item => (
                  <div key={item.id}
                    className={`sb-item${navActivo===item.id ? ' active' : ''}`}
                    onClick={() => item.activo && onNavLRM && onNavLRM(item.id)}
                    style={{ opacity: item.activo ? 1 : 0.45, cursor: item.activo ? 'pointer' : 'default' }}
                  >
                    <span className="sb-item-txt">{item.label}</span>
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
            <div style={{ padding:'8px 8px 4px' }}>
              <div onClick={onVolverLRM} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'6px 10px', borderRadius:8, transition:'color .15s' }}
                onMouseOver={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                onMouseOut={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}
              >← LRM Trade</div>
            </div>
            {NAV_ZABU.map(grupo => (
              <div key={grupo.seccion}>
                <div className="sb-section-label">{grupo.seccion}</div>
                {grupo.items.map(item => (
                  <div key={item.id} className={`sb-item${navActivo===item.id ? ' active' : ''}`}
                    onClick={() => onNavLRM && onNavLRM(item.id)}
                  >
                    <span className="sb-item-txt">{item.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <div className="sb-section-label">Negocios</div>
        {NEGOCIOS.map(n => (
          <div key={n.id} className="sb-item" onClick={() => n.id==='zabu' && onEntrarNegocio && onEntrarNegocio(n.id)}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:n.color, flexShrink:0 }} />
            <span className="sb-item-txt">{n.nombre}</span>
            <span className={`badge badge-${n.estado}`}>
              {n.estado==='activo' ? 'Activo' : n.estado==='dev' ? 'Dev' : 'Pronto'}
            </span>
          </div>
        ))}
      </nav>

      <div className="sb-user" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, width:'100%' }}>
          <div className="sb-avatar">{usuario?.nombre?.charAt(0) || 'U'}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {usuario?.nombre || 'Usuario'}
            </div>
            <div style={{ fontSize:10, color:'var(--gold)', textTransform:'capitalize' }}>
              {usuario?.rol || 'CEO'} · LRM Trade
            </div>
          </div>
        </div>
        <div onClick={onCerrarSesion} style={{ width:'100%', padding:'7px 10px', borderRadius:8, background:'rgba(224,82,82,0.08)', border:'0.5px solid rgba(224,82,82,0.2)', color:'#e05252', fontSize:11, cursor:'pointer', textAlign:'center', fontWeight:600, transition:'all .15s' }}
          onMouseOver={e => e.currentTarget.style.background='rgba(224,82,82,0.15)'}
          onMouseOut={e => e.currentTarget.style.background='rgba(224,82,82,0.08)'}
        >
          Cerrar sesión
        </div>
      </div>
    </div>
  )
}