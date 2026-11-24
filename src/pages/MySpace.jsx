// MySpace · tu centro de control personal (Fases 0 y 1)
// Clave guardada en el servidor, pantalla "Hoy" con la rutina ancla y las áreas de tu vida.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Plata from './MySpace/Plata'
import Habitos from './MySpace/Habitos'
import { RegistroRapido, useOrden, useCuentas } from './MySpace/Cuentas'

const AZUL = '#7B93FF'
const cop = n => '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('es-CO')
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

// ─── Las áreas ────────────────────────────────────────────────────────────────
const AREAS = [
  { id:'hoy',        nombre:'Hoy',          icono:'☀️' },
  { id:'plata',      nombre:'Plata',        icono:'💰' },
  { id:'habitos',    nombre:'Hábitos',      icono:'🔁' },
  { id:'estudios',   nombre:'Estudios',     icono:'🎓', fase:2, trae:'El camino al grado: materias que faltan, comparar seguir en Administración o pasarte a Negocios internacionales, semestre, entregas, notas y pagos.' },
  { id:'lucia',      nombre:'Lucía',        icono:'👧', fase:2, trae:'Colegio, salud, gastos, fechas importantes, llevarla y recogerla, y los momentos juntos. También tu gente: tus papás, tu hermano, Carlos.' },
  { id:'fitness',    nombre:'Fitness',      icono:'💪', fase:3, trae:'Gym, peso, comidas, sueño y citas médicas.' },
  { id:'espiritual', nombre:'Espiritual',   icono:'🙏', fase:3, trae:'Devocional, Living Room, oraciones y sus respuestas, y tus conversaciones con Carlos.' },
  { id:'diario',     nombre:'Diario',       icono:'📓', fase:3, trae:'Tres líneas al día: lo que pensaste, lo que aprendiste, lo que agradeces. Privado.' },
  { id:'suenos',     nombre:'Sueños 2027',  icono:'🌄', fase:4, trae:'Oficina, apartamento, LRM, Capitán en Silencio, ZABÚ, tus papás, Sara y su hija: cada sueño partido en pasos, y la revisión de los domingos.' },
]
const PRINCIPALES = ['hoy', 'plata', 'habitos', 'diario']

// ─── La rutina ancla: cinco cosas pequeñas cada día ───────────────────────────
const RUTINA = [
  { id:'devocional', t:'Devocional y oración',        d:'10 minutos' },
  { id:'lrm',        t:'Una acción de LRM Trade',     d:'Una llamada, un mensaje o una propuesta que acerque un cliente' },
  { id:'gastos',     t:'Anotar lo que gasté',         d:'Todo lo del día, aunque sea poquito' },
  { id:'lucia',      t:'Algo para Lucía o con Lucía', d:'Una llamada, llevarla, un rato juntos' },
  { id:'diario',     t:'Tres líneas en el diario',    d:'Lo que pensé, lo que aprendí, lo que agradezco' },
]

