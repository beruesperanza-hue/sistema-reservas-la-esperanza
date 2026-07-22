import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fechaISOaDate } from '@/lib/fechas';

// Cierres puntuales de un turno para una fecha específica (no recurrentes).
// sector = 'adentro' | 'vereda' | null (null = cierra el turno completo).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get('fecha');

    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return NextResponse.json({ error: 'fecha requerida (YYYY-MM-DD)' }, { status: 400 });
    }

    const cierres = await prisma.turnoCierre.findMany({
      where: { fecha: fechaISOaDate(fechaStr) },
      orderBy: { hora: 'asc' },
    });

    return NextResponse.json({ cierres });
  } catch (error) {
    console.error('Error listando cierres:', error);
    return NextResponse.json({ error: 'Error al obtener cierres' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fecha, hora, sector, motivo } = data;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !hora) {
      return NextResponse.json({ error: 'fecha y hora son requeridas' }, { status: 400 });
    }

    const sectorNormalizado = sector === 'adentro' || sector === 'vereda' ? sector : null;

    const cierre = await prisma.turnoCierre.upsert({
      where: {
        fecha_hora_sector: {
          fecha: fechaISOaDate(fecha),
          hora,
          sector: sectorNormalizado,
        },
      },
      update: { motivo: motivo || null },
      create: {
        fecha: fechaISOaDate(fecha),
        hora,
        sector: sectorNormalizado,
        motivo: motivo || null,
      },
    });

    return NextResponse.json({ cierre });
  } catch (error) {
    console.error('Error creando cierre:', error);
    return NextResponse.json({ error: 'Error al cerrar el turno' }, { status: 500 });
  }
}
