// @ts-nocheck
// LRM Trade Consulting · Lectura de listas de empaque (packing list)
// Lee Excel (.xlsx / .xls), CSV o texto pegado (copiado de Excel o el bloque que arma Claude)
// y encuentra solo las columnas: referencia, descripción, cantidad, bultos, peso, m³, valor y subpartida.
// Entiende encabezados en español, inglés y chino (los de las fábricas).
// La librería de Excel se carga solo cuando se usa (pesa bastante)
const cargarXLSX = () => import('xlsx')

export const CAMPOS = [
  { id:'referencia',  label:'Referencia' },
  { id:'descripcion', label:'Descripción' },
  { id:'cantidad',    label:'Cantidad' },
  { id:'unidad',      label:'Unidad' },
  { id:'bultos',      label:'Bultos' },
  { id:'peso_kg',     label:'Peso kg' },
  { id:'cbm',         label:'m³' },
  { id:'valor_usd',   label:'Valor US$' },
  { id:'subpartida',  label:'Subpartida' },
]

// Palabras que identifican cada columna (se comparan sin tildes y en minúscula)
const SINONIMOS = {
  subpartida:  ['hs code', 'hs', 'h.s', 'subpartida', 'partida', 'arancel', 'tariff', 'customs code', '海关编码', '税号', 'hscode'],
  referencia:  ['item no', 'item', 'model', 'modelo', 'ref', 'referencia', 'sku', 'article', 'art no', 'style', 'code', 'codigo', 'part no', '型号', '货号', '款号', '编号'],
  descripcion: ['description', 'descripcion', 'goods', 'product', 'producto', 'name', 'commodity', 'mercancia', 'articulo', 'desc', 'nombre', '品名', '名称', '描述', '货物'],
  cantidad:    ['qty', 'quantity', 'cantidad', 'pcs', 'total qty', 'total pcs', 'unidades', 'cant', '数量', '总数'],
  unidad:      ['unit', 'unidad', 'uom', '单位'],
  bultos:      ['cantidad de cajas', 'no. cajas', 'numero de cajas', 'ctns', 'ctn', 'cartons', 'carton', 'bultos', 'cajas', 'packages', 'pkgs', 'pkg', 'boxes', 'no. of ctns', 'cajas totales', '箱数', '件数', '总箱数'],
  peso_kg:     ['g.w', 'gw', 'gross weight', 'gross wt', 'peso bruto', 'peso', 'weight', 'kgs', 'kg', 'g.w.(kg)', '毛重', '重量'],
  peso_neto:   ['n.w', 'nw', 'net weight', 'peso neto', '净重'],
  cbm:         ['cbm', 'm3', 'm³', 'meas', 'measurement', 'volume', 'volumen', 'vol', '体积', '立方'],
  valor_usd:   ['amount', 'total amount', 'total value', 'valor total', 'total usd', 'value', 'valor', 'subtotal', 'total price', '金额', '总价', '总金额'],
  precio:      ['unit price', 'precio unitario', 'price', 'precio', 'u/price', 'fob', '单价'],
}
const PER_CAJA = /(\/\s*(ctn|carton|caja|box)|per\s*(ctn|carton|box)|each|c\/u|por\s*caja|每箱|单箱)/i

const limpiar = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

// Número escrito de cualquier forma: 1,234.50 · 1.234,50 · 12,5 · "15 kg"
export function numero(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null
  let t = String(v ?? '').replace(/[^\d.,-]/g, '')
  if (!t || !/\d/.test(t)) return null
  const p = t.lastIndexOf('.'), c = t.lastIndexOf(',')
  if (p >= 0 && c >= 0) t = p > c ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.')
  else if (c >= 0) t = /^-?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.')
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '')
  const n = Number(t)
  return isFinite(n) ? n : null
}