// ─── Clave ─────────────────────────────────────────────────────────────────────
function Teclado({ titulo, sub, error, largo = 4, onListo, ocupado }) {
  const [pin, setPin] = useState('')
  useEffect(() => { if (error) setPin('') }, [error])
  const poner = d => { if (ocupado || pin.length >= 6) return; const n = pin + d; setPin(n); if (largo && n.length === largo) setTimeout(() => { onListo(n); setPin('') }, 150) }
  return (
    <div style={{ width:'100%', maxWidth:320, margin:'0 auto', textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:20, margin:'0 auto 14px', display:'grid', placeItems:'center', background:`${AZUL}22`, border:`1px solid ${AZUL}55`, fontSize:28 }}>🔐</div>
      <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>{titulo}</div>
      <div style={{ fontSize:12.5, color:'var(--text3)', margin:'4px 0 26px' }}>{sub}</div>
      <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:18, minHeight:14 }}>
        {Array.from({ length: largo || Math.max(4, pin.length) }).map((_, i) => (
          <div key={i} style={{ width:13, height:13, borderRadius:'50%', transition:'all .15s', background: i < pin.length ? (error ? 'var(--red)' : AZUL) : 'rgba(255,255,255,0.10)' }} />
        ))}
      </div>
      <div style={{ minHeight:20, fontSize:12.5, color:'var(--red)', marginBottom:10 }}>{error}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, maxWidth:264, margin:'0 auto' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
          <button key={i} type="button" id={d === '⌫' ? 'pin-borrar' : `pin-${d}`} disabled={d === '' || ocupado}
            onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : poner(String(d))}
            style={{ height:58, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background: d === '' ? 'transparent' : 'rgba(255,255,255,0.05)', visibility: d === '' ? 'hidden' : 'visible',
              color:'var(--text)', fontSize: d === '⌫' ? 18 : 22, fontWeight:700, fontFamily:'inherit', cursor:'pointer' }}>{d}</button>
        ))}
      </div>
      {!largo && pin.length >= 4 && <button id="pin-ok" type="button" onClick={() => { onListo(pin); setPin('') }} className="btn-gold" style={{ marginTop:16, width:264 }}>Continuar</button>}
    </div>
  )
}

