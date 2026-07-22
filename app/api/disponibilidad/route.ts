import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ESTADOS_RESERVA } from '@/lib/constants';
import { diaSemanaDe, esTurnoPasado, fechaISOaDate } from '@/lib/fechas';

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

    const personas = parseInt(personasStr);

    // La fecha llega como 'YYYY-MM-DD' desde el <input type="date">.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr) || isNaN(personas) || personas < 1 || personas > 20) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const fecha = fechaISOaDate(fechaStr);
    const diaNombre = diaSemanaDe(fechaStr);

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
            fecha,
            hora: horario.hora,
            estado: ESTADOS_RESERVA.CONFIRMADA,
          },
          _sum: { personas: true },
        });

        const reservedPersonas = reservedCount._sum.personas || 0;
        const personasDisponibles = capacidadMaxima - reservedPersonas;
        // Un turno de hoy que ya empezó no se puede reservar (hora de Buenos Aires).
        const pasado = esTurnoPasado(fechaStr, horario.hora);
        const disponible = !pasado && reservedPersonas + personas <= capacidadMaxima;

        return {
          hora: horario.hora,
          disponible,
          pasado,
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
