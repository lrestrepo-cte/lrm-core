// Datos de LRM Trade Consulting para los documentos que van al cliente (cuentas de cobro).
// Se editan en LRM Trade → Ajustes y quedan guardados en lrm_ajustes (claves 'empresa' y 'medios_pago').
// Estos son los valores de arranque mientras no se haya guardado nada.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export const EMPRESA_LRM = {
  nombre: 'LRM Trade Consulting',
  lema: 'Importaciones desde Estados Unidos, China y Panamá',
  responsable: 'Luis Pablo Restrepo Valderrama',
  documento: 'CC 1.082.938.048',
  ciudad: 'Barranquilla, Colombia',
  whatsapp: '+57 301 785 2567',
  correo: 'lrmtradeconsulting@gmail.com',
  condiciones: 'Pago antes de la entrega de la mercancía. Enviar el soporte de pago por WhatsApp.',
}

// Cada medio: tipo (Bancolombia, Nequi, Llave Bre-B, DollarApp…), detalle (número, llave o usuario) y titular.
// Los que tengan el detalle vacío no salen en la cuenta de cobro.
export const MEDIOS_PAGO_LRM = [
  { tipo:'Bancolombia · Ahorros', detalle:'483-865611-01', titular:'Luis Pablo Restrepo Valderrama · CC 1.082.938.048' },
  { tipo:'Nequi',                 detalle:'', titular:'' },
  { tipo:'Llave Bre-B',           detalle:'', titular:'' },
  { tipo:'DollarApp',             detalle:'', titular:'' },
]

// Avisos al cliente en cada etapa de la carga. Variables: {nombre} {mercancia} {cajas} {origen} {dias} {kg} {total} {guia}
export const AVISOS_LRM = {
  bodega:    { asunto:'Recibimos tu mercancía',            texto:'Hola {nombre}, te confirmo que ya recibimos tu mercancía ({cajas} cajas de {mercancia}) en nuestra bodega de {origen}. Te aviso apenas salga hacia Barranquilla.' },
  transito:  { asunto:'Tu mercancía salió hacia Barranquilla', texto:'Hola {nombre}, tu mercancía ({cajas} cajas de {mercancia}) ya salió de {origen} hacia Barranquilla. Puedes estar reclamándola en aproximadamente {dias} días. Te mantengo informado.' },
  aduana:    { asunto:'Tu mercancía llegó a Colombia',      texto:'Hola {nombre}, tu mercancía ya llegó a Colombia. En pocos días la tienes en Barranquilla.' },
  destino:   { asunto:'Tu mercancía está lista · prepárate para el pago', texto:'Hola {nombre}, tu mercancía ya está en Barranquilla y lista para entrega. Prepárate para el pago: son {kg} kg por un total de {total}. Te envío la cuenta de cobro.' },
  entregada: { asunto:'Mercancía entregada',                texto:'Hola {nombre}, tu mercancía fue entregada. ¡Gracias por confiar en LRM Trade Consulting!' },
}
export const DIAS_TRANSITO = { maritimo: 8, aereo: 3 }

// Compatibilidad con la cuenta de cobro anterior
export const DATOS_BANCARIOS_LRM = {
  titular: 'Luis Pablo Restrepo Valderrama', cedula: 'CC 1.082.938.048', banco: 'Bancolombia', tipoCuenta: 'Ahorros', cuenta: '483-865611-01',
}

// Bodega que se crea sola si no hay ninguna
export const BODEGA_POR_DEFECTO = {
  nombre: 'RD Star 1', operador: 'RD Star - Ok Cargo', pais: 'Estados Unidos', ciudad: 'Doral, FL 33126',
  direccion: '1414 NW 82nd Avenue', telefono: '305 592 9990', email: 'rdcorp.gerencia@gmail.com',
  tarifas_usd: { Perfumes: 5 }, aiu_lb_pieza: 2, activa: true,
}

const leerJSON = (txt, porDefecto) => { try { return txt ? JSON.parse(txt) : porDefecto } catch { return porDefecto } }

// Lee empresa y medios de pago guardados (o los de arranque)
export function useDatosLRM() {
  const [datos, setDatos] = useState({ empresa: EMPRESA_LRM, medios: MEDIOS_PAGO_LRM, cargado: false })
  const cargar = async () => {
    const { data } = await supabase.from('lrm_ajustes').select('*').in('clave', ['empresa', 'medios_pago'])
    const de = k => data?.find(x => x.clave === k)?.valor
    setDatos({ empresa: { ...EMPRESA_LRM, ...leerJSON(de('empresa'), {}) }, medios: leerJSON(de('medios_pago'), MEDIOS_PAGO_LRM), cargado: true })
  }
  useEffect(() => { cargar() }, [])
  return { ...datos, recargar: cargar }
}

export async function guardarDatosLRM(empresa, medios) {
  return supabase.from('lrm_ajustes').upsert([
    { clave:'empresa', valor: JSON.stringify(empresa) },
    { clave:'medios_pago', valor: JSON.stringify(medios) },
  ])
}