'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Reveal, useParallaxRef, useMagnetic } from '@/lib/motion';
import { CONTACTO } from '@/lib/constants';
import {
  TORTILLAS,
  TAPAS_Y_RACIONES,
  CLASICOS_DE_MAR,
  ARROCES,
  VERMUT_Y_CUBATAS,
  formatearPrecio,
} from '@/lib/carta';

const platoAPrecio = (p: { nombre: string; tapa?: number; racion?: number; precio?: number }) => ({
  nombre: p.nombre.split(':')[0],
  precio: p.tapa ?? p.racion ?? p.precio ?? 0,
});

const MARQUEE_ITEMS = [
  ...TORTILLAS.slice(0, 1).map(platoAPrecio),
  ...TAPAS_Y_RACIONES.slice(0, 4).map(platoAPrecio),
  ...CLASICOS_DE_MAR.map(platoAPrecio),
  ...ARROCES.map(platoAPrecio),
  ...VERMUT_Y_CUBATAS.slice(0, 2).map((it) => ({ nombre: it.nombre.split(':')[0], precio: it.precio })),
];

const DISHES = [
  { tag: 'Desde 2011', nombre: 'Tortilla de papas', desc: 'La que abrió el local. Jugosa, sin termómetro, a ojo de quince años de práctica.', lbl: 'Tapa / Ración', precio: '$13.500 / $19.200' },
  { tag: 'Clásico de mar', nombre: 'Gambas al ajillo', desc: 'Aceite, ajo, guindilla y nada más — la receta que no admite atajos.', lbl: 'Ración', precio: '$30.800' },
  { tag: 'Para compartir', nombre: 'Paella valenciana', desc: 'Pollo, cerdo, chauchas y romero. Se pide para toda la mesa, no para uno.', lbl: 'Fuente', precio: '$41.400' },
  { tag: 'Crocantes', nombre: 'Rabas', desc: 'Rebozadas al momento, con el punto justo de fritura. La ración que nunca sobra.', lbl: 'Tapa / Ración', precio: '$16.200 / $29.700' },
];

function MagneticLink({ href, children, className, target, onClick }: { href: string; children: React.ReactNode; className: string; target?: string; onClick?: () => void }) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      href={href}
      target={target}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`will-change-transform transition-transform duration-300 ${className}`}
    >
      {children}
    </Link>
  );
}

