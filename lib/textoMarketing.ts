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

/** El sitio, tal como se muestra en los mensajes (sin https:// para que se lea corto). */
export const LINK_SITIO = 'laesperanzadelosascurra.com';

/**
 * El mensaje completo de WhatsApp. El link de la promo va solo en su renglón y
 * primero: WhatsApp arma la vista previa con el PRIMER link del mensaje, así
 * que la foto grande sale de esa página. Abajo va la invitación al sitio, donde
 * el cliente encuentra reservas, pedidos y la carta.
 */
export function mensajeWhatsapp(mensaje: string, nombre: string, urlPromo: string): string {
  return [
    personalizar(mensaje, primerNombre(nombre)).trim(),
    '',
    urlPromo,
    '',
    'Conocé la nueva web: reservas, pedidos y menú',
    LINK_SITIO,
    '',
    'Si no querés recibir más mensajes, respondé BAJA.',
  ].join('\n');
}

export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
