// @ts-nocheck
// LRM Trade Consulting · Ajustes
// Botón maestro: borra los datos de LRM Trade por partes o todo, para arrancar limpio.
// Solo toca tablas lrm_* (LRM Trade). No toca ZABÚ, RV, MySpace ni nada más.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDatosLRM, guardarDatosLRM } from './datosLRM'

// Cada grupo borra sus tablas en orden (primero las que dependen de otras)
const GRUPOS = [
  { id:'caja',     nombre:'Movimientos de caja', desc:'Cobros, pagos, gastos, traslados y cierres de mes. Las cuentas quedan con su saldo inicial.',
    tablas:[['lrm_movimientos','id'], ['lrm_cierres','mes']] },
  { id:'cargas',   nombre:'Cargas',              desc:'Recibos de bodega, piezas y trazabilidad, con sus cobros y costos en caja.',
    tablas:[['lrm_movimientos','carga'], ['lrm_carga_eventos','id'], ['lrm_carga_piezas','id'], ['lrm_cargas','id']] },
  { id:'crm',      nombre:'Clientes y CRM',      desc:'Clientes, prospectos, contactos registrados y temas de relevancia.',
    tablas:[['lrm_contactos','id'], ['lrm_temas','id'], ['lrm_clientes','id']] },
  { id:'config',   nombre:'Configuración',       desc:'Cuentas de plata y bodegas. Solo si vas a armar todo de nuevo.',
    tablas:[['lrm_cuentas','id'], ['lrm_bodegas','id']] },
]

async function vaciar([tabla, clave]) {
  // Supabase exige un filtro para borrar: se usa uno que coincide con todas las filas
  if (clave === 'carga') return supabase.from(tabla).delete().not('carga_id', 'is', null)
  if (clave === 'mes')   return supabase.from(tabla).delete().neq('mes', '')
  return supabase.from(tabla).delete().not('id', 'is', null)
}

