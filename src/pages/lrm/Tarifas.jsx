// @ts-nocheck
// LRM Trade Consulting · Tarifas
// Dos cosas separadas:
//   1) MIS COSTOS (tabla maestra): lo que te cobra cada bodega por categoría. Uno solo para todos los clientes.
//      Se guarda en lrm_ajustes, clave 'costos'.
//   2) PRECIOS AL CLIENTE con escalera de valor:
//      · Escalera general por categoría (lrm_ajustes, clave 'escaleras')
//      · Escalera propia de cada cliente por categoría (lrm_clientes.tarifas). Si el cliente no tiene, usa la general.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export const LB_A_KG = 0.45359237
export const UNIDADES = { kg:'kg', lb:'lb', unidad:'unidades' }
export const UNIDAD_CORTA = { kg:'kg', lb:'lb', unidad:'u' }

// Escaleras de arranque (precio al cliente). unidad: kg | lb | unidad · moneda: COP | USD
export const ESCALERAS_LRM = {
  General:    { unidad:'kg',     moneda:'COP', minimo:0,  escalones:[ { desde:0, precio:24000 }, { desde:100, precio:22000 }, { desde:300, precio:20000 }, { desde:700, precio:19000 } ] },
  Perfumes:   { unidad:'kg',     moneda:'COP', minimo:0,  escalones:[ { desde:0, precio:24000 }, { desde:100, precio:22000 }, { desde:300, precio:20000 }, { desde:700, precio:19000 } ], aiu:true },
  Celulares:  { unidad:'unidad', moneda:'COP', minimo:50, escalones:[ { desde:50, precio:100000 } ] },
  Cosméticos: { unidad:'lb',     moneda:'USD', minimo:0,  escalones:[ { desde:0, precio:3.1 } ] },
}

// Costos de arranque (lo que te cobran). bodega_id null = cualquier bodega
export const COSTOS_LRM = [
  { categoria:'Perfumes',   bodega_id:null, unidad:'kg',     moneda:'USD', valor:5 },
  { categoria:'General',    bodega_id:null, unidad:'kg',     moneda:'USD', valor:5 },
  { categoria:'Celulares',  bodega_id:null, unidad:'unidad', moneda:'COP', valor:65000 },
  { categoria:'Cosméticos', bodega_id:null, unidad:'lb',     moneda:'USD', valor:2.3 },
]

export const copiar = x => JSON.parse(JSON.stringify(x))
export { sinMarca }
export const ordenar = esc => [...(esc?.escalones || [])].sort((a, b) => a.desde - b.desde)
export const escalonDe = (esc, cantidad) => [...esc.escalones].sort((a, b) => b.desde - a.desde).find(e => cantidad >= e.desde) || ordenar(esc)[0]
export const siguienteDe = (esc, cantidad) => ordenar(esc).find(e => e.desde > cantidad)
export const tramoTexto = (esc, e) => { const arr = ordenar(esc); const i = arr.indexOf(e); return arr[i + 1] ? `${fmtN(e.desde)} – ${fmtN(arr[i + 1].desde)}` : `${fmtN(e.desde)}+` }
const fmtN = v => Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })

// Escalera que aplica: la del cliente si la tiene; si no, la general de la categoría; si no, la General
export function escaleraPara(cliente, escaleras, categoria) {
  const propia = cliente?.tarifas?.[categoria]
  if (propia?.escalones?.length) return { esc: propia, fuente: 'cliente' }
  if (escaleras?.[categoria]) return { esc: escaleras[categoria], fuente: 'general' }
  return { esc: escaleras?.General || ESCALERAS_LRM.General, fuente: 'general-base' }
}

// Costo que aplica: bodega + categoría → cualquier bodega + categoría → bodega + General → General → tarifa vieja de la bodega
export function costoPara(costos, bodega, categoria) {
  const lista = costos || []
  const b = bodega?.id || null
  const hit = lista.find(c => c.bodega_id === b && b && c.categoria === categoria)
    || lista.find(c => !c.bodega_id && c.categoria === categoria)
    || lista.find(c => c.bodega_id === b && b && c.categoria === 'General')
    || lista.find(c => !c.bodega_id && c.categoria === 'General')
  if (hit) return hit
  const usd = Number(bodega?.tarifas_usd?.[categoria] || bodega?.tarifas_usd?.Perfumes || 0)
  return usd ? { unidad:'kg', moneda:'USD', valor: usd } : { unidad:'kg', moneda:'USD', valor: 0 }
}

// Lo que se le cobra a una carga guardada
export const cobroCarga = c => {
  const t = Number(c?.tarifa_cliente || 0)
  if (c?.cobro_por === 'unidad') return Number(c.unidades || 0) * t
  if (c?.cobro_por === 'lb') return Number(c.peso_cobrable_kg || 0) / LB_A_KG * t
  return Number(c?.peso_cobrable_kg || 0) * t
}
export const cantidadCobro = c => c?.cobro_por === 'unidad' ? Number(c.unidades || 0)
  : c?.cobro_por === 'lb' ? Number(c.peso_cobrable_kg || 0) / LB_A_KG : Number(c?.peso_cobrable_kg || 0)
