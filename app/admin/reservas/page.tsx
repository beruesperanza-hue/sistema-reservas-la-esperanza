'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import MiniCalendario from '@/components/admin/MiniCalendario';
import TurnoBoard from '@/components/admin/TurnoBoard';
import NuevaReservaModal from '@/components/admin/NuevaReservaModal';
import { cancelReservation, deleteReservation, marcarAsistio } from '@/app/actions/reservations';
import { UBICACIONES, UBICACIONES_ICONO, UBICACIONES_LABEL } from '@/lib/constants';
import { formatearFechaLarga, hoyEnBA, sumarDias } from '@/lib/fechas';

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
  asistio?: boolean;
}

function StatsRow({ reservas }: { reservas: Reservation[] }) {
  if (reservas.length === 0) return null;
  const totalPersonas = reservas.reduce((sum, r) => sum + r.personas, 0);
  const sentados = reservas.filter((r) => r.asistio).reduce((sum, r) => sum + r.personas, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-5">
        <div className="text-3xl font-bold text-esperanza-700">{reservas.length}</div>
        <div className="text-sm text-gray-500">Reservas</div>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="text-3xl font-bold text-esperanza-700">{totalPersonas}</div>
        <div className="text-sm text-gray-500">Personas</div>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="text-3xl font-bold text-green-600">
          {sentados}
          <span className="text-base text-gray-400">/{totalPersonas}</span>
        </div>
        <div className="text-sm text-gray-500">Sentados</div>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="text-3xl font-bold text-esperanza-700">
          {reservas.filter((r) => r.ubicacion !== UBICACIONES.VEREDA).length}
        </div>
        <div className="text-sm text-gray-500">{UBICACIONES_ICONO[UBICACIONES.ADENTRO]} Salón</div>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="text-3xl font-bold text-esperanza-700">
          {reservas.filter((r) => r.ubicacion === UBICACIONES.VEREDA).length}
        </div>
        <div className="text-sm text-gray-500">{UBICACIONES_ICONO[UBICACIONES.VEREDA]} Vereda</div>
      </div>
    </div>
  );
}

function ChipBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
        active ? 'bg-esperanza-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminReservasPage() {
  const hoy = hoyEnBA();
  const manana = sumarDias(hoy, 1);

  const [modo, setModo] = useState<'dia' | 'todas'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [reservasDia, setReservasDia] = useState<Reservation[]>([]);
  const [todas, setTodas] = useState<Reservation[]>([]);
  const [loadingTodas, setLoadingTodas] = useState(false);

  const mostrarListado = modo === 'todas' || busqueda.trim().length > 0;

  const irADia = (fecha: string) => {
    setFechaSeleccionada(fecha);
    setModo('dia');
    setBusqueda('');
  };

  // Stats del día — se usa el mismo endpoint que la vista de listado, solo
  // que acotado a la fecha seleccionada. El tablero de turnos se fetch a
  // parte (adentro de TurnoBoard), esto es nada más para la fila de resumen.
  useEffect(() => {
    if (mostrarListado) return;
    fetch(`/api/admin/reservas?filtro=fecha&fecha=${fechaSeleccionada}`)
      .then((r) => r.json())
      .then((data) => setReservasDia(data.reservas || []))
      .catch(() => setReservasDia([]));
  }, [fechaSeleccionada, mostrarListado, refreshKey]);

  useEffect(() => {
    if (!mostrarListado) return;
    setLoadingTodas(true);
    fetch('/api/admin/reservas?filtro=todas')
      .then((r) => r.json())
      .then((data) => setTodas(data.reservas || []))
      .catch(() => setTodas([]))
      .finally(() => setLoadingTodas(false));
  }, [mostrarListado, refreshKey]);

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    const result = await cancelReservation(id);
    if (result.success) setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva permanentemente?')) return;
    const result = await deleteReservation(id);
    if (result.success) setRefreshKey((k) => k + 1);
  };

  // Sincroniza el stat "Sentados" del día en vivo, sin recargar todo el
  // tablero (que vive en TurnoBoard con su propio estado optimista).
  const handleAsistioChangeDia = (id: string, asistio: boolean) => {
    setReservasDia((prev) => prev.map((r) => (r.id === id ? { ...r, asistio } : r)));
  };

  const handleToggleAsistioListado = async (id: string, actual: boolean) => {
    const nuevoValor = !actual;
    setTodas((prev) => prev.map((r) => (r.id === id ? { ...r, asistio: nuevoValor } : r)));
    const result = await marcarAsistio(id, nuevoValor);
    if (!result.success) setRefreshKey((k) => k + 1);
  };

  const filtradas = todas.filter((r) => {
    const texto = `${r.nombre} ${r.apellido} ${r.email} ${r.telefono}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const agrupadas = filtradas.reduce(
    (acc, r) => {
      const key = `${r.fecha}|${r.hora}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string, Reservation[]>
  );

  const titulo = mostrarListado
    ? busqueda.trim()
      ? `Resultados para “${busqueda.trim()}”`
      : 'Todas las reservas'
    : formatearFechaLarga(fechaSeleccionada);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-esperanza-700 capitalize">{titulo}</h1>
            <p className="text-gray-500 text-sm">Panel de reservas de La Esperanza</p>
          </div>
          <button onClick={() => setModalAbierto(true)} className="btn btn-primary">
            📝 Nueva reserva
          </button>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Sidebar: búsqueda global + filtros rápidos + calendario */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <label className="form-label">Buscar en todas las reservas</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Nombre, email o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="form-input pl-10 pr-8"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700"
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mt-3">
                <ChipBtn active={!mostrarListado && fechaSeleccionada === hoy} onClick={() => irADia(hoy)}>
                  Hoy
                </ChipBtn>
                <ChipBtn active={!mostrarListado && fechaSeleccionada === manana} onClick={() => irADia(manana)}>
                  Mañana
                </ChipBtn>
                <ChipBtn
                  active={modo === 'todas'}
                  onClick={() => {
                    setModo('todas');
                    setBusqueda('');
                  }}
                >
                  Todas
                </ChipBtn>
              </div>
            </div>

            <MiniCalendario fechaSeleccionada={fechaSeleccionada} onSeleccionar={irADia} />
          </div>

          {/* Panel principal: tablero por turnos (un día) o listado (búsqueda/todas) */}
          <div>
            {mostrarListado ? (
              loadingTodas ? (
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
                <>
                  <StatsRow reservas={filtradas} />
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
                                      <details key={reserva.id} className={`group p-3 hover:bg-gray-50 transition-colors ${reserva.asistio ? 'bg-green-50/40' : ''}`}>
                                        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {reserva.estado === 'confirmada' && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleToggleAsistioListado(reserva.id, !!reserva.asistio);
                                                }}
                                                title={reserva.asistio ? 'Ya se sentó — tocar para desmarcar' : 'Marcar que ya se sentó'}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[11px] transition-colors ${
                                                  reserva.asistio
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 text-transparent hover:border-esperanza-400'
                                                }`}
                                              >
                                                ✓
                                              </button>
                                            )}
                                            <span
                                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                reserva.estado === 'confirmada' ? 'bg-green-500' : 'bg-red-400'
                                              }`}
                                              title={reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                                            />
                                            <span className={`font-semibold truncate ${reserva.asistio ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                              {reserva.nombre} {reserva.apellido}
                                            </span>
                                            {reserva.creadaPorAdmin && (
                                              <span className="text-[10px] font-normal text-esperanza-500 bg-esperanza-50 px-1.5 py-0.5 rounded flex-shrink-0 no-underline">
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
                </>
              )
            ) : (
              <>
                <StatsRow reservas={reservasDia} />
                <TurnoBoard
                  key={`${fechaSeleccionada}-${refreshKey}`}
                  fecha={fechaSeleccionada}
                  onAsistioChange={handleAsistioChangeDia}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {modalAbierto && (
        <NuevaReservaModal
          fechaInicial={fechaSeleccionada}
          onClose={() => setModalAbierto(false)}
          onCreada={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
