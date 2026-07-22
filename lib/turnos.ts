import prisma from '@/lib/db';
import { ESTADOS_RESERVA, UBICACIONES } from '@/lib/constants';
import { esTurnoPasado, fechaISOaDate } from '@/lib/fechas';

export interface EstadoSector {
  capacidad: number;
  reservado: number;
  libres: number;
  /** Cerrado a mano desde el admin (independiente de si ya pasó o si está lleno). */
  cerradoManual: boolean;
  /** true si hay lugar para `personas` (ver getEstadoTurno). */
  disponible: boolean;
}

export interface EstadoTurno {
  hora: string;
  pasado: boolean;
  salon: EstadoSector;
  vereda: EstadoSector;
}

/**
 * Estado completo de un turno (fecha + hora) para ambos sectores: cupos
 * ocupados/libres, si está cerrado a mano y si el turno ya pasó (hora AR).
 * `personas` es opcional — si se pasa, cada sector informa si alcanza el cupo.
 */
export async function getEstadoTurno(
  fechaISO: string,
  hora: string,
  capacidadSalon: number,
  capacidadVereda: number,
  personas: number = 0
): Promise<EstadoTurno> {
  const fecha = fechaISOaDate(fechaISO);
  const pasado = esTurnoPasado(fechaISO, hora);

  const [reservasSalon, reservasVereda, cierres] = await Promise.all([
    prisma.reservation.aggregate({
      where: { fecha, hora, ubicacion: UBICACIONES.ADENTRO, estado: ESTADOS_RESERVA.CONFIRMADA },
      _sum: { personas: true },
    }),
    prisma.reservation.aggregate({
      where: { fecha, hora, ubicacion: UBICACIONES.VEREDA, estado: ESTADOS_RESERVA.CONFIRMADA },
      _sum: { personas: true },
    }),
    prisma.turnoCierre.findMany({ where: { fecha, hora } }),
  ]);

  const cierreGeneral = cierres.some((c) => c.sector === null);
  const cierreSalon = cierreGeneral || cierres.some((c) => c.sector === UBICACIONES.ADENTRO);
  const cierreVereda = cierreGeneral || cierres.some((c) => c.sector === UBICACIONES.VEREDA);

  const ocupadoSalon = reservasSalon._sum.personas || 0;
  const ocupadoVereda = reservasVereda._sum.personas || 0;

  const salon: EstadoSector = {
    capacidad: capacidadSalon,
    reservado: ocupadoSalon,
    libres: Math.max(0, capacidadSalon - ocupadoSalon),
    cerradoManual: cierreSalon,
    disponible: !pasado && !cierreSalon && ocupadoSalon + personas <= capacidadSalon,
  };

  const vereda: EstadoSector = {
    capacidad: capacidadVereda,
    reservado: ocupadoVereda,
    libres: Math.max(0, capacidadVereda - ocupadoVereda),
    cerradoManual: cierreVereda,
    disponible:
      capacidadVereda > 0 &&
      !pasado &&
      !cierreVereda &&
      ocupadoVereda + personas <= capacidadVereda,
  };

  return { hora, pasado, salon, vereda };
}

/** Estado del sector elegido dentro de un EstadoTurno ya calculado. */
export function sectorDe(estado: EstadoTurno, ubicacion: string): EstadoSector {
  return ubicacion === UBICACIONES.VEREDA ? estado.vereda : estado.salon;
}
