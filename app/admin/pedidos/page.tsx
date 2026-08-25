'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { actualizarEstadoPedido } from '@/app/actions/orders';

interface PedidoItem {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface Pedido {
  id: string;
  numero: number;
  nombre: string;
  telefono: string;
  email: string;
  notas: string | null;
  subtotal: number;
  estado: string;
  horaListoEstimada: string | null;
  createdAt: string;
  items: PedidoItem[];
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo_para_retirar: 'Listo para retirar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const SIGUIENTE_ESTADO: Record<string, { estado: string; label: string } | undefined> = {
  pagado: { estado: 'en_preparacion', label: 'Marcar en preparación' },
  en_preparacion: { estado: 'listo_para_retirar', label: 'Marcar listo para retirar' },
  listo_para_retirar: { estado: 'entregado', label: 'Marcar entregado' },
};

const formatearARS = (v: number) => `$${v.toLocaleString('es-AR')}`;

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<'activos' | 'todos'>('activos');
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pedidos?filtro=${filtro}`);
      const data = await res.json();
      setPedidos(data.pedidos || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtro]);

  const avanzarEstado = async (id: string, nuevoEstado: string) => {
    setActualizando(id);
    const res = await actualizarEstadoPedido(id, nuevoEstado);
    if (res.success) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)));
    }
    setActualizando(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-esperanza-700">Pedidos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro('activos')}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${filtro === 'activos' ? 'bg-esperanza-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
            >
              Activos
            </button>
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${filtro === 'todos' ? 'bg-esperanza-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
            >
              Todos
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No hay pedidos {filtro === 'activos' ? 'activos' : ''} por ahora.</p>
        ) : (
          <div className="space-y-4">
            {pedidos.map((p) => {
              const siguiente = SIGUIENTE_ESTADO[p.estado];
              return (
                <div key={p.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold text-esperanza-700 text-lg">
                        Pedido #{p.numero} — {p.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.telefono} · {p.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                        p.estado === 'pagado' || p.estado === 'en_preparacion'
                          ? 'bg-yellow-100 text-yellow-700'
                          : p.estado === 'listo_para_retirar'
                          ? 'bg-green-100 text-green-700'
                          : p.estado === 'cancelado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ESTADO_LABEL[p.estado] || p.estado}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mb-3">
                    {p.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-sm text-gray-600 py-0.5">
                        <span>{it.cantidad}× {it.nombre}</span>
                        <span>{formatearARS(it.precioUnitario * it.cantidad)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-esperanza-700 pt-2 mt-1 border-t border-gray-100">
                      <span>Total</span>
                      <span>{formatearARS(p.subtotal)}</span>
                    </div>
                  </div>

                  {p.notas && <p className="text-sm text-gray-500 italic mb-3">Nota: {p.notas}</p>}
                  {p.horaListoEstimada && p.estado !== 'cancelado' && (
                    <p className="text-sm text-gray-500 mb-3">Estimado: {p.horaListoEstimada}</p>
                  )}

                  {siguiente && (
                    <button
                      onClick={() => avanzarEstado(p.id, siguiente.estado)}
                      disabled={actualizando === p.id}
                      className="btn btn-primary"
                    >
                      {actualizando === p.id ? 'Actualizando...' : siguiente.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
