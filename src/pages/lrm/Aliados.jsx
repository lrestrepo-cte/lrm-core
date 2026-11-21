// @ts-nocheck
// LRM Trade Consulting · Aliados y fletes
// · Aliados: comercializadoras y agentes en China y Panamá, compradores, zona franca, aduanas, transporte…
// · Tarifas de contenedores por aliado (lo que te cobran + tu margen)
// · Cotizar: el cliente ve solo el precio final; tú ves costo y ganancia
// · Transporte terrestre: tarifas por ruta y vehículo + cotizador con extras
// Tablas: lrm_aliados, lrm_tarifas_flete (SQL 11), lrm_tarifas_terrestre (SQL 14)
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDivisas } from '../../lib/divisas'
import { linkWhatsApp, hoyISO, fechaCorta } from './LRMClientes'
import { useDatosLRM } from './datosLRM'

export const TIPOS_ALIADO = [
  { id:'agente_carga',     label:'Agente de carga / naviera', icono:'🚢' },
  { id:'comercializadora', label:'Comercializadora / legalización', icono:'📑' },
  { id:'compras_china',    label:'Compras en China',          icono:'🛒' },
  { id:'zona_franca',      label:'Bodega en zona franca',     icono:'🏭' },
  { id:'aduanas',          label:'Agencia de aduanas',        icono:'🛃' },
  { id:'transporte',       label:'Transporte terrestre',      icono:'🚛' },
  { id:'bodega',           label:'Bodega / warehouse',        icono:'📦' },
  { id:'otro',             label:'Otro',                      icono:'🤝' },
]
const tipoDe = id => TIPOS_ALIADO.find(t => t.id === id) || TIPOS_ALIADO[TIPOS_ALIADO.length - 1]
export const CONTENEDORES = {
  '20GP': { label:"20' estándar",   m3:33, util:28, kg:28000 },
  '40GP': { label:"40' estándar",   m3:67, util:58, kg:26700 },
  '40HC': { label:"40' High Cube",  m3:76, util:68, kg:26500 },
  'LCL':  { label:'Carga suelta (por m³)', m3:null },
}
const ORIGENES = ['Shanghái','Ningbo','Shenzhen','Guangzhou','Qingdao','Xiamen','Hong Kong','Colón (Panamá)','Miami','Houston']
const DESTINOS = ['Barranquilla','Cartagena','Santa Marta','Buenaventura']

const usd = n => 'US$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
const cop = n => '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO')
const n2 = v => { let t = String(v ?? '').trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t) || 0 }
const fmt = (v, d = 1) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>
const Vacio = ({ children }) => <div style={{ fontSize:12, color:'var(--text4)', padding:'24px 0', textAlign:'center' }}>{children}</div>
const vencida = t => t.vigente_hasta && t.vigente_hasta < hoyISO()
const precio = t => n2(t.costo_usd) + n2(t.margen_usd)

