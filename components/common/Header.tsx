'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { href: '/carta', label: 'Carta' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/#historia', label: 'Historia' },
  { href: '/#visitanos', label: 'Visitanos' },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,padding,border-color] duration-300 border-b ${
        solid || open
          ? 'bg-night/90 backdrop-blur-md border-white/10 py-3.5'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-[1360px] px-5 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="#c9a961">
            <path d="M12 1 14.5 8.6 22.5 8.6 16 13.3 18.5 20.9 12 16.2 5.5 20.9 8 13.3 1.5 8.6 9.5 8.6Z" />
          </svg>
          <span className="font-display font-bold text-sand text-[15px] tracking-wide">LA ESPERANZA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-sand-dim hover:text-sand transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href="/reservas"
            className="text-[13px] font-semibold px-5 py-2.5 border border-white/25 rounded-sm text-sand hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            Reservar mesa
          </Link>
        </nav>

        {/* Mobile trigger — 44x44 real tap target */}
        <button
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 text-sand"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-night border-t border-white/10 px-5 py-4 flex flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sand text-base py-3.5 border-b border-white/10 min-h-[44px] flex items-center"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/reservas"
            onClick={() => setOpen(false)}
            className="mt-4 text-center font-semibold px-5 py-3.5 bg-sand text-night rounded-sm min-h-[44px] flex items-center justify-center"
          >
            Reservar mesa
          </Link>
        </nav>
      )}
    </header>
  );
}
