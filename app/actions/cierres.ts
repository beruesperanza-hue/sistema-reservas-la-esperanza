'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { verifySessionToken } from '@/lib/adminSession';
import { UBICACIONES } from '@/lib/constants';
import { dateAFechaISO, fechaISOaDate, hoyEnBA } from '@/lib/fechas';

// Las server actions se pueden invocar desde fuera de /admin, así que cada
// una verifica la sesión por su cuenta (mismo criterio que whatsapp.ts).
async function exigirAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!(await verifySessionToken(token))) throw new Error('No autorizado');
}

export interface DatosCierre {
  desde: string; // 'YYYY-MM-DD'
  hasta?: string; // vacío = un solo día
  horaDesde?: string; // vacío = todo el día
  horaHasta?: string; // vacío = solo ese turno
  sector?: string; // vacío = los dos sectores
  motivo?: string;
}

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ES_HORA = /^\d{2}:\d{2}$/;

export async function crearCierre(datos: DatosCierre) {
  try {
    await exigirAdmin();

    const desde = (datos.desde || '').trim();
    const hasta = (datos.hasta || '').trim() || desde;
    if (!ES_FECHA.test(desde) || !ES_FECHA.test(hasta)) {
      return { success: false as const, error: 'Elegí las fechas del cierre.' };
    }
    if (hasta < desde) {
      return { success: false as const, error: 'La fecha de fin es anterior a la de inicio.' };
    }

    const horaDesde = (datos.horaDesde || '').trim();
    const horaHasta = (datos.horaHasta || '').trim();
    if (horaDesde && !ES_HORA.test(horaDesde)) {
      return { success: false as const, error: 'La hora de inicio no es válida.' };
    }
    if (horaHasta && (!ES_HORA.test(horaHasta) || !horaDesde)) {
      return { success: false as const, error: 'Para usar la hora de fin, cargá también la de inicio.' };
    }
    if (horaDesde && horaHasta && horaHasta < horaDesde) {
      return { success: false as const, error: 'La hora de fin es anterior a la de inicio.' };
    }

    const sector =
      datos.sector === UBICACIONES.ADENTRO || datos.sector === UBICACIONES.VEREDA ? datos.sector : null;

    const cierre = await prisma.cierreProgramado.create({
      data: {
        desde: fechaISOaDate(desde),
        hasta: fechaISOaDate(hasta),
        horaDesde: horaDesde || null,
        horaHasta: horaHasta || null,
        sector,
        motivo: (datos.motivo || '').trim() || null,
      },
      select: { id: true },
    });

    // Cuántas reservas ya confirmadas caen adentro del cierre: el panel avisa
    // para que alguien las llame (no se cancelan solas).
    const afectadas = await reservasEnCierre(cierre.id);

    revalidatePath('/admin/cierres');
    revalidatePath('/admin/reservas');
    return { success: true as const, id: cierre.id, afectadas };
  } catch (error) {
    console.error('Error creando el cierre:', error);
    return { success: false as const, error: 'No se pudo guardar el cierre.' };
  }
}

export async function eliminarCierre(id: string) {
  try {
    await exigirAdmin();
    await prisma.cierreProgramado.delete({ where: { id } });
    revalidatePath('/admin/cierres');
    revalidatePath('/admin/reservas');
    return { success: true as const };
  } catch (error) {
    console.error('Error eliminando el cierre:', error);
    return { success: false as const, error: 'No se pudo eliminar el cierre.' };
  }
}

/** Reservas confirmadas que quedaron dentro de un cierre ya guardado. */
async function reservasEnCierre(id: string): Promise<number> {
  const cierre = await prisma.cierreProgramado.findUnique({ where: { id } });
  if (!cierre) return 0;

  const reservas = await prisma.reservation.findMany({
    where: {
      estado: 'confirmada',
      fecha: { gte: cierre.desde, lte: cierre.hasta },
      ...(cierre.sector ? { ubicacion: cierre.sector } : {}),
    },
    select: { hora: true },
  });

  if (!cierre.horaDesde) return reservas.length;
  const hasta = cierre.horaHasta || cierre.horaDesde;
  return reservas.filter((r) => r.hora >= cierre.horaDesde! && r.hora <= hasta).length;
}

export interface CierreListado {
  id: string;
  desde: string;
  hasta: string;
  horaDesde: string | null;
  horaHasta: string | null;
  sector: string | null;
  motivo: string | null;
  afectadas: number;
  pasado: boolean;
}

/** Los cierres cargados, los próximos primero. */
export async function listarCierres(): Promise<CierreListado[]> {
  await exigirAdmin();
  const hoy = hoyEnBA();

  const cierres = await prisma.cierreProgramado.findMany({ orderBy: { desde: 'asc' } });

  return Promise.all(
    cierres.map(async (c) => ({
      id: c.id,
      desde: dateAFechaISO(c.desde),
      hasta: dateAFechaISO(c.hasta),
      horaDesde: c.horaDesde,
      horaHasta: c.horaHasta,
      sector: c.sector,
      motivo: c.motivo,
      afectadas: await reservasEnCierre(c.id),
      pasado: dateAFechaISO(c.hasta) < hoy,
    }))
  );
}
