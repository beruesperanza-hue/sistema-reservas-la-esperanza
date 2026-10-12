import Link from 'next/link';
import { redirect } from 'next/navigation';
import PantallaMail, { BotonMail, VolverAlSitio } from '@/components/mail/PantallaMail';
import { cancelarReservaDesdeLink, reservaDeLinkCancelacion } from '@/app/actions/reservations';
import { CONTACTO, UBICACIONES_LABEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cancelar tu reserva · La Esperanza de los Ascurra',
  robots: 'noindex, nofollow',
};

const WHATSAPP = `${CONTACTO.WHATSAPP_URL}?text=${encodeURIComponent(
  'Hola! Quería cambiar el horario de mi reserva en La Esperanza.'
)}`;

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/10 last:border-0">
      <span className="text-sm text-sand-faint">{label}</span>
      <span className="text-sand font-semibold">{valor}</span>
    </div>
  );
}

export default async function CancelarReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; t?: string; listo?: string }>;
}) {
  const { r = '', t = '', listo } = await searchParams;

  if (listo) {
    return (
      <PantallaMail icono="✓" titulo="Listo, cancelamos tu reserva">
        <p>Te mandamos el mail con la confirmación de la cancelación. La mesa ya quedó liberada.</p>
        <p>Cuando quieras volver, te esperamos.</p>
        <Link
          href="/reservas"
          className="inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
        >
          Reservar otro día
        </Link>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  const resultado = await reservaDeLinkCancelacion(r, t);

  if (!resultado.ok && resultado.motivo === 'link_invalido') {
    return (
      <PantallaMail icono="🔗" titulo="Este link no es válido">
        <p>Puede que se haya cortado al copiarlo. Probá abrirlo de nuevo desde el mail de tu reserva.</p>
        <p>
          Si no lo encontrás, escribinos por{' '}
          <a href={WHATSAPP} className="underline text-sand" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>{' '}
          y la cancelamos nosotros.
        </p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  if (!resultado.ok && resultado.motivo === 'no_encontrada') {
    return (
      <PantallaMail icono="🔍" titulo="No encontramos esa reserva">
        <p>Puede que ya la hayamos dado de baja. Si tenés dudas, escribinos por WhatsApp.</p>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  if (!resultado.ok && resultado.motivo === 'ya_cancelada') {
    return (
      <PantallaMail icono="✓" titulo="Esta reserva ya estaba cancelada">
        <p>No hace falta que hagas nada más.</p>
        <Link
          href="/reservas"
          className="inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
        >
          Reservar otro día
        </Link>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  if (!resultado.ok) {
    return (
      <PantallaMail icono="🕐" titulo="Ese turno ya pasó">
        <p>Esta reserva era para un horario que ya pasó, así que no hay nada que cancelar.</p>
        <Link
          href="/reservas"
          className="inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
        >
          Reservar otro día
        </Link>
        <VolverAlSitio />
      </PantallaMail>
    );
  }

  const { datos } = resultado;

  async function cancelar() {
    'use server';
    const res = await cancelarReservaDesdeLink(r, t);
    redirect(res.success ? `/reservas/cancelar?listo=1` : `/reservas/cancelar?r=${r}&t=${t}`);
  }

  return (
    <PantallaMail icono="🪑" titulo="¿Cancelamos tu reserva?">
      <p>
        Hola {datos.nombre}, esta es la reserva que vas a cancelar. Si solo querés cambiar el horario, mejor
        escribinos por{' '}
        <a href={WHATSAPP} className="underline text-sand" target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        .
      </p>

      <div className="text-left border border-white/10 rounded-sm px-5 py-2 bg-night">
        <Dato label="Fecha" valor={datos.fecha} />
        <Dato label="Hora" valor={datos.hora} />
        <Dato label="Personas" valor={String(datos.personas)} />
        <Dato label="Mesa" valor={UBICACIONES_LABEL[datos.ubicacion] || datos.ubicacion} />
      </div>

      <form action={cancelar}>
        <BotonMail>Sí, cancelar mi reserva</BotonMail>
      </form>

      <VolverAlSitio />
    </PantallaMail>
  );
}
