import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Plantilla semanal recurrente de turnos (día + hora + capacidad de cada
// sector). No confundir con /api/admin/cierres, que bloquea una fecha puntual.
export async function GET() {
  try {
    const horarios = await prisma.schedule.findMany({
      orderBy: [{ hora: 'asc' }],
    });
    return NextResponse.json({ horarios });
  } catch (error) {
    console.error('Error listando horarios:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { dia, hora, capacidad, capacidadVereda } = data;

    if (!dia || !hora) {
      return NextResponse.json({ error: 'dia y hora son requeridos' }, { status: 400 });
    }

    const horario = await prisma.schedule.upsert({
      where: { dia_hora: { dia, hora } },
      update: {
        activo: true,
        ...(capacidad !== undefined && { capacidad }),
        ...(capacidadVereda !== undefined && { capacidadVereda }),
      },
      create: {
        dia,
        hora,
        capacidad: capacidad ?? 20,
        capacidadVereda: capacidadVereda ?? 0,
        activo: true,
      },
    });

    return NextResponse.json({ horario });
  } catch (error) {
    console.error('Error creando horario:', error);
    return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 });
  }
}
