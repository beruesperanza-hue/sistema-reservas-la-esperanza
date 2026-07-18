import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    // Si no existe, crear con valores por defecto
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          nombreRestaurante: 'La Esperanza',
          emailRestaurante: 'reservas@laesperanza.com',
          telefonoRestaurante: '',
          direccionRestaurante: '',
          capacidadPorTurno: 20,
          diasAvanzados: 60,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data,
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data,
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
