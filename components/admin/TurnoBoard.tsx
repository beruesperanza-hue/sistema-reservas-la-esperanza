'use client';

import { useEffect, useState } from 'react';
import { UBICACIONES, UBICACIONES_ICONO, UBICACIONES_LABEL } from '@/lib/constants';
import NuevaReservaModal from './NuevaReservaModal';

interface ReservaTurno {
  id: string;
  nombre: string;
  apellido: string;
  personas: number;
  telefono: string;
  email: string;
  comentarios?: string | null;
  creadaPorAdmin: boolean;
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

function BarraOcupacion({ reservado, capacidad }: { reservado: number; capacidad: number }) {
  const pct = capacidad > 0 ? Math.min(100, Math.round((reservado / capacidad) * 100)) : 0;
  const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectorCard({
  sector,
  tipo,
  pasado,
  onToggleCierre,
  onNuevaReserva,
}: {
  sector: SectorTurno;
  tipo: string;
  pasado: boolean;
  onToggleCierre: () => void;
  onNuevaReserva: () => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const sinSector = sector.capacidad === 0; // ej. turnos sin vereda habilitada

  if (sinSector) {
    return (
      <div className="flex-1 rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
        {UBICACIONES_ICONO[tipo]} {UBICACIONES_LABEL[tipo]} — sin mesas este turno
      </div>
    );
  }

  const estadoLabel = pasado ? 'Cerrado (pasó)' : sector.cerrado ? 'Cerrado' : null;

  return (
    <div
      className={`flex-1 rounded-lg border p-3 ${
        pasado || sector.cerrado ? 'border-gray-200 bg-gray-50' : 'border-esperanza-100'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-sm flex items-center gap-1.5">
          {UBICACIONES_ICONO[tipo]} {UBICACIONES_LABEL[tipo]}
        </span>
        {estadoLabel ? (
          <span className="text-xs font-semibold text-gray-400">{estadoLabel}</span>
        ) : (
          <span className="text-xs text-gray-500">
            {sector.reservado}/{sector.capacidad}
          </span>
        )}
      </div>

      {!pasado && <BarraOcupacion reservado={sector.reservado} capacidad={sector.capacidad} />}

      {sector.reservas.length > 0 && (
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="text-xs text-esperanza-600 hover:text-esperanza-800 mt-2 font-medium"
        >
          {abierta ? 'Ocultar' : 'Ver'} {sector.reservas.length}{' '}
          {sector.reservas.length === 1 ? 'reserva' : 'reservas'}
        </button>
      )}

      {abierta && (
        <ul className="mt-2 space-y-1.5">
          {sector.reservas.map((r) => (
            <li key={r.id} className="text-xs bg-white rounded p-2 border border-gray-100">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {r.nombre} {r.apellido}
                </span>
                <span>👥 {r.personas}</span>
              </div>
              <div className="text-gray-500">
                📱 {r.telefono}
                {r.creadaPorAdmin && <span className="ml-1 text-esperanza-500">· cargada a mano</span>}
              </div>
              {r.comentarios && <div className="text-gray-500 italic">💬 {r.comentarios}</div>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          onClick={onNuevaReserva}
          className="text-xs px-2 py-1 rounded bg-esperanza-100 text-esperanza-700 hover:bg-esperanza-200 font-semibold"
        >
          + Reserva
        </button>
        {!pasado && (
          <button
            type="button"
            onClick={onToggleCierre}
            className={`text-xs px-2 py-1 rounded font-semibold ${
              sector.cerrado
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            {sector.cerrado ? 'Reabrir' : 'Cerrar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TurnoBoard({ fecha }: { fecha: string }) {
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

  const toggleCierre = async (hora: string, sectorTipo: string, sector: SectorTurno) => {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (turnos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <span className="text-4xl text-gray-300 block mb-2">📅</span>
        <p className="text-gray-600">No hay turnos configurados para este día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {turnos.map((turno) => (
        <div
          key={turno.hora}
          className={`bg-white rounded-lg shadow overflow-hidden ${turno.pasado ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-esperanza-50 border-b border-esperanza-100">
            <h3 className="font-serif font-bold text-esperanza-700">
              🕐 {turno.hora}
              {turno.pasado && <span className="ml-2 text-xs font-normal text-gray-400">Turno pasado</span>}
            </h3>
            <span className="text-xs text-gray-500">
              {turno.salon.reservado + turno.vereda.reservado} personas en total
            </span>
          </div>

          <div className="p-3 flex flex-col sm:flex-row gap-3">
            <SectorCard
              sector={turno.salon}
              tipo={UBICACIONES.ADENTRO}
              pasado={turno.pasado}
              onToggleCierre={() => toggleCierre(turno.hora, UBICACIONES.ADENTRO, turno.salon)}
              onNuevaReserva={() => setModal({ hora: turno.hora, sector: UBICACIONES.ADENTRO })}
            />
            <SectorCard
              sector={turno.vereda}
              tipo={UBICACIONES.VEREDA}
              pasado={turno.pasado}
              onToggleCierre={() => toggleCierre(turno.hora, UBICACIONES.VEREDA, turno.vereda)}
              onNuevaReserva={() => setModal({ hora: turno.hora, sector: UBICACIONES.VEREDA })}
            />
          </div>
        </div>
      ))}

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