export const unidadCobro = c => c?.cobro_por === 'unidad' ? 'unidad' : c?.cobro_por === 'lb' ? 'lb' : 'kg'
// Lo que te cuesta una carga guardada
export const costoCarga = c => c?.costo_total != null && c.costo_total !== ''
  ? Number(c.costo_total)
  : c?.tarifa_costo_usd ? Number(c.libras || 0) * LB_A_KG * Number(c.tarifa_costo_usd) * Number(c.trm || 0)
  : Number(c?.peso_cobrable_kg || 0) * Number(c?.tarifa_costo || 0)

// Carga escaleras generales y tabla de costos
// Precio sugerido = tu costo + margen, redondeado (pesos al mil de arriba, dólares a 10 centavos)
export const MARGEN_SUGERIDO = 30
const redondear = (v, moneda) => moneda === 'USD' ? Math.ceil(v * 10) / 10 : Math.ceil(v / 1000) * 1000
// Escalera de arranque para una categoría que tiene costo pero no tiene escalera de precios
export function escaleraSugerida(costo, margen = MARGEN_SUGERIDO) {
  if (!costo?.valor) return null
  return { unidad: costo.unidad, moneda: costo.moneda, minimo: 0, sugerida: true,
    escalones: [{ desde: costo.unidad === 'unidad' ? 1 : 0, precio: redondear(costo.valor * (1 + Number(margen || 0) / 100), costo.moneda) }] }
}
const sinMarca = e => { if (!e) return e; const { sugerida, ...r } = e; return r }

export function useTarifas() {
  const [propias, setEscaleras] = useState(ESCALERAS_LRM)   // las escaleras que tú guardaste
  const [costos, setCostos] = useState(COSTOS_LRM)
  const [margen, setMargen] = useState(MARGEN_SUGERIDO)
  const [listo, setListo] = useState(false)
  // Toda categoría con costo en la tabla maestra tiene escalera: la tuya, o la sugerida (costo + margen)
  const escaleras = useMemo(() => {
    const out = { ...propias }
    costos.forEach(c => {
      if (!c.categoria || c.categoria === 'General' || out[c.categoria]) return
      const sug = escaleraSugerida(costos.find(x => x.categoria === c.categoria && !x.bodega_id) || c, margen)
      if (sug) out[c.categoria] = sug
    })
    return out
  }, [propias, costos, margen])
  const recargar = async () => {
    const { data } = await supabase.from('lrm_ajustes').select('clave, valor').in('clave', ['escaleras', 'costos', 'margen_sugerido'])
    let crudas = null, hayCostos = false
    ;(data || []).forEach(r => {
      try {
        const v = JSON.parse(r.valor)
        if (r.clave === 'escaleras') { crudas = v; setEscaleras(limpiarEscaleras({ ...ESCALERAS_LRM, ...v })) }
        if (r.clave === 'costos' && Array.isArray(v)) { hayCostos = true; setCostos(v) }
        if (r.clave === 'margen_sugerido' && v !== null && !isNaN(Number(v))) setMargen(Number(v))
      } catch { /* se quedan las de arranque */ }
    })
    // Primera vez: si los costos estaban dentro de las escaleras viejas, se pasan a la tabla maestra
    if (!hayCostos && crudas) {
      const desdeEscaleras = Object.entries(crudas).filter(([, v]) => v?.costo?.valor)
        .map(([categoria, v]) => ({ categoria, bodega_id:null, unidad: v.unidad || 'kg', moneda: v.costo.moneda || 'USD', valor: Number(v.costo.valor) }))
      if (desdeEscaleras.length) setCostos([...desdeEscaleras, ...COSTOS_LRM.filter(c => !desdeEscaleras.some(d => d.categoria === c.categoria))])
    }
    setListo(true)
  }
  useEffect(() => { recargar() }, [])
  // Solo se guardan las que tú definiste o cambiaste; las sugeridas se siguen calculando solas
  const guardarEscaleras = async (nuevas) => {
    const limpias = limpiarEscaleras(Object.fromEntries(Object.entries(nuevas).filter(([, v]) => !v?.sugerida)))
    setEscaleras(limpias)
    return supabase.from('lrm_ajustes').upsert({ clave:'escaleras', valor: JSON.stringify(limpias) })
  }
  const guardarCostos = async (nuevos) => {
    setCostos(nuevos)
    return supabase.from('lrm_ajustes').upsert({ clave:'costos', valor: JSON.stringify(nuevos) })
  }
  const guardarMargen = async (m) => {
    setMargen(Number(m) || 0)
    return supabase.from('lrm_ajustes').upsert({ clave:'margen_sugerido', valor: JSON.stringify(Number(m) || 0) })
  }
  return { escaleras, propias, costos, margen, listo, recargar, guardarEscaleras, guardarCostos, guardarMargen }
}

// Las escaleras viejas traían el costo adentro: ahora el costo vive en la tabla maestra
function limpiarEscaleras(e) {
  const out = {}
  Object.entries(e || {}).forEach(([k, v]) => { if (v?.escalones?.length) { const { costo, ...resto } = v; out[k] = resto } })
  return out
}