// Qué campo es un encabezado (y si es "por caja"). Gana el sinónimo más largo que aparezca:
// "Unit price" es precio (no unidad), "Item description" es descripción (no referencia), "N.W.(kg)" es peso neto.
function campoDe(h) {
  const t = limpiar(h)
  if (!t || t.length > 60) return null
  let mejor = null
  for (const [campo, lista] of Object.entries(SINONIMOS)) {
    for (const s of lista) {
      const ss = limpiar(s)
      const ok = /[一-鿿]/.test(ss) ? t.includes(ss)
        : ss.length <= 3 ? new RegExp(`(^|[^a-z])${ss.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t)
        : t.includes(ss)
      if (ok && (!mejor || ss.length > mejor.largo)) mejor = { campo, largo: ss.length }
    }
  }
  return mejor && { campo: mejor.campo, porCaja: PER_CAJA.test(String(h)) }
}

// Fila de encabezados: la que más columnas reconoce en las primeras 30 filas
function buscarEncabezado(filas) {
  let mejor = { i: -1, mapa: {}, puntos: 0 }
  filas.slice(0, 30).forEach((fila, i) => {
    const mapa = {}
    fila.forEach((h, col) => {
      const r = campoDe(h)
      if (!r) return
      const clave = r.porCaja ? r.campo + '_caja' : r.campo
      if (mapa[clave] == null) mapa[clave] = col
    })
    const puntos = Object.keys(mapa).length + (mapa.descripcion != null ? 1 : 0)
    if (puntos > mejor.puntos) mejor = { i, mapa, puntos }
  })
  return mejor.puntos >= 2 ? mejor : null
}

const esTotal = fila => fila.some(c => /^\s*(total|totales|sub ?total|grand total|合计|总计|小计)\b/i.test(String(c ?? '')))

// Filas (arreglo de arreglos) → productos
export function interpretar(filas) {
  const enc = buscarEncabezado(filas)
  if (!enc) return { productos: [], columnas: {}, error: 'No encontré los encabezados (descripción, cantidad, cajas, peso, CBM…). Revisa que la lista tenga una fila de títulos.' }
  const { i: fi, mapa } = enc
  const titulos = filas[fi]
  const val = (fila, k) => mapa[k] == null ? '' : fila[mapa[k]]
  const productos = []
  let vacias = 0, totalesArchivo = null
  for (const fila of filas.slice(fi + 1)) {
    const llena = fila.some(c => String(c ?? '').trim() !== '')
    if (!llena) { if (++vacias >= 5 && productos.length) break; continue }
    vacias = 0
    if (esTotal(fila)) { totalesArchivo = fila; continue }
    // Una fila de títulos repetida (listas de varias páginas)
    if (buscarEncabezado([fila])) continue
    const bultos = numero(val(fila, 'bultos'))
    const porCaja = (k) => { const v = numero(val(fila, k + '_caja')); return v != null && bultos ? v * bultos : null }
    const cantidad = numero(val(fila, 'cantidad')) ?? porCaja('cantidad')
    const peso = numero(val(fila, 'peso_kg')) ?? porCaja('peso_kg') ?? numero(val(fila, 'peso_neto')) ?? porCaja('peso_neto')
    const cbm = numero(val(fila, 'cbm')) ?? porCaja('cbm')
    const precio = numero(val(fila, 'precio'))
    const valor = numero(val(fila, 'valor_usd')) ?? (precio != null && cantidad != null ? precio * cantidad : null)
    const p = {
      referencia: String(val(fila, 'referencia') ?? '').trim() || null,
      descripcion: String(val(fila, 'descripcion') ?? '').trim() || null,
      cantidad, unidad: String(val(fila, 'unidad') ?? '').trim() || null,
      bultos, peso_kg: peso, cbm, valor_usd: valor,
      subpartida: String(val(fila, 'subpartida') ?? '').replace(/[^\d.]/g, '') || null,
    }
    // Sin descripción ni referencia y sin números: no es un producto
    if (!p.descripcion && !p.referencia && [p.cantidad, p.bultos, p.peso_kg, p.cbm, p.valor_usd].every(x => x == null)) continue
    productos.push(p)
  }
  const columnas = {}
  Object.entries(mapa).forEach(([k, col]) => { columnas[k] = String(titulos[col] ?? '').trim() })
  return { productos, columnas, totalesArchivo }
}

// Texto pegado: tabulaciones (copiado de Excel), barras | , punto y coma o comas
export function leerTexto(texto) {
  const lineas = String(texto || '').split(/\r?\n/).filter(l => l.trim() !== '' && !/^[\s|:-]+$/.test(l))
  const muestra = lineas.slice(0, 10).join('\n')
  const sep = muestra.includes('\t') ? '\t' : muestra.includes('|') ? '|' : (muestra.match(/;/g) || []).length >= (muestra.match(/,/g) || []).length / 2 && muestra.includes(';') ? ';' : ','
  const bordeIzq = /^\s*\|/.test(lineas[0] || ''), bordeDer = /\|\s*$/.test(lineas[0] || '')
  const filas = lineas.map(l => {
    let celdas = sep === ',' ? partirCSV(l) : l.split(sep)
    // Tablas con barras al principio y al final ( | a | b | ): se quitan esas celdas vacías de los bordes
    if (sep === '|' && bordeIzq && /^\s*\|/.test(l)) celdas = celdas.slice(1)
    if (sep === '|' && bordeDer && /\|\s*$/.test(l)) celdas = celdas.slice(0, -1)
    return celdas.map(c => c.trim())
  })
  return interpretar(filas)
}
function partirCSV(l) {
  const out = []; let cur = '', q = false
  for (const ch of l) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur); return out
}

// Archivo Excel o CSV → la hoja que más productos tenga
export async function leerArchivo(archivo) {
  const buf = await archivo.arrayBuffer()
  if (/\.(csv|txt|tsv)$/i.test(archivo.name)) return leerTexto(new TextDecoder().decode(buf))
  const XLSX = await cargarXLSX()
  const libro = XLSX.read(buf, { type:'array' })
  let mejor = null
  for (const nombre of libro.SheetNames) {
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[nombre], { header:1, raw:true, defval:'', blankrows:true })
    const r = interpretar(filas)
    if (!mejor || r.productos.length > mejor.productos.length) mejor = { ...r, hoja: nombre }
  }
  return mejor || { productos: [], columnas: {}, error: 'El archivo no tiene hojas.' }
}

export const totales = ps => ps.reduce((t, p) => ({
  productos: t.productos + 1,
  cantidad: t.cantidad + (Number(p.cantidad) || 0),
  bultos: t.bultos + (Number(p.bultos) || 0),
  peso_kg: t.peso_kg + (Number(p.peso_kg) || 0),
  cbm: t.cbm + (Number(p.cbm) || 0),
  valor_usd: t.valor_usd + (Number(p.valor_usd) || 0),
}), { productos:0, cantidad:0, bultos:0, peso_kg:0, cbm:0, valor_usd:0 })

// Excel de la lista de empaque consolidada (una hoja con todo y una por cliente con el resumen)
export async function descargarExcel(nombreArchivo, filas, resumen) {
  const XLSX = await cargarXLSX()
  const libro = XLSX.utils.book_new()
  const h1 = XLSX.utils.json_to_sheet(filas)
  h1['!cols'] = Object.keys(filas[0] || {}).map(k => ({ wch: Math.min(40, Math.max(10, k.length + 2, ...filas.map(f => String(f[k] ?? '').length))) }))
  XLSX.utils.book_append_sheet(libro, h1, 'Lista de empaque')
  if (resumen?.length) {
    const h2 = XLSX.utils.json_to_sheet(resumen)
    h2['!cols'] = Object.keys(resumen[0]).map(k => ({ wch: Math.max(12, k.length + 2) }))
    XLSX.utils.book_append_sheet(libro, h2, 'Resumen por cliente')
  }
  const datos = XLSX.write(libro, { bookType:'xlsx', type:'array' })
  const url = URL.createObjectURL(new Blob([datos], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}