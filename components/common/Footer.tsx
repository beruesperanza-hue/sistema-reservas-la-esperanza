'use client';

import Link from 'next/link';
import { CONTACTO } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

export default function Footer() {
  return (
    <footer className="bg-night text-sand-faint">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display font-bold text-sand text-lg leading-tight block">
              LA ESPERANZA
              <br />
              DE LOS ASCURRA
            </span>
            <p className="mt-3 max-w-[32ch] text-sm">Taberna española en Villa Crespo, Buenos Aires. Desde 2011.</p>
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-widest uppercase text-sand-dim mb-3">Menú</h4>
            <Link href="/carta" className="block py-1 text-sm hover:text-brand-gold transition-colors">Carta</Link>
            <Link href="/#historia" className="block py-1 text-sm hover:text-brand-gold transition-colors">Historia</Link>
            <Link href="/reservas" className="block py-1 text-sm hover:text-brand-gold transition-colors">Reservas</Link>
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-widest uppercase text-sand-dim mb-3">Contacto</h4>
            <Link
              href={CONTACTO.MAPS_URL}
              target="_blank"
              onClick={() => trackEvent('clic_como_llegar', { ubicacion: 'footer' })}
              className="block py-1 text-sm hover:text-brand-gold transition-colors"
            >
              Aguirre 526, Villa Crespo
            </Link>
            <Link
              href={CONTACTO.WHATSAPP_URL}
              target="_blank"
              onClick={() => trackEvent('clic_whatsapp', { ubicacion: 'footer' })}
              className="block py-1 text-sm hover:text-brand-gold transition-colors"
            >
              {CONTACTO.TELEFONO}
            </Link>
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-widest uppercase text-sand-dim mb-3">Seguinos</h4>
            <Link
              href={CONTACTO.INSTAGRAM}
              target="_blank"
              className="flex items-center gap-2 py-1 text-sm text-brand-gold font-medium"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              @esperanza_ascurra
            </Link>
            <Link
              href={CONTACTO.GOOGLE_REVIEW_URL}
              target="_blank"
              onClick={() => trackEvent('clic_dejar_reseña', { ubicacion: 'footer' })}
              className="block py-1 text-sm hover:text-brand-gold transition-colors"
            >
              Dejanos tu opinión
            </Link>
          </div>
        </div>

        <div className="mt-11 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs">
          <span>© 2011–2026 La Esperanza de los Ascurra</span>
          <span>Lunes a sábado · 19:30–23:30</span>
        </div>
      </div>
    </footer>
  );
}
