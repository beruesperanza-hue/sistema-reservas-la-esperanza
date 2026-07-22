import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { dateAFechaISO, fechaISOaDate, hoyEnBA, sumarDias } from '@/lib/fechas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get('filtro') || 'hoy';
    const fecha = searchParams.get('fecha');

    let whereClause: any = {};

    // "Hoy" es hoy en Buenos Aires, no en la zona horaria del servidor.
    let diaISO: string | null = null;
    if (filtro === 'hoy') {
      diaISO = hoyEnBA();
    } else if (filtro === 'manana') {
      diaISO = sumarDias(hoyEnBA(), 1);
    } else if (filtro === 'fecha' && fecha) {
      diaISO = fecha;
    }

    if (diaISO) {
      whereClause = {
        fecha: {
          gte: fechaISOaDate(diaISO),
          lt: fechaISOaDate(sumarDias(diaISO, 1)),
        },
      };
    }

    const reservas = await prisma.reservation.findMany({
      where: whereClause,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });

    return NextResponse.json({
      reservas: reservas.map((r) => ({
        ...r,
        fecha: dateAFechaISO(r.fecha),
      })),
    });
  } catch (error) {
    console.error('Error en reservas:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
