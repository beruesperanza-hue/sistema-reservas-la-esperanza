// Funciones de texto sin dependencias de servidor: las usan tanto las acciones
// como los componentes de cliente (vista previa del mensaje).

/** "JUAN CARLOS perez" -> "Juan". Los nombres importados de Bigbox vienen de cualquier forma. */
export function primerNombre(nombre: string | null | undefined): string {
  const primero = (nombre ?? '').trim().split(/\s+/)[0] ?? '';
  if (!primero || !/[a-záéíóúñü]/i.test(primero)) return '';
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

/** Reemplaza {nombre} y limpia lo que queda feo si el cliente no tiene nombre ("Hola ,"). */
export function personalizar(texto: string, nombre: string): string {
  return texto.replace(/\{nombre\}/gi, nombre).replace(/[ \t]+([,.!?])/g, '$1');
}

/** Link corto de reservas (redirige a /reservas — ver next.config.ts). */
export const LINK_RESERVAS = 'laesperanzadelosascurra.com/r';

/**
 * El mensaje completo de WhatsApp. El link de la promo va solo en su renglón y
 * primero: WhatsApp arma la vista previa con el PRIMER link del mensaje, así
 * que la foto grande sale de esa página. Abajo va el link corto de reservas,
 * para que el cliente pueda reservar sin tener que buscar el sitio.
 */
export function mensajeWhatsapp(mensaje: string, nombre: string, urlPromo: string): string {
  return [
    personalizar(mensaje, primerNombre(nombre)).trim(),
    '',
    urlPromo,
    '',
    `Reservá aquí: ${LINK_RESERVAS}`,
    '',
    'Si no querés recibir más mensajes, respondé BAJA.',
  ].join('\n');
}

export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
