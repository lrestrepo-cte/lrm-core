// LRM Inversiones · Sports: puente seguro hacia API-Football (api-sports.io).
// La llave de la API vive solo aquí, en Vercel (variable API_FOOTBALL_KEY); nunca llega al navegador.
// Solo el dueño con sesión abierta puede usarlo, y solo para leer estas rutas.
const SUPABASE_URL = 'https://kksudwzrehzeuwyphfkz.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrc3Vkd3pyZWh6ZXV3eXBoZmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTgwMDgsImV4cCI6MjA5NjYzNDAwOH0.xpP6FGcdRXbcIN4qxjfaV6XvbUfDWkkACgkia5T9fqU'
const RUTAS = ['fixtures', 'odds', 'standings', 'teams/statistics', 'leagues', 'status']

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Inicia sesión' })
    const dueno = await fetch(`${SUPABASE_URL}/rest/v1/rpc/es_dueno`, {
      method: 'POST', headers: { Authorization: auth, apikey: SUPABASE_ANON, 'Content-Type': 'application/json' }, body: '{}',
    })
    if (!dueno.ok || (await dueno.json()) !== true) return res.status(403).json({ error: 'Solo el dueño' })

    const key = process.env.API_FOOTBALL_KEY
    if (!key) return res.status(500).json({ error: 'falta_llave' })

    const { path, ...resto } = req.query || {}
    if (!RUTAS.includes(path)) return res.status(400).json({ error: 'Ruta no permitida' })
    const qs = new URLSearchParams(Object.entries(resto).map(([k, v]) => [k, String(v)])).toString()
    const r = await fetch(`https://v3.football.api-sports.io/${path}${qs ? '?' + qs : ''}`, { headers: { 'x-apisports-key': key } })
    const data = await r.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(r.ok ? 200 : r.status).json({
      ...data,
      quedan: Number(r.headers.get('x-ratelimit-requests-remaining') ?? NaN),
    })
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}