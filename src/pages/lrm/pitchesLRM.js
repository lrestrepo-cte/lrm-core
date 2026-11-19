// Biblioteca de pitches y enganches de LRM Trade Consulting.
// Estos son los de arranque; en CRM → Pitches se editan, se agregan y quedan guardados (lrm_ajustes, clave 'pitches').
// Los nuevos que se agreguen aquí aparecen solos aunque ya se haya guardado la lista.
// {nombre} se reemplaza por el primer nombre del cliente al enviarlo.

export const ETAPAS_PITCH = [
  { id:'enganche',    nombre:'Enganche',      desc:'Primer mensaje para abrir la conversación' },
  { id:'pitch',       nombre:'Pitch',         desc:'Qué hace LRM y por qué confiar' },
  { id:'seguimiento', nombre:'Seguimiento',   desc:'Para retomar sin presionar' },
  { id:'objecion',    nombre:'Objeciones',    desc:'Respuestas a las dudas de siempre' },
  { id:'cierre',      nombre:'Cierre',        desc:'Para arrancar la primera carga' },
  { id:'postventa',   nombre:'Postventa',     desc:'Después de entregar, para que repita' },
  { id:'referidos',   nombre:'Referidos',     desc:'Para que un cliente te traiga otro' },
]

export const PUBLICOS_PITCH = ['Conocidos', 'Negocios', 'Empresas', 'Emprendedores']

const P = (id, publico, nicho, etapa, titulo, texto) => ({ id, publico, nicho, etapa, titulo, texto })

