import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { SITE_URL } from '@/lib/site';
import { Reveal } from '@/lib/motion';
import { obtenerItemsInactivos, estaActivo } from '@/lib/menuDisponibilidad';
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

// La disponibilidad se consulta en cada visita (no en build) para que
// activar/desactivar un ítem desde el admin se vea al instante, sin deploy.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Carta y precios — Tapas, paellas y vermut | La Esperanza',
  description:
    'La carta de La Esperanza de los Ascurra: tortillas, tapas y raciones, clásicos de mar, paellas, postres y vermut de grifo. Villa Crespo, Buenos Aires.',
  keywords: 'carta la esperanza de los ascurra, menu tapas españolas, precios tortilla española buenos aires, paella buenos aires precio, vermut villa crespo',
  alternates: { canonical: '/carta' },
};

function PlatoConTapaYRacion({ plato }: { plato: Plato }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5 border-b border-white/10 last:border-0">
      <span className="text-sand/90">
        {plato.nombre}
        {plato.nueva && (
          <span className="ml-2 align-middle text-[10px] font-mono font-semibold uppercase tracking-wide text-brand-amber border border-brand-amber/50 rounded-full px-2 py-0.5">
            Nueva
          </span>
        )}
      </span>
      <span className="flex gap-6 text-sm font-mono text-sand flex-shrink-0 tabular-nums">
        <span className="w-16 text-right">{plato.tapa ? formatearPrecio(plato.tapa) : '—'}</span>
        <span className="w-16 text-right">{plato.racion ? formatearPrecio(plato.racion) : '—'}</span>
      </span>
    </div>
  );
}

function SeccionTapaRacion({ titulo, subtitulo, platos }: { titulo: string; subtitulo?: string; platos: Plato[] }) {
  return (
    <Reveal className="mb-16">
      <div className="mb-4">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-sand">{titulo}</h2>
        {subtitulo && <p className="text-sm text-sand-dim mt-1">{subtitulo}</p>}
      </div>
      <div className="flex justify-end gap-6 text-[10px] uppercase tracking-widest font-mono text-sand-faint mb-1">
        <span className="w-16 text-right">Tapa</span>
        <span className="w-16 text-right">Ración</span>
      </div>
      <div>
        {platos.map((p) => (
          <PlatoConTapaYRacion key={p.nombre} plato={p} />
        ))}
      </div>
    </Reveal>
  );
}

