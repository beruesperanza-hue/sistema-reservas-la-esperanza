'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-esperanza-700 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-2xl">✦</span>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white italic">La Esperanza</h1>
              <p className="text-xs text-esperanza-300 italic">Desde 2011</p>
            </div>
          </Link>

          <nav className="flex gap-6">
            <Link href="/" className="text-white hover:text-accent-gold transition-colors font-medium">
              Inicio
            </Link>
            <Link href="/carta" className="text-white hover:text-accent-gold transition-colors font-medium">
              Carta
            </Link>
            <Link href="/reservas" className="text-white hover:text-accent-gold transition-colors font-medium">
              Reservas
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
