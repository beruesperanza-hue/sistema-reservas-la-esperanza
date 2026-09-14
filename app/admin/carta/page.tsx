'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { toggleMenuItem } from '@/app/actions/menu';
import { SECCIONES_MENU, formatearPrecio } from '@/lib/carta';

function precioDe(item: any): string {
  if (typeof item.precio === 'number') return formatearPrecio(item.precio);
  const partes: string[] = [];
  if (typeof item.tapa === 'number') partes.push(`Tapa ${formatearPrecio(item.tapa)}`);
  if (typeof item.racion === 'number') partes.push(`Ración ${formatearPrecio(item.racion)}`);
  return partes.join(' · ') || '—';
}

function Toggle({ activo, onClick }: { activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={activo}
      title={activo ? 'Visible en la carta — tocar para ocultar' : 'Oculto — tocar para mostrar'}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        activo ? 'bg-green-600' : 'bg-stone-300'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          activo ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function AdminCartaPage() {
  const [inactivos, setInactivos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [abierta, setAbierta] = useState<Set<string>>(new Set(SECCIONES_MENU.map((s) => s.slug)));

  useEffect(() => {
    fetch('/api/admin/carta')
      .then((r) => r.json())
      .then((data) => setInactivos(new Set<string>(data.inactivos || [])))
      .catch(() => setInactivos(new Set()))
      .finally(() => setLoading(false));
  }, []);

  const clave = (slug: string, nombre: string) => `${slug}::${nombre}`;

  const toggleSeccion = (slug: string) => {
    setAbierta((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleToggleItem = async (slug: string, nombre: string) => {
    const key = clave(slug, nombre);
    const activoActual = !inactivos.has(key);
    const nuevoActivo = !activoActual;

    setInactivos((prev) => {
      const next = new Set(prev);
      if (nuevoActivo) next.delete(key);
      else next.add(key);
      return next;
    });

    const result = await toggleMenuItem(slug, nombre, nuevoActivo);
    if (!result.success) {
      // revertir si falló
      setInactivos((prev) => {
        const next = new Set(prev);
        if (activoActual) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  };

  const totalItems = SECCIONES_MENU.reduce((sum, s) => sum + s.items.length, 0);
  const totalOcultos = inactivos.size;

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Carta</h1>
          <p className="text-stone-500 text-sm mt-1">
            Activá o desactivá platos y bebidas — lo que apagués desaparece al instante de la carta y de pedidos online.
          </p>
          {!loading && totalOcultos > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 badge bg-amber-100 text-amber-800 py-1 px-3 text-xs">
              <Icon name="alert" size={13} />
              {totalOcultos} de {totalItems} ítems ocultos ahora mismo
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {SECCIONES_MENU.map((seccion) => {
              const ocultosSeccion = seccion.items.filter((it) => inactivos.has(clave(seccion.slug, it.nombre))).length;
              const abiertaActual = abierta.has(seccion.slug);

              return (
                <div key={seccion.slug} className="bg-white rounded-xl border border-esperanza-200/80 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSeccion(seccion.slug)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-esperanza-50/60 transition-colors"
                  >
                    <span className="font-bold text-esperanza-700">{seccion.titulo}</span>
                    <span className="flex items-center gap-3 text-xs text-stone-500">
                      {ocultosSeccion > 0 ? (
                        <span className="badge bg-amber-100 text-amber-800">
                          {ocultosSeccion} de {seccion.items.length} ocultos
                        </span>
                      ) : (
                        <span>{seccion.items.length} ítems</span>
                      )}
                      <Icon name="chevronDown" size={18} className={`text-stone-400 transition-transform ${abiertaActual ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {abiertaActual && (
                    <div className="divide-y divide-esperanza-100/70 border-t border-esperanza-100">
                      {seccion.items.map((item: any) => {
                        const activo = !inactivos.has(clave(seccion.slug, item.nombre));
                        return (
                          <div
                            key={item.nombre}
                            className={`flex items-center justify-between gap-4 px-5 py-3 ${!activo ? 'bg-esperanza-50/70' : ''}`}
                          >
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${activo ? 'text-esperanza-700' : 'text-stone-400 line-through'}`}>
                                {item.nombre}
                              </p>
                              <p className="text-xs text-stone-500 mt-0.5 tabular-nums">{precioDe(item)}</p>
                            </div>
                            <Toggle activo={activo} onClick={() => handleToggleItem(seccion.slug, item.nombre)} />
                          </div>
                        );
                      })}
                    </div>
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
