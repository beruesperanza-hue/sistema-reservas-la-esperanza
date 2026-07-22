import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.turnoCierre.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cierre:', error);
    return NextResponse.json({ error: 'Error al reabrir el turno' }, { status: 500 });
  }
}
