// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PuertasCore, { IconoEspacio } from '../components/PuertasCore'
import { IconoNegocio } from '../components/IconosMarca'
import { ESPACIOS, NEGOCIOS, negocioPorId, negocioPorSlug, slugDesdeHash, ponerHash } from '../lib/espacios'

const ROLES_ZABU = [
  { id:'vendedor', nombre:'Vendedor', desc:'Punto de venta · Carrito', emoji:'🌭' },
  { id:'cocina',   nombre:'Cocina',   desc:'Pantalla de comandas',     emoji:'👨‍🍳' },
]

const ROLES_RV = [
  { id:'vendedor', nombre:'Vendedor', desc:'Punto de venta · Tienda',   emoji:'⚽' },
  { id:'gerente',  nombre:'Gerente',  desc:'Administración y reportes', emoji:'📊' },
]

// El dueño entra con Supabase Auth (correo y contraseña guardados en Supabase, no en el código).
// Solo pasa quien esté en core_usuarios con rol 'dueno'.
// Se entra con usuario (ej. tuttirestrepov). Por dentro Supabase lo guarda como usuario@lrmcore.app
export const DOMINIO_USUARIOS = 'lrmcore.app'
export const correoDeUsuario = v => { const t = String(v || '').trim().toLowerCase(); return t.includes('@') ? t : `${t}@${DOMINIO_USUARIOS}` }

export async function perfilDueno(user) {
  if (!user) return null
  const { data } = await supabase.from('core_usuarios').select('nombre, rol').eq('user_id', user.id).maybeSingle()
  if (!data || data.rol !== 'dueno') return null
  return { id: user.id, nombre: data.nombre || 'Luis Restrepo', email: user.email, rol:'ceo', negocio:'lrm', carrito:null }
}

// RV Sports todavía no tiene su propia tabla de empleados — se mantiene el PIN demo
// hasta que se construya el módulo de personal de RV (mismo patrón que ZABÚ).
const USUARIOS_RV_DEMO = [
  { id:6, nombre:'Vendedor RV', email:null, rol:'vendedor', pin:'5678', negocio:'rv', carrito:'RV01' },
]

function estadoInicial() {
  const n = negocioPorSlug(slugDesdeHash())
  if (n && n.activo) return { paso:'acceso', espacio:'business', negocio:n.id, directo:true }
  return { paso:'entrada', espacio:null, negocio:null, directo:false }
}

