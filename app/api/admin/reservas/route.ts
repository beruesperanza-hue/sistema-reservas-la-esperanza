import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get('filtro') || 'hoy';
    const fecha = searchParams.get('fecha');

    let whereClause: any = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filtro === 'hoy') {
      whereClause = {
        fecha: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      };
    } else if (filtro === 'manana') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      whereClause = {
        fecha: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        },
      };
    } else if (filtro === 'fecha' && fecha) {
      const fechaDate = new Date(fecha);
      whereClause = {
        fecha: {
          gte: fechaDate,
          lt: new Date(fechaDate.getTime() + 24 * 60 * 60 * 1000),
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
        fecha: r.fecha.toISOString().split('T')[0],
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
