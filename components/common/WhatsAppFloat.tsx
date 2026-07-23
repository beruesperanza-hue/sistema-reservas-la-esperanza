'use client';

import { CONTACTO } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

const WHATSAPP_URL = `${CONTACTO.WHATSAPP_URL}?text=${encodeURIComponent(
  'Hola! Quería consultar por una reserva en La Esperanza.'
)}`;

export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('clic_whatsapp', { ubicacion: 'boton_flotante' })}
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-3xl shadow-lg transition-transform hover:scale-110"
    >
      💬
    </a>
  );
}