export default function Login({ onLogin }) {
  const [inicio]               = useState(estadoInicial)
  const [paso,     setPaso]    = useState(inicio.paso)       // entrada | negocios | acceso
  const [espacio,  setEspacio] = useState(inicio.espacio)    // business | myspace | capitan
  const [negocio,  setNegocio] = useState(inicio.negocio)
  const [directo]              = useState(inicio.directo)    // entró por link directo del negocio
  const [modoDueno, setModoDueno] = useState(false)
  const [rol,      setRol]      = useState(null)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [pin,      setPin]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const negActual  = negocioPorId(negocio)
  const espActual  = ESPACIOS.find(e => e.id === espacio)
  const colorNeg   = negActual?.color || espActual?.color || '#C9A84C'
  const rolesActual = negocio === 'zabu' ? ROLES_ZABU : negocio === 'rv' ? ROLES_RV : []
  const pideCorreo = espacio !== 'business' || negActual?.acceso === 'ceo' || modoDueno

  const limpiar = () => { setRol(null); setEmail(''); setPassword(''); setPin(''); setError(''); setModoDueno(false) }
  const irEntrada  = () => { limpiar(); setNegocio(null); setEspacio(null); setPaso('entrada'); ponerHash('') }
  const irNegocios = () => { limpiar(); setNegocio(null); setEspacio('business'); setPaso('negocios'); ponerHash('') }

  const elegirEspacio = (id) => {
    setEspacio(id); setError('')
    setPaso(id === 'business' ? 'negocios' : 'acceso')
  }

  const elegirNegocio = (n) => {
    if (!n.activo) return
    limpiar(); setNegocio(n.id); setPaso('acceso'); ponerHash(n.slug)
  }

  const destino = () => ({ espacio: espacio || 'business', negocio })

  const loginCEO = async () => {
    if (!email.trim() || !password) return setError('Escribe tu usuario y tu contraseña')
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: correoDeUsuario(email), password })
    if (err) { setLoading(false); return setError('Usuario o contraseña incorrectos') }
    const user = await perfilDueno(data.user)
    setLoading(false)
    if (user) onLogin(user, destino())
    else { await supabase.auth.signOut(); setError('Este usuario no tiene acceso de dueño') }
  }

  // Busca el PIN en zabu_empleados (real) para ZABÚ, o en el demo fijo para RV.
  const verificarPin = async (pinIngresado) => {
    if (negocio === 'zabu') {
      const { data: empleado, error: err } = await supabase
        .from('zabu_empleados').select('*')
        .eq('pin', pinIngresado).eq('estado', 'activo').maybeSingle()
      if (err || !empleado) return null
      return { id: empleado.id, nombre: empleado.nombre, rol, negocio:'zabu', carrito: empleado.carrito_actual, cargo: empleado.cargo_actual }
    }
    if (negocio === 'rv') return USUARIOS_RV_DEMO.find(u => u.pin === pinIngresado && u.rol === rol) || null
    return null
  }

  const addPin = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo); setError('')
    if (nuevo.length === 4) {
      setTimeout(async () => {
        const user = await verificarPin(nuevo)
        if (user) onLogin(user, destino())
        else { setError('PIN incorrecto o empleado inactivo'); setPin('') }
      }, 200)
    }
  }

  // ── PASO 0 · Las tres puertas ────────────────────────────────────────────────
  if (paso === 'entrada') return <PuertasCore onElegir={elegirEspacio} />

  const container = {
    minHeight:'100vh', height:'100%', background:'#0a0a0a', display:'flex', alignItems:'flex-start', justifyContent:'center',
    padding:'48px 20px 40px', fontFamily:"'Plus Jakarta Sans', sans-serif", overflowY:'auto',
  }
  const cardStyle = (activo) => ({
    padding:'16px 18px', borderRadius:14, cursor: activo ? 'pointer' : 'default', width:'100%', textAlign:'left', fontFamily:'inherit',
    background:'rgba(255,255,255,0.03)', border:`1px solid ${activo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
    transition:'all .15s', opacity: activo ? 1 : 0.4, display:'flex', alignItems:'center', gap:14, color:'#F0F4FF',
  })
  const inputStyle = {
    width:'100%', padding:'13px 16px', borderRadius:10, background:'rgba(255,255,255,0.06)',
    border:'1px solid rgba(255,255,255,0.1)', color:'#F0F4FF', fontSize:14, fontFamily:'inherit', outline:'none',
  }
  const btnColor = (color) => ({
    width:'100%', padding:'14px', borderRadius:12, cursor:'pointer', background:`${color}25`,
    border:`1px solid ${color}66`, color, fontSize:15, fontWeight:700, fontFamily:'inherit', transition:'all .15s',
  })
  const back = (fn, texto = '← Volver') => (
    <div onClick={fn} style={{ fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer', marginBottom:20, display:'inline-flex', alignItems:'center', gap:6 }}>{texto}</div>
  )
  const hover = (color) => ({
    onMouseOver: e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.background = color + '0d' },
    onMouseOut:  e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' },
  })

  // Cabecera: marca del negocio, o del espacio (MySpace / Capitán), o "Business"
  const cabecera = () => {
    if (paso === 'negocios') return (
      <div className="neg-marca">
        <div className="neg-marca-emoji" style={{ background:'#C9A84C1a', color:'#C9A84C', border:'1px solid #C9A84C40' }}><IconoEspacio tipo="business" size={30} /></div>
        <div className="neg-marca-nombre">Business</div>
        <div className="neg-marca-desc">Elige el negocio</div>
      </div>
    )
    if (negActual?.id === 'inversiones') return (
      <div className="neg-marca">
        <img src="/marca/logo-vertical.png" alt="LRM Trade Consulting" style={{ width:'100%', maxWidth:280, margin:'0 auto 8px', display:'block' }} />
        {!(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) && <div className="neg-marca-parte">Business · LRM Corp</div>}
      </div>
    )
    if (negActual) return (
      <div className="neg-marca">
        <div className="neg-marca-emoji" style={{ background:negActual.color + '1a', border:`1px solid ${negActual.color}40` }}><IconoNegocio id={negActual.id} size={30} color={negActual.color} /></div>
        <div className="neg-marca-nombre">{negActual.nombre}</div>
        <div className="neg-marca-desc">{negActual.desc}</div>
        <div className="neg-marca-parte">Business · LRM Corp</div>
      </div>
    )
    return (
      <div className="neg-marca">
        <div className="neg-marca-emoji" style={{ background:espActual?.color + '1a', color:espActual?.color, border:`1px solid ${espActual?.color}40` }}><IconoEspacio tipo={espActual?.icono} size={30} /></div>
        <div className="neg-marca-nombre">{espActual?.nombre}</div>
        <div className="neg-marca-desc">Acceso privado</div>
      </div>
    )
  }

  // Volver desde el formulario de correo
  const volverDesdeCorreo = () => {
    if (modoDueno) { setModoDueno(false); setError(''); return }
    if (espacio !== 'business') return irEntrada()
    return irNegocios()
  }

  return (
    <div style={container}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* PASO 1 · Negocios de Business */}
        {paso === 'negocios' && (
          <div>
            {back(irEntrada, '← LRM Corp')}
            {cabecera()}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {NEGOCIOS.map(n => (
                <button key={n.id} type="button" onClick={() => elegirNegocio(n)} style={cardStyle(n.activo)} {...(n.activo ? hover(n.color) : {})}>
                  <div style={{ width:44, height:44, borderRadius:12, background:n.color + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:`1px solid ${n.color}33` }}><IconoNegocio id={n.id} size={22} color={n.color} /></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{n.nombre}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{n.activo ? n.desc : 'Próximamente'}</div>
                  </div>
                  {n.activo
                    ? <div style={{ fontSize:18, color:'rgba(255,255,255,0.2)' }}>→</div>
                    : <div style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.25)' }}>Pronto</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2A · Correo y contraseña (LRM Trade, Inversiones, MySpace, Capitán o dueño) */}
        {paso === 'acceso' && pideCorreo && (
          <div>
            {!(directo && !modoDueno) && back(volverDesdeCorreo)}
            {cabecera()}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Usuario</div>
              <input id="login-email" type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={email} onChange={e=>{setEmail(e.target.value);setError('')}}
                placeholder="tu usuario" autoFocus onKeyDown={e=>e.key==='Enter'&&loginCEO()} style={inputStyle} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Contraseña</div>
              <input id="login-password" type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}}
                placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&loginCEO()} style={inputStyle} />
            </div>
            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:14 }}>{error}</div>}
            <button onClick={loginCEO} disabled={loading} style={btnColor(colorNeg)}>
              {loading ? 'Verificando...' : 'Ingresar →'}
            </button>
            {negActual?.id === 'inversiones' && (
              <a id="login-soy-cliente" href="/?app=clientes#/clientes" style={{ display:'block', textAlign:'center', marginTop:16, fontSize:12.5, color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>
                ¿Eres cliente? <span style={{ color:colorNeg, fontWeight:700 }}>Entra a tu portal →</span>
              </a>
            )}
          </div>
        )}

        {/* PASO 2B · ZABÚ / RV → elegir rol */}
        {paso === 'acceso' && !pideCorreo && !rol && (
          <div>
            {!directo && back(irNegocios, '← Business')}
            {cabecera()}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:16 }}>¿CUÁL ES TU ROL?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {rolesActual.map(r => (
                <button key={r.id} type="button" onClick={() => setRol(r.id)} style={cardStyle(true)} {...hover(colorNeg)}>
                  <div style={{ width:44, height:44, borderRadius:12, background:colorNeg + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{r.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{r.nombre}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{r.desc}</div>
                  </div>
                  <div style={{ fontSize:18, color:'rgba(255,255,255,0.2)' }}>→</div>
                </button>
              ))}
              <button type="button" onClick={() => { setModoDueno(true); setError('') }}
                style={{ marginTop:6, padding:'12px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                  background:'transparent', border:'1px dashed rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.45)' }}>
                Dueño o administrador · entrar con correo
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 · PIN */}
        {paso === 'acceso' && !pideCorreo && rol && (
          <div>
            {back(() => { setRol(null); setPin(''); setError('') })}
            {cabecera()}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:20 }}>INGRESA TU PIN</div>
            <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:16, height:16, borderRadius:'50%', transition:'all .2s',
                  background: i < pin.length ? colorNeg : 'rgba(255,255,255,0.1)', border:`1px solid ${colorNeg}44` }} />
              ))}
            </div>
            {error && <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:16, textAlign:'center' }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:280, margin:'0 auto' }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
                <div key={i} onClick={() => {
                  if (d === '⌫') { setPin(prev=>prev.slice(0,-1)); setError('') }
                  else if (d !== '') addPin(String(d))
                }} style={{
                  padding:'18px', borderRadius:12, textAlign:'center', cursor: d==='' ? 'default' : 'pointer',
                  visibility: d==='' ? 'hidden' : 'visible',
                  background: d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)',
                  border: d==='' ? 'none' : `1px solid ${d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: d==='⌫' ? 20 : 22, fontWeight:700, color: d==='⌫' ? '#e05252' : '#F0F4FF', transition:'all .1s',
                }}>{d}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}