function Candado({ onAbrir }) {
  const [estado, setEstado] = useState(null)      // null cargando · {tiene_pin}
  const [paso, setPaso] = useState('entrar')      // entrar · nueva · confirmar
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [falta, setFalta] = useState(false)       // falta correr el SQL 25

  useEffect(() => {
    supabase.rpc('myspace_pin_estado').then(({ data, error }) => {
      if (error) { setFalta(true); return }
      setEstado(data); if (!data?.tiene_pin) setPaso('nueva')
    })
  }, [])

  const entrar = async pin => {
    setOcupado(true); setError('')
    const { data, error } = await supabase.rpc('myspace_pin_verificar', { p_pin: pin })
    setOcupado(false)
    if (error) return setError('No se pudo comprobar. Revisa tu conexión.')
    if (data?.ok) return onAbrir()
    if (data?.bloqueado_hasta) return setError(`Bloqueado hasta las ${new Date(data.bloqueado_hasta).toLocaleTimeString('es-CO', { hour:'numeric', minute:'2-digit' })}`)
    setError(data?.quedan ? `Clave incorrecta · te quedan ${data.quedan} intentos` : 'Clave incorrecta')
  }
  const crear = async pin => {
    if (paso === 'nueva') { setNueva(pin); setPaso('confirmar'); setError(''); return }
    if (pin !== nueva) { setError('No coinciden. Escríbela otra vez.'); setPaso('nueva'); setNueva(''); return }
    setOcupado(true)
    const { data, error } = await supabase.rpc('myspace_pin_fijar', { p_nuevo: pin })
    setOcupado(false)
    if (error || !data?.ok) { setError(data?.error || 'No se pudo guardar.'); setPaso('nueva'); return }
    onAbrir()
  }

  return (
    <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 0' }}>
      {falta ? (
        <div className="panel" style={{ maxWidth:420, fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
          <div style={{ fontWeight:800, color:'var(--text)', marginBottom:6 }}>Falta un paso en Supabase</div>
          Corre el archivo <b>25_myspace_base.sql</b> en Supabase → SQL Editor. Con eso tu clave de MySpace queda guardada de forma segura.
        </div>
      ) : !estado ? <div style={{ color:'var(--text3)', fontSize:13 }}>Cargando…</div>
        : paso === 'entrar' ? <Teclado titulo="MySpace" sub="Escribe tu clave" error={error} largo={0} ocupado={ocupado} onListo={entrar} />
        : <Teclado titulo={paso === 'nueva' ? 'Crea tu clave' : 'Confírmala'} sub={paso === 'nueva' ? 'De 4 a 6 números. Solo tú la sabes.' : 'Escríbela otra vez'} error={error} largo={0} ocupado={ocupado} onListo={crear} />}
    </div>
  )
}

// ─── Hoy ──────────────────────────────────────────────────────────────────────
function Hoy({ irA }) {
  const hoy = hoyISO()
  const [hechos, setHechos] = useState([])      // [{fecha,item}] de los últimos 60 días
  const [plata, setPlata] = useState(null)
  const [error, setError] = useState('')
  const [vuelta, setVuelta] = useState(0)
  const { d: orden, recargar: recargarOrden } = useOrden()
  const { cuentas, saldo } = useCuentas()
  const disponible = cuentas.filter(c => c.activa && c.dueno === 'luis' && c.moneda === 'COP').reduce((t, c) => t + (saldo[c.id]?.disponible || 0), 0)

  const cargar = async () => {
    const desde = masDias(hoy, -60), mes = hoy.slice(0, 7) + '-01'
    const [r, ing, gas, deu] = await Promise.all([
      supabase.from('my_space_rutina').select('fecha,item').gte('fecha', desde),
      supabase.from('my_space_ingresos_v2').select('monto').gte('fecha', mes),
      supabase.from('my_space_gastos_v2').select('monto,fecha').gte('fecha', mes),
      supabase.from('my_space_deudas').select('acreedor,saldo_total,cuota_mensual,fecha_vencimiento').eq('tipo', 'debo'),
    ])
    if (r.error) setError('Corre el SQL 25 en Supabase para guardar tu rutina.')
    setHechos(r.data || [])
    const g = gas.data || []
    setPlata({
      ingresos: (ing.data || []).reduce((t, x) => t + Number(x.monto || 0), 0),
      gastos: g.reduce((t, x) => t + Number(x.monto || 0), 0),
      gastosHoy: g.filter(x => x.fecha === hoy).reduce((t, x) => t + Number(x.monto || 0), 0),
      deuda: (deu.data || []).reduce((t, x) => t + Number(x.saldo_total || 0), 0),
      cuotas: (deu.data || []).reduce((t, x) => t + Number(x.cuota_mensual || 0), 0),
      nDeudas: (deu.data || []).filter(x => Number(x.saldo_total) > 0).length,
    })
  }
  useEffect(() => { cargar() }, [vuelta])

  const set = useMemo(() => new Set(hechos.map(h => h.fecha + '|' + h.item)), [hechos])
  const hecho = (f, id) => set.has(f + '|' + id)
  const marcar = async id => {
    const ya = hecho(hoy, id)
    setHechos(p => ya ? p.filter(h => !(h.fecha === hoy && h.item === id)) : [...p, { fecha: hoy, item: id }])
    const r = ya ? await supabase.from('my_space_rutina').delete().eq('fecha', hoy).eq('item', id)
                 : await supabase.from('my_space_rutina').insert({ fecha: hoy, item: id })
    if (r.error) { setError('No se guardó. Corre el SQL 25 en Supabase.'); cargar() }
  }
  // Racha: días seguidos cumplidos (si hoy aún no, cuenta desde ayer)
  const racha = id => { let n = 0, f = hecho(hoy, id) ? hoy : masDias(hoy, -1); while (hecho(f, id)) { n++; f = masDias(f, -1) } return n }
  const fallóAyer = id => !hecho(masDias(hoy, -1), id) && !hecho(hoy, id) && hechos.some(h => h.item === id)
  const dias7 = Array.from({ length: 7 }, (_, i) => masDias(hoy, i - 6))
  const listos = RUTINA.filter(r => hecho(hoy, r.id)).length
  const fecha = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })
  const hora = new Date().getHours()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:12, color:AZUL, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>{fecha}</div>
        <div style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginTop:2 }}>{hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'}, Luis</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Un 1% cada día. Si fallas un día no pasa nada; lo único prohibido es fallar dos seguidos.</div>
      </div>

      <RegistroRapido compacto onGuardado={() => { setVuelta(v => v + 1); recargarOrden() }} />

      {orden && !orden.falta && (orden.meta.lucia > 0 || cuentas.length > 0) && (
        <div className="ms-kpis" style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:10 }}>
          {orden.meta.lucia > 0 && (
            <div className="panel" onClick={() => irA('plata')} style={{ padding:'12px 14px', cursor:'pointer', minWidth:0 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>👧 Lucía este mes</div>
              <div id="hoy-lucia" style={{ fontSize:'clamp(14px, 4vw, 18px)', fontWeight:800, color: orden.usado.lucia >= orden.meta.lucia ? 'var(--green)' : 'var(--text)' }}>{cop(orden.usado.lucia)}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{orden.usado.lucia >= orden.meta.lucia ? 'cubierto ✓' : `faltan ${cop(orden.meta.lucia - orden.usado.lucia)}`}</div>
            </div>
          )}
          <div className="panel" style={{ padding:'12px 14px', minWidth:0 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>✨ Libre del mes</div>
            <div id="hoy-libre" style={{ fontSize:'clamp(14px, 4vw, 18px)', fontWeight:800, color: orden.libre < 0 ? 'var(--red)' : 'var(--green)' }}>{orden.libre < 0 ? '−' : ''}{cop(orden.libre)}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>después del orden</div>
          </div>
          {cuentas.length > 0 && (
            <div className="panel" style={{ padding:'12px 14px', minWidth:0 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>🏦 En tus cuentas</div>
              <div id="hoy-cuentas" style={{ fontSize:'clamp(14px, 4vw, 18px)', fontWeight:800, color: disponible < 0 ? 'var(--red)' : 'var(--text)' }}>{disponible < 0 ? '−' : ''}{cop(disponible)}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>disponible</div>
            </div>
          )}
        </div>
      )}

      <div className="panel ms-rutina">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase' }}>Rutina ancla</div>
          <div id="ms-listos" style={{ fontSize:13, fontWeight:800, color: listos === 5 ? 'var(--green)' : 'var(--text2)' }}>{listos} de 5{listos === 5 ? ' · día completo' : ''}</div>
        </div>
        <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', marginBottom:14, overflow:'hidden' }}>
          <div style={{ width:`${listos * 20}%`, height:'100%', background: listos === 5 ? 'var(--green)' : AZUL, transition:'width .3s' }} />
        </div>
        {RUTINA.map(r => {
          const ok = hecho(hoy, r.id), n = racha(r.id), alerta = fallóAyer(r.id)
          return (
            <button key={r.id} id={`rut-${r.id}`} type="button" onClick={() => marcar(r.id)} className="ms-item"
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 10px', margin:'0 0 6px', borderRadius:14, textAlign:'left', fontFamily:'inherit', cursor:'pointer',
                background: ok ? 'rgba(76,175,80,0.10)' : 'rgba(255,255,255,0.03)', border:`1px solid ${ok ? 'rgba(76,175,80,0.35)' : alerta ? 'rgba(224,82,82,0.35)' : 'var(--border)'}` }}>
              <span style={{ width:26, height:26, flexShrink:0, borderRadius:9, display:'grid', placeItems:'center', fontSize:15, fontWeight:900,
                background: ok ? 'var(--green)' : 'transparent', border: ok ? 'none' : '2px solid rgba(255,255,255,0.18)', color:'#0b0b0b' }}>{ok ? '✓' : ''}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:'block', fontSize:14.5, fontWeight:700, color:'var(--text)', textDecoration: ok ? 'line-through' : 'none', opacity: ok ? 0.7 : 1 }}>{r.t}</span>
                <span style={{ display:'block', fontSize:12, color: alerta ? 'var(--red)' : 'var(--text3)', marginTop:1 }}>{alerta ? 'Ayer no salió: hoy no se puede fallar' : r.d}</span>
              </span>
              <span style={{ flexShrink:0, textAlign:'right' }}>
                <span style={{ display:'flex', gap:3, justifyContent:'flex-end', marginBottom:4 }}>
                  {dias7.map(f => <span key={f} title={f} style={{ width:7, height:7, borderRadius:2, background: hecho(f, r.id) ? (f === hoy ? 'var(--green)' : AZUL) : 'rgba(255,255,255,0.10)' }} />)}
                </span>
                <span style={{ fontSize:11.5, fontWeight:700, color: n ? 'var(--gold)' : 'var(--text4)' }}>{n ? `🔥 ${n} día${n === 1 ? '' : 's'}` : 'sin racha'}</span>
              </span>
            </button>
          )
        })}
        {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:6 }}>{error}</div>}
      </div>

      {plata && (
        <div className="panel" onClick={() => irA('plata')} style={{ cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase' }}>Plata del mes</div>
            <div style={{ fontSize:12, color:AZUL, fontWeight:700 }}>Ver Plata →</div>
          </div>
          <div className="ms-kpis" style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:10 }}>
            {[
              ['Entró', cop(plata.ingresos), 'var(--green)'],
              ['Salió', cop(plata.gastos), 'var(--red)'],
              ['Queda', (plata.ingresos - plata.gastos < 0 ? '−' : '') + cop(plata.ingresos - plata.gastos), plata.ingresos - plata.gastos < 0 ? 'var(--red)' : 'var(--text)'],
              ['Gastado hoy', cop(plata.gastosHoy), 'var(--text)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ minWidth:0, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                <div style={{ fontSize:'clamp(14px, 4vw, 18px)', fontWeight:800, color:c, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
              </div>
            ))}
          </div>
          {plata.nDeudas > 0 && <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:12 }}>Deudas: <b style={{ color:'var(--red)' }}>{cop(plata.deuda)}</b> en {plata.nDeudas} · cuotas del mes {cop(plata.cuotas)}</div>}
        </div>
      )}

      <div className="panel">
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>El norte</div>
        <ol style={{ margin:'8px 0 0', paddingLeft:20, fontSize:13.5, color:'var(--text2)', lineHeight:1.7 }}>
          <li><b style={{ color:'var(--text)' }}>LRM Trade:</b> tarifas, aliados y salir a la calle a vender</li>
          <li><b style={{ color:'var(--text)' }}>Cerrar cabos:</b> deudas, prendas y la salida del apartamento</li>
          <li><b style={{ color:'var(--text)' }}>Finanzas nuevas:</b> tu casa, el carro al día</li>
          <li><b style={{ color:'var(--text)' }}>Lucía</b>, tu motor</li>
          <li><b style={{ color:'var(--text)' }}>ZABÚ y RV Sports</b> en 2027</li>
          <li><b style={{ color:'var(--text)' }}>Tú por dentro:</b> fe, diario, fitness, universidad</li>
        </ol>
      </div>
    </div>
  )
}

