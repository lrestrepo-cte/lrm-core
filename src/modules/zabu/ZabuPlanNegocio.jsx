import { useState } from 'react'

function cop(n) { return '$' + Math.round(Math.abs(n||0)).toLocaleString('es-CO') }

// ─── DATOS INICIALES ──────────────────────────────────────────────────────────
const DATOS_INIT = {
  // 1. Resumen ejecutivo
  resumen: {
    nombre: 'ZABÚ Hot Dogs',
    slogan: 'Hot Dogs de Verdad',
    mision: 'Ofrecer hot dogs premium con ingredientes de calidad, atención rápida y una experiencia gastronómica diferenciadora en el norte de Barranquilla.',
    vision: 'Ser la cadena de hot dogs de referencia en la Costa Caribe colombiana, con 10 puntos de venta activos antes de 2028.',
    propuestaValor: 'Salchichas premium La Parisienne, salsas artesanales exclusivas (Cream Code™), presentación única y servicio en menos de 3 minutos.',
    fechaApertura: '2026-08-01',
    ciudad: 'Barranquilla',
    zona: 'Norte de Barranquilla',
  },

  // 2. Mercado
  mercado: {
    segmento: 'Jóvenes y adultos de 15 a 45 años, NSE 3-5, zona norte de Barranquilla. Consumidores de comida rápida con disposición a pagar por calidad.',
    tamano: 'Barranquilla cuenta con más de 1.3M de habitantes. La zona norte concentra aproximadamente 350,000 personas en el segmento objetivo.',
    competencia: 'Hot dogs informales sin marca definida, franquicias de comida rápida (Cali Vea, El Corral). ZABÚ se diferencia por calidad premium y precio accesible ($17,000-$22,000).',
    oportunidad: 'Mercado de comida rápida premium en crecimiento. Ausencia de una marca posicionada exclusivamente en hot dogs gourmet en Barranquilla.',
    ventajaComp: 'Receta exclusiva, Cream Code™ como salsa diferenciadora, Salchichas La Parisienne premium, imagen de marca cuidada, operación ágil en carrito.',
  },

  // 3. Modelo de negocio
  modelo: {
    canales: 'Carrito de venta directa en zonas de alto tráfico. WhatsApp para domicilios. Instagram para captación y fidelización.',
    fuentes: 'Venta directa en punto (70%), domicilios (20%), eventos y catering (10%).',
    estructura: 'Costo de salchichas, insumos y empaque (~45% del precio). Nómina operador (1 persona por carrito). Arriendo punto. Servicios públicos mínimos.',
    propuesta: 'Hot dog de calidad a precio justo. Rapidez de servicio. Ambiente premium en formato carrito.',
    socios: 'Proveedor La Parisienne (salchichas), proveedor de insumos (ZaBun™, Cream Code™), diseñador visual y fotógrafo para branding.',
  },

  // 4. Plan operativo
  operativo: {
    carritos: [
      { nombre: 'Carrito 1 — Apertura', ubicacion: 'Por confirmar — Norte Barranquilla', fecha: '2026-08-01', estado: 'En definición', operador: 'Por contratar' },
      { nombre: 'Carrito 2', ubicacion: 'Por definir', fecha: '2026-09-01', estado: 'Planificado', operador: 'Por contratar' },
      { nombre: 'Carrito 3', ubicacion: 'Por definir', fecha: '2026-10-01', estado: 'Planificado', operador: 'Por contratar' },
    ],
    horario: '4:00 PM — 10:00 PM (6 horas operativas)',
    diasOperacion: 'Martes a Domingo',
    equipo: [
      { rol: 'Operador de carrito', cantidad: 1, salario: 1500000 },
      { rol: 'Apoyo logístico / CEDIS', cantidad: 1, salario: 800000 },
    ],
    producto: [
      { nombre: 'ZABÚ Solo',     precio: 17000 },
      { nombre: 'ZABÚ Combo',    precio: 20000 },
      { nombre: 'CheeZabú Solo', precio: 19000 },
      { nombre: 'CheeZabú Combo',precio: 22000 },
    ],
    metaDiaria: 36,
    diasMes: 25,
  },

  // 5. Financiero
  financiero: {
    inversion: [
      { concepto: 'Carrito / Estructura física',       monto: 8000000  },
      { concepto: 'Equipo (parrilla, nevera, utensilios)', monto: 3500000  },
      { concepto: 'Imagen y branding inicial',         monto: 2000000  },
      { concepto: 'Inventario inicial (1 mes)',        monto: 2500000  },
      { concepto: 'Capital de trabajo (2 meses)',      monto: 4000000  },
      { concepto: 'Permisos y legalización',           monto: 500000   },
      { concepto: 'Imprevistos (10%)',                 monto: 2050000  },
    ],
    costosOp: [
      { concepto: 'Insumos y materia prima (45%)',     monto: 5832000  },
      { concepto: 'Nómina operador',                  monto: 1500000  },
      { concepto: 'Arriendo punto',                   monto: 800000   },
      { concepto: 'Empaque y desechables',            monto: 400000   },
      { concepto: 'Servicios y otros',                monto: 300000   },
      { concepto: 'Marketing digital',                monto: 300000   },
    ],
    precioPromedio: 18500,
    metaDiaria: 36,
    diasMes: 25,
  },

  // 6. Marketing
  marketing: {
    estrategia: 'Lanzamiento con impacto visual fuerte. Presencia en Instagram y TikTok con contenido de alta calidad (ya contamos con fotógrafo y diseñador). Promoción de apertura con precio especial los primeros 3 días.',
    canalesDigitales: 'Instagram (@zabuhotdogs), TikTok, WhatsApp Business para pedidos y atención al cliente.',
    contenido: 'Videos de proceso de preparación, fotos de producto con calidad gastronómica, historias diarias de ventas y momentos del carrito.',
    lanzamiento: 'Evento de apertura con influencers locales y prensa. Producto gratuito para los primeros 50 clientes. Reseñas en Google Maps.',
    fidelizacion: 'Programa de cliente frecuente. WhatsApp para pedidos anticipados. Promociones semanales.',
  },

  // 7. Legal
  legal: {
    tipo: 'Persona Natural — Régimen Simple de Tributación',
    rut: 'Por gestionar',
    registro: 'Cámara de Comercio de Barranquilla — Por gestionar',
    permisos: 'Concepto sanitario INVIMA, permiso de uso de espacio público (si aplica), manipulación de alimentos.',
    regimen: 'Régimen Simple — ventas anuales estimadas menores a 3.500 UVT en primer año.',
    notas: 'Se recomienda constituir SAS simplificada antes del segundo carrito para facilitar créditos y contratos.',
  },

  // 8. Riesgos
  riesgos: [
    { riesgo: 'Bajo flujo de clientes en la ubicación',     probabilidad:'Media', impacto:'Alto',   mitigacion: 'Validar tráfico antes de firmar. Tener plan B de reubicación rápida.' },
    { riesgo: 'Operador con bajo desempeño',                probabilidad:'Media', impacto:'Alto',   mitigacion: 'Proceso de selección cuidadoso. Período de prueba de 2 semanas con acompañamiento.' },
    { riesgo: 'Retraso en permisos y legalización',         probabilidad:'Alta',  impacto:'Medio',  mitigacion: 'Iniciar trámites 6 semanas antes de la apertura.' },
    { riesgo: 'Incremento en costos de insumos',            probabilidad:'Media', impacto:'Medio',  mitigacion: 'Contratos de suministro con precio fijo por 3 meses. Proveedor alterno identificado.' },
    { riesgo: 'Competencia copia el concepto',              probabilidad:'Baja',  impacto:'Medio',  mitigacion: 'Construir marca fuerte desde el inicio. Cream Code™ como elemento diferenciador exclusivo.' },
    { riesgo: 'Problema de calidad en producto',            probabilidad:'Baja',  impacto:'Alto',   mitigacion: 'Protocolo de calidad estricto. Inspección diaria de insumos. Proveedor certificado.' },
    { riesgo: 'Clima (lluvia afecta ventas en carrito)',    probabilidad:'Alta',  impacto:'Bajo',   mitigacion: 'Carrito con techo. Domicilios como canal alternativo en días de lluvia.' },
  ],

  // 9. Equipo
  equipo: [
    { nombre: 'Luis Restrepo',   rol: 'Director Comercial / Fundador', resp: 'Estrategia, finanzas, operación general, aprobaciones.' },
    { nombre: 'Emelyn Mendoza',  rol: 'Directora de Compras y Visual', resp: 'Proveedores, imagen de marca, presentación del producto.' },
    { nombre: 'Por contratar',   rol: 'Operador Carrito 1',            resp: 'Operación diaria, atención al cliente, ventas.' },
    { nombre: 'Por contratar',   rol: 'Apoyo logístico',               resp: 'Reabastecimiento, alistamiento de insumos, CEDIS.' },
    { nombre: 'Aliado externo',  rol: 'Diseñador / Fotógrafo',         resp: 'Branding, contenido visual, redes sociales.' },
  ],

  // 10. Cronograma
  cronograma: [
    { semana: 'Semana 1-2 (Jun)',  actividad: 'Definir ubicación Carrito 1. Iniciar trámites legales. Contratar diseñador para imagen.' },
    { semana: 'Semana 3-4 (Jun)',  actividad: 'Fabricar / adquirir carrito. Sesión fotográfica de producto. Crear perfiles en redes.' },
    { semana: 'Semana 5-6 (Jul)',  actividad: 'Contratar y capacitar operador. Pruebas de receta y operación. Gestionar permisos.' },
    { semana: 'Semana 7-8 (Jul)',  actividad: 'Prueba piloto con clientes reales (soft launch). Ajustes operativos. Campaña previa en redes.' },
    { semana: 'Semana 9 (Ago)',    actividad: '🚀 APERTURA OFICIAL Carrito 1. Evento de lanzamiento. Prensa e influencers.' },
    { semana: 'Semana 10-12 (Ago)',actividad: 'Consolidar operación C1. Definir ubicación C2. Reinversión de primeros ingresos.' },
    { semana: 'Semana 13-16 (Sep)',actividad: 'Apertura Carrito 2. Incorporar aprendizajes del C1. Escalar marketing.' },
    { semana: 'Semana 17-20 (Oct)',actividad: 'Apertura Carrito 3. Sistema CTE operando los 3 carritos. Evaluar expansión.' },
  ],
}

