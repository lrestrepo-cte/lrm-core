// Biblioteca de pitches y enganches de LRM Trade Consulting.
// Estos son los de arranque; en CRM → Pitches se editan, se agregan y quedan guardados (lrm_ajustes, clave 'pitches').
// Los nuevos que se agreguen aquí aparecen solos aunque ya se haya guardado la lista.
// {nombre} se reemplaza por el primer nombre del cliente al enviarlo.

export const ETAPAS_PITCH = [
  { id:'enganche',    nombre:'Enganche',      desc:'Primer mensaje para abrir la conversación' },
  { id:'pitch',       nombre:'Pitch',         desc:'Qué hace LRM y por qué confiar' },
  { id:'presentacion',nombre:'Presentación completa', desc:'Todo en un mensaje: casillero, tiempos, logística y cómo se cobra' },
  { id:'tarifas',     nombre:'Abrebocas de tarifas', desc:'Rangos de referencia para el cliente ya creado; la tarifa final sale de su tarifario' },
  { id:'seguimiento', nombre:'Seguimiento',   desc:'Para retomar sin presionar' },
  { id:'objecion',    nombre:'Objeciones',    desc:'Respuestas a las dudas de siempre' },
  { id:'cierre',      nombre:'Cierre',        desc:'Para arrancar la primera carga' },
  { id:'postventa',   nombre:'Postventa',     desc:'Después de entregar, para que repita' },
  { id:'referidos',   nombre:'Referidos',     desc:'Para que un cliente te traiga otro' },
  { id:'comercial',   nombre:'Comerciales',   desc:'Para estados de WhatsApp, listas de difusión e Instagram' },
  { id:'promocion',   nombre:'Promociones',   desc:'Plantillas: cambia lo que está entre llaves antes de enviar' },
]

export const PUBLICOS_PITCH = ['Conocidos', 'Negocios', 'Empresas', 'Emprendedores']

// v: versión del texto. Si se sube, reemplaza la copia guardada (por ejemplo, cuando cambian los tiempos)
const P = (id, publico, nicho, etapa, titulo, texto, v = 1) => ({ id, publico, nicho, etapa, titulo, texto, v })

// ── La operación, en un solo lugar (los pitches y el portal dicen lo mismo) ─────
export const LOGISTICA = {
  maritimo: {
    que: 'Perfumes y carga general',
    cargues: 'Cargamos contenedor dos veces por semana: lunes y viernes',
    reglas: [['Llega lunes, martes o miércoles', 'sale el viernes'], ['Llega jueves, viernes o sábado', 'sale el lunes']],
    transito: 'De 8 a 11 días desde que se carga hasta la entrega',
    total: 'Entre 10 y 15 días desde que llega a la bodega en Miami',
  },
  aereo: {
    que: 'Celulares y equipos Apple (iPhone, iPad, MacBook)',
    salida: 'Sale los jueves y se entrega martes o miércoles',
    nota: 'Los equipos Apple siempre van por aéreo, nunca por marítimo',
  },
}