function Modal({ titulo, children, onCerrar, ancho = 560 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:22, width:'100%', maxWidth:ancho, border:'1px solid var(--border)', maxHeight:'94vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{titulo}</div>
          <button onClick={onCerrar} className="btn" style={{ width:'auto', padding:'4px 10px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Aliados() {
  const [tab, setTab] = useState('cotizar')
  const [aliados, setAliados] = useState([])
  const [tarifas, setTarifas] = useState([])
  const [clientes, setClientes] = useState([])
  const [terrestre, setTerrestre] = useState([])
  const [faltaTerrestre, setFaltaTerrestre] = useState(false)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const cargar = async () => {
    const [a, t, c, tt] = await Promise.all([
      supabase.from('lrm_aliados').select('*').order('nombre'),
      supabase.from('lrm_tarifas_flete').select('*').order('created_at', { ascending:false }),
      supabase.from('lrm_clientes').select('id,nombre,telefono').order('nombre'),
      supabase.from('lrm_tarifas_terrestre').select('*').order('created_at', { ascending:false }),
    ])
    if (a.error || t.error) { setFaltaTabla(true); return }
    setAliados(a.data || []); setTarifas(t.data || []); setClientes(c.data || [])
    setFaltaTerrestre(!!tt.error); setTerrestre(tt.data || [])
  }
  useEffect(() => { cargar() }, [])

  if (faltaTabla) return (
    <div className="panel" style={{ border:'1px solid var(--gold-border)', color:'var(--gold)', fontSize:13 }}>
      Para usar Aliados y fletes corre en Supabase el archivo <b>11_lrm_aliados_fletes.sql</b>.
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'inline-flex', gap:4, padding:4, borderRadius:12, background:'var(--bg3)', border:'1px solid var(--border)', alignSelf:'flex-start', flexWrap:'wrap' }}>
        {[['cotizar','Cotizar contenedor'],['tarifas',`Fletes (${tarifas.length})`],['terrestre',`Transporte terrestre (${terrestre.length})`],['aliados',`Aliados (${aliados.length})`]].map(([id, l]) => (
          <button key={id} id={`al-tab-${id}`} onClick={() => setTab(id)} className={tab === id ? 'btn-gold' : 'btn'} style={{ border:'none', fontSize:13, width:'auto', flex:'none' }}>{l}</button>
        ))}
      </div>
      {tab === 'cotizar' && <Cotizar aliados={aliados} tarifas={tarifas} clientes={clientes} irA={setTab} />}
      {tab === 'tarifas' && <Tarifas aliados={aliados} tarifas={tarifas} onCambio={cargar} irA={setTab} />}
      {tab === 'aliados' && <Directorio aliados={aliados} tarifas={tarifas} onCambio={cargar} />}
      {tab === 'terrestre' && (faltaTerrestre
        ? <div className="panel" style={{ border:'1px solid var(--gold-border)', color:'var(--gold)', fontSize:13 }}>Para usar Transporte terrestre corre en Supabase el archivo <b>14_lrm_transporte_terrestre.sql</b>.</div>
        : <Terrestre aliados={aliados} tarifas={terrestre} clientes={clientes} onCambio={cargar} irA={setTab} />)}
    </div>
  )
}

// ── Directorio de aliados ──────────────────────────────────────────────────
const ALIADO_VACIO = { nombre:'', tipo:'agente_carga', pais:'China', ciudad:'', contacto:'', telefono:'', correo:'', wechat:'', servicios:'', condiciones:'', calificacion:0, activo:true }
function Directorio({ aliados, tarifas, onCambio }) {
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [buscar, setBuscar] = useState('')
  const lista = aliados.filter(a => (!filtro || a.tipo === filtro) && (!buscar.trim() || `${a.nombre} ${a.ciudad} ${a.pais} ${a.servicios} ${a.contacto}`.toLowerCase().includes(buscar.trim().toLowerCase())))
  return (
    <div className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:12 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar aliado…" style={{ ...iStyle, marginTop:0, width:200 }} />
          <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ ...iStyle, marginTop:0, width:'auto' }}>
            <option value="">Todos los tipos</option>{TIPOS_ALIADO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <button id="al-nuevo" onClick={() => setEditando({ ...ALIADO_VACIO })} className="btn-gold" style={{ width:'auto' }}>+ Nuevo aliado</button>
      </div>
      {lista.length === 0 ? <Vacio>{aliados.length ? 'Ningún aliado con ese filtro.' : 'Agrega tus aliados: navieras y agentes en China y Panamá, compradores, zona franca, aduanas, transporte.'}</Vacio> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap:10 }}>
          {lista.map(a => {
            const t = tipoDe(a.tipo), nT = tarifas.filter(x => x.aliado_id === a.id).length
            const wa = a.telefono ? linkWhatsApp(a.telefono, a.contacto || a.nombre) : null
            return (
              <div key={a.id} style={{ padding:14, borderRadius:12, background:'var(--bg4)', border:'1px solid var(--border)', opacity: a.activo ? 1 : 0.5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:11, color:'var(--gold)' }}>{t.icono} {t.label}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{a.nombre}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{[a.ciudad, a.pais].filter(Boolean).join(', ')}{a.contacto ? ` · ${a.contacto}` : ''}</div>
                  </div>
                  {a.calificacion > 0 && <div style={{ fontSize:12, color:'var(--gold)', whiteSpace:'nowrap' }}>{'★'.repeat(a.calificacion)}</div>}
                </div>
                {a.servicios && <div style={{ fontSize:12, color:'var(--text2)', marginTop:8 }}>{a.servicios}</div>}
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{[a.telefono, a.correo, a.wechat && `WeChat: ${a.wechat}`].filter(Boolean).join(' · ')}</div>
                <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ fontSize:11, padding:'4px 9px', textDecoration:'none', color:'#25D366' }}>WhatsApp</a>}
                  <button onClick={() => setEditando(a)} className="btn" style={{ fontSize:11, padding:'4px 9px', width:'auto' }}>Editar</button>
                  {nT > 0 && <span style={{ fontSize:11, color:'var(--text3)', alignSelf:'center' }}>{nT} tarifa{nT === 1 ? '' : 's'}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {editando && <ModalAliado aliado={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio() }} />}
    </div>
  )
}

function ModalAliado({ aliado, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...aliado })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.nombre.trim()) return setError('Escribe el nombre.')
    const { id, created_at, ...datos } = f
    datos.calificacion = Number(datos.calificacion) || 0
    const r = id ? await supabase.from('lrm_aliados').update(datos).eq('id', id) : await supabase.from('lrm_aliados').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => {
    if (!confirmar) return setConfirmar(true)
    await supabase.from('lrm_aliados').delete().eq('id', f.id); onGuardado()
  }
  return (
    <Modal titulo={f.id ? 'Editar aliado' : 'Nuevo aliado'} onCerrar={onCerrar}>
      <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
        <div><Etiqueta>Nombre *</Etiqueta><input id="al-nombre" value={f.nombre} onChange={set('nombre')} style={iStyle} autoFocus /></div>
        <div><Etiqueta>Tipo</Etiqueta><select id="al-tipo" value={f.tipo} onChange={set('tipo')} style={iStyle}>{TIPOS_ALIADO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div><Etiqueta>País</Etiqueta><input value={f.pais || ''} onChange={set('pais')} style={iStyle} /></div>
        <div><Etiqueta>Ciudad</Etiqueta><input value={f.ciudad || ''} onChange={set('ciudad')} style={iStyle} /></div>
        <div><Etiqueta>Contacto</Etiqueta><input value={f.contacto || ''} onChange={set('contacto')} placeholder="Nombre de la persona" style={iStyle} /></div>
        <div><Etiqueta>Teléfono / WhatsApp</Etiqueta><input value={f.telefono || ''} onChange={set('telefono')} placeholder="+86 …" style={iStyle} /></div>
        <div><Etiqueta>Correo</Etiqueta><input value={f.correo || ''} onChange={set('correo')} style={iStyle} /></div>
        <div><Etiqueta>WeChat</Etiqueta><input value={f.wechat || ''} onChange={set('wechat')} style={iStyle} /></div>
      </div>
      <div style={{ marginBottom:10 }}><Etiqueta>Qué servicios presta</Etiqueta><textarea value={f.servicios || ''} onChange={set('servicios')} placeholder="Ej: FCL y LCL desde Shanghái y Ningbo, legalización 100 %, compra de producto" style={{ ...iStyle, minHeight:60 }} /></div>
      <div style={{ marginBottom:10 }}><Etiqueta>Condiciones (pagos, tiempos, mínimos)</Etiqueta><textarea value={f.condiciones || ''} onChange={set('condiciones')} style={{ ...iStyle, minHeight:50 }} /></div>
      <div className="grid-2" style={{ gap:10, marginBottom:14 }}>
        <div><Etiqueta>Calificación</Etiqueta><select value={f.calificacion || 0} onChange={set('calificacion')} style={iStyle}>{[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n ? '★'.repeat(n) : 'Sin calificar'}</option>)}</select></div>
        <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--text2)', marginTop:18 }}><input type="checkbox" checked={f.activo} onChange={e => setF(p => ({ ...p, activo: e.target.checked }))} /> Activo</label>
      </div>
      {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="al-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
        {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro? Borra también sus tarifas' : 'Borrar'}</button>}
      </div>
    </Modal>
  )
}

