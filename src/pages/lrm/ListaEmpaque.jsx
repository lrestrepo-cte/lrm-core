// @ts-nocheck
// LRM Trade Consulting · Lista de empaque de la carga de un cliente dentro de un consolidado
// Subes el Excel/CSV del proveedor (o pegas la tabla) y quedan guardados los productos.
// Tabla: lrm_consolidado_productos (SQL 16)
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { leerArchivo, leerTexto, totales, descargarExcel, CAMPOS } from './leerListaEmpaque'

const fmt = (v, d = 2) => v == null || v === '' ? '' : Number(v).toLocaleString('es-CO', { maximumFractionDigits: d })
const NUM = ['cantidad', 'bultos', 'peso_kg', 'cbm', 'valor_usd']
const celda = { width:'100%', padding:'5px 6px', borderRadius:6, background:'rgba(255,255,255,0.05)', border:'1px solid transparent', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none' }
const VACIO = { referencia:'', descripcion:'', cantidad:'', unidad:'', bultos:'', peso_kg:'', cbm:'', valor_usd:'', subpartida:'' }
const aNum = v => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : null }
// Lo que viene de la base o del archivo → texto editable
const editable = p => Object.fromEntries(CAMPOS.map(c => [c.id, p[c.id] == null ? '' : String(NUM.includes(c.id) ? Math.round(Number(p[c.id]) * 1000) / 1000 : p[c.id])]))