export const PITCHES_LRM = [
  // ── Para cualquiera ─────────────────────────────────────────────────────
  P('g1','Todos','Todos','enganche','Primer contacto',
    'Hola {nombre}, ¿cómo vas? Te escribo porque estoy moviendo mercancía desde Miami, China y Panamá hasta Barranquilla con LRM Trade Consulting. Si en algún momento traes producto de afuera, me encantaría ayudarte a que te llegue seguro y a buen precio. ¿Hoy cómo estás trayendo tu mercancía?'),
  P('g2','Todos','Todos','pitch','Qué hacemos en LRM',
    'En LRM Trade nos encargamos de todo: tu mercancía llega a nuestra bodega en Miami (o en China o Panamá) y te la entregamos en Barranquilla, segura y a tiempo. Sabes en qué va cada caja y pagas por kilo, sin sorpresas. Lo que te vendo es tranquilidad: que tu carga llegue completa y cuando tiene que llegar.'),
  P('g3','Todos','Todos','seguimiento','Después de mandar la cotización',
    'Hola {nombre}, ¿pudiste revisar la cotización que te mandé? Si quieres hacemos una primera carga pequeña de prueba para que veas cómo trabajamos. Quedo atento.'),
  P('g4','Todos','Todos','seguimiento','Retomar una conversación fría',
    '{nombre}, ¿cómo va todo? Te escribo porque esta temporada estamos cargando contenedor dos veces por semana desde Miami. Si tienes pedido para diciembre, todavía alcanzamos a traerlo a tiempo. ¿Lo revisamos?', 2),
  P('g5','Todos','Todos','objecion','“Está caro”',
    'Te entiendo. Antes de comparar solo el precio por kilo, mira lo que incluye: bodega, envío y entrega en Barranquilla, con seguimiento de cada caja. Lo barato sale caro cuando la carga se demora o llega incompleta. Si me dices cuánto mueves al mes, te ajusto la tarifa por volumen.'),
  P('g6','Todos','Todos','objecion','“Ya tengo con quién traer”',
    'Perfecto, eso habla bien: ya importas. No te pido que cambies todo. Mándame una sola carga y compara tiempos, trato y precio. Si no te convence, sigues con tu proveedor y quedamos como amigos.'),
  P('g7','Todos','Todos','objecion','“¿Y si se pierde la mercancía?”',
    'Es la pregunta correcta. Cada caja queda registrada con su peso desde que llega a la bodega, y te aviso en cada etapa: cuando sale, cuando llega a Colombia y cuando está lista. Nada se mueve sin que sepas dónde está.'),
  P('g10','Todos','Todos','objecion','“Déjame pensarlo”',
    'Claro, piénsalo con calma. Para ayudarte a decidir, ¿te mando un ejemplo de cuánto te costaría tu último pedido con nosotros? Así comparas con números y no con palabras.'),
  P('g11','Todos','Todos','objecion','“¿Cuánto se demora?”',
    'Depende de cómo viaje. Por marítimo cargamos contenedor lunes y viernes, y desde que se carga son de 8 a 11 días hasta la entrega: en total, entre 10 y 15 días desde que llega a la bodega en Miami. Los celulares y los equipos Apple van por aéreo: salen los jueves y se entregan martes o miércoles. En cada etapa te aviso.', 2),
  P('g12','Todos','Todos','objecion','“No tengo proveedor afuera”',
    'No hay problema. Si ya sabes qué quieres traer, te oriento con proveedores en Miami o China y nosotros nos encargamos de que llegue hasta ti.'),
  P('g8','Todos','Todos','cierre','Arrancar la primera carga',
    '{nombre}, para arrancar solo necesito que tu proveedor envíe la mercancía a nuestra bodega en Miami. Yo te paso la dirección y apenas llegue te aviso con el peso de cada caja. ¿Te la mando?'),
  P('v1','Todos','Todos','postventa','Después de entregar',
    '{nombre}, ¿cómo te llegó todo? Quiero asegurarme de que hayas quedado contento con el servicio. Cualquier cosa que podamos mejorar, me dices con toda confianza.'),
  P('v2','Todos','Todos','postventa','Pedir un testimonio',
    '{nombre}, ¿me haces un favor? Si quedaste contento con LRM Trade, mándame un mensajito contando cómo te fue. Me ayuda mucho para que otros confíen como tú.'),
  P('v3','Todos','Todos','postventa','Recordar el próximo pedido',
    'Hola {nombre}, ya van unas semanas desde tu último pedido. ¿Vas a traer algo para la próxima temporada? Esta semana sale carga de Miami y todavía hay espacio.'),
  P('g9','Todos','Todos','referidos','Pedir referidos',
    '{nombre}, gracias por confiar en LRM. Si conoces a alguien que traiga mercancía de afuera y quiera un servicio serio, pásame su contacto y lo atiendo como a ti. Te lo agradezco mucho.'),

  // ── Conocidos (amigos, familia, gente de confianza) ─────────────────────
  P('k1','Conocidos','Todos','enganche','Saludo casual',
    '¡Quiubo {nombre}! ¿Cómo va todo? Te cuento que estoy trayendo mercancía de Miami, China y Panamá para varios negocios aquí en Barranquilla. Si tú o alguien que conozcas trae cosas de afuera, avísame y te hago precio de amigo.'),
  P('k2','Conocidos','Todos','enganche','Respondiendo un estado de WhatsApp',
    'Hola {nombre}, vi tu estado y me acordé de ti. Ahora estoy con LRM Trade trayendo mercancía de afuera hasta Barranquilla. ¿Sigues con el negocio? Si en algún momento necesitas traer algo, cuenta conmigo.'),
  P('k3','Conocidos','Todos','enganche','Pregunta rápida',
    '{nombre}, una pregunta rápida: ¿tú cómo estás trayendo la mercancía de afuera? Te pregunto porque estoy moviendo carga de Miami a Barranquilla y le estoy ayudando a varios conocidos a pagar menos y recibir más rápido.'),
  P('k4','Conocidos','Todos','pitch','Explicado fácil',
    'Es sencillo: tu proveedor manda la mercancía a mi bodega en Miami, yo te aviso cuando llega con el peso de cada caja, y por marítimo en 10 a 15 días la tienes en Barranquilla. Tarifa clara desde el principio y siempre sabes dónde va.', 2),
  P('k5','Conocidos','Todos','seguimiento','Sin presión',
    '{nombre}, ¿cómo vas? No te quiero acosar 😅, solo recordarte que si tienes algún pedido pendiente para traer, aquí estoy. Cargamos contenedor lunes y viernes.', 2),
  P('k6','Conocidos','Todos','cierre','Prueba sin compromiso',
    'Hagamos una cosa {nombre}: mándame un pedido pequeño de prueba. Si te gusta el servicio, seguimos; si no, quedamos igual de amigos. ¿Te paso la dirección de la bodega?'),
  P('k7','Conocidos','Todos','referidos','Pedirle un contacto',
    '{nombre}, ¿tú conoces a alguien que traiga perfumes, celulares o ropa de afuera? Si me pasas el contacto te lo agradezco un montón, y lo atiendo como si fueras tú.'),

  // ── Negocios (tiendas, distribuidores, locales) ─────────────────────────
  P('n1','Negocios','Todos','enganche','Dueño de tienda',
    'Hola {nombre}, mucho gusto, soy Luis de LRM Trade Consulting. Trabajamos con negocios de Barranquilla trayéndoles mercancía desde Miami, China y Panamá. ¿Tu tienda hoy importa directo o le compra a un mayorista?'),
  P('n2','Negocios','Todos','enganche','Para decirlo en persona (visita)',
    'Buenas, ¿hablo con el dueño o con quien hace los pedidos? Soy Luis, de LRM Trade. Le ayudamos a negocios como el suyo a traer mercancía de afuera más barato y con entrega segura en Barranquilla. ¿Le puedo dejar mi WhatsApp para mandarle una cotización?'),
  P('n3','Negocios','Todos','pitch','Quédate con el margen',
    'Si importas directo en vez de comprarle al mayorista de aquí, ese margen se queda contigo. Nosotros recibimos en Miami, enviamos y te entregamos en Barranquilla. Tú solo te preocupas por vender.'),
  P('n4','Negocios','Todos','pitch','Llegar a tiempo para la temporada',
    'Diciembre es cuando más se vende. Por marítimo son de 10 a 15 días desde que llega a Miami, así que el pedido tiene que estar en bodega con tiempo. Dime para cuándo lo necesitas en tu tienda y te digo hasta qué día puede llegar a Miami.', 2),
  P('n5','Negocios','Todos','seguimiento','Después de la visita',
    'Hola {nombre}, gracias por atenderme hoy. Como te comenté, aquí tienes mi contacto de LRM Trade. Cuando tengas el próximo pedido, mándame la lista y te cotizo en el día.'),
  P('n6','Negocios','Todos','objecion','“Mi mayorista me fía”',
    'Entiendo, el crédito pesa. Pero mira cuánto te está costando ese crédito en el precio. Haz cuentas con una carga directa: muchas veces la diferencia te paga el pedido siguiente.'),
  P('n7','Negocios','Todos','cierre','Primer pedido',
    'Listo {nombre}, arranquemos. Te paso la dirección de nuestra bodega en Miami para que se la des a tu proveedor. Apenas llegue te mando el peso y la cotización final.'),

  // ── Empresas (área de compras, importadores, formal) ────────────────────
  P('e1','Empresas','Todos','enganche','Correo o LinkedIn al área de compras',
    'Buen día, {nombre}. Mi nombre es Luis Restrepo, de LRM Trade Consulting, empresa de Barranquilla especializada en importaciones desde Estados Unidos, China y Panamá. Apoyamos a empresas con la recepción en bodega, el envío y la entrega en Barranquilla, con trazabilidad de cada envío. ¿Sería posible agendar 15 minutos para conocer sus necesidades de importación?'),
  P('e2','Empresas','Todos','pitch','Propuesta de valor',
    'En LRM Trade ofrecemos bodega en Miami, recepción y verificación de cada pieza, tarifas por kilo según volumen, reporte de cada etapa del envío y entrega en Barranquilla. Un solo responsable para toda la operación, sin intermediarios.'),
  P('e3','Empresas','Todos','pitch','Carga recurrente',
    'Para empresas con carga recurrente manejamos tarifa por volumen mensual y prioridad en la salida de cada envío. Si nos comparte su volumen promedio, le preparamos una propuesta a la medida.'),
  P('e4','Empresas','Todos','seguimiento','Seguimiento formal',
    'Buen día, {nombre}. Le escribo para hacer seguimiento a la propuesta enviada. Quedo atento a sus comentarios o a cualquier ajuste que necesite su equipo.'),
  P('e5','Empresas','Todos','objecion','“Ya tenemos operador logístico”',
    'Entiendo. Muchas empresas trabajan con más de un operador para no depender de uno solo. Le propongo una carga de prueba para que compare tiempos, servicio y costo, sin compromiso.'),
  P('e6','Empresas','Todos','cierre','Formalizar',
    'Con gusto, {nombre}. Para iniciar le comparto la dirección de nuestra bodega en Miami y los datos de la primera orden. Quedamos atentos a la llegada de la mercancía para enviarle el reporte.'),

  // ── Emprendedores (venden por Instagram, WhatsApp, online) ──────────────
  P('m1','Emprendedores','Todos','enganche','Tienda en Instagram',
    '¡Hola {nombre}! Vi tu tienda en Instagram y me encantó 🙌 Soy Luis de LRM Trade, traemos mercancía desde Miami y China a Barranquilla. Si quieres traer tu propio inventario y ganar más por producto, te ayudo desde pedidos pequeños.'),
  P('m2','Emprendedores','Todos','pitch','Desde pocas cajas',
    'No necesitas traer un contenedor. Puedes empezar con una o dos cajas: compras en Miami o China, lo mandas a nuestra bodega y te lo entrego en Barranquilla. Pagas por lo que pesa.'),
  P('m3','Emprendedores','Todos','objecion','“Es mi primera vez importando”',
    'Tranqui, para eso estamos. Yo te acompaño en todo: te digo cómo mandar la mercancía a la bodega, te aviso cuando llega y cuando sale, y te la entrego. Tú solo compras y vendes.'),
  P('m4','Emprendedores','Todos','cierre','Arrancar con un pedido pequeño',
    '{nombre}, ¿qué te parece si arrancamos con un pedido pequeño para que veas cómo funciona? Te mando la dirección de la bodega y me avisas cuando compres.'),

  // ── Por nicho ───────────────────────────────────────────────────────────
  P('p1','Negocios','Perfumes','enganche','Distribuidor de perfumería',
    'Hola {nombre}, estoy trayendo perfumería desde Miami para distribuidores de Barranquilla. Cargamos contenedor dos veces por semana, con tarifa clara y seguimiento de cada caja. ¿Cómo estás surtiendo hoy?', 2),
  P('p3','Negocios','Perfumes','enganche','Surtido para diciembre',
    'Hola {nombre}, ¿ya tienes el surtido de perfumes para diciembre? Cargamos contenedor lunes y viernes desde Miami para perfumerías de Barranquilla, con entrega segura. ¿Te armo tu tarifa?', 2),
  P('p2','Todos','Perfumes','pitch','Cómo movemos perfumes',
    'Los perfumes van por marítimo, que es lo que mejor precio te da. Cargamos contenedor dos veces por semana, así que tu mercancía no se queda esperando más de 4 días en bodega. Cada caja se revisa al llegar y te aviso el peso antes de que salga. En total son de 10 a 15 días desde que llega a Miami.', 2),
  P('p4','Todos','Perfumes','objecion','“¿Y si se rompen los perfumes?”',
    'Cada caja se revisa al llegar a la bodega y viaja bien embalada. Te aviso el peso y el estado de cada caja antes de que salga, para que no haya sorpresas.'),
  P('c1','Negocios','Celulares','enganche','Tienda de celulares',
    'Hola {nombre}, ¿cómo va la tienda? Estoy trayendo iPhones, iPads y MacBooks desde Miami por aéreo, todas las semanas: salen los jueves y se entregan martes o miércoles. ¿Estás importando equipos o compras aquí?', 2),
  P('c2','Todos','Celulares','pitch','Celulares y Apple por aéreo',
    'Con equipos lo importante es seguridad y tiempo. Por eso los iPhones, iPads y MacBooks van siempre por aéreo, nunca por marítimo: salen los jueves y se entregan martes o miércoles. Cada equipo se verifica al llegar a la bodega, viaja protegido y te aviso en cada etapa. Precio por unidad, ajustado a tu volumen.', 2),
  P('c4','Todos','Celulares','objecion','“Me da miedo mandar equipos”',
    'Los equipos se verifican al llegar a la bodega, viajan por aéreo y protegidos, y te aviso en cada etapa: bodega, en camino, aduana, lista y entregada. Nada se mueve sin que sepas dónde está.', 2),
  P('s1','Emprendedores','Cosméticos','enganche','Tienda de cosméticos',
    'Hola {nombre}, vi que manejas cosméticos. Estoy trayendo maquillaje y skincare desde Miami a Barranquilla, cobrando por peso y con entrega rápida. ¿Te mando una cotización para tu próximo pedido?'),
  P('s2','Todos','Cosméticos','pitch','Cosméticos por peso',
    'Para cosméticos y skincare cobramos por peso, así no pagas de más por cajas livianas. Recibimos en Miami, revisamos y te entregamos en Barranquilla por marítimo, entre 10 y 15 días desde que llega a la bodega.', 2),
  P('t1','Negocios','Computadores','enganche','Computadores y electrónica',
    'Hola {nombre}, ¿estás trayendo computadores o electrónica de afuera? Manejo envíos desde Miami y China con seguimiento de cada caja y entrega en Barranquilla. Te cotizo sin compromiso.'),
  P('t2','Todos','Computadores','pitch','Equipos tecnológicos',
    'Computadores y accesorios viajan protegidos, con verificación al llegar a la bodega y aviso en cada etapa. Los equipos Apple (MacBook, iPad) van siempre por aéreo: salen los jueves y se entregan martes o miércoles. Te armo la tarifa por unidad o por peso, como te convenga más.', 2),
  P('r1','Negocios','Partes y repuestos','enganche','Repuestos y partes',
    'Hola {nombre}, ¿traen repuestos de afuera? Estoy moviendo partes y repuestos desde Miami y China con entrega en Barranquilla y seguimiento de cada caja. Te cotizo sin compromiso.'),
  P('h1','Negocios','Electrodomésticos','enganche','Electrodomésticos',
    'Hola {nombre}, ¿traes electrodomésticos de afuera? Los movemos desde Miami y China hasta Barranquilla, bien protegidos y con aviso en cada etapa. ¿Te cotizo el próximo pedido?'),
  // ── Enganches nuevos ────────────────────────────────────────────────────
  P('x1','Negocios','Todos','enganche','Pregunta de volumen',
    '{nombre}, una pregunta rápida: ¿cuánto estás moviendo al mes desde Miami? Te pregunto porque tengo una operación seria de casillero y le estoy ayudando a varios negocios a recibir más rápido y con mejor control.'),
  P('x2','Emprendedores','Todos','enganche','Compras online',
    'Hola {nombre}, ¿compras en Amazon o en tiendas de EE.UU. para tu negocio? Te puedo dar tu propio casillero en Miami con código. Tú compras y yo te lo traigo a Barranquilla.'),
  P('x3','Todos','Todos','enganche','Casillero con trayectoria',
    'Te cuento: trabajo con un casillero que tiene más de 40 años en el mercado. Serio, organizado y puntual. Llevo más de 6 años con ellos moviendo mercancía sensible, y ahora estoy abriendo la línea de celulares. ¿Qué estás trayendo hoy?'),

  // ── Presentación completa ───────────────────────────────────────────────
  P('x10','Todos','Todos','presentacion','Todo en un mensaje',
    'Te cuento cómo trabajamos, {nombre}:\n\n🏢 Trabajo con un casillero en Miami que tiene más de 40 años en el mercado. Es serio, organizado y puntual, y llevo más de 6 años con ellos moviendo mercancía sensible.\n\n📦 Tienes tu propio casillero con código. Compras, lo mandas ahí y apenas llega te aviso con el peso y las medidas de cada caja.\n\n🚢 Marítimo (perfumes y carga general): cargamos contenedor dos veces por semana.\n• Llega lunes, martes o miércoles → sale el viernes\n• Llega jueves, viernes o sábado → sale el lunes\nDe 8 a 11 días desde que sale; en total, entre 10 y 15 días desde que llega a Miami.\n\n✈️ Aéreo (iPhone, iPad, MacBook y celulares): sale los jueves y se entrega martes o miércoles. Los equipos Apple siempre van por aéreo, nunca por marítimo.\n\n📱 Sigues cada envío desde tu celular: bodega, en camino, aduana, lista y entregada.\n\n💰 Te armo un tarifario a tu medida según lo que traes y cuánto mueves, sin cobros sorpresa.\n\n¿Qué traes y más o menos cuánto al mes? Con eso te armo tu tarifa.'),
  P('x11','Todos','Todos','presentacion','Versión corta',
    'Casillero en Miami con más de 40 años en el mercado. Marítimo dos veces por semana (10 a 15 días en total) y aéreo cada jueves para Apple y celulares (se entrega martes o miércoles). Tu propio código, seguimiento desde el celular y tarifa armada a tu medida. ¿Qué estás trayendo?'),
  P('x12','Todos','Celulares','presentacion','Celulares y Apple completo',
    'Con equipos lo importante es seguridad y tiempo. Por eso los iPhones, iPads y MacBooks van siempre por aéreo, nunca por marítimo: salen los jueves y se entregan martes o miércoles. Cada equipo se verifica al llegar a la bodega, viaja protegido y te aviso en cada etapa. El precio es por unidad y se ajusta según tu volumen. Con un casillero de más de 40 años en el mercado detrás. ¿Cuántos equipos mueves al mes?'),
  P('x13','Todos','Perfumes','presentacion','Perfumes completo',
    'Los perfumes van por marítimo, que es lo que mejor precio te da.\n\n🚢 Cargamos contenedor dos veces por semana:\n• Llega lunes, martes o miércoles → sale el viernes\n• Llega jueves, viernes o sábado → sale el lunes\n\nDesde que se carga son de 8 a 11 días hasta la entrega; en total, entre 10 y 15 días desde que llega a Miami. Cada caja se revisa al llegar, te aviso el peso antes de que salga y la sigues desde tu celular. La tarifa te la armo a tu medida según tu volumen.'),

  // ── Abrebocas de tarifas (cliente ya creado) ───────────────────────────
  P('x20','Todos','Celulares','tarifas','Referencia celulares',
    '{nombre}, para que tengas una idea: los celulares están entre 125.000 y 160.000 por unidad, según el equipo y el volumen. Esa es la referencia; con lo que muevas al mes te armo tu tarifario y podemos manejarte una mejor.'),
  P('x21','Todos','Perfumes','tarifas','Referencia perfumes',
    '{nombre}, los perfumes van por marítimo y se cobran por kilo. La tarifa baja a medida que sube el volumen: mientras más traes, mejor te sale. Dime más o menos cuántos kilos mueves al mes y te paso tu referencia y tu tarifario a tu medida.'),
  P('x22','Todos','Todos','tarifas','Cómo se arma tu tarifa',
    'Tu tarifa no es una tabla general: la armo con lo que traes, cómo viaja y cuánto mueves. Tienes precio por categoría y lo sabes antes de comprar, sin cobros sorpresa, y con cada envío te llega una cuenta de cobro detallada: qué llegó, cuánto pesó y cuánto pagaste.'),
  P('x23','Todos','Todos','tarifas','Peso o volumen',
    'Para carga general te cobro por peso o por volumen, lo que mejor le convenga a tu mercancía. Hay mercancía liviana que ocupa mucho y otra pesada que ocupa poco. Mándame las medidas de las cajas y te digo exacto cuánto te sale.'),

  // ── Objeciones nuevas ───────────────────────────────────────────────────
  P('x30','Todos','Celulares','objecion','“¿Por qué Apple no va marítimo?”',
    'Porque no es recomendable. Los equipos Apple van por aéreo, más rápido y más seguro, y llegan en una semana. Prefiero que te llegue bien a que te ahorres poco y arriesgues mucho.'),
  P('x31','Todos','Todos','objecion','“Mi proveedor se demora / no sé dónde va”',
    'Conmigo sabes el día exacto en que se carga tu mercancía (lunes o viernes) y la sigues desde tu celular: bodega, en camino, aduana, lista y entregada. Sin estar preguntando.'),
  P('x32','Todos','Todos','objecion','“Lo necesito ya”',
    'Te entiendo. Los celulares y los equipos Apple van por aéreo y llegan en una semana. Para el resto, el marítimo te deja más margen: de 10 a 15 días, pero pagas mucho menos. Si me dices para cuándo lo necesitas, te digo hasta qué día tiene que llegar a Miami.'),

  // ── Seguimiento y cierre ────────────────────────────────────────────────
  P('x40','Todos','Todos','seguimiento','Después del abrebocas',
    '{nombre}, ¿pudiste revisar la referencia de tarifas que te pasé? Si me confirmas qué traes y cuánto, te dejo tu tarifario listo hoy.'),
  P('x41','Negocios','Todos','seguimiento','Planear el pedido',
    'Un tip, {nombre}: si tu proveedor te despacha para que llegue a Miami entre lunes y miércoles, sale ese mismo viernes. Así planeas tu surtido con fecha y no a ojo.'),
  P('x42','Todos','Todos','cierre','Cierre con casillero',
    '{nombre}, para arrancar te creo tu casillero ahora y te mando la dirección por aquí. La próxima compra la mandas ahí y yo te aviso cuando llegue a la bodega. ¿Te lo creo?'),

  // ── Postventa ───────────────────────────────────────────────────────────
  P('x50','Todos','Todos','postventa','Aviso de salida marítima',
    '{nombre}, tu carga salió hoy de Miami 🚢. Son de 8 a 11 días hasta la entrega y te aviso cuando llegue a Colombia. Puedes verla en tu portal.'),
  P('x51','Todos','Celulares','postventa','Aviso de salida aérea',
    '{nombre}, tus equipos salieron hoy de Miami ✈️. Se entregan el martes o el miércoles y te aviso cuando lleguen. Puedes verlos en tu portal.'),

  // ── Comerciales (estados, difusión, Instagram) ─────────────────────────
  P('x60','Todos','Todos','comercial','Tiempos',
    '🚢 Marítimo: salidas lunes y viernes, entrega en 8 a 11 días.\n✈️ Aéreo: sale cada jueves y llega martes o miércoles.\nMiami → Barranquilla con LRM Trade. Escríbeme.'),
  P('x61','Todos','Celulares','comercial','Apple por aéreo',
    '📱💻 iPhone, iPad y MacBook desde Miami, siempre por aéreo y con cada equipo verificado. Sale el jueves y llega martes o miércoles. LRM Trade.'),
  P('x62','Todos','Todos','comercial','Casillero',
    '📦 ¿Compras en Amazon? Ten tu propio casillero en Miami con código y sigue tu paquete desde el celular. Te lo traemos a Barranquilla. Escríbeme y te lo creo hoy.'),
  P('x63','Todos','Todos','comercial','Confianza',
    'Más de 40 años en el mercado. Más de 6 años moviendo mercancía sensible. Tu carga llega completa y sabes dónde va en todo momento. LRM Trade Consulting.'),
  P('x64','Todos','Todos','comercial','Corte de la semana',
    '⏰ Lo que llegue a la bodega en Miami hasta el miércoles sale este viernes. ¿Tienes algo por despachar? Todavía alcanzas.'),
  P('x65','Todos','Perfumes','comercial','Perfumes dos veces por semana',
    '🌸 Perfumería desde Miami con salida de contenedor lunes y viernes. Cada caja revisada y seguimiento desde tu celular. LRM Trade · Barranquilla.'),

  // ── Promociones (plantillas: cambia lo que está entre llaves) ──────────
  P('x70','Todos','Todos','promocion','Promo de la semana',
    '🔥 Este {día}: {categoría} a {precio}. Aplica para lo que llegue a bodega hasta el {fecha de corte}. Escríbeme y te separo el cupo.'),
  P('x71','Todos','Todos','promocion','Promo por volumen',
    '📦 Esta semana, si traes más de {cantidad}, te dejo {categoría} en {precio}. Solo hasta el {fecha}.'),
  P('x72','Todos','Todos','promocion','Bienvenida cliente nuevo',
    '🎁 Tu primer envío con LRM Trade con tarifa de bienvenida: {precio} en {categoría}. Válido hasta el {fecha}.'),
  P('x73','Todos','Celulares','promocion','Promo equipos',
    '📱 Este jueves sale aéreo: {equipo} a {precio} por unidad si llega a bodega antes del {fecha de corte}. Cupos limitados, escríbeme.'),
]

// Une lo guardado con los de arranque: los nuevos aparecen solos y los que borraste no vuelven
export function unirPitches(guardado) {
  const items = Array.isArray(guardado) ? guardado : (guardado?.items || [])
  const borrados = Array.isArray(guardado) ? [] : (guardado?.borrados || [])
  // Si el texto de arranque tiene una versión más nueva que la guardada, se usa el nuevo (ej.: cambiaron los tiempos)
  const nuevo = id => PITCHES_LRM.find(p => p.id === id)
  const actualizados = items.map(p => { const n = nuevo(p.id); return n && (n.v || 1) > (p.v || 1) ? { ...n } : p })
  const ids = new Set(actualizados.map(p => p.id))
  const faltantes = PITCHES_LRM.filter(p => !ids.has(p.id) && !borrados.includes(p.id))
  return { items: [...actualizados.map(p => ({ publico:'Todos', ...p })), ...faltantes], borrados }
}