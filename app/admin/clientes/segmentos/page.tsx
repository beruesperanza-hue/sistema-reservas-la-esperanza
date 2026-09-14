'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { eliminarSegmento } from '@/app/actions/customers';

interface SegmentoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  conteo: number;
  updatedAt: string;
}

export default function SegmentosPage() {
  const [segmentos, setSegmentos] = useState<SegmentoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/segmentos');
      const data = await res.json();
      setSegmentos(data.segmentos || []);
    } catch (error) {
      console.error('Error cargando segmentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este segmento? Los clientes no se ven afectados.')) return;
    await eliminarSegmento(id);
    cargar();
  };

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        <Link href="/admin/clientes" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a clientes
        </Link>

        <div className="flex items-center justify-between mt-2 mb-8 flex-wrap gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Segmentos</h1>
          <Link href="/admin/clientes/segmentos/nuevo" className="btn btn-primary">
            <Icon name="plus" size={16} strokeWidth={2.2} />
            Nuevo segmento
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner"></div>
          </div>
        ) : segmentos.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
            <p className="text-stone-500">Todavía no creaste ningún segmento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {segmentos.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-base">{s.nombre}</h2>
                  {s.descripcion && <p className="text-stone-500 text-sm">{s.descripcion}</p>}
                  <p className="badge bg-esperanza-100 text-esperanza-600 mt-2">{s.conteo} clientes</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/clientes/segmentos/${s.id}/enviar`} className="btn btn-primary btn-small">
                    <Icon name="mail" size={14} />
                    Enviar mail
                  </Link>
                  <Link href={`/admin/clientes/segmentos/${s.id}`} className="btn btn-secondary btn-small">
                    Editar
                  </Link>
                  <button className="btn btn-danger btn-small" onClick={() => handleEliminar(s.id)} aria-label="Eliminar segmento">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
