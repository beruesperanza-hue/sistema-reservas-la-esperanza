import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { SITE_URL } from '@/lib/site';
import {
  TORTILLAS,
  TAPAS_Y_RACIONES,
  CLASICOS_DE_MAR,
  ARROCES,
  POSTRES,
  HORA_DEL_VERMUT,
  DE_GRIFO,
  VERMUT_Y_CUBATAS,
  SIN_ALCOHOL,
  VINITOS,
  ESPE_COMBOS,
  RECETA_DEL_MES,
  formatearPrecio,
  type Plato,
  type ItemBebida,
} from '@/lib/carta';

export const metadata: Metadata = {
  title: 'Carta y precios — Tapas, paellas y vermut | La Esperanza',
  description:
    'La carta de La Esperanza de los Ascurra: tortillas, tapas y raciones, clásicos de mar, paellas, postres y vermut de grifo. Villa Crespo, Buenos Aires.',
  keywords: 'carta la esperanza de los ascurra, menu tapas españolas, precios tortilla española buenos aires, paella buenos aires precio, vermut villa crespo',
  alternates: { canonical: '/carta' },
};

function PlatoConTapaYRacion({ plato }: { plato: Plato }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-esperanza-100 last:border-0">
      <div className="flex-1">
        <span className="font-body text-gray-800">
          {plato.nombre}
          {plato.nueva && (
            <span className="ml-2 align-middle text-[10px] font-sans font-bold uppercase tracking-wide text-accent-gold border border-accent-gold rounded-full px-2 py-0.5">
              Nueva
            </span>
          )}
        </span>
      </div>
      <div className="flex gap-6 text-sm font-semibold text-esperanza-700 flex-shrink-0 tabular-nums">
        <span className="w-16 text-right">{plato.tapa ? formatearPrecio(plato.tapa) : '—'}</span>
        <span className="w-16 text-right">{plato.racion ? formatearPrecio(plato.racion) : '—'}</span>
      </div>
    </div>
  );
}

function SeccionTapaRacion({ titulo, subtitulo, platos }: { titulo: string; subtitulo?: string; platos: Plato[] }) {
  return (
    <div className="mb-14">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl">{titulo}</h2>
        {subtitulo && <p className="text-sm italic text-esperanza-400 font-body">{subtitulo}</p>}
      </div>
      <div className="flex justify-end gap-6 text-xs uppercase tracking-wide text-esperanza-400 font-sans mb-1 pr-0">
        <span className="w-16 text-right">Tapa</span>
        <span className="w-16 text-right">Ración</span>
      </div>
      <div>
        {platos.map((p) => (
          <PlatoConTapaYRacion key={p.nombre} plato={p} />
        ))}
      </div>
    </div>
  );
}

