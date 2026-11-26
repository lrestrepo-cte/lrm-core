// LRM Inversiones · Sports: el motor de tendencias.
// No adivina resultados: mira lo que cada equipo ha hecho en sus últimos partidos y dice con qué
// frecuencia pasó cada cosa (más de 2.5 goles, más de 9.5 córners…). La decisión siempre es tuya.

export const LIGAS = [
  { id: 2,   nombre: 'Champions League', corto: 'UCL',     europea: true },
  { id: 39,  nombre: 'Premier League',   corto: 'Premier', europea: true },
  { id: 140, nombre: 'LaLiga',           corto: 'LaLiga',  europea: true },
  { id: 239, nombre: 'Liga colombiana',  corto: 'BetPlay', europea: false },
]
// Temporada como la cuenta la API: Europa arranca en julio (2026-27 = 2026); Colombia es el año calendario
export const temporada = (liga, hoy = new Date()) => liga.europea ? (hoy.getMonth() >= 6 ? hoy.getFullYear() : hoy.getFullYear() - 1) : hoy.getFullYear()

// Los mercados que se analizan y sus líneas
export const MERCADOS = [
  { id: 'goles',   nombre: 'Goles',          lineas: [1.5, 2.5, 3.5],  campo: 'goles' },
  { id: 'ambos',   nombre: 'Ambos marcan',   lineas: null,             campo: 'ambos' },
  { id: 'corners', nombre: 'Córners',        lineas: [8.5, 9.5, 10.5], campo: 'corners' },
  { id: 'tiros',   nombre: 'Tiros al arco',  lineas: [7.5, 8.5, 9.5],  campo: 'tiros' },
  { id: 'tarjetas',nombre: 'Tarjetas',       lineas: [3.5, 4.5, 5.5],  campo: 'tarjetas' },
]
export const VENTANAS = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90']

const stat = (f, teamId, tipo) => {
  const s = (f.statistics || []).find(x => x.team?.id === teamId)?.statistics?.find(x => x.type === tipo)?.value
  return s == null ? null : Number(String(s).replace('%', '')) || 0
}

// Un partido visto desde un equipo: lo que hizo él, lo que le hicieron y los totales del partido
export function lecturaPartido(f, teamId) {
  const local = f.teams?.home?.id === teamId
  const rival = local ? f.teams?.away?.id : f.teams?.home?.id
  const gf = Number(local ? f.goals?.home : f.goals?.away) || 0
  const gc = Number(local ? f.goals?.away : f.goals?.home) || 0
  const cf = stat(f, teamId, 'Corner Kicks'), cc = stat(f, rival, 'Corner Kicks')
  const tf = stat(f, teamId, 'Shots on Goal'), tc = stat(f, rival, 'Shots on Goal')
  const am = [teamId, rival].reduce((s, t) => s + (stat(f, t, 'Yellow Cards') || 0) + (stat(f, t, 'Red Cards') || 0), 0)
  const conStats = cf != null && cc != null
  const minutosGol = (f.events || []).filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty').map(e => {
    const m = Number(e.time?.elapsed) || 0
    return { min: m, propio: e.team?.id === teamId && e.detail !== 'Own Goal', v: Math.min(5, Math.max(0, Math.floor((m - 1) / 15))) }
  })
  return {
    id: f.fixture?.id, fecha: f.fixture?.date, local, rival: local ? f.teams?.away?.name : f.teams?.home?.name,
    gf, gc, goles: gf + gc, ambos: gf > 0 && gc > 0,
    corners: conStats ? cf + cc : null, cornersFavor: cf, cornersContra: cc,
    tiros: tf != null && tc != null ? tf + tc : null, tirosFavor: tf, tirosContra: tc,
    tarjetas: conStats ? am : null,
    golesPrimerTiempo: (Number(f.score?.halftime?.home) || 0) + (Number(f.score?.halftime?.away) || 0),
    minutosGol,
  }
}

