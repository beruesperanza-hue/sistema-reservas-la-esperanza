'use client';

import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import EditorPromoWhatsapp from '@/components/admin/EditorPromoWhatsapp';

const MENSAJE_INICIAL = [
  'Hola {nombre}! 👋 Te escribimos de La Esperanza de los Ascurra.',
  '',
  'Esta semana tenemos *una promo para vos*: …',
  '',
  '¡Te esperamos en Aguirre 526!',
].join('\n');

export default function NuevaPromoWhatsappPage() {
  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
        <Link
          href="/admin/marketing/whatsapp"
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> Volver a WhatsApp
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-6">Nueva promo por WhatsApp</h1>
        <EditorPromoWhatsapp inicial={{ nombre: '', titulo: '', mensaje: MENSAJE_INICIAL }} />
      </main>
    </div>
  );
}
