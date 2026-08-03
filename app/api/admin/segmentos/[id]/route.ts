import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Detalle de un segmento guardado (para la página de edición).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const segmento = await prisma.segment.findUnique({ where: { id } });
    if (!segmento) {
      return NextResponse.json({ error: 'Segmento no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ segmento });
  } catch (error) {
    console.error('Error obteniendo segmento:', error);
    return NextResponse.json({ error: 'Error al obtener el segmento' }, { status: 500 });
  }
}