// ─── Áreas que vienen ─────────────────────────────────────────────────────────
function Proximamente({ area }) {
  return (
    <div className="panel" style={{ textAlign:'center', padding:'36px 22px' }}>
      <div style={{ fontSize:40 }}>{area.icono}</div>
      <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginTop:8 }}>{area.nombre}</div>
      <div style={{ display:'inline-block', margin:'10px 0 14px', padding:'4px 12px', borderRadius:999, fontSize:11.5, fontWeight:800, letterSpacing:1, color:AZUL, background:`${AZUL}1f`, border:`1px solid ${AZUL}44` }}>LLEGA EN LA FASE {area.fase}</div>
      <div style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.6, maxWidth:440, margin:'0 auto' }}>{area.trae}</div>
    </div>
  )
}

function Clave() {
  const [paso, setPaso] = useState('actual')
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [msg, setMsg] = useState('')
  const listo = async pin => {
    if (paso === 'actual') { setActual(pin); setPaso('nueva'); setMsg(''); return }
    if (paso === 'nueva') { setNueva(pin); setPaso('confirmar'); return }
    if (pin !== nueva) { setMsg('No coinciden'); setPaso('nueva'); return }
    const { data, error } = await supabase.rpc('myspace_pin_fijar', { p_nuevo: pin, p_actual: actual })
    if (error || !data?.ok) { setMsg(data?.error || 'No se pudo cambiar'); setPaso('actual'); return }
    setPaso('ok')
  }
  if (paso === 'ok') return <div className="panel" style={{ textAlign:'center', color:'var(--green)', fontWeight:700 }}>✓ Clave cambiada</div>
  return <div className="panel"><Teclado titulo="Cambiar clave" sub={paso === 'actual' ? 'Escribe tu clave actual' : paso === 'nueva' ? 'Escribe la nueva (4 a 6 números)' : 'Confirma la nueva'} error={msg} largo={0} onListo={listo} /></div>
}

