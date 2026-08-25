'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useCart, keyDeLinea } from '@/components/pedidos/CartContext';
import { createOrder } from '@/app/actions/orders';
import { formatearPrecio } from '@/lib/carta';

const inputCls =
  'w-full px-4 py-3 bg-night-2 border border-white/15 rounded-sm text-sand placeholder:text-sand-faint focus:outline-none focus:border-brand-gold transition-colors';
const labelCls = 'block text-xs font-mono uppercase tracking-wide text-sand-dim mb-1.5';
const btnPrimary =
  'w-full py-3 rounded-sm font-semibold bg-sand text-night hover:bg-brand-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export default function CheckoutPage() {
  const { lines, subtotal, setCantidad, remove, clear } = useCart();
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', notas: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || lines.length === 0) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await createOrder({
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email,
        notas: form.notas || undefined,
        items: lines.map((l) => ({
          seccion: l.seccion,
          nombre: l.nombre,
          variante: l.variante,
          cantidad: l.cantidad,
        })),
      });

      if (response.success && response.initPoint) {
        clear();
        window.location.href = response.initPoint;
      } else {
        setError(response.error || 'Error al procesar el pedido');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night text-sand font-body flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20 md:pt-40">
        <div className="mx-auto px-5 max-w-2xl">
          <div className="mb-8">
            <span className="font-mono text-[11px] tracking-widest uppercase text-brand-gold block mb-3">
              Tu pedido
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-sand mb-3">Confirmar Pedido</h1>
          </div>

          {lines.length === 0 ? (
            <div className="border border-white/10 rounded-sm p-8 text-center">
              <p className="text-sand-dim mb-6">Todavía no agregaste nada a tu pedido.</p>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3.5 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
              >
                Ver la carta →
              </Link>
            </div>
          ) : (
            <>
              {/* Resumen del carrito */}
              <div className="border border-white/10 rounded-sm p-6 mb-8 bg-night-2">
                {lines.map((l) => {
                  const key = keyDeLinea(l);
                  return (
                    <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/10 last:border-0">
                      <div className="flex-1">
                        <p className="text-sand text-sm">{l.nombre}</p>
                        <p className="text-xs text-sand-faint">{formatearPrecio(l.precioUnitario)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCantidad(key, l.cantidad - 1)} className="w-6 h-6 flex items-center justify-center rounded-sm border border-white/20 text-sand text-sm">−</button>
                        <span className="w-5 text-center font-mono text-sm tabular-nums">{l.cantidad}</span>
                        <button type="button" onClick={() => setCantidad(key, l.cantidad + 1)} className="w-6 h-6 flex items-center justify-center rounded-sm border border-white/20 text-sand text-sm">+</button>
                      </div>
                      <span className="font-mono text-sand text-sm w-20 text-right tabular-nums">
                        {formatearPrecio(l.precioUnitario * l.cantidad)}
                      </span>
                      <button type="button" onClick={() => remove(key)} className="text-sand-faint hover:text-red-400 text-sm" aria-label="Quitar">
                        ✕
                      </button>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <span className="font-semibold text-sand">Total</span>
                  <span className="font-mono text-xl text-sand font-semibold">{formatearPrecio(subtotal)}</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm flex gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-red-400">No pudimos procesar tu pedido</h3>
                    <p className="text-red-400/80 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 border border-white/10 rounded-sm p-6 md:p-8">
                <h3 className="text-lg font-display font-semibold text-sand mb-2">👤 Tus datos</h3>

                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    className={inputCls}
                    required
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Teléfono *</label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                      className={inputCls}
                      required
                      placeholder="+54-11-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className={inputCls}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notas (opcional)</label>
                  <textarea
                    value={form.notas}
                    onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                    className={inputCls}
                    rows={2}
                    placeholder="Sin sal, sin gluten, etc."
                  />
                </div>

                <p className="text-xs text-sand-faint">
                  Al confirmar te vamos a llevar a Mercado Pago para pagar {formatearPrecio(subtotal)}. Retirás en{' '}
                  el local una vez confirmado el pago.
                </p>

                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Redirigiendo a Mercado Pago...' : `Pagar con Mercado Pago`}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
