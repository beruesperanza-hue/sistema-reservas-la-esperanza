'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
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
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/admin/clientes/segmentos" className="text-esperanza-600 hover:underline text-sm">
          ← Volver a segmentos
        </Link>
        <h1 className="text-4xl font-bold text-esperanza-700 mt-2 mb-8">Nuevo segmento</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
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
          <h2 className="text-xl font-semibold mb-4">Condiciones</h2>
          <SegmentoBuilder value={filtro} onChange={setFiltro} />
        </div>

        <div className="card mb-6 text-center">
          <p className="text-gray-500 text-sm">Clientes que matchean ahora mismo</p>
          <p className="text-3xl font-bold text-esperanza-700">{conteo === null ? '...' : conteo}</p>
        </div>

        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar segmento'}
        </button>
      </main>
    </div>
  );
}
