'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import MiniCalendario from '@/components/admin/MiniCalendario';
import TurnoBoard from '@/components/admin/TurnoBoard';
import NuevaReservaModal from '@/components/admin/NuevaReservaModal';
import Icon from '@/components/admin/Icon';
import { cancelReservation, deleteReservation, marcarAsistio, updateReservation } from '@/app/actions/reservations';
import { PERSONAS_OPCIONES, UBICACIONES, UBICACIONES_LABEL } from '@/lib/constants';
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
  const salon = reservas.filter((r) => r.ubicacion !== UBICACIONES.VEREDA).length;
  const vereda = reservas.filter((r) => r.ubicacion === UBICACIONES.VEREDA).length;
  const pct = totalPersonas > 0 ? Math.round((sentados / totalPersonas) * 100) : 0;

  const Stat = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <div className="px-4 py-3.5 md:px-5 md:py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 flex items-center gap-1.5">
        {label}
      </div>
      <div className="mt-1 text-2xl md:text-[28px] font-extrabold text-esperanza-700 leading-none">{children}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 bg-white rounded-xl border border-esperanza-200/80 divide-x divide-y md:divide-y-0 divide-esperanza-100 mb-5 overflow-hidden">
      <Stat label="Reservas">{reservas.length}</Stat>
      <Stat label="Personas">{totalPersonas}</Stat>
      <div className="px-4 py-3.5 md:px-5 md:py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Sentados</div>
        <div className="mt-1 text-2xl md:text-[28px] font-extrabold text-green-700 leading-none">
          {sentados}
          <span className="text-sm font-semibold text-stone-400">/{totalPersonas}</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-esperanza-100 overflow-hidden">
          <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Stat label={<><Icon name="home" size={13} /> Salón</>}>{salon}</Stat>
      <Stat label={<><Icon name="sun" size={13} /> Vereda</>}>{vereda}</Stat>
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
      className={`chip ${active ? 'chip-on' : 'chip-off'}`}
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

  const handleEditarPersonasListado = async (id: string, personas: number) => {
    setTodas((prev) => prev.map((r) => (r.id === id ? { ...r, personas } : r)));
    const result = await updateReservation(id, { personas });
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
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-esperanza-500 mb-1">
              {mostrarListado ? 'Reservas' : fechaSeleccionada === hoy ? 'Hoy' : fechaSeleccionada === manana ? 'Mañana' : 'Reservas del día'}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 first-letter:uppercase">{titulo}</h1>
          </div>
          <button onClick={() => setModalAbierto(true)} className="btn btn-primary">
            <Icon name="plus" size={16} strokeWidth={2.2} />
            Nueva reserva
          </button>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-5 items-start">
          {/* Sidebar: búsqueda global + filtros rápidos + calendario */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-xl border border-esperanza-200/80 p-4">
              <label className="sr-only" htmlFor="buscar-reservas">Buscar en todas las reservas</label>
              <div className="relative">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="buscar-reservas"
                  type="search"
                  placeholder="Nombre, email o teléfono"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="form-input pl-10 pr-8"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700"
                    aria-label="Limpiar búsqueda"
                  >
                    <Icon name="x" size={15} />
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
                  <div className="spinner"></div>
                  <p className="text-stone-500 text-sm mt-3">Cargando reservas...</p>
                </div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
                  <Icon name="calendar" size={36} strokeWidth={1.4} className="mx-auto mb-3 text-esperanza-300" />
                  <p className="text-stone-500">No hay reservas para mostrar</p>
                </div>
              ) : (
                <>
                  <StatsRow reservas={filtradas} />
                  <div className="space-y-4">
                    {Object.entries(agrupadas).map(([clave, resas]) => {
                      const [fechaGrupo, horaGrupo] = clave.split('|');
                      const porSector = {
                        [UBICACIONES.ADENTRO]: resas.filter((r) => r.ubicacion !== UBICACIONES.VEREDA),
                        [UBICACIONES.VEREDA]: resas.filter((r) => r.ubicacion === UBICACIONES.VEREDA),
                      };
                      const totalPersonas = resas.reduce((sum, r) => sum + r.personas, 0);

                      return (
                        <div key={clave} className="bg-white rounded-xl border border-esperanza-200/80 overflow-hidden">
                          <div className="flex items-baseline justify-between gap-3 flex-wrap px-5 py-3.5 border-b border-esperanza-100">
                            <h2 className="text-base font-bold text-esperanza-700 first-letter:uppercase">
                              {formatearFechaLarga(fechaGrupo)} <span className="text-esperanza-500">· {horaGrupo}</span>
                            </h2>
                            <p className="text-xs text-stone-500">
                              {totalPersonas} personas en {resas.length}{' '}
                              {resas.length === 1 ? 'reserva' : 'reservas'}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-esperanza-100">
                            {[UBICACIONES.ADENTRO, UBICACIONES.VEREDA].map((sector) => {
                              const lista = porSector[sector];
                              const personasSector = lista.reduce((sum, r) => sum + r.personas, 0);

                              return (
                                <div key={sector}>
                                  <div className="px-5 py-2 bg-esperanza-50/70 flex items-center justify-between">
                                    <span className="font-semibold text-xs uppercase tracking-[0.06em] text-stone-600 flex items-center gap-1.5">
                                      <Icon name={sector === UBICACIONES.VEREDA ? 'sun' : 'home'} size={14} /> {UBICACIONES_LABEL[sector]}
                                    </span>
                                    <span className="text-xs text-stone-500">
                                      {lista.length === 0
                                        ? 'sin reservas'
                                        : `${personasSector} personas · ${lista.length} ${lista.length === 1 ? 'reserva' : 'reservas'}`}
                                    </span>
                                  </div>

                                  <div className="divide-y divide-esperanza-100">
                                    {lista.map((reserva) => (
                                      <details key={reserva.id} className={`group px-4 py-3 hover:bg-esperanza-50/60 transition-colors ${reserva.asistio ? 'bg-green-50/50' : ''}`}>
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
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                  reserva.asistio
                                                    ? 'bg-green-600 border-green-600 text-white'
                                                    : 'border-stone-300 text-transparent hover:border-green-600'
                                                }`}
                                              >
                                                <Icon name="check" size={12} strokeWidth={3} />
                                              </button>
                                            )}
                                            <span
                                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                reserva.estado === 'confirmada' ? 'bg-green-500' : 'bg-red-400'
                                              }`}
                                              title={reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                                            />
                                            <span className={`font-semibold truncate ${reserva.asistio ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                                              {reserva.nombre} {reserva.apellido}
                                            </span>
                                            {reserva.creadaPorAdmin && (
                                              <span className="badge bg-esperanza-100 text-esperanza-600 font-medium flex-shrink-0">
                                                a mano
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 flex-shrink-0 text-sm text-stone-600">
                                            <span className="font-semibold text-esperanza-700 flex items-center gap-1"><Icon name="users" size={14} className="text-stone-400" />{reserva.personas}</span>
                                            <Icon name="chevronDown" size={16} className="text-stone-400 group-open:rotate-180 transition-transform" />
                                          </div>
                                        </summary>

                                        <div className="mt-3 ml-3 pl-5 border-l-2 border-esperanza-100 flex items-start justify-between gap-4">
                                          <div className="text-sm text-stone-600 space-y-1.5 min-w-0">
                                            <a href={`tel:${reserva.telefono}`} className="flex items-center gap-2 hover:text-esperanza-700"><Icon name="phone" size={14} className="text-stone-400" />{reserva.telefono}</a>
                                            <div className="flex items-center gap-2 break-all"><Icon name="mail" size={14} className="text-stone-400" />{reserva.email}</div>
                                            {reserva.comentarios && <div className="flex items-start gap-2"><Icon name="message" size={14} className="text-stone-400 mt-0.5" />{reserva.comentarios}</div>}
                                            <div className="flex items-center gap-2">
                                              <Icon name="users" size={14} className="text-stone-400" />
                                              <span>Personas</span>
                                              <select
                                                value={reserva.personas}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleEditarPersonasListado(reserva.id, parseInt(e.target.value))}
                                                className="border border-esperanza-200 bg-white rounded-md px-2 py-1 text-xs font-semibold text-esperanza-700"
                                              >
                                                {PERSONAS_OPCIONES.map((n) => (
                                                  <option key={n} value={n}>
                                                    {n}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                          </div>

                                          <div className="flex gap-2 flex-shrink-0">
                                            {reserva.estado === 'confirmada' ? (
                                              <button
                                                onClick={() => handleCancel(reserva.id)}
                                                className="btn btn-small btn-secondary"
                                                title="Cancelar reserva"
                                              >
                                                <Icon name="ban" size={14} />
                                                Cancelar
                                              </button>
                                            ) : (
                                              <span className="badge bg-red-50 text-red-700 border border-red-200 py-1">Cancelada</span>
                                            )}
                                            <button
                                              onClick={() => handleDelete(reserva.id)}
                                              className="btn btn-small btn-danger"
                                              title="Eliminar"
                                              aria-label="Eliminar reserva"
                                            >
                                              <Icon name="trash" size={14} />
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
