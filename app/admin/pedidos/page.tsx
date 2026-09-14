'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { actualizarEstadoPedido } from '@/app/actions/orders';
import { ZONAS_ENVIO } from '@/lib/constants';

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
  tipoEntrega: string;
  costoEnvio: number;
  direccionEnvio: string | null;
  pisoEnvio: string | null;
  estado: string;
  horaListoEstimada: string | null;
  createdAt: string;
  items: PedidoItem[];
}

const TIPO_ENTREGA_LABEL: Record<string, string> = {
  retiro: 'Retira en el local',
  envio_cerca: `Envío — ${ZONAS_ENVIO.envio_cerca.nombre}`,
  envio_lejos: `Envío — ${ZONAS_ENVIO.envio_lejos.nombre}`,
};

const ESTADO_ESTILO: Record<string, string> = {
  pendiente_pago: 'bg-stone-100 text-stone-600',
  pagado: 'bg-amber-100 text-amber-800',
  en_preparacion: 'bg-orange-100 text-orange-800',
  listo_para_retirar: 'bg-green-100 text-green-800',
  entregado: 'bg-esperanza-100 text-esperanza-600',
  cancelado: 'bg-red-50 text-red-700',
};

const horaDe = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(iso));

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
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Pedidos</h1>
            {!loading && (
              <p className="text-sm text-stone-500 mt-1">
                {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} {filtro === 'activos' ? 'activos' : 'en total'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFiltro('activos')} className={`chip ${filtro === 'activos' ? 'chip-on' : 'chip-off'}`}>
              Activos
            </button>
            <button onClick={() => setFiltro('todos')} className={`chip ${filtro === 'todos' ? 'chip-on' : 'chip-off'}`}>
              Todos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-14">
            <div className="spinner"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
            <Icon name="bag" size={36} strokeWidth={1.4} className="mx-auto mb-3 text-esperanza-300" />
            <p className="text-stone-500">No hay pedidos {filtro === 'activos' ? 'activos ' : ''}por ahora.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 items-start">
            {pedidos.map((p) => {
              const siguiente = SIGUIENTE_ESTADO[p.estado];
              const esEnvio = p.tipoEntrega !== 'retiro';
              return (
                <article key={p.id} className="bg-white rounded-xl border border-esperanza-200/80 overflow-hidden flex flex-col">
                  <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                        #{p.numero} · {horaDe(p.createdAt)}
                      </p>
                      <p className="font-extrabold text-lg text-esperanza-700 truncate">{p.nombre}</p>
                      <a href={`tel:${p.telefono}`} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-esperanza-700">
                        <Icon name="phone" size={13} />
                        {p.telefono}
                      </a>
                    </div>
                    <span className={`badge py-1 px-2.5 ${ESTADO_ESTILO[p.estado] || ESTADO_ESTILO.pendiente_pago}`}>
                      {ESTADO_LABEL[p.estado] || p.estado}
                    </span>
                  </header>

                  <div
                    className={`mx-5 mb-3 rounded-lg px-3 py-2.5 text-sm flex items-start gap-2.5 ${
                      esEnvio ? 'bg-brand-gold/15 text-esperanza-700' : 'bg-esperanza-50 text-esperanza-700'
                    }`}
                  >
                    <Icon name={esEnvio ? 'scooter' : 'home'} size={17} className="mt-0.5 text-esperanza-500" />
                    <div className="min-w-0">
                      <p className="font-semibold">{TIPO_ENTREGA_LABEL[p.tipoEntrega] || p.tipoEntrega}</p>
                      {esEnvio && (
                        <p className="text-stone-600">
                          {p.direccionEnvio}
                          {p.pisoEnvio ? `, piso/depto ${p.pisoEnvio}` : ''}
                        </p>
                      )}
                      {p.horaListoEstimada && p.estado !== 'cancelado' && (
                        <p className="text-stone-500 text-xs mt-0.5 flex items-center gap-1">
                          <Icon name="clock" size={12} /> Estimado {p.horaListoEstimada}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 border-t border-esperanza-100 py-3">
                    {p.items.map((it) => (
                      <div key={it.id} className="flex justify-between gap-3 text-sm py-1">
                        <span className="text-esperanza-700">
                          <span className="font-bold tabular-nums mr-1.5">{it.cantidad}×</span>
                          {it.nombre}
                        </span>
                        <span className="text-stone-500 tabular-nums whitespace-nowrap">{formatearARS(it.precioUnitario * it.cantidad)}</span>
                      </div>
                    ))}
                    {p.costoEnvio > 0 && (
                      <div className="flex justify-between text-sm text-stone-500 py-1">
                        <span>Envío a domicilio</span>
                        <span className="tabular-nums">{formatearARS(p.costoEnvio)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-2.5 mt-1.5 border-t border-dashed border-esperanza-200">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Total</span>
                      <span className="text-lg font-extrabold text-esperanza-700 tabular-nums">{formatearARS(p.subtotal + p.costoEnvio)}</span>
                    </div>
                  </div>

                  {p.notas && (
                    <p className="mx-5 mb-3 text-sm text-esperanza-700 flex items-start gap-2 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-2">
                      <Icon name="message" size={14} className="mt-0.5 text-amber-700" />
                      {p.notas}
                    </p>
                  )}

                  {siguiente && (
                    <div className="px-5 pb-4 mt-auto">
                      <button
                        onClick={() => avanzarEstado(p.id, siguiente.estado)}
                        disabled={actualizando === p.id}
                        className="btn btn-primary w-full !py-3"
                      >
                        {actualizando === p.id ? 'Actualizando...' : siguiente.label}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
