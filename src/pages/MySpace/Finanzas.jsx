// MySpace · reglas de la plata: personas, categorías, cuentas, el gasto en una línea y el orden de la plata.

// Gastos de quién: tú, Lucía y tus papás. Lo viejo que tenga otra persona se muestra como "Otros".
export const PERSONAS = ['Luis', 'Lucía', 'Mis papás']
export const P_COLOR  = { Luis:'var(--blue)', Lucía:'#9C27B0', 'Mis papás':'var(--gold)' }
export const P_EMOJI  = { Luis:'👤', Lucía:'👧', 'Mis papás':'🏡' }

export const CATS_GASTO = {
  Luis:        ['Arriendo / aporte casa','Servicios','Alimentación','Almuerzos','Café y snacks','Gasolina','Carro: SOAT','Carro: tecnomecánica','Carro: mantenimiento','Carro: cuota / prenda','Transporte','Celular','Salud','Gym','Cuidado personal','Ropa','Streaming','Suscripciones','Tecnología','Universidad','Salidas','Regalos','Transferencias','Cuota crédito','Otro'],
  Lucía:       ['Colegio','Matrícula','Manutención','Salud','Alimentación','Transporte','Extracurriculares','Útiles','Ropa','Paseos','Antojos','Ahorro','Otro'],
  'Mis papás': ['Aporte casa','Salud','Almuerzos','Paseos','Regalos','Otro'],
}

// ─── Cuentas ──────────────────────────────────────────────────────────────────
export const DUENOS = { luis:{ l:'Luis', c:'#7B93FF' }, lrm:{ l:'LRM Corp', c:'#C9A84C' }, zabu:{ l:'ZABÚ', c:'#E8A23A' }, rv:{ l:'RV Sports', c:'#378ADD' } }
export const TIPOS_CUENTA = { ahorros:'Ahorros', corriente:'Corriente', credito:'Tarjeta de crédito', billetera:'Billetera digital', efectivo:'Efectivo' }
export const esCredito = c => c?.tipo === 'credito'

// Saldo de cada cuenta con todos sus movimientos.
// Débito: saldo inicial + entradas − salidas. Crédito: "usado" = deuda inicial + compras − pagos; disponible = cupo − usado.
export function saldos(cuentas, { gastos = [], ingresos = [], traslados = [], abonos = [] }) {
  const m = {}
  cuentas.forEach(c => { m[c.id] = { entra: 0, sale: 0 } })
  const suma = (id, k, v) => { if (id && m[id]) m[id][k] += Number(v) || 0 }
  gastos.forEach(g => suma(g.cuenta_id, 'sale', g.monto))
  abonos.forEach(a => suma(a.cuenta_id, 'sale', a.monto))
  ingresos.forEach(i => suma(i.cuenta_id, 'entra', i.monto))
  traslados.forEach(t => { suma(t.de_cuenta, 'sale', t.monto); suma(t.a_cuenta, 'entra', t.monto) })
  const out = {}
  cuentas.forEach(c => {
    const { entra, sale } = m[c.id]
    if (esCredito(c)) {
      const usado = Number(c.saldo_inicial || 0) + sale - entra
      out[c.id] = { usado, disponible: Number(c.cupo || 0) - usado, saldo: Number(c.cupo || 0) - usado }
    } else {
      const saldo = Number(c.saldo_inicial || 0) + entra - sale
      out[c.id] = { saldo, disponible: saldo }
    }
  })
  return out
}

