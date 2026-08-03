'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
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
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/admin/clientes" className="text-esperanza-600 hover:underline text-sm">
          ← Volver a clientes
        </Link>

        <div className="flex items-center justify-between mt-2 mb-8 flex-wrap gap-3">
          <h1 className="text-4xl font-bold text-esperanza-700">Segmentos</h1>
          <Link href="/admin/clientes/segmentos/nuevo" className="btn btn-primary">
            + Nuevo segmento
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
          </div>
        ) : segmentos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">Todavía no creaste ningún segmento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {segmentos.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-semibold text-lg">{s.nombre}</h2>
                  {s.descripcion && <p className="text-gray-500 text-sm">{s.descripcion}</p>}
                  <p className="text-esperanza-600 text-sm font-semibold mt-1">{s.conteo} clientes</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/clientes/segmentos/${s.id}/enviar`} className="btn btn-primary btn-small">
                    ✉️ Enviar mail
                  </Link>
                  <Link href={`/admin/clientes/segmentos/${s.id}`} className="btn btn-secondary btn-small">
                    Editar
                  </Link>
                  <button className="btn btn-danger btn-small" onClick={() => handleEliminar(s.id)}>
                    🗑️
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
