import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DIA_NUMERO_A_NOMBRE, ESTADOS_RESERVA } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get('fecha');
    const personasStr = searchParams.get('personas');

    if (!fechaStr || !personasStr) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: fecha y personas' },
        { status: 400 }
      );
    }

    const fecha = new Date(fechaStr);
    const personas = parseInt(personasStr);

    if (isNaN(fecha.getTime()) || isNaN(personas) || personas < 1 || personas > 20) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayOfWeek = fecha.getDay();
    const diaNombre = DIA_NUMERO_A_NOMBRE[dayOfWeek as keyof typeof DIA_NUMERO_A_NOMBRE];

    // Obtener horarios disponibles para ese día
    const horarios = await prisma.schedule.findMany({
      where: {
        dia: diaNombre,
        activo: true,
      },
      orderBy: { hora: 'asc' },
    });

    if (horarios.length === 0) {
      return NextResponse.json({
        slots: [],
        mensaje: 'No hay horarios disponibles para este día',
      });
    }

    // Obtener configuración
    const settings = await prisma.settings.findFirst();
    const capacidadMaxima = settings?.capacidadPorTurno || 20;

    // Para cada horario, verificar disponibilidad
    const slots = await Promise.all(
      horarios.map(async (horario) => {
        // Contar personas ya reservadas para ese horario
        const reservedCount = await prisma.reservation.aggregate({
          where: {
            fecha: {
              gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
            },
            hora: horario.hora,
            estado: ESTADOS_RESERVA.CONFIRMADA,
          },
          _sum: { personas: true },
        });

        const reservedPersonas = reservedCount._sum.personas || 0;
        const disponible = reservedPersonas + personas <= capacidadMaxima;
        const personasDisponibles = capacidadMaxima - reservedPersonas;

        return {
          hora: horario.hora,
          disponible,
          personas_disponibles: personasDisponibles,
        };
      })
    );

    return NextResponse.json({
      fecha: fechaStr,
      dia: diaNombre,
      slots,
    });
  } catch (error) {
    console.error('Error en disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al obtener disponibilidad' },
      { status: 500 }
    );
  }
}