// ─── MySpace ──────────────────────────────────────────────────────────────────
export default function MySpace() {
  const [abierto, setAbierto] = useState(false)
  const [area, setArea] = useState('hoy')
  const [mas, setMas] = useState(false)
  const irA = id => { setArea(id); setMas(false); window.scrollTo?.({ top:0 }); document.querySelector('.page-content')?.scrollTo?.({ top:0 }) }

  if (!abierto) return <Candado onAbrir={() => setAbierto(true)} />
  const actual = AREAS.find(a => a.id === area)

  return (
    <div className="ms-wrap">
      {/* Arriba: todas las áreas (computador) */}
      <div className="ms-nav-top" style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:18 }}>
        {AREAS.map(a => (
          <button key={a.id} id={`ms-area-${a.id}`} type="button" onClick={() => irA(a.id)}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:999, fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer',
              background: area === a.id ? `${AZUL}26` : 'rgba(255,255,255,0.03)', color: area === a.id ? AZUL : 'var(--text2)', border:`1px solid ${area === a.id ? AZUL + '66' : 'var(--border)'}` }}>
            <span>{a.icono}</span>{a.nombre}{a.fase ? <span style={{ fontSize:10, opacity:0.6 }}>F{a.fase}</span> : null}
          </button>
        ))}
        <button type="button" id="ms-area-clave" onClick={() => irA('clave')} style={{ flexShrink:0, padding:'8px 14px', borderRadius:999, fontFamily:'inherit', fontSize:13, cursor:'pointer', background:'transparent', color:'var(--text3)', border:'1px solid var(--border)' }}>🔐 Clave</button>
      </div>

      {area === 'hoy' && <Hoy irA={irA} />}
      {area === 'plata' && <Plata />}
      {area === 'habitos' && <Habitos />}
      {area === 'clave' && <Clave />}
      {actual?.fase && <Proximamente area={actual} />}

      {/* Abajo: menú del celular */}
      <nav className="ms-nav-bottom">
        {PRINCIPALES.map(id => { const a = AREAS.find(x => x.id === id); return (
          <button key={id} id={`msb-${id}`} type="button" onClick={() => irA(id)} className={area === id ? 'on' : ''}><span>{a.icono}</span>{a.nombre}</button>
        ) })}
        <button id="msb-mas" type="button" onClick={() => setMas(m => !m)} className={mas || !PRINCIPALES.includes(area) ? 'on' : ''}><span>☰</span>Más</button>
      </nav>
      {mas && (
        <div className="ms-mas" onClick={() => setMas(false)}>
          <div onClick={e => e.stopPropagation()} className="ms-mas-hoja">
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>Todas las áreas</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
              {[...AREAS.filter(a => !PRINCIPALES.includes(a.id)), { id:'clave', nombre:'Clave', icono:'🔐' }].map(a => (
                <button key={a.id} id={`msm-${a.id}`} type="button" onClick={() => irA(a.id)}
                  style={{ padding:'14px 6px', borderRadius:16, fontFamily:'inherit', cursor:'pointer', background: area === a.id ? `${AZUL}26` : 'rgba(255,255,255,0.04)', border:`1px solid ${area === a.id ? AZUL + '66' : 'var(--border)'}`, color:'var(--text)' }}>
                  <div style={{ fontSize:24 }}>{a.icono}</div>
                  <div style={{ fontSize:12, fontWeight:700, marginTop:4 }}>{a.nombre}</div>
                  {a.fase ? <div style={{ fontSize:10, color:'var(--text4)' }}>Fase {a.fase}</div> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}