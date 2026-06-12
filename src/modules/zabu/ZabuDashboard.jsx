const ALERTAS = [
  { txt:'Piña caramelizada — stock crítico. Compra urgente',  color:'var(--red)',  tipo:'Crítico'   },
  { txt:'Tocineta crispy — stock bajo. Reponer esta semana',  color:'var(--gold)', tipo:'Atención'  },
  { txt:'Cream Code™ — vence en 48h. Preparar nueva tanda',  color:'var(--gold)', tipo:'Atención'  },
  { txt:'ZaBun™ — cerrar precio con panadera',               color:'var(--blue)', tipo:'Pendiente' },
]

const INVENTARIO = [
  { nombre:'ZaBun™ (pan)',      stock:85, estado:'ok'      },
  { nombre:'Cream Code™',       stock:90, estado:'ok'      },
  { nombre:'Tocineta Crispy',   stock:30, estado:'bajo'    },
  { nombre:'Piña Caramelizada', stock:15, estado:'critico' },
  { nombre:'Bandeja boat',      stock:65, estado:'ok'      },
  { nombre:'Salchicha Pavo',    stock:70, estado:'ok'      },
]

const CARRITOS = [
  { id:'C01', nombre:'Carrito 01', ubicacion:'Por definir', estado:'activo'   },
  { id:'C02', nombre:'Carrito 02', ubicacion:'Próximo',     estado:'inactivo' },
  { id:'C03', nombre:'Carrito 03', ubicacion:'Próximo',     estado:'inactivo' },
]

function colorStock(estado) {
  if (estado === 'critico') return 'var(--red)'
  if (estado === 'bajo') return 'var(--gold)'
  return 'var(--green)'
}

export default function ZabuDashboard() {
  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ventas hoy',   val:'$0',    color:'var(--gold)',  sub:'Listo para inaugurar'    },
          { label:'Meta diaria',  val:'36',    color:'var(--text)',  sub:'perros · punto equilibrio'},
          { label:'Food cost',    val:'43.8%', color:'var(--green)', sub:'Pavo · empaque incluido' },
          { label:'Alertas',      val:'4',     color:'var(--red)',   sub:'Revisar antes de abrir'  },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ marginBottom:16 }}>
        {/* Carritos */}
        <div className="panel">
          <div className="panel-title">Carritos</div>
          {CARRITOS.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: c.estado === 'activo' ? 'var(--green)' : '#333', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{c.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{c.ubicacion}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color: c.estado === 'activo' ? 'var(--green)' : '#333' }}>
                {c.estado === 'activo' ? 'Listo' : 'Próximo'}
              </div>
            </div>
          ))}
          <div style={{ marginTop:10, fontSize:12, color:'var(--text4)', cursor:'pointer', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            + Agregar carrito
          </div>
        </div>

        {/* Menú */}
        <div className="panel">
          <div className="panel-title">Menú activo</div>
          {[
            { nombre:'ZABÚ',     solo:17000, combo:20000 },
            { nombre:'CheeZabú', solo:19000, combo:22000 },
          ].map(m => (
            <div key={m.nombre} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.nombre}</span>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>${m.solo.toLocaleString('es-CO')}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Combo: ${m.combo.toLocaleString('es-CO')}
              </div>
            </div>
          ))}
          <div style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Extras</div>
            {[
              { nombre:'Queso extra', precio:3000 },
              { nombre:'Tocineta extra', precio:3000 },
              { nombre:'Piña extra', precio:2000 },
            ].map(e => (
              <div key={e.nombre} style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{e.nombre}</span>
                <span style={{ fontSize:12, color:'var(--text2)' }}>+${e.precio.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Salchichas */}
        <div className="panel">
          <div className="panel-title">Salchichas disponibles</div>
          {[
            { nombre:'Pavo',       costo:3700,  margen:56.4 },
            { nombre:'Hot Dog',    costo:2937,  margen:60.9 },
            { nombre:'Alemana',    costo:4140,  margen:53.8 },
            { nombre:'Parisienne', costo:4140,  margen:53.8 },
          ].map(s => (
            <div key={s.nombre} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{s.nombre}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Costo: ${s.costo.toLocaleString('es-CO')}/ud</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{s.margen}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Inventario — estado</div>
          {INVENTARIO.map(item => (
            <div key={item.nombre} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text2)', flex:1 }}>{item.nombre}</div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.06)', borderRadius:2, height:4, overflow:'hidden' }}>
                <div style={{ height:4, borderRadius:2, width:`${item.stock}%`, background:colorStock(item.estado) }} />
              </div>
              <div style={{ fontSize:10, fontWeight:600, minWidth:44, textAlign:'right', color:colorStock(item.estado) }}>
                {item.estado === 'critico' ? 'Crítico' : item.estado === 'bajo' ? 'Bajo' : 'OK'}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Alertas pendientes</div>
          {ALERTAS.map((a, i) => (
            <div key={i} className="alert-row" style={{ borderColor:`${a.color}22` }}>
              <div className="alert-dot" style={{ background:a.color }} />
              <div className="alert-txt">{a.txt}</div>
              <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:8, background:`${a.color}22`, color:a.color, flexShrink:0 }}>{a.tipo}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}