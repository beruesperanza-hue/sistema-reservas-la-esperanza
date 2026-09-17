'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import EditorCampania from '@/components/admin/EditorCampania';
import { CAMPANIA_POR_DEFECTO, INVITACION_POR_DEFECTO } from '@/lib/marketingTextos';

function Contenido() {
  const esInvitacion = useSearchParams().get('tipo') === 'invitacion';
  const base = esInvitacion ? INVITACION_POR_DEFECTO : CAMPANIA_POR_DEFECTO;

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-6">
        {esInvitacion ? 'Invitar a suscribirse' : 'Nueva campaña'}
      </h1>
      <EditorCampania
        inicial={{
          tipo: esInvitacion ? 'invitacion' : 'campania',
          ...base,
          botonTexto: '',
          botonUrl: '',
          segmentId: '',
        }}
      />
    </>
  );
}

export default function NuevaCampaniaPage() {
  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-7xl">
        <Link
          href="/admin/marketing"
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> Volver a marketing
        </Link>
        <Suspense fallback={<div className="spinner mt-8" />}>
          <Contenido />
        </Suspense>
      </main>
    </div>
  );
}
