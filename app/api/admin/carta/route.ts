import { NextResponse } from 'next/server';
import { obtenerItemsInactivos } from '@/lib/menuDisponibilidad';

export async function GET() {
  try {
    const inactivos = await obtenerItemsInactivos();
    return NextResponse.json({ inactivos: Array.from(inactivos) });
  } catch (error) {
    console.error('Error obteniendo estado de la carta:', error);
    return NextResponse.json({ error: 'Error al obtener el estado de la carta' }, { status: 500 });
  }
}