const prom = xs => { const v = xs.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }
const frec = (xs, fn) => { const v = xs.filter(x => x != null); return v.length ? v.filter(fn).length / v.length : null }

// Resumen de un equipo con sus últimos partidos (ya leídos con lecturaPartido)
export function resumenEquipo(partidos) {
  const ps = partidos.filter(p => p && p.fecha).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  const ventanasFavor = [0, 0, 0, 0, 0, 0], ventanasContra = [0, 0, 0, 0, 0, 0]
  ps.forEach(p => p.minutosGol.forEach(g => { if (g.propio) ventanasFavor[g.v]++; else ventanasContra[g.v]++ }))
  return {
    n: ps.length, partidos: ps,
    golesFavor: prom(ps.map(p => p.gf)), golesContra: prom(ps.map(p => p.gc)),
    cornersFavor: prom(ps.map(p => p.cornersFavor)), cornersContra: prom(ps.map(p => p.cornersContra)),
    tirosFavor: prom(ps.map(p => p.tirosFavor)), tirosContra: prom(ps.map(p => p.tirosContra)),
    tarjetas: prom(ps.map(p => p.tarjetas)),
    golPrimerTiempo: frec(ps.map(p => p.golesPrimerTiempo), x => x > 0),
    ventanasFavor, ventanasContra,
  }
}

// Con qué frecuencia el total de un mercado pasó una línea en los partidos de un equipo
const frecLinea = (ps, campo, linea) => campo === 'ambos' ? frec(ps.map(p => p.ambos), x => x) : frec(ps.map(p => p[campo]), x => x > linea)

// El análisis de un partido: para cada mercado y línea, la probabilidad estimada (promedio de los dos equipos),
// qué tan consistente es (últimos 5 contra últimos 10) y la cuota justa (1 / probabilidad)
export function analizarPartido(local, visita) {
  const filas = []
  MERCADOS.forEach(m => (m.lineas || [null]).forEach(linea => {
    const a = frecLinea(local.partidos, m.campo, linea), b = frecLinea(visita.partidos, m.campo, linea)
    if (a == null || b == null) return
    const a5 = frecLinea(local.partidos.slice(0, 5), m.campo, linea), b5 = frecLinea(visita.partidos.slice(0, 5), m.campo, linea)
    const p = (a + b) / 2, p5 = (a5 + b5) / 2
    const lado = p >= 0.5 ? 'mas' : 'menos'
    const pLado = lado === 'mas' ? p : 1 - p
    const n = Math.min(local.n, visita.n)
    const estable = Math.abs(p - p5) <= 0.15
    const confianza = n >= 8 && estable && Math.abs(a - b) <= 0.3 ? 'alta' : n >= 5 && (estable || Math.abs(a - b) <= 0.3) ? 'media' : 'baja'
    filas.push({
      mercado: m.id, nombreMercado: m.nombre, linea,
      seleccion: m.campo === 'ambos' ? (lado === 'mas' ? 'Sí' : 'No') : `${lado === 'mas' ? 'Más' : 'Menos'} de ${linea}`,
      p: pLado, pLocal: lado === 'mas' ? a : 1 - a, pVisita: lado === 'mas' ? b : 1 - b,
      cuotaJusta: pLado > 0 ? 1 / pLado : null, confianza, n,
    })
  }))
  // Las tendencias más claras primero
  return filas.sort((x, y) => y.p - x.p)
}

// ¿Tiene valor la cuota de la casa? Valor = tu probabilidad × cuota − 1 (positivo = a tu favor)
export function valor(p, cuota) {
  const c = Number(cuota)
  if (!p || !c || c <= 1) return null
  const ventaja = p * c - 1
  return { ventaja, implicita: 1 / c, conValor: ventaja >= 0.05 }
}

