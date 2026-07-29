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

function ToggleCierre({ cerrado, onClick }: { cerrado: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={!cerrado}
      title={cerrado ? 'Cerrado — tocar para reabrir' : 'Abierto — tocar para cerrar'}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
        cerrado ? 'bg-gray-300' : 'bg-green-500'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          cerrado ? 'left-0.5' : 'left-4'
        }`}
      />
    </button>
  );
}

function ReservaRow({ reserva }: { reserva: ReservaTurno }) {
  return (
    <details className="group px-5 py-2.5 hover:bg-gray-50 transition-colors">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
        <span className="font-medium text-gray-900 truncate flex items-center gap-2 min-w-0">
          {reserva.nombre} {reserva.apellido}
          {reserva.creadaPorAdmin && (
            <span className="text-[10px] font-normal text-esperanza-500 bg-esperanza-50 px-1.5 py-0.5 rounded flex-shrink-0">
              a mano
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 text-sm text-gray-500 flex-shrink-0">
          <span className="font-medium">👥 {reserva.personas}</span>
          <span className="text-gray-400 group-open:rotate-180 transition-transform">⌄</span>
        </span>
      </summary>
      <div className="mt-1.5 pl-0.5 text-xs text-gray-500 space-y-0.5">
        <div>📱 {reserva.telefono}</div>
        <div>📧 {reserva.email}</div>
        {reserva.comentarios && <div>💬 {reserva.comentarios}</div>}
      </div>
    </details>
  );
}

function SectorAcordeon({
  tipo,
  turnos,
  onToggleCierre,
  onNuevaReserva,
}: {
  tipo: string;
  turnos: Turno[];
  onToggleCierre: (hora: string) => void;
  onNuevaReserva: (hora: string) => void;
}) {
  const [abierto, setAbierto] = useState(true);

  const filas = turnos
    .map((turno) => ({ turno, sector: tipo === UBICACIONES.ADENTRO ? turno.salon : turno.vereda }))
    .filter((f) => f.sector.capacidad > 0);

  const totalPersonas = filas.reduce((sum, f) => sum + f.sector.reservado, 0);
  const totalReservas = filas.reduce((sum, f) => sum + f.sector.reservas.length, 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 flex items-center gap-2">
          {UBICACIONES_ICONO[tipo]} {UBICACIONES_LABEL[tipo]}
        </span>
        <span className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {totalReservas === 0
              ? 'sin reservas'
              : `${totalPersonas} personas · ${totalReservas} ${totalReservas === 1 ? 'reserva' : 'reservas'}`}
          </span>
          <span className={`text-gray-400 transition-transform inline-block ${abierto ? 'rotate-180' : ''}`}>⌄</span>
        </span>
      </button>

      {abierto && (
        <div className="border-t border-gray-100">
          {filas.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-gray-400">Sin turnos configurados para este día.</p>
          ) : (
            filas.map(({ turno, sector }) => (
              <div key={turno.hora} className={`border-b border-gray-100 last:border-0 ${turno.pasado ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50">
                  <span className="font-semibold text-sm text-esperanza-700 flex-shrink-0">
                    🕐 {turno.hora}
                    {turno.pasado && <span className="ml-2 text-xs font-normal text-gray-400">pasó</span>}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {sector.reservas.length === 0
                      ? 'sin reservas'
                      : `${sector.reservado} personas · ${sector.reservas.length} ${sector.reservas.length === 1 ? 'reserva' : 'reservas'}`}
                  </span>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onNuevaReserva(turno.hora)}
                      className="text-xs px-2 py-1 rounded bg-esperanza-100 text-esperanza-700 hover:bg-esperanza-200 font-semibold"
                    >
                      + Reserva
                    </button>
                    {!turno.pasado && (
                      <ToggleCierre cerrado={sector.cerrado} onClick={() => onToggleCierre(turno.hora)} />
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {sector.reservas.map((r) => (
                    <ReservaRow key={r.id} reserva={r} />
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <SectorAcordeon
        tipo={UBICACIONES.ADENTRO}
        turnos={turnos}
        onToggleCierre={(hora) => toggleCierre(hora, UBICACIONES.ADENTRO)}
        onNuevaReserva={(hora) => setModal({ hora, sector: UBICACIONES.ADENTRO })}
      />
      <SectorAcordeon
        tipo={UBICACIONES.VEREDA}
        turnos={turnos}
        onToggleCierre={(hora) => toggleCierre(hora, UBICACIONES.VEREDA)}
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
