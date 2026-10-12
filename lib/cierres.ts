import prisma from '@/lib/db';
import { UBICACIONES } from '@/lib/constants';
import { fechaISOaDate } from '@/lib/fechas';

/**
 * Cierres programados: vacaciones, feriados, un evento privado, una noche
 * puntual. Se cargan por adelantado desde el panel y valen para un rango de
 * fechas, opcionalmente acotado a una franja horaria y a un sector.
 *
 * No reemplazan a TurnoCierre, que es el interruptor de un turno suelto en el
 * tablero del día; los dos se consultan al calcular si un turno está abierto.
 */
export interface CierreAplicable {
  id: string;
  horaDesde: string | null;
  horaHasta: string | null;
  sector: string | null;
  motivo: string | null;
}

/** Los cierres programados que cubren esa fecha. */
export async function cierresDeFecha(fechaISO: string): Promise<CierreAplicable[]> {
  const fecha = fechaISOaDate(fechaISO);
  return prisma.cierreProgramado.findMany({
    where: { desde: { lte: fecha }, hasta: { gte: fecha } },
    select: { id: true, horaDesde: true, horaHasta: true, sector: true, motivo: true },
  });
}

/** ¿Alguno de esos cierres tapa este turno y este sector? */
export function cierreQueAplica(
  cierres: CierreAplicable[],
  hora: string,
  sector: typeof UBICACIONES.ADENTRO | typeof UBICACIONES.VEREDA
): CierreAplicable | undefined {
  return cierres.find((c) => {
    if (c.sector && c.sector !== sector) return false;
    // Sin franja horaria, el cierre vale para todo el día.
    if (!c.horaDesde) return true;
    const hasta = c.horaHasta || c.horaDesde;
    return hora >= c.horaDesde && hora <= hasta;
  });
}
