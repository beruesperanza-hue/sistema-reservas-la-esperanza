'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LINKS = [
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/carta', label: 'Carta' },
  { href: '/admin/settings', label: '⚙️ Configuración' },
];

export default function AdminHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin');
    router.refresh();
  };

  return (
    <header className="bg-esperanza-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/admin/reservas" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <h1 className="text-2xl font-bold italic">La Esperanza</h1>
            <span className="text-xs bg-esperanza-700 px-2 py-1 rounded">Admin</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-esperanza-200 transition-colors flex gap-1 items-center">
                {l.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-4 pl-4 border-l border-esperanza-700 hover:text-esperanza-200 transition-colors flex gap-1 items-center"
            >
              🚪 Salir
            </button>
          </nav>

          {/* Mobile trigger — 44x44 real tap target */}
          <button
            type="button"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-11 h-11 -mr-2"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-esperanza-900 border-t border-esperanza-700 px-4 py-2 flex flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-base py-3.5 border-b border-esperanza-700 min-h-[44px] flex items-center"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-base py-3.5 min-h-[44px] flex items-center gap-1 text-left"
          >
            🚪 Salir
          </button>
        </nav>
      )}
    </header>
  );
}
