'use client';

import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // Eliminar cookie
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin');
    router.refresh();
  };

  return (
    <header className="bg-esperanza-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold italic">La Esperanza</h1>
            <span className="text-xs bg-esperanza-700 px-2 py-1 rounded">Admin</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="hover:text-esperanza-200 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/reservas"
              className="hover:text-esperanza-200 transition-colors"
            >
              Reservas
            </Link>
            <Link
              href="/admin/settings"
              className="hover:text-esperanza-200 transition-colors flex gap-1 items-center"
            >
              <Settings className="w-4 h-4" />
              Configuración
            </Link>

            <button
              onClick={handleLogout}
              className="ml-4 pl-4 border-l border-esperanza-700 hover:text-esperanza-200 transition-colors flex gap-1 items-center"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
