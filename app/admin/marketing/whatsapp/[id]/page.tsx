'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { VistaWhatsapp } from '@/components/admin/EditorPromoWhatsapp';
import { armarTandas, eliminarPromoWhatsapp, obtenerPromoWhatsapp } from '@/app/actions/whatsapp';
import { mensajeWhatsapp } from '@/lib/textoMarketing';

type Detalle = Extract<Awaited<ReturnType<typeof obtenerPromoWhatsapp>>, { success: true }>;

const n = (x: number) => x.toLocaleString('es-AR');

export default function PromoWhatsappPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<Detalle | null>(null);
  const [error, setError] = useState('');
  const [armando, setArmando] = useState(false);

  const cargar = useCallback(async () => {
    const r = await obtenerPromoWhatsapp(id);
    if (r.success) setD(r);
    else setError(r.error);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const armar = async () => {
    if (!d) return;
    const tandas = Math.ceil(d.previstos / d.promo.tamanioTanda);
    if (!confirm(`¿Armar ${n(tandas)} tandas de ${d.promo.tamanioTanda} con los ${n(d.previstos)} clientes? Después vas abriendo una por día.`)) return;
    setArmando(true);
    const r = await armarTandas(id);
    setArmando(false);
    if (!r.success) return setError(r.error);
    await cargar();
  };

  const borrar = async () => {
    if (!confirm('¿Borrar esta promo?')) return;
    const r = await eliminarPromoWhatsapp(id);
    if (!r.success) return setError(r.error);
    router.push('/admin/marketing/whatsapp');
  };

  if (!d) {
    return (
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <main className="container mx-auto px-4 py-10 max-w-5xl">
          {error ? <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div> : <div className="spinner" />}
        </main>
      </div>
    );
  }

  const p = d.promo;
  const foto = p.tieneImagen ? `/api/promo/${p.slug}/imagen?v=${Date.parse(p.updatedAt)}` : null;
  const siguiente = d.tandas.find((t) => t.pendientes > 0);
  const enviados = d.tandas.reduce((a, t) => a + t.enviados, 0);
  const bajas = d.tandas.reduce((a, t) => a + t.bajas, 0);

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
        <Link href="/admin/marketing/whatsapp" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a WhatsApp
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mt-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">{p.nombre}</h1>
            <a href={d.urlPromo} target="_blank" rel="noopener noreferrer" className="text-sm text-esperanza-600 underline break-all">
              Ver la página de la promo
            </a>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/marketing/whatsapp/${id}/editar`} className="btn btn-secondary btn-small">
              Editar
            </Link>
            {enviados === 0 && (
              <button className="btn btn-danger btn-small" onClick={borrar} aria-label="Borrar promo">
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="space-y-5">
            {p.estado === 'borrador' ? (
              <div className="card space-y-3">
                <p className="text-sm text-stone-600">
                  Se va a mandar a <strong>{n(d.previstos)} clientes</strong>, primero los que vinieron hace menos y más
                  veces. Quedan <strong>{n(Math.ceil(d.previstos / p.tamanioTanda))} tandas de {p.tamanioTanda}</strong>: una por día.
                </p>
                <button className="btn btn-primary" onClick={armar} disabled={armando || d.previstos === 0}>
                  <Icon name="folder" size={16} />
                  {armando ? 'Armando…' : 'Armar las tandas'}
                </button>
              </div>
            ) : (
              <>
                <div className="card">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Numero valor={p.destinatarios} etiqueta="Clientes" />
                    <Numero valor={enviados} etiqueta="Enviados" tono="text-green-700" />
                    <Numero valor={bajas} etiqueta="Pidieron baja" tono={bajas ? 'text-red-700' : undefined} />
                  </div>
                  {siguiente ? (
                    <Link href={`/admin/marketing/whatsapp/${id}/tanda/${siguiente.tanda}`} className="btn btn-primary w-full justify-center mt-5">
                      <Icon name="message" size={16} />
                      Abrir tanda {siguiente.tanda} de {d.tandas.length}
                    </Link>
                  ) : (
                    <p className="text-center text-green-700 font-semibold mt-5">¡Terminaste todas las tandas!</p>
                  )}
                </div>

                <div className="card">
                  <p className="font-semibold text-sm mb-3">Tandas</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {d.tandas.map((t) => {
                      const hecha = t.pendientes === 0;
                      const empezada = !hecha && t.pendientes < t.total;
                      return (
                        <Link
                          key={t.tanda}
                          href={`/admin/marketing/whatsapp/${id}/tanda/${t.tanda}`}
                          title={`Tanda ${t.tanda}: ${t.enviados} enviados de ${t.total}`}
                          className={`rounded-lg border text-center py-2 text-sm tabular-nums transition-colors ${
                            hecha
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : empezada
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                              : t.tanda === siguiente?.tanda
                              ? 'border-esperanza-500 text-esperanza-700 font-semibold'
                              : 'bg-white border-esperanza-200 text-stone-500 hover:border-esperanza-400'
                          }`}
                        >
                          {hecha ? '✓ ' : ''}
                          {t.tanda}
                        </Link>
                      );
                    })}
                  </div>
                  <p className="text-xs text-stone-400 mt-3">Verde: terminada · amarillo: empezada.</p>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-600 mb-2">Así le llega a un cliente</p>
            <VistaWhatsapp texto={mensajeWhatsapp(p.mensaje, 'Martín', d.urlPromo)} foto={foto} titulo={p.titulo} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Numero({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono?: string }) {
  return (
    <div className="bg-stone-50 rounded-lg px-2 py-3">
      <p className={`text-2xl font-bold tabular-nums ${tono ?? 'text-stone-800'}`}>{n(valor)}</p>
      <p className="text-[11px] uppercase tracking-wide text-stone-500 mt-0.5">{etiqueta}</p>
    </div>
  );
}
