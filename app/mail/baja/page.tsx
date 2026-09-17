import PantallaMail, { BotonMail, VolverAlSitio } from '@/components/mail/PantallaMail';
import { estadoEmailDe, firmaValida } from '@/lib/marketing';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dejar de recibir mails · La Esperanza de los Ascurra',
  robots: 'noindex, nofollow',
};

export default async function BajaPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; t?: string; listo?: string; invalido?: string }>;
}) {
  const { c = '', t = '', listo } = await searchParams;

  if (!firmaValida(c, 'baja', t)) {
    return (
      <PantallaMail icono="🔗" titulo="Este link no es válido">
        <p>Puede que se haya cortado al copiarlo. Probá abrirlo de nuevo desde el mail.</p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  if (listo || (await estadoEmailDe(c)) === 'revocado') {
    return (
      <PantallaMail icono="👋" titulo="Listo, no te escribimos más">
        <p>Te sacamos de la lista de novedades. Vas a seguir recibiendo solo las confirmaciones de tus reservas y pedidos.</p>
        <p>Si te arrepentís, avisanos por WhatsApp y te volvemos a sumar.</p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  return (
    <PantallaMail icono="✉️" titulo="¿Dejás de recibir nuestros mails?">
      <p>No te vamos a mandar más novedades ni promociones. Las confirmaciones de tus reservas y pedidos te siguen llegando.</p>
      <form method="POST" action={`/api/mail/baja?c=${encodeURIComponent(c)}&t=${encodeURIComponent(t)}`} className="pt-2">
        <input type="hidden" name="origen" value="pagina" />
        <BotonMail>Sí, no quiero recibir más mails</BotonMail>
      </form>
      <VolverAlSitio />
    </PantallaMail>
  );
}
