export const DIAS_SEMANA = {
  lunes: 'Lunes',
  martes: 'Martes',
  miércoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sábado: 'Sábado',
  domingo: 'Domingo',
};

export const DIAS_SEMANA_ORDEN = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

export const DIA_NUMERO_A_NOMBRE = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

// Opciones de cantidad de personas al cargar o editar una reserva. Todos los
// números del 1 al 20 — antes saltaba impares (7, 9, 11, 13...) por arriba de 6.
export const PERSONAS_OPCIONES = Array.from({ length: 20 }, (_, i) => i + 1);

// Zonas de envío a domicilio (el cliente elige, no se calcula distancia real).
// "Caballito" está partido en dos zonas por la avenida Rivadavia.
export const ZONAS_ENVIO = {
  envio_cerca: {
    nombre: 'Villa Crespo y alrededores',
    barrios: [
      'Villa Crespo',
      'Palermo',
      'Almagro',
      'Chacarita',
      'Colegiales',
      'Paternal',
      'Villa Ortúzar',
      'Caballito (hasta Rivadavia)',
    ],
  },
  envio_lejos: {
    nombre: 'Recoleta y alrededores',
    barrios: ['Caballito (desde Rivadavia)', 'Recoleta', 'Belgrano', 'Balvanera', 'Boedo'],
  },
} as const;

// Dónde quiere sentarse el cliente. La vereda depende del clima, por eso el aviso.
export const UBICACIONES = {
  ADENTRO: 'adentro',
  VEREDA: 'vereda',
} as const;

export type Ubicacion = (typeof UBICACIONES)[keyof typeof UBICACIONES];

export const UBICACIONES_LABEL: Record<string, string> = {
  [UBICACIONES.ADENTRO]: 'Salón',
  [UBICACIONES.VEREDA]: 'Vereda',
};

export const UBICACIONES_ICONO: Record<string, string> = {
  [UBICACIONES.ADENTRO]: '🏠',
  [UBICACIONES.VEREDA]: '☀️',
};

export const ESTADOS_RESERVA = {
  CONFIRMADA: 'confirmada',
  CANCELADA: 'cancelada',
  PENDIENTE: 'pendiente',
};

// Datos de contacto del restaurante (se usan en el sitio y en los emails).
export const CONTACTO = {
  DIRECCION: 'Aguirre 526, Villa Crespo, Buenos Aires',
  TELEFONO: '+54 9 11 2182-3702',
  WHATSAPP_NUMERO: '5491121823702',
  WHATSAPP_URL: 'https://wa.me/5491121823702',
  MAPS_URL:
    'https://www.google.com/maps/dir/?api=1&destination=Aguirre+526%2C+Villa+Crespo%2C+Buenos+Aires',
  GOOGLE_REVIEW_URL: 'https://g.page/r/CTeyUMq7HyxGEBE/review',
  // Ficha real de Google Maps — confirmada por el dueño el 26/07/2026.
  GOOGLE_LISTING_URL: 'https://share.google/YXn59GfhEJlejnfZw',
  GOOGLE_RATING: 4.0,
  GOOGLE_RATING_COUNT: 2210,
  EMAIL: 'eventoslaesperanza@gmail.com',
  INSTAGRAM: 'https://instagram.com/esperanza_ascurra',
  INSTAGRAM_USER: '@esperanza_ascurra',
  SITIO: process.env.NEXT_PUBLIC_SITE_URL || 'https://laesperanzadelosascurra.up.railway.app',
};

// Límite gratuito de envíos por día de la Gmail API (lib/email.ts). Si una
// campaña supera esto, la página de envío avisa antes de mandar.
export const LIMITE_GMAIL_DIARIO = 500;

export const MENSAJES = {
  RESERVA_EXITOSA: '¡Gracias! Tu reserva fue realizada correctamente.',
  RESERVA_DUPLICADA: 'Ya existe una reserva para este horario con tu email.',
  HORARIO_LLENO: 'Lo siento, este horario está completamente lleno.',
  TURNO_PASADO: 'Ese horario ya pasó. Elegí uno más tarde o para otro día.',
  SECTOR_LLENO: 'Ese sector ya no tiene lugar para ese horario. Probá el otro sector o cambiá de horario.',
  TURNO_CERRADO: 'Ese horario no está disponible en este momento.',
  RESERVA_NO_ENCONTRADA: 'La reserva no fue encontrada.',
  CANCELA_EXITOSA: 'Tu reserva ha sido cancelada.',
  ERROR_GENERICO: 'Ocurrió un error. Por favor intenta más tarde.',
};
