// @ts-nocheck
// LRM Trade Consulting · Biblioteca de marketing: fuentes, secuencias de seguimiento,
// estrategias para conseguir clientes, ideas de contenido y públicos para pauta en Meta.
// Todo es editable desde la app; esto es el punto de arranque.

export const FUENTES = {
  referido:  { l:'Referido',          icono:'🤝' },
  meta:      { l:'Pauta Meta',        icono:'📣' },
  instagram: { l:'Instagram orgánico', icono:'📸' },
  whatsapp:  { l:'WhatsApp directo',  icono:'💬' },
  google:    { l:'Google / web',      icono:'🔎' },
  vendedor:  { l:'Red comercial',     icono:'🧑‍💼' },
  visita:    { l:'Visita en frío',    icono:'🚪' },
  feria:     { l:'Feria / evento',    icono:'🎪' },
  aliado:    { l:'Aliado (agencia, aduana)', icono:'🔗' },
  otro:      { l:'Otro',              icono:'➕' },
}

// Secuencias de seguimiento: cada paso pone la "próxima acción" del cliente en el CRM (sale en el Inicio)
export const SECUENCIAS = {
  prospecto: {
    l:'Prospecto nuevo', d:'Para quien acaba de llegar o te dio su número.',
    pasos: [
      { dia:0,  accion:'Saludo y presentación', mensaje:'Hola {nombre}, soy Luis de LRM Trade Consulting. Movemos mercancía desde Miami, Panamá y China hasta Barranquilla, con todo incluido. ¿Qué estás importando hoy o qué te gustaría traer?' },
      { dia:2,  accion:'Pregunta de diagnóstico', mensaje:'{nombre}, para cotizarte bien: ¿qué producto traes, cada cuánto y desde dónde? Con eso te armo una tarifa a tu medida.' },
      { dia:5,  accion:'Mandar caso real', mensaje:'{nombre}, te comparto cómo le trajimos a un cliente su carga de China con todo legalizado y sin sorpresas en el precio. ¿Te armo una cotización igual?' },
      { dia:10, accion:'Oferta de primer envío', mensaje:'{nombre}, para tu primer envío con nosotros te damos un precio especial. ¿Lo cuadramos esta semana?' },
      { dia:20, accion:'Último toque', mensaje:'{nombre}, ¿sigues interesado en importar? Si no es el momento, te escribo más adelante. Quedo atento.' },
    ],
  },
  cotizado: {
    l:'Cotización enviada', d:'Para cerrar una cotización que no ha respondido.',
    pasos: [
      { dia:1, accion:'¿Recibiste la cotización?', mensaje:'Hola {nombre}, ¿pudiste revisar la cotización? Cualquier duda te la resuelvo.' },
      { dia:3, accion:'Resolver objeción', mensaje:'{nombre}, ¿hay algo del precio o de los tiempos que quieras que ajustemos? Te puedo dar opciones.' },
      { dia:6, accion:'Urgencia real (cierre o cupo)', mensaje:'{nombre}, el consolidado / el cupo de esta semana cierra pronto. ¿Te separo el espacio?' },
      { dia:12, accion:'Cerrar o soltar', mensaje:'{nombre}, voy a cerrar tu cotización. Si la necesitas más adelante, me escribes y te la actualizo.' },
    ],
  },
  inactivo: {
    l:'Cliente dormido', d:'Clientes que ya te compraron y llevan tiempo sin mover carga.',
    pasos: [
      { dia:0,  accion:'Reactivar', mensaje:'Hola {nombre}, hace rato no movemos carga juntos. ¿Cómo va el negocio? Esta semana tenemos salida desde Miami y un consolidado de China abierto.' },
      { dia:7,  accion:'Novedad o tarifa nueva', mensaje:'{nombre}, mejoramos tarifas para clientes que ya trabajaron con nosotros. ¿Te mando la tuya actualizada?' },
      { dia:21, accion:'Pedir referido', mensaje:'{nombre}, si conoces a alguien que importe, te lo agradezco: por cada referido que se vuelva cliente te damos un beneficio en tu próximo envío.' },
    ],
  },
  postventa: {
    l:'Postventa y referidos', d:'Después de entregar: fidelizar y pedir referidos.',
    pasos: [
      { dia:1,  accion:'¿Todo llegó bien?', mensaje:'Hola {nombre}, ¿te llegó todo bien? Tu opinión nos ayuda mucho.' },
      { dia:4,  accion:'Pedir reseña / foto', mensaje:'{nombre}, ¿nos regalas una foto de tu mercancía o unas palabras sobre el servicio? Nos ayuda a crecer.' },
      { dia:10, accion:'Pedir referido', mensaje:'{nombre}, si conoces a alguien que importe, compártele tu código de referido: él recibe precio especial y tú un beneficio en tu próximo envío.' },
      { dia:30, accion:'Próximo pedido', mensaje:'{nombre}, ¿para cuándo tu próximo pedido? Te aviso la próxima salida.' },
    ],
  },
}

