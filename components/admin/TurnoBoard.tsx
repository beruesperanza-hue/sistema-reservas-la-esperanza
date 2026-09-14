'use client';

import { useEffect, useState } from 'react';
import { marcarAsistio, updateReservation } from '@/app/actions/reservations';
import { PERSONAS_OPCIONES, UBICACIONES, UBICACIONES_LABEL } from '@/lib/constants';
import NuevaReservaModal from './NuevaReservaModal';
import Icon from './Icon';

interface ReservaTurno {
  id: string;
  nombre: string;
  apellido: string;
  personas: number;
  telefono: string;
  email: string;
  comentarios?: string | null;
  creadaPorAdmin: boolean;
  asistio: boolean;
}

interface SectorTurno {
  capacidad: number;
  reservado: number;
  libres: number;
  cerrado: boolean;
  cierreId: string | null;
  motivoCierre: string | null;
  reservas: ReservaTurno[];
}

interface Turno {
  hora: string;
  pasado: boolean;
  salon: SectorTurno;
  vereda: SectorTurno;
}

function ToggleCierre({ cerrado, onClick }: { cerrado: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={!cerrado}
      title={cerrado ? 'Turno cerrado a nuevas reservas — tocar para reabrir' : 'Turno abierto — tocar para cerrarlo a nuevas reservas'}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        cerrado ? 'bg-stone-300' : 'bg-green-600'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
          cerrado ? 'left-0.5' : 'left-[18px]'
        }`}
      />
    </button>
  );
}

function CheckAsistio({ asistio, onClick }: { asistio: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={asistio ? 'Ya se sentó — tocar para desmarcar' : 'Marcar que ya se sentó'}
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        asistio ? 'bg-green-600 border-green-600 text-white' : 'border-stone-300 text-transparent hover:border-green-600'
      }`}
    >
      <Icon name="check" size={13} strokeWidth={3} />
    </button>
  );
}

