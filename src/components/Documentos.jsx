// @ts-nocheck
// LRM Trade Consulting · Documentos y fotos de una carga, consolidado o servicio
// Los archivos van al depósito privado "lrm-docs" de Supabase Storage y se abren con links temporales.
// Tabla: lrm_documentos (SQL 21)
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'lrm-docs'
export const TIPOS_DOC = {
  factura:      { l:'Factura comercial', icono:'🧾' },
  packing:      { l:'Lista de empaque',  icono:'📋' },
  bl:           { l:'BL / guía master',  icono:'🚢' },
  dim:          { l:'DIM / declaración', icono:'🏛️' },
  guia:         { l:'Guía / remesa',     icono:'📄' },
  foto:         { l:'Foto',              icono:'📷' },
  soporte_pago: { l:'Soporte de pago',   icono:'💵' },
  otro:         { l:'Otro',              icono:'📎' },
}
// Por defecto el cliente ve fotos y documentos de su carga; los soportes de pago y "otro" no
const VISIBLE_POR_DEFECTO = ['foto', 'factura', 'packing', 'bl', 'guia', 'dim']
export function adivinarTipo(archivo) {
  const n = String(archivo?.name || '').toLowerCase()
  if (String(archivo?.type || '').startsWith('image/') && !/factura|invoice|soporte|pago|comprobante/.test(n)) return 'foto'
  if (/packing|empaque|pl[-_ ]/.test(n)) return 'packing'
  if (/invoice|factura|proforma|\bci\b/.test(n)) return 'factura'
  if (/\bbl\b|bill of lading|b\/l|awb|master/.test(n)) return 'bl'
  if (/\bdim\b|declaraci/.test(n)) return 'dim'
  if (/soporte|pago|comprobante|transferencia|consignaci/.test(n)) return 'soporte_pago'
  if (/gu[ií]a|remesa/.test(n)) return 'guia'
  return 'otro'
}
const peso = b => !b ? '' : b > 1048576 ? `${(b / 1048576).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`
const limpio = n => String(n || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80)
const fechaCorta = iso => iso ? new Date(iso).toLocaleDateString('es-CO', { day:'numeric', month:'short' }) : ''

