import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { evaluarSegmento, obtenerClientesConCampos, type NodoFiltro } from '@/lib/segmentos';

// Lista de segmentos guardados con el conteo actual de cada uno, recalculado
// al cargar la página (nunca se persiste una lista fija de IDs).
export async function GET() {
  try {
    const [segmentos, clientesConCampos] = await Promise.all([
      prisma.segment.findMany({ orderBy: { createdAt: 'desc' } }),
      obtenerClientesConCampos(),
    ]);

    const conConteo = segmentos.map((segmento) => ({
      ...segmento,
      conteo: clientesConCampos.filter(({ campos }) =>
        evaluarSegmento(segmento.filtro as unknown as NodoFiltro, campos)
      ).length,
    }));

    return NextResponse.json({ segmentos: conConteo });
  } catch (error) {
    console.error('Error en listado de segmentos:', error);
    return NextResponse.json({ error: 'Error al obtener segmentos' }, { status: 500 });
  }
}
