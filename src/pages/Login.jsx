// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const NEGOCIOS = [
  { id:'lrm',      nombre:'LRM Trade',   emoji:'🏢', color:'#C9A84C', desc:'Acceso corporativo',     activo:true  },
  { id:'zabu',     nombre:'ZABÚ',        emoji:'🌭', color:'#C9A84C', desc:'Hot Dogs de Verdad',     activo:true  },
  { id:'rv',       nombre:'RV Sports',   emoji:'⚽', color:'#378ADD', desc:'Calcetines deportivos',  activo:true  },
  { id:'bombas',   nombre:'Las Bombas',  emoji:'💣', color:'#4caf50', desc:'Próximamente',           activo:false },
  { id:'coco',     nombre:'Coco Shake',  emoji:'🥥', color:'#00BCD4', desc:'Próximamente',           activo:false },
  { id:'quesolote',nombre:'Quesolote',   emoji:'🌽', color:'#FF9800', desc:'Próximamente',           activo:false },
  { id:'puffys',   nombre:'Puffys',      emoji:'🥞', color:'#9C27B0', desc:'Próximamente',           activo:false },
]

const ROLES_ZABU = [
  { id:'vendedor', nombre:'Vendedor', desc:'Punto de venta · Carrito', emoji:'🌭' },
  { id:'cocina',   nombre:'Cocina',   desc:'Pantalla de comandas',     emoji:'👨‍🍳' },
]

const ROLES_RV = [
  { id:'vendedor', nombre:'Vendedor', desc:'Punto de venta · Tienda', emoji:'⚽' },
  { id:'gerente',  nombre:'Gerente',  desc:'Administración y reportes', emoji:'📊' },
]

// CEOs siguen siendo de acceso fijo (no son "empleados operativos" del POS).
// Si más adelante quieres mover esto a Supabase Auth también, es un cambio aislado aquí.
const CEOS = [
  { id:1, nombre:'Luis Restrepo',  email:'luis@zabu.co',   password:'zabu2026', rol:'ceo', negocio:'lrm', carrito:null },
  { id:2, nombre:'Emelyn Mendoza', email:'emelyn@zabu.co', password:'zabu2026', rol:'ceo', negocio:'lrm', carrito:null },
]

// RV Sports todavía no tiene su propia tabla de empleados — se mantiene el PIN demo
// hasta que se construya el módulo de personal de RV (mismo patrón que ZABÚ).
const USUARIOS_RV_DEMO = [
  { id:6, nombre:'Vendedor RV', email:null, rol:'vendedor', pin:'5678', negocio:'rv', carrito:'RV01' },
]

