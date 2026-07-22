'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import MiniCalendario from '@/components/admin/MiniCalendario';
import TurnoBoard from '@/components/admin/TurnoBoard';
import NuevaReservaModal from '@/components/admin/NuevaReservaModal';
import { hoyEnBA, formatearFechaLarga } from '@/lib/fechas';

interface Stats {
  reservasHoy: number;
  reservasManana: number;
  totalReservas: number;
  totalPersonas: number;
  personasHoy: number;
  personasManana: number;
}

function StatCard({
  icono,
  title,
  value,
  subtitle,
}: {
  icono: string;
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-3 shadow-sm">
      <span className="text-2xl">{icono}</span>
      <div>
        <p className="text-xs text-gray-500 font-semibold">{title}</p>
        <p className="text-xl font-bold text-esperanza-700 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyEnBA());
  const [boardKey, setBoardKey] = useState(0); // fuerza recarga del tablero
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, [boardKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-esperanza-700">Dashboard</h1>
            <p className="text-gray-500 text-sm">Panel de administración de La Esperanza</p>
          </div>
          <button onClick={() => setModalAbierto(true)} className="btn btn-primary">
            📝 Nueva reserva
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icono="📅" title="Reservas hoy" value={stats.reservasHoy} subtitle={`${stats.personasHoy} personas`} />
            <StatCard icono="🕐" title="Mañana" value={stats.reservasManana} subtitle={`${stats.personasManana} personas`} />
            <StatCard icono="📖" title="Total" value={stats.totalReservas} />
            <StatCard icono="👥" title="Personas totales" value={stats.totalPersonas} />
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          <MiniCalendario fechaSeleccionada={fechaSeleccionada} onSeleccionar={setFechaSeleccionada} />

          <div>
            <h2 className="text-xl font-serif font-bold text-esperanza-700 mb-3 capitalize">
              {formatearFechaLarga(fechaSeleccionada)}
            </h2>
            <TurnoBoard key={`${fechaSeleccionada}-${boardKey}`} fecha={fechaSeleccionada} />
          </div>
        </div>
      </main>

      {modalAbierto && (
        <NuevaReservaModal
          fechaInicial={fechaSeleccionada}
          onClose={() => setModalAbierto(false)}
          onCreada={() => setBoardKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
