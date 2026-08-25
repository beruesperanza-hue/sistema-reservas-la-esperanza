'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Variante } from '@/lib/pedidosCarta';

export interface CartLine {
  seccion: string;
  nombre: string;
  variante?: Variante;
  precioUnitario: number;
  cantidad: number;
}

interface CartContextValue {
  lines: CartLine[];
  cantidadTotal: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'cantidad'>, cantidad?: number) => void;
  setCantidad: (key: string, cantidad: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'pedido_carrito';

function keyDe(line: Pick<CartLine, 'seccion' | 'nombre' | 'variante'>): string {
  return `${line.seccion}::${line.nombre}::${line.variante ?? ''}`;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // localStorage puede fallar (modo privado, storage lleno) — el carrito arranca vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // idem — si no se puede persistir, el pedido igual funciona en esta sesión.
    }
  }, [lines, hydrated]);

  const add: CartContextValue['add'] = useCallback((line, cantidad = 1) => {
    setLines((prev) => {
      const k = keyDe(line);
      const existente = prev.find((l) => keyDe(l) === k);
      if (existente) {
        return prev.map((l) => (keyDe(l) === k ? { ...l, cantidad: l.cantidad + cantidad } : l));
      }
      return [...prev, { ...line, cantidad }];
    });
  }, []);

  const setCantidad: CartContextValue['setCantidad'] = useCallback((key, cantidad) => {
    setLines((prev) => {
      if (cantidad <= 0) return prev.filter((l) => keyDe(l) !== key);
      return prev.map((l) => (keyDe(l) === key ? { ...l, cantidad } : l));
    });
  }, []);

  const remove: CartContextValue['remove'] = useCallback((key) => {
    setLines((prev) => prev.filter((l) => keyDe(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const cantidadTotal = useMemo(() => lines.reduce((acc, l) => acc + l.cantidad, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, cantidadTotal, subtotal, add, setCantidad, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}

export function keyDeLinea(line: Pick<CartLine, 'seccion' | 'nombre' | 'variante'>): string {
  return keyDe(line);
}
