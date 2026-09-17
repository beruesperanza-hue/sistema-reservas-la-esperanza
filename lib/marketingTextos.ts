// Textos de partida del editor de campañas. Van aparte de lib/marketing.ts
// porque los usa un componente de cliente, que no puede importar Prisma.

export const INVITACION_POR_DEFECTO = {
  nombre: 'Invitación a suscribirse',
  asunto: '¿Seguimos en contacto, {nombre}?',
  cuerpoTexto: [
    'Hola {nombre},',
    '',
    'En algún momento nos visitaste en La Esperanza de los Ascurra y nos gustaría seguir en contacto.',
    '',
    'Cada tanto mandamos novedades: platos nuevos, eventos y alguna promo para los que ya nos conocen. Pocos mails, y solo si vos querés.',
    '',
    'Si te interesa, tocá el botón. Si no, no hace falta que hagas nada: **no te vamos a volver a escribir**.',
    '',
    '¡Te esperamos en Aguirre 526!',
  ].join('\n'),
};

export const CAMPANIA_POR_DEFECTO = {
  nombre: '',
  asunto: '',
  cuerpoTexto: 'Hola {nombre},\n\n',
};
