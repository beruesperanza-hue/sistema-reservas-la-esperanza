'use client';

import Link from 'next/link';
import { useCart } from '@/components/pedidos/CartContext';
import { formatearPrecio } from '@/lib/carta';

export default function CartBar() {
  const { cantidadTotal, subtotal } = useCart();

  if (cantidadTotal === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-night border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="mx-auto max-w-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-sand-dim">
            {cantidadTotal} {cantidadTotal === 1 ? 'ítem' : 'ítems'}
          </p>
          <p className="font-mono text-lg text-sand font-semibold">{formatearPrecio(subtotal)}</p>
        </div>
        <Link
          href="/pedidos/checkout"
          className="font-semibold text-sm px-6 py-3 rounded-sm bg-sand text-night hover:bg-brand-amber transition-colors"
        >
          Ver pedido →
        </Link>
      </div>
    </div>
  );
}
