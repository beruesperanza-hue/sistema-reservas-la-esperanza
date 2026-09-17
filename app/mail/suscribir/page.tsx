import PantallaMail, { BotonMail, VolverAlSitio } from '@/components/mail/PantallaMail';
import { estadoEmailDe, firmaValida } from '@/lib/marketing';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Recibir novedades · La Esperanza de los Ascurra',
  robots: 'noindex, nofollow',
};

export default async function SuscribirPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; t?: string; k?: string; listo?: string; invalido?: string }>;
}) {
  const { c = '', t = '', k = '', listo } = await searchParams;

  if (!firmaValida(c, 'suscribir', t)) {
    return (
      <PantallaMail icono="🔗" titulo="Este link no es válido">
        <p>Puede que se haya cortado al copiarlo. Probá abrirlo de nuevo desde el mail.</p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  const estado = await estadoEmailDe(c);

  if (listo || estado === 'autorizado') {
    return (
      <PantallaMail icono="🍷" titulo="¡Gracias! Ya estás en la lista">
        <p>Te vamos a escribir cada tanto con platos nuevos, eventos y alguna promo para los que ya nos conocen.</p>
        <p>Cada mail trae un link para darte de baja cuando quieras.</p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  const params = new URLSearchParams({ c, t, ...(k ? { k } : {}) });

  return (
    <PantallaMail icono="✉️" titulo="¿Querés recibir novedades de La Esperanza?">
      <p>Platos nuevos, eventos y alguna promo para los que ya nos conocen. Pocos mails, y te das de baja cuando quieras.</p>
      {estado === 'revocado' && (
        <p className="text-sand-faint text-sm">Antes te habías dado de baja. Si confirmás, te volvemos a sumar.</p>
      )}
      <form method="POST" action={`/api/mail/suscribir?${params.toString()}`} className="pt-2">
        <BotonMail>Sí, quiero recibir novedades</BotonMail>
      </form>
      <VolverAlSitio />
    </PantallaMail>
  );
}
