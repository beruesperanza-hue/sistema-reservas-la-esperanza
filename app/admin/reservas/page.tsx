'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { cancelReservation, deleteReservation } from '@/app/actions/reservations';
import { UBICACIONES, UBICACIONES_ICONO, UBICACIONES_LABEL } from '@/lib/constants';
import { formatearFechaLarga } from '@/lib/fechas';
import NuevaReservaModal from '@/components/admin/NuevaReservaModal';

interface Reservation {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  personas: number;
  fecha: string;
  hora: string;
  ubicacion?: string;
  comentarios?: string;
  estado: string;
  creadaPorAdmin?: boolean;
}

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [filtro, setFiltro] = useState<'hoy' | 'manana' | 'todas' | 'fecha'>('hoy');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    loadReservas();
  }, [filtro, fechaFiltro]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtro === 'fecha' && fechaFiltro) {
        params.append('fecha', fechaFiltro);
      } else {
        params.append('filtro', filtro);
      }

      const response = await fetch(`/api/admin/reservas?${params}`);
      const data = await response.json();
      setReservas(data.reservas || []);
    } catch (error) {
      console.error('Error loading reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;

    const result = await cancelReservation(id);
    if (result.success) {
      loadReservas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva permanentemente?')) return;

    const result = await deleteReservation(id);
    if (result.success) {
      loadReservas();
    }
  };

  const filtradas = reservas.filter((r) => {
    const texto = `${r.nombre} ${r.apellido} ${r.email} ${r.telefono}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // Agrupar por horario
  const agrupadas = filtradas.reduce(
    (acc, r) => {
      const key = `${r.fecha}|${r.hora}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string, Reservation[]>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-4xl font-bold text-esperanza-700">Gestión de Reservas</h1>
          <button onClick={() => setModalAbierto(true)} className="btn btn-primary">
            📝 Nueva reserva
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Tipo de filtro */}
            <div>
              <label className="form-label">Filtro</label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: 'hoy', label: 'Hoy' },
                    { value: 'manana', label: 'Mañana' },
                    { value: 'todas', label: 'Todas' },
                    { value: 'fecha', label: 'Fecha específica' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFiltro(f.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      filtro === f.value
                        ? 'bg-esperanza-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha específica */}
            {filtro === 'fecha' && (
              <div>
                <label className="form-label">Selecciona fecha</label>
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
          </div>

          {/* Búsqueda */}
          <div>
            <label className="form-label">Búsqueda</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>

        {/* Resumen: lo primero que se lee — cuántas reservas y cuánta gente */}
        {!loading && filtradas.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-3xl font-bold text-esperanza-700">{filtradas.length}</div>
              <div className="text-sm text-gray-500">Reservas</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-3xl font-bold text-esperanza-700">
                {filtradas.reduce((sum, r) => sum + r.personas, 0)}
              </div>
              <div className="text-sm text-gray-500">Personas</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-3xl font-bold text-esperanza-700">
                {filtradas.filter((r) => r.ubicacion !== UBICACIONES.VEREDA).length}
              </div>
              <div className="text-sm text-gray-500">{UBICACIONES_ICONO[UBICACIONES.ADENTRO]} Salón</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-3xl font-bold text-esperanza-700">
                {filtradas.filter((r) => r.ubicacion === UBICACIONES.VEREDA).length}
              </div>
              <div className="text-sm text-gray-500">{UBICACIONES_ICONO[UBICACIONES.VEREDA]} Vereda</div>
            </div>
          </div>
        )}

        {/* Reservas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Cargando reservas...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <span className="text-5xl text-gray-300 mx-auto mb-4 block">📅</span>
            <p className="text-gray-600">No hay reservas para mostrar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(agrupadas).map(([clave, resas]) => {
              const [fechaGrupo, horaGrupo] = clave.split('|');
              const porSector = {
                [UBICACIONES.ADENTRO]: resas.filter((r) => r.ubicacion !== UBICACIONES.VEREDA),
                [UBICACIONES.VEREDA]: resas.filter((r) => r.ubicacion === UBICACIONES.VEREDA),
              };
              const totalPersonas = resas.reduce((sum, r) => sum + r.personas, 0);

              return (
                <div key={clave} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-esperanza-100 border-l-4 border-esperanza-500 px-6 py-4">
                    <h2 className="text-lg font-semibold text-esperanza-700">
                      {formatearFechaLarga(fechaGrupo)} · {horaGrupo}
                    </h2>
                    <p className="text-sm text-esperanza-600">
                      {totalPersonas} personas en {resas.length}{' '}
                      {resas.length === 1 ? 'reserva' : 'reservas'}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    {[UBICACIONES.ADENTRO, UBICACIONES.VEREDA].map((sector) => {
                      const lista = porSector[sector];
                      const personasSector = lista.reduce((sum, r) => sum + r.personas, 0);

                      return (
                        <div key={sector}>
                          <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
                              {UBICACIONES_ICONO[sector]} {UBICACIONES_LABEL[sector]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {lista.length === 0
                                ? 'sin reservas'
                                : `${personasSector} personas · ${lista.length} ${lista.length === 1 ? 'reserva' : 'reservas'}`}
                            </span>
                          </div>

                          <div className="divide-y">
                            {lista.map((reserva) => (
                              <details key={reserva.id} className="group p-3 hover:bg-gray-50 transition-colors">
                                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        reserva.estado === 'confirmada' ? 'bg-green-500' : 'bg-red-400'
                                      }`}
                                      title={reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                                    />
                                    <span className="font-semibold text-gray-900 truncate">
                                      {reserva.nombre} {reserva.apellido}
                                    </span>
                                    {reserva.creadaPorAdmin && (
                                      <span className="text-[10px] font-normal text-esperanza-500 bg-esperanza-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                        a mano
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 text-sm text-gray-600">
                                    <span className="font-medium">👥 {reserva.personas}</span>
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform">⌄</span>
                                  </div>
                                </summary>

                                <div className="mt-2.5 ml-4.5 pl-3 border-l-2 border-gray-100 flex items-start justify-between gap-4">
                                  <div className="text-sm text-gray-600 space-y-0.5">
                                    <div>📧 {reserva.email}</div>
                                    <div>📱 {reserva.telefono}</div>
                                    {reserva.comentarios && <div>💬 {reserva.comentarios}</div>}
                                  </div>

                                  <div className="flex gap-2 flex-shrink-0">
                                    {reserva.estado === 'confirmada' ? (
                                      <button
                                        onClick={() => handleCancel(reserva.id)}
                                        className="btn btn-small bg-amber-100 text-amber-700 hover:bg-amber-200"
                                        title="Cancelar"
                                      >
                                        ❌
                                      </button>
                                    ) : (
                                      <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold text-center">
                                        Cancelada
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleDelete(reserva.id)}
                                      className="btn btn-small btn-danger"
                                      title="Eliminar"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modalAbierto && (
        <NuevaReservaModal
          onClose={() => setModalAbierto(false)}
          onCreada={loadReservas}
        />
      )}
    </div>
  );
}
