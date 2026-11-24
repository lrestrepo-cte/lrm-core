// MySpace · Coach: biblioteca de ejercicios con reemplazos y el armado del plan alrededor de tu fútbol.
// Cada ejercicio trae su cadena de reemplazos: si no está libre la barra, mancuernas; si no, Smith; si no, máquina; si no, peso corporal.

// equipo: barra · mancuernas · smith · maquina · polea · banda · corporal
export const EJERCICIOS = {
  press_plano:    { musculo:'Pecho', opciones:[['Press banca con barra','barra'], ['Press plano con mancuernas','mancuernas'], ['Press plano en Smith','smith'], ['Press de pecho en máquina','maquina'], ['Flexiones de pecho','corporal']] },
  press_inclinado:{ musculo:'Pecho alto', opciones:[['Press inclinado con barra','barra'], ['Press inclinado con mancuernas','mancuernas'], ['Press inclinado en Smith','smith'], ['Press inclinado en máquina','maquina'], ['Flexiones con pies elevados','corporal']] },
  aperturas:      { musculo:'Pecho', opciones:[['Cruce de poleas','polea'], ['Aperturas con mancuernas','mancuernas'], ['Peck deck (máquina de aperturas)','maquina'], ['Aperturas con banda','banda'], ['Flexiones abiertas lentas','corporal']] },
  fondos:         { musculo:'Pecho y tríceps', opciones:[['Fondos en paralelas','corporal'], ['Fondos asistidos en máquina','maquina'], ['Fondos en banco','corporal'], ['Flexiones diamante','corporal']] },
  dominadas:      { musculo:'Espalda', opciones:[['Dominadas','corporal'], ['Dominadas asistidas en máquina','maquina'], ['Jalón al pecho en polea','polea'], ['Jalón con banda','banda'], ['Remo invertido en barra baja','corporal']] },
  remo_barra:     { musculo:'Espalda', opciones:[['Remo con barra','barra'], ['Remo con mancuerna a una mano','mancuernas'], ['Remo sentado en polea baja','polea'], ['Remo en máquina','maquina'], ['Remo con banda','banda']] },
  remo_apoyado:   { musculo:'Espalda media', opciones:[['Remo con pecho apoyado en banco inclinado','mancuernas'], ['Remo T','barra'], ['Remo en máquina Hammer','maquina'], ['Remo unilateral en polea','polea']] },
  jalon_neutro:   { musculo:'Dorsal', opciones:[['Jalón agarre neutro','polea'], ['Jalón unilateral en polea','polea'], ['Pullover con mancuerna','mancuernas'], ['Jalón con banda','banda']] },
  face_pull:      { musculo:'Hombro posterior', opciones:[['Face pull en polea','polea'], ['Pájaros con mancuernas','mancuernas'], ['Pájaros en máquina (reverse peck deck)','maquina'], ['Face pull con banda','banda']] },
  press_militar:  { musculo:'Hombro', opciones:[['Press de hombro con mancuernas','mancuernas'], ['Press militar con barra','barra'], ['Press de hombro en Smith','smith'], ['Press de hombro en máquina','maquina'], ['Flexiones pike','corporal']] },
  laterales:      { musculo:'Hombro lateral', opciones:[['Elevaciones laterales con mancuernas','mancuernas'], ['Elevaciones laterales en polea','polea'], ['Máquina de laterales','maquina'], ['Laterales con banda','banda']] },
  curl:           { musculo:'Bíceps', opciones:[['Curl con barra Z','barra'], ['Curl con mancuernas','mancuernas'], ['Curl en polea','polea'], ['Curl en máquina','maquina'], ['Curl con banda','banda']] },
  martillo:       { musculo:'Bíceps y antebrazo', opciones:[['Curl martillo con mancuernas','mancuernas'], ['Curl martillo en polea con cuerda','polea'], ['Curl martillo con banda','banda']] },
  triceps_polea:  { musculo:'Tríceps', opciones:[['Extensión de tríceps en polea con cuerda','polea'], ['Extensión en polea con barra','polea'], ['Patada de tríceps con mancuerna','mancuernas'], ['Fondos en banco','corporal']] },
  frances:        { musculo:'Tríceps', opciones:[['Press francés con barra Z','barra'], ['Extensión sobre la cabeza con mancuerna','mancuernas'], ['Extensión sobre la cabeza en polea','polea'], ['Extensión sobre la cabeza con banda','banda']] },
  sentadilla:     { musculo:'Pierna', opciones:[['Sentadilla con barra','barra'], ['Sentadilla en Smith','smith'], ['Prensa de piernas','maquina'], ['Sentadilla goblet con mancuerna','mancuernas'], ['Sentadilla búlgara sin peso','corporal']] },
  rumano:         { musculo:'Femoral y glúteo', opciones:[['Peso muerto rumano con barra','barra'], ['Peso muerto rumano con mancuernas','mancuernas'], ['Curl femoral en máquina','maquina'], ['Puente de glúteo a una pierna','corporal']] },
  zancadas:       { musculo:'Pierna unilateral', opciones:[['Zancadas caminando con mancuernas','mancuernas'], ['Sentadilla búlgara con mancuernas','mancuernas'], ['Zancadas en Smith','smith'], ['Step-up al banco','corporal'], ['Zancada inversa sin peso','corporal']] },
  hip_thrust:     { musculo:'Glúteo', opciones:[['Hip thrust con barra','barra'], ['Hip thrust en máquina','maquina'], ['Hip thrust con mancuerna','mancuernas'], ['Puente de glúteo','corporal']] },
  gemelos:        { musculo:'Pantorrilla', opciones:[['Elevación de talones en máquina','maquina'], ['Elevación de talones en Smith','smith'], ['Elevación de talones con mancuerna','mancuernas'], ['Elevación de talones en escalón','corporal']] },
  nordicos:       { musculo:'Femoral (prevención)', opciones:[['Curl nórdico','corporal'], ['Curl femoral en máquina, bajando lento','maquina'], ['Deslizamientos de femoral en el piso','corporal']] },
  copenhagen:     { musculo:'Aductores (prevención)', opciones:[['Plancha Copenhagen','corporal'], ['Aductores en máquina','maquina'], ['Aductores con banda','banda']] },
  gluteo_medio:   { musculo:'Glúteo medio (prevención)', opciones:[['Abducción en máquina','maquina'], ['Monster walk con banda','banda'], ['Clamshell con banda','banda'], ['Elevación lateral de pierna acostado','corporal']] },
  equilibrio:     { musculo:'Tobillo y rodilla (prevención)', opciones:[['Equilibrio a una pierna en bosu','maquina'], ['Equilibrio a una pierna con ojos cerrados','corporal'], ['Equilibrio a una pierna lanzando balón','corporal']] },
  saltos:         { musculo:'Potencia', opciones:[['Saltos al cajón','maquina'], ['Saltos verticales','corporal'], ['Sentadilla con salto','corporal']] },
  plancha:        { musculo:'Core', opciones:[['Plancha frontal','corporal'], ['Plancha con toque de hombro','corporal'], ['Plancha en rodillas','corporal']] },
  pallof:         { musculo:'Core antirotación', opciones:[['Pallof press en polea','polea'], ['Pallof press con banda','banda'], ['Plancha lateral','corporal']] },
  rueda:          { musculo:'Abdomen', opciones:[['Rueda abdominal','maquina'], ['Elevación de piernas colgado','corporal'], ['Elevación de piernas en el piso','corporal'], ['Dead bug','corporal']] },
}

