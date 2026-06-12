import { useState } from 'react'

const NEGOCIOS = [
  { id:'lrm',     nombre:'LRM Trade',   emoji:'🏢', color:'#C9A84C', desc:'Acceso corporativo',     activo:true  },
  { id:'zabu',    nombre:'ZABÚ',        emoji:'🌭', color:'#C9A84C', desc:'Hot Dogs de Verdad',     activo:true  },
  { id:'bombas',  nombre:'Las Bombas',  emoji:'💣', color:'#4caf50', desc:'Próximamente',           activo:false },
  { id:'rv',      nombre:'RV Sports',   emoji:'⚽', color:'#378ADD', desc:'Próximamente',           activo:false },
  { id:'coco',    nombre:'Coco Shake',  emoji:'🥥', color:'#00BCD4', desc:'Próximamente',           activo:false },
  { id:'quesolote',nombre:'Quesolote',  emoji:'🌽', color:'#FF9800', desc:'Próximamente',           activo:false },
  { id:'puffys',  nombre:'Puffys',      emoji:'🥞', color:'#9C27B0', desc:'Próximamente',           activo:false },
]

const ROLES_ZABU = [
  { id:'vendedor',  nombre:'Vendedor',   desc:'Punto de venta · Carrito', emoji:'🌭' },
  { id:'cocina',    nombre:'Cocina',     desc:'Pantalla de comandas',     emoji:'👨‍🍳' },
]

const USUARIOS = [
  { id:1, nombre:'Luis Restrepo',  email:'luis@zabu.co',   password:'zabu2026', rol:'ceo',      pin:null,   negocio:'lrm',  carrito:null  },
  { id:2, nombre:'Emelyn Mendoza', email:'emelyn@zabu.co', password:'zabu2026', rol:'ceo',      pin:null,   negocio:'lrm',  carrito:null  },
  { id:3, nombre:'Operador C01',   email:null,             password:null,       rol:'vendedor', pin:'1234', negocio:'zabu', carrito:'C01' },
  { id:4, nombre:'Operador C02',   email:null,             password:null,       rol:'vendedor', pin:'2345', negocio:'zabu', carrito:'C02' },
  { id:5, nombre:'Cocina ZABÚ',    email:null,             password:null,       rol:'cocina',   pin:'9999', negocio:'zabu', carrito:'C01' },
]

