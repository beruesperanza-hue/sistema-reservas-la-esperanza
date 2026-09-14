'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
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
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 md:py-10 max-w-7xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Clientes</h1>
            <p className="text-stone-500 text-sm mt-1">{total} clientes en la base</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/clientes/segmentos" className="btn btn-secondary">
              <Icon name="folder" size={16} />
              Segmentos
            </Link>
            <Link href="/admin/clientes/importar" className="btn btn-primary">
              <Icon name="upload" size={16} />
              Importar
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-esperanza-200/80 p-4 mb-5 grid md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="form-label">Búsqueda</label>
            <input
              type="search"
              placeholder="Nombre, email o teléfono"
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

          <div className="flex gap-2 flex-wrap md:pb-1">
            <label className={`chip cursor-pointer ${soloVip ? 'chip-on' : 'chip-off'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={soloVip}
                onChange={(e) => {
                  setPage(1);
                  setSoloVip(e.target.checked);
                }}
              />
              Solo VIP
            </label>
            <label className={`chip cursor-pointer ${soloConProxima ? 'chip-on' : 'chip-off'}`}>
              <input
                type="checkbox"
                className="sr-only"
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
            <div className="spinner"></div>
            <p className="text-stone-500 text-sm mt-3">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
            <Icon name="users" size={36} strokeWidth={1.4} className="mx-auto mb-3 text-esperanza-300" />
            <p className="text-stone-500">No hay clientes que coincidan con este filtro</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-esperanza-200/80 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-esperanza-50/70 text-left text-[11px] uppercase tracking-[0.08em] text-stone-500 border-b border-esperanza-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Origen</th>
                  <th className="px-4 py-3 font-semibold">Visitas</th>
                  <th className="px-4 py-3 font-semibold">Última visita</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-esperanza-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-esperanza-50/60">
                    <td className="px-4 py-3 font-semibold text-esperanza-700">
                      {c.nombre} {c.apellido || ''}
                      {c.vip && <span className="badge ml-2 bg-brand-gold/20 text-esperanza-600">VIP</span>}
                      {c.tieneProximaReserva && (
                        <span className="badge ml-2 bg-green-50 text-green-700">próxima reserva</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <div>{c.email || '—'}</div>
                      <div>{c.telefono || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{c.origen}</td>
                    <td className="px-4 py-3 text-esperanza-700 font-semibold tabular-nums">{c.visitasTotales}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {c.ultimaVisita ? formatearFechaCorta(c.ultimaVisita.slice(0, 10)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/clientes/${c.id}`} className="inline-flex items-center gap-1 font-semibold text-esperanza-600 hover:text-esperanza-700 whitespace-nowrap">
                        Ver ficha <Icon name="chevronRight" size={14} />
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
              <Icon name="chevronLeft" size={16} /> Anterior
            </button>
            <span className="text-stone-500 text-sm tabular-nums">
              Página {page} de {totalPaginas}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente <Icon name="chevronRight" size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
