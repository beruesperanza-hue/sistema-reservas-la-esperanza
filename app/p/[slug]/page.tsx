import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import prisma from '@/lib/db';
import { CONTACTO } from '@/lib/constants';
import { personalizar } from '@/lib/textoMarketing';
import { urlImagenPromo, urlPromo } from '@/lib/whatsappPromo';

export const dynamic = 'force-dynamic';

async function buscar(slug: string) {
  return prisma.promoWhatsapp.findUnique({
    where: { slug },
    select: { slug: true, titulo: true, mensaje: true, imagenTipo: true, updatedAt: true },
  });
}

/**
 * El mensaje para la página pública: sin el renglón del saludo personalizado
 * ("Hola {nombre}!" no tiene sentido fuera del chat).
 */
function textoPublico(mensaje: string): string {
  const renglones = mensaje.trim().split('\n');
  if (/\{nombre\}/i.test(renglones[0] ?? '')) renglones.shift();
  return personalizar(renglones.join('\n'), '').trim();
}

/** Sin el formato de WhatsApp (*negrita*, _cursiva_), para la descripción del link. */
function sinFormato(texto: string): string {
  return texto.replace(/[*_~]([^*_~\n]+)[*_~]/g, '$1');
}

/** *negrita* de WhatsApp -> <strong> en la página. */
function conNegritas(texto: string) {
  return texto.split(/(\*[^*\n]+\*)/g).map((parte, i) =>
    /^\*[^*\n]+\*$/.test(parte) ? <strong key={i} className="text-sand">{parte.slice(1, -1)}</strong> : parte
  );
}

// Lo importante de esta página son los metadatos: WhatsApp los lee para armar
// la vista previa del link con la foto grande.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const promo = await buscar(slug);
  if (!promo) return { title: 'Promo · La Esperanza de los Ascurra', robots: 'noindex' };

  const descripcion = sinFormato(textoPublico(promo.mensaje)).replace(/\s+/g, ' ').slice(0, 180);
  const imagen = promo.imagenTipo ? urlImagenPromo(promo.slug, promo.updatedAt.getTime()) : undefined;

  return {
    title: `${promo.titulo} · La Esperanza de los Ascurra`,
    description: descripcion,
    robots: 'noindex, nofollow',
    alternates: { canonical: urlPromo(promo.slug) },
    openGraph: {
      type: 'website',
      url: urlPromo(promo.slug),
      title: promo.titulo,
      description: descripcion,
      siteName: 'La Esperanza de los Ascurra',
      ...(imagen ? { images: [{ url: imagen, alt: promo.titulo }] } : {}),
    },
    twitter: {
      card: imagen ? 'summary_large_image' : 'summary',
      title: promo.titulo,
      description: descripcion,
      ...(imagen ? { images: [imagen] } : {}),
    },
  };
}

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const promo = await buscar(slug);
  if (!promo) notFound();

  const whatsapp = `${CONTACTO.WHATSAPP_URL}?text=${encodeURIComponent(`Hola! Vi la promo "${promo.titulo}" y quiero reservar.`)}`;

  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />
      <main className="flex-1 pt-28 pb-20 md:pt-36">
        <article className="mx-auto px-5 max-w-xl">
          {promo.imagenTipo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlImagenPromo(promo.slug, promo.updatedAt.getTime())}
              alt={promo.titulo}
              className="w-full rounded-sm border border-white/10 mb-8"
            />
          )}
          <h1 className="font-display font-bold text-3xl md:text-4xl text-sand mb-5 leading-tight">{promo.titulo}</h1>
          <div className="text-sand-dim text-[16px] leading-relaxed whitespace-pre-line mb-10">
            {conNegritas(textoPublico(promo.mensaje))}
          </div>

          <div className="grid gap-3">
            <Link
              href="/reservas"
              className="inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
            >
              Reservá tu mesa
            </Link>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-semibold text-sm px-8 py-4 rounded-sm border border-white/20 text-sand hover:bg-white/5 transition-colors"
            >
              Escribinos por WhatsApp
            </a>
            <Link href="/carta" className="text-center text-sm text-sand-faint underline hover:text-sand mt-2">
              Ver la carta
            </Link>
          </div>
          <p className="text-xs text-sand-faint mt-10 text-center">{CONTACTO.DIRECCION}</p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