export default function Login({ onLogin }) {
  const [negocio, setNegocio] = useState(null)
  const [rol,     setRol]     = useState(null)
  const [email,   setEmail]   = useState('')
  const [password,setPassword]= useState('')
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setNegocio(null); setRol(null); setEmail(''); setPassword(''); setPin(''); setError('') }

  const loginCEO = () => {
    setLoading(true)
    setTimeout(() => {
      const user = USUARIOS.find(u => u.email === email.toLowerCase() && u.password === password && u.rol === 'ceo')
      if (user) {
        localStorage.setItem('lrm_usuario', JSON.stringify(user))
        onLogin(user)
      } else {
        setError('Email o contraseña incorrectos')
      }
      setLoading(false)
    }, 600)
  }

  const addPin = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo)
    setError('')
    if (nuevo.length === 4) {
      setTimeout(() => {
        const user = USUARIOS.find(u => u.pin === nuevo && u.negocio === negocio && u.rol === rol)
        if (user) {
          localStorage.setItem('lrm_usuario', JSON.stringify(user))
          onLogin(user)
        } else {
          setError('PIN incorrecto')
          setPin('')
        }
      }, 300)
    }
  }

  // Estilos base
  const container = {
    minHeight:'100vh', background:'#0a0a0a',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:20, fontFamily:"'Plus Jakarta Sans', sans-serif",
  }

  const card = (color, activo) => ({
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

  const btnGold = {
    width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
    background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.4)',
    color:'#C9A84C', fontSize:15, fontWeight:700, fontFamily:'inherit', transition:'all .15s',
  }

  const back = (fn) => (
    <div onClick={fn} style={{ fontSize:12, color:'rgba(255,255,255,0.3)', cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
      ← Volver
    </div>
  )

  return (
    <div style={container}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          {negocio ? (
            <div style={{ fontSize:48, marginBottom:8 }}>
              {NEGOCIOS.find(n=>n.id===negocio)?.emoji}
            </div>
          ) : (
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:4, fontWeight:600, marginBottom:8 }}>LRM TRADE</div>
          )}
          <div style={{ fontSize:36, fontWeight:900, color:'#F0F4FF', letterSpacing:-1 }}>
            {negocio ? NEGOCIOS.find(n=>n.id===negocio)?.nombre : 'Core'}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginTop:6 }}>
            {negocio ? NEGOCIOS.find(n=>n.id===negocio)?.desc : 'Sistema de gestión · LRM Trade'}
          </div>
        </div>

        {/* PASO 1 — Selección de negocio */}
        {!negocio && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:16 }}>SELECCIONA TU NEGOCIO</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {NEGOCIOS.map(n => (
                <div key={n.id}
                  onClick={() => n.activo && setNegocio(n.id)}
                  style={card(n.color, n.activo)}
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

        {/* PASO 2A — LRM Trade → CEO login */}
        {negocio === 'lrm' && (
          <div>
            {back(reset)}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:1, marginBottom:16 }}>ACCESO CEO</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Email</div>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('')}}
                placeholder="tu@lrmtrade.co" autoFocus
                onKeyDown={e=>e.key==='Enter'&&loginCEO()}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Contraseña</div>
              <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}}
                placeholder="••••••••"
                onKeyDown={e=>e.key==='Enter'&&loginCEO()}
                style={inputStyle} />
            </div>
            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:14 }}>{error}</div>}
            <button onClick={loginCEO} disabled={loading} style={btnGold}>
              {loading ? 'Verificando...' : 'Ingresar →'}
            </button>
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
              Demo: luis@zabu.co · zabu2026
            </div>
          </div>
        )}

        {/* PASO 2B — ZABÚ → selección de rol */}
        {negocio === 'zabu' && !rol && (
          <div>
            {back(reset)}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:16 }}>¿CUÁL ES TU ROL?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ROLES_ZABU.map(r => (
                <div key={r.id} onClick={() => setRol(r.id)} style={card('#C9A84C', true)}
                  onMouseOver={e => { e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'; e.currentTarget.style.background='rgba(201,168,76,0.06)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                >
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
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
        {negocio === 'zabu' && rol && (
          <div>
            {back(() => setRol(null))}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:20 }}>
              {rol === 'vendedor' ? 'INGRESA TU PIN DE VENDEDOR' : 'INGRESA TU PIN DE COCINA'}
            </div>

            {/* Indicador PIN */}
            <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:16, height:16, borderRadius:'50%', transition:'all .2s',
                  background: i < pin.length ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                  border:'1px solid rgba(201,168,76,0.3)',
                }} />
              ))}
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:16, textAlign:'center' }}>{error}</div>}

            {/* Teclado PIN */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:280, margin:'0 auto' }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
                <div key={i} onClick={() => {
                  if (d === '⌫') { setPin(prev=>prev.slice(0,-1)); setError('') }
                  else if (d !== '') addPin(String(d))
                }} style={{
                  padding:'18px', borderRadius:12, textAlign:'center',
                  cursor: d==='' ? 'default' : 'pointer',
                  background: d==='' ? 'transparent' : d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)',
                  border: d==='' ? 'none' : `1px solid ${d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: d==='⌫' ? 20 : 22, fontWeight:700,
                  color: d==='' ? 'transparent' : d==='⌫' ? '#e05252' : '#F0F4FF',
                  visibility: d==='' ? 'hidden' : 'visible',
                  transition:'all .1s',
                }}
                  onMouseOver={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.12)' }}
                  onMouseOut={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)' }}
                >{d}</div>
              ))}
            </div>

            <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)' }}>
              {rol === 'vendedor' ? 'Demo: 1234' : 'Demo: 9999'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}