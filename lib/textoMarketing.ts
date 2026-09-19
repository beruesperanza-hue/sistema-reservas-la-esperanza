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

/**
 * El mensaje completo de WhatsApp. El link va solo en su renglón: WhatsApp
 * toma la foto de esa página y la muestra grande como vista previa.
 */
export function mensajeWhatsapp(mensaje: string, nombre: string, urlPromo: string): string {
  return [
    personalizar(mensaje, primerNombre(nombre)).trim(),
    '',
    urlPromo,
    '',
    'Si no querés recibir más mensajes, respondé BAJA.',
  ].join('\n');
}

export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