// Estrategias para conseguir clientes · cada una con pasos marcables
export const ESTRATEGIAS = [
  { id:'pauta_wa', titulo:'Pauta en Meta que llega a WhatsApp', icono:'📣', impacto:'alto',
    porque:'El importador decide hablando. Un anuncio de "Escríbenos por WhatsApp" te pone conversaciones reales todos los días.',
    pasos:['Crea la campaña en Ads Manager con objetivo Mensajes → WhatsApp', 'Un anuncio por servicio: China integral, Miami semanal, transporte', 'Público: comerciantes, emprendedores e importadores en tu zona (mira Públicos sugeridos)', 'Arranca con un presupuesto diario bajo por 7 días y mide el costo por conversación', 'Registra cada prospecto con fuente "Pauta Meta" y la campaña', 'Al día 7: apaga lo caro, sube lo que trae clientes'],
    kpi:'Costo por conversación y por cliente nuevo' },
  { id:'referidos', titulo:'Programa de referidos', icono:'🤝', impacto:'alto',
    porque:'Tus clientes conocen a otros importadores. Un referido llega con confianza y cierra más rápido.',
    pasos:['Dale a cada cliente su código de referido (pestaña Referidos)', 'Define el beneficio: descuento en el próximo envío o un valor fijo', 'Manda el mensaje de referidos a todos tus clientes activos', 'Cada cliente nuevo referido queda amarrado a quien lo trajo', 'Paga el beneficio apenas el referido haga su primer pago'],
    kpi:'Clientes nuevos por referido al mes' },
  { id:'barrido', titulo:'Barrido de comerciantes en tu ciudad', icono:'🚪', impacto:'alto',
    porque:'Los locales que venden lo que se importa (accesorios, celulares, perfumes, ropa, hogar) necesitan proveedores de carga.',
    pasos:['Escoge una zona comercial por semana', 'Arma una lista de 30 locales con nombre y WhatsApp (créalos como prospectos, fuente "Visita en frío")', 'Visítalos con una hoja de tarifas impresa', 'Ponlos en la secuencia "Prospecto nuevo"', 'Repite cada semana con otra zona'],
    kpi:'Prospectos nuevos y cotizaciones por semana' },
  { id:'aliados', titulo:'Alianzas con agencias de aduanas y transportadores', icono:'🔗', impacto:'medio',
    porque:'Ellos atienden importadores todos los días y no siempre hacen consolidación o carga desde Miami.',
    pasos:['Haz una lista de 10 agencias de aduanas y empresas de transporte', 'Ofréceles una comisión por cliente referido (Red comercial)', 'Dales tu propuesta de tarifas en PDF', 'Seguimiento cada 15 días'],
    kpi:'Aliados activos y clientes que traen' },
  { id:'contenido', titulo:'Contenido que demuestra que sí entregas', icono:'🎬', impacto:'medio',
    porque:'La duda del importador es: ¿llega o no llega? Mostrar cargas reales llegando genera confianza.',
    pasos:['Publica 3 veces por semana (mira Ideas de contenido)', 'Graba cada contenedor que se abre y cada entrega (con permiso del cliente)', 'Un caso real a la semana: qué trajo, cuánto tardó, cuánto pagó todo incluido', 'Responde todos los comentarios llevando a WhatsApp'],
    kpi:'Mensajes que llegan desde redes' },
  { id:'grupos', titulo:'Grupos y comunidades de importadores', icono:'👥', impacto:'medio',
    porque:'En grupos de WhatsApp y Facebook de emprendedores y comerciantes se pregunta todos los días "¿quién trae de China?".',
    pasos:['Únete a 10 grupos de emprendedores y comerciantes de la región', 'Aporta valor: tips de importación, sin hacer spam', 'Publica la fecha de cierre de cada consolidado', 'Lleva a la gente a tu WhatsApp con un link directo'],
    kpi:'Prospectos que llegan de grupos' },
  { id:'webinar', titulo:'Charla "Importa desde China sin riesgo"', icono:'🎤', impacto:'medio',
    porque:'Educar posiciona: quien aprende contigo, importa contigo.',
    pasos:['Agenda una charla en vivo de 45 minutos (Meet o Instagram Live)', 'Temas: cómo se paga, cómo se consolida, cuánto cuesta todo incluido', 'Pide WhatsApp para inscribirse (quedan como prospectos)', 'Al final, oferta de primer consolidado'],
    kpi:'Inscritos y cotizaciones después de la charla' },
  { id:'oferta', titulo:'Oferta de entrada para el primer envío', icono:'🎯', impacto:'alto',
    porque:'Quitarle el miedo al primer envío. Después del primero, se quedan por el servicio.',
    pasos:['Define la oferta: un beneficio en el primer m³ o en el primer envío desde Miami', 'Úsala en la pauta, en las visitas y en los grupos', 'Ponle fecha límite real (el cierre del consolidado)', 'Mide cuántos repiten después del primer envío'],
    kpi:'Primeros envíos y cuántos repiten' },
  { id:'reactivar', titulo:'Reactivar clientes dormidos', icono:'🔁', impacto:'alto',
    porque:'Es más barato vender otra vez que conseguir un cliente nuevo.',
    pasos:['Filtra en Campañas los clientes sin contacto hace 30 días', 'Mándales la campaña de reactivación', 'Ponlos en la secuencia "Cliente dormido"', 'Repite cada mes'],
    kpi:'Clientes reactivados al mes' },
]

