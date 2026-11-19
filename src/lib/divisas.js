// Tasas de cambio contra el peso colombiano: dólar, euro y yuan.
// • Dólar: TRM oficial de la Superintendencia Financiera (datos.gov.co).
// • Euro y yuan: se calculan cruzando la TRM con el cambio del día frente al dólar
//   (Banco Central Europeo, vía Frankfurter). Son valores de referencia.
import { useEffect, useState } from 'react'

const TRM_URL = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2'

async function cambiosDolar() {
  const desde = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)
  for (const base of ['https://api.frankfurter.dev/v1', 'https://api.frankfurter.app']) {
    try {
      const r = await fetch(`${base}/${desde}..?from=USD&to=EUR,CNY`)
      if (!r.ok) continue
      const d = await r.json()
      const dias = Object.keys(d.rates || {}).sort()
      if (dias.length) return { hoy: d.rates[dias[dias.length - 1]], ayer: d.rates[dias[dias.length - 2]] || d.rates[dias[dias.length - 1]] }
    } catch { /* probar la siguiente */ }
  }
  return null
}

export function useDivisas() {
  const [divisas, setDivisas] = useState(null)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      let usd = null
      try {
        const d = await (await fetch(TRM_URL)).json()
        if (d?.[0]?.valor) usd = { hoy: +d[0].valor, ayer: +(d[1]?.valor || d[0].valor) }
      } catch { /* sin conexión */ }
      const cruces = usd ? await cambiosDolar() : null
      const lista = [{ id:'USD', nombre:'Dólar', bandera:'🇺🇸', hoy: usd?.hoy, ayer: usd?.ayer, oficial:true }]
      for (const [id, nombre, bandera] of [['EUR', 'Euro', '🇪🇺'], ['CNY', 'Yuan', '🇨🇳']]) {
        const hoy  = usd && cruces?.hoy?.[id]  ? usd.hoy  / cruces.hoy[id]  : null
        const ayer = usd && cruces?.ayer?.[id] ? usd.ayer / cruces.ayer[id] : hoy
        lista.push({ id, nombre, bandera, hoy, ayer, oficial:false })
      }
      if (vivo) setDivisas(lista)
    })()
    return () => { vivo = false }
  }, [])
  return divisas
}