export default function ModalListaEmpaque({ item, consolidado, cliente, onCerrar, onGuardado }) {
  const [filas, setFilas] = useState([])
  const [listo, setListo] = useState(false)
  const [falta, setFalta] = useState(false)
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [pegar, setPegar] = useState(false)
  const [texto, setTexto] = useState('')
  const [actualizar, setActualizar] = useState(true)
  const [agregar, setAgregar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const archivoRef = useRef(null)

  useEffect(() => {
    supabase.from('lrm_consolidado_productos').select('*').eq('item_id', item.id).order('linea').then(({ data, error }) => {
      if (error) setFalta(true); else setFilas((data || []).map(editable))
      setListo(true)
    })
  }, [item.id])

  const recibir = (r, origen) => {
    if (r.error || !r.productos.length) return setAviso(r.error || 'No encontré productos en ' + origen + '.')
    const nuevos = r.productos.map(editable)
    setFilas(prev => prev.length && agregar ? [...prev, ...nuevos] : nuevos)
    const cols = Object.entries(r.columnas || {}).filter(([k]) => !k.endsWith('_caja') && k !== 'precio' && k !== 'peso_neto').map(([, v]) => `"${v}"`).join(', ')
    setAviso(`✓ Leí ${r.productos.length} producto${r.productos.length === 1 ? '' : 's'}${r.hoja ? ` de la hoja "${r.hoja}"` : ''}. Columnas: ${cols}. Revisa y guarda.`)
    setError('')
  }
  const subir = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setAviso('Leyendo ' + f.name + '…')
    try { recibir(await leerArchivo(f), f.name) } catch (err) { setAviso('No pude leer ese archivo. Prueba guardarlo como .xlsx o copia la tabla y usa "Pegar".') }
  }
  const leerPegado = () => { recibir(leerTexto(texto), 'el texto'); setPegar(false); setTexto('') }
  const upd = (i, k, v) => setFilas(p => p.map((f, j) => j === i ? { ...f, [k]: v } : f))
  const quitar = i => setFilas(p => p.filter((_, j) => j !== i))

  const datos = filas.map(f => ({ ...f, ...Object.fromEntries(NUM.map(k => [k, aNum(f[k])])) }))
  const t = totales(datos)

  const guardar = async () => {
    setGuardando(true); setError('')
    const limpias = datos.filter(f => f.descripcion?.trim() || f.referencia?.trim() || NUM.some(k => f[k] != null))
    const del = await supabase.from('lrm_consolidado_productos').delete().eq('item_id', item.id)
    if (del.error) { setGuardando(false); return setError('No se pudo guardar: ' + del.error.message) }
    if (limpias.length) {
      const ins = await supabase.from('lrm_consolidado_productos').insert(limpias.map((f, i) => ({
        item_id: item.id, consolidado_id: item.consolidado_id, linea: i + 1,
        referencia: f.referencia?.trim() || null, descripcion: f.descripcion?.trim() || null, unidad: f.unidad?.trim() || null,
        subpartida: f.subpartida?.trim() || null, cantidad: f.cantidad, bultos: f.bultos, peso_kg: f.peso_kg, cbm: f.cbm, valor_usd: f.valor_usd,
      })))
      if (ins.error) { setGuardando(false); return setError('No se pudo guardar: ' + ins.error.message) }
    }
    if (actualizar && limpias.length) {
      const cambio = {}
      if (t.bultos) cambio.bultos = Math.round(t.bultos)
      if (t.peso_kg) cambio.peso_kg = Math.round(t.peso_kg * 10) / 10
      if (t.cbm) cambio.cbm = Math.round(t.cbm * 1000) / 1000
      if (!item.descripcion && limpias.length) cambio.descripcion = [...new Set(limpias.map(f => f.descripcion).filter(Boolean))].slice(0, 3).join(', ').slice(0, 120) || null
      if (Object.keys(cambio).length) await supabase.from('lrm_consolidado_items').update(cambio).eq('id', item.id)
    }
    setGuardando(false)
    onGuardado()
  }

  const bajar = () => descargarExcel(`Lista de empaque - ${cliente || 'cliente'} - ${consolidado?.nombre || ''}.xlsx`.replace(/[\\/:*?"<>|]/g, '-'),
    datos.map((f, i) => ({ '#': i + 1, Referencia: f.referencia, 'Descripción': f.descripcion, Cantidad: f.cantidad, Unidad: f.unidad, Bultos: f.bultos, 'Peso kg': f.peso_kg, 'm³': f.cbm, 'Valor US$': f.valor_usd, Subpartida: f.subpartida })))

  const difiere = (a, b) => b != null && Math.abs(Number(a || 0) - Number(b || 0)) > Math.max(0.01, Number(b || 0) * 0.02)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div style={{ background:'var(--bg2)', borderRadius:16, padding:20, width:'100%', maxWidth:1080, maxHeight:'94vh', display:'flex', flexDirection:'column', border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--gold)' }}>LISTA DE EMPAQUE</div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{cliente || 'Sin cliente'}{item.descripcion ? <span style={{ fontWeight:400, color:'var(--text3)', fontSize:13 }}> · {item.descripcion}</span> : null}</div>
          </div>
          <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>✕</button>
        </div>

        {falta ? <div style={{ fontSize:13, color:'var(--gold)', padding:'18px 0' }}>Para guardar listas de empaque corre en Supabase el archivo <b>16_lrm_lista_empaque.sql</b>.</div> : (
          <>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', margin:'12px 0 8px', alignItems:'center' }}>
              <input ref={archivoRef} id="le-archivo" type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" onChange={subir} style={{ display:'none' }} />
              <button id="le-subir" onClick={() => archivoRef.current?.click()} className="btn-gold" style={{ width:'auto' }}>📎 Subir Excel o CSV</button>
              <button id="le-pegar" onClick={() => setPegar(p => !p)} className="btn" style={{ width:'auto' }}>📋 Pegar tabla</button>
              <button onClick={() => setFilas(p => [...p, { ...VACIO }])} className="btn" style={{ width:'auto' }}>+ Producto</button>
              {filas.length > 0 && <button onClick={bajar} className="btn" style={{ width:'auto' }}>⬇ Bajar en Excel</button>}
              {filas.length > 0 && <label style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:5, alignItems:'center', cursor:'pointer' }}>
                <input type="checkbox" checked={agregar} onChange={e => setAgregar(e.target.checked)} /> Lo próximo que suba, sumarlo a lo que ya está
              </label>}
            </div>
            {pegar && (
              <div style={{ marginBottom:8 }}>
                <textarea id="le-texto" value={texto} onChange={e => setTexto(e.target.value)} placeholder={'Copia la tabla desde Excel (con la fila de títulos) y pégala aquí.\nTambién sirve el bloque que te arma Claude:\nReferencia | Descripción | Cantidad | Unidad | Bultos | Peso kg | CBM | Valor USD | Subpartida'}
                  style={{ ...celda, minHeight:110, padding:10, fontSize:12.5, lineHeight:1.5, resize:'vertical', border:'1px solid var(--border)' }} />
                <button id="le-leer" onClick={leerPegado} className="btn-gold" style={{ width:'auto', marginTop:6 }}>Leer</button>
              </div>
            )}
            {aviso && <div id="le-aviso" style={{ fontSize:12, color: aviso.startsWith('✓') ? 'var(--green)' : '#E8A23A', marginBottom:8 }}>{aviso}</div>}

            <div style={{ overflow:'auto', flex:1, minHeight:120, border:'1px solid var(--border)', borderRadius:10 }}>
              {!listo ? <div style={{ padding:20, fontSize:12, color:'var(--text3)' }}>Cargando…</div>
                : filas.length === 0 ? <div style={{ padding:'28px 16px', fontSize:13, color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>Todavía no hay productos.<br />Sube el Excel de la lista de empaque del proveedor, pega la tabla o agrégalos a mano.</div>
                : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:900 }}>
                  <thead style={{ position:'sticky', top:0, background:'var(--bg3)', zIndex:1 }}>
                    <tr>{['#', ...CAMPOS.map(c => c.label), ''].map(h => <th key={h} style={{ textAlign:'left', fontWeight:600, color:'var(--text3)', padding:'7px 6px', fontSize:11 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={i} className="le-fila" style={{ borderTop:'1px solid var(--border)' }}>
                        <td style={{ padding:'3px 6px', color:'var(--text4)' }}>{i + 1}</td>
                        {CAMPOS.map(c => (
                          <td key={c.id} style={{ padding:'3px 3px', width: c.id === 'descripcion' ? '26%' : c.id === 'unidad' ? 60 : undefined }}>
                            <input value={f[c.id]} onChange={e => upd(i, c.id, e.target.value)} inputMode={NUM.includes(c.id) ? 'decimal' : undefined}
                              style={{ ...celda, textAlign: NUM.includes(c.id) ? 'right' : 'left' }} />
                          </td>
                        ))}
                        <td style={{ padding:'3px 6px' }}><button onClick={() => quitar(i)} title="Quitar" className="btn" style={{ padding:'2px 8px', fontSize:11, color:'var(--red)', width:'auto' }}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filas.length > 0 && (
              <div id="le-totales" style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12.5, color:'var(--text2)', marginTop:10 }}>
                <span><b style={{ color:'var(--text)' }}>{t.productos}</b> productos</span>
                <span><b style={{ color:'var(--text)' }}>{fmt(t.cantidad, 0)}</b> unidades</span>
                <span><b style={{ color:'var(--text)' }}>{fmt(t.bultos, 0)}</b> bultos</span>
                <span><b style={{ color:'var(--text)' }}>{fmt(t.peso_kg, 1)}</b> kg</span>
                <span><b style={{ color:'var(--text)' }}>{fmt(t.cbm, 3)}</b> m³</span>
                {t.valor_usd > 0 && <span><b style={{ color:'var(--text)' }}>US${fmt(t.valor_usd, 2)}</b> valor</span>}
              </div>
            )}
            {filas.length > 0 && (difiere(t.bultos, item.bultos) || difiere(t.peso_kg, item.peso_kg) || difiere(t.cbm, item.cbm)) && (
              <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'#E8A23A', marginTop:8, cursor:'pointer' }}>
                <input id="le-actualizar" type="checkbox" checked={actualizar} onChange={e => setActualizar(e.target.checked)} />
                La carga tiene {fmt(item.bultos, 0) || 0} bultos · {fmt(item.peso_kg, 1) || 0} kg · {fmt(item.cbm, 3) || 0} m³. Actualizarla con los totales de la lista.
              </label>
            )}
            {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:8 }}>{error}</div>}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button id="le-guardar" onClick={guardar} disabled={guardando || !listo} className="btn-green" style={{ flex:1 }}>{guardando ? 'Guardando…' : 'Guardar lista'}</button>
              <button onClick={onCerrar} className="btn" style={{ width:'auto' }}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}