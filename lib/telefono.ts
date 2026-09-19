// Normaliza teléfonos al formato que pide wa.me: solo dígitos, con código de
// país y sin 0 ni 15 locales. Los números del CRM vienen de Bigbox y de la web
// en formatos mezclados: la mayoría argentinos de 10 dígitos ("1123456789"),
// algunos sin característica, y unos cientos de otros países con `telefonoPais`.

const CODIGO_PAIS: Record<string, string> = {
  AR: '54', UY: '598', CL: '56', BR: '55', PY: '595', BO: '591', PE: '51', CO: '57', EC: '593',
  VE: '58', MX: '52', US: '1', CA: '1', PR: '1', CR: '506', PA: '507', GT: '502', HN: '504',
  ES: '34', IT: '39', FR: '33', DE: '49', GB: '44', IE: '353', NL: '31', BE: '32', CH: '41',
  SE: '46', NO: '47', DK: '45', BG: '359', LU: '352', PT: '351', AU: '61', JP: '81', SG: '65',
  PH: '63', AE: '971', IL: '972',
};

export interface TelefonoWhatsapp {
  numero: string;
  /** Se le agregó la característica 11 porque venía sin código de área. */
  areaAsumida: boolean;
}

/** Número argentino -> 549 + área + número (el 9 es obligatorio para celulares en WhatsApp). */
function argentino(d: string): TelefonoWhatsapp | null {
  let n = d;
  if (n.startsWith('549') && n.length === 13) return { numero: n, areaAsumida: false };
  if (n.startsWith('54') && n.length === 12) return { numero: `549${n.slice(2)}`, areaAsumida: false };
  if (n.startsWith('0')) n = n.slice(1);

  // "15 1234 5678" sin característica: es un celular de Buenos Aires.
  if (n.length === 10 && n.startsWith('15')) return { numero: `54911${n.slice(2)}`, areaAsumida: true };
  // Característica + 15 + número ("11 15 1234 5678"): se saca el 15.
  if (n.length === 12 && n.startsWith('1115')) return { numero: `54911${n.slice(4)}`, areaAsumida: false };

  if (n.length === 10) return { numero: `549${n}`, areaAsumida: false };
  // 8 dígitos: le falta la característica. El restaurante está en CABA, así que va 11.
  if (n.length === 8) return { numero: `54911${n}`, areaAsumida: true };
  return null;
}

export function normalizarTelefono(
  telefono: string | null | undefined,
  pais: string | null | undefined
): TelefonoWhatsapp | null {
  if (!telefono) return null;
  const conMas = telefono.trim().startsWith('+');
  const d = telefono.replace(/\D/g, '');
  if (d.length < 8 || d.length > 15) return null;

  const codigoPais = (pais ?? 'AR').toUpperCase();

  // Con "+" adelante ya trae el código internacional.
  if (conMas) {
    if (d.startsWith('54')) return argentino(d);
    return { numero: d, areaAsumida: false };
  }

  if (codigoPais === 'AR' || !CODIGO_PAIS[codigoPais]) return argentino(d);

  const prefijo = CODIGO_PAIS[codigoPais];
  if (d.startsWith(prefijo) && d.length > 9) return { numero: d, areaAsumida: false };
  // México: WhatsApp usa 52 + 10 dígitos (sin el 1 viejo de celulares).
  return { numero: `${prefijo}${d.replace(/^0+/, '')}`, areaAsumida: false };
}
