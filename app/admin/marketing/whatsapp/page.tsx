'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { listarPromosWhatsapp } from '@/app/actions/whatsapp';

type Lista = Extract<Awaited<ReturnType<typeof listarPromosWhatsapp>>, { success: true }>;

const n = (x: number) => x.toLocaleString('es-AR');

export default function PromosWhatsappPage() {
  const [lista, setLista] = useState<Lista | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listarPromosWhatsapp().then((r) => (r.success ? setLista(r) : setError(r.error)));
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        <Link href="/admin/marketing" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a marketing
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3 mt-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Promos por WhatsApp</h1>
            <p className="text-stone-500 text-sm mt-1">
              Mensaje con foto, cliente por cliente, en tandas de {lista ? n(lista.tamanioTanda) : '50'} por día.
            </p>
          </div>
          <Link href="/admin/marketing/whatsapp/nueva" className="btn btn-primary">
            <Icon name="plus" size={16} strokeWidth={2.2} />
            Nueva promo
          </Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

        {!lista ? (
          !error && <div className="spinner" />
        ) : (
          <>
            <div className="card mb-6 border-esperanza-300 bg-esperanza-50/60 text-sm text-stone-700 space-y-2 leading-relaxed">
              <p>
                <strong>{n(lista.disponibles)} clientes</strong> tienen un teléfono válido y no pidieron la baja. En tandas de{' '}
                {lista.tamanioTanda} son <strong>{n(Math.ceil(lista.disponibles / lista.tamanioTanda))} días</strong> de envíos.
              </p>
              <p className="text-stone-500">
                Ninguno pidió recibir WhatsApp de promos: si varios reportan el número como spam, WhatsApp lo puede
                bloquear. Las tandas chicas y el “respondé BAJA” bajan ese riesgo. Conviene usar un número que no sea el
                de reservas.
              </p>
            </div>

            {lista.promos.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
                <p className="text-stone-500">Todavía no hay promos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lista.promos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/marketing/whatsapp/${p.id}`}
                    className="card !p-4 md:!p-5 flex items-center justify-between gap-4 flex-wrap hover:border-esperanza-400 transition-colors"
                  >
                    <div className="min-w-0">
                      <span
                        className={`badge ${p.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}
                      >
                        {p.estado === 'activa' ? 'En tandas' : 'Borrador'}
                      </span>
                      <p className="font-bold mt-1.5 truncate">{p.nombre}</p>
                      <p className="text-sm text-stone-500 truncate">{p.titulo}</p>
                    </div>
                    <div className="text-right text-sm">
                      {p.estado === 'activa' ? (
                        <>
                          <p className="font-semibold tabular-nums">
                            {n(p.enviados)} <span className="text-stone-400 font-normal">/ {n(p.destinatarios)}</span>
                          </p>
                          <p className="text-xs text-stone-400">enviados</p>
                        </>
                      ) : (
                        <p className="text-stone-400">Sin empezar</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
