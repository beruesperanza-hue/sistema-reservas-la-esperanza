import { NextRequest, NextResponse } from 'next/server';
import { firmaValida, registrarDecisionEmail } from '@/lib/marketing';
import { urlPublicaDesde } from '@/lib/urlPublica';

/**
 * Baja de los mails de marketing. Recibe dos tipos de POST:
 *  - el botón "Anular suscripción" de Gmail (List-Unsubscribe-Post, sin página)
 *  - el formulario de /mail/baja, que después vuelve a la página confirmando.
 * No hay GET a propósito: los filtros antivirus abren los links de los mails
 * y darían de baja a la gente sin que lo pida.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('c') ?? '';
  const firma = searchParams.get('t');

  const desdePagina = (await request.clone().formData().catch(() => null))?.get('origen') === 'pagina';

  if (!firmaValida(customerId, 'baja', firma)) {
    return desdePagina
      ? NextResponse.redirect(urlPublicaDesde(request, '/mail/baja?invalido=1'), 303)
      : NextResponse.json({ error: 'Link inválido' }, { status: 400 });
  }

  await registrarDecisionEmail({
    customerId,
    estado: 'revocado',
    fuente: desdePagina ? 'link_baja_mail' : 'boton_baja_gmail',
    metodoObtencion: desdePagina ? 'confirmacion_en_pagina_de_baja' : 'list_unsubscribe_one_click',
  });

  if (!desdePagina) return new NextResponse('ok', { status: 200 });

  const destino = urlPublicaDesde(request, '/mail/baja');
  destino.searchParams.set('c', customerId);
  destino.searchParams.set('t', firma!);
  destino.searchParams.set('listo', '1');
  return NextResponse.redirect(destino, 303);
}
