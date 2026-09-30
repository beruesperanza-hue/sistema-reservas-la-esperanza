import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// La foto de la promo. Vive bajo /p/ y NO bajo /api/ a propósito: el robots.txt
// del sitio tiene "Disallow: /api", y el robot de WhatsApp lo respeta — si la
// foto cuelga de /api, la vista previa del link sale sin imagen.
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
      'Content-Length': String(promo.imagen.length),
      // La URL cambia (?v=) cuando se cambia la foto, así que puede cachearse.
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