// ─── El gasto en una línea ────────────────────────────────────────────────────
// "helado Lucía 12000", "almuerzo 25.000 nubank", "gasolina 80k", "Bancolombia: Compraste $8.000,00 en JUAN VALDEZ…"
const sinTildes = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const REGLAS = [
  // [palabras, persona, categoría]
  [/colegio|pension escolar|mensualidad colegio/, 'Lucía', 'Colegio'],
  [/matricula/, 'Lucía', 'Matrícula'],
  [/manutencion/, 'Lucía', 'Manutención'],
  [/utiles|cuaderno/, 'Lucía', 'Útiles'],
  [/helado|dulce|juguete|chuche/, null, 'Antojos'],
  [/gasolina|tanqueo|terpel|primax|biomax|texaco|esso/, 'Luis', 'Gasolina'],
  [/soat/, 'Luis', 'Carro: SOAT'],
  [/tecnomecanica|tecno mecanica/, 'Luis', 'Carro: tecnomecánica'],
  [/taller|aceite|llanta|mecanico|lavado carro|lavadero/, 'Luis', 'Carro: mantenimiento'],
  [/prenda|cuota carro/, 'Luis', 'Carro: cuota / prenda'],
  [/peaje|uber|didi|indrive|taxi|bus|parqueadero|transmetro/, 'Luis', 'Transporte'],
  [/cafe|tinto|juan valdez|oma|starbucks|panaderia|empanada|snack/, 'Luis', 'Café y snacks'],
  [/almuerzo|corrientazo/, 'Luis', 'Almuerzos'],
  [/mercado|exito|olimpica|ara|d1|jumbo|carulla|supermercado|comida|cena|desayuno|restaurante|rappi/, 'Luis', 'Alimentación'],
  [/netflix|disney|youtube|spotify|hbo|max|prime|lingokids/, 'Luis', 'Streaming'],
  [/claude|chatgpt|icloud|google one|suscripcion|vercel|supabase|dominio/, 'Luis', 'Suscripciones'],
  [/celular|claro|movistar|tigo|wom|recarga|plan/, 'Luis', 'Celular'],
  [/arriendo|renta|aporte casa/, 'Luis', 'Arriendo / aporte casa'],
  [/luz|agua|gas natural|internet|servicios|air-e|triple a/, 'Luis', 'Servicios'],
  [/farmacia|drogueria|medic|cita|examen|eps|odontolog/, 'Luis', 'Salud'],
  [/gym|gimnasio|smart ?fit|bodytech|proteina|creatina/, 'Luis', 'Gym'],
  [/corte|barberia|peluqueria|manicure|pedicure|crema|piel/, 'Luis', 'Cuidado personal'],
  [/ropa|zapato|tenis|camisa|pantalon/, 'Luis', 'Ropa'],
  [/universidad|semestre|curso|libro/, 'Luis', 'Universidad'],
  [/ron|cerveza|whisky|aguardiente|trago|licor|bar|discoteca|motel|hotel|cine|salida/, 'Luis', 'Salidas'],
  [/regalo/, 'Luis', 'Regalos'],
  [/transferencia|transferi|nequi a|envio a|le mande|le di/, 'Luis', 'Transferencias'],
  [/credito|prestamo|cuota|solventa|credifacil|crediagil|nubank pago/, 'Luis', 'Cuota crédito'],
]

// Monto: "12000", "12.000", "$12.000,00", "12k", "25 mil", "1.5 millones"
export function leerMonto(t) {
  const s = sinTildes(t)
  let m = s.match(/(\d+(?:[.,]\d+)?)\s*(millones|millon|mill|m)\b/)
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1e6)
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(mil|k)\b/)
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1e3)
  m = s.match(/\$\s*([\d.,]+)/) || s.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{4,}(?:,\d{1,2})?|\d+)/)
  if (!m) return 0
  let n = m[1]
  if (/,\d{1,2}$/.test(n)) n = n.replace(/,\d{1,2}$/, '')     // centavos
  return parseInt(n.replace(/[.,]/g, ''), 10) || 0
}

