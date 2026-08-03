import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { fechaISOaDate, hoyEnBA } from '@/lib/fechas';
import { ESTADOS_RESERVA } from '@/lib/constants';

// Listado paginado de clientes — primera paginación real del proyecto,
// necesaria porque la base de clientes puede ser grande (miles de filas).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 25));
    const q = searchParams.get('q')?.trim();
    const origen = searchParams.get('origen')?.trim();
    const vip = searchParams.get('vip');
    const tieneProximaReserva = searchParams.get('tieneProximaReserva');

    const where: Prisma.CustomerWhereInput = {};
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q } },
      ];
    }
    if (origen) where.origen = origen;
    if (vip === '1') where.vip = true;
    if (tieneProximaReserva === '1') {
      where.reservas = {
        some: { estado: { not: ESTADOS_RESERVA.CANCELADA }, fecha: { gte: fechaISOaDate(hoyEnBA()) } },
      };
    }

    const [total, clientes] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { reservas: { select: { estado: true, fecha: true } } },
      }),
    ]);

    const hoy = fechaISOaDate(hoyEnBA());
    const filas = clientes.map(({ reservas, ...cliente }) => {
      const activas = reservas.filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA);
      const visitasTotales = cliente.visitasHistoricas + activas.length;
      const fechas = [
        ...activas.map((r) => r.fecha),
        ...(cliente.ultimaVisitaHistorica ? [cliente.ultimaVisitaHistorica] : []),
      ];
      const ultimaVisita =
        fechas.length > 0 ? new Date(Math.max(...fechas.map((f) => f.getTime()))) : null;
      const tieneProximaReserva = activas.some((r) => r.fecha.getTime() >= hoy.getTime());

      return { ...cliente, visitasTotales, ultimaVisita, tieneProximaReserva };
    });

    return NextResponse.json({ clientes: filas, total, page, pageSize });
  } catch (error) {
    console.error('Error en listado de clientes:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}
