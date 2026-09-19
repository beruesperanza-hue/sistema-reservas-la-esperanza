import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// La foto de la promo. La pide la página /p/<slug> y, sobre todo, WhatsApp
// cuando arma la vista previa del link.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const promo = await prisma.promoWhatsapp.findUnique({
    where: { slug },
    select: { imagen: true, imagenTipo: true },
  });

  if (!promo?.imagen || !promo.imagenTipo) {
    return new NextResponse('Sin imagen', { status: 404 });
  }

  return new NextResponse(new Uint8Array(promo.imagen), {
    headers: {
      'Content-Type': promo.imagenTipo,
      // La URL cambia (?v=) cuando se cambia la foto, así que puede cachearse.
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