// Monto sugerido: un cuarto de Kelly, nunca por encima de tu máximo por apuesta
export function montoSugerido(p, cuota, saldo, maxPct) {
  const c = Number(cuota), b = c - 1
  if (!p || !b || saldo <= 0) return 0
  const kelly = (b * p - (1 - p)) / b
  const tope = saldo * (Number(maxPct) || 2) / 100
  return Math.max(0, Math.min(tope, saldo * kelly / 4))
}

// ─── Banca ───────────────────────────────────────────────────────────────────
export const BANCA_BASE = { inicial: 0, topeSemana: 0, maxPct: 2, maxDia: 3 }
export const gananciaDe = a => a.estado === 'ganada' ? Number(a.monto) * (Number(a.cuota) - 1) : a.estado === 'perdida' ? -Number(a.monto) : 0
export function lunesDe(iso) { const d = new Date(iso + 'T12:00:00'); const dia = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dia); return d.toISOString().slice(0, 10) }

export function estadoBanca(cfg, apuestas, hoy) {
  const c = { ...BANCA_BASE, ...(cfg || {}) }
  const resueltas = apuestas.filter(a => a.estado !== 'pendiente')
  const pendientes = apuestas.filter(a => a.estado === 'pendiente')
  const enJuego = pendientes.reduce((s, a) => s + Number(a.monto), 0)
  const ganado = resueltas.reduce((s, a) => s + gananciaDe(a), 0)
  const saldo = Number(c.inicial) + ganado - enJuego
  const lunes = lunesDe(hoy)
  const semana = apuestas.filter(a => a.fecha >= lunes)
  const resultadoSemana = semana.filter(a => a.estado !== 'pendiente').reduce((s, a) => s + gananciaDe(a), 0)
  const perdidaAbierta = semana.filter(a => a.estado === 'pendiente').reduce((s, a) => s + Number(a.monto), 0)
  const hoyAp = apuestas.filter(a => a.fecha === hoy)
  const perdidasHoy = hoyAp.filter(a => a.estado === 'perdida').length
  const apostado = resueltas.reduce((s, a) => s + Number(a.monto), 0)
  // Pérdida de la semana contando lo que está en juego (lo peor que puede pasar)
  const peorSemana = -resultadoSemana + perdidaAbierta
  const bloqueada = Number(c.topeSemana) > 0 && -resultadoSemana >= Number(c.topeSemana)
  return {
    cfg: c, saldo, ganado, enJuego, resultadoSemana, peorSemana, bloqueada,
    disponibleSemana: Number(c.topeSemana) > 0 ? Math.max(0, Number(c.topeSemana) - peorSemana) : Infinity,
    apuestasHoy: hoyAp.length, perdidasHoy,
    roi: apostado ? ganado / apostado : null,
    aciertos: resueltas.filter(a => a.estado !== 'nula').length ? resueltas.filter(a => a.estado === 'ganada').length / resueltas.filter(a => a.estado !== 'nula').length : null,
    maxApuesta: Math.max(0, saldo) * Number(c.maxPct) / 100,
  }
}

// ¿Se puede registrar esta apuesta? Devuelve el motivo si no.
export function puedeApostar(b, monto) {
  if (!Number(b.cfg.inicial)) return 'Primero define tu banca en la pestaña Banca.'
  if (b.bloqueada) return 'Llegaste a tu tope de pérdida de esta semana. Se libera el lunes.'
  if (b.apuestasHoy >= Number(b.cfg.maxDia)) return `Ya hiciste ${b.apuestasHoy} apuestas hoy, tu máximo por día.`
  if (monto > b.maxApuesta + 1) return `Tu máximo por apuesta hoy es ${Math.round(b.maxApuesta).toLocaleString('es-CO')}.`
  if (monto > b.disponibleSemana + 1) return `Con esta apuesta podrías pasar tu tope semanal. Te quedan ${Math.round(b.disponibleSemana).toLocaleString('es-CO')}.`
  return null
}