function SeccionPrecioUnico({ titulo, subtitulo, platos }: { titulo: string; subtitulo?: string; platos: Plato[] }) {
  return (
    <div className="mb-14">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl">{titulo}</h2>
        {subtitulo && <p className="text-sm italic text-esperanza-400 font-body">{subtitulo}</p>}
      </div>
      <div>
        {platos.map((p) => (
          <div key={p.nombre} className="flex items-baseline justify-between gap-4 py-3 border-b border-esperanza-100 last:border-0">
            <span className="font-body text-gray-800 flex-1">{p.nombre}</span>
            <span className="text-sm font-semibold text-esperanza-700 tabular-nums flex-shrink-0">
              {p.precio ? formatearPrecio(p.precio) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListaBebidas({ titulo, items }: { titulo: string; items: ItemBebida[] }) {
  return (
    <div>
      <h3 className="text-lg font-serif font-bold text-esperanza-700 mb-3">{titulo}</h3>
      {items.map((it) => (
        <div key={it.nombre} className="flex items-baseline justify-between gap-4 py-2 border-b border-esperanza-100 last:border-0 text-sm">
          <span className="font-body text-gray-700 flex-1">{it.nombre}</span>
          <span className="font-semibold text-esperanza-700 tabular-nums flex-shrink-0">{formatearPrecio(it.precio)}</span>
        </div>
      ))}
    </div>
  );
}

export default function CartaPage() {
  const menuSchema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Carta — La Esperanza de los Ascurra',
    url: `${SITE_URL}/carta`,
    inLanguage: 'es-AR',
    hasMenuSection: [
      { titulo: 'Nuestras Tortillas', platos: TORTILLAS },
      { titulo: 'Tapas y Raciones', platos: TAPAS_Y_RACIONES },
      { titulo: 'Nuestros Clásicos de Mar', platos: CLASICOS_DE_MAR },
      { titulo: 'Arroces del Mes', platos: ARROCES },
      { titulo: 'Postres', platos: POSTRES },
    ].map((s) => ({
      '@type': 'MenuSection',
      name: s.titulo,
      hasMenuItem: s.platos.map((p) => ({
        '@type': 'MenuItem',
        name: p.nombre,
        offers: [
          p.tapa && { '@type': 'Offer', name: 'Tapa', price: p.tapa, priceCurrency: 'ARS' },
          p.racion && { '@type': 'Offer', name: 'Ración', price: p.racion, priceCurrency: 'ARS' },
          p.precio && { '@type': 'Offer', price: p.precio, priceCurrency: 'ARS' },
        ].filter(Boolean),
      })),
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />

      {/* Hero */}
      <section className="bg-esperanza-700 py-16 text-center text-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <span className="text-4xl">★</span>
          <h1 className="mt-3 text-5xl md:text-6xl">Nuestra Carta</h1>
          <p className="mt-3 text-lg italic font-body text-esperanza-200">
            Menú Aniversario · 15 años en Villa Crespo, Buenos Aires
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 max-w-3xl py-14">
        <SeccionTapaRacion
          titulo="★ Nuestras Tortillas"
          subtitulo="La especialidad de la casa"
          platos={TORTILLAS}
        />
        <SeccionTapaRacion titulo="Tapas y Raciones" platos={TAPAS_Y_RACIONES} />
        <SeccionTapaRacion titulo="Nuestros Clásicos de Mar" platos={CLASICOS_DE_MAR} />
        <SeccionPrecioUnico titulo="Arroces del Mes" subtitulo="Para compartir" platos={ARROCES} />
        <SeccionPrecioUnico titulo="Postres" platos={POSTRES} />

        {/* Bebidas & Combos */}
        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl mb-1">Bebidas &amp; Combos</h2>

          <div className="bg-esperanza-50 border-l-4 border-accent-gold rounded-lg p-5 my-5">
            <h3 className="text-lg font-serif font-bold text-esperanza-700 mb-1">
              🍷 Hora del Vermut <span className="text-sm font-body italic font-normal text-esperanza-400">— 19 a 20:30</span>
            </h3>
            {HORA_DEL_VERMUT.map((it) => (
              <div key={it.nombre} className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
                <span className="font-body text-gray-700 flex-1">{it.nombre}</span>
                <span className="font-semibold text-esperanza-700 tabular-nums flex-shrink-0">{formatearPrecio(it.precio)}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 mt-6">
            <ListaBebidas titulo="De Grifo" items={DE_GRIFO} />
            <ListaBebidas titulo="Vinitos" items={VINITOS} />
            <ListaBebidas titulo="Vermut y Cubatas" items={VERMUT_Y_CUBATAS} />
            <ListaBebidas titulo="Sin Alcohol" items={SIN_ALCOHOL} />
          </div>
        </div>

        {/* Espe Combos */}
        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl mb-1">Espe Combos</h2>
          <p className="text-sm italic text-esperanza-400 font-body mb-5">
            Comen 2, pican 4 — combos de 5 tapas para compartir, con 10% de descuento sobre el precio suelto
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {ESPE_COMBOS.map((c) => (
              <div key={c.nombre} className="card">
                <h3 className="text-xl font-serif font-bold italic text-esperanza-700 mb-2">{c.nombre}</h3>
                <p className="text-sm font-body text-gray-600 mb-4">{c.incluye}</p>
                <p className="text-lg font-bold text-esperanza-700">
                  {formatearPrecio(c.precio)}{' '}
                  <span className="text-xs font-normal text-gray-400">
                    (suelto {formatearPrecio(c.precioSuelto)})
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Receta del mes */}
        <div className="bg-esperanza-50 rounded-lg p-6 text-center mb-14">
          <p className="text-xs uppercase tracking-wide text-esperanza-400 font-sans mb-1">Receta del mes</p>
          <p className="text-2xl font-serif italic text-esperanza-700">{RECETA_DEL_MES}</p>
        </div>

        <p className="text-center text-sm text-gray-500 font-body mb-10">
          Precios en pesos argentinos. Consultá por opciones sin gluten.
        </p>

        <div className="text-center">
          <Link href="/reservas" className="btn btn-primary px-10 py-4 text-lg">
            📅 Reservá tu mesa
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
