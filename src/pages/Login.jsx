import { useState } from 'react'

const USUARIOS = [
  { id:1, nombre:'Luis Restrepo',  email:'luis@zabu.co',   password:'zabu2026', rol:'ceo',       pin:null,   negocio:'LRM Trade' },
  { id:2, nombre:'Emelyn Mendoza', email:'emelyn@zabu.co', password:'zabu2026', rol:'ceo',       pin:null,   negocio:'LRM Trade' },
  { id:3, nombre:'Operador C01',   email:null,             password:null,       rol:'vendedor',  pin:'1234', negocio:'ZABÚ',     carrito:'C01' },
  { id:4, nombre:'Operador C02',   email:null,             password:null,       rol:'vendedor',  pin:'2345', negocio:'ZABÚ',     carrito:'C02' },
  { id:5, nombre:'Comandero',      email:null,             password:null,       rol:'comandero', pin:'9999', negocio:'ZABÚ',     carrito:'C01' },
]

export default function Login({ onLogin }) {
  const [modo, setModo]         = useState(null)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const loginCEO = () => {
    setLoading(true)
    setTimeout(() => {
      const user = USUARIOS.find(u => u.email === email.toLowerCase() && u.password === password)
      if (user) {
        onLogin(user)
      } else {
        setError('Email o contraseña incorrectos')
      }
      setLoading(false)
    }, 600)
  }

  const loginPIN = () => {
    if (pin.length < 4) return
    setLoading(true)
    setTimeout(() => {
      const user = USUARIOS.find(u => u.pin === pin)
      if (user) {
        onLogin(user)
      } else {
        setError('PIN incorrecto')
        setPin('')
      }
      setLoading(false)
    }, 400)
  }

  const addPin = (d) => {
    if (pin.length >= 4) return
    const nuevo = pin + d
    setPin(nuevo)
    setError('')
    if (nuevo.length === 4) {
      setTimeout(() => {
        const user = USUARIOS.find(u => u.pin === nuevo)
        if (user) { onLogin(user) }
        else { setError('PIN incorrecto'); setPin('') }
      }, 300)
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; font-family: 'Plus Jakarta Sans', sans-serif; }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>

        {/* Panel principal */}
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:4, fontWeight:600, marginBottom:8 }}>LRM TRADE</div>
            <div style={{ fontSize:42, fontWeight:900, color:'#F0F4FF', letterSpacing:-1, lineHeight:1 }}>Core</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginTop:8 }}>Sistema de gestión · ZABÚ</div>
          </div>

          {/* Selección de acceso */}
          {!modo && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:1, marginBottom:8 }}>SELECCIONA TU ACCESO</div>

              {[
                { id:'ceo',       label:'CEO / Administrador', desc:'Acceso completo al sistema', emoji:'👔', color:'#C9A84C' },
                { id:'vendedor',  label:'Vendedor',             desc:'Punto de venta — Carrito',   emoji:'🌭', color:'#4caf50' },
                { id:'comandero', label:'Comandero',            desc:'Pantalla de cocina',          emoji:'👨‍🍳', color:'#378ADD' },
              ].map(r => (
                <div key={r.id} onClick={() => { setModo(r.id); setError(''); setPin('') }} style={{
                  padding:'18px 20px', borderRadius:14, cursor:'pointer',
                  background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.08)`,
                  transition:'all .15s', display:'flex', alignItems:'center', gap:14,
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor=r.color+'44'; e.currentTarget.style.background=`${r.color}0a` }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                >
                  <div style={{ width:44, height:44, borderRadius:12, background:`${r.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{r.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#F0F4FF', marginBottom:3 }}>{r.label}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{r.desc}</div>
                  </div>
                  <div style={{ fontSize:20, color:'rgba(255,255,255,0.2)' }}>→</div>
                </div>
              ))}
            </div>
          )}

          {/* Login CEO */}
          {modo === 'ceo' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                <div onClick={() => { setModo(null); setError('') }} style={{ cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:13 }}>← Volver</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#F0F4FF' }}>Acceso CEO</div>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Email</div>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="tu@zabu.co" autoFocus
                  onKeyDown={e => e.key==='Enter' && loginCEO()}
                  style={{ width:'100%', padding:'13px 16px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#F0F4FF', fontSize:14, fontFamily:'inherit', outline:'none' }} />
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Contraseña</div>
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  onKeyDown={e => e.key==='Enter' && loginCEO()}
                  style={{ width:'100%', padding:'13px 16px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#F0F4FF', fontSize:14, fontFamily:'inherit', outline:'none' }} />
              </div>

              {error && (
                <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:14 }}>{error}</div>
              )}

              <button onClick={loginCEO} disabled={loading} style={{
                width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
                background: loading ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.15)',
                border:'1px solid rgba(201,168,76,0.4)', color:'#C9A84C',
                fontSize:15, fontWeight:700, fontFamily:'inherit', transition:'all .15s',
              }}>
                {loading ? 'Verificando...' : 'Ingresar →'}
              </button>

              <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                Demo: luis@zabu.co / zabu2026
              </div>
            </div>
          )}

          {/* Login PIN */}
          {(modo === 'vendedor' || modo === 'comandero') && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                <div onClick={() => { setModo(null); setError(''); setPin('') }} style={{ cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:13 }}>← Volver</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#F0F4FF' }}>{modo === 'vendedor' ? 'Acceso Vendedor' : 'Acceso Comandero'}</div>
              </div>

              {/* Indicador PIN */}
              <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:28 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:16, height:16, borderRadius:'50%', background: i < pin.length ? '#C9A84C' : 'rgba(255,255,255,0.1)', transition:'all .2s', border:'1px solid rgba(201,168,76,0.3)' }} />
                ))}
              </div>

              {error && (
                <div style={{ padding:'10px 14px', background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, fontSize:12, color:'#e05252', marginBottom:16, textAlign:'center' }}>{error}</div>
              )}

              {/* Teclado PIN */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:280, margin:'0 auto' }}>
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
                  <div key={i} onClick={() => {
                    if (d === '⌫') { setPin(prev => prev.slice(0,-1)); setError('') }
                    else if (d !== '') addPin(String(d))
                  }} style={{
                    padding:'18px', borderRadius:12, textAlign:'center', cursor: d==='' ? 'default' : 'pointer',
                    background: d==='' ? 'transparent' : d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)',
                    border: d==='' ? 'none' : `1px solid ${d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: d==='⌫' ? 20 : 22, fontWeight:700,
                    color: d==='' ? 'transparent' : d==='⌫' ? '#e05252' : '#F0F4FF',
                    transition:'all .1s',
                    visibility: d==='' ? 'hidden' : 'visible',
                  }}
                    onMouseOver={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.2)' : 'rgba(255,255,255,0.12)' }}
                    onMouseOut={e => { if(d!=='') e.currentTarget.style.background = d==='⌫' ? 'rgba(224,82,82,0.1)' : 'rgba(255,255,255,0.06)' }}
                  >{d}</div>
                ))}
              </div>

              <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)' }}>
                {modo === 'vendedor' ? 'Demo PIN: 1234' : 'Demo PIN: 9999'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}