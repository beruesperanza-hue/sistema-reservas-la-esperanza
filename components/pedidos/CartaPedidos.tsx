'use client';

import { useCart, keyDeLinea } from '@/components/pedidos/CartContext';
import { variantesDeItem, precioDeItem, type ItemPedible, type Variante } from '@/lib/pedidosCarta';
import { formatearPrecio } from '@/lib/carta';

export interface SeccionPedible {
  slug: string;
  titulo: string;
  items: ItemPedible[];
}

function Stepper({ seccion, nombre, variante, precioUnitario }: { seccion: string; nombre: string; variante?: Variante; precioUnitario: number }) {
  const { lines, add, setCantidad } = useCart();
  const key = keyDeLinea({ seccion, nombre, variante });
  const linea = lines.find((l) => keyDeLinea(l) === key);
  const cantidad = linea?.cantidad ?? 0;

  if (cantidad === 0) {
    return (
      <button
        type="button"
        onClick={() => add({ seccion, nombre, variante, precioUnitario })}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-sm border border-white/20 text-sand hover:border-brand-gold hover:text-brand-gold transition-colors"
      >
        + Agregar
      </button>
    );
  }

  return (
    <div className="shrink-0 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setCantidad(key, cantidad - 1)}
        className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/20 text-sand hover:border-brand-gold"
        aria-label="Quitar uno"
      >
        −
      </button>
      <span className="w-5 text-center font-mono text-sand tabular-nums">{cantidad}</span>
      <button
        type="button"
        onClick={() => setCantidad(key, cantidad + 1)}
        className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/20 text-sand hover:border-brand-gold"
        aria-label="Agregar uno"
      >
        +
      </button>
    </div>
  );
}

function FilaItem({ seccion, item }: { seccion: string; item: ItemPedible }) {
  const variantes = variantesDeItem(item);

  if (variantes) {
    return (
      <div className="py-3.5 border-b border-white/10 last:border-0">
        <p className="text-sand/90 mb-2">{item.nombre}</p>
        <div className="flex flex-wrap gap-3">
          {variantes.map((v) => (
            <div key={v.variante} className="flex items-center gap-2 text-sm">
              <span className="text-sand-dim">
                {v.label} <span className="font-mono text-sand">{formatearPrecio(v.precio)}</span>
              </span>
              <Stepper seccion={seccion} nombre={item.nombre} variante={v.variante} precioUnitario={v.precio} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const precio = precioDeItem(item);
  if (precio === null) return null;
  const incluye = 'incluye' in item ? item.incluye : undefined;

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/10 last:border-0">
      <div className="flex-1">
        <span className="text-sand/90">{item.nombre}</span>
        {incluye && <p className="text-xs text-sand-faint mt-1">{incluye}</p>}
      </div>
      <span className="font-mono text-sand tabular-nums">{formatearPrecio(precio)}</span>
      <Stepper seccion={seccion} nombre={item.nombre} precioUnitario={precio} />
    </div>
  );
}

export default function CartaPedidos({ secciones }: { secciones: SeccionPedible[] }) {
  return (
    <div>
      {secciones.map(
        (s) =>
          s.items.length > 0 && (
            <div key={s.slug} className="mb-12">
              <h2 className="font-display font-bold text-2xl text-sand mb-2">{s.titulo}</h2>
              <div>
                {s.items.map((item) => (
                  <FilaItem key={item.nombre} seccion={s.slug} item={item} />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
