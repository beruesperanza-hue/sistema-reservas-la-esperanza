import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { dateAFechaISO } from '@/lib/fechas';
import {
  CUSTOMER_INCLUDE_PARA_SEGMENTOS,
  calcularCamposCliente,
  type ClienteConRelaciones,
} from '@/lib/segmentos';

// Ficha de un cliente: datos, actividad (reservas del sistema + histórico
// importado, diferenciadas), y estado/historial de consentimiento por canal.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cliente = (await prisma.customer.findUnique({
      where: { id },
      include: {
        ...CUSTOMER_INCLUDE_PARA_SEGMENTOS,
        consentimientos: { orderBy: { createdAt: 'desc' } },
        reservas: { orderBy: { fecha: 'desc' } },
      },
    })) as ClienteConRelaciones | null;

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const campos = calcularCamposCliente(cliente);

    return NextResponse.json({
      cliente: {
        ...cliente,
        reservas: cliente.reservas.map((r) => ({ ...r, fecha: dateAFechaISO(r.fecha) })),
      },
      campos,
    });
  } catch (error) {
    console.error('Error obteniendo ficha de cliente:', error);
    return NextResponse.json({ error: 'Error al obtener el cliente' }, { status: 500 });
  }
}