function SeccionPrecioUnico({ titulo, subtitulo, platos }: { titulo: string; subtitulo?: string; platos: Plato[] }) {
  return (
    <Reveal className="mb-16">
      <div className="mb-4">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-sand">{titulo}</h2>
        {subtitulo && <p className="text-sm text-sand-dim mt-1">{subtitulo}</p>}
      </div>
      <div>
        {platos.map((p) => (
          <div key={p.nombre} className="flex items-baseline justify-between gap-4 py-3.5 border-b border-white/10 last:border-0">
            <span className="text-sand/90 flex-1">{p.nombre}</span>
            <span className="font-mono text-sand tabular-nums flex-shrink-0">
              {p.precio ? formatearPrecio(p.precio) : '—'}
            </span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function ListaBebidas({ titulo, items }: { titulo: string; items: ItemBebida[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-display font-semibold text-lg text-sand mb-3">{titulo}</h3>
      {items.map((it) => (
        <div key={it.nombre} className="flex items-baseline justify-between gap-4 py-2 border-b border-white/10 last:border-0 text-sm">
          <span className="text-sand-dim flex-1">{it.nombre}</span>
          <span className="font-mono text-sand tabular-nums flex-shrink-0">{formatearPrecio(it.precio)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function CartaPage() {
  const inactivos = await obtenerItemsInactivos();
  function activos<T extends { nombre: string }>(seccion: string, items: T[]): T[] {
    return items.filter((it) => estaActivo(inactivos, seccion, it.nombre));
  }

  const tortillas = activos('tortillas', TORTILLAS);
  const tapasRaciones = activos('tapas_raciones', TAPAS_Y_RACIONES);
  const clasicosMar = activos('clasicos_mar', CLASICOS_DE_MAR);
  const arroces = activos('arroces', ARROCES);
  const postres = activos('postres', POSTRES);
  const horaVermut = activos('hora_vermut', HORA_DEL_VERMUT);
  const deGrifo = activos('de_grifo', DE_GRIFO);
  const vermutCubatas = activos('vermut_cubatas', VERMUT_Y_CUBATAS);
  const sinAlcohol = activos('sin_alcohol', SIN_ALCOHOL);
  const vinitos = activos('vinitos', VINITOS);
  const espeCombos = activos('espe_combos', ESPE_COMBOS);

  const menuSchema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Carta — La Esperanza de los Ascurra',
    url: `${SITE_URL}/carta`,
    inLanguage: 'es-AR',
    hasMenuSection: [
      { titulo: 'Nuestras Tortillas', platos: tortillas },
      { titulo: 'Tapas y Raciones', platos: tapasRaciones },
      { titulo: 'Nuestros Clásicos de Mar', platos: clasicosMar },
      { titulo: 'Arroces del Mes', platos: arroces },
      { titulo: 'Postres', platos: postres },
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
    <div className="min-h-screen bg-night text-sand font-body">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />

      {/* Hero */}
      <section className="pt-36 pb-16 md:pt-44 md:pb-20 text-center border-b border-white/10">
        <div className="mx-auto px-5 max-w-3xl">
          <svg viewBox="0 0 24 24" className="w-7 h-7 mx-auto mb-4" fill="#c9a961">
            <path d="M12 1 14.5 8.6 22.5 8.6 16 13.3 18.5 20.9 12 16.2 5.5 20.9 8 13.3 1.5 8.6 9.5 8.6Z" />
          </svg>
          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-[-.02em] text-sand">Nuestra Carta</h1>
          <p className="mt-4 text-brand-gold font-mono text-sm tracking-wide">
            Menú Aniversario · 15 años en Villa Crespo, Buenos Aires
          </p>
        </div>
      </section>

      <main className="mx-auto px-5 max-w-2xl py-16 md:py-20">
        {tortillas.length > 0 && (
          <SeccionTapaRacion
            titulo="★ Nuestras Tortillas"
            subtitulo="La especialidad de la casa"
            platos={tortillas}
          />
        )}
        {tapasRaciones.length > 0 && <SeccionTapaRacion titulo="Tapas y Raciones" platos={tapasRaciones} />}
        {clasicosMar.length > 0 && <SeccionTapaRacion titulo="Nuestros Clásicos de Mar" platos={clasicosMar} />}
        {arroces.length > 0 && (
          <SeccionPrecioUnico titulo="Arroces del Mes" subtitulo="Para compartir · Se preparan al momento, demora 30/35 minutos" platos={arroces} />
        )}
        {postres.length > 0 && <SeccionPrecioUnico titulo="Postres" platos={postres} />}

        {/* Bebidas & Combos */}
        <Reveal className="mb-16">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-sand mb-1">Bebidas &amp; Combos</h2>

          {horaVermut.length > 0 && (
            <div className="border border-brand-gold/30 bg-brand-gold/[.05] rounded-sm p-5 my-5">
              <h3 className="font-display font-semibold text-lg text-sand mb-1">
                🍷 Hora del Vermut <span className="text-sm font-body font-normal text-sand-dim">— 19 a 20:30</span>
              </h3>
              {horaVermut.map((it) => (
                <div key={it.nombre} className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
                  <span className="text-sand-dim flex-1">{it.nombre}</span>
                  <span className="font-mono text-sand tabular-nums flex-shrink-0">{formatearPrecio(it.precio)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 mt-6">
            <ListaBebidas titulo="De Grifo" items={deGrifo} />
            <ListaBebidas titulo="Vinitos" items={vinitos} />
            <ListaBebidas titulo="Vermut y Cubatas" items={vermutCubatas} />
            <ListaBebidas titulo="Sin Alcohol" items={sinAlcohol} />
          </div>
        </Reveal>

        {/* Espe Combos */}
        {espeCombos.length > 0 && (
          <Reveal className="mb-16">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-sand mb-1">Espe Combos</h2>
            <p className="text-sm text-sand-dim mb-5">
              Comen 2, pican 4 — combos de 5 tapas para compartir, con 10% de descuento sobre el precio suelto
            </p>
            <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
              {espeCombos.map((c) => (
                <div key={c.nombre} className="bg-night p-6">
                  <h3 className="font-display font-semibold text-xl text-sand mb-2">
                    {c.nombre}
                    {c.vegetariano && (
                      <span className="ml-2 align-middle text-[10px] font-mono font-semibold uppercase tracking-wide text-brand-amber border border-brand-amber/50 rounded-full px-2 py-0.5">
                        Vegetariano
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-sand-dim mb-4">{c.incluye}</p>
                  <p className="font-mono text-lg text-sand">
                    {formatearPrecio(c.precio)}{' '}
                    <span className="text-xs text-sand-faint">
                      (suelto {formatearPrecio(c.precioSuelto)})
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Receta del mes */}
        <Reveal className="bg-night-2 border border-white/10 rounded-sm p-6 text-center mb-16">
          <p className="text-[11px] uppercase tracking-widest font-mono text-brand-gold mb-2">Receta del mes</p>
          <p className="font-display font-semibold text-2xl text-sand">{RECETA_DEL_MES}</p>
        </Reveal>

        <p className="text-center text-sm text-sand-faint mb-10">
          Precios en pesos argentinos. Consultá por opciones sin gluten.
        </p>

        <div className="text-center">
          <Link
            href="/reservas"
            className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3.5 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
          >
            Reservá tu mesa →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
