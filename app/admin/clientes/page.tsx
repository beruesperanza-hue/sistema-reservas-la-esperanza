'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { formatearFechaCorta } from '@/lib/fechas';

interface ClienteFila {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  origen: string;
  vip: boolean;
  visitasTotales: number;
  ultimaVisita: string | null;
  tieneProximaReserva: boolean;
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<ClienteFila[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [q, setQ] = useState('');
  const [origen, setOrigen] = useState('');
  const [soloVip, setSoloVip] = useState(false);
  const [soloConProxima, setSoloConProxima] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => cargar(), 300); // debounce de la búsqueda
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, origen, soloVip, soloConProxima]);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) params.set('q', q);
      if (origen) params.set('origen', origen);
      if (soloVip) params.set('vip', '1');
      if (soloConProxima) params.set('tieneProximaReserva', '1');

      const res = await fetch(`/api/admin/clientes?${params}`);
      const data = await res.json();
      setClientes(data.clientes || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-bold text-esperanza-700">Clientes</h1>
            <p className="text-gray-500 text-sm mt-1">{total} clientes en la base</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/clientes/segmentos" className="btn btn-secondary">
              🗂️ Segmentos
            </Link>
            <Link href="/admin/clientes/importar" className="btn btn-primary">
              ⬆️ Importar clientes
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 grid md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="form-label">Búsqueda</label>
            <input
              type="text"
              placeholder="Nombre, email o teléfono..."
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Origen</label>
            <select
              className="form-input"
              value={origen}
              onChange={(e) => {
                setPage(1);
                setOrigen(e.target.value);
              }}
            >
              <option value="">Todos</option>
              <option value="web">Web</option>
              <option value="admin">Admin</option>
              <option value="importado_excel">Excel</option>
              <option value="importado_woki">Woki</option>
              <option value="importado_bigbox">Bigbox</option>
              <option value="importado_mozrest">Mozrest</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={soloVip}
                onChange={(e) => {
                  setPage(1);
                  setSoloVip(e.target.checked);
                }}
              />
              Solo VIP
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={soloConProxima}
                onChange={(e) => {
                  setPage(1);
                  setSoloConProxima(e.target.checked);
                }}
              />
              Con próxima reserva
            </label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <span className="text-5xl text-gray-300 mx-auto mb-4 block">🗂️</span>
            <p className="text-gray-600">No hay clientes que coincidan con este filtro</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Visitas</th>
                  <th className="px-4 py-3">Última visita</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {c.nombre} {c.apellido || ''}
                      {c.vip && <span className="ml-2 text-xs text-amber-600">⭐ VIP</span>}
                      {c.tieneProximaReserva && (
                        <span className="ml-2 text-xs text-esperanza-600">próxima reserva</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{c.email || '—'}</div>
                      <div>{c.telefono || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.origen}</td>
                    <td className="px-4 py-3 text-gray-600">{c.visitasTotales}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.ultimaVisita ? formatearFechaCorta(c.ultimaVisita.slice(0, 10)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/clientes/${c.id}`} className="text-esperanza-600 hover:underline">
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>
            <span className="text-gray-600 text-sm">
              Página {page} de {totalPaginas}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
