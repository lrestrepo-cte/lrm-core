const NEGOCIOS = [
  { id:'zabu',      nombre:'ZABÚ',       tipo:'Hot dogs premium · 3 carritos', estado:'activo', color:'#C9A84C', progreso:64,  stat:'$684.000 hoy' },
  { id:'bombas',    nombre:'Las Bombas', tipo:'Guineo verde · toppings',        estado:'dev',    color:'#4caf50', progreso:35,  stat:'En desarrollo' },
  { id:'rv',        nombre:'RV Sports',  tipo:'Calcetines deportivos',          estado:'dev',    color:'#378ADD', progreso:25,  stat:'En desarrollo' },
  { id:'coco',      nombre:'Coco Shake', tipo:'Shakes de coco premium',         estado:'pronto', color:'#555',    progreso:10,  stat:'Próximamente'  },
  { id:'quesolote', nombre:'Quesolote',  tipo:'Elotes · maíz premium',          estado:'pronto', color:'#555',    progreso:10,  stat:'Próximamente'  },
  { id:'puffys',    nombre:'Puffys',     tipo:'Mini panquecas premium',         estado:'pronto', color:'#444',    progreso:5,   stat:'Próximamente'  },
]

const ACTIVIDAD = [
  { neg:'ZABÚ C01',   msg:'3 combos registrados',       time:'hace 4 min',  color:'#C9A84C' },
  { neg:'ZABÚ C02',   msg:'Inventario actualizado',     time:'hace 18 min', color:'#C9A84C' },
  { neg:'Las Bombas', msg:'Receta añadida al sistema',  time:'hace 1h',     color:'#4caf50' },
  { neg:'RV Sports',  msg:'Ficha de producto guardada', time:'hace 2h',     color:'#378ADD' },
  { neg:'ZABÚ C01',   msg:'Turno iniciado',             time:'hace 3h',     color:'#C9A84C' },
]

export default function LRMDashboard({ onEntrarNegocio }) {
  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',       val:'$684.000', color:'var(--gold)', delta:'↑ +12% vs ayer'  },
          { label:'Negocios activos', val:'1 / 6',    color:'var(--text)', delta:'5 en desarrollo' },
          { label:'Utilidad neta',    val:'$342.000', color:'var(--green)',delta:'Margen 50%'       },
          { label:'Meta semanal',     val:'64%',      color:'var(--text)', delta:'$1.37M de $2.14M'},
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.delta}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Negocios */}
      <div className="grid-3" style={{ marginBottom:16 }}>
        {NEGOCIOS.map(n => (
          <div key={n.id} onClick={() => n.id === 'zabu' && onEntrarNegocio(n.id)} style={{
            background:'var(--bg3)', borderRadius:14, border:'1px solid var(--border)',
            padding:16, cursor: n.id === 'zabu' ? 'pointer' : 'default', transition:'all .2s',
          }}
            onMouseOver={e => { if(n.id==='zabu') e.currentTarget.style.borderColor='rgba(201,168,76,0.3)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background: n.estado==='activo' ? '#1e1a0e' : 'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:n.color }} />
              </div>
              <span className={`badge badge-${n.estado}`}>
                {n.estado==='activo' ? 'Activo' : n.estado==='dev' ? 'En desarrollo' : 'Próximamente'}
              </span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{n.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{n.tipo}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:10, color: n.estado==='activo' ? 'var(--gold)' : '#2e2e2e' }}>{n.stat}</div>
            <div className="prog-wrap" style={{ height:3, marginTop:10 }}>
              <div className="prog-fill" style={{ width:`${n.progreso}%`, background:n.color, height:3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Progreso de negocios</div>
          {NEGOCIOS.map(n => (
            <div key={n.id} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:6 }}>
                <span>{n.nombre}</span>
                <span style={{ color:n.color, fontWeight:600 }}>{n.progreso}%</span>
              </div>
              <div className="prog-wrap" style={{ height:5 }}>
                <div className="prog-fill" style={{ width:`${n.progreso}%`, background:n.color, height:5 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Actividad reciente</div>
          {ACTIVIDAD.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, paddingBottom:10, marginBottom:10, borderBottom: i < ACTIVIDAD.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:a.color, marginTop:4, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:600 }}>{a.neg}</span>
                <span style={{ fontSize:12, color:'var(--text3)' }}> — {a.msg}</span>
              </div>
              <span style={{ fontSize:10, color:'var(--text4)', flexShrink:0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}