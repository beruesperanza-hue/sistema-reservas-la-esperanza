import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ESTADOS_RESERVA } from '@/lib/constants';
import { dateAFechaISO, fechaISOaDate } from '@/lib/fechas';

// Resumen por día de un mes (cantidad de reservas y personas), para pintar
// el mini calendario del Dashboard sin traer todas las reservas al cliente.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes'); // 'YYYY-MM'

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return NextResponse.json({ error: 'mes requerido (YYYY-MM)' }, { status: 400 });
    }

    const desde = fechaISOaDate(`${mes}-01`);
    const hasta = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + 1, 1));

    const reservas = await prisma.reservation.findMany({
      where: {
        fecha: { gte: desde, lt: hasta },
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
      select: { fecha: true, personas: true },
    });

    const porDia = new Map<string, { reservas: number; personas: number }>();
    for (const r of reservas) {
      const key = dateAFechaISO(r.fecha);
      const actual = porDia.get(key) || { reservas: 0, personas: 0 };
      actual.reservas += 1;
      actual.personas += r.personas;
      porDia.set(key, actual);
    }

    return NextResponse.json({
      mes,
      dias: Object.fromEntries(porDia),
    });
  } catch (error) {
    console.error('Error en calendario:', error);
    return NextResponse.json({ error: 'Error al obtener el calendario' }, { status: 500 });
  }
}
