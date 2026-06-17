// @ts-nocheck
import { useState, useEffect, useRef } from 'react'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

const iStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
}
const taStyle = { ...iStyle, resize:'none', lineHeight:1.6 }

// ─── DATOS BASE — extraídos del Plan Maestro ZABÚ, nada inventado ────────────
const DATOS_INIT = {
  resumen: {
    nombre: 'ZABÚ',
    slogan: 'Street food premium',
    queEs: 'Marca de street food premium especializada inicialmente en hot dogs de autor, construida bajo un modelo de operación simplificada y altamente replicable.',
    vision: 'Convertirse en la marca líder de hot dogs premium del Caribe colombiano y posteriormente expandirse a nivel nacional.',
    mision: 'Ofrecer una experiencia gastronómica rápida, diferenciada y consistente, combinando la esencia de la comida callejera con procesos de cadena organizada.',
    fechaApertura: '2026-08-01',
    ciudad: 'Barranquilla',
    zona: 'Norte de Barranquilla',
  },

  mercado: {
    competidoresDirectos: 'Carritos tradicionales. Perros de esquina. Negocios de comida rápida local.',
    competidoresIndirectos: 'Hamburgueserías. Pizzerías. Sandwiches. Comida rápida de centros comerciales.',
    debilidadesProducto: 'Calidad inconsistente. Ingredientes variables.',
    debilidadesImagen: 'Sin marca. Sin identidad visual.',
    debilidadesServicio: 'Tiempos lentos. Atención variable.',
    debilidadesOperacion: 'Sin procesos. Sin métricas.',
    debilidadesMarketing: 'Dependencia exclusiva de ubicación.',
  },

  dofa: {
    fortalezas: ['Cream Code exclusiva', 'Piña caramelizada diferenciadora', 'Pan New England Roll', 'Modelo simple', 'Ticket promedio alto', 'Marca construida desde cero'],
    oportunidades: ['Crecimiento del street food premium', 'Consumidor dispuesto a pagar por experiencias', 'Redes sociales', 'Eventos corporativos', 'Ferias gastronómicas'],
    debilidades: ['Marca nueva', 'Sin historial operativo', 'Dependencia inicial de una sola unidad'],
    amenazas: ['Copias rápidas', 'Incremento de costos', 'Cambios regulatorios', 'Aparición de cadenas similares'],
  },

  diferencial: {
    noSer: 'No competir por precio.',
    producto: 'Hot dog con identidad propia.',
    experiencia: 'Preparación visible.',
    marca: 'Imagen limpia y moderna.',
    operacion: 'Velocidad.',
    consistencia: 'Siempre igual.',
  },

  validacion: {
    producto: 'Gramajes exactos. Rendimientos. Costos reales.',
    operacionTiempo: 'Tiempo de armado.',
    metaArmado: 'Menos de 90 segundos por unidad.',
    produccionDiaria: '',
    produccionSemanal: '',
    capacidadMaxima: '',
  },

  menu: [
    { nombre:'ZABÚ',         tipo:'Producto principal', precio:16000, desc:'Hot dog de autor — receta base' },
    { nombre:'ZABÚ Combo',   tipo:'Combo',               precio:20000, desc:'ZABÚ + bebida' },
    { nombre:'Extra Queso',  tipo:'Extra',               precio:0,     desc:'Adición' },
    { nombre:'Extra Tocineta',tipo:'Extra',              precio:0,     desc:'Adición' },
    { nombre:'Extra Piña',   tipo:'Extra',               precio:0,     desc:'Piña caramelizada — adición' },
    { nombre:'Burger ZABÚ',  tipo:'Futuro',              precio:24000, desc:'Próximo lanzamiento' },
    { nombre:'Burger Combo', tipo:'Futuro',              precio:27500, desc:'Burger + bebida — próximo lanzamiento' },
  ],

  marketing: {
    redes: [
      { red:'Instagram', usuario:'@zabuhotdogs', dominio:'', estado:'Por crear' },
      { red:'TikTok',    usuario:'@zabuhotdogs', dominio:'', estado:'Por crear' },
      { red:'Meta (Facebook)', usuario:'ZABÚ Hot Dogs', dominio:'', estado:'Por crear' },
      { red:'Dominio web', usuario:'zabuhotdogs.com', dominio:'zabuhotdogs.com', estado:'Por comprar' },
    ],
    estrategiaGeneral: 'Construir comunidad alrededor de contenido auténtico y crudo, no campañas publicitarias pulidas. En 2026 el contenido genuino y la teatralidad del proceso (corte, fuego, armado) superan al producto fotografiado de forma estática.',
    formatosClave: [
      { formato:'Cross-section reveal', desc:'Corte transversal del ZABÚ mostrando capas: pan, salchicha, Cream Code, piña caramelizada. Formato de mayor enganche en food content 2026.' },
      { formato:'Char, smoke & flame', desc:'Video del armado en la plancha con humo y sonido — teatralidad del proceso de cocción, alta retención en TikTok.' },
      { formato:'Step-by-step 15-30s', desc:'De ingrediente crudo a producto terminado en menos de 30 segundos, ritmo rápido, corte seco.' },
      { formato:'UGC / Testimonios reales', desc:'Reposeo de clientes reales comiendo y reaccionando — genera más confianza que cualquier influencer pagado.' },
      { formato:'Detrás de cámaras', desc:'Construcción del carrito, pruebas de receta, bloopers — humaniza la marca antes de abrir.' },
    ],
    pilaresContenido: [
      { pilar:'Producto', frecuencia:'3x semana', ejemplo:'Cross-section reveal, armado en cámara lenta, extras (queso derretido, tocineta crocante)' },
      { pilar:'Proceso / Detrás de cámaras', frecuencia:'2x semana', ejemplo:'Construcción del carrito, pruebas de Cream Code, día a día previo a apertura' },
      { pilar:'Comunidad / UGC', frecuencia:'2x semana', ejemplo:'Reposts de clientes, reacciones reales, encuestas en Stories ("¿Cuál extra preferirías?")' },
      { pilar:'Marca / Storytelling', frecuencia:'1x semana', ejemplo:'Historia de origen de ZABÚ, por qué Cream Code, por qué el pan New England Roll' },
    ],
    hashtags: '#ZABUHotDogs #StreetFoodBarranquilla #HotDogsPremium #BarranquillaFoodie #ComidaCallejeraBQ #CreamCode',
    influenciadores: 'Buscar creadores gastronómicos locales de Barranquilla con audiencia real (no solo número de seguidores) — priorizar engagement sobre alcance. Invitar a probar antes de la apertura oficial para generar contenido orgánico previo al lanzamiento.',
    planLanzamiento: 'Primer fin de semana con promoción de apertura. Influenciadores locales invitados días antes para generar expectativa. Evento de apertura documentado en vivo (Stories + Reels simultáneos).',
    calendarioPostApertura: 'Calendario mensual de contenido. Reels (producto + proceso). Historias diarias (operación, promos, encuestas). Testimonios de clientes recurrentes destacados semanalmente.',
    metricas: 'Alcance por formato, tasa de guardado (saves) en Reels, conversión de seguidores a visitas al carrito, UGC generado por semana.',
  },

  visual: {
    logo: 'Por definir — diseñador contratado',
    tipografia: 'Por definir',
    uniformes: 'Por definir',
    empaques: 'Por definir',
    carrito: 'Por definir',
  },

  operativo: {
    horario: 'Martes a domingo',
    personal: '2 personas por carrito',
    salarioDiario: 70000,
    carritos: [
      { nombre:'Carrito 1 — Apertura', ubicacion:'Por confirmar — Norte de Barranquilla', fecha:'2026-08-01', estado:'En definición' },
      { nombre:'Carrito 2', ubicacion:'Por definir', fecha:'2026-09-01', estado:'Planificado' },
      { nombre:'Carrito 3', ubicacion:'Por definir', fecha:'2026-10-01', estado:'Planificado' },
    ],
  },

  equipamiento: {
    cocina: ['Plancha', 'Sistema de gas'],
    conservacion: ['Nevera o hielera profesional'],
    servicio: ['Dispensadores', 'Pinzas', 'Recipientes GN', 'Tablas', 'Cuchillos'],
    higiene: ['Guantes', 'Alcohol', 'Toallas', 'Basureros'],
  },

  financiero: {
    inversion: [
      { concepto:'Carrito',              monto:8000000 },
      { concepto:'Equipos de cocina',    monto:3500000 },
      { concepto:'Branding e identidad', monto:2000000 },
      { concepto:'Inventario inicial',   monto:2500000 },
      { concepto:'Capital de trabajo (4 semanas)', monto:4000000 },
      { concepto:'Permisos y legalización', monto:500000 },
      { concepto:'Imprevistos (10%)',    monto:2050000 },
    ],
    costosOp: [
      { concepto:'Insumos y materia prima', monto:5832000 },
      { concepto:'Nómina (2 personas × $70K/día)', monto:3500000 },
      { concepto:'Arriendo punto',          monto:800000 },
      { concepto:'Empaque y desechables',   monto:400000 },
      { concepto:'Servicios y otros',       monto:300000 },
      { concepto:'Marketing digital',       monto:300000 },
    ],
    precioPromedio: 18500,
    metaDiariaNormal: 45,
    diasMes: 26, // martes a domingo
  },

  escenarios: [
    { nombre:'Malo',   rango:'20–25 perros/día', valor:22 },
    { nombre:'Normal', rango:'40–50 perros/día', valor:45 },
    { nombre:'Fuerte',  rango:'70+ perros/día',   valor:75 },
  ],

  indicadores: {
    ticketPromedioMeta: 20000,
    conversionComboMeta: 60,
    metaArmadoSeg: 90,
  },

  escalamiento: [
    { etapa:'Etapa 1', titulo:'Primer carrito', desc:'Validación del modelo, receta y operación.' },
    { etapa:'Etapa 2', titulo:'Segundo carrito', desc:'Replicar aprendizajes de la etapa 1.' },
    { etapa:'Etapa 3', titulo:'3–5 carritos', desc:'Escalar operación con procesos ya probados.' },
    { etapa:'Etapa 4', titulo:'Islas', desc:'Formato de punto fijo en mayor tráfico.' },
    { etapa:'Etapa 5', titulo:'Locales', desc:'Formato de tienda física completa.' },
  ],

  preguntasCriticas: [
    { pregunta:'¿Dónde se ubicará exactamente el carrito?', razon:'La ubicación puede duplicar o partir por la mitad las ventas.', respuesta:'' },
    { pregunta:'¿Cuántos perros puede producir una persona por hora?', razon:'Esto define la capacidad máxima.', respuesta:'' },
    { pregunta:'¿Cuál es el costo real terminado del ZABÚ?', razon:'No estimado. Real.', respuesta:'' },
    { pregunta:'¿Cuál será la tasa de conversión a combo?', razon:'Si es 30% o 80%, cambia completamente los números.', respuesta:'' },
    { pregunta:'¿Cuál es el ticket promedio real después de extras?', razon:'Aquí está gran parte de la utilidad.', respuesta:'' },
  ],

  riesgos: [
    { riesgo:'Bajo flujo de clientes en la ubicación',  probabilidad:'Media', impacto:'Alto',  mitigacion:'Validar tráfico antes de firmar. Plan B de reubicación rápida.' },
    { riesgo:'Copias rápidas del concepto',              probabilidad:'Media', impacto:'Medio', mitigacion:'Cream Code y piña caramelizada como diferenciadores difíciles de copiar exactamente. Marca fuerte desde el día uno.' },
    { riesgo:'Incremento en costos de insumos',          probabilidad:'Media', impacto:'Medio', mitigacion:'Contratos de suministro con precio fijo. Proveedor alterno identificado.' },
    { riesgo:'Cambios regulatorios',                     probabilidad:'Baja',  impacto:'Medio', mitigacion:'Permisos al día, monitoreo de normativa de espacio público.' },
    { riesgo:'Aparición de cadenas similares',           probabilidad:'Media', impacto:'Alto',  mitigacion:'Velocidad de expansión y consistencia operativa como barrera de entrada.' },
  ],

  equipo: [
    { nombre:'Luis Restrepo',  rol:'Director Comercial / Fundador', resp:'Estrategia, finanzas, operación general, aprobaciones.' },
    { nombre:'Emelyn Mendoza', rol:'Directora de Compras y Visual',  resp:'Proveedores, imagen de marca, presentación del producto.' },
    { nombre:'Por contratar',  rol:'Operador Carrito 1',             resp:'Operación diaria, atención al cliente, ventas.' },
    { nombre:'Por contratar',  rol:'Apoyo carrito',                  resp:'Armado, caja, reabastecimiento.' },
  ],
}