export default function Ajustes() {
  const [elegidos, setElegidos] = useState([])
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState('')
  const todo = elegidos.length === GRUPOS.length

  const alternar = id => setElegidos(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const borrar = async () => {
    if (texto.trim().toUpperCase() !== 'BORRAR' || elegidos.length === 0) return
    setEstado('Borrando…')
    // Orden seguro: caja y cargas antes que clientes; configuración al final
    const orden = ['caja', 'cargas', 'crm', 'config'].filter(id => elegidos.includes(id))
    for (const id of orden) {
      for (const t of GRUPOS.find(g => g.id === id).tablas) {
        const { error } = await vaciar(t)
        if (error && !/does not exist|schema cache/i.test(error.message)) { setEstado(`Error en ${t[0]}: ${error.message}`); return }
      }
    }
    setEstado('Listo. Se borró lo que elegiste.'); setElegidos([]); setTexto('')
  }

  return (
    <div style={{ maxWidth:720, display:'flex', flexDirection:'column', gap:14 }}>
      <DatosCobro />
      <div className="panel" style={{ border:'1px solid rgba(224,82,82,0.35)' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--red)', marginBottom:4 }}>Borrar datos de LRM Trade</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:16 }}>
          Para errores puntuales usa el ✕ o "Borrar" de cada registro. Esto es para limpiar en bloque. No se puede deshacer y solo afecta a LRM Trade.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {GRUPOS.map(g => (
            <label key={g.id} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', borderRadius:10, cursor:'pointer',
              background: elegidos.includes(g.id) ? 'var(--red-dim)' : 'var(--bg4)', border:`1px solid ${elegidos.includes(g.id) ? 'rgba(224,82,82,0.35)' : 'var(--border)'}` }}>
              <input type="checkbox" checked={elegidos.includes(g.id)} onChange={() => alternar(g.id)} style={{ marginTop:3 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{g.nombre}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{g.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <button onClick={() => setElegidos(todo ? [] : GRUPOS.map(g => g.id))} className="btn" style={{ fontSize:11, marginBottom:14 }}>{todo ? 'Quitar todo' : 'Elegir todo'}</button>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>Escribe <b>BORRAR</b> para confirmar</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} style={{ flex:1, padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none' }} />
          <button onClick={borrar} disabled={texto.trim().toUpperCase() !== 'BORRAR' || elegidos.length === 0}
            style={{ padding:'9px 18px', borderRadius:8, fontWeight:700, fontFamily:'inherit', cursor:'pointer', background:'var(--red)', color:'#fff', border:'none',
              opacity: texto.trim().toUpperCase() === 'BORRAR' && elegidos.length ? 1 : 0.35 }}>
            {todo ? 'Borrar todo' : 'Borrar'}
          </button>
        </div>
        {estado && <div style={{ fontSize:12, color: estado.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop:10 }}>{estado}</div>}
      </div>
    </div>
  )
}
// ── Datos que salen en la cuenta de cobro: empresa y medios de pago ─────────
const iS = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const CAMPOS_EMPRESA = [
  ['nombre','Nombre'], ['lema','Lema'], ['responsable','Responsable'], ['documento','NIT o cédula'],
  ['ciudad','Ciudad'], ['whatsapp','WhatsApp'], ['correo','Correo'],
]
const TIPOS_SUGERIDOS = ['Bancolombia · Ahorros','Bancolombia · Corriente','Nequi','Daviplata','Llave Bre-B','DollarApp','Zelle','Davivienda · Ahorros','Efectivo']

function DatosCobro() {
  const { empresa, medios, cargado } = useDatosLRM()
  const [e, setE] = useState(null)
  const [m, setM] = useState(null)
  const [estado, setEstado] = useState('')
  useEffect(() => { if (cargado) { setE(empresa); setM(medios) } }, [cargado])
  if (!e || !m) return <div className="panel" style={{ color:'var(--text3)' }}>Cargando datos…</div>

  const setMedio = (i, k) => ev => setM(prev => prev.map((x, j) => j === i ? { ...x, [k]: ev.target.value } : x))
  const guardar = async () => {
    setEstado('Guardando…')
    const { error } = await guardarDatosLRM(e, m.filter(x => x.tipo.trim() || x.detalle.trim()))
    setEstado(error ? 'Error: ' + error.message : '✓ Guardado. Ya sale así en las cuentas de cobro.')
  }

  return (
    <div className="panel">
      <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)', marginBottom:4 }}>Datos de la cuenta de cobro</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Lo que ve el cliente en cada cuenta de cobro: tu empresa y dónde te paga.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:10 }}>
        {CAMPOS_EMPRESA.map(([k, l]) => (
          <div key={k}><div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div><input value={e[k] || ''} onChange={ev => setE(p => ({ ...p, [k]: ev.target.value }))} style={iS} /></div>
        ))}
      </div>
      <div style={{ marginTop:10 }}><div style={{ fontSize:11, color:'var(--text3)' }}>Condiciones de pago</div>
        <textarea value={e.condiciones || ''} onChange={ev => setE(p => ({ ...p, condiciones: ev.target.value }))} style={{ ...iS, minHeight:54, resize:'vertical' }} /></div>

      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', margin:'18px 0 4px' }}>Medios de pago</div>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Los que dejes sin número o llave no salen en la cuenta de cobro.</div>
      <datalist id="tipos-pago">{TIPOS_SUGERIDOS.map(t => <option key={t} value={t} />)}</datalist>
      {m.map((x, i) => (
        <div key={i} className="medio-fila" style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8, alignItems:'flex-end', paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          <div style={{ flex:'1 1 140px', minWidth:0 }}><div style={{ fontSize:10, color:'var(--text4)' }}>Medio</div><input list="tipos-pago" value={x.tipo} onChange={setMedio(i, 'tipo')} placeholder="Nequi" style={iS} /></div>
          <div style={{ flex:'1.2 1 160px', minWidth:0 }}><div style={{ fontSize:10, color:'var(--text4)' }}>Número / llave / usuario</div><input value={x.detalle} onChange={setMedio(i, 'detalle')} placeholder="300 000 0000" style={iS} /></div>
          <div style={{ flex:'1.4 1 160px', minWidth:0 }}><div style={{ fontSize:10, color:'var(--text4)' }}>Titular (opcional)</div><input value={x.titular || ''} onChange={setMedio(i, 'titular')} style={iS} /></div>
          <button onClick={() => setM(prev => prev.filter((_, j) => j !== i))} className="btn" style={{ height:36 }}>✕</button>
        </div>
      ))}
      <button onClick={() => setM(prev => [...prev, { tipo:'', detalle:'', titular:'' }])} className="btn" style={{ fontSize:11, marginTop:4 }}>+ Medio de pago</button>
      <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:14 }}>
        <button onClick={guardar} className="btn-gold" style={{ padding:'9px 18px' }}>Guardar datos</button>
        {estado && <span style={{ fontSize:12, color: estado.startsWith('Error') ? 'var(--red)' : 'var(--green)' }}>{estado}</span>}
      </div>
    </div>
  )
}