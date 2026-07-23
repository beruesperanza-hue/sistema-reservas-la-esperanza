declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Eventos de conversión para GA4 (clic en WhatsApp, teléfono, cómo llegar,
// reserva enviada). No hace nada si gtag todavía no cargó.
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}