export const PITCHES_LRM = [
  // ── Para cualquiera ─────────────────────────────────────────────────────
  P('g1','Todos','Todos','enganche','Primer contacto',
    'Hola {nombre}, ¿cómo vas? Te escribo porque estoy moviendo mercancía desde Miami, China y Panamá hasta Barranquilla con LRM Trade Consulting. Si en algún momento traes producto de afuera, me encantaría ayudarte a que te llegue seguro y a buen precio. ¿Hoy cómo estás trayendo tu mercancía?'),
  P('g2','Todos','Todos','pitch','Qué hacemos en LRM',
    'En LRM Trade nos encargamos de todo: tu mercancía llega a nuestra bodega en Miami (o en China o Panamá) y te la entregamos en Barranquilla, segura y a tiempo. Sabes en qué va cada caja y pagas por kilo, sin sorpresas. Lo que te vendo es tranquilidad: que tu carga llegue completa y cuando tiene que llegar.'),
  P('g3','Todos','Todos','seguimiento','Después de mandar la cotización',
    'Hola {nombre}, ¿pudiste revisar la cotización que te mandé? Si quieres hacemos una primera carga pequeña de prueba para que veas cómo trabajamos. Quedo atento.'),
  P('g4','Todos','Todos','seguimiento','Retomar una conversación fría',
    '{nombre}, ¿cómo va todo? Te escribo porque esta temporada estamos sacando carga cada semana desde Miami. Si tienes pedido para diciembre, todavía alcanzamos a traerlo a tiempo. ¿Lo revisamos?'),
  P('g5','Todos','Todos','objecion','“Está caro”',
    'Te entiendo. Antes de comparar solo el precio por kilo, mira lo que incluye: bodega, envío y entrega en Barranquilla, con seguimiento de cada caja. Lo barato sale caro cuando la carga se demora o llega incompleta. Si me dices cuánto mueves al mes, te ajusto la tarifa por volumen.'),
  P('g6','Todos','Todos','objecion','“Ya tengo con quién traer”',
    'Perfecto, eso habla bien: ya importas. No te pido que cambies todo. Mándame una sola carga y compara tiempos, trato y precio. Si no te convence, sigues con tu proveedor y quedamos como amigos.'),
  P('g7','Todos','Todos','objecion','“¿Y si se pierde la mercancía?”',
    'Es la pregunta correcta. Cada caja queda registrada con su peso desde que llega a la bodega, y te aviso en cada etapa: cuando sale, cuando llega a Colombia y cuando está lista. Nada se mueve sin que sepas dónde está.'),
  P('g10','Todos','Todos','objecion','“Déjame pensarlo”',
    'Claro, piénsalo con calma. Para ayudarte a decidir, ¿te mando un ejemplo de cuánto te costaría tu último pedido con nosotros? Así comparas con números y no con palabras.'),
  P('g11','Todos','Todos','objecion','“¿Cuánto se demora?”',
    'Desde que sale de Miami son unos 8 días por marítimo y unos 3 por aéreo. Y en cada etapa te aviso: cuando sale, cuando llega a Colombia y cuando está lista para entregarte.'),
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
    'Es sencillo: tu proveedor manda la mercancía a mi bodega en Miami, yo te aviso cuando llega con el peso de cada caja, y en unos 8 días la tienes en Barranquilla. Pagas por kilo y siempre sabes dónde va.'),
  P('k5','Conocidos','Todos','seguimiento','Sin presión',
    '{nombre}, ¿cómo vas? No te quiero acosar 😅, solo recordarte que si tienes algún pedido pendiente para traer, aquí estoy. Esta semana sale carga de Miami.'),
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
    'Diciembre es cuando más se vende, y la mercancía tiene que estar en tu tienda a tiempo. Si haces el pedido ahora, te lo tengo en Barranquilla antes de la temporada fuerte.'),
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
    'Hola {nombre}, estoy trayendo perfumería desde Miami cada semana para distribuidores de Barranquilla. Tarifa por kilo, entrega en unos 8 días y seguimiento de cada caja. ¿Te cotizo tu próximo pedido?'),
  P('p3','Negocios','Perfumes','enganche','Surtido para diciembre',
    'Hola {nombre}, ¿ya tienes el surtido de perfumes para diciembre? Estoy sacando carga de Miami cada semana para perfumerías de Barranquilla, por kilo y con entrega segura. ¿Te cotizo?'),
  P('p2','Todos','Perfumes','pitch','Cómo movemos perfumes',
    'Para perfumes tenemos bodega en Miami, revisamos cada caja al llegar y te la entregamos en Barranquilla, segura y a tiempo. Cobro por kilo, sin cargos escondidos, y te aviso cuando sale, cuando llega a Colombia y cuando está lista.'),
  P('p4','Todos','Perfumes','objecion','“¿Y si se rompen los perfumes?”',
    'Cada caja se revisa al llegar a la bodega y viaja bien embalada. Te aviso el peso y el estado de cada caja antes de que salga, para que no haya sorpresas.'),
  P('c1','Negocios','Celulares','enganche','Tienda de celulares',
    'Hola {nombre}, ¿cómo va la tienda? Estoy trayendo celulares de Miami con precio por unidad y entrega segura en Barranquilla. Si mueves equipos cada semana, te armo un precio fijo por caja.'),
  P('c2','Todos','Celulares','pitch','Seguridad y tiempo',
    'Con celulares lo importante es seguridad y tiempo. Recibimos los equipos en Miami, se verifican, viajan protegidos y te los entrego en Barranquilla. Precio por unidad, con mínimo de una caja de 50 equipos.'),
  P('c4','Todos','Celulares','objecion','“Me da miedo mandar equipos”',
    'Los equipos se verifican al llegar a la bodega, viajan protegidos y te aviso en cada etapa. Nada se mueve sin que sepas dónde está.'),
  P('s1','Emprendedores','Cosméticos','enganche','Tienda de cosméticos',
    'Hola {nombre}, vi que manejas cosméticos. Estoy trayendo maquillaje y skincare desde Miami a Barranquilla, cobrando por peso y con entrega rápida. ¿Te mando una cotización para tu próximo pedido?'),
  P('s2','Todos','Cosméticos','pitch','Cosméticos por peso',
    'Para cosméticos y skincare cobramos por peso, así no pagas de más por cajas livianas. Recibimos en Miami, revisamos y te entregamos en Barranquilla en unos 8 días.'),
  P('t1','Negocios','Computadores','enganche','Computadores y electrónica',
    'Hola {nombre}, ¿estás trayendo computadores o electrónica de afuera? Manejo envíos desde Miami y China con seguimiento de cada caja y entrega en Barranquilla. Te cotizo sin compromiso.'),
  P('t2','Todos','Computadores','pitch','Equipos tecnológicos',
    'Computadores, tablets y accesorios viajan protegidos, con verificación al llegar a la bodega y aviso en cada etapa. Pagas por peso o por unidad, como te convenga más.'),
  P('r1','Negocios','Partes y repuestos','enganche','Repuestos y partes',
    'Hola {nombre}, ¿traen repuestos de afuera? Estoy moviendo partes y repuestos desde Miami y China con entrega en Barranquilla y seguimiento de cada caja. Te cotizo sin compromiso.'),
  P('h1','Negocios','Electrodomésticos','enganche','Electrodomésticos',
    'Hola {nombre}, ¿traes electrodomésticos de afuera? Los movemos desde Miami y China hasta Barranquilla, bien protegidos y con aviso en cada etapa. ¿Te cotizo el próximo pedido?'),
]

// Une lo guardado con los de arranque: los nuevos aparecen solos y los que borraste no vuelven
export function unirPitches(guardado) {
  const items = Array.isArray(guardado) ? guardado : (guardado?.items || [])
  const borrados = Array.isArray(guardado) ? [] : (guardado?.borrados || [])
  const ids = new Set(items.map(p => p.id))
  const faltantes = PITCHES_LRM.filter(p => !ids.has(p.id) && !borrados.includes(p.id))
  return { items: [...items.map(p => ({ publico:'Todos', ...p })), ...faltantes], borrados }
}