export const SESIONES = {
  A: { nombre:'Pecho, hombro y tríceps', lista:['press_plano', 'press_inclinado', 'press_militar', 'laterales', 'aperturas', 'triceps_polea', 'plancha'] },
  B: { nombre:'Espalda y bíceps',        lista:['dominadas', 'remo_barra', 'remo_apoyado', 'face_pull', 'curl', 'martillo', 'pallof'] },
  S: { nombre:'Tren superior completo',  lista:['press_plano', 'dominadas', 'press_militar', 'remo_barra', 'laterales', 'curl', 'triceps_polea'] },
  P: { nombre:'Pierna y glúteo (fuerza)', lista:['sentadilla', 'rumano', 'zancadas', 'hip_thrust', 'gemelos', 'nordicos', 'rueda'] },
  Q: { nombre:'Prevención para el fútbol y core', lista:['nordicos', 'copenhagen', 'gluteo_medio', 'zancadas', 'gemelos', 'equilibrio', 'pallof'] },
  F: { nombre:'Cuerpo completo',         lista:['sentadilla', 'press_plano', 'remo_barra', 'rumano', 'press_militar', 'plancha'] },
}

export const OBJETIVOS = {
  musculo:   { l:'Ganar músculo',          series:'4 × 8–12', descanso:'90 s' },
  grasa:     { l:'Bajar grasa',            series:'3 × 12–15', descanso:'45–60 s' },
  futbol:    { l:'Rendir más en el fútbol', series:'3 × 6–8, explosivo', descanso:'2 min' },
  fuerza:    { l:'Más fuerza',             series:'5 × 5', descanso:'2–3 min' },
  salud:     { l:'Salud y verme bien',     series:'3 × 10–12', descanso:'60–90 s' },
}
export const LUGARES = {
  gym:   { l:'Gym convencional',            equipo:['barra', 'mancuernas', 'smith', 'maquina', 'polea', 'banda', 'corporal'] },
  casa:  { l:'Casa con mancuernas y bandas', equipo:['mancuernas', 'banda', 'corporal'] },
  nada:  { l:'Solo mi cuerpo',               equipo:['corporal'] },
}

