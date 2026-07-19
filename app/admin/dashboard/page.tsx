'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import prisma from '@/lib/db';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    reservasHoy: 0,
    reservasManana: 0,
    totalReservas: 0,
    totalPersonas: 0,
    horariosCompletos: 0,
    personasHoy: 0,
    personasManana: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'esperanza',
  }: {
    icon: React.ReactNode;
    title: string;
    value: number | string;
    subtitle?: string;
    color?: string;
  }) => (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-${color}-600 text-sm font-semibold mb-2`}>{title}</p>
          <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
          {subtitle && <p className={`text-${color}-600 text-xs mt-2`}>{subtitle}</p>}
        </div>
        <div className={`text-${color}-400 opacity-50`}>{Icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-4xl font-bold text-esperanza-700 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Bienvenido al panel de administración de La Esperanza</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard
                icon={<span className="text-2xl">📅</span>}
                title="Reservas Hoy"
                value={stats.reservasHoy}
                subtitle={`${stats.personasHoy} personas`}
                color="esperanza"
              />
              <StatCard
                icon={<span className="text-2xl">🕐</span>}
                title="Reservas Mañana"
                value={stats.reservasManana}
                subtitle={`${stats.personasManana} personas`}
                color="blue"
              />
              <StatCard
                icon={<span className="text-2xl">📖</span>}
                title="Total de Reservas"
                value={stats.totalReservas}
                color="green"
              />
              <StatCard
                icon={<span className="text-2xl">👥</span>}
                title="Total de Personas"
                value={stats.totalPersonas}
                color="amber"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-esperanza-700 mb-6">Acciones Rápidas</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a
                  href="/admin/reservas"
                  className="btn btn-primary block text-center"
                >
                  Ver Todas las Reservas
                </a>
                <a href="/admin/settings" className="btn btn-secondary block text-center">
                  Configurar Horarios
                </a>
                <button className="btn btn-secondary block text-center">
                  Generar Reporte
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
