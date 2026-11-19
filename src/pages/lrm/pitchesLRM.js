// Biblioteca de pitches y enganches de LRM Trade Consulting.
// Estos son los de arranque; en CRM → Pitches se editan, se agregan y quedan guardados (lrm_ajustes, clave 'pitches').
// {nombre} se reemplaza por el primer nombre del cliente al enviarlo.

export const ETAPAS_PITCH = [
  { id:'enganche',    nombre:'Enganche',      desc:'Primer mensaje para abrir la conversación' },
  { id:'pitch',       nombre:'Pitch',         desc:'Qué hace LRM y por qué confiar' },
  { id:'seguimiento', nombre:'Seguimiento',   desc:'Para retomar sin presionar' },
  { id:'objecion',    nombre:'Objeciones',    desc:'Respuestas a las dudas de siempre' },
  { id:'cierre',      nombre:'Cierre',        desc:'Para arrancar la primera carga' },
  { id:'referidos',   nombre:'Referidos',     desc:'Para que un cliente te traiga otro' },
]

export const PITCHES_LRM = [
  // ── Generales (sirven para cualquier nicho) ──
  { id:'g1', nicho:'Todos', etapa:'enganche', titulo:'Primer contacto con un conocido',
    texto:'Hola {nombre}, ¿cómo vas? Te escribo porque estoy moviendo mercancía desde Miami, China y Panamá hasta Barranquilla con LRM Trade Consulting. Si en algún momento traes producto de afuera, me encantaría ayudarte a que te llegue seguro y a buen precio. ¿Hoy cómo estás trayendo tu mercancía?' },
  { id:'g2', nicho:'Todos', etapa:'pitch', titulo:'Qué hacemos en LRM',
    texto:'En LRM Trade nos encargamos de todo: tu mercancía llega a nuestra bodega en Miami (o en China o Panamá) y te la entregamos en Barranquilla, segura y a tiempo. Sabes en qué va cada caja y pagas por kilo, sin sorpresas. Lo que te vendo es tranquilidad: que tu carga llegue completa y cuando tiene que llegar.' },
  { id:'g3', nicho:'Todos', etapa:'seguimiento', titulo:'Después de mandar la cotización',
    texto:'Hola {nombre}, ¿pudiste revisar la cotización que te mandé? Si quieres hacemos una primera carga pequeña de prueba para que veas cómo trabajamos. Quedo atento.' },
  { id:'g4', nicho:'Todos', etapa:'seguimiento', titulo:'Retomar una conversación fría',
    texto:'{nombre}, ¿cómo va todo? Te escribo porque esta temporada estamos sacando carga cada semana desde Miami. Si tienes pedido para diciembre, todavía alcanzamos a traerlo a tiempo. ¿Lo revisamos?' },
  { id:'g5', nicho:'Todos', etapa:'objecion', titulo:'“Está caro”',
    texto:'Te entiendo. Antes de comparar solo el precio por kilo, mira lo que incluye: bodega, envío y entrega en Barranquilla, con seguimiento de cada caja. Lo barato sale caro cuando la carga se demora o llega incompleta. Si me dices cuánto mueves al mes, te ajusto la tarifa por volumen.' },
  { id:'g6', nicho:'Todos', etapa:'objecion', titulo:'“Ya tengo con quién traer”',
    texto:'Perfecto, eso habla bien: ya importas. No te pido que cambies todo. Mándame una sola carga y compara tiempos, trato y precio. Si no te convence, sigues con tu proveedor y quedamos como amigos.' },
  { id:'g7', nicho:'Todos', etapa:'objecion', titulo:'“¿Y si se pierde la mercancía?”',
    texto:'Es la pregunta correcta. Cada caja queda registrada con peso y medidas desde que llega a la bodega, y te aviso en cada etapa: cuando sale, cuando llega a Colombia y cuando está lista. Nada se mueve sin que sepas dónde está.' },
  { id:'g8', nicho:'Todos', etapa:'cierre', titulo:'Arrancar la primera carga',
    texto:'{nombre}, para arrancar solo necesito que tu proveedor envíe la mercancía a nuestra bodega en Miami. Yo te paso la dirección y apenas llegue te aviso con el peso de cada caja. ¿Te la mando?' },
  { id:'g9', nicho:'Todos', etapa:'referidos', titulo:'Pedir referidos',
    texto:'{nombre}, gracias por confiar en LRM. Si conoces a alguien que traiga mercancía de afuera y quiera un servicio serio, pásame su contacto y lo atiendo como a ti. Te lo agradezco mucho.' },

  // ── Perfumes ──
  { id:'p1', nicho:'Perfumes', etapa:'enganche', titulo:'Distribuidor de perfumería',
    texto:'Hola {nombre}, estoy trayendo perfumería desde Miami cada semana para distribuidores de Barranquilla. Tarifa por kilo, entrega en unos 8 días y seguimiento de cada caja. ¿Te cotizo tu próximo pedido?' },
  { id:'p2', nicho:'Perfumes', etapa:'pitch', titulo:'Cómo movemos perfumes',
    texto:'Para perfumes tenemos bodega en Miami, revisamos cada caja al llegar y te la entregamos en Barranquilla, segura y a tiempo. Cobro por kilo, sin cargos escondidos, y te aviso cuando sale, cuando llega a Colombia y cuando está lista para recoger.' },

  // ── Celulares ──
  { id:'c1', nicho:'Celulares', etapa:'enganche', titulo:'Vendedor de celulares',
    texto:'Hola {nombre}, ¿cómo vas? Estoy moviendo celulares desde Miami a Barranquilla con precio por unidad y seguimiento hasta la entrega. Si traes equipos cada semana te doy un precio fijo por caja. ¿Cuántos estás moviendo al mes?' },
  { id:'c2', nicho:'Celulares', etapa:'pitch', titulo:'Seguridad y tiempo',
    texto:'Con celulares lo importante es seguridad y tiempo. Recibimos los equipos en Miami, se verifican, viajan protegidos y te los entrego en Barranquilla. Precio por unidad, con mínimo de una caja de 50 equipos.' },

  // ── Cosméticos ──
  { id:'k1', nicho:'Cosméticos', etapa:'enganche', titulo:'Tienda de cosméticos',
    texto:'Hola {nombre}, vi que manejas cosméticos. Estoy trayendo maquillaje y skincare desde Miami a Barranquilla, cobrando por peso y con entrega rápida. ¿Te mando una cotización para tu próximo pedido?' },

  // ── Computadores y electrónica ──
  { id:'e1', nicho:'Computadores', etapa:'enganche', titulo:'Computadores y electrónica',
    texto:'Hola {nombre}, ¿estás trayendo computadores o electrónica de afuera? Manejo envíos desde Miami y China con seguimiento de cada caja y entrega en Barranquilla. Te cotizo sin compromiso.' },
]