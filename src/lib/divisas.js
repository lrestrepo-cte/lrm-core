// Tasas de cambio contra el peso colombiano: dólar, euro y yuan.
// • Dólar: TRM oficial de la Superintendencia Financiera (datos.gov.co).
//   Si no responde, se usa la tasa de mercado de open.er-api.com.
// • Euro y yuan: TRM cruzada con el cambio del día frente al dólar
//   (Banco Central Europeo vía Frankfurter; respaldo: open.er-api.com). Son de referencia.
// • Si todo falla, se muestra el último valor guardado en este navegador.
import { useEffect, useState } from 'react'

const TRM_URL = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2'
const ER_URL  = 'https://open.er-api.com/v6/latest/USD'
const CLAVE_CACHE = 'lrm_divisas'

async function traer(url, ms = 7000) {
  const control = new AbortController()
  const t = setTimeout(() => control.abort(), ms)
  try {
    const r = await fetch(url, { signal: control.signal })
    if (!r.ok) throw new Error(String(r.status))
    return await r.json()
  } finally { clearTimeout(t) }
}

async function dolarOficial() {
  try {
    const d = await traer(TRM_URL)
    if (d?.[0]?.valor) return { hoy: +d[0].valor, ayer: +(d[1]?.valor || d[0].valor), oficial: true }
  } catch { /* sigue con el respaldo */ }
  return null
}

async function cambiosFrankfurter() {
  const desde = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)
  for (const base of ['https://api.frankfurter.dev/v1', 'https://api.frankfurter.app']) {
    try {
      const d = await traer(`${base}/${desde}..?from=USD&to=EUR,CNY`)
      const dias = Object.keys(d.rates || {}).sort()
      if (dias.length) return { hoy: d.rates[dias[dias.length - 1]], ayer: d.rates[dias[dias.length - 2]] || d.rates[dias[dias.length - 1]] }
    } catch { /* probar la siguiente */ }
  }
  return null
}

export function useDivisas() {
  const [divisas, setDivisas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null') } catch { return null }
  })
  useEffect(() => {
    let vivo = true
    ;(async () => {
      const [oficial, cruces, er] = await Promise.all([
        dolarOficial(),
        cambiosFrankfurter(),
        traer(ER_URL).catch(() => null),
      ])
      const erRates = er?.result === 'success' ? er.rates : null
      const usd = oficial || (erRates?.COP ? { hoy: erRates.COP, ayer: erRates.COP, oficial: false } : null)
      if (!usd) return                              // sin conexión: se queda el último valor guardado
      const porDolar = cruces || (erRates ? { hoy: { EUR: erRates.EUR, CNY: erRates.CNY }, ayer: { EUR: erRates.EUR, CNY: erRates.CNY } } : null)

      const lista = [{ id:'USD', nombre:'Dólar', hoy: usd.hoy, ayer: usd.ayer, oficial: usd.oficial }]
      for (const [id, nombre] of [['EUR', 'Euro'], ['CNY', 'Yuan']]) {
        const hoy  = porDolar?.hoy?.[id]  ? usd.hoy  / porDolar.hoy[id]  : null
        const ayer = porDolar?.ayer?.[id] ? usd.ayer / porDolar.ayer[id] : hoy
        lista.push({ id, nombre, hoy, ayer, oficial: false })
      }
      if (!vivo) return
      setDivisas(lista)
      try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(lista)) } catch { /* sin almacenamiento */ }
    })()
    return () => { vivo = false }
  }, [])
  return divisas
}