function ParallaxPhoto({ src, alt }: { src: string; alt: string }) {
  const ref = useParallaxRef<HTMLDivElement>();
  return (
    <div className="absolute -inset-y-[10%] inset-x-0 z-0">
      <div ref={ref} className="relative w-full h-[120%] will-change-transform">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover [filter:saturate(.82)_contrast(1.06)_brightness(.5)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-night via-night/45 via-16% to-night" style={{ backgroundImage: 'linear-gradient(180deg, #0e0d0b 0%, rgba(14,13,11,.45) 16%, rgba(14,13,11,.45) 84%, #0e0d0b 100%)' }} />
    </div>
  );
}

export default function HomeClient() {
  return (
    <div className="bg-night text-sand font-body antialiased">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-platos.jpg" alt="Mesa compartida en La Esperanza de los Ascurra" fill priority sizes="100vw" className="object-cover [filter:saturate(.86)_contrast(1.08)_brightness(.62)] scale-[1.06]" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(14,13,11,.55) 0%,rgba(14,13,11,.15) 30%,rgba(14,13,11,.35) 62%,#0e0d0b 96%), linear-gradient(90deg,rgba(14,13,11,.75) 0%,rgba(14,13,11,0) 45%)' }} />
        </div>
        <div className="relative z-[2] px-5 md:px-8 pb-16 md:pb-28 max-w-[1360px] mx-auto w-full">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[.14em] uppercase text-brand-gold mb-4">
            <span className="w-6 h-px bg-brand-gold" />
            Villa Crespo, Buenos Aires — desde 2011
          </div>
          <h1 className="font-display font-extrabold leading-[.88] tracking-[-.02em] text-[3.4rem] sm:text-[5.5rem] lg:text-[8rem] max-w-[16ch] text-balance text-sand">
            Todo se
            <br />
            <span className="text-brand-amber">comparte.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-base sm:text-lg text-sand-dim leading-relaxed">
            Una taberna española con una sola regla: la mesa gira, los platos rotan y nadie come solo. Quince años haciéndolo igual.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-9">
            <MagneticLink href="/reservas" className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-sm bg-sand text-night hover:bg-brand-amber hover:text-night">
              Reservar mesa →
            </MagneticLink>
            <MagneticLink href="#carta" className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-sm border border-white/25 text-sand hover:border-brand-gold hover:text-brand-gold">
              Ver la carta
            </MagneticLink>
          </div>
        </div>
        <div className="hidden sm:flex absolute right-5 md:right-8 bottom-9 z-[2] flex-col items-center gap-2.5 text-sand-dim font-mono text-[11px] tracking-[.12em]">
          <span>SCROLL</span>
          <span className="w-px h-11 bg-gradient-to-b from-brand-gold to-transparent animate-pulse" />
        </div>
      </section>

      {/* Marquee */}
      <div className="relative bg-brand-amber/0 overflow-hidden py-4 border-y border-black/20" style={{ backgroundColor: '#7a5920' }}>
        <div className="flex gap-14 whitespace-nowrap w-max animate-[marquee_34s_linear_infinite] motion-reduce:animate-none hover:[animation-play-state:paused]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-14">
              {MARQUEE_ITEMS.map((it, i) => (
                <span key={`${dup}-${i}`} className="inline-flex items-baseline gap-2.5 font-mono text-sm text-sand">
                  {it.nombre}
                  <span className="text-sand/65">{formatearPrecio(it.precio)}</span>
                  <span className="text-sand/35 mx-1.5">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* La idea */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <ParallaxPhoto src="/idea-comunitaria.jpg" alt="Mesa compartida con amigos en La Esperanza" />
        <div className="relative z-[1] max-w-[1360px] mx-auto px-5 md:px-8">
          <Reveal>
            <span className="font-mono text-[11px] tracking-[.14em] uppercase text-brand-gold block mb-5">La idea</span>
            <p className="font-display font-semibold text-2xl sm:text-4xl lg:text-5xl leading-[1.14] tracking-[-.01em] max-w-[19ch] text-balance">
              En 2011 sentimos que a Buenos Aires le faltaba una verdadera taberna.{' '}
              <span className="text-sand-faint">Creamos una forma distinta de disfrutar la comida: platos al centro de la mesa para compartir. Con el tiempo, esa manera de comer se convirtió en parte de la ciudad.</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-14">
              {[
                ['15', 'Años en Villa Crespo'],
                ['1', 'Mesa comunitaria'],
                ['36', 'Platos y bebidas en carta'],
                ['6', 'Días a la mesa (L–S)'],
              ].map(([n, l]) => (
                <div key={l} className="bg-night px-2 pt-8 pb-6 text-center">
                  <div className="font-display font-bold text-4xl sm:text-5xl">{n}</div>
                  <div className="font-mono text-[11px] tracking-[.08em] uppercase text-sand-faint mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Carta highlight */}
      <section id="carta" className="py-20 md:py-28 max-w-[1360px] mx-auto px-5 md:px-8">
        <Reveal className="flex flex-wrap justify-between items-end gap-6 mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-6xl tracking-[-.015em] text-balance text-sand">
            La especialidad
            <br />
            de la casa.
          </h2>
          <p className="text-sand-dim max-w-[38ch] text-[.95rem]">
            Cuatro platos que no se negocian. El resto de la carta —36 ítems entre tapas, raciones, arroces y vermú— está a un clic.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {DISHES.map((d, i) => (
            <Reveal key={d.nombre} delayMs={i * 80} className="group bg-night hover:bg-night-3 transition-colors relative overflow-hidden px-7 py-8">
              <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-amber origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
              <span className="font-mono text-[10px] tracking-[.1em] uppercase text-brand-gold block mb-4">{d.tag}</span>
              <h3 className="font-display font-semibold text-2xl mb-2.5 text-sand">{d.nombre}</h3>
              <p className="text-sand-dim text-[.86rem] leading-relaxed mb-5 min-h-[2.6em]">{d.desc}</p>
              <div className="flex justify-between items-baseline border-t border-white/10 pt-4 font-mono">
                <span className="text-[10px] text-sand-faint uppercase tracking-wide">{d.lbl}</span>
                <span className="text-base">{d.precio}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <MagneticLink href="/carta" className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-sm border border-white/25 text-sand hover:border-brand-gold hover:text-brand-gold">
            Ver la carta completa →
          </MagneticLink>
        </Reveal>
      </section>

      {/* Historia */}
      <section id="historia" className="py-20 md:py-32">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center">
          <Reveal className="order-first md:order-none">
            <div className="relative aspect-[16/10] md:aspect-[4/5] overflow-hidden border border-white/10">
              <Image src="/historia-compartir.jpg" alt="Compartiendo una tapa en La Esperanza" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover [filter:saturate(.9)_contrast(1.05)]" />
            </div>
          </Reveal>
          <Reveal>
            <span className="font-mono text-[11px] tracking-[.14em] uppercase text-brand-gold block mb-5">Nuestra historia</span>
            <blockquote className="font-display font-semibold text-2xl sm:text-3xl leading-[1.28] tracking-[-.01em] mb-7 text-balance text-sand">
              "Fuimos pioneros en la idea de compartir distintos platos en Buenos Aires."
            </blockquote>
            <p className="text-sand-dim leading-relaxed max-w-[52ch]">
              Nació en 2011 después de varios viajes a Madrid y una pregunta simple: ¿por qué no había una taberna así acá? Quince años y varios barrios después, la mesa sigue girando en Villa Crespo, donde empezó todo.
            </p>
            <a
              href={CONTACTO.INSTAGRAM}
              target="_blank"
              rel="noopener"
              className="mt-7 flex items-center gap-3.5 px-4.5 py-4 border border-white/20 rounded-sm hover:border-brand-gold hover:bg-brand-gold/[.06] transition-colors"
            >
              <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-brand-gold shrink-0">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <b className="block text-[.9rem] font-semibold">@esperanza_ascurra</b>
                <span className="text-[.78rem] text-sand-dim">El día a día de la taberna, en fotos y videos</span>
              </span>
              <span className="font-mono text-brand-gold text-lg shrink-0">→</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* CTA final */}
      <section id="visitanos" className="relative overflow-hidden py-24 md:py-40 bg-night-2 border-y border-white/10 text-center">
        <ParallaxPhoto src="/rabas-limon.jpg" alt="Rabas recién fritas en La Esperanza de los Ascurra" />
        <div className="relative z-[1] max-w-[1360px] mx-auto px-5 md:px-8">
          <span className="font-mono text-[11px] tracking-[.14em] uppercase text-brand-gold block mb-5">Aguirre 526, Villa Crespo</span>
          <Reveal>
            <h2 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-8xl leading-[.96] tracking-[-.02em] max-w-[16ch] mx-auto text-balance text-sand">
              Sentate a
              <br />
              la mesa.
            </h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="text-sand-dim max-w-[48ch] mx-auto mt-6 text-[1.02rem]">
              Lunes a sábado, 19:30 a 23:30. Reservá online en menos de un minuto o escribinos por WhatsApp si preferís hablar con alguien.
            </p>
          </Reveal>
          <Reveal delayMs={160} className="flex flex-wrap justify-center gap-3.5 mt-10">
            <MagneticLink href="/reservas" className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-sm bg-sand text-night hover:bg-brand-amber">
              Reservar mesa →
            </MagneticLink>
            <MagneticLink href={CONTACTO.WHATSAPP_URL} target="_blank" className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-sm border border-white/25 text-sand hover:border-brand-gold hover:text-brand-gold">
              WhatsApp
            </MagneticLink>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
