'use client';

import Link from 'next/link';
import { CONTACTO } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

export default function Footer() {
  return (
    <footer className="bg-esperanza-800 text-white mt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✦</span>
              <h3 className="text-xl font-serif font-bold italic">La Esperanza</h3>
            </div>
            <p className="text-esperanza-200 text-sm">
              Un lugar de encuentro para disfrutar de buena gastronomía y compañía.
            </p>
            <p className="text-esperanza-300 text-xs mt-2 italic font-serif">Desde 2011</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold mb-4 text-lg">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Link
                  href={CONTACTO.MAPS_URL}
                  target="_blank"
                  onClick={() => trackEvent('clic_como_llegar', { ubicacion: 'footer' })}
                  className="text-esperanza-200 hover:text-accent-gold transition-colors"
                >
                  {CONTACTO.DIRECCION}
                </Link>
              </div>
              <div className="flex gap-2">
                <Link
                  href={CONTACTO.WHATSAPP_URL}
                  target="_blank"
                  onClick={() => trackEvent('clic_whatsapp', { ubicacion: 'footer' })}
                  className="text-esperanza-200 hover:text-accent-gold transition-colors"
                >
                  {CONTACTO.TELEFONO}
                </Link>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`tel:+${CONTACTO.WHATSAPP_NUMERO}`}
                  onClick={() => trackEvent('clic_telefono', { ubicacion: 'footer' })}
                  className="text-esperanza-200 hover:text-accent-gold transition-colors"
                >
                  Llamar al restaurante
                </Link>
              </div>
              <div className="flex gap-2">
                <span className="text-esperanza-200">{CONTACTO.EMAIL}</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-serif font-bold mb-4 text-lg">Horarios</h4>
            <div className="space-y-1 text-sm text-esperanza-200">
              <p>Lunes a Sábado</p>
              <p>19:30 - 23:30</p>
              <p className="text-esperanza-300 text-xs italic mt-3 font-serif">
                ¡Reservá tu mesa!
              </p>
            </div>
          </div>
        </div>

        {/* Social & Opinion */}
        <div className="border-t border-esperanza-600 pt-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <Link
              href="https://instagram.com/esperanza_ascurra"
              target="_blank"
              className="flex items-center gap-2 text-esperanza-200 hover:text-accent-gold transition-colors"
            >
              @esperanza_ascurra
            </Link>

            <Link
              href={CONTACTO.GOOGLE_REVIEW_URL}
              target="_blank"
              onClick={() => trackEvent('clic_dejar_reseña', { ubicacion: 'footer' })}
              className="flex items-center gap-2 text-esperanza-200 hover:text-accent-gold transition-colors"
            >
              Dejanos tu opinión
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-esperanza-600 pt-8 text-center text-sm text-esperanza-300">
          <p>© 2011 - 2026 La Esperanza. Todos los derechos reservados.</p>
          <p className="mt-2 text-xs">Desarrollado para una mejor experiencia.</p>
        </div>
      </div>
    </footer>
  );
}