export default function Login({ onLogin }) {
  const [negocio,  setNegocio]  = useState(null)
  const [rol,      setRol]      = useState(null)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [pin,      setPin]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const reset = () => { setNegocio(null); setRol(null); setEmail(''); setPassword(''); setPin(''); setError('') }

  const loginCEO = () => {
    setLoading(true)
    setTimeout(() => {
      const user = CEOS.find(u => u.email === email.toLowerCase() && u.password === password)
      if (user) { onLogin(user) }
      else { setError('Email o contraseña incorrectos') }
      setLoading(false)
    }, 600)
  }

  // Busca el PIN en zabu_empleados (real) para ZABÚ, o en el demo fijo para RV
  // (RV todavía no tiene módulo de personal propio).
  const verificarPin = async (pinIngresado) => {
    if (negocio === 'zabu') {
      const { data: empleado, error: err } = await supabase
        .from('zabu_empleados')
        .select('*')
        .eq('pin', pinIngresado)
        .eq('estado', 'activo')
        .maybeSingle()

      if (err || !empleado) return null

      // El rol elegido en el paso anterior (vendedor/cocina) debe ser coherente con el cargo,
      // pero no bloqueamos por nombre exacto de cargo — el PIN + estado activo ya autentica.
      return {
        id: empleado.id, nombre: empleado.nombre, rol, negocio: 'zabu',
        carrito: empleado.carrito_actual, cargo: empleado.cargo_actual,
      }
    }

    if (negocio === 'rv') {
      const user = USUARIOS_RV_DEMO.find(u => u.pin === pinIngresado && u.rol === rol)
      return user || null
    }

    return null
  }

  const addPin = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo)
    setError('')
    if (nuevo.length === 4) {
      setTimeout(async () => {
        const user = await verificarPin(nuevo)
        if (user) { onLogin(user) }
        else { setError('PIN incorrecto o empleado inactivo'); setPin('') }
      }, 200)
    }
  }

  const negActual   = NEGOCIOS.find(n => n.id === negocio)
  const rolesActual = negocio === 'zabu' ? ROLES_ZABU : negocio === 'rv' ? ROLES_RV : []
  const colorNeg    = negActual?.color || '#C9A84C'

  const container = {
    minHeight:'100vh', background:'#0a0a0a',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:20, fontFamily:"'Plus Jakarta Sans', sans-serif",
  }

  const cardStyle = (color, activo) => ({
    padding:'16px 18px', borderRadius:14, cursor: activo ? 'pointer' : 'default',
    background:'rgba(255,255,255,0.03)',
    border:`1px solid ${activo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
    transition:'all .15s', opacity: activo ? 1 : 0.4,
    display:'flex', alignItems:'center', gap:14,
  })

  const inputStyle = {
    width:'100%', padding:'13px 16px', borderRadius:10,
    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
    color:'#F0F4FF', fontSize:14, fontFamily:'inherit', outline:'none',
  }

  const btnGold = (color) => ({
    width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
    background:`${color}25`, border:`1px solid ${color}66`,
    color:color, fontSize:15, fontWeight:700, fontFamily:'inherit', transition:'all .15s',
  })

  const back = (fn) => (
    <div onClick={fn} style={{ fontSize:12, color:'rgba(255,255,255,0.3)', cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
      ← Volver
    </div>
  )

  return (
    <div style={container}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          {negocio ? (
            <div style={{ fontSize:48, marginBottom:8 }}>{negActual?.emoji}</div>
          ) : (
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:4, fontWeight:600, marginBottom:8 }}>LRM TRADE</div>
          )}
          <div style={{ fontSize:36, fontWeight:900, color:'#F0F4FF', letterSpacing:-1 }}>
            {negocio ? negActual?.nombre : 'Core'}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginTop:6 }}>
            {negocio ? negActual?.desc : 'Sistema de gestión · LRM Trade'}
          </div>
        </div>

        {/* PASO 1 — Selección negocio */}
        {!negocio && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:16 }}>SELECCIONA TU NEGOCIO</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {NEGOCIOS.map(n => (
                <div key={n.id}
                  onClick={() => n.activo && setNegocio(n.id)}
                  style={cardStyle(n.color, n.activo)}
                  onMouseOver={e => { if(n.activo) { e.currentTarget.style.borderColor=n.color+'44'; e.currentTarget.style.background=n.color+'0a' }}}
                  onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                >
                  <div style={{ width:44, height:44, borderRadius:12, background:n.color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {n.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#F0F4FF', marginBottom:2 }}>{n.nombre}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{n.desc}</div>
                  </div>
                  {n.activo && <div style={{ fontSize:18, color:'rgba(255,255,255,0.2)' }}>→</div>}
                  {!n.activo && <div style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.2)' }}>Pronto</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2A — LRM → CEO email/password */}
        {negocio === 'lrm' && (
          <div>
            {back(reset)}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:1, marginBottom:16 }}>ACCESO CEO</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Email</div>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('')}}
                placeholder="tu@lrmtrade.co" autoFocus onKeyDown={e=>e.key==='Enter'&&loginCEO()} style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Contraseña</div>
              <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}}
                placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&loginCEO()} style={inputStyle} />
            </div>
            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:14 }}>{error}</div>}
            <button onClick={loginCEO} disabled={loading} style={btnGold('#C9A84C')}>
              {loading ? 'Verificando...' : 'Ingresar →'}
            </button>
          </div>
        )}

        {/* PASO 2B — ZABÚ / RV → selección de rol */}
        {(negocio === 'zabu' || negocio === 'rv') && !rol && (
          <div>
            {back(reset)}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:16 }}>¿CUÁL ES TU ROL?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {rolesActual.map(r => (
                <div key={r.id} onClick={() => setRol(r.id)} style={cardStyle(colorNeg, true)}
                  onMouseOver={e => { e.currentTarget.style.borderColor=colorNeg+'44'; e.currentTarget.style.background=colorNeg+'0a' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                >
                  <div style={{ width:44, height:44, borderRadius:12, background:colorNeg+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {r.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#F0F4FF', marginBottom:2 }}>{r.nombre}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{r.desc}</div>
                  </div>
                  <div style={{ fontSize:18, color:'rgba(255,255,255,0.2)' }}>→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3 — PIN */}
        {(negocio === 'zabu' || negocio === 'rv') && rol && (
          <div>
            {back(() => setRol(null))}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:20 }}>
              INGRESA TU PIN
            </div>

            <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:16, height:16, borderRadius:'50%', transition:'all .2s',
                  background: i < pin.length ? colorNeg : 'rgba(255,255,255,0.1)',
                  border:`1px solid ${colorNeg}44`,
                }} />
              ))}
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:16, textAlign:'center' }}>{error}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:280, margin:'0 auto' }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
                <div key={i} onClick={() => {
                  if (d === '⌫') { setPin(prev=>prev.slice(0,-1)); setError('') }
                  else if (d !== '') addPin(String(d))
                }} style={{
                  padding:'18px', borderRadius:12, textAlign:'center',
                  cursor: d==='' ? 'default' : 'pointer',
                  visibility: d==='' ? 'hidden' : 'visible',
                  background: d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)',
                  border: d==='' ? 'none' : `1px solid ${d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: d==='⌫' ? 20 : 22, fontWeight:700,
                  color: d==='⌫' ? '#e05252' : '#F0F4FF',
                  transition:'all .1s',
                }}
                  onMouseOver={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.12)' }}
                  onMouseOut={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)' }}
                >{d}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