// entidad: 'carga' | 'consolidado' | 'servicio' · clientes: si se pasa, cada archivo puede quedar de un cliente
export default function Documentos({ entidad, entidadId, clienteId = null, clientes = null, titulo = 'Documentos y fotos', compacto = false }) {
  const [docs, setDocs] = useState([])
  const [urls, setUrls] = useState({})
  const [falta, setFalta] = useState(false)
  const [subiendo, setSubiendo] = useState('')
  const [error, setError] = useState('')
  const [paraCliente, setParaCliente] = useState(clienteId || '')
  const [borrando, setBorrando] = useState(null)
  const archivoRef = useRef(null), camaraRef = useRef(null)

  const cargar = async () => {
    if (!entidadId) return
    const { data, error } = await supabase.from('lrm_documentos').select('*').eq('entidad', entidad).eq('entidad_id', String(entidadId)).order('created_at', { ascending:false })
    if (error) { setFalta(true); return }
    setDocs(data || [])
    const rutas = (data || []).map(d => d.ruta)
    if (rutas.length) {
      const { data: firmadas } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, 3600)
      setUrls(Object.fromEntries((firmadas || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])))
    }
  }
  useEffect(() => { cargar() }, [entidad, entidadId])

  const subir = async (lista) => {
    const archivos = [...(lista || [])]
    if (!archivos.length) return
    setError('')
    for (const [i, a] of archivos.entries()) {
      if (a.size > 20 * 1048576) { setError(`${a.name} pesa más de 20 MB.`); continue }
      setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`)
      const ruta = `${entidad}/${entidadId}/${Date.now()}-${limpio(a.name)}`
      const up = await supabase.storage.from(BUCKET).upload(ruta, a, { contentType: a.type || undefined, upsert:false })
      if (up.error) { setError(/bucket|not found/i.test(up.error.message) ? 'Falta crear el depósito: corre en Supabase el archivo 21_lrm_documentos.sql.' : 'No se pudo subir ' + a.name + ': ' + up.error.message); continue }
      const tipo = adivinarTipo(a)
      const r = await supabase.from('lrm_documentos').insert({ entidad, entidad_id: String(entidadId), cliente_id: paraCliente || clienteId || null, tipo, nombre: a.name, ruta, mime: a.type || null, tamano: a.size, visible_cliente: VISIBLE_POR_DEFECTO.includes(tipo) })
      if (r.error) { await supabase.storage.from(BUCKET).remove([ruta]); setError('No se pudo guardar la ficha de ' + a.name + ': ' + r.error.message) }
    }
    setSubiendo(''); cargar()
  }
  const actualizar = async (d, cambio) => { setDocs(p => p.map(x => x.id === d.id ? { ...x, ...cambio } : x)); await supabase.from('lrm_documentos').update(cambio).eq('id', d.id) }
  const borrar = async d => {
    if (borrando !== d.id) return setBorrando(d.id)
    await supabase.storage.from(BUCKET).remove([d.ruta])
    await supabase.from('lrm_documentos').delete().eq('id', d.id)
    setBorrando(null); cargar()
  }

  if (!entidadId) return null
  if (falta) return <div style={{ fontSize:12, color:'var(--gold)' }}>Para subir documentos y fotos corre en Supabase el archivo <b>21_lrm_documentos.sql</b>.</div>
  const nombreCli = id => clientes?.find(c => c.id === id)?.nombre
  return (
    <div className="docs" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); subir(e.dataTransfer.files) }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        <div style={{ fontSize:compacto ? 12 : 11, letterSpacing: compacto ? 0 : 2, fontWeight:700, color: compacto ? 'var(--text)' : 'var(--text3)' }}>{compacto ? `📎 ${titulo}` : titulo.toUpperCase()} ({docs.length})</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          {clientes && (
            <select value={paraCliente} onChange={e => setParaCliente(e.target.value)} title="De quién es lo que vas a subir" style={{ padding:'5px 8px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:11.5, fontFamily:'inherit' }}>
              <option value="">Para todo el envío</option>
              {clientes.map(c => <option key={c.id} value={c.id}>De {c.nombre}</option>)}
            </select>
          )}
          <input ref={archivoRef} className="doc-archivo" type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx" onChange={e => { subir(e.target.files); e.target.value = '' }} style={{ display:'none' }} />
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" onChange={e => { subir(e.target.files); e.target.value = '' }} style={{ display:'none' }} />
          <button type="button" onClick={() => camaraRef.current?.click()} className="btn" style={{ width:'auto', fontSize:11.5, padding:'4px 10px' }}>📷 Foto</button>
          <button type="button" className="btn-gold doc-subir" onClick={() => archivoRef.current?.click()} style={{ width:'auto', fontSize:11.5, padding:'4px 10px' }}>📎 Subir archivos</button>
        </div>
      </div>
      {subiendo && <div style={{ fontSize:12, color:'var(--gold)', marginBottom:6 }}>{subiendo}</div>}
      {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:6 }}>{error}</div>}
      {docs.length === 0 ? (
        <div onClick={() => archivoRef.current?.click()} style={{ cursor:'pointer', fontSize:12, color:'var(--text4)', padding:'14px', textAlign:'center', border:'1px dashed var(--border2)', borderRadius:10 }}>
          Arrastra aquí la factura, la lista de empaque, el BL, la DIM o las fotos, o toca para subirlos.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap:8 }}>
          {docs.map(d => {
            const t = TIPOS_DOC[d.tipo] || TIPOS_DOC.otro, url = urls[d.ruta], img = String(d.mime || '').startsWith('image/')
            return (
              <div key={d.id} className="doc-item" style={{ borderRadius:10, background:'var(--bg4)', overflow:'hidden', border:`1px solid ${d.visible_cliente ? 'rgba(76,175,80,0.35)' : 'var(--border)'}` }}>
                <a href={url || undefined} target="_blank" rel="noreferrer" style={{ display:'block', height:86, background:'rgba(255,255,255,0.03)', textDecoration:'none' }}>
                  {img && url ? <img src={url} alt={d.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{t.icono}</div>}
                </a>
                <div style={{ padding:'6px 7px' }}>
                  <select value={d.tipo} onChange={e => actualizar(d, { tipo: e.target.value })} style={{ width:'100%', background:'transparent', border:'none', color:'var(--text)', fontSize:11.5, fontWeight:700, fontFamily:'inherit', padding:0 }}>
                    {Object.entries(TIPOS_DOC).map(([k, v]) => <option key={k} value={k}>{v.icono} {v.l}</option>)}
                  </select>
                  <div title={d.nombre} style={{ fontSize:10.5, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text4)' }}>{fechaCorta(d.created_at)} · {peso(d.tamano)}{d.cliente_id && nombreCli(d.cliente_id) ? ` · ${nombreCli(d.cliente_id)}` : ''}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                    <button onClick={() => actualizar(d, { visible_cliente: !d.visible_cliente })} className="doc-visible" title={d.visible_cliente ? 'El cliente lo ve en su portal' : 'Solo tú lo ves'} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10.5, color: d.visible_cliente ? 'var(--green)' : 'var(--text4)', fontFamily:'inherit', padding:0 }}>{d.visible_cliente ? '👁 Lo ve el cliente' : '🔒 Solo tú'}</button>
                    <button onClick={() => borrar(d)} onBlur={() => setBorrando(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10.5, color: borrando === d.id ? 'var(--red)' : 'var(--text4)', fontFamily:'inherit', padding:0 }}>{borrando === d.id ? '¿Borrar?' : '✕'}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}