// ── Tarifas de contenedores ────────────────────────────────────────────────
const TARIFA_VACIA = { aliado_id:'', origen:'Shanghái', destino:'Barranquilla', tipo:'40HC', costo_usd:'', margen_usd:'150', minimo_m3:'1', transito_dias:'', vigente_hasta:'', incluye:'', notas:'' }
function Tarifas({ aliados, tarifas, onCambio, irA }) {
  const [editando, setEditando] = useState(null)
  const [fOrigen, setFOrigen] = useState('')
  const [fTipo, setFTipo] = useState('')
  const nombreAliado = id => aliados.find(a => a.id === id)?.nombre || '—'
  const lista = tarifas.filter(t => (!fOrigen || t.origen === fOrigen) && (!fTipo || t.tipo === fTipo))
    .sort((a, b) => a.origen.localeCompare(b.origen) || a.tipo.localeCompare(b.tipo) || precio(a) - precio(b))
  const origenes = [...new Set(tarifas.map(t => t.origen))]
  if (!aliados.length) return <div className="panel"><Vacio>Primero crea tus aliados. <button onClick={() => irA('aliados')} className="btn" style={{ width:'auto', marginLeft:8 }}>Ir a Aliados</button></Vacio></div>
  return (
    <div className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:12 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <select value={fOrigen} onChange={e => setFOrigen(e.target.value)} style={{ ...iStyle, marginTop:0, width:'auto' }}><option value="">Todos los orígenes</option>{origenes.map(o => <option key={o}>{o}</option>)}</select>
          <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={{ ...iStyle, marginTop:0, width:'auto' }}><option value="">Todos los tipos</option>{Object.entries(CONTENEDORES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select>
        </div>
        <button id="tf-nueva" onClick={() => setEditando({ ...TARIFA_VACIA, aliado_id: aliados[0]?.id })} className="btn-gold" style={{ width:'auto' }}>+ Nueva tarifa</button>
      </div>
      {lista.length === 0 ? <Vacio>Agrega las tarifas que te pasan tus aliados.</Vacio> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:760 }}>
            <thead><tr style={{ color:'var(--text3)', fontSize:11, textAlign:'left' }}>
              {['Ruta','Tipo','Aliado','Te cuesta','Tu margen','Precio al cliente','Tránsito','Vigencia',''].map(h => <th key={h} style={{ fontWeight:500, padding:'6px 8px' }}>{h}</th>)}
            </tr></thead>
            <tbody>{lista.map(t => (
              <tr key={t.id} style={{ borderTop:'1px solid var(--border)', opacity: vencida(t) ? 0.55 : 1 }}>
                <td style={{ padding:'8px', color:'var(--text)' }}>{t.origen} → {t.destino}</td>
                <td style={{ padding:'8px' }}>{t.tipo === 'LCL' ? 'LCL (m³)' : t.tipo}</td>
                <td style={{ padding:'8px', color:'var(--text2)' }}>{nombreAliado(t.aliado_id)}</td>
                <td style={{ padding:'8px', color:'var(--red)' }}>{usd(t.costo_usd)}</td>
                <td style={{ padding:'8px', color:'var(--green)' }}>+{usd(t.margen_usd)}</td>
                <td style={{ padding:'8px', color:'var(--gold)', fontWeight:800 }}>{usd(precio(t))}{t.tipo === 'LCL' ? ' /m³' : ''}</td>
                <td style={{ padding:'8px', color:'var(--text3)' }}>{t.transito_dias ? `${t.transito_dias} días` : '—'}</td>
                <td style={{ padding:'8px', color: vencida(t) ? 'var(--red)' : 'var(--text3)' }}>{t.vigente_hasta ? (vencida(t) ? 'Vencida ' : 'Hasta ') + fechaCorta(t.vigente_hasta) : '—'}</td>
                <td style={{ padding:'8px' }}><button onClick={() => setEditando(t)} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto' }}>Editar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {editando && <ModalTarifa tarifa={editando} aliados={aliados} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio() }} />}
    </div>
  )
}

function ModalTarifa({ tarifa, aliados, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...tarifa })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.aliado_id) return setError('Elige el aliado.')
    if (!f.origen.trim() || !n2(f.costo_usd)) return setError('Pon el origen y lo que te cuesta.')
    const { id, created_at, ...d } = f
    const datos = { ...d, costo_usd: n2(d.costo_usd), margen_usd: n2(d.margen_usd), minimo_m3: n2(d.minimo_m3) || 1, transito_dias: n2(d.transito_dias) || null, vigente_hasta: d.vigente_hasta || null }
    const r = id ? await supabase.from('lrm_tarifas_flete').update(datos).eq('id', id) : await supabase.from('lrm_tarifas_flete').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_tarifas_flete').delete().eq('id', f.id); onGuardado() }
  const lcl = f.tipo === 'LCL'
  return (
    <Modal titulo={f.id ? 'Editar tarifa' : 'Nueva tarifa de flete'} onCerrar={onCerrar}>
      <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
        <div><Etiqueta>Aliado</Etiqueta><select id="tf-aliado" value={f.aliado_id} onChange={set('aliado_id')} style={iStyle}>{aliados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        <div><Etiqueta>Tipo</Etiqueta><select id="tf-tipo" value={f.tipo} onChange={set('tipo')} style={iStyle}>{Object.entries(CONTENEDORES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select></div>
        <div><Etiqueta>Origen</Etiqueta><input id="tf-origen" list="lrm-origenes" value={f.origen} onChange={set('origen')} style={iStyle} /><datalist id="lrm-origenes">{ORIGENES.map(o => <option key={o} value={o} />)}</datalist></div>
        <div><Etiqueta>Destino</Etiqueta><input list="lrm-destinos" value={f.destino} onChange={set('destino')} style={iStyle} /><datalist id="lrm-destinos">{DESTINOS.map(o => <option key={o} value={o} />)}</datalist></div>
        <div><Etiqueta>Te cuesta (US${lcl ? ' por m³' : ' por contenedor'})</Etiqueta><input id="tf-costo" inputMode="decimal" value={f.costo_usd} onChange={set('costo_usd')} style={iStyle} /></div>
        <div><Etiqueta>Tu margen (US${lcl ? ' por m³' : ''})</Etiqueta><input id="tf-margen" inputMode="decimal" value={f.margen_usd} onChange={set('margen_usd')} style={iStyle} /></div>
        {lcl && <div><Etiqueta>Mínimo (m³)</Etiqueta><input inputMode="decimal" value={f.minimo_m3} onChange={set('minimo_m3')} style={iStyle} /></div>}
        <div><Etiqueta>Tránsito (días)</Etiqueta><input inputMode="numeric" value={f.transito_dias || ''} onChange={set('transito_dias')} style={iStyle} /></div>
        <div><Etiqueta>Vigente hasta</Etiqueta><input type="date" value={f.vigente_hasta || ''} onChange={set('vigente_hasta')} style={iStyle} /></div>
      </div>
      <div style={{ marginBottom:10 }}><Etiqueta>Qué incluye (lo ve el cliente)</Etiqueta><input value={f.incluye || ''} onChange={set('incluye')} placeholder="Ej: flete marítimo, gastos en origen, BL" style={iStyle} /></div>
      <div style={{ marginBottom:14 }}><Etiqueta>Notas internas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
      <div style={{ fontSize:14, marginBottom:12, color:'var(--text2)' }}>Precio al cliente: <b style={{ color:'var(--gold)' }}>{usd(n2(f.costo_usd) + n2(f.margen_usd))}{lcl ? ' por m³' : ''}</b></div>
      {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="tf-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
        {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro?' : 'Borrar'}</button>}
      </div>
    </Modal>
  )
}

// ── Cotizar contenedor ─────────────────────────────────────────────────────
function Cotizar({ aliados, tarifas, clientes, irA }) {
  const divisas = useDivisas()
  const trmHoy = divisas?.find(d => d.id === 'USD')?.hoy || 0
  const { empresa } = useDatosLRM()
  const origenes = [...new Set(tarifas.map(t => t.origen))]
  const [f, setF] = useState({ origen: origenes[0] || '', destino:'Barranquilla', tipo:'40HC', cantidad:'1', m3:'', cliente_id:'', trm:'' })
  const [elegida, setElegida] = useState(null)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (!f.origen && origenes[0]) setF(p => ({ ...p, origen: origenes[0] })) }, [origenes.join()])
  const set = k => e => { setElegida(null); setF(p => ({ ...p, [k]: e.target.value })) }
  const trm = n2(f.trm) || trmHoy
  const lcl = f.tipo === 'LCL'
  const unidades = lcl ? n2(f.m3) : (n2(f.cantidad) || 1)
  const opciones = tarifas.filter(t => t.origen === f.origen && t.destino === f.destino && t.tipo === f.tipo && !vencida(t))
    .map(t => { const u = lcl ? Math.max(unidades, n2(t.minimo_m3) || 1) : unidades; return { t, u, costo: n2(t.costo_usd) * u, venta: precio(t) * u } })
    .sort((a, b) => a.venta - b.venta)
  const op = opciones.find(o => o.t.id === elegida) || opciones[0]
  // Si es carga suelta y ya es mucho volumen, ¿sale mejor un contenedor completo?
  const alternativa = lcl && unidades >= 12 ? ['20GP','40GP','40HC'].map(tipo => {
    const ts = tarifas.filter(t => t.origen === f.origen && t.destino === f.destino && t.tipo === tipo && !vencida(t)).sort((a, b) => precio(a) - precio(b))
    const n = Math.ceil(unidades / CONTENEDORES[tipo].util)
    return ts[0] ? { tipo, n, venta: precio(ts[0]) * n } : null
  }).filter(Boolean).sort((a, b) => a.venta - b.venta)[0] : null
  const cli = clientes.find(c => c.id === f.cliente_id)
  const aliadoDe = id => aliados.find(a => a.id === id)

  const texto = op ? [
    `*${empresa.nombre}* · Cotización de flete`, cli ? `Cliente: ${cli.nombre}` : null, '',
    `Ruta: ${f.origen} → ${f.destino}`,
    lcl ? `Carga suelta: ${fmt(op.u)} m³` : `${unidades} × contenedor ${CONTENEDORES[f.tipo].label}`,
    `Valor: *${usd(op.venta)}*${trm ? ` (aprox. ${cop(op.venta * trm)} a TRM de hoy)` : ''}`,
    op.t.transito_dias ? `Tiempo de tránsito: ${op.t.transito_dias} días aprox.` : null,
    op.t.incluye ? `Incluye: ${op.t.incluye}` : null,
    op.t.vigente_hasta ? `Tarifa válida hasta el ${fechaCorta(op.t.vigente_hasta)}.` : 'Tarifa sujeta a disponibilidad de espacio.',
    '', 'We bring it. Safe and on time.',
  ].filter(x => x !== null).join('\n') : ''
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }
  const wa = cli?.telefono && texto ? linkWhatsApp(cli.telefono, cli.nombre, texto) : null

  if (!tarifas.length) return <div className="panel"><Vacio>Todavía no tienes tarifas cargadas. <button onClick={() => irA(aliados.length ? 'tarifas' : 'aliados')} className="btn" style={{ width:'auto', marginLeft:8 }}>{aliados.length ? 'Cargar tarifas' : 'Crear aliados'}</button></Vacio></div>
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14, alignItems:'start' }}>
      <div className="panel">
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:12 }}>Datos del envío</div>
        <div className="grid-2" style={{ gap:10 }}>
          <div><Etiqueta>Origen</Etiqueta><select id="cz-origen" value={f.origen} onChange={set('origen')} style={iStyle}>{origenes.map(o => <option key={o}>{o}</option>)}</select></div>
          <div><Etiqueta>Destino</Etiqueta><select value={f.destino} onChange={set('destino')} style={iStyle}>{[...new Set([...DESTINOS, ...tarifas.map(t => t.destino)])].map(o => <option key={o}>{o}</option>)}</select></div>
          <div><Etiqueta>Tipo</Etiqueta><select id="cz-tipo" value={f.tipo} onChange={set('tipo')} style={iStyle}>{Object.entries(CONTENEDORES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select></div>
          {lcl ? <div><Etiqueta>Volumen (m³)</Etiqueta><input id="cz-m3" inputMode="decimal" value={f.m3} onChange={set('m3')} placeholder="15" style={iStyle} /></div>
            : <div><Etiqueta>Cantidad de contenedores</Etiqueta><input id="cz-cant" inputMode="numeric" value={f.cantidad} onChange={set('cantidad')} style={iStyle} /></div>}
          <div><Etiqueta>Cliente (opcional)</Etiqueta><select value={f.cliente_id} onChange={set('cliente_id')} style={iStyle}><option value="">—</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><Etiqueta>TRM {trmHoy ? '(hoy)' : ''}</Etiqueta><input inputMode="decimal" value={f.trm} onChange={set('trm')} placeholder={trmHoy ? fmt(trmHoy, 2) : '4000'} style={iStyle} /></div>
        </div>
        {!lcl && <div style={{ fontSize:11, color:'var(--text4)', marginTop:10 }}>Un {CONTENEDORES[f.tipo].label} carga hasta ~{CONTENEDORES[f.tipo].util} m³ útiles y ~{fmt(CONTENEDORES[f.tipo].kg / 1000, 1)} t.</div>}
        {alternativa && alternativa.venta < (op?.venta || Infinity) && (
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:10, padding:'8px 10px', borderRadius:8, background:'rgba(55,138,221,0.1)' }}>
            💡 Con {fmt(unidades)} m³ sale mejor {alternativa.n} × {CONTENEDORES[alternativa.tipo].label}: {usd(alternativa.venta)} contra {usd(op?.venta)} en carga suelta.
          </div>
        )}
      </div>

      <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)', marginBottom:10 }}>OPCIONES ({opciones.length})</div>
        {opciones.length === 0 ? <Vacio>No hay tarifas vigentes para {f.origen} → {f.destino} en {CONTENEDORES[f.tipo].label}.</Vacio> : opciones.map(o => {
          const activo = o === op
          return (
            <div key={o.t.id} onClick={() => setElegida(o.t.id)} className="cz-opcion" style={{ padding:'10px 12px', borderRadius:10, marginBottom:6, cursor:'pointer', background: activo ? 'var(--gold-dim)' : 'var(--bg4)', border:`1px solid ${activo ? 'var(--gold-border)' : 'transparent'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{aliadoDe(o.t.aliado_id)?.nombre || '—'}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{usd(o.venta)}</div>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Te cuesta {usd(o.costo)} · <span style={{ color:'var(--green)' }}>ganas {usd(o.venta - o.costo)}{trm ? ` (${cop((o.venta - o.costo) * trm)})` : ''}</span>
                {o.t.transito_dias ? ` · ${o.t.transito_dias} días` : ''}{lcl && o.u > unidades ? ` · mínimo ${fmt(o.u)} m³` : ''}
              </div>
            </div>
          )
        })}
        {op && (
          <>
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', margin:'14px 0 6px' }}>ASÍ LE LLEGA AL CLIENTE</div>
            <div id="cz-texto" style={{ fontSize:12.5, color:'var(--text2)', whiteSpace:'pre-wrap', lineHeight:1.6, background:'var(--bg4)', borderRadius:10, padding:12 }}>{texto}</div>
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-green" style={{ textDecoration:'none', width:'auto' }}>Enviar por WhatsApp</a>}
              <button onClick={copiar} className="btn" style={{ width:'auto' }}>{copiado ? '✓ Copiado' : 'Copiar mensaje'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
// ── Transporte terrestre ───────────────────────────────────────────────────
export const VEHICULOS = {
  contenedor_20: { label:"Contenedor 20' (cama baja)", cap:'1 contenedor de 20' },
  contenedor_40: { label:"Contenedor 40' / 40' HC",    cap:'1 contenedor de 40' },
  tractomula:    { label:'Tractomula carga suelta',    cap:'hasta ~34 t' },
  doble_troque:  { label:'Doble troque',               cap:'hasta ~17 t' },
  sencillo:      { label:'Camión sencillo',            cap:'hasta ~9 t' },
  turbo:         { label:'Turbo',                      cap:'hasta ~4,5 t' },
  nhr:           { label:'NHR / furgón pequeño',       cap:'hasta ~2 t' },
}
const CIUDADES = ['Santa Marta (puerto)','Cartagena (puerto)','Barranquilla (puerto)','Barranquilla','Cartagena','Santa Marta','Zona Franca Barranquilla','Medellín','Bogotá','Cali','Bucaramanga','Valledupar','Montería','Sincelejo']
const precioT = t => n2(t.costo_cop) + n2(t.margen_cop)
const TERRESTRE_VACIA = { aliado_id:'', origen:'Santa Marta (puerto)', destino:'Barranquilla', vehiculo:'contenedor_40', costo_cop:'', margen_cop:'300000', horas:'', incluye:'', vigente_hasta:'', notas:'' }

function Terrestre({ aliados, tarifas, clientes, onCambio, irA }) {
  const [editando, setEditando] = useState(null)
  const transportistas = aliados.filter(a => a.tipo === 'transporte')
  const lista = aliados.length ? transportistas.length ? transportistas : aliados : []
  const nombreAliado = id => aliados.find(a => a.id === id)?.nombre || '—'
  if (!aliados.length) return <div className="panel"><Vacio>Primero crea tus aliados de transporte. <button onClick={() => irA('aliados')} className="btn" style={{ width:'auto', marginLeft:8 }}>Ir a Aliados</button></Vacio></div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <CotizarTerrestre aliados={aliados} tarifas={tarifas} clientes={clientes} />
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
          <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)' }}>TARIFAS DE TRANSPORTE ({tarifas.length})</div>
          <button id="tt-nueva" onClick={() => setEditando({ ...TERRESTRE_VACIA, aliado_id: lista[0]?.id })} className="btn-gold" style={{ width:'auto' }}>+ Nueva tarifa</button>
        </div>
        {!transportistas.length && <div style={{ fontSize:12, color:'#E8A23A', marginBottom:10 }}>Tip: en Aliados marca a tus transportistas como "Transporte terrestre" para que salgan primero.</div>}
        {tarifas.length === 0 ? <Vacio>Agrega lo que te cobran tus transportistas por ruta y vehículo.</Vacio> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:760 }}>
              <thead><tr style={{ color:'var(--text3)', fontSize:11, textAlign:'left' }}>
                {['Ruta','Vehículo','Transportista','Te cuesta','Tu margen','Precio al cliente','Tiempo','Vigencia',''].map(h => <th key={h} style={{ fontWeight:500, padding:'6px 8px' }}>{h}</th>)}
              </tr></thead>
              <tbody>{[...tarifas].sort((a, b) => a.origen.localeCompare(b.origen) || a.destino.localeCompare(b.destino) || precioT(a) - precioT(b)).map(t => (
                <tr key={t.id} style={{ borderTop:'1px solid var(--border)', opacity: vencida(t) ? 0.55 : 1 }}>
                  <td style={{ padding:'8px', color:'var(--text)' }}>{t.origen} → {t.destino}</td>
                  <td style={{ padding:'8px' }}>{VEHICULOS[t.vehiculo]?.label || t.vehiculo}</td>
                  <td style={{ padding:'8px', color:'var(--text2)' }}>{nombreAliado(t.aliado_id)}</td>
                  <td style={{ padding:'8px', color:'var(--red)' }}>{cop(t.costo_cop)}</td>
                  <td style={{ padding:'8px', color:'var(--green)' }}>+{cop(t.margen_cop)}</td>
                  <td style={{ padding:'8px', color:'var(--gold)', fontWeight:800 }}>{cop(precioT(t))}</td>
                  <td style={{ padding:'8px', color:'var(--text3)' }}>{t.horas ? `${fmt(t.horas)} h` : '—'}</td>
                  <td style={{ padding:'8px', color: vencida(t) ? 'var(--red)' : 'var(--text3)' }}>{t.vigente_hasta ? (vencida(t) ? 'Vencida ' : 'Hasta ') + fechaCorta(t.vigente_hasta) : '—'}</td>
                  <td style={{ padding:'8px' }}><button onClick={() => setEditando(t)} className="btn" style={{ fontSize:11, padding:'3px 9px', width:'auto' }}>Editar</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {editando && <ModalTerrestre tarifa={editando} aliados={lista} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio() }} />}
    </div>
  )
}

function ModalTerrestre({ tarifa, aliados, onCerrar, onGuardado }) {
  const [f, setF] = useState({ ...tarifa, costo_cop: String(tarifa.costo_cop ?? ''), margen_cop: String(tarifa.margen_cop ?? ''), horas: String(tarifa.horas ?? '') })
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const guardar = async () => {
    if (!f.aliado_id) return setError('Elige el transportista.')
    if (!f.origen.trim() || !f.destino.trim() || !n2(f.costo_cop)) return setError('Pon la ruta y lo que te cuesta.')
    const { id, created_at, ...d } = f
    const datos = { ...d, costo_cop: n2(d.costo_cop), margen_cop: n2(d.margen_cop), horas: n2(d.horas) || null, vigente_hasta: d.vigente_hasta || null }
    const r = id ? await supabase.from('lrm_tarifas_terrestre').update(datos).eq('id', id) : await supabase.from('lrm_tarifas_terrestre').insert(datos)
    if (r.error) return setError('No se pudo guardar: ' + r.error.message)
    onGuardado()
  }
  const borrar = async () => { if (!confirmar) return setConfirmar(true); await supabase.from('lrm_tarifas_terrestre').delete().eq('id', f.id); onGuardado() }
  return (
    <Modal titulo={f.id ? 'Editar tarifa de transporte' : 'Nueva tarifa de transporte'} onCerrar={onCerrar}>
      <datalist id="tt-ciudades">{CIUDADES.map(c => <option key={c} value={c} />)}</datalist>
      <div className="grid-2" style={{ gap:10, marginBottom:10 }}>
        <div><Etiqueta>Transportista</Etiqueta><select id="tt-aliado" value={f.aliado_id} onChange={set('aliado_id')} style={iStyle}>{aliados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        <div><Etiqueta>Vehículo</Etiqueta><select id="tt-vehiculo" value={f.vehiculo} onChange={set('vehiculo')} style={iStyle}>{Object.entries(VEHICULOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        <div><Etiqueta>Origen</Etiqueta><input id="tt-origen" list="tt-ciudades" value={f.origen} onChange={set('origen')} style={iStyle} /></div>
        <div><Etiqueta>Destino</Etiqueta><input id="tt-destino" list="tt-ciudades" value={f.destino} onChange={set('destino')} style={iStyle} /></div>
        <div><Etiqueta>Te cuesta por viaje ($)</Etiqueta><input id="tt-costo" inputMode="numeric" value={f.costo_cop} onChange={set('costo_cop')} style={iStyle} /></div>
        <div><Etiqueta>Tu margen ($)</Etiqueta><input id="tt-margen" inputMode="numeric" value={f.margen_cop} onChange={set('margen_cop')} style={iStyle} /></div>
        <div><Etiqueta>Tiempo de viaje (horas)</Etiqueta><input inputMode="decimal" value={f.horas} onChange={set('horas')} style={iStyle} /></div>
        <div><Etiqueta>Vigente hasta</Etiqueta><input type="date" value={f.vigente_hasta || ''} onChange={set('vigente_hasta')} style={iStyle} /></div>
      </div>
      <div style={{ marginBottom:10 }}><Etiqueta>Qué incluye (lo ve el cliente)</Etiqueta><input value={f.incluye || ''} onChange={set('incluye')} placeholder="Ej: retiro en puerto, entrega en bodega, póliza de carga" style={iStyle} /></div>
      <div style={{ marginBottom:14 }}><Etiqueta>Notas internas</Etiqueta><input value={f.notas || ''} onChange={set('notas')} style={iStyle} /></div>
      <div style={{ fontSize:14, marginBottom:12, color:'var(--text2)' }}>Precio al cliente por viaje: <b style={{ color:'var(--gold)' }}>{cop(n2(f.costo_cop) + n2(f.margen_cop))}</b></div>
      {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button id="tt-guardar" onClick={guardar} className="btn-green" style={{ flex:1 }}>Guardar</button>
        {f.id && <button onClick={borrar} onBlur={() => setConfirmar(false)} className="btn" style={{ width:'auto', color:'var(--red)' }}>{confirmar ? '¿Seguro?' : 'Borrar'}</button>}
      </div>
    </Modal>
  )
}

// Extras típicos del transporte: lo que te cuesta y lo que cobras
const EXTRAS_BASE = [
  { id:'escolta',  label:'Escolta',               costo:'', precio:'' },
  { id:'cargue',   label:'Cargue / descargue',    costo:'', precio:'' },
  { id:'espera',   label:'Días de espera (standby)', costo:'', precio:'', porDia:true },
]
function CotizarTerrestre({ aliados, tarifas, clientes }) {
  const { empresa } = useDatosLRM()
  const rutas = [...new Set(tarifas.map(t => `${t.origen}|${t.destino}`))]
  const [f, setF] = useState({ ruta: rutas[0] || '', vehiculo:'', viajes:'1', cliente_id:'', valorMercancia:'', seguroPct:'0.3', dias:'1' })
  const [extras, setExtras] = useState(EXTRAS_BASE.map(e => ({ ...e, usar:false })))
  const [elegida, setElegida] = useState(null)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (!f.ruta && rutas[0]) setF(p => ({ ...p, ruta: rutas[0] })) }, [rutas.join()])
  const set = k => e => { setElegida(null); setF(p => ({ ...p, [k]: e.target.value })) }
  const [origen, destino] = (f.ruta || '|').split('|')
  const vehiculosRuta = [...new Set(tarifas.filter(t => t.origen === origen && t.destino === destino).map(t => t.vehiculo))]
  const vehiculo = vehiculosRuta.includes(f.vehiculo) ? f.vehiculo : vehiculosRuta[0]
  const viajes = Math.max(1, Math.round(n2(f.viajes)))
  const opciones = tarifas.filter(t => t.origen === origen && t.destino === destino && t.vehiculo === vehiculo && !vencida(t))
    .map(t => ({ t, costo: n2(t.costo_cop) * viajes, venta: precioT(t) * viajes })).sort((a, b) => a.venta - b.venta)
  const op = opciones.find(o => o.t.id === elegida) || opciones[0]
  const extrasUsados = extras.filter(e => e.usar).map(e => { const k = e.porDia ? Math.max(1, n2(f.dias)) : 1; return { ...e, k, c: n2(e.costo) * k * viajes, v: n2(e.precio) * k * viajes } })
  const seguro = n2(f.valorMercancia) * n2(f.seguroPct) / 100
  const costoTot = (op?.costo || 0) + extrasUsados.reduce((s, e) => s + e.c, 0)
  const ventaTot = (op?.venta || 0) + extrasUsados.reduce((s, e) => s + e.v, 0) + seguro
  const cli = clientes.find(c => c.id === f.cliente_id)
  const texto = op ? [
    `*${empresa.nombre}* · Cotización de transporte`, cli ? `Cliente: ${cli.nombre}` : null, '',
    `Ruta: ${origen} → ${destino}`,
    `Vehículo: ${VEHICULOS[vehiculo]?.label || vehiculo}${viajes > 1 ? ` × ${viajes} viajes` : ''}`,
    `Transporte: ${cop(op.venta)}`,
    ...extrasUsados.map(e => `${e.label}${e.porDia ? ` (${e.k} día${e.k === 1 ? '' : 's'})` : ''}: ${cop(e.v)}`),
    ...(seguro ? [`Seguro de la mercancía (${fmt(f.seguroPct, 2)}% sobre ${cop(f.valorMercancia)}): ${cop(seguro)}`] : []),
    `*Total: ${cop(ventaTot)}*`,
    op.t.horas ? `Tiempo de viaje aprox.: ${fmt(op.t.horas)} horas` : null,
    op.t.incluye ? `Incluye: ${op.t.incluye}` : null,
    '', 'We bring it. Safe and on time.',
  ].filter(x => x !== null).join('\n') : ''
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }
  const wa = cli?.telefono && texto ? linkWhatsApp(cli.telefono, cli.nombre, texto) : null
  const updExtra = (i, k, v) => setExtras(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e))

  if (!tarifas.length) return <div className="panel"><Vacio>Carga abajo tus primeras tarifas de transporte y aquí cotizas.</Vacio></div>
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap:14, alignItems:'start' }}>
      <div className="panel">
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:12 }}>Cotizar transporte</div>
        <div className="grid-2" style={{ gap:10 }}>
          <div style={{ gridColumn:'1 / -1' }}><Etiqueta>Ruta</Etiqueta><select id="ct-ruta" value={f.ruta} onChange={set('ruta')} style={iStyle}>{rutas.map(r => <option key={r} value={r}>{r.replace('|', ' → ')}</option>)}</select></div>
          <div><Etiqueta>Vehículo</Etiqueta><select id="ct-vehiculo" value={vehiculo || ''} onChange={set('vehiculo')} style={iStyle}>{vehiculosRuta.map(v => <option key={v} value={v}>{VEHICULOS[v]?.label || v}</option>)}</select></div>
          <div><Etiqueta>Viajes / contenedores</Etiqueta><input id="ct-viajes" inputMode="numeric" value={f.viajes} onChange={set('viajes')} style={iStyle} /></div>
          <div><Etiqueta>Cliente (opcional)</Etiqueta><select value={f.cliente_id} onChange={set('cliente_id')} style={iStyle}><option value="">—</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><Etiqueta>Capacidad</Etiqueta><div style={{ fontSize:13, color:'var(--text2)', marginTop:10 }}>{VEHICULOS[vehiculo]?.cap || '—'}</div></div>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', margin:'14px 0 6px' }}>Extras</div>
        {extras.map((e, i) => (
          <div key={e.id} style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) 1fr 1fr', gap:6, alignItems:'center', marginBottom:6 }}>
            <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, color:'var(--text2)', cursor:'pointer' }}><input type="checkbox" className="ct-extra" checked={e.usar} onChange={ev => updExtra(i, 'usar', ev.target.checked)} /> {e.label}</label>
            <input inputMode="numeric" placeholder="Te cuesta" value={e.costo} onChange={ev => updExtra(i, 'costo', ev.target.value)} style={{ ...iStyle, marginTop:0, padding:'6px 8px', fontSize:12 }} />
            <input inputMode="numeric" placeholder="Cobras" value={e.precio} onChange={ev => updExtra(i, 'precio', ev.target.value)} style={{ ...iStyle, marginTop:0, padding:'6px 8px', fontSize:12 }} />
          </div>
        ))}
        {extras.find(e => e.id === 'espera')?.usar && <div style={{ marginBottom:6 }}><Etiqueta>Días de espera</Etiqueta><input inputMode="numeric" value={f.dias} onChange={set('dias')} style={{ ...iStyle, width:100 }} /></div>}
        <div className="grid-2" style={{ gap:10, marginTop:8 }}>
          <div><Etiqueta>Valor de la mercancía (para seguro)</Etiqueta><input inputMode="numeric" value={f.valorMercancia} onChange={set('valorMercancia')} placeholder="Opcional" style={iStyle} /></div>
          <div><Etiqueta>Seguro (%)</Etiqueta><input inputMode="decimal" value={f.seguroPct} onChange={set('seguroPct')} style={iStyle} /></div>
        </div>
      </div>

      <div className="panel" style={{ border:'1px solid var(--gold-border)' }}>
        <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)', marginBottom:10 }}>TRANSPORTISTAS ({opciones.length})</div>
        {opciones.length === 0 ? <Vacio>No hay tarifas vigentes para esa ruta y vehículo.</Vacio> : opciones.map(o => {
          const activo = o === op
          return (
            <div key={o.t.id} onClick={() => setElegida(o.t.id)} className="ct-opcion" style={{ padding:'10px 12px', borderRadius:10, marginBottom:6, cursor:'pointer', background: activo ? 'var(--gold-dim)' : 'var(--bg4)', border:`1px solid ${activo ? 'var(--gold-border)' : 'transparent'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{aliados.find(a => a.id === o.t.aliado_id)?.nombre || '—'}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{cop(o.venta)}</div>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Te cuesta {cop(o.costo)} · <span style={{ color:'var(--green)' }}>ganas {cop(o.venta - o.costo)}</span>{o.t.horas ? ` · ${fmt(o.t.horas)} h` : ''}</div>
            </div>
          )
        })}
        {op && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, margin:'12px 0' }}>
              {[['Total cliente', cop(ventaTot), 'var(--gold)'], ['Te cuesta', cop(costoTot), 'var(--red)'], ['Ganas', cop(ventaTot - costoTot - seguro), 'var(--green)']].map(([l, v, c]) => (
                <div key={l} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg4)' }}>
                  <div style={{ fontSize:10, color:'var(--text4)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
                  <div id={`ct-${l.split(' ')[0].toLowerCase()}`} style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            {seguro > 0 && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>El seguro ({cop(seguro)}) se le cobra al cliente y se paga a la aseguradora: no entra en tu ganancia.</div>}
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', margin:'6px 0' }}>ASÍ LE LLEGA AL CLIENTE</div>
            <div id="ct-texto" style={{ fontSize:12.5, color:'var(--text2)', whiteSpace:'pre-wrap', lineHeight:1.6, background:'var(--bg4)', borderRadius:10, padding:12 }}>{texto}</div>
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-green" style={{ textDecoration:'none', width:'auto' }}>Enviar por WhatsApp</a>}
              <button onClick={copiar} className="btn" style={{ width:'auto' }}>{copiado ? '✓ Copiado' : 'Copiar mensaje'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}