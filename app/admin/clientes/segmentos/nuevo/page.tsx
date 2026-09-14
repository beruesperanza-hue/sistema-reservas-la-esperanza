'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import SegmentoBuilder from '@/components/admin/SegmentoBuilder';
import { crearSegmento, previsualizarSegmento } from '@/app/actions/customers';
import type { NodoFiltro } from '@/lib/segmentos';

export default function NuevoSegmentoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [filtro, setFiltro] = useState<NodoFiltro>({ operador: 'AND', condiciones: [] });
  const [conteo, setConteo] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await previsualizarSegmento(filtro);
      if (res.success) setConteo(res.total);
    }, 400);
    return () => clearTimeout(timeout);
  }, [filtro]);

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('Ponele un nombre al segmento.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const res = await crearSegmento(nombre.trim(), filtro, descripcion.trim() || undefined);
      if (!res.success) {
        setError(res.error || 'No se pudo crear el segmento.');
        return;
      }
      router.push('/admin/clientes/segmentos');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 md:py-10 max-w-3xl">
        <Link href="/admin/clientes/segmentos" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a segmentos
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-6">Nuevo segmento</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
        )}

        <div className="card space-y-4 mb-6">
          <div>
            <label className="form-label">Nombre del segmento</label>
            <input className="form-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Descripción (opcional)</label>
            <input
              className="form-input"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold mb-4">Condiciones</h2>
          <SegmentoBuilder value={filtro} onChange={setFiltro} />
        </div>

        <div className="card mb-6 text-center">
          <p className="text-stone-500 text-sm">Clientes que matchean ahora mismo</p>
          <p className="text-3xl font-bold text-esperanza-700">{conteo === null ? '...' : conteo}</p>
        </div>

        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar segmento'}
        </button>
      </main>
    </div>
  );
}
