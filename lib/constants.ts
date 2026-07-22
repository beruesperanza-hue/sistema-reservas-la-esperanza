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
  EMAIL: 'eventoslaesperanza@gmail.com',
  INSTAGRAM: 'https://instagram.com/esperanza_ascurra',
  INSTAGRAM_USER: '@esperanza_ascurra',
  SITIO: process.env.NEXT_PUBLIC_SITE_URL || 'https://laesperanzadelosascurra.up.railway.app',
};

export const MENSAJES = {
  RESERVA_EXITOSA: '¡Gracias! Tu reserva fue realizada correctamente.',
  RESERVA_DUPLICADA: 'Ya existe una reserva para este horario con tu email.',
  HORARIO_LLENO: 'Lo siento, este horario está completamente lleno.',
  RESERVA_NO_ENCONTRADA: 'La reserva no fue encontrada.',
  CANCELA_EXITOSA: 'Tu reserva ha sido cancelada.',
  ERROR_GENERICO: 'Ocurrió un error. Por favor intenta más tarde.',
};
