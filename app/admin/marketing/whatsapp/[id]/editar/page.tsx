'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import EditorPromoWhatsapp from '@/components/admin/EditorPromoWhatsapp';
import { obtenerPromoWhatsapp } from '@/app/actions/whatsapp';

type Detalle = Extract<Awaited<ReturnType<typeof obtenerPromoWhatsapp>>, { success: true }>;

export default function EditarPromoWhatsappPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detalle | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPromoWhatsapp(id).then((r) => (r.success ? setD(r) : setError(r.error)));
  }, [id]);

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
        <Link
          href={`/admin/marketing/whatsapp/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> Volver a la promo
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-2">Editar promo</h1>
        {d?.promo.estado === 'activa' && (
          <p className="text-sm text-stone-500 mb-6">
            Los cambios valen para los clientes a los que todavía no les abriste WhatsApp.
          </p>
        )}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        ) : d ? (
          <EditorPromoWhatsapp
            inicial={{ id: d.promo.id, nombre: d.promo.nombre, titulo: d.promo.titulo, mensaje: d.promo.mensaje }}
            imagenActual={d.promo.tieneImagen ? `/api/promo/${d.promo.slug}/imagen?v=${Date.parse(d.promo.updatedAt)}` : null}
            urlPromo={d.urlPromo}
          />
        ) : (
          <div className="spinner" />
        )}
      </main>
    </div>
  );
}
