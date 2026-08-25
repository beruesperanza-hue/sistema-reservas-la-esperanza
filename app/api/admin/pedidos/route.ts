import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const ESTADOS_ACTIVOS = ['pagado', 'en_preparacion', 'listo_para_retirar'];

export async function GET(request: NextRequest) {
  try {
    const filtro = request.nextUrl.searchParams.get('filtro') || 'activos';

    const pedidos = await prisma.order.findMany({
      where: filtro === 'activos' ? { estado: { in: ESTADOS_ACTIVOS } } : undefined,
      include: { items: true },
      orderBy: { createdAt: filtro === 'activos' ? 'asc' : 'desc' },
      take: filtro === 'activos' ? undefined : 100,
    });

    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error('Error listando pedidos:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