// Ideas de contenido para redes
export const IDEAS_CONTENIDO = [
  { tema:'Así llega un contenedor de China a Barranquilla', formato:'reel', red:'instagram', copy:'Del puerto de Shanghái a tu bodega en Barranquilla. Todo incluido: flete, legalización y entrega. ¿Qué quieres traer? Escríbenos 👉 WhatsApp.' },
  { tema:'Cuánto cuesta traer 1 m³ de China, todo incluido', formato:'carrusel', red:'instagram', copy:'Sin letra pequeña: flete, nacionalización y entrega en un solo precio por m³. Desliza y mira qué incluye.' },
  { tema:'Cierre del consolidado de esta semana', formato:'historia', red:'instagram', copy:'⏳ Últimos días para entrar al consolidado. Separa tu espacio por WhatsApp.' },
  { tema:'Miami semanal: tu carga cada semana', formato:'post', red:'facebook', copy:'Salidas semanales desde Miami. Recibimos en nuestra bodega y te lo entregamos en Barranquilla.' },
  { tema:'Caso real: lo que trajo un cliente y cuánto pagó', formato:'reel', red:'instagram', copy:'Caso real de esta semana: qué trajo, en cuánto tiempo llegó y cuánto pagó todo incluido.' },
  { tema:'3 errores al importar por primera vez', formato:'carrusel', red:'instagram', copy:'1. No pedir la lista de empaque. 2. No calcular el costo total. 3. Escoger el flete más barato sin legalización. Te ayudamos a hacerlo bien.' },
  { tema:'¿Qué es un consolidado y por qué te ahorra plata?', formato:'reel', red:'tiktok', copy:'Compartes contenedor con otros importadores y pagas solo tu espacio. Así se importa sin llenar un contenedor completo.' },
  { tema:'Mula con contenedor de 40 pies saliendo del puerto', formato:'historia', red:'instagram', copy:'Transporte de puerto a bodega con escolta y coteros. Te lo coordinamos completo.' },
  { tema:'Rastreo en tiempo real para cada cliente', formato:'post', red:'instagram', copy:'Cada cliente tiene su portal: ve dónde va su carga, sus documentos y su cuenta. Sin llamadas.' },
  { tema:'Detrás de cámaras: abriendo cajas en bodega', formato:'reel', red:'tiktok', copy:'Así revisamos y medimos cada caja antes de que salga. Cero sorpresas.' },
  { tema:'Testimonio de cliente', formato:'reel', red:'instagram', copy:'Lo que dicen los que ya importan con nosotros.' },
  { tema:'Mercancía general vs. especial: qué puedes traer', formato:'carrusel', red:'facebook', copy:'Hay productos que piden permisos especiales. Te explicamos cuáles y cómo los manejamos.' },
  { tema:'Estado de WhatsApp: salida de la semana', formato:'estado', red:'whatsapp', copy:'Esta semana sale carga desde Miami y cierra el consolidado de China. Pregúntame por tu espacio.' },
  { tema:'Tip: cómo pedirle al proveedor la lista de empaque', formato:'post', red:'linkedin', copy:'La lista de empaque correcta ahorra días en aduana. Esto es lo que debe traer.' },
]

// Públicos sugeridos para pauta en Meta (Ads Manager → público guardado)
export const PUBLICOS_META = [
  { nombre:'Comerciantes y emprendedores · Caribe', ubicacion:'Barranquilla, Soledad, Malambo, Cartagena, Santa Marta (+25 km)', edad:'24–55', intereses:'Pequeña empresa, emprendimiento, comercio electrónico, importación, Alibaba, mayoristas', servicio:'China integral / Miami semanal' },
  { nombre:'Importadores de electrónica y accesorios', ubicacion:'Costa Caribe + Bogotá + Medellín', edad:'25–50', intereses:'Accesorios para celulares, electrónica, AliExpress, Alibaba, ventas al por mayor', servicio:'Consolidado China' },
  { nombre:'Tiendas de perfumes, ropa y calzado', ubicacion:'Costa Caribe', edad:'22–50', intereses:'Perfumes, moda, calzado, tiendas de ropa, ventas por catálogo', servicio:'Miami semanal' },
  { nombre:'Empresas que mueven carga en la región', ubicacion:'Barranquilla, Cartagena, Santa Marta', edad:'28–60', intereses:'Logística, transporte, comercio exterior, construcción, industria', servicio:'Transporte terrestre y coteros' },
]