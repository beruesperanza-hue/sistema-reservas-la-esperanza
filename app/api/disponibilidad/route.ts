import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { diaSemanaDe, fechaISOaDate } from '@/lib/fechas';
import { getEstadoTurno } from '@/lib/turnos';

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

    fechaISOaDate(fechaStr); // valida que sea una fecha real
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

    // Para cada horario, verificar disponibilidad de cada sector por separado
    // (cada uno tiene su propia capacidad definida en Schedule).
    const slots = await Promise.all(
      horarios.map(async (horario) => {
        const estado = await getEstadoTurno(
          fechaStr,
          horario.hora,
          horario.capacidad,
          horario.capacidadVereda,
          personas
        );

        return {
          hora: horario.hora,
          pasado: estado.pasado,
          // El horario aparece "disponible" en la grilla si ALGÚN sector tiene
          // lugar; el sector elegido se valida de nuevo al confirmar la reserva.
          disponible: estado.salon.disponible || estado.vereda.disponible,
          salon: {
            disponible: estado.salon.disponible,
            libres: estado.salon.libres,
            cerrado: estado.salon.cerradoManual,
          },
          vereda: {
            // capacidad 0 = ese turno no tiene vereda habilitada
            existe: estado.vereda.capacidad > 0,
            disponible: estado.vereda.disponible,
            libres: estado.vereda.libres,
            cerrado: estado.vereda.cerradoManual,
          },
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