// Opciones posibles de un ejercicio según dónde entrenas (sin repetir)
export const opcionesDe = (id, lugar = 'gym') => {
  const eq = LUGARES[lugar]?.equipo || LUGARES.gym.equipo
  const o = (EJERCICIOS[id]?.opciones || []).filter(([, e]) => eq.includes(e))
  return o.length ? o : (EJERCICIOS[id]?.opciones || []).slice(-1)
}

// ─── Armar el plan de la semana alrededor del fútbol ──────────────────────────
// r: { objetivo, lugar, futbol:'MXVSD', partidos:'SD', gym:'LJ', minutos, hora }
const ORDEN = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
export function armarPlan(r) {
  const futbol = String(r.futbol || ''), partidos = String(r.partidos || '')
  const gym = ORDEN.filter(d => String(r.gym || '').includes(d))
  // Días hasta el próximo fútbol (cuenta la semana que da la vuelta)
  const hastaFutbol = d => { const i = ORDEN.indexOf(d); for (let k = 1; k <= 7; k++) if (futbol.includes(ORDEN[(i + k) % 7])) return k; return 8 }
  const despuesDePartido = d => partidos.includes(ORDEN[(ORDEN.indexOf(d) + 6) % 7])
  // Sesiones según cuántos días de gym hay
  const n = gym.length
  const base = n <= 1 ? ['F'] : n === 2 ? ['S', 'P'] : n === 3 ? ['A', 'B', 'P'] : n === 4 ? ['A', 'B', 'P', 'Q'] : ['A', 'B', 'P', 'Q', 'S', 'F', 'Q'].slice(0, n)
  const dias = {}
  ORDEN.forEach(d => {
    if (futbol.includes(d)) dias[d] = { tipo:'futbol', partido: partidos.includes(d) }
    else dias[d] = { tipo:'movilidad' }
  })
  // Pierna pesada al día más lejos del próximo fútbol (mínimo 2 días) y que no sea el día después de partido
  const libres = [...gym]
  const piernas = base.includes('P') ? [...libres].filter(d => !futbol.includes(d)).sort((a, b) => hastaFutbol(b) - hastaFutbol(a)).find(d => hastaFutbol(d) >= 2 && !despuesDePartido(d)) : null
  let resto = base.filter(s => s !== 'P')
  if (base.includes('P') && !piernas) resto = [...resto, 'Q']   // no hay espacio para pierna pesada: prevención
  if (piernas) { dias[piernas] = { tipo:'gym', id:'P', nombre: SESIONES.P.nombre }; libres.splice(libres.indexOf(piernas), 1) }
  // Prevención (Q) lejos del día anterior a un partido; tren superior en el resto
  libres.forEach(d => {
    let s = resto.shift() || 'S'
    if (s === 'Q' && partidos.includes(ORDEN[(ORDEN.indexOf(d) + 1) % 7]) && resto.length) { resto.push(s); s = resto.shift() }
    dias[d] = { tipo:'gym', id:s, nombre: SESIONES[s].nombre, conFutbol: futbol.includes(d) }
  })
  return { dias, objetivo: r.objetivo || 'salud', lugar: r.lugar || 'gym', minutos: Number(r.minutos) || 60, hora: r.hora || 'manana', molestias: r.molestias || [] }
}