// ─── ESTILOS PDF ──────────────────────────────────────────────────────────────
const PDF_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #zabu-plan-pdf, #zabu-plan-pdf * { visibility: visible !important; }
  #zabu-plan-pdf {
    position: fixed !important;
    left: 0 !important; top: 0 !important;
    width: 100% !important;
    background: white !important;
    color: #111 !important;
    font-family: 'Plus Jakarta Sans', Arial, sans-serif !important;
    font-size: 10px !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .pdf-no-print { display: none !important; }
  .pdf-page { page-break-after: always; padding: 32px 40px; }
  .pdf-page:last-child { page-break-after: avoid; }
}
`

// ─── COMPONENTE PDF ───────────────────────────────────────────────────────────
function PDFTemplate({ datos }) {
  const d = datos
  const totalInversion = d.financiero.inversion.reduce((s,i)=>s+i.monto,0)
  const totalCostosOp  = d.financiero.costosOp.reduce((s,c)=>s+c.monto,0)
  const ingresoMensual = d.financiero.precioPromedio * d.financiero.metaDiaria * d.financiero.diasMes
  const utilidadMensual = ingresoMensual - totalCostosOp
  const mesesROI = totalInversion > 0 ? Math.ceil(totalInversion / utilidadMensual) : 0

  const s = {
    page:    { padding:'32px 40px', background:'white', color:'#111', fontFamily:'Arial, sans-serif' },
    cover:   { minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'#0a0a0a', color:'white', padding:'40px' },
    h1:      { fontSize:32, fontWeight:900, color:'#C9A84C', letterSpacing:-1, marginBottom:8 },
    h2:      { fontSize:18, fontWeight:800, color:'#C9A84C', borderBottom:'2px solid #C9A84C', paddingBottom:6, marginBottom:16, marginTop:0 },
    h3:      { fontSize:13, fontWeight:700, color:'#333', marginBottom:8, marginTop:16 },
    p:       { fontSize:11, lineHeight:1.7, color:'#444', marginBottom:8 },
    kpi:     { background:'#f8f4ec', border:'1px solid #C9A84C', borderRadius:8, padding:'12px 16px', textAlign:'center', flex:1 },
    kpiVal:  { fontSize:20, fontWeight:900, color:'#C9A84C' },
    kpiLbl:  { fontSize:9, color:'#888', textTransform:'uppercase', letterSpacing:1, marginTop:4 },
    table:   { width:'100%', borderCollapse:'collapse', fontSize:10, marginBottom:12 },
    th:      { background:'#C9A84C', color:'white', padding:'6px 10px', textAlign:'left', fontWeight:700 },
    td:      { padding:'6px 10px', borderBottom:'1px solid #eee', verticalAlign:'top' },
    tdAlt:   { padding:'6px 10px', borderBottom:'1px solid #eee', background:'#faf9f7', verticalAlign:'top' },
    badge:   (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700, background:color+'22', color:color, border:`1px solid ${color}44` }),
    divider: { borderTop:'1px solid #eee', margin:'16px 0' },
    footer:  { borderTop:'2px solid #C9A84C', paddingTop:10, marginTop:20, display:'flex', justifyContent:'space-between', fontSize:9, color:'#888' },
  }

  const Page = ({ children, num }) => (
    <div className="pdf-page" style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:10, borderBottom:'2px solid #C9A84C' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🌭</div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:'#C9A84C' }}>ZABÚ</div>
            <div style={{ fontSize:8, color:'#888', letterSpacing:1 }}>HOT DOGS DE VERDAD</div>
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:9, color:'#aaa' }}>
          <div>Plan de Negocio — Apertura</div>
          <div>Barranquilla, Colombia · 2026</div>
        </div>
      </div>
      {children}
      <div style={s.footer}>
        <span>ZABÚ Hot Dogs · Plan de Negocio Confidencial</span>
        <span>Página {num}</span>
      </div>
    </div>
  )

  return (
    <div id="zabu-plan-pdf">
      {/* PORTADA */}
      <div className="pdf-page" style={{ ...s.cover, minHeight:'29.7cm' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🌭</div>
        <div style={{ fontSize:48, fontWeight:900, color:'#C9A84C', letterSpacing:-2, marginBottom:8 }}>ZABÚ</div>
        <div style={{ fontSize:18, color:'rgba(255,255,255,0.6)', letterSpacing:4, marginBottom:40 }}>HOT DOGS DE VERDAD</div>
        <div style={{ width:60, height:2, background:'#C9A84C', marginBottom:40 }} />
        <div style={{ fontSize:28, fontWeight:800, color:'white', marginBottom:8 }}>Plan de Negocio</div>
        <div style={{ fontSize:16, color:'rgba(255,255,255,0.5)', marginBottom:60 }}>Apertura · 3 Carritos · 2026</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
          {d.resumen.ciudad}, Colombia · {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'})}<br/>
          Preparado por: Luis Restrepo & Emelyn Mendoza
        </div>
        <div style={{ position:'absolute', bottom:40, fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:2 }}>CONFIDENCIAL — USO INTERNO</div>
      </div>

      {/* PAG 2 — RESUMEN EJECUTIVO */}
      <Page num={2}>
        <div style={s.h2}>1. Resumen Ejecutivo</div>
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {[
            { val:'3', lbl:'Carritos a abrir' },
            { val:'$'+Math.round(ingresoMensual/1000)+'K', lbl:'Ingreso mensual est.' },
            { val:mesesROI+'m', lbl:'Retorno inversión' },
            { val:'$'+Math.round(totalInversion/1000000)+'M', lbl:'Inversión total' },
          ].map(k => (
            <div key={k.lbl} style={s.kpi}>
              <div style={s.kpiVal}>{k.val}</div>
              <div style={s.kpiLbl}>{k.lbl}</div>
            </div>
          ))}
        </div>
        <p style={s.p}><strong>Misión:</strong> {d.resumen.mision}</p>
        <p style={s.p}><strong>Visión:</strong> {d.resumen.vision}</p>
        <p style={s.p}><strong>Propuesta de valor:</strong> {d.resumen.propuestaValor}</p>
        <div style={s.divider} />
        <div style={s.h3}>Cronograma de apertura</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Carrito</th><th style={s.th}>Fecha estimada</th><th style={s.th}>Ubicación</th><th style={s.th}>Estado</th></tr></thead>
          <tbody>
            {d.operativo.carritos.map((c,i) => (
              <tr key={i}>
                <td style={i%2===0?s.td:s.tdAlt}><strong>{c.nombre}</strong></td>
                <td style={i%2===0?s.td:s.tdAlt}>{c.fecha}</td>
                <td style={i%2===0?s.td:s.tdAlt}>{c.ubicacion}</td>
                <td style={i%2===0?s.td:s.tdAlt}><span style={s.badge('#C9A84C')}>{c.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 3 — MERCADO Y MODELO */}
      <Page num={3}>
        <div style={s.h2}>2. Análisis de Mercado</div>
        {[
          { label:'Segmento objetivo', val:d.mercado.segmento },
          { label:'Tamaño del mercado', val:d.mercado.tamano },
          { label:'Competencia', val:d.mercado.competencia },
          { label:'Oportunidad', val:d.mercado.oportunidad },
          { label:'Ventaja competitiva', val:d.mercado.ventajaComp },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#C9A84C', marginBottom:3 }}>{f.label}</div>
            <div style={s.p}>{f.val}</div>
          </div>
        ))}
        <div style={s.divider} />
        <div style={s.h2}>3. Modelo de Negocio</div>
        {[
          { label:'Canales de venta', val:d.modelo.canales },
          { label:'Fuentes de ingreso', val:d.modelo.fuentes },
          { label:'Estructura de costos', val:d.modelo.estructura },
          { label:'Socios clave', val:d.modelo.socios },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#C9A84C', marginBottom:3 }}>{f.label}</div>
            <div style={s.p}>{f.val}</div>
          </div>
        ))}
      </Page>

      {/* PAG 4 — PLAN OPERATIVO */}
      <Page num={4}>
        <div style={s.h2}>4. Plan Operativo</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <div style={s.h3}>Horario de operación</div>
            <p style={s.p}>🕐 {d.operativo.horario}</p>
            <p style={s.p}>📅 {d.operativo.diasOperacion}</p>
          </div>
          <div>
            <div style={s.h3}>Meta operativa</div>
            <p style={s.p}>🎯 {d.operativo.metaDiaria} perros/día por carrito</p>
            <p style={s.p}>📊 {d.operativo.diasMes} días operativos/mes</p>
          </div>
        </div>
        <div style={s.h3}>Menú inicial</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Producto</th><th style={s.th}>Precio</th></tr></thead>
          <tbody>
            {d.operativo.producto.map((p,i) => (
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{p.nombre}</td><td style={i%2===0?s.td:s.tdAlt}><strong style={{color:'#C9A84C'}}>{cop(p.precio)}</strong></td></tr>
            ))}
          </tbody>
        </table>
        <div style={s.h3}>Equipo de trabajo</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Rol</th><th style={s.th}>Cantidad</th><th style={s.th}>Salario mensual</th></tr></thead>
          <tbody>
            {d.operativo.equipo.map((e,i) => (
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{e.rol}</td><td style={i%2===0?s.td:s.tdAlt}>{e.cantidad}</td><td style={i%2===0?s.td:s.tdAlt}>{cop(e.salario)}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 5 — FINANCIERO */}
      <Page num={5}>
        <div style={s.h2}>5. Plan Financiero</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <div style={s.h3}>Inversión inicial requerida</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Concepto</th><th style={s.th}>Monto</th></tr></thead>
              <tbody>
                {d.financiero.inversion.map((item,i) => (
                  <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{item.concepto}</td><td style={i%2===0?s.td:s.tdAlt}><strong>{cop(item.monto)}</strong></td></tr>
                ))}
                <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>TOTAL INVERSIÓN</td><td style={{...s.td,fontWeight:900,color:'#C9A84C',background:'#f8f4ec'}}>{cop(totalInversion)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div style={s.h3}>Costos operativos mensuales</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Concepto</th><th style={s.th}>Monto</th></tr></thead>
              <tbody>
                {d.financiero.costosOp.map((item,i) => (
                  <tr key={i}><td style={i%2===0?s.td:s.tdAlt}>{item.concepto}</td><td style={i%2===0?s.td:s.tdAlt}><strong>{cop(item.monto)}</strong></td></tr>
                ))}
                <tr><td style={{...s.td,fontWeight:700,background:'#f8f4ec'}}>TOTAL COSTOS</td><td style={{...s.td,fontWeight:900,color:'#e05252',background:'#f8f4ec'}}>{cop(totalCostosOp)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {[
            { val:cop(ingresoMensual),  lbl:'Ingreso mensual estimado',  color:'#4caf50' },
            { val:cop(totalCostosOp),   lbl:'Costos operativos/mes',     color:'#e05252' },
            { val:cop(utilidadMensual), lbl:'Utilidad neta estimada/mes', color:'#C9A84C' },
            { val:mesesROI+' meses',    lbl:'Punto de retorno inversión', color:'#378ADD' },
          ].map(k => (
            <div key={k.lbl} style={{...s.kpi, borderColor:k.color}}>
              <div style={{...s.kpiVal, color:k.color}}>{k.val}</div>
              <div style={s.kpiLbl}>{k.lbl}</div>
            </div>
          ))}
        </div>
      </Page>

      {/* PAG 6 — PROYECCIÓN 12 MESES */}
      <Page num={6}>
        <div style={s.h2}>6. Proyección de Ventas — 12 meses</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Mes</th>
              <th style={s.th}>Carritos</th>
              <th style={s.th}>Ventas/día (est.)</th>
              <th style={s.th}>Ingreso bruto</th>
              <th style={s.th}>Costos op.</th>
              <th style={s.th}>Utilidad</th>
            </tr>
          </thead>
          <tbody>
            {[
              { mes:'Ago 2026', c:1, vpd:20, factor:0.55 },
              { mes:'Sep 2026', c:2, vpd:28, factor:0.76 },
              { mes:'Oct 2026', c:3, vpd:30, factor:0.83 },
              { mes:'Nov 2026', c:3, vpd:33, factor:0.92 },
              { mes:'Dic 2026', c:3, vpd:36, factor:1.00 },
              { mes:'Ene 2027', c:3, vpd:32, factor:0.89 },
              { mes:'Feb 2027', c:3, vpd:33, factor:0.92 },
              { mes:'Mar 2027', c:3, vpd:36, factor:1.00 },
              { mes:'Abr 2027', c:3, vpd:38, factor:1.06 },
              { mes:'May 2027', c:3, vpd:40, factor:1.11 },
              { mes:'Jun 2027', c:3, vpd:38, factor:1.06 },
              { mes:'Jul 2027', c:3, vpd:36, factor:1.00 },
            ].map((m,i) => {
              const ing  = Math.round(m.vpd * 18500 * 25 * m.c)
              const cos  = Math.round(totalCostosOp * m.c * m.factor)
              const util = ing - cos
              return (
                <tr key={i}>
                  <td style={i%2===0?s.td:s.tdAlt}><strong>{m.mes}</strong></td>
                  <td style={i%2===0?s.td:s.tdAlt}>{m.c}</td>
                  <td style={i%2===0?s.td:s.tdAlt}>{m.vpd}/carrito</td>
                  <td style={i%2===0?s.td:s.tdAlt}>{cop(ing)}</td>
                  <td style={i%2===0?s.td:s.tdAlt}>{cop(cos)}</td>
                  <td style={{...(i%2===0?s.td:s.tdAlt), fontWeight:700, color:util>0?'#4caf50':'#e05252'}}>{cop(util)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p style={{...s.p, fontSize:9, color:'#aaa', marginTop:8}}>* Proyecciones basadas en datos aproximados. Se actualizarán con datos reales al iniciar operación.</p>
      </Page>

      {/* PAG 7 — MARKETING Y LEGAL */}
      <Page num={7}>
        <div style={s.h2}>7. Plan de Marketing</div>
        {[
          { label:'Estrategia general', val:d.marketing.estrategia },
          { label:'Canales digitales', val:d.marketing.canalesDigitales },
          { label:'Estrategia de contenido', val:d.marketing.contenido },
          { label:'Lanzamiento', val:d.marketing.lanzamiento },
          { label:'Fidelización', val:d.marketing.fidelizacion },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#C9A84C', marginBottom:3 }}>{f.label}</div>
            <div style={s.p}>{f.val}</div>
          </div>
        ))}
        <div style={s.divider} />
        <div style={s.h2}>8. Estructura Legal</div>
        <table style={s.table}>
          <tbody>
            {[
              { label:'Tipo de empresa',    val:d.legal.tipo       },
              { label:'RUT',                val:d.legal.rut        },
              { label:'Registro mercantil', val:d.legal.registro   },
              { label:'Permisos requeridos',val:d.legal.permisos   },
              { label:'Régimen tributario', val:d.legal.regimen    },
              { label:'Notas',              val:d.legal.notas      },
            ].map((r,i) => (
              <tr key={i}><td style={{...s.td,fontWeight:700,width:'30%',background:'#f8f4ec'}}>{r.label}</td><td style={s.td}>{r.val}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 8 — RIESGOS Y EQUIPO */}
      <Page num={8}>
        <div style={s.h2}>9. Análisis de Riesgos</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Riesgo</th><th style={s.th}>Prob.</th><th style={s.th}>Impacto</th><th style={s.th}>Mitigación</th></tr></thead>
          <tbody>
            {d.riesgos.map((r,i) => (
              <tr key={i}>
                <td style={i%2===0?s.td:s.tdAlt}>{r.riesgo}</td>
                <td style={i%2===0?s.td:s.tdAlt}><span style={s.badge(r.probabilidad==='Alta'?'#e05252':r.probabilidad==='Media'?'#FF9800':'#4caf50')}>{r.probabilidad}</span></td>
                <td style={i%2===0?s.td:s.tdAlt}><span style={s.badge(r.impacto==='Alto'?'#e05252':r.impacto==='Medio'?'#FF9800':'#4caf50')}>{r.impacto}</span></td>
                <td style={i%2===0?s.td:s.tdAlt}>{r.mitigacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={s.divider} />
        <div style={s.h2}>10. Equipo</div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Nombre</th><th style={s.th}>Rol</th><th style={s.th}>Responsabilidades</th></tr></thead>
          <tbody>
            {d.equipo.map((e,i) => (
              <tr key={i}><td style={i%2===0?s.td:s.tdAlt}><strong>{e.nombre}</strong></td><td style={i%2===0?s.td:s.tdAlt}>{e.rol}</td><td style={i%2===0?s.td:s.tdAlt}>{e.resp}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      {/* PAG 9 — CRONOGRAMA */}
      <Page num={9}>
        <div style={s.h2}>Cronograma de implementación — 2 meses hacia apertura</div>
        <table style={s.table}>
          <thead><tr><th style={{...s.th,width:'25%'}}>Período</th><th style={s.th}>Actividades clave</th></tr></thead>
          <tbody>
            {d.cronograma.map((c,i) => (
              <tr key={i}>
                <td style={{...(i%2===0?s.td:s.tdAlt), fontWeight:700, color:'#C9A84C'}}>{c.semana}</td>
                <td style={i%2===0?s.td:s.tdAlt}>{c.actividad}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={s.divider} />
        <div style={{ textAlign:'center', padding:'24px', background:'#f8f4ec', borderRadius:8, border:'2px solid #C9A84C' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🌭</div>
          <div style={{ fontSize:20, fontWeight:900, color:'#C9A84C', marginBottom:4 }}>ZABÚ — Hot Dogs de Verdad</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:12 }}>Barranquilla, Colombia · 2026</div>
          <div style={{ fontSize:10, color:'#aaa' }}>
            Este documento es confidencial y de uso exclusivo para gestión interna y presentación a inversionistas.<br/>
            Preparado con Sistema CTE — LRM Core · lrm-core.vercel.app
          </div>
        </div>
      </Page>
    </div>
  )
}

// ─── MÓDULO PRINCIPAL ─────────────────────────────────────────────────────────
export default function ZabuPlanNegocio() {
  const [datos,   setDatos]   = useState(DATOS_INIT)
  const [tab,     setTab]     = useState('resumen')
  const [editando,setEditando]= useState(false)

  const exportarPDF = () => {
    const style = document.createElement('style')
    style.innerHTML = PDF_STYLES
    document.head.appendChild(style)
    setTimeout(() => { window.print(); document.head.removeChild(style) }, 300)
  }

  const update = (seccion, campo, valor) => {
    setDatos(prev => ({ ...prev, [seccion]: { ...prev[seccion], [campo]: valor } }))
  }

  const iStyle = {
    width:'100%', padding:'8px 12px', borderRadius:8,
    background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', marginTop:4,
  }

  const TABS = [
    { id:'resumen',    label:'📋 Resumen'     },
    { id:'mercado',    label:'📊 Mercado'     },
    { id:'modelo',     label:'💡 Modelo'      },
    { id:'operativo',  label:'⚙️ Operativo'  },
    { id:'financiero', label:'💰 Financiero'  },
    { id:'marketing',  label:'📱 Marketing'   },
    { id:'legal',      label:'📜 Legal'       },
    { id:'riesgos',    label:'⚠️ Riesgos'    },
    { id:'equipo',     label:'👥 Equipo'      },
    { id:'cronograma', label:'📅 Cronograma'  },
    { id:'pdf',        label:'📄 Exportar PDF'},
  ]

  const totalInversion  = datos.financiero.inversion.reduce((s,i)=>s+i.monto,0)
  const totalCostosOp   = datos.financiero.costosOp.reduce((s,c)=>s+c.monto,0)
  const ingresoMensual  = datos.financiero.precioPromedio * datos.financiero.metaDiaria * datos.financiero.diasMes
  const utilidadMensual = ingresoMensual - totalCostosOp
  const mesesROI        = utilidadMensual > 0 ? Math.ceil(totalInversion / utilidadMensual) : '—'

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ fontSize:28 }}>🌭</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>Plan de Negocio ZABÚ</div>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>Apertura · 3 Carritos · Barranquilla 2026 · Documento vivo — actualizable en tiempo real</div>
        </div>
        <button onClick={exportarPDF} style={{
          padding:'10px 20px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700,
          background:'rgba(224,82,82,0.15)', border:'1px solid rgba(224,82,82,0.4)',
          color:'var(--red)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
        }}>
          📄 Exportar PDF
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Inversión total',    val:cop(totalInversion),  color:'var(--gold)',  sub:'Capital requerido'     },
          { label:'Ingreso est./mes',   val:cop(ingresoMensual),  color:'var(--green)', sub:'1 carrito operando'    },
          { label:'Utilidad est./mes',  val:cop(utilidadMensual), color: utilidadMensual>0?'var(--green)':'var(--red)', sub:'Después de costos' },
          { label:'Retorno inversión',  val:`${mesesROI} meses`,  color:'var(--blue)',  sub:'Punto de equilibrio'   },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:k.color }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sub-nav" style={{ marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <div key={t.id} className={`sub-nav-item${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}
            style={t.id==='pdf'?{background:'rgba(224,82,82,0.1)',borderColor:'rgba(224,82,82,0.3)',color:'var(--red)'}:{}}
          >{t.label}</div>
        ))}
      </div>

      {/* RESUMEN */}
      {tab==='resumen' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Resumen ejecutivo</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>
              {editando ? '✓ Guardar' : '✏️ Editar'}
            </button>
          </div>
          <div className="grid-2" style={{ gap:16 }}>
            {[
              {label:'Nombre', key:'nombre'}, {label:'Slogan', key:'slogan'},
              {label:'Ciudad', key:'ciudad'}, {label:'Zona objetivo', key:'zona'},
              {label:'Fecha apertura estimada', key:'fechaApertura', type:'date'},
            ].map(f => (
              <div key={f.key} className="panel">
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:6 }}>{f.label.toUpperCase()}</div>
                {editando
                  ? <input type={f.type||'text'} value={datos.resumen[f.key]} onChange={e=>update('resumen',f.key,e.target.value)} style={iStyle} />
                  : <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{datos.resumen[f.key]}</div>
                }
              </div>
            ))}
          </div>
          <div className="panel" style={{ marginTop:12 }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>MISIÓN</div>
            {editando
              ? <textarea value={datos.resumen.mision} onChange={e=>update('resumen','mision',e.target.value)} style={{...iStyle,height:60,resize:'none'}} />
              : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.resumen.mision}</div>
            }
          </div>
          <div className="panel" style={{ marginTop:12 }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>VISIÓN</div>
            {editando
              ? <textarea value={datos.resumen.vision} onChange={e=>update('resumen','vision',e.target.value)} style={{...iStyle,height:60,resize:'none'}} />
              : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.resumen.vision}</div>
            }
          </div>
          <div className="panel" style={{ marginTop:12 }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:8 }}>PROPUESTA DE VALOR</div>
            {editando
              ? <textarea value={datos.resumen.propuestaValor} onChange={e=>update('resumen','propuestaValor',e.target.value)} style={{...iStyle,height:60,resize:'none'}} />
              : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.resumen.propuestaValor}</div>
            }
          </div>
        </div>
      )}

      {/* MERCADO */}
      {tab==='mercado' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Análisis de mercado</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Guardar':'✏️ Editar'}</button>
          </div>
          {[
            {label:'Segmento objetivo',   key:'segmento'},
            {label:'Tamaño del mercado',  key:'tamano'},
            {label:'Competencia',         key:'competencia'},
            {label:'Oportunidad',         key:'oportunidad'},
            {label:'Ventaja competitiva', key:'ventajaComp'},
          ].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando
                ? <textarea value={datos.mercado[f.key]} onChange={e=>update('mercado',f.key,e.target.value)} style={{...iStyle,height:70,resize:'none'}} />
                : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.mercado[f.key]}</div>
              }
            </div>
          ))}
        </div>
      )}

      {/* MODELO */}
      {tab==='modelo' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Modelo de negocio</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Guardar':'✏️ Editar'}</button>
          </div>
          {[
            {label:'Canales de venta',    key:'canales'},
            {label:'Fuentes de ingreso',  key:'fuentes'},
            {label:'Estructura de costos',key:'estructura'},
            {label:'Propuesta de valor',  key:'propuesta'},
            {label:'Socios clave',        key:'socios'},
          ].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando
                ? <textarea value={datos.modelo[f.key]} onChange={e=>update('modelo',f.key,e.target.value)} style={{...iStyle,height:60,resize:'none'}} />
                : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.modelo[f.key]}</div>
              }
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
              <div className="panel-title">Horario y operación</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:8 }}>🕐 {datos.operativo.horario}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:8 }}>📅 {datos.operativo.diasOperacion}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:8 }}>🎯 Meta: {datos.operativo.metaDiaria} perros/día/carrito</div>
              <div style={{ fontSize:13, color:'var(--text2)' }}>📊 {datos.operativo.diasMes} días operativos/mes</div>
            </div>
            <div className="panel">
              <div className="panel-title">Menú inicial</div>
              {datos.operativo.producto.map((p,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, color:'var(--text2)' }}>{p.nombre}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--gold)' }}>{cop(p.precio)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel" style={{ marginBottom:16 }}>
            <div className="panel-title">Plan de apertura de carritos</div>
            {datos.operativo.carritos.map((c,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.nombre}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>📍 {c.ubicacion} · 📅 {c.fecha}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>👤 {c.operador}</div>
                </div>
                <span style={{ fontSize:11, padding:'4px 12px', borderRadius:8, background:'var(--gold-dim)', color:'var(--gold)', border:'0.5px solid var(--gold-border)', fontWeight:600 }}>{c.estado}</span>
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
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text2)' }}>{item.concepto}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{cop(item.monto)}</span>
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
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text2)' }}>{item.concepto}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{cop(item.monto)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>TOTAL</span>
                <span style={{ fontSize:18, fontWeight:900, color:'var(--red)' }}>{cop(totalCostosOp)}</span>
              </div>
            </div>
          </div>
          <div className="grid-4">
            {[
              { label:'Ingreso bruto/mes',  val:cop(ingresoMensual),  color:'var(--green)', sub:`${datos.financiero.metaDiaria} perros × ${datos.financiero.diasMes} días` },
              { label:'Costos totales/mes', val:cop(totalCostosOp),   color:'var(--red)',   sub:'Operativos + nómina'  },
              { label:'Utilidad neta/mes',  val:cop(utilidadMensual), color:utilidadMensual>0?'var(--gold)':'var(--red)', sub:'Ingreso - Costos' },
              { label:'ROI estimado',       val:`${mesesROI} meses`,  color:'var(--blue)',  sub:'Recuperar inversión'  },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKETING */}
      {tab==='marketing' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Plan de marketing</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Guardar':'✏️ Editar'}</button>
          </div>
          {[
            {label:'Estrategia general',     key:'estrategia'},
            {label:'Canales digitales',      key:'canalesDigitales'},
            {label:'Estrategia de contenido',key:'contenido'},
            {label:'Plan de lanzamiento',    key:'lanzamiento'},
            {label:'Fidelización',           key:'fidelizacion'},
          ].map(f => (
            <div key={f.key} className="panel" style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
              {editando
                ? <textarea value={datos.marketing[f.key]} onChange={e=>update('marketing',f.key,e.target.value)} style={{...iStyle,height:70,resize:'none'}} />
                : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.marketing[f.key]}</div>
              }
            </div>
          ))}
        </div>
      )}

      {/* LEGAL */}
      {tab==='legal' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Estructura legal</div>
            <button onClick={() => setEditando(!editando)} className={editando?'btn-gold':'btn'} style={{ fontSize:12, padding:'6px 14px' }}>{editando?'✓ Guardar':'✏️ Editar'}</button>
          </div>
          <div className="grid-2" style={{ gap:12 }}>
            {[
              {label:'Tipo de empresa',    key:'tipo'},
              {label:'RUT',                key:'rut'},
              {label:'Registro mercantil', key:'registro'},
              {label:'Permisos requeridos',key:'permisos'},
              {label:'Régimen tributario', key:'regimen'},
              {label:'Notas y recomendaciones',key:'notas'},
            ].map(f => (
              <div key={f.key} className="panel">
                <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:1, marginBottom:8, fontWeight:700 }}>{f.label.toUpperCase()}</div>
                {editando
                  ? <textarea value={datos.legal[f.key]} onChange={e=>update('legal',f.key,e.target.value)} style={{...iStyle,height:60,resize:'none'}} />
                  : <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{datos.legal[f.key]}</div>
                }
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
                  <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>
                    <strong style={{ color:'var(--green)' }}>Mitigación:</strong> {r.mitigacion}
                  </div>
                </div>
              )
            })}
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
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--gold-dim)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'var(--gold)', flexShrink:0 }}>
                    {e.nombre.charAt(0)}
                  </div>
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

      {/* CRONOGRAMA */}
      {tab==='cronograma' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>Cronograma — 2 meses hacia apertura</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {datos.cronograma.map((c,i) => (
              <div key={i} className="panel" style={{ display:'flex', gap:16, alignItems:'flex-start', border: c.actividad.includes('APERTURA')?'1px solid var(--green-border)':'1px solid var(--border)', background: c.actividad.includes('APERTURA')?'var(--green-dim)':'var(--bg3)' }}>
                <div style={{ minWidth:140, fontSize:12, fontWeight:700, color: c.actividad.includes('APERTURA')?'var(--green)':'var(--gold)', flexShrink:0 }}>{c.semana}</div>
                <div style={{ fontSize:13, color: c.actividad.includes('APERTURA')?'var(--green)':'var(--text2)', lineHeight:1.6, fontWeight: c.actividad.includes('APERTURA')?700:400 }}>{c.actividad}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF */}
      {tab==='pdf' && (
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Exportar Plan de Negocio</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>El PDF se genera con diseño profesional, portada ZABÚ, 9 páginas con todas las secciones.</div>

          <div className="panel" style={{ marginBottom:16, border:'1px solid var(--gold-border)' }}>
            <div className="panel-title">Contenido del PDF</div>
            {['Portada institucional ZABÚ','Resumen ejecutivo con KPIs','Análisis de mercado','Modelo de negocio','Plan operativo con menú y carritos','Plan financiero con inversión y proyecciones','Proyección de ventas 12 meses','Plan de marketing','Estructura legal','Análisis de riesgos','Equipo','Cronograma de implementación'].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--green)', fontSize:12 }}>✓</span>
                <span style={{ fontSize:13, color:'var(--text2)' }}>{item}</span>
              </div>
            ))}
          </div>

          <button onClick={exportarPDF} style={{
            width:'100%', padding:'16px', borderRadius:12, cursor:'pointer', fontSize:15, fontWeight:800,
            background:'rgba(224,82,82,0.15)', border:'2px solid rgba(224,82,82,0.4)',
            color:'var(--red)', fontFamily:'inherit',
          }}>
            📄 Generar y descargar PDF — Plan de Negocio ZABÚ
          </button>

          <div style={{ marginTop:12, fontSize:11, color:'var(--text4)', textAlign:'center' }}>
            Usa Ctrl+P → "Guardar como PDF" si el diálogo no aparece automáticamente
          </div>
        </div>
      )}

      {/* Template PDF oculto */}
      <div style={{ display:'none' }}>
        <PDFTemplate datos={datos} />
      </div>
    </div>
  )
}
