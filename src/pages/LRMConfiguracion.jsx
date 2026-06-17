import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:6,
}

const NEGOCIOS_BASE = [
  { id:'zabu',      nombre:'ZABÚ',       emoji:'🌭', color:'#C9A84C', estado:'activo',  desc:'Hot dogs premium'         },
  { id:'rv',        nombre:'RV Sports',  emoji:'⚽', color:'#378ADD', estado:'activo',  desc:'Calcetines deportivos'    },
  { id:'bombas',    nombre:'Las Bombas', emoji:'💣', color:'#4caf50', estado:'dev',     desc:'Guineo verde con toppings'},
  { id:'coco',      nombre:'Coco Shake', emoji:'🥥', color:'#00BCD4', estado:'pronto',  desc:'Shakes de coco premium'  },
  { id:'quesolote', nombre:'Quesolote',  emoji:'🌽', color:'#FF9800', estado:'pronto',  desc:'Elotes premium'           },
  { id:'puffys',    nombre:'Puffys',     emoji:'🥞', color:'#9C27B0', estado:'pronto',  desc:'Mini panquecas premium'  },
]

const USUARIOS_BASE = [
  { id:1, nombre:'Luis Restrepo',  email:'luis@zabu.co',   rol:'ceo',      pin:null,   negocio:'lrm',  carrito:null,  activo:true  },
  { id:2, nombre:'Emelyn Mendoza', email:'emelyn@zabu.co', rol:'ceo',      pin:null,   negocio:'lrm',  carrito:null,  activo:true  },
  { id:3, nombre:'Operador C01',   email:null,             rol:'vendedor', pin:'1234', negocio:'zabu', carrito:'C01', activo:true  },
  { id:4, nombre:'Operador C02',   email:null,             rol:'vendedor', pin:'2345', negocio:'zabu', carrito:'C02', activo:false },
  { id:5, nombre:'Cocina ZABÚ',    email:null,             rol:'cocina',   pin:'9999', negocio:'zabu', carrito:'C01', activo:true  },
  { id:6, nombre:'Vendedor RV',    email:null,             rol:'vendedor', pin:'5678', negocio:'rv',   carrito:'RV01',activo:true  },
]

const ROL_COLOR = {
  ceo:      { color:'#C9A84C', bg:'rgba(201,168,76,0.1)',  border:'rgba(201,168,76,0.3)'  },
  vendedor: { color:'#4caf50', bg:'rgba(76,175,80,0.1)',   border:'rgba(76,175,80,0.3)'   },
  cocina:   { color:'#378ADD', bg:'rgba(55,138,221,0.1)',  border:'rgba(55,138,221,0.3)'  },
  gerente:  { color:'#9C27B0', bg:'rgba(156,39,176,0.1)',  border:'rgba(156,39,176,0.3)'  },
}

