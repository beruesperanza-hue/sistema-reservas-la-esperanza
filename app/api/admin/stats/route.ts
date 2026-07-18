import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ESTADOS_RESERVA } from '@/lib/constants';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reservas de hoy
    const reservasHoy = await prisma.reservation.findMany({
      where: {
        fecha: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
    });

    // Reservas de mañana
    const reservasManana = await prisma.reservation.findMany({
      where: {
        fecha: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        },
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
    });

    // Total de reservas
    const totalReservas = await prisma.reservation.count({
      where: {
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
    });

    // Total de personas
    const totalPersonas = await prisma.reservation.aggregate({
      where: {
        estado: ESTADOS_RESERVA.CONFIRMADA,
      },
      _sum: { personas: true },
    });

    // Personas hoy
    const personasHoy = reservasHoy.reduce((sum, r) => sum + r.personas, 0);

    // Personas mañana
    const personasManana = reservasManana.reduce((sum, r) => sum + r.personas, 0);

    // Horarios completos (con capacidad máxima)
    const settings = await prisma.settings.findFirst();
    const capacidad = settings?.capacidadPorTurno || 20;

    const horariosCompletos = await prisma.reservation.groupBy({
      by: ['fecha', 'hora'],
      where: {
        estado: ESTADOS_RESERVA.CONFIRMADA,
        fecha: {
          gte: today,
        },
      },
      _sum: { personas: true },
    });

    const completos = horariosCompletos.filter((h) => (h._sum.personas || 0) >= capacidad).length;

    return NextResponse.json({
      reservasHoy: reservasHoy.length,
      reservasManana: reservasManana.length,
      totalReservas,
      totalPersonas: totalPersonas._sum.personas || 0,
      horariosCompletos: completos,
      personasHoy,
      personasManana,
    });
  } catch (error) {
    console.error('Error en stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
