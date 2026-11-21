// @ts-nocheck
// LRM Trade Consulting · Cotización de la carga de un cliente en un consolidado
// Junta lo que trae (lista de empaque), cuánto pesa y mide, el valor de la mercancía,
// la ruta con ETD / ETA y el valor del servicio. Sale en PDF y en texto para WhatsApp.
// No muestra tu costo ni tu margen.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useDatosLRM, logoDocumentoHTML } from './datosLRM'
import { linkWhatsApp } from './LRMClientes'

const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
const fmt = (v, d = 2) => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: d })
const cop = n => '$' + Math.round(n || 0).toLocaleString('es-CO')
const usd = n => 'US$' + Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fechaLarga = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' }) : ''
const dias = (a, b) => a && b ? Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000) : null
const iStyle = { width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', marginTop:4 }
const Etiqueta = ({ children }) => <div style={{ fontSize:11, color:'var(--text3)' }}>{children}</div>

// cliente: { id, nombre, tel, its } · valorItem(i) → pesos · tarifaDe(i) → { v, m } por m³
export default function CotizacionConsolidado({ cons, cliente, valorItem, tarifaDe, trm, onCerrar }) {
  const { empresa } = useDatosLRM()
  const [productos, setProductos] = useState([])
  const [etd, setEtd] = useState(cons.etd || '')
  const [eta, setEta] = useState(cons.eta || '')
  const [vigencia, setVigencia] = useState('15')
  const [conDetalle, setConDetalle] = useState(true)
  const [conValor, setConValor] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [notas, setNotas] = useState([
    `Servicio integral puerta a puerta: recogida en bodega de ${cons.origen}, flete marítimo consolidado, legalización y nacionalización en Colombia (aranceles, IVA y agenciamiento aduanero) y entrega en ${cons.destino}.`,
    'Aplica para mercancía general que no requiere permisos especiales. Productos que necesiten registro INVIMA, ICA, licencias, vistos buenos o autorización de marca se cotizan aparte.',
    'La mercancía debe venir con su lista de empaque y factura comercial, con descripción y valor reales.',
    'El valor final se liquida con las medidas y el peso reales que reporte la bodega de origen.',
    'Las fechas de salida y llegada son estimadas y dependen de la naviera y del puerto.',
    empresa.condiciones,
  ].filter(Boolean).join('\n'))
  useEffect(() => {
    const ids = cliente.its.map(i => i.id)
    if (!ids.length) return
    supabase.from('lrm_consolidado_productos').select('*').in('item_id', ids).order('linea').then(({ data }) => setProductos(data || []))
  }, [cliente.id])

  const its = cliente.its
  const tot = {
    bultos: its.reduce((s, i) => s + Number(i.bultos || 0), 0),
    kg: its.reduce((s, i) => s + Number(i.peso_kg || 0), 0),
    m3: its.reduce((s, i) => s + Number(i.cbm || 0), 0),
    valorMerc: productos.reduce((s, p) => s + Number(p.valor_usd || 0), 0),
    unidades: productos.reduce((s, p) => s + Number(p.cantidad || 0), 0),
    servicio: its.reduce((s, i) => s + valorItem(i), 0),
  }
  const transito = dias(etd, eta)
  const pesada = tot.kg / 1000 > tot.m3 * 1.0   // más de 1 tonelada por m³: en marítimo se suele cobrar por peso
  const primer = (cliente.nombre || '').split(' ')[0]
  const numero = `CONS-${String(cons.numero || '').padStart(3, '0')}-${String(cliente.nombre || '').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').slice(0, 3).toUpperCase()}`
  const tarifaTxt = i => { const t = tarifaDe(i); return t.m === 'USD' ? `${usd(t.v)}${trm ? ` (${cop(t.v * trm)})` : ''}` : cop(t.v) }
  const prodDe = id => productos.filter(p => p.item_id === id)

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cotización ${escH(numero)} · ${escH(cliente.nombre)}</title><style>
    @page{size:letter;margin:12mm}*{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;margin:0;padding:20px;background:#fff;font-size:11.5px;line-height:1.4}
    .doc{max-width:780px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #C9A84C;padding-bottom:10px}
    .emp{font-size:10.5px;color:#555;margin-top:5px}.num{text-align:right}.num .t{font-size:10px;letter-spacing:2px;color:#8a6d1f;font-weight:700}
    .num .n1{font-size:15px;font-weight:800;margin:2px 0}.num div{font-size:10.5px;color:#555}
    .intro{margin:14px 0 10px;font-size:12.5px}
    h4{margin:16px 0 6px;font-size:10.5px;letter-spacing:2px;color:#8a6d1f}
    .ruta{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #e5dcc3;border-radius:10px;overflow:hidden}
    .ruta div{padding:9px 11px;border-right:1px solid #f0eadb}.ruta div:last-child{border-right:none}
    .ruta small,.kpis small{display:block;font-size:9.5px;color:#8a8a8a;text-transform:uppercase;letter-spacing:1px}
    .ruta b{font-size:13px}
    .kpis{display:grid;grid-template-columns:repeat(${conValor && tot.valorMerc ? 5 : 4},1fr);gap:8px}
    .kpis div{background:#faf7ee;border-radius:8px;padding:9px 11px}.kpis b{font-size:15px}
    table{width:100%;border-collapse:collapse}th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;color:#777;padding:6px 7px;border-bottom:1.5px solid #1b1b1b}
    td{padding:6px 7px;border-bottom:1px solid #f0eadb;vertical-align:top}td.n,th.n{text-align:right;white-space:nowrap}
    tr.carga td{background:#f6f3ec;font-weight:700}
    .total{margin-top:10px;display:flex;justify-content:flex-end}.total div{background:#1b1b1b;color:#fff;border-radius:10px;padding:10px 16px;text-align:right}
    .total small{display:block;color:#C9A84C;font-size:10px;letter-spacing:1px}.total b{font-size:19px}
    .notas{margin-top:14px;font-size:10.5px;color:#444;padding-left:16px}.notas li{margin:3px 0}
    .pie{margin-top:16px;padding-top:10px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:10.5px;color:#555}
    .lema{color:#8a6d1f;font-weight:700}
    @media print{body{padding:0}}</style></head><body><div class="doc">
    <div class="top"><div>${logoDocumentoHTML()}<div class="emp">${escH(empresa.ciudad)} · ${escH(empresa.whatsapp)} · ${escH(empresa.correo)}</div></div>
      <div class="num"><div class="t">COTIZACIÓN INTEGRAL · CARGA CONSOLIDADA</div><div class="n1">${escH(numero)}</div>
      <div>${fechaLarga(new Date().toISOString().slice(0, 10))}${vigencia ? ` · válida ${escH(vigencia)} días` : ''}</div><div>Cliente: <b>${escH(cliente.nombre)}</b></div></div></div>
    <div class="intro">Hola ${escH(primer)}, esta es la cotización de tu carga en nuestro consolidado <b>${escH(cons.nombre)}</b>.</div>
    <h4>RUTA Y FECHAS</h4>
    <div class="ruta">
      <div><small>Origen</small><b>${escH(cons.origen)}</b></div>
      <div><small>Destino</small><b>${escH(cons.destino)}</b></div>
      <div><small>Salida estimada (ETD)</small><b>${etd ? fechaLarga(etd) : 'Por confirmar'}</b></div>
      <div><small>Llegada estimada (ETA)</small><b>${eta ? fechaLarga(eta) : 'Por confirmar'}</b>${transito ? `<br><span style="color:#777">${transito} días de tránsito</span>` : ''}</div>
    </div>
    <h4>TU CARGA</h4>
    <div class="kpis">
      <div><small>Bultos</small><b>${fmt(tot.bultos, 0)}</b></div>
      <div><small>Peso bruto</small><b>${fmt(tot.kg, 1)} kg</b></div>
      <div><small>Volumen</small><b>${fmt(tot.m3, 3)} m³</b></div>
      <div><small>Productos</small><b>${productos.length || its.length}</b>${tot.unidades ? `<br><span style="color:#777">${fmt(tot.unidades, 0)} unidades</span>` : ''}</div>
      ${conValor && tot.valorMerc ? `<div><small>Valor mercancía</small><b>${usd(tot.valorMerc)}</b></div>` : ''}
    </div>
    ${conDetalle ? `<h4>DETALLE</h4><table><thead><tr><th>Referencia</th><th>Descripción</th><th class="n">Cant.</th><th class="n">Bultos</th><th class="n">Peso kg</th><th class="n">m³</th>${conValor && tot.valorMerc ? '<th class="n">Valor US$</th>' : ''}</tr></thead><tbody>
      ${its.map(i => {
        const ps = prodDe(i.id)
        const cab = its.length > 1 || !ps.length ? `<tr class="carga"><td colspan="2">${escH(i.descripcion || 'Mercancía')}${i.proveedor ? ` · ${escH(i.proveedor)}` : ''}</td><td class="n"></td><td class="n">${fmt(i.bultos, 0)}</td><td class="n">${fmt(i.peso_kg, 1)}</td><td class="n">${fmt(i.cbm, 3)}</td>${conValor && tot.valorMerc ? '<td class="n"></td>' : ''}</tr>` : ''
        return cab + ps.map(p => `<tr><td>${escH(p.referencia || '')}</td><td>${escH(p.descripcion || '')}</td><td class="n">${p.cantidad != null ? fmt(p.cantidad, 0) + (p.unidad ? ' ' + escH(p.unidad) : '') : ''}</td><td class="n">${p.bultos != null ? fmt(p.bultos, 0) : ''}</td><td class="n">${p.peso_kg != null ? fmt(p.peso_kg, 1) : ''}</td><td class="n">${p.cbm != null ? fmt(p.cbm, 3) : ''}</td>${conValor && tot.valorMerc ? `<td class="n">${p.valor_usd != null ? usd(p.valor_usd) : ''}</td>` : ''}</tr>`).join('')
      }).join('')}
    </tbody></table>` : ''}
    <h4>VALOR DEL SERVICIO</h4>
    <table><thead><tr><th>Concepto</th><th class="n">Volumen</th><th class="n">Tarifa por m³</th><th class="n">Valor</th></tr></thead><tbody>
      ${its.map(i => `<tr><td>Servicio integral (flete + legalización) · ${escH(i.descripcion || 'Mercancía')}</td><td class="n">${fmt(i.cbm, 3)} m³</td><td class="n">${tarifaTxt(i)}</td><td class="n"><b>${cop(valorItem(i))}</b></td></tr>`).join('')}
    </tbody></table>
    <div class="total"><div><small>TOTAL A PAGAR · INCLUYE LEGALIZACIÓN</small><b>${cop(tot.servicio)}</b></div></div>
    ${notas.trim() ? `<ul class="notas">${notas.split('\n').filter(l => l.trim()).map(l => `<li>${escH(l.trim())}</li>`).join('')}</ul>` : ''}
    <div class="pie"><span>${escH(empresa.responsable)} · ${escH(empresa.nombre)}</span><span class="lema">We bring it. Safe and on time.</span></div>
    </div></body></html>`

  const texto = [
    `Hola ${primer}, te comparto la cotización de tu carga en nuestro consolidado *${cons.nombre}* (${numero}):`, '',
    `*Ruta:* ${cons.origen} → ${cons.destino}`,
    `*Salida (ETD):* ${etd ? fechaLarga(etd) : 'por confirmar'}`,
    `*Llegada (ETA):* ${eta ? fechaLarga(eta) : 'por confirmar'}${transito ? ` · ${transito} días de tránsito` : ''}`, '',
    `*Tu carga:* ${fmt(tot.bultos, 0)} bultos · ${fmt(tot.kg, 1)} kg · ${fmt(tot.m3, 3)} m³`,
    ...(productos.length ? [`${productos.length} producto${productos.length === 1 ? '' : 's'}${tot.unidades ? ` · ${fmt(tot.unidades, 0)} unidades` : ''}`] : []),
    ...(conValor && tot.valorMerc ? [`Valor de la mercancía: ${usd(tot.valorMerc)}`] : []), '',
    ...its.map(i => `• ${i.descripcion || 'Mercancía'}: ${fmt(i.cbm, 3)} m³ × ${tarifaTxt(i)} = ${cop(valorItem(i))}`),
    `*Total: ${cop(tot.servicio)}*`, '',
    'Incluye flete, legalización y nacionalización (aranceles, IVA y agenciamiento) y entrega en ' + cons.destino + '. Aplica para mercancía general sin permisos especiales (INVIMA, ICA, licencias).',
    'Te envío el PDF con el detalle.',
    `*${empresa.nombre}* · We bring it. Safe and on time.`,
  ].join('\n')
  const wa = cliente.tel ? linkWhatsApp(cliente.tel, cliente.nombre, texto) : null
  const imprimir = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write(html.replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>')); w.document.close() }
  const copiarTxt = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }
  const guardarFechas = async () => { await supabase.from('lrm_consolidados').update({ etd: etd || null, eta: eta || null }).eq('id', cons.id) }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:120, padding:12 }}>
      <div className="cot-caja" style={{ background:'var(--bg2)', borderRadius:16, padding:18, width:'100%', maxWidth:1120, border:'1px solid var(--gold-border)', height:'94vh', display:'grid', gridTemplateColumns:'minmax(0, 300px) minmax(0, 1fr)', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:3, color:'var(--gold)', fontWeight:700 }}>COTIZACIÓN INTEGRAL</div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{cliente.nombre}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{cons.nombre} · no sale tu costo ni tu margen.</div>
          </div>
          <div className="grid-2" style={{ gap:8 }}>
            <div><Etiqueta>Salida (ETD)</Etiqueta><input id="cot-etd" type="date" value={etd} onChange={e => setEtd(e.target.value)} onBlur={guardarFechas} style={iStyle} /></div>
            <div><Etiqueta>Llegada (ETA)</Etiqueta><input id="cot-eta" type="date" value={eta} onChange={e => setEta(e.target.value)} onBlur={guardarFechas} style={iStyle} /></div>
          </div>
          {transito != null && <div style={{ fontSize:11, color: transito < 0 ? 'var(--red)' : 'var(--text3)', marginTop:-6 }}>{transito < 0 ? 'La llegada quedó antes de la salida.' : `${transito} días de tránsito · se guardan en el consolidado.`}</div>}
          <div><Etiqueta>Válida por (días)</Etiqueta><input inputMode="numeric" value={vigencia} onChange={e => setVigencia(e.target.value.replace(/\D/g, ''))} style={iStyle} /></div>
          <label style={{ display:'flex', gap:8, fontSize:13, color:'var(--text2)', cursor:'pointer' }}><input type="checkbox" checked={conDetalle} onChange={e => setConDetalle(e.target.checked)} /> Detalle de productos</label>
          <label style={{ display:'flex', gap:8, fontSize:13, color:'var(--text2)', cursor:'pointer' }}><input type="checkbox" checked={conValor} onChange={e => setConValor(e.target.checked)} /> Mostrar valor de la mercancía</label>
          {!productos.length && <div style={{ fontSize:11, color:'#E8A23A' }}>Esta carga no tiene lista de empaque: la cotización sale con los totales de cada carga.</div>}
          {pesada && <div style={{ fontSize:11, color:'#E8A23A' }}>Ojo: pesa más de 1 tonelada por m³ ({fmt(tot.kg / 1000, 2)} t en {fmt(tot.m3, 2)} m³). En marítimo normalmente se cobra lo que sea mayor, m³ o toneladas. Revisa la tarifa.</div>}
          <div><Etiqueta>Condiciones (una por renglón)</Etiqueta><textarea value={notas} onChange={e => setNotas(e.target.value)} style={{ ...iStyle, minHeight:150, resize:'vertical', fontSize:12 }} /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:'auto' }}>
            <button id="cot-pdf" onClick={imprimir} className="btn-gold">Descargar PDF / Imprimir</button>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn" style={{ textAlign:'center', textDecoration:'none', color:'#25D366', borderColor:'rgba(37,211,102,0.4)' }}>Enviar resumen por WhatsApp</a>}
            <button onClick={copiarTxt} className="btn">{copiado ? '✓ Copiado' : 'Copiar texto'}</button>
            <button onClick={onCerrar} className="btn">Cerrar</button>
          </div>
        </div>
        <iframe id="cot-doc" title="Cotización" srcDoc={html} style={{ width:'100%', height:'100%', border:'none', borderRadius:10, background:'#fff' }} />
      </div>
    </div>
  )
}