function TabGeneral() {
  const [params, setParams] = useState({
    nombreGrupo:'LRM Trade', slogan:'Construyendo el futuro desde Barranquilla',
    ciudad:'Barranquilla', pais:'Colombia', moneda:'COP', zonaHoraria:'America/Bogota',
    emailContacto:'luis@zabu.co', whatsapp:'+57 300 000 0000', version:'1.0.0', fechaLanzamiento:'2026-06-01',
  })
  const [guardado, setGuardado] = useState(false)
  const guardar = () => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }
  return (
    <div style={{ maxWidth:700 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Parámetros generales</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Configuración base del grupo empresarial LRM Trade</div>
      </div>
      <div className="grid-2" style={{ gap:16 }}>
        <div className="panel">
          <div className="panel-title">Identidad corporativa</div>
          {[{label:'Nombre del grupo',key:'nombreGrupo',ph:'LRM Trade'},{label:'Slogan',key:'slogan',ph:'Slogan'},{label:'Email',key:'emailContacto',ph:'email@lrmtrade.co'},{label:'WhatsApp',key:'whatsapp',ph:'+57 300 000 0000'}].map(f=>(
            <div key={f.key} style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
              <input type="text" value={params[f.key]} onChange={e=>setParams(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle}/>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Localización</div>
          {[{label:'Ciudad',key:'ciudad',ph:'Barranquilla'},{label:'País',key:'pais',ph:'Colombia'}].map(f=>(
            <div key={f.key} style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
              <input type="text" value={params[f.key]} onChange={e=>setParams(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle}/>
            </div>
          ))}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:'var(--text3)'}}>Moneda</div>
            <select value={params.moneda} onChange={e=>setParams(p=>({...p,moneda:e.target.value}))} style={inputStyle}>
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dólar americano</option>
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:'var(--text3)'}}>Zona horaria</div>
            <select value={params.zonaHoraria} onChange={e=>setParams(p=>({...p,zonaHoraria:e.target.value}))} style={inputStyle}>
              <option value="America/Bogota">America/Bogotá (UTC-5)</option>
              <option value="America/New_York">America/New York</option>
            </select>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Sistema</div>
          {[{label:'Versión',key:'version',ph:'1.0.0'},{label:'Fecha lanzamiento',key:'fechaLanzamiento',ph:'',type:'date'}].map(f=>(
            <div key={f.key} style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
              <input type={f.type||'text'} value={params[f.key]} onChange={e=>setParams(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle}/>
            </div>
          ))}
          <div style={{padding:'12px 14px',background:'var(--green-dim)',border:'1px solid var(--green-border)',borderRadius:10,fontSize:12,color:'var(--green)',marginTop:8}}>
            ● Sistema operativo · Supabase conectado · Vercel activo
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Resumen actual</div>
          {[{label:'Grupo',val:params.nombreGrupo},{label:'Ciudad',val:params.ciudad},{label:'Moneda',val:params.moneda},{label:'Versión',val:params.version},{label:'Negocios activos',val:'2 (ZABÚ + RV)'},{label:'Usuarios activos',val:'4'}].map(r=>(
            <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:12,color:'var(--text3)'}}>{r.label}</span>
              <span style={{fontSize:12,fontWeight:600,color:'var(--text2)'}}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={guardar} className="btn-gold" style={{marginTop:16,padding:'12px 28px',fontSize:13,fontWeight:700}}>
        {guardado?'✅ Guardado':'Guardar cambios'}
      </button>
    </div>
  )
}

function TabNegocios() {
  const [negocios,setNegocios]=useState(NEGOCIOS_BASE)
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const abrirModal=(n=null)=>{setForm(n||{id:'',nombre:'',emoji:'🏢',color:'#C9A84C',estado:'pronto',desc:''});setModal(true)}
  const guardar=()=>{if(!form.nombre)return;if(form.id)setNegocios(prev=>prev.map(n=>n.id===form.id?form:n));else setNegocios(prev=>[...prev,{...form,id:form.nombre.toLowerCase().replace(/\s/g,'_')}]);setModal(false)}
  const ESTADOS=['activo','dev','pronto']
  const EC={activo:'var(--green)',dev:'var(--gold)',pronto:'var(--text4)'}
  const COLORES=['#C9A84C','#4caf50','#378ADD','#9C27B0','#e05252','#FF9800','#00BCD4','#E91E63']
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Negocios del grupo</div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{negocios.filter(n=>n.estado==='activo').length} activos · {negocios.length} total</div>
        </div>
        <button onClick={()=>abrirModal()} className="btn-gold" style={{padding:'8px 16px',fontSize:12}}>+ Nuevo negocio</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {negocios.map(n=>(
          <div key={n.id} className="panel" style={{border:`1px solid ${n.estado==='activo'?n.color+'33':'var(--border)'}`}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:14,background:n.color+'15',border:`1px solid ${n.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{n.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:3}}>
                  <div style={{fontSize:15,fontWeight:800,color:'var(--text)'}}>{n.nombre}</div>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:600,background:`${EC[n.estado]}15`,color:EC[n.estado],border:`0.5px solid ${EC[n.estado]}44`}}>{n.estado==='activo'?'Activo':n.estado==='dev'?'En desarrollo':'Próximamente'}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{n.desc}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                {ESTADOS.map(e=>(
                  <div key={e} onClick={()=>setNegocios(prev=>prev.map(x=>x.id===n.id?{...x,estado:e}:x))} style={{padding:'5px 10px',borderRadius:8,cursor:'pointer',fontSize:10,fontWeight:600,background:n.estado===e?`${EC[e]}15`:'rgba(255,255,255,0.04)',border:`0.5px solid ${n.estado===e?`${EC[e]}44`:'var(--border)'}`,color:n.estado===e?EC[e]:'var(--text4)'}}>{e==='activo'?'Activo':e==='dev'?'Dev':'Pronto'}</div>
                ))}
                <button onClick={()=>abrirModal(n)} className="btn" style={{fontSize:11,padding:'5px 12px'}}>Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}}>
          <div style={{background:'var(--bg2)',borderRadius:16,padding:28,width:'100%',maxWidth:420,border:'1px solid var(--border)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'var(--text)',marginBottom:20}}>{form.id?'Editar negocio':'Nuevo negocio'}</div>
            {[{label:'Nombre',key:'nombre',ph:'Ej: Las Bombas'},{label:'Emoji',key:'emoji',ph:'🏢'},{label:'Descripción',key:'desc',ph:'Descripción'}].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
                <input type="text" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>Color</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{COLORES.map(c=><div key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:32,height:32,borderRadius:8,background:c,cursor:'pointer',border:`3px solid ${form.color===c?'white':'transparent'}`}}/>)}</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>Estado</div>
              <div style={{display:'flex',gap:8}}>{ESTADOS.map(e=><div key={e} onClick={()=>setForm(p=>({...p,estado:e}))} style={{flex:1,padding:'8px',borderRadius:8,cursor:'pointer',textAlign:'center',fontSize:11,fontWeight:600,background:form.estado===e?`${EC[e]}15`:'rgba(255,255,255,0.04)',border:`0.5px solid ${form.estado===e?`${EC[e]}44`:'var(--border)'}`,color:form.estado===e?EC[e]:'var(--text3)'}}>{e==='activo'?'Activo':e==='dev'?'Dev':'Pronto'}</div>)}</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={guardar} className="btn-green" style={{flex:1}}>Guardar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabUsuarios() {
  const [usuarios,setUsuarios]=useState(USUARIOS_BASE)
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({nombre:'',email:'',rol:'vendedor',pin:'',negocio:'zabu',carrito:'',activo:true})
  const [buscar,setBuscar]=useState('')
  const guardar=()=>{if(!form.nombre)return;setUsuarios(prev=>[...prev,{id:Date.now(),...form}]);setForm({nombre:'',email:'',rol:'vendedor',pin:'',negocio:'zabu',carrito:'',activo:true});setModal(false)}
  const filtrados=usuarios.filter(u=>u.nombre.toLowerCase().includes(buscar.toLowerCase())||(u.email||'').toLowerCase().includes(buscar.toLowerCase()))
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Usuarios y accesos</div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{usuarios.filter(u=>u.activo).length} activos · {usuarios.length} total</div>
        </div>
        <button onClick={()=>setModal(true)} className="btn-gold" style={{padding:'8px 16px',fontSize:12}}>+ Nuevo usuario</button>
      </div>
      <input type="text" value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Buscar usuario..." style={{...inputStyle,marginBottom:16,marginTop:0}}/>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtrados.map(u=>{
          const rc=ROL_COLOR[u.rol]||ROL_COLOR.vendedor
          return(
            <div key={u.id} className="panel" style={{opacity:u.activo?1:0.5}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:42,height:42,borderRadius:12,background:rc.bg,border:`1px solid ${rc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:rc.color,flexShrink:0}}>{u.nombre.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:3}}>{u.nombre}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{u.email?`📧 ${u.email}`:`🔑 PIN: ${u.pin}`}{u.carrito?` · 🛒 ${u.carrito}`:''}{` · 🏢 ${u.negocio?.toUpperCase()}`}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:rc.bg,color:rc.color,border:`0.5px solid ${rc.border}`,fontWeight:700,textTransform:'capitalize'}}>{u.rol}</span>
                  <div onClick={()=>setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,activo:!x.activo}:x))} style={{padding:'4px 12px',borderRadius:20,cursor:'pointer',fontSize:10,fontWeight:700,background:u.activo?'var(--green-dim)':'rgba(255,255,255,0.04)',color:u.activo?'var(--green)':'var(--text4)',border:`0.5px solid ${u.activo?'var(--green-border)':'var(--border)'}`}}>{u.activo?'Activo':'Inactivo'}</div>
                  <div onClick={()=>setUsuarios(prev=>prev.filter(x=>x.id!==u.id))} style={{width:26,height:26,borderRadius:7,background:'rgba(224,82,82,0.08)',border:'0.5px solid rgba(224,82,82,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,color:'var(--red)'}}>×</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}}>
          <div style={{background:'var(--bg2)',borderRadius:16,padding:28,width:'100%',maxWidth:420,border:'1px solid var(--border)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'var(--text)',marginBottom:20}}>Nuevo usuario</div>
            {[{label:'Nombre completo',key:'nombre',ph:'Nombre',type:'text'},{label:'PIN (4 dígitos)',key:'pin',ph:'1234',type:'number'},{label:'Carrito / Punto',key:'carrito',ph:'C01',type:'text'}].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inputStyle}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>Rol</div>
              <select value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))} style={inputStyle}>
                <option value="ceo">CEO</option><option value="gerente">Gerente</option><option value="vendedor">Vendedor</option><option value="cocina">Cocina</option>
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>Negocio</div>
              <select value={form.negocio} onChange={e=>setForm(p=>({...p,negocio:e.target.value}))} style={inputStyle}>
                <option value="lrm">LRM Trade</option><option value="zabu">ZABÚ</option><option value="rv">RV Sports</option><option value="bombas">Las Bombas</option>
              </select>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={guardar} disabled={!form.nombre} className="btn-green" style={{flex:1}}>Agregar</button>
              <button onClick={()=>setModal(false)} className="btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabApariencia() {
  const [colores,setColores]=useState({gold:'#C9A84C',green:'#4caf50',blue:'#378ADD',red:'#e05252',bg:'#0a0a0a',bg2:'#111111'})
  const [guardado,setGuardado]=useState(false)
  return (
    <div style={{maxWidth:700}}>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Apariencia del sistema</div></div>
      <div className="grid-2" style={{gap:16}}>
        <div className="panel">
          <div className="panel-title">Colores del sistema</div>
          {[{label:'Dorado (acento)',key:'gold'},{label:'Verde (éxito)',key:'green'},{label:'Azul (info)',key:'blue'},{label:'Rojo (alerta)',key:'red'},{label:'Fondo principal',key:'bg'},{label:'Fondo secundario',key:'bg2'}].map(f=>(
            <div key={f.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:13,color:'var(--text2)'}}>{f.label}</div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:colores[f.key],border:'1px solid rgba(255,255,255,0.1)'}}/>
                <input type="color" value={colores[f.key]} onChange={e=>setColores(p=>({...p,[f.key]:e.target.value}))} style={{width:40,height:28,borderRadius:6,border:'none',background:'transparent',cursor:'pointer'}}/>
                <span style={{fontSize:11,color:'var(--text4)',fontFamily:'monospace'}}>{colores[f.key]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Tipografía</div>
          <select style={inputStyle}><option>Plus Jakarta Sans (actual)</option><option>Inter</option><option>Outfit</option></select>
          <div style={{padding:'14px',background:'var(--bg3)',borderRadius:10,border:'1px solid var(--border)',marginTop:12}}>
            <div style={{fontSize:22,fontWeight:800,color:'var(--text)',marginBottom:4}}>LRM Trade</div>
            <div style={{fontSize:14,color:'var(--text3)'}}>Sistema de gestión empresarial</div>
          </div>
        </div>
      </div>
      <button onClick={()=>setGuardado(true)} className="btn-gold" style={{marginTop:14,padding:'12px 28px',fontSize:13,fontWeight:700}}>{guardado?'✅ Guardado':'Aplicar cambios'}</button>
    </div>
  )
}

function TabNotificaciones() {
  const [config,setConfig]=useState({
    alertaVentaAlta:{activo:true,canal:'whatsapp'},alertaStockBajo:{activo:true,canal:'sistema'},
    alertaTurnoCierre:{activo:true,canal:'sistema'},alertaDeudaVence:{activo:true,canal:'sistema'},
    resumenDiario:{activo:true,canal:'whatsapp'},alertaNuevaOrden:{activo:false,canal:'sistema'},
  })
  const toggle=(key)=>setConfig(p=>({...p,[key]:{...p[key],activo:!p[key].activo}}))
  const ALERTAS=[
    {key:'alertaVentaAlta',label:'Venta alta en POS',desc:'Cuando una orden supera el umbral',icon:'💰'},
    {key:'alertaStockBajo',label:'Stock bajo',desc:'Cuando el inventario cae bajo el mínimo',icon:'📦'},
    {key:'alertaTurnoCierre',label:'Cierre de turno',desc:'Al llegar la hora de cierre',icon:'🔒'},
    {key:'alertaDeudaVence',label:'Deuda próxima a vencer',desc:'Días antes del vencimiento',icon:'💳'},
    {key:'resumenDiario',label:'Resumen diario',desc:'Resumen de ventas al final del día',icon:'📊'},
    {key:'alertaNuevaOrden',label:'Nueva orden',desc:'Cada vez que entra una orden',icon:'🌭'},
  ]
  return (
    <div style={{maxWidth:700}}>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Notificaciones y alertas</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {ALERTAS.map(a=>(
          <div key={a.key} className="panel">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{fontSize:24}}>{a.icon}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{a.label}</div><div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{a.desc}</div></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <select value={config[a.key].canal} onChange={e=>setConfig(p=>({...p,[a.key]:{...p[a.key],canal:e.target.value}}))} style={{padding:'5px 10px',borderRadius:7,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text3)',fontSize:11,fontFamily:'inherit',outline:'none'}}>
                  <option value="sistema">En sistema</option><option value="whatsapp">WhatsApp</option><option value="ambos">Ambos</option>
                </select>
                <div onClick={()=>toggle(a.key)} style={{width:44,height:24,borderRadius:12,cursor:'pointer',transition:'all .2s',position:'relative',background:config[a.key].activo?'var(--green)':'rgba(255,255,255,0.1)'}}>
                  <div style={{position:'absolute',top:3,left:config[a.key].activo?22:3,width:18,height:18,borderRadius:'50%',background:'white',transition:'all .2s'}}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabSeguridad() {
  const [pinActual,setPinActual]=useState('')
  const [pinNuevo,setPinNuevo]=useState('')
  const [pinConfirm,setPinConfirm]=useState('')
  const [msg,setMsg]=useState(null)
  const cambiarPin=()=>{
    if(pinActual!=='2794'){setMsg({tipo:'error',text:'PIN actual incorrecto'});return}
    if(pinNuevo.length!==4){setMsg({tipo:'error',text:'El PIN debe tener 4 dígitos'});return}
    if(pinNuevo!==pinConfirm){setMsg({tipo:'error',text:'Los PINs no coinciden'});return}
    setMsg({tipo:'ok',text:'PIN de My Space actualizado correctamente'})
    setPinActual('');setPinNuevo('');setPinConfirm('')
  }
  return (
    <div style={{maxWidth:700}}>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Seguridad y accesos</div></div>
      <div className="grid-2" style={{gap:16}}>
        <div className="panel">
          <div className="panel-title">Cambiar PIN de My Space</div>
          {[{label:'PIN actual',val:pinActual,set:setPinActual,ph:'PIN actual'},{label:'PIN nuevo',val:pinNuevo,set:setPinNuevo,ph:'4 dígitos'},{label:'Confirmar PIN',val:pinConfirm,set:setPinConfirm,ph:'Repetir PIN'}].map(f=>(
            <div key={f.label} style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>{f.label}</div>
              <input type="password" value={f.val} onChange={e=>f.set(e.target.value.slice(0,4))} placeholder={f.ph} maxLength={4} style={inputStyle}/>
            </div>
          ))}
          {msg&&<div style={{padding:'8px 12px',borderRadius:8,fontSize:12,marginBottom:12,background:msg.tipo==='ok'?'var(--green-dim)':'var(--red-dim)',color:msg.tipo==='ok'?'var(--green)':'var(--red)',border:`1px solid ${msg.tipo==='ok'?'var(--green-border)':'rgba(224,82,82,0.3)'}`}}>{msg.text}</div>}
          <button onClick={cambiarPin} className="btn-gold" style={{width:'100%'}}>Actualizar PIN</button>
        </div>
        <div className="panel">
          <div className="panel-title">Contraseña CEO</div>
          <div style={{padding:'10px 12px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:8,fontSize:11,color:'var(--gold)',marginBottom:12}}>
            ⚠️ Hardcodeada en Login.jsx. Se conectará a Supabase Auth en la siguiente fase.
          </div>
          <button className="btn" style={{width:'100%',opacity:0.5}}>Cambiar contraseña (Próximamente)</button>
        </div>
      </div>
    </div>
  )
}

function TabMetas() {
  const [metas,setMetas]=useState([
    {negocio:'ZABÚ',metaDiaria:36,metaSemanal:250,metaMensual:1000,color:'#C9A84C'},
    {negocio:'RV Sports',metaDiaria:10,metaSemanal:70,metaMensual:280,color:'#378ADD'},
  ])
  const update=(neg,campo,val)=>setMetas(prev=>prev.map(m=>m.negocio===neg?{...m,[campo]:parseInt(val)||0}:m))
  return (
    <div>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Metas del negocio</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {metas.map(m=>(
          <div key={m.negocio} className="panel" style={{border:`1px solid ${m.color}33`}}>
            <div style={{fontSize:15,fontWeight:800,color:m.color,marginBottom:16}}>{m.negocio}</div>
            <div className="grid-3" style={{gap:12}}>
              {[{label:'Meta diaria',key:'metaDiaria'},{label:'Meta semanal',key:'metaSemanal'},{label:'Meta mensual',key:'metaMensual'}].map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>{f.label}</div>
                  <input type="number" value={m[f.key]} onChange={e=>update(m.negocio,f.key,e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:`1px solid ${m.color}33`,color:'var(--text)',fontSize:16,fontWeight:700,fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="btn-gold" style={{marginTop:16,padding:'12px 28px',fontSize:13,fontWeight:700}}>Guardar metas</button>
    </div>
  )
}

function TabBackups() {
  const [exportando,setExportando]=useState(null)
  const exportar=async(tabla,nombre)=>{
    setExportando(tabla)
    const {data}=await supabase.from(tabla).select('*')
    if(data&&data.length>0){
      const csv=[Object.keys(data[0]).join(','),...data.map(r=>Object.values(r).map(v=>JSON.stringify(v??'')).join(','))].join('\n')
      const blob=new Blob([csv],{type:'text/csv'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a');a.href=url;a.download=`${nombre}_${new Date().toISOString().split('T')[0]}.csv`;a.click()
      URL.revokeObjectURL(url)
    }
    setExportando(null)
  }
  const TABLAS=[
    {tabla:'ordenes',nombre:'Órdenes ZABÚ',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'movimientos',nombre:'Movimientos ZABÚ',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'turnos',nombre:'Turnos ZABÚ',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'zabu_inventario',nombre:'Inventario ZABÚ',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'zabu_plan_negocio',nombre:'Plan de Negocio ZABÚ',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'zabu_campana_tareas',nombre:'Campaña Apertura — Tareas',negocio:'ZABÚ',color:'#C9A84C'},
    {tabla:'rv_ordenes',nombre:'Órdenes RV Sports',negocio:'RV Sports',color:'#378ADD'},
    {tabla:'rv_clientes',nombre:'Clientes RV Sports',negocio:'RV Sports',color:'#378ADD'},
    {tabla:'inv_prestamos',nombre:'Préstamos — Gota a gota',negocio:'LRM Inversiones',color:'#9C27B0'},
    {tabla:'my_space_ingresos_v2',nombre:'Ingresos My Space',negocio:'Personal',color:'var(--gold)'},
    {tabla:'my_space_gastos_v2',nombre:'Gastos My Space',negocio:'Personal',color:'var(--gold)'},
    {tabla:'my_space_metas_v2',nombre:'Metas My Space',negocio:'Personal',color:'var(--gold)'},
    {tabla:'my_space_deudas',nombre:'Deudas My Space',negocio:'Personal',color:'var(--gold)'},
  ]
  return (
    <div>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Backups y exportación</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {TABLAS.map(t=>(
          <div key={t.tabla} className="panel">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{t.nombre}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}><span style={{color:t.color}}>{t.negocio}</span> · {t.tabla}</div>
              </div>
              <button onClick={()=>exportar(t.tabla,t.nombre)} className="btn" style={{fontSize:11,padding:'6px 14px',minWidth:100}}>
                {exportando===t.tabla?'⏳ Exportando...':'⬇️ CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabAuditoria() {
  const [logs,setLogs]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{cargar()},[])
  const cargar=async()=>{
    setLoading(true)
    const [{data:ordenes},{data:turnos}]=await Promise.all([
      supabase.from('ordenes').select('id,created_at,carrito_id,total,nombre_cliente').order('created_at',{ascending:false}).limit(20),
      supabase.from('turnos').select('id,created_at,carrito_id,operador_nombre,estado').order('created_at',{ascending:false}).limit(10),
    ])
    const todos=[
      ...(ordenes||[]).map(o=>({tipo:'Venta',icono:'🌭',desc:`Orden ${o.carrito_id} — ${o.nombre_cliente||'Cliente'} — ${cop(o.total)}`,ts:o.created_at,color:'#C9A84C'})),
      ...(turnos||[]).map(t=>({tipo:'Turno',icono:'🔒',desc:`Turno ${t.estado} — ${t.carrito_id} — ${t.operador_nombre}`,ts:t.created_at,color:'var(--blue)'})),
    ].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,25)
    setLogs(todos);setLoading(false)
  }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Auditoría del sistema</div></div>
        <button onClick={cargar} style={{padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:12,background:'rgba(255,255,255,0.05)',border:'0.5px solid var(--border)',color:'var(--text3)',fontFamily:'inherit'}}>🔄 Actualizar</button>
      </div>
      {loading?<div style={{textAlign:'center',padding:'40px 0',color:'var(--text3)'}}>Cargando...</div>:logs.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'var(--text4)',fontSize:13}}>Sin actividad registrada</div>:(
        <div className="panel">
          {logs.map((l,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:18,flexShrink:0}}>{l.icono}</div>
              <div style={{flex:1}}><div style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>{l.desc}</div><div style={{fontSize:10,color:'var(--text4)',marginTop:3}}>{new Date(l.ts).toLocaleDateString('es-CO')} · {new Date(l.ts).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div></div>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:`${l.color}15`,color:l.color,border:`0.5px solid ${l.color}33`,flexShrink:0,fontWeight:600}}>{l.tipo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabIntegraciones() {
  const INTEGRACIONES=[
    {nombre:'Supabase',desc:'Base de datos y autenticación',estado:'conectado',icono:'🗄️',color:'var(--green)'},
    {nombre:'Vercel',desc:'Hosting y despliegue automático',estado:'conectado',icono:'▲',color:'var(--green)'},
    {nombre:'GitHub',desc:'Control de versiones del código',estado:'conectado',icono:'🐙',color:'var(--green)'},
    {nombre:'WhatsApp Business API',desc:'Notificaciones y pedidos',estado:'pendiente',icono:'📱',color:'var(--gold)'},
    {nombre:'SIIGO',desc:'Contabilidad y facturación',estado:'pendiente',icono:'📋',color:'var(--gold)'},
    {nombre:'Wompi / PSE',desc:'Pasarela de pagos online',estado:'pendiente',icono:'💳',color:'var(--gold)'},
    {nombre:'Google Analytics',desc:'Analítica web',estado:'pendiente',icono:'📊',color:'var(--gold)'},
    {nombre:'Mailchimp / Brevo',desc:'Email marketing',estado:'futuro',icono:'📧',color:'var(--text4)'},
  ]
  return (
    <div>
      <div style={{marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>Integraciones</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {INTEGRACIONES.map(integ=>(
          <div key={integ.nombre} className="panel">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${integ.color}10`,border:`1px solid ${integ.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{integ.icono}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{integ.nombre}</div><div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{integ.desc}</div></div>
              </div>
              <span style={{fontSize:11,padding:'4px 12px',borderRadius:20,fontWeight:600,background:`${integ.color}15`,color:integ.color,border:`0.5px solid ${integ.color}44`}}>
                {integ.estado==='conectado'?'✅ Conectado':integ.estado==='pendiente'?'⏳ Pendiente':'🔮 Futuro'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB SISTEMA — RESET INDIVIDUAL + NUCLEAR ────────────────────────────────
// ACTUALIZADO: ZABÚ ahora incluye inventario, plan de negocio y campaña de apertura
// (8 tablas nuevas que se agregaron en sesiones recientes). LRM Inversiones pasa
// de "Sin tablas aún" a módulo activo con sus 6 tablas reales (gota a gota,
// empeños, libranzas, portafolio) ya que está operando con capital real.
function TabSistema() {
  const UUID_FAKE = '00000000-0000-0000-0000-000000000000'

  const MODULOS = [
    { id:'zabu',       nombre:'ZABÚ',           emoji:'🌭', color:'#C9A84C', activo:true,
      desc:'Órdenes, turnos, inventario, plan de negocio, campaña de apertura, contabilidad',
      tablas:[
        'ordenes','movimientos','turnos','asientos','partidas','consecutivos','cierres_contables',
        'zabu_inventario','zabu_plan_negocio',
        'zabu_campana_tareas','zabu_proveedores','zabu_montaje_items','zabu_redes_config',
      ] },
    { id:'rv',         nombre:'RV Sports',       emoji:'⚽', color:'#378ADD', activo:true,
      desc:'Órdenes, clientes, inventario',
      tablas:['rv_ordenes','rv_clientes','rv_inventario'] },
    { id:'inversiones',nombre:'LRM Inversiones', emoji:'📈', color:'#9C27B0', activo:true,
      desc:'Gota a gota, cuotas, pagos, empeños, libranzas, portafolio',
      tablas:['inv_prestamos','inv_cuotas','inv_pagos','inv_empenos','inv_libranzas','inv_portafolio'] },
    { id:'myspace',    nombre:'My Space',        emoji:'🔐', color:'var(--gold)', activo:true,
      desc:'Ingresos, gastos, metas, deudas, opciones, escenarios',
      tablas:['my_space_ingresos_v2','my_space_gastos_v2','my_space_metas_v2','my_space_deudas','my_space_opciones','my_space_escenarios','my_space_metas','my_space_finanzas','my_space_presupuesto','my_space_inversiones','my_space_calendario','my_space_ingresos','my_space_gastos_fijos','my_space_gastos_mes'] },
    { id:'bombas',     nombre:'Las Bombas',      emoji:'💣', color:'#4caf50', activo:false,
      desc:'Tablas pendientes de crear cuando arranque el módulo', tablas:[] },
    { id:'coco',       nombre:'Coco Shake',      emoji:'🥥', color:'#00BCD4', activo:false,
      desc:'Tablas pendientes de crear cuando arranque el módulo', tablas:[] },
    { id:'quesolote',  nombre:'Quesolote',        emoji:'🌽', color:'#FF9800', activo:false,
      desc:'Tablas pendientes de crear cuando arranque el módulo', tablas:[] },
  ]

  const [confirms,   setConfirms]   = useState({})
  const [borrando,   setBorrando]   = useState({})
  const [resultados, setResultados] = useState({})
  const [confirmN,   setConfirmN]   = useState('')
  const [borrandoN,  setBorrandoN]  = useState(false)
  const [resultN,    setResultN]    = useState(null)

  const borrarModulo = async (m) => {
    if (!m.activo || m.tablas.length === 0) return
    setBorrando(p=>({...p,[m.id]:true}))
    try {
      await Promise.all(m.tablas.map(t => supabase.from(t).delete().neq('id', UUID_FAKE)))
      setResultados(p=>({...p,[m.id]:{ok:true,msg:`✅ ${m.tablas.length} tablas limpiadas.`}}))
      setConfirms(p=>({...p,[m.id]:''}))
    } catch(e) {
      setResultados(p=>({...p,[m.id]:{ok:false,msg:`❌ Error: ${e.message}`}}))
    }
    setBorrando(p=>({...p,[m.id]:false}))
  }

  const TODAS = MODULOS.filter(m=>m.activo).flatMap(m=>m.tablas)

  const borrarTodo = async () => {
    if (confirmN !== 'BORRAR TODO') return
    setBorrandoN(true)
    try {
      await Promise.all(TODAS.map(t => supabase.from(t).delete().neq('id', UUID_FAKE)))
      setResultN({ok:true, msg:`✅ ${TODAS.length} tablas limpiadas. Sistema listo para producción.`})
      setConfirmN('')
    } catch(e) {
      setResultN({ok:false, msg:`❌ Error: ${e.message}`})
    }
    setBorrandoN(false)
  }

  const iS = { width:'100%', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:0 }

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Sistema · Reset por módulo</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Borra datos de prueba por negocio o ejecuta el nuclear maestro. La estructura siempre queda intacta.</div>
      </div>

      {/* Estado sistema */}
      <div className="panel" style={{ marginBottom:20 }}>
        <div className="panel-title">Estado del sistema</div>
        {[
          {label:'Versión LRM Core', val:'1.0.0'},
          {label:'Stack',            val:'React + Vite + Supabase + Vercel'},
          {label:'Repositorio',      val:'github.com/lrestrepo-cte/lrm-core'},
          {label:'Deploy',           val:'lrm-core.vercel.app'},
          {label:'Último deploy',    val:new Date().toLocaleDateString('es-CO')},
        ].map(r=>(
          <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontSize:12,color:'var(--text3)'}}>{r.label}</span>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:'monospace'}}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Botones individuales */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:14 }}>Reset individual por módulo</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {MODULOS.map(m => {
            const keyword = `BORRAR ${m.nombre.toUpperCase()}`
            const conf    = confirms[m.id] || ''
            const listo   = conf === keyword
            const borr    = borrando[m.id]
            const result  = resultados[m.id]
            return (
              <div key={m.id} className="panel" style={{ border:`1px solid ${m.activo&&m.tablas.length>0?m.color+'33':'var(--border)'}`, opacity:m.activo?1:0.55 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: m.activo&&m.tablas.length>0?12:0 }}>
                  <div style={{ fontSize:26 }}>{m.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:m.activo?'var(--text)':'var(--text4)' }}>{m.nombre}</div>
                      {m.activo && m.tablas.length>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:`${m.color}15`, color:m.color, border:`0.5px solid ${m.color}33` }}>{m.tablas.length} tablas</span>}
                      {(!m.activo||m.tablas.length===0) && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.05)', color:'var(--text4)', border:'0.5px solid var(--border)' }}>{m.activo?'Sin tablas aún':'Próximamente'}</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{m.desc}</div>
                  </div>
                </div>
                {m.activo && m.tablas.length>0 && (
                  <>
                    <div style={{ fontSize:11, color:'var(--text4)', marginBottom:6 }}>Escribe <strong style={{color:m.color}}>{keyword}</strong> para confirmar</div>
                    <input type="text" value={conf} onChange={e=>setConfirms(p=>({...p,[m.id]:e.target.value}))}
                      placeholder={`Escribe: ${keyword}`}
                      style={{...iS, border:`1px solid ${listo?m.color+'66':'var(--border)'}`}} />
                    <button onClick={()=>borrarModulo(m)} disabled={!listo||borr}
                      style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, transition:'all .15s',
                        background:listo?`${m.color}20`:'rgba(255,255,255,0.04)',
                        border:`1px solid ${listo?m.color+'55':'var(--border)'}`,
                        color:listo?m.color:'var(--text4)',
                      }}>
                      {borr?'⏳ Borrando...':`🗑 Borrar datos de ${m.nombre}`}
                    </button>
                    {result && <div style={{marginTop:8,padding:'8px 12px',background:'rgba(255,255,255,0.04)',borderRadius:8,fontSize:12,color:result.ok?'var(--green)':'var(--red)'}}>{result.msg}</div>}
                  </>
                )}
                {m.activo && m.tablas.length===0 && (
                  <div style={{padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,fontSize:11,color:'var(--text4)',marginTop:8}}>
                    ⏳ Las tablas se agregarán cuando arranque el módulo
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* NUCLEAR MAESTRO */}
      <div className="panel" style={{ border:'2px solid rgba(224,82,82,0.5)', background:'rgba(224,82,82,0.03)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ fontSize:44 }}>☢️</div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:'var(--red)', letterSpacing:1 }}>BORRADO NUCLEAR MAESTRO</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
              Elimina TODOS los datos de TODOS los módulos activos.<br/>
              ZABÚ + RV Sports + LRM Inversiones + My Space · {TODAS.length} tablas · Estructura siempre intacta.
            </div>
          </div>
        </div>
        <div style={{ padding:'14px 16px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:10, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--red)', marginBottom:6 }}>⛔ ADVERTENCIA CRÍTICA</div>
          <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.8 }}>
            • Borra permanentemente TODOS los datos de prueba<br/>
            • No hay forma de recuperarlos después<br/>
            • Solo ejecutar cuando estés 100% listo para producción real
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>
          Escribe exactamente: <strong style={{color:'var(--red)'}}>BORRAR TODO</strong>
        </div>
        <input type="text" value={confirmN} onChange={e=>setConfirmN(e.target.value)} placeholder="Escribe: BORRAR TODO"
          style={{...iS, border:`1px solid ${confirmN==='BORRAR TODO'?'rgba(224,82,82,0.5)':'var(--border)'}`}} />
        <button onClick={borrarTodo} disabled={confirmN!=='BORRAR TODO'||borrandoN}
          style={{ width:'100%', marginTop:12, padding:'16px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontSize:15, fontWeight:900, transition:'all .2s', letterSpacing:1,
            background:confirmN==='BORRAR TODO'?'rgba(224,82,82,0.2)':'rgba(255,255,255,0.04)',
            border:`2px solid ${confirmN==='BORRAR TODO'?'rgba(224,82,82,0.7)':'var(--border)'}`,
            color:confirmN==='BORRAR TODO'?'var(--red)':'var(--text4)',
          }}>
          {borrandoN?'💥 Ejecutando borrado nuclear...':'☢️ EJECUTAR BORRADO NUCLEAR MAESTRO'}
        </button>
        {resultN && <div style={{marginTop:12,padding:'12px 14px',background:'rgba(255,255,255,0.04)',borderRadius:8,fontSize:13,fontWeight:600,color:resultN.ok?'var(--green)':'var(--red)'}}>{resultN.msg}</div>}
      </div>
    </div>
  )
}

export default function LRMConfiguracion() {
  const [tab, setTab] = useState('general')
  const TABS = [
    {id:'general',label:'⚙️ General'},{id:'negocios',label:'🏢 Negocios'},{id:'usuarios',label:'👥 Usuarios'},
    {id:'metas',label:'🎯 Metas'},{id:'apariencia',label:'🎨 Apariencia'},{id:'notificaciones',label:'🔔 Notificaciones'},
    {id:'seguridad',label:'🔐 Seguridad'},{id:'integraciones',label:'🔌 Integraciones'},
    {id:'backups',label:'💾 Backups'},{id:'auditoria',label:'📋 Auditoría'},{id:'sistema',label:'☢️ Sistema'},
  ]
  return (
    <>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,color:'var(--text)'}}>Configuración LRM Core</div>
        <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>Panel de administración completo del grupo LRM Trade</div>
      </div>
      <div className="sub-nav" style={{marginBottom:24,flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}
            style={t.id==='sistema'&&tab!=='sistema'?{borderColor:'rgba(224,82,82,0.3)',color:'var(--red)'}:{}}>
            {t.label}
          </div>
        ))}
      </div>
      {tab==='general'        && <TabGeneral />}
      {tab==='negocios'       && <TabNegocios />}
      {tab==='usuarios'       && <TabUsuarios />}
      {tab==='metas'          && <TabMetas />}
      {tab==='apariencia'     && <TabApariencia />}
      {tab==='notificaciones' && <TabNotificaciones />}
      {tab==='seguridad'      && <TabSeguridad />}
      {tab==='integraciones'  && <TabIntegraciones />}
      {tab==='backups'        && <TabBackups />}
      {tab==='auditoria'      && <TabAuditoria />}
      {tab==='sistema'        && <TabSistema />}
    </>
  )
}
