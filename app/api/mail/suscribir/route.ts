import { NextRequest, NextResponse } from 'next/server';
import { firmaValida, registrarDecisionEmail } from '@/lib/marketing';
import { urlPublicaDesde } from '@/lib/urlPublica';

/**
 * Suscripción desde el mail de invitación. Solo POST (desde el botón de la
 * página), así el consentimiento queda como una acción explícita del cliente
 * y no como un link abierto por un antivirus.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('c') ?? '';
  const firma = searchParams.get('t');
  const campaniaId = searchParams.get('k');

  if (!firmaValida(customerId, 'suscribir', firma)) {
    return NextResponse.redirect(urlPublicaDesde(request, '/mail/suscribir?invalido=1'), 303);
  }

  await registrarDecisionEmail({
    customerId,
    estado: 'autorizado',
    fuente: 'invitacion_mail',
    metodoObtencion: 'boton_confirmacion_desde_mail_de_invitacion',
    evidencia: campaniaId ? `campania:${campaniaId}` : null,
  });

  const destino = urlPublicaDesde(request, '/mail/suscribir');
  destino.searchParams.set('c', customerId);
  destino.searchParams.set('t', firma!);
  if (campaniaId) destino.searchParams.set('k', campaniaId);
  destino.searchParams.set('listo', '1');
  return NextResponse.redirect(destino, 303);
}
