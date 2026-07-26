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
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 8.11 8.11c0 4.48-3.64 8.11-8.12 8.11a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.06 8.06 0 0 1-1.24-4.29 8.12 8.12 0 0 1 8.15-8.09Zm-2.5 4.34c-.15 0-.4.06-.6.28-.21.22-.79.77-.79 1.88 0 1.11.81 2.18.92 2.33.11.15 1.58 2.41 3.83 3.38.53.23.95.37 1.28.48.54.17 1.02.15 1.41.09.43-.06 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.09-.21-.15-.44-.26-.23-.11-1.32-.65-1.53-.73-.2-.07-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.17-.48.06-.23-.11-.95-.35-1.81-1.11a6.75 6.75 0 0 1-1.25-1.55c-.13-.22-.01-.34.1-.45.1-.1.22-.26.34-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.21-.69-1.65-.18-.44-.37-.38-.5-.39l-.43-.01Z" />
      </svg>
    </a>
  );
}
