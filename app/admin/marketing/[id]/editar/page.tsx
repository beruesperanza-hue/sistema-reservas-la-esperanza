'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import EditorCampania from '@/components/admin/EditorCampania';
import { type DatosCampania, obtenerCampania } from '@/app/actions/marketing';

export default function EditarCampaniaPage() {
  const { id } = useParams<{ id: string }>();
  const [inicial, setInicial] = useState<(DatosCampania & { id: string }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerCampania(id).then((r) => {
      if (!r.success) return setError(r.error);
      if (r.campania.estado !== 'borrador') return setError('Esta campaña ya empezó a enviarse y no se puede editar.');
      const c = r.campania;
      setInicial({
        id: c.id,
        tipo: c.tipo,
        nombre: c.nombre,
        asunto: c.asunto,
        cuerpoTexto: c.cuerpoTexto,
        botonTexto: c.botonTexto ?? '',
        botonUrl: c.botonUrl ?? '',
        segmentId: c.segmentId ?? '',
      });
    });
  }, [id]);

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-7xl">
        <Link
          href={`/admin/marketing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> Volver a la campaña
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-6">Editar campaña</h1>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        ) : inicial ? (
          <EditorCampania inicial={inicial} />
        ) : (
          <div className="spinner" />
        )}
      </main>
    </div>
  );
}