export function leerLinea(texto, cuentas = [], cuentaPorDefecto = null) {
  const t = String(texto || '').trim()
  const s = sinTildes(t)
  const monto = leerMonto(t)
  // Mensaje del banco: "...en COMERCIO con tu..." / "...en COMERCIO el..."
  let comercio = null
  const mb = t.match(/\ben\s+([A-ZÁÉÍÓÚÑ0-9][^,.\n]{2,40}?)(?=\s+(?:con|el|desde|por|a las)\b|[,.\n]|$)/i)
  if (/compr|pag|transacci|retir/i.test(t) && mb) comercio = mb[1].trim()
  // Fecha del banco "23/11/2026" o "23/11"
  let fecha = null
  const mf = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (mf && comercio) { const y = mf[3] ? (mf[3].length === 2 ? '20' + mf[3] : mf[3]) : String(new Date().getFullYear()); fecha = `${y}-${mf[2].padStart(2, '0')}-${mf[1].padStart(2, '0')}` }
  // Persona
  let persona = /lucia|lu\b|mi hija/.test(s) ? 'Lucía' : /papas|papa|mama|mis viejos|omar/.test(s) ? 'Mis papás' : null
  // Categoría
  let categoria = null
  for (const [re, p, c] of REGLAS) { if (re.test(s)) { categoria = c; if (!persona && p) persona = p; break } }
  if (!persona) persona = 'Luis'
  if (!categoria || !(CATS_GASTO[persona] || []).includes(categoria)) {
    const equivalente = { Antojos: persona === 'Lucía' ? 'Antojos' : 'Café y snacks', Alimentación: 'Alimentación', Salud: 'Salud', Transporte: 'Transporte', Regalos: 'Regalos', Almuerzos: 'Almuerzos' }[categoria]
    categoria = (CATS_GASTO[persona] || []).includes(equivalente) ? equivalente : 'Otro'
  }
  // Cuenta: la que se nombre ("nubank", "bancolombia", "efectivo"); si no, la de siempre
  let cuenta_id = cuentaPorDefecto
  const ordenadas = [...cuentas].sort((a, b) => b.nombre.length - a.nombre.length)
  for (const c of ordenadas) { const n = sinTildes(c.nombre).split(/\s+/)[0]; if (n.length >= 3 && s.includes(n)) { cuenta_id = c.id; break } }
  if (/efectivo|cash/.test(s)) cuenta_id = cuentas.find(c => c.tipo === 'efectivo')?.id || cuenta_id
  // Descripción: el texto sin el monto ni la cuenta
  let descripcion = comercio || t
    .replace(/\$?\s*\d[\d.,]*\s*(millones|millon|mil|k|m)?\b/gi, ' ')
    .replace(new RegExp('\\b(' + cuentas.map(c => sinTildes(c.nombre).split(/\s+/)[0]).filter(x => x.length >= 3).join('|') + '|efectivo)\\b', 'gi'), ' ')
    .replace(/\s{2,}/g, ' ').trim()
  if (!descripcion) descripcion = categoria
  descripcion = descripcion.charAt(0).toUpperCase() + descripcion.slice(1)
  return { monto, persona, categoria, cuenta_id, descripcion: descripcion.slice(0, 80), fecha }
}

// ─── El orden de la plata ─────────────────────────────────────────────────────
export const BOLSAS = [
  { id:'lucia',  l:'Lucía',        icono:'👧', d:'Colegio, manutención, alimentación, renta, salud, transporte' },
  { id:'fijos',  l:'Tus fijos',    icono:'🏠', d:'Donde vives, gasolina y carro, celular, suscripciones' },
  { id:'deudas', l:'Deudas',       icono:'💳', d:'Las cuotas del plan para cerrar todo' },
  { id:'ahorro', l:'Ahorro',       icono:'🌄', d:'Oficina, apartamento, cambio de carro' },
]
const FIJAS = new Set(['Arriendo / aporte casa','Servicios','Gasolina','Carro: SOAT','Carro: tecnomecánica','Carro: mantenimiento','Celular','Streaming','Suscripciones','Transporte','Aporte casa'])
// A qué bolsa va cada gasto
export function bolsaDe(g) {
  if (g.meta_id) return 'ahorro'
  if (g.persona === 'Lucía') return 'lucia'
  if (g.categoria === 'Cuota crédito' || g.categoria === 'Carro: cuota / prenda') return 'deudas'
  if (FIJAS.has(g.categoria)) return 'fijos'
  return 'libre'
}