function ReservaRow({
  reserva,
  onToggleAsistio,
  onEditarPersonas,
}: {
  reserva: ReservaTurno;
  onToggleAsistio: () => void;
  onEditarPersonas: (personas: number) => void;
}) {
  return (
    <details className={`group px-4 md:px-5 py-2.5 hover:bg-esperanza-50/60 transition-colors ${reserva.asistio ? 'bg-green-50/50' : ''}`}>
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
        <span className="flex items-center gap-3 min-w-0">
          <CheckAsistio asistio={reserva.asistio} onClick={onToggleAsistio} />
          <span
            className={`font-medium truncate flex items-center gap-2 min-w-0 ${
              reserva.asistio ? 'text-stone-400 line-through' : 'text-stone-900'
            }`}
          >
            {reserva.nombre} {reserva.apellido}
            {reserva.creadaPorAdmin && (
              <span className="badge bg-esperanza-100 text-esperanza-600 font-medium flex-shrink-0">
                a mano
              </span>
            )}
          </span>
        </span>
        <span className="flex items-center gap-3 text-sm text-stone-500 flex-shrink-0">
          <span className="font-semibold text-esperanza-700 flex items-center gap-1">
            <Icon name="users" size={14} className="text-stone-400" />
            {reserva.personas}
          </span>
          <Icon name="chevronDown" size={16} className="text-stone-400 group-open:rotate-180 transition-transform" />
        </span>
      </summary>
      <div className="mt-2 ml-3 pl-6 border-l-2 border-esperanza-100 text-[13px] text-stone-600 space-y-1.5">
        <a href={`tel:${reserva.telefono}`} className="flex items-center gap-2 hover:text-esperanza-700">
          <Icon name="phone" size={14} className="text-stone-400" />
          {reserva.telefono}
        </a>
        {reserva.email && (
          <div className="flex items-center gap-2 break-all">
            <Icon name="mail" size={14} className="text-stone-400" />
            {reserva.email}
          </div>
        )}
        {reserva.comentarios && (
          <div className="flex items-start gap-2 text-esperanza-700">
            <Icon name="message" size={14} className="text-esperanza-400 mt-0.5" />
            {reserva.comentarios}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Icon name="users" size={14} className="text-stone-400" />
          <span>Personas</span>
          <select
            value={reserva.personas}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onEditarPersonas(parseInt(e.target.value))}
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
    </details>
  );
}

function SectorAcordeon({
  tipo,
  turnos,
  onToggleCierre,
  onToggleAsistio,
  onEditarPersonas,
  onNuevaReserva,
}: {
  tipo: string;
  turnos: Turno[];
  onToggleCierre: (hora: string) => void;
  onToggleAsistio: (reservaId: string, nuevoValor: boolean) => void;
  onEditarPersonas: (reservaId: string, personas: number) => void;
  onNuevaReserva: (hora: string) => void;
}) {
  const [abierto, setAbierto] = useState(true);

  const filas = turnos
    .map((turno) => ({ turno, sector: tipo === UBICACIONES.ADENTRO ? turno.salon : turno.vereda }))
    .filter((f) => f.sector.capacidad > 0);

  const totalPersonas = filas.reduce((sum, f) => sum + f.sector.reservado, 0);
  const totalReservas = filas.reduce((sum, f) => sum + f.sector.reservas.length, 0);
  const totalSentados = filas.reduce(
    (sum, f) => sum + f.sector.reservas.filter((r) => r.asistio).reduce((s, r) => s + r.personas, 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-esperanza-200/80 overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 hover:bg-esperanza-50/60 transition-colors"
      >
        <span className="font-bold text-esperanza-700 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-esperanza-100 text-esperanza-600 flex items-center justify-center">
            <Icon name={tipo === UBICACIONES.VEREDA ? 'sun' : 'home'} size={17} />
          </span>
          {UBICACIONES_LABEL[tipo]}
        </span>
        <span className="flex items-center gap-3 text-xs md:text-sm text-stone-500 text-right">
          <span>
            {totalReservas === 0
              ? 'sin reservas'
              : `${totalPersonas} personas · ${totalReservas} ${totalReservas === 1 ? 'reserva' : 'reservas'}${
                  totalSentados > 0 ? ` · ${totalSentados} sentados` : ''
                }`}
          </span>
          <Icon name="chevronDown" size={18} className={`text-stone-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {abierto && (
        <div className="border-t border-esperanza-100">
          {filas.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-stone-400">Sin turnos configurados para este día.</p>
          ) : (
            filas.map(({ turno, sector }) => (
              <div key={turno.hora} className={`border-b border-esperanza-100 last:border-0 ${turno.pasado ? 'opacity-55' : ''}`}>
                <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-2 bg-esperanza-50/70">
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-extrabold text-[15px] text-esperanza-700 tabular-nums">{turno.hora}</span>
                    {turno.pasado && <span className="badge bg-stone-200/70 text-stone-500">pasó</span>}
                    {sector.cerrado && !turno.pasado && <span className="badge bg-red-50 text-red-700">cerrado</span>}
                  </span>
                  <span className="text-xs text-stone-500 truncate">
                    {sector.reservas.length === 0
                      ? 'sin reservas'
                      : `${sector.reservado} personas · ${sector.reservas.length} ${sector.reservas.length === 1 ? 'reserva' : 'reservas'}`}
                  </span>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onNuevaReserva(turno.hora)}
                      className="btn btn-small btn-secondary !px-2.5"
                    >
                      <Icon name="plus" size={13} strokeWidth={2.4} />
                      Reserva
                    </button>
                    {!turno.pasado && (
                      <ToggleCierre cerrado={sector.cerrado} onClick={() => onToggleCierre(turno.hora)} />
                    )}
                  </div>
                </div>

                <div className="divide-y divide-esperanza-100/70">
                  {sector.reservas.map((r) => (
                    <ReservaRow
                      key={r.id}
                      reserva={r}
                      onToggleAsistio={() => onToggleAsistio(r.id, !r.asistio)}
                      onEditarPersonas={(personas) => onEditarPersonas(r.id, personas)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TurnoBoard({
  fecha,
  onAsistioChange,
}: {
  fecha: string;
  onAsistioChange?: (id: string, asistio: boolean) => void;
}) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ hora: string; sector: string } | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch(`/api/admin/turnos?fecha=${fecha}`)
      .then((r) => r.json())
      .then((data) => setTurnos(data.turnos || []))
      .catch(() => setTurnos([]))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [fecha]);

  const toggleCierre = async (hora: string, sectorTipo: string) => {
    const turno = turnos.find((t) => t.hora === hora);
    const sector = sectorTipo === UBICACIONES.ADENTRO ? turno?.salon : turno?.vereda;
    if (!sector) return;

    if (sector.cerrado && sector.cierreId) {
      await fetch(`/api/admin/cierres/${sector.cierreId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/admin/cierres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, sector: sectorTipo }),
      });
    }
    cargar();
  };

  const toggleAsistio = async (reservaId: string, nuevoValor: boolean) => {
    // Optimista: se ve al toque, sin esperar la vuelta del servidor ni
    // recargar el tablero entero (por eso NO se llama a cargar() acá).
    setTurnos((prev) =>
      prev.map((t) => ({
        ...t,
        salon: {
          ...t.salon,
          reservas: t.salon.reservas.map((r) => (r.id === reservaId ? { ...r, asistio: nuevoValor } : r)),
        },
        vereda: {
          ...t.vereda,
          reservas: t.vereda.reservas.map((r) => (r.id === reservaId ? { ...r, asistio: nuevoValor } : r)),
        },
      }))
    );
    onAsistioChange?.(reservaId, nuevoValor);

    const result = await marcarAsistio(reservaId, nuevoValor);
    if (!result.success) cargar(); // si falló, traer el estado real
  };

  const editarPersonas = async (reservaId: string, personas: number) => {
    setTurnos((prev) =>
      prev.map((t) => ({
        ...t,
        salon: {
          ...t.salon,
          reservado: t.salon.reservas.some((r) => r.id === reservaId)
            ? t.salon.reservado - (t.salon.reservas.find((r) => r.id === reservaId)?.personas ?? 0) + personas
            : t.salon.reservado,
          reservas: t.salon.reservas.map((r) => (r.id === reservaId ? { ...r, personas } : r)),
        },
        vereda: {
          ...t.vereda,
          reservado: t.vereda.reservas.some((r) => r.id === reservaId)
            ? t.vereda.reservado - (t.vereda.reservas.find((r) => r.id === reservaId)?.personas ?? 0) + personas
            : t.vereda.reservado,
          reservas: t.vereda.reservas.map((r) => (r.id === reservaId ? { ...r, personas } : r)),
        },
      }))
    );

    const result = await updateReservation(reservaId, { personas });
    if (!result.success) cargar();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <SectorAcordeon
        tipo={UBICACIONES.ADENTRO}
        turnos={turnos}
        onToggleCierre={(hora) => toggleCierre(hora, UBICACIONES.ADENTRO)}
        onToggleAsistio={toggleAsistio}
        onEditarPersonas={editarPersonas}
        onNuevaReserva={(hora) => setModal({ hora, sector: UBICACIONES.ADENTRO })}
      />
      <SectorAcordeon
        tipo={UBICACIONES.VEREDA}
        turnos={turnos}
        onToggleCierre={(hora) => toggleCierre(hora, UBICACIONES.VEREDA)}
        onToggleAsistio={toggleAsistio}
        onEditarPersonas={editarPersonas}
        onNuevaReserva={(hora) => setModal({ hora, sector: UBICACIONES.VEREDA })}
      />

      {modal && (
        <NuevaReservaModal
          fechaInicial={fecha}
          horaInicial={modal.hora}
          sectorInicial={modal.sector}
          onClose={() => setModal(null)}
          onCreada={cargar}
        />
      )}
    </div>
  );
}
