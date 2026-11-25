// MySpace · Mi día: arma tu rutina de despertar a dormir con horas puestas por la app.
// Los compromisos fijos (fútbol, Lucía, trabajo, estudio, iglesia) van primero;
// lo demás (devocional, entreno, comidas, LRM, lectura, cierre del día, pantallas fuera) se acomoda en los huecos.

export const DIAS = [['L', 'Lunes', 'MO'], ['M', 'Martes', 'TU'], ['X', 'Miércoles', 'WE'], ['J', 'Jueves', 'TH'], ['V', 'Viernes', 'FR'], ['S', 'Sábado', 'SA'], ['D', 'Domingo', 'SU']]
export const letraDe = iso => DIAS[(new Date(iso + 'T12:00:00').getDay() + 6) % 7][0]
export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const aMin = hhmm => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
export const aHora = min => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
export const hora12 = hhmm => { const m = aMin(hhmm), h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}` }
export const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
const finde = l => l === 'S' || l === 'D'

export const TIPOS_COMPROMISO = {
  futbol:  { l:'Fútbol',          icono:'⚽', area:'fisica' },
  lucia:   { l:'Lucía',           icono:'👧', area:'lucia' },
  trabajo: { l:'Trabajo LRM',     icono:'💼', area:'financiera' },
  estudio: { l:'Universidad',     icono:'🎓', area:'mental' },
  iglesia: { l:'Living Room',     icono:'🙏', area:'espiritual' },
  sara:    { l:'Tiempo con Sara', icono:'❤️', area:'emocional' },
  familia: { l:'Familia',         icono:'🏡', area:'emocional' },
  otro:    { l:'Otro',            icono:'📌', area:null },
}

export const DIA_BASE = {
  despertar: { semana: '05:30', finde: '07:00' },
  dormir:    { semana: '22:30', finde: '23:00' },
  compromisos: [],
}

// Qué bloque del día le da la hora a cada hábito
export const BLOQUE_DE_AREA = { espiritual:'devocional', mental:'lectura', fisica:'entreno', financiera:'cierre', emocional:'cierre', lucia:'lucia', alimentacion:'desayuno', sueno:'pantallas' }

// ─── Armar el día ─────────────────────────────────────────────────────────────
// cfg: { despertar, dormir, compromisos:[{nombre,tipo,dias,inicio,fin}] } · coach: plan del coach (opcional)
export function armarDia(iso, cfg = DIA_BASE, coach = null) {
  const l = letraDe(iso)
  const W = aMin((cfg.despertar || DIA_BASE.despertar)[finde(l) ? 'finde' : 'semana'])
  let S = aMin((cfg.dormir || DIA_BASE.dormir)[finde(l) ? 'finde' : 'semana'])
  if (S <= W) S += 24 * 60
  const ocupado = []
  const libre = (a, b) => a >= W && b <= S && !ocupado.some(([x, y]) => a < y && b > x)
  const bloques = []
  const poner = (id, nombre, icono, area, ini, dur, extra = {}) => {
    ocupado.push([ini, ini + dur]); bloques.push({ id, nombre, icono, area, ini, fin: ini + dur, ...extra })
  }
  // Busca hueco desde la hora preferida hacia adelante; si no, hacia atrás
  const acomodar = (id, nombre, icono, area, pref, durs, extra = {}) => {
    for (const dur of [].concat(durs)) {
      for (let t = Math.max(W, pref); t + dur <= S; t += 5) if (libre(t, t + dur)) return poner(id, nombre, icono, area, t, dur, extra)
      for (let t = Math.min(pref, S - dur); t >= W; t -= 5) if (libre(t, t + dur)) return poner(id, nombre, icono, area, t, dur, extra)
    }
    return null
  }

  // 1) Fijos
  poner('despertar', 'Despertar · agua y cama tendida', '☀️', null, W, 5, { fijo: true })
  poner('dormir', 'Dormir', '🌙', 'sueno', S, 0, { fijo: true })
  const hoyComp = (cfg.compromisos || []).filter(c => String(c.dias || '').includes(l))
  hoyComp.forEach((c, i) => {
    const t = TIPOS_COMPROMISO[c.tipo] || TIPOS_COMPROMISO.otro
    let a = aMin(c.inicio), b = aMin(c.fin || aHora(a + 60)); if (b <= a) b = a + 60
    poner(c.tipo === 'lucia' && !bloques.some(x => x.id === 'lucia') ? 'lucia' : `c${i}-${c.tipo}`, c.nombre || t.l, t.icono, t.area, a, b - a, { fijo: true, tipo: c.tipo })
  })
  const futbolHoy = hoyComp.some(c => c.tipo === 'futbol')
  const finFutbol = Math.max(0, ...hoyComp.filter(c => c.tipo === 'futbol').map(c => aMin(c.fin || c.inicio) || 0))

  // 2) Lo que la app acomoda
  acomodar('pantallas', 'Pantallas fuera · preparar mañana', '📵', 'sueno', S - 30, [30, 15])
  acomodar('cierre', 'Cierre del día · gastos y diario', '📓', 'emocional', S - 60, [20, 15])
  acomodar('devocional', 'Devocional y oración', '🙏', 'espiritual', W + 10, [25, 15])
  const sesion = coach?.dias?.[l]
  if (sesion?.tipo === 'gym') {
    const pref = { manana: W + 40, mediodia: 11 * 60 + 30, tarde: 16 * 60, noche: 19 * 60 }[coach.hora || 'manana'] ?? W + 40
    acomodar('entreno', `Gym · ${sesion.nombre}`, '🏋️', 'fisica', pref, [coach.minutos || 60, 45], { sesion: sesion.id })
  } else if (!futbolHoy) {
    acomodar('entreno', sesion?.tipo === 'movilidad' ? 'Movilidad y estiramiento' : 'Caminar o movilidad', '🧘', 'fisica', W + 40, [20, 15])
  }
  const ent = bloques.find(b => b.id === 'entreno' && b.ini < 11 * 60)
  acomodar('desayuno', 'Desayuno con proteína', '🍳', 'alimentacion', ent ? ent.fin + 10 : W + 40, [20, 15])
  acomodar('almuerzo', 'Almuerzo', '🍽️', 'alimentacion', 12 * 60 + 30, [45, 30])
  if (!hoyComp.some(c => c.tipo === 'trabajo')) {
    acomodar('lrm1', finde(l) ? 'LRM · revisar y planear la semana' : 'LRM Trade · lo más importante primero', '💼', 'financiera', finde(l) ? 9 * 60 + 30 : 8 * 60 + 30, finde(l) ? [60, 30] : [180, 120, 90, 60])
    if (!finde(l)) acomodar('lrm2', 'LRM Trade · clientes, llamadas y seguimientos', '📞', 'financiera', 14 * 60, [180, 120, 90, 60])
  }
  if (!bloques.some(b => b.id === 'lucia')) acomodar('lucia', 'Llamada o rato con Lucía', '👧', 'lucia', 18 * 60, [20, 15])
  acomodar('cena', 'Cena', '🥗', 'alimentacion', futbolHoy && finFutbol > 18 * 60 ? finFutbol + 15 : 19 * 60 + 30, [40, 30])
  acomodar('lectura', 'Lectura', '📖', 'mental', S - 90, [25, 15])
  acomodar('ocio', 'Ocio sin culpa', '🎮', null, S - 150, [45, 30])

  return bloques.sort((a, b) => a.ini - b.ini || (a.fin - a.ini) - (b.fin - b.ini)).map(b => ({ ...b, inicio: aHora(b.ini), final: aHora(b.fin) }))
}

// Bloque en curso y el que sigue
export function ahoraEn(bloques, min = ahoraMin()) {
  const actual = bloques.find(b => b.ini <= min && min < b.fin) || null
  const siguiente = bloques.find(b => b.ini > min) || null
  return { actual, siguiente }
}

// ─── Calendario (.ics) con la rutina de la semana y los pagos fijos ───────────
const CLAVE = new Set(['devocional', 'entreno', 'lucia', 'lectura', 'cierre', 'pantallas', 'dormir'])
export function calendarioSemana(cfg, coach, fijos = []) {
  const hoy = hoyISO(), ahora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const esc = s => String(s || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n')
  const ev = []
  for (let i = 0; i < 7; i++) {
    const f = masDias(hoy, i), l = letraDe(f), by = DIAS.find(d => d[0] === l)[2], dt = f.replace(/-/g, '')
    armarDia(f, cfg, coach).filter(b => CLAVE.has(b.id) || b.fijo && b.tipo).forEach(b => {
      ev.push(['BEGIN:VEVENT', `UID:dia-${l}-${b.id}@lrmcore`, `DTSTAMP:${ahora}`, `DTSTART:${dt}T${b.inicio.replace(':', '')}00`, `DURATION:PT${Math.max(5, b.fin - b.ini)}M`,
        `RRULE:FREQ=WEEKLY;BYDAY=${by}`, `SUMMARY:${esc(b.icono + ' ' + b.nombre)}`, 'DESCRIPTION:MySpace · Mi día',
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(b.nombre)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n'))
    })
  }
  fijos.filter(x => x.activo).forEach(x => {
    const d = String(Math.min(28, x.dia)).padStart(2, '0')
    ev.push(['BEGIN:VEVENT', `UID:fijo-${x.id}@lrmcore`, `DTSTAMP:${ahora}`, `DTSTART:${hoy.slice(0, 7).replace('-', '')}${d}T080000`, 'DURATION:PT15M',
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${Number(d)}`, `SUMMARY:${esc('💳 Pagar ' + x.nombre + ' $' + Math.round(x.monto).toLocaleString('es-CO'))}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Pagar ' + x.nombre)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n'))
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LRM Corp//MySpace//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:MySpace', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n'
}