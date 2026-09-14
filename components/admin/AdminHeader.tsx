'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon, { type IconName } from './Icon';

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin/reservas', label: 'Reservas', icon: 'calendar' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: 'bag' },
  { href: '/admin/clientes', label: 'Clientes', icon: 'users' },
  { href: '/admin/carta', label: 'Carta', icon: 'menu' },
  { href: '/admin/settings', label: 'Configuración', icon: 'settings' },
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin');
    router.refresh();
  };

  const esActivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="bg-esperanza-900 text-sand sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/admin/reservas" className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="#c9a961" aria-hidden="true">
              <path d="M12 1 14.5 8.6 22.5 8.6 16 13.3 18.5 20.9 12 16.2 5.5 20.9 8 13.3 1.5 8.6 9.5 8.6Z" />
            </svg>
            <span className="font-bold text-[15px] tracking-wide">LA ESPERANZA</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-gold border border-brand-gold/40 rounded px-1.5 py-0.5">
              Panel
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {LINKS.map((l) => {
              const activo = esActivo(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={activo ? 'page' : undefined}
                  className={`relative h-full flex items-center gap-2 px-3.5 text-[13px] font-medium transition-colors ${
                    activo ? 'text-sand' : 'text-sand-dim hover:text-sand'
                  }`}
                >
                  <Icon name={l.icon} size={16} className={activo ? 'text-brand-gold' : ''} />
                  {l.label}
                  {activo && <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-brand-gold rounded-full" />}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="ml-3 pl-4 border-l border-white/10 h-8 flex items-center gap-2 text-[13px] text-sand-dim hover:text-sand transition-colors"
            >
              <Icon name="logout" size={16} />
              Salir
            </button>
          </nav>

          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center text-sand-dim"
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </div>

      {/* Mobile: pestañas siempre visibles — un toque para cambiar de sección */}
      <nav className="md:hidden grid grid-cols-5 border-t border-white/10">
        {LINKS.map((l) => {
          const activo = esActivo(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activo ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] text-[10.5px] font-medium ${
                activo ? 'text-sand' : 'text-sand-faint'
              }`}
            >
              <Icon name={l.icon} size={19} className={activo ? 'text-brand-gold' : ''} />
              {l.label === 'Configuración' ? 'Ajustes' : l.label}
              {activo && <span className="absolute left-4 right-4 bottom-0 h-0.5 bg-brand-gold rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