// ─── helpers de cálculo financiero ───────────────────────────────────────────
function calcFinanciero(d) {
  const totalInversion  = d.financiero.inversion.reduce((s,i)=>s+i.monto,0)
  const totalCostosOp   = d.financiero.costosOp.reduce((s,c)=>s+c.monto,0)
  const ingresoMensual  = d.financiero.precioPromedio * d.financiero.metaDiariaNormal * d.financiero.diasMes
  const utilidadMensual = ingresoMensual - totalCostosOp
  const mesesROI = utilidadMensual > 0 ? Math.ceil(totalInversion / utilidadMensual) : '—'
  return { totalInversion, totalCostosOp, ingresoMensual, utilidadMensual, mesesROI }
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE PDF — visible siempre en el DOM (fuera de pantalla), no display:none
// ════════════════════════════════════════════════════════════════════════════
function PDFTemplate({ datos }) {
  const d = datos
  const { totalInversion, totalCostosOp, ingresoMensual, utilidadMensual, mesesROI } = calcFinanciero(d)

  const s = {
    page:    { padding:'32px 40px', background:'#ffffff', color:'#111', fontFamily:'Arial, sans-serif', width:'210mm', minHeight:'297mm', boxSizing:'border-box', margin:'0 auto' },
    h2:      { fontSize:18, fontWeight:800, color:'#C9A84C', borderBottom:'2px solid #C9A84C', paddingBottom:6, marginBottom:16, marginTop:0 },
    h3:      { fontSize:13, fontWeight:700, color:'#333', marginBottom:8, marginTop:16 },
    p:       { fontSize:11, lineHeight:1.7, color:'#444', marginBottom:8 },
    kpi:     { background:'#f8f4ec', border:'1px solid #C9A84C', borderRadius:8, padding:'12px 16px', textAlign:'center', flex:1 },
    kpiVal:  { fontSize:18, fontWeight:900, color:'#C9A84C' },
    kpiLbl:  { fontSize:9, color:'#888', textTransform:'uppercase', letterSpacing:1, marginTop:4 },
    table:   { width:'100%', borderCollapse:'collapse', fontSize:10, marginBottom:12 },
    th:      { background:'#C9A84C', color:'white', padding:'6px 10px', textAlign:'left', fontWeight:700 },
    td:      { padding:'6px 10px', borderBottom:'1px solid #eee', verticalAlign:'top' },
    tdAlt:   { padding:'6px 10px', borderBottom:'1px solid #eee', background:'#faf9f7', verticalAlign:'top' },
    badge:   (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700, background:color+'22', color, border:`1px solid ${color}44` }),
    divider: { borderTop:'1px solid #eee', margin:'16px 0' },
    footer:  { borderTop:'2px solid #C9A84C', paddingTop:10, marginTop:20, display:'flex', justifyContent:'space-between', fontSize:9, color:'#888' },
    li:      { fontSize:11, color:'#444', lineHeight:1.8, marginBottom:4 },
  }

  const Page = ({ children, num }) => (
    <div className="pdf-page" style={s.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:10, borderBottom:'2px solid #C9A84C' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🌭</div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:'#C9A84C' }}>ZABÚ</div>
            <div style={{ fontSize:8, color:'#888', letterSpacing:1 }}>STREET FOOD PREMIUM</div>
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:9, color:'#aaa' }}>
          <div>Plan Maestro de Negocio</div>
          <div>Barranquilla, Colombia · 2026</div>
        </div>
      </div>
      {children}
      <div style={s.footer}>
        <span>ZABÚ · Plan de Negocio Confidencial</span>
        <span>Página {num}</span>
      </div>
    </div>
  )

  return (
    <div id="zabu-plan-pdf">
      {/* PORTADA */}
      <div className="pdf-page" style={{ width:'210mm', minHeight:'297mm', boxSizing:'border-box', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'#0a0a0a', color:'white', padding:'40px', margin:'0 auto' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🌭</div>
        <div style={{ fontSize:48, fontWeight:900, color:'#C9A84C', letterSpacing:-2, marginBottom:8 }}>ZABÚ</div>
        <div style={{ fontSize:16, color:'rgba(255,255,255,0.6)', letterSpacing:4, marginBottom:40 }}>STREET FOOD PREMIUM</div>
        <div style={{ width:60, height:2, background:'#C9A84C', marginBottom:40 }} />
        <div style={{ fontSize:26, fontWeight:800, color:'white', marginBottom:8 }}>Plan Maestro de Negocio</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:60 }}>15 módulos · Barranquilla · 2026</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          {d.resumen.ciudad}, Colombia · {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}<br/>
          Preparado por: Luis Restrepo &amp; Emelyn Mendoza
        </div>
      </div>

      {/* PAG 2 — RESUMEN + MERCADO */}
      <Page num={2}>
        <div style={s.h2}>Módulo 1 · Resumen Ejecutivo</div>
        <p style={s.p}><strong>¿Qué es ZABÚ?</strong> {d.resumen.queEs}</p>
        <p style={s.p}><strong>Visión:</strong> {d.resumen.vision}</p>
        <p style={s.p}><strong>Misión:</strong> {d.resumen.mision}</p>
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          {[
            { val:cop(calcFinanciero(d).totalInversion), lbl:'Inversión total' },
            { val:cop(calcFinanciero(d).ingresoMensual), lbl:'Ingreso mensual est.' },
            { val:String(calcFinanciero(d).mesesROI)+'m', lbl:'Retorno inversión' },
          ].map(k=>(
            <div key={k.lbl} style={s.kpi}><div style={s.kpiVal}>{k.val}</div><div style={s.kpiLbl}>{k.lbl}</div></div>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 2 · Análisis de Mercado</div>
        <div style={s.h3}>Competidores directos</div>
        <p style={s.p}>{d.mercado.competidoresDirectos}</p>
        <div style={s.h3}>Competidores indirectos</div>
        <p style={s.p}>{d.mercado.competidoresIndirectos}</p>
        <div style={s.h3}>Debilidades comunes de la competencia</div>
        <table style={s.table}>
          <tbody>
            {[
              ['Producto', d.mercado.debilidadesProducto],
              ['Imagen', d.mercado.debilidadesImagen],
              ['Servicio', d.mercado.debilidadesServicio],
              ['Operación', d.mercado.debilidadesOperacion],
              ['Marketing', d.mercado.debilidadesMarketing],
            ].map((r,i)=>(
              <tr key={i}><td style={{...s.td,fontWeight:700,width:'25%',background:'#f8f4ec'}}>{r[0]}</td><td style={s.td}>{r[1]}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 3 — DOFA + DIFERENCIAL */}
      <Page num={3}>
        <div style={s.h2}>Módulo 3 · Análisis DOFA</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { titulo:'Fortalezas', color:'#4caf50', items:d.dofa.fortalezas },
            { titulo:'Oportunidades', color:'#378ADD', items:d.dofa.oportunidades },
            { titulo:'Debilidades', color:'#FF9800', items:d.dofa.debilidades },
            { titulo:'Amenazas', color:'#e05252', items:d.dofa.amenazas },
          ].map(b=>(
            <div key={b.titulo}>
              <div style={{ fontSize:12, fontWeight:800, color:b.color, marginBottom:6 }}>{b.titulo}</div>
              <ul style={{ margin:0, paddingLeft:18 }}>
                {b.items.map((it,i)=><li key={i} style={s.li}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 4 · Factor Diferencial</div>
        <p style={s.p}><strong>Lo que NO debe ser:</strong> {d.diferencial.noSer}</p>
        <table style={s.table}>
          <tbody>
            {[
              ['Producto', d.diferencial.producto],
              ['Experiencia', d.diferencial.experiencia],
              ['Marca', d.diferencial.marca],
              ['Operación', d.diferencial.operacion],
              ['Consistencia', d.diferencial.consistencia],
            ].map((r,i)=>(
              <tr key={i}><td style={{...s.td,fontWeight:700,width:'25%',background:'#f8f4ec'}}>{r[0]}</td><td style={s.td}>{r[1]}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 5 · Validación Antes de Abrir</div>
        <p style={s.p}><strong>Producto a validar:</strong> {d.validacion.producto}</p>
        <p style={s.p}><strong>Meta de armado:</strong> {d.validacion.metaArmado}</p>
        <table style={s.table}>
          <tbody>
            <tr><td style={{...s.td,fontWeight:700,width:'30%',background:'#f8f4ec'}}>Producción diaria</td><td style={s.td}>{d.validacion.produccionDiaria||'Por determinar'}</td></tr>
            <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>Producción semanal</td><td style={s.td}>{d.validacion.produccionSemanal||'Por determinar'}</td></tr>
            <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>Capacidad máxima</td><td style={s.td}>{d.validacion.capacidadMaxima||'Por determinar'}</td></tr>
          </tbody>
        </table>
      </Page>

      {/* PAG 4 — MENÚ + PRECIOS */}
      <Page num={4}>
        <div style={s.h2}>Módulo 6 · Menú</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Producto</th><th style={s.th}>Tipo</th><th style={s.th}>Precio</th><th style={s.th}>Descripción</th></tr></thead>
          <tbody>
            {d.menu.map((p,i)=>(
              <tr key={i}>
                <td style={i%2===0?s.td:s.tdAlt}><strong>{p.nombre}</strong></td>
                <td style={i%2===0?s.td:s.tdAlt}>{p.tipo}</td>
                <td style={i%2===0?s.td:s.tdAlt}>{p.precio>0?cop(p.precio):'—'}</td>
                <td style={i%2===0?s.td:s.tdAlt}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 11 · Equipamiento</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { titulo:'Cocina', items:d.equipamiento.cocina },
            { titulo:'Conservación', items:d.equipamiento.conservacion },
            { titulo:'Servicio', items:d.equipamiento.servicio },
            { titulo:'Higiene', items:d.equipamiento.higiene },
          ].map(b=>(
            <div key={b.titulo}>
              <div style={{ fontSize:12, fontWeight:800, color:'#C9A84C', marginBottom:6 }}>{b.titulo}</div>
              <ul style={{ margin:0, paddingLeft:18 }}>{b.items.map((it,i)=><li key={i} style={s.li}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </Page>

      {/* PAG 5 — MARKETING */}
      <Page num={5}>
        <div style={s.h2}>Módulo 8 · Plan de Marketing</div>
        <div style={s.h3}>Presencia digital</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Red</th><th style={s.th}>Usuario / Dominio</th><th style={s.th}>Estado</th></tr></thead>
          <tbody>
            {d.marketing.redes.map((r,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{r.red}</td><td style={i%2===0?s.td:s.tdAlt}>{r.usuario}</td><td style={i%2===0?s.td:s.tdAlt}><span style={s.badge('#FF9800')}>{r.estado}</span></td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.h3}>Estrategia general</div>
        <p style={s.p}>{d.marketing.estrategiaGeneral}</p>

        <div style={s.h3}>Formatos de contenido clave (tendencia 2026)</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Formato</th><th style={s.th}>Descripción</th></tr></thead>
          <tbody>
            {d.marketing.formatosClave.map((f,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{f.formato}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{f.desc}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.h3}>Pilares de contenido</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Pilar</th><th style={s.th}>Frecuencia</th><th style={s.th}>Ejemplo</th></tr></thead>
          <tbody>
            {d.marketing.pilaresContenido.map((p,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{p.pilar}</td><td style={i%2===0?s.td:s.tdAlt}>{p.frecuencia}</td><td style={i%2===0?s.td:s.tdAlt}>{p.ejemplo}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 6 — MARKETING (cont) + IDENTIDAD VISUAL */}
      <Page num={6}>
        <div style={s.h2}>Plan de Marketing (continuación)</div>
        <div style={s.h3}>Hashtags base</div>
        <p style={s.p}>{d.marketing.hashtags}</p>
        <div style={s.h3}>Influenciadores</div>
        <p style={s.p}>{d.marketing.influenciadores}</p>
        <div style={s.h3}>Plan de lanzamiento</div>
        <p style={s.p}>{d.marketing.planLanzamiento}</p>
        <div style={s.h3}>Calendario post-apertura</div>
        <p style={s.p}>{d.marketing.calendarioPostApertura}</p>
        <div style={s.h3}>Métricas a monitorear</div>
        <p style={s.p}>{d.marketing.metricas}</p>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 9 · Identidad Visual</div>
        <table style={s.table}>
          <tbody>
            {[
              ['Logo', d.visual.logo], ['Tipografía', d.visual.tipografia],
              ['Uniformes', d.visual.uniformes], ['Empaques', d.visual.empaques], ['Carrito', d.visual.carrito],
            ].map((r,i)=>(
              <tr key={i}><td style={{...s.td,fontWeight:700,width:'25%',background:'#f8f4ec'}}>{r[0]}</td><td style={s.td}>{r[1]}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 7 — OPERACIÓN + FINANCIERO */}
      <Page num={7}>
        <div style={s.h2}>Módulo 10 · Operación</div>
        <p style={s.p}><strong>Horario:</strong> {d.operativo.horario}</p>
        <p style={s.p}><strong>Personal:</strong> {d.operativo.personal} · {cop(d.operativo.salarioDiario)}/día cada uno</p>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Carrito</th><th style={s.th}>Ubicación</th><th style={s.th}>Fecha</th><th style={s.th}>Estado</th></tr></thead>
          <tbody>
            {d.operativo.carritos.map((c,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{c.nombre}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{c.ubicacion}</td><td style={i%2===0?s.td:s.tdAlt}>{c.fecha}</td><td style={i%2===0?s.td:s.tdAlt}><span style={s.badge('#C9A84C')}>{c.estado}</span></td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 12-13 · Inversión y Proyección Financiera</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={s.h3}>Inversión inicial</div>
            <table style={s.table}>
              <tbody>
                {d.financiero.inversion.map((item,i)=>(
                  <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{item.concepto}</td><td style={i%2===0?s.td:s.tdAlt}><strong>{cop(item.monto)}</strong></td></tr>
                ))}
                <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>TOTAL</td><td style={{...s.td,fontWeight:900,color:'#C9A84C',background:'#f8f4ec'}}>{cop(calcFinanciero(d).totalInversion)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div style={s.h3}>Costos operativos / mes</div>
            <table style={s.table}>
              <tbody>
                {d.financiero.costosOp.map((item,i)=>(
                  <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{item.concepto}</td><td style={i%2===0?s.td:s.tdAlt}><strong>{cop(item.monto)}</strong></td></tr>
                ))}
                <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>TOTAL</td><td style={{...s.td,fontWeight:900,color:'#e05252',background:'#f8f4ec'}}>{cop(calcFinanciero(d).totalCostosOp)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </Page>

      {/* PAG 8 — ESCENARIOS + INDICADORES + RIESGOS */}
      <Page num={8}>
        <div style={s.h2}>Módulo 13 · Escenarios de Proyección</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Escenario</th><th style={s.th}>Rango diario</th><th style={s.th}>Ingreso mensual est.</th></tr></thead>
          <tbody>
            {d.escenarios.map((e,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{e.nombre}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{e.rango}</td><td style={i%2===0?s.td:s.tdAlt}>{cop(e.valor*d.financiero.precioPromedio*d.financiero.diasMes)}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 14 · Indicadores</div>
        <table style={s.table}>
          <tbody>
            <tr><td style={{...s.td,fontWeight:700,width:'40%',background:'#f8f4ec'}}>Ticket promedio meta</td><td style={s.td}>{cop(d.indicadores.ticketPromedioMeta)}</td></tr>
            <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>Conversión a combo meta</td><td style={s.td}>{d.indicadores.conversionComboMeta}%</td></tr>
            <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>Meta tiempo de armado</td><td style={s.td}>{d.indicadores.metaArmadoSeg} segundos</td></tr>
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Análisis de Riesgos</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Riesgo</th><th style={s.th}>Prob.</th><th style={s.th}>Impacto</th><th style={s.th}>Mitigación</th></tr></thead>
          <tbody>
            {d.riesgos.map((r,i)=>(
              <tr key={i}>
                <td style={i%2===0?s.td:s.tdAlt}>{r.riesgo}</td>
                <td style={i%2===0?s.td:s.tdAlt}><span style={s.badge(r.probabilidad==='Alta'?'#e05252':r.probabilidad==='Media'?'#FF9800':'#4caf50')}>{r.probabilidad}</span></td>
                <td style={i%2===0?s.td:s.tdAlt}><span style={s.badge(r.impacto==='Alto'?'#e05252':r.impacto==='Medio'?'#FF9800':'#4caf50')}>{r.impacto}</span></td>
                <td style={i%2===0?s.td:s.tdAlt}>{r.mitigacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 9 — PREGUNTAS CRÍTICAS + ESCALAMIENTO + EQUIPO */}
      <Page num={9}>
        <div style={s.h2}>Preguntas Críticas Antes de Arrancar</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Pregunta</th><th style={s.th}>Por qué importa</th><th style={s.th}>Respuesta</th></tr></thead>
          <tbody>
            {d.preguntasCriticas.map((p,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{p.pregunta}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{p.razon}</td><td style={i%2===0?s.td:s.tdAlt}>{p.respuesta||'⏳ Pendiente'}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Módulo 15 · Plan de Escalamiento</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Etapa</th><th style={s.th}>Título</th><th style={s.th}>Descripción</th></tr></thead>
          <tbody>
            {d.escalamiento.map((e,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{e.etapa}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{e.titulo}</td><td style={i%2===0?s.td:s.tdAlt}>{e.desc}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />
        <div style={s.h2}>Equipo</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Nombre</th><th style={s.th}>Rol</th><th style={s.th}>Responsabilidades</th></tr></thead>
          <tbody>
            {d.equipo.map((e,i)=>(
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{e.nombre}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{e.rol}</td><td style={i%2===0?s.td:s.tdAlt}>{e.resp}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign:'center', padding:'20px', background:'#f8f4ec', borderRadius:8, border:'2px solid #C9A84C', marginTop:16 }}>
          <div style={{ fontSize:24, marginBottom:6 }}>🌭</div>
          <div style={{ fontSize:16, fontWeight:900, color:'#C9A84C' }}>ZABÚ — Street Food Premium</div>
          <div style={{ fontSize:10, color:'#888', marginTop:6 }}>Documento confidencial · Sistema CTE — LRM Core</div>
        </div>
      </Page>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — iframe aislado, contenido siempre presente (no display:none)
// ════════════════════════════════════════════════════════════════════════════
function usarExportarPDF() {
  const iframeRef = useRef(null)

  const exportar = (html) => {
    // Crea un iframe oculto con su propio documento — evita el problema de
    // visibility:hidden en ancestros con display:none, porque el iframe
    // tiene su documento independiente y se imprime ese, no el body principal.
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Plan de Negocio ZABÚ</title>
          <style>
            * { box-sizing: border-box; }
            body { margin:0; font-family: Arial, sans-serif; }
            .pdf-page { page-break-after: always; }
            .pdf-page:last-child { page-break-after: avoid; }
            @page { size: A4; margin: 0; }
            table { width:100%; border-collapse: collapse; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 400)
  }

  return { iframeRef, exportar }
}

// ─── MÓDULO PRINCIPAL ─────────────────────────────────────────────────────────
export default function ZabuPlanNegocio() {
  const [datos, setDatos]       = useState(DATOS_INIT)
  const [tab, setTab]           = useState('resumen')
  const [editando, setEditando] = useState(false)
  const pdfHiddenRef            = useRef(null)
  const { exportar }            = usarExportarPDF()

  const update = (seccion, campo, valor) => setDatos(prev => ({ ...prev, [seccion]: { ...prev[seccion], [campo]: valor } }))
  const updateLista = (seccion, idx, campo, valor) => setDatos(prev => {
    const lista = [...prev[seccion]]
    lista[idx] = { ...lista[idx], [campo]: valor }
    return { ...prev, [seccion]: lista }
  })
  const updateDofaItem = (key, idx, valor) => setDatos(prev => {
    const lista = [...prev.dofa[key]]
    lista[idx] = valor
    return { ...prev, dofa: { ...prev.dofa, [key]: lista } }
  })

  const exportarPDF = () => {
    if (pdfHiddenRef.current) exportar(pdfHiddenRef.current.innerHTML)
  }

  const { totalInversion, totalCostosOp, ingresoMensual, utilidadMensual, mesesROI } = calcFinanciero(datos)

  const TABS = [
    { id:'resumen',    label:'📋 Resumen'      },
    { id:'mercado',    label:'📊 Mercado'      },
    { id:'dofa',       label:'⚖️ DOFA'         },
    { id:'diferencial',label:'💎 Diferencial'  },
    { id:'menu',       label:'🌭 Menú'         },
    { id:'marketing',  label:'📱 Marketing'    },
    { id:'visual',     label:'🎨 Visual'       },
    { id:'operativo',  label:'⚙️ Operativo'   },
    { id:'financiero', label:'💰 Financiero'   },
    { id:'riesgos',    label:'⚠️ Riesgos'     },
    { id:'criticas',   label:'❓ Preguntas'    },
    { id:'escalamiento',label:'🚀 Escalamiento'},
    { id:'equipo',     label:'👥 Equipo'       },
    { id:'pdf',        label:'📄 Exportar PDF' },
  ]

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ fontSize:28 }}>🌭</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>Plan Maestro de Negocio ZABÚ</div>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>15 módulos · Barranquilla 2026 · Documento vivo — editable en tiempo real</div>
        </div>
        <button onClick={exportarPDF} style={{ padding:'10px 20px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, background:'rgba(224,82,82,0.15)', border:'1px solid rgba(224,82,82,0.4)', color:'var(--red)', fontFamily:'inherit' }}>
          📄 Exportar PDF
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Inversión total',   val:cop(totalInversion),  color:'var(--gold)' },
          { label:'Ingreso est./mes',  val:cop(ingresoMensual),  color:'var(--green)' },
          { label:'Utilidad est./mes', val:cop(utilidadMensual), color:utilidadMensual>0?'var(--green)':'var(--red)' },
          { label:'Retorno inversión', val:`${mesesROI} meses`,  color:'var(--blue)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}
            style={t.id==='pdf'?{background:'rgba(224,82,82,0.1)',borderColor:'rgba(224,82,82,0.3)',color:'var(--red)'}:{}}>
            {t.label}
          </div>
        ))}
      </div>

      {/* RESUMEN */}
      {tab==='resumen' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Resumen ejecutivo</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Listo':'✏️ Editar'}</button>
          </div>
          <div className="grid-2" style={{ gap:16, marginBottom:12 }}>
            {[{label:'Nombre',key:'nombre'},{label:'Slogan',key:'slogan'},{label:'Ciudad',key:'ciudad'},{label:'Zona',key:'zona'},{label:'Fecha apertura',key:'fechaApertura',type:'date'}].map(f => (
              <div key={f.key} className="panel">
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:6 }}>{f.label.toUpperCase()}</div>
                {editando ? <input type={f.type||'text'} value={datos.resumen[f.key]} onChange={e=>update('resumen',f.key,e.target.value)} style={iStyle} />
                  : <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{datos.resumen[f.key]}</div>}
              </div>
            ))}
          </div>
          {[{label:'¿Qué es ZABÚ?',key:'queEs'},{label:'Visión',key:'vision'},{label:'Misión',key:'mision'}].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>{f.label.toUpperCase()}</div>
              {editando ? <textarea value={datos.resumen[f.key]} onChange={e=>update('resumen',f.key,e.target.value)} style={{...taStyle,height:60}} />
                : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.resumen[f.key]}</div>}
            </div>
          ))}
        </div>
      )}

      {/* MERCADO */}
      {tab==='mercado' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Análisis de mercado</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Listo':'✏️ Editar'}</button>
          </div>
          {[
            {label:'Competidores directos',key:'competidoresDirectos'},
            {label:'Competidores indirectos',key:'competidoresIndirectos'},
            {label:'Debilidades — Producto',key:'debilidadesProducto'},
            {label:'Debilidades — Imagen',key:'debilidadesImagen'},
            {label:'Debilidades — Servicio',key:'debilidadesServicio'},
            {label:'Debilidades — Operación',key:'debilidadesOperacion'},
            {label:'Debilidades — Marketing',key:'debilidadesMarketing'},
          ].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando ? <textarea value={datos.mercado[f.key]} onChange={e=>update('mercado',f.key,e.target.value)} style={{...taStyle,height:50}} />
                : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.mercado[f.key]}</div>}
            </div>
          ))}
        </div>
      )}

      {/* DOFA */}
      {tab==='dofa' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Análisis DOFA</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Listo':'✏️ Editar'}</button>
          </div>
          <div className="grid-2" style={{ gap:16 }}>
            {[
              { titulo:'Fortalezas', key:'fortalezas', color:'var(--green)' },
              { titulo:'Oportunidades', key:'oportunidades', color:'var(--blue)' },
              { titulo:'Debilidades', key:'debilidades', color:'var(--gold)' },
              { titulo:'Amenazas', key:'amenazas', color:'var(--red)' },
            ].map(b => (
              <div key={b.key} className="panel" style={{ border:`1px solid ${b.color}33` }}>
                <div style={{ fontSize:13, fontWeight:800, color:b.color, marginBottom:10 }}>{b.titulo}</div>
                {datos.dofa[b.key].map((item,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                    <span style={{ color:b.color, fontSize:11 }}>●</span>
                    {editando
                      ? <input type="text" value={item} onChange={e=>updateDofaItem(b.key,i,e.target.value)} style={{...iStyle,marginTop:0,padding:'4px 8px',fontSize:12}} />
                      : <span style={{ fontSize:13, color:'var(--text2)' }}>{item}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIFERENCIAL */}
      {tab==='diferencial' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Factor diferencial</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Listo':'✏️ Editar'}</button>
          </div>
          <div className="panel" style={{ marginBottom:12, border:'1px solid rgba(224,82,82,0.3)' }}>
            <div style={{ fontSize:10, color:'var(--red)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>LO QUE NO DEBE SER</div>
            {editando ? <input type="text" value={datos.diferencial.noSer} onChange={e=>update('diferencial','noSer',e.target.value)} style={iStyle} />
              : <div style={{ fontSize:14, color:'var(--text)', fontWeight:600 }}>{datos.diferencial.noSer}</div>}
          </div>
          {[{label:'Producto',key:'producto'},{label:'Experiencia',key:'experiencia'},{label:'Marca',key:'marca'},{label:'Operación',key:'operacion'},{label:'Consistencia',key:'consistencia'}].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:6, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando ? <input type="text" value={datos.diferencial[f.key]} onChange={e=>update('diferencial',f.key,e.target.value)} style={iStyle} />
                : <div style={{ fontSize:13, color:'var(--text2)' }}>{datos.diferencial[f.key]}</div>}
            </div>
          ))}

          <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginTop:20, marginBottom:12 }}>Validación antes de abrir</div>
          {[{label:'Producto a validar',key:'producto'},{label:'Tiempo de armado',key:'operacionTiempo'},{label:'Meta de armado',key:'metaArmado'}].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:6, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando ? <input type="text" value={datos.validacion[f.key]} onChange={e=>update('validacion',f.key,e.target.value)} style={iStyle} />
                : <div style={{ fontSize:13, color:'var(--text2)' }}>{datos.validacion[f.key]}</div>}
            </div>
          ))}
          <div className="grid-3" style={{ gap:10 }}>
            {[{label:'Producción diaria',key:'produccionDiaria'},{label:'Producción semanal',key:'produccionSemanal'},{label:'Capacidad máxima',key:'capacidadMaxima'}].map(f => (
              <div key={f.key} className="panel">
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:6 }}>{f.label.toUpperCase()}</div>
                <input type="text" value={datos.validacion[f.key]} onChange={e=>update('validacion',f.key,e.target.value)} placeholder="Por determinar" style={{...iStyle,marginTop:0}} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENÚ */}
      {tab==='menu' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Menú</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {datos.menu.map((p,i) => (
              <div key={i} className="panel" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ flex:1 }}>
                  <input type="text" value={p.nombre} onChange={e=>updateLista('menu',i,'nombre',e.target.value)} style={{...iStyle,marginTop:0,fontWeight:700}} />
                </div>
                <div style={{ width:130 }}>
                  <input type="text" value={p.tipo} onChange={e=>updateLista('menu',i,'tipo',e.target.value)} style={{...iStyle,marginTop:0,fontSize:11}} />
                </div>
                <div style={{ width:120 }}>
                  <input type="number" value={p.precio} onChange={e=>updateLista('menu',i,'precio',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:0,fontWeight:700,color:'var(--gold)'}} />
                </div>
                <div style={{ flex:1.5 }}>
                  <input type="text" value={p.desc} onChange={e=>updateLista('menu',i,'desc',e.target.value)} style={{...iStyle,marginTop:0,fontSize:11,color:'var(--text3)'}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKETING */}
      {tab==='marketing' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Plan de marketing</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Estrategia de redes y tendencias de contenido para alimentos en 2026</div>

          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Presencia digital</div>
            {datos.marketing.redes.map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:120, fontSize:12, fontWeight:700, color:'var(--text)' }}>{r.red}</div>
                <input type="text" value={r.usuario} onChange={e=>updateLista('redes',i,'usuario',e.target.value)} style={{...iStyle,marginTop:0,flex:1}} disabled />
                <select value={r.estado} onChange={e=>{
                  const lista=[...datos.marketing.redes]; lista[i]={...lista[i],estado:e.target.value}
                  update('marketing','redes',lista)
                }} style={{...iStyle,marginTop:0,width:140}}>
                  <option>Por crear</option><option>Por comprar</option><option>Creado</option><option>Activo</option>
                </select>
              </div>
            ))}
          </div>

          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Estrategia general 2026</div>
            <textarea value={datos.marketing.estrategiaGeneral} onChange={e=>update('marketing','estrategiaGeneral',e.target.value)} style={{...taStyle,height:70}} />
          </div>

          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Formatos de contenido clave (tendencia 2026)</div>
            {datos.marketing.formatosClave.map((f,i) => (
              <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)', marginBottom:4 }}>{f.formato}</div>
                <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Pilares de contenido</div>
            {datos.marketing.pilaresContenido.map((p,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{p.pilar}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{p.ejemplo}</div>
                </div>
                <span style={{ fontSize:11, padding:'2px 10px', borderRadius:6, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)', flexShrink:0 }}>{p.frecuencia}</span>
              </div>
            ))}
          </div>

          {[
            {label:'Hashtags base',key:'hashtags'},
            {label:'Influenciadores',key:'influenciadores'},
            {label:'Plan de lanzamiento',key:'planLanzamiento'},
            {label:'Calendario post-apertura',key:'calendarioPostApertura'},
            {label:'Métricas a monitorear',key:'metricas'},
          ].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              <textarea value={datos.marketing[f.key]} onChange={e=>update('marketing',f.key,e.target.value)} style={{...taStyle,height:50}} />
            </div>
          ))}
        </div>
      )}

      {/* VISUAL */}
      {tab==='visual' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Identidad visual</div>
          {[{label:'Logo',key:'logo'},{label:'Tipografía',key:'tipografia'},{label:'Uniformes',key:'uniformes'},{label:'Empaques',key:'empaques'},{label:'Carrito',key:'carrito'}].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:6, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              <input type="text" value={datos.visual[f.key]} onChange={e=>update('visual',f.key,e.target.value)} style={{...iStyle,marginTop:0}} />
            </div>
          ))}
        </div>
      )}

      {/* OPERATIVO */}
      {tab==='operativo' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Plan operativo</div>
          <div className="grid-2" style={{ gap:16, marginBottom:16 }}>
            <div className="panel">
              <div className="panel-title">Horario y personal</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Horario</div>
                <input type="text" value={datos.operativo.horario} onChange={e=>update('operativo','horario',e.target.value)} style={{...iStyle,marginTop:4}} />
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Personal</div>
                <input type="text" value={datos.operativo.personal} onChange={e=>update('operativo','personal',e.target.value)} style={{...iStyle,marginTop:4}} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Salario diario por persona</div>
                <input type="number" value={datos.operativo.salarioDiario} onChange={e=>update('operativo','salarioDiario',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:4}} />
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">Menú resumen</div>
              {datos.menu.filter(p=>p.precio>0).map((p,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text2)' }}>{p.nombre}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{cop(p.precio)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">Plan de apertura de carritos</div>
            {datos.operativo.carritos.map((c,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ flex:1 }}>
                  <input type="text" value={c.nombre} onChange={e=>updateLista('operativo',i,'nombre',e.target.value)} style={{...iStyle,marginTop:0,fontWeight:700}} />
                </div>
                <div style={{ flex:1.5 }}>
                  <input type="text" value={c.ubicacion} onChange={e=>{
                    const lista=[...datos.operativo.carritos]; lista[i]={...lista[i],ubicacion:e.target.value}
                    update('operativo','carritos',lista)
                  }} style={{...iStyle,marginTop:0}} />
                </div>
                <div style={{ width:140 }}>
                  <input type="date" value={c.fecha} onChange={e=>{
                    const lista=[...datos.operativo.carritos]; lista[i]={...lista[i],fecha:e.target.value}
                    update('operativo','carritos',lista)
                  }} style={{...iStyle,marginTop:0}} />
                </div>
                <span style={{ fontSize:11, padding:'4px 12px', borderRadius:8, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)', fontWeight:600, marginLeft:10 }}>{c.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCIERO */}
      {tab==='financiero' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Plan financiero</div>
          <div className="grid-2" style={{ gap:16, marginBottom:16 }}>
            <div className="panel">
              <div className="panel-title">Inversión inicial requerida</div>
              {datos.financiero.inversion.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <input type="text" value={item.concepto} onChange={e=>{
                    const lista=[...datos.financiero.inversion]; lista[i]={...lista[i],concepto:e.target.value}
                    update('financiero','inversion',lista)
                  }} style={{...iStyle,marginTop:0,flex:1,fontSize:12}} />
                  <input type="number" value={item.monto} onChange={e=>{
                    const lista=[...datos.financiero.inversion]; lista[i]={...lista[i],monto:parseInt(e.target.value)||0}
                    update('financiero','inversion',lista)
                  }} style={{...iStyle,marginTop:0,width:130,fontWeight:700}} />
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>TOTAL</span>
                <span style={{ fontSize:18, fontWeight:900, color:'var(--gold)' }}>{cop(totalInversion)}</span>
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">Costos operativos mensuales</div>
              {datos.financiero.costosOp.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <input type="text" value={item.concepto} onChange={e=>{
                    const lista=[...datos.financiero.costosOp]; lista[i]={...lista[i],concepto:e.target.value}
                    update('financiero','costosOp',lista)
                  }} style={{...iStyle,marginTop:0,flex:1,fontSize:12}} />
                  <input type="number" value={item.monto} onChange={e=>{
                    const lista=[...datos.financiero.costosOp]; lista[i]={...lista[i],monto:parseInt(e.target.value)||0}
                    update('financiero','costosOp',lista)
                  }} style={{...iStyle,marginTop:0,width:130,fontWeight:700}} />
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>TOTAL</span>
                <span style={{ fontSize:18, fontWeight:900, color:'var(--red)' }}>{cop(totalCostosOp)}</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Parámetros de cálculo</div>
            <div className="grid-3" style={{ gap:10 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Precio promedio</div>
                <input type="number" value={datos.financiero.precioPromedio} onChange={e=>update('financiero','precioPromedio',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:4}} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Meta diaria (normal)</div>
                <input type="number" value={datos.financiero.metaDiariaNormal} onChange={e=>update('financiero','metaDiariaNormal',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:4}} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Días operativos/mes</div>
                <input type="number" value={datos.financiero.diasMes} onChange={e=>update('financiero','diasMes',parseInt(e.target.value)||0)} style={{...iStyle,marginTop:4}} />
              </div>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom:16 }}>
            {[
              { label:'Ingreso bruto/mes',  val:cop(ingresoMensual),  color:'var(--green)' },
              { label:'Costos totales/mes', val:cop(totalCostosOp),   color:'var(--red)'   },
              { label:'Utilidad neta/mes',  val:cop(utilidadMensual), color:utilidadMensual>0?'var(--gold)':'var(--red)' },
              { label:'ROI estimado',       val:`${mesesROI} meses`,  color:'var(--blue)'  },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-title">Escenarios de proyección (Plan Maestro)</div>
            {datos.escenarios.map((e,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:80, fontSize:13, fontWeight:700, color: e.nombre==='Fuerte'?'var(--green)':e.nombre==='Normal'?'var(--gold)':'var(--red)' }}>{e.nombre}</div>
                <input type="text" value={e.rango} onChange={ev=>{
                  const lista=[...datos.escenarios]; lista[i]={...lista[i],rango:ev.target.value}
                  setDatos(p=>({...p,escenarios:lista}))
                }} style={{...iStyle,marginTop:0,width:160,fontSize:12}} />
                <div style={{ flex:1, textAlign:'right', fontSize:13, fontWeight:700, color:'var(--text2)' }}>
                  {cop(e.valor*datos.financiero.precioPromedio*datos.financiero.diasMes)}/mes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RIESGOS */}
      {tab==='riesgos' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Análisis de riesgos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {datos.riesgos.map((r,i) => {
              const colorP = r.probabilidad==='Alta'?'var(--red)':r.probabilidad==='Media'?'var(--gold)':'var(--green)'
              const colorI = r.impacto==='Alto'?'var(--red)':r.impacto==='Medio'?'var(--gold)':'var(--green)'
              return (
                <div key={i} className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', flex:1, marginRight:16 }}>⚠️ {r.riesgo}</div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:`${colorP}15`, color:colorP, border:`0.5px solid ${colorP}44`, fontWeight:700 }}>P: {r.probabilidad}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:`${colorI}15`, color:colorI, border:`0.5px solid ${colorI}44`, fontWeight:700 }}>I: {r.impacto}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}><strong style={{ color:'var(--green)' }}>Mitigación:</strong> {r.mitigacion}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PREGUNTAS CRÍTICAS */}
      {tab==='criticas' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Preguntas críticas antes de arrancar</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Estas 5 preguntas definen el éxito real del negocio más que cualquier receta. Respóndelas con datos reales en cuanto los tengas.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {datos.preguntasCriticas.map((p,i) => (
              <div key={i} className="panel" style={{ border: p.respuesta ? '1px solid var(--green-border)' : '1px solid rgba(224,82,82,0.25)' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{i+1}. {p.pregunta}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10, fontStyle:'italic' }}>{p.razon}</div>
                <textarea value={p.respuesta} onChange={e=>{
                  const lista=[...datos.preguntasCriticas]; lista[i]={...lista[i],respuesta:e.target.value}
                  setDatos(prev=>({...prev,preguntasCriticas:lista}))
                }} placeholder="Respuesta con datos reales..." style={{...taStyle,height:50}} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESCALAMIENTO */}
      {tab==='escalamiento' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Plan de escalamiento</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {datos.escalamiento.map((e,i) => (
              <div key={i} className="panel" style={{ display:'flex', gap:16, alignItems:'center' }}>
                <div style={{ width:80, fontSize:12, fontWeight:700, color:'var(--gold)' }}>{e.etapa}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{e.titulo}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EQUIPO */}
      {tab==='equipo' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Equipo</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {datos.equipo.map((e,i) => (
              <div key={i} className="panel">
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'var(--gold)', flexShrink:0 }}>{e.nombre.charAt(0)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{e.nombre}</div>
                    <div style={{ fontSize:12, color:'var(--gold)', fontWeight:600, marginTop:2 }}>{e.rol}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{e.resp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF */}
      {tab==='pdf' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Exportar Plan Maestro de Negocio</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>PDF de 9 páginas con portada ZABÚ y los 15 módulos del Plan Maestro, generado con tus datos actuales.</div>
          <div className="panel" style={{ marginBottom:16, border:'1px solid var(--gold-border)' }}>
            <div className="panel-title">Contenido del PDF</div>
            {['Portada institucional ZABÚ','Resumen ejecutivo + análisis de mercado','DOFA + factor diferencial + validación','Menú + equipamiento','Plan de marketing (redes, formatos, pilares)','Marketing (continuación) + identidad visual','Operación + inversión y costos','Escenarios + indicadores + riesgos','Preguntas críticas + escalamiento + equipo'].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--green)', fontSize:12 }}>✓</span>
                <span style={{ fontSize:13, color:'var(--text2)' }}>{item}</span>
              </div>
            ))}
          </div>
          <button onClick={exportarPDF} style={{ width:'100%', padding:'16px', borderRadius:12, cursor:'pointer', fontSize:15, fontWeight:800, background:'rgba(224,82,82,0.15)', border:'2px solid rgba(224,82,82,0.4)', color:'var(--red)', fontFamily:'inherit' }}>
            📄 Generar y descargar PDF — Plan Maestro ZABÚ
          </button>
          <div style={{ marginTop:12, fontSize:11, color:'var(--text4)', textAlign:'center' }}>
            Se abrirá el diálogo de impresión del navegador — elige "Guardar como PDF" como destino
          </div>
        </div>
      )}

      {/* Contenedor del template PDF — NUNCA display:none, fuera de la vista con posición */}
      <div ref={pdfHiddenRef} style={{ position:'absolute', left:'-9999px', top:0, width:'210mm' }} aria-hidden="true">
        <PDFTemplate datos={datos} />
      </div>
    </div>
  )
}
