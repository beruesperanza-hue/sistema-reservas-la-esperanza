'use client';

import { useEffect, useState } from 'react';
import { hoyEnBA } from '@/lib/fechas';
import Icon from './Icon';

interface Props {
  fechaSeleccionada: string; // 'YYYY-MM-DD'
  onSeleccionar: (fecha: string) => void;
}

interface ResumenDia {
  reservas: number;
  personas: number;
}

const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function MiniCalendario({ fechaSeleccionada, onSeleccionar }: Props) {
  const hoy = hoyEnBA();
  const [mesVisible, setMesVisible] = useState(fechaSeleccionada.slice(0, 7)); // 'YYYY-MM'
  const [dias, setDias] = useState<Record<string, ResumenDia>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/calendario?mes=${mesVisible}`)
      .then((r) => r.json())
      .then((data) => setDias(data.dias || {}))
      .catch(() => setDias({}))
      .finally(() => setLoading(false));
  }, [mesVisible]);

  const [anioStr, mesStr] = mesVisible.split('-');
  const anio = parseInt(anioStr);
  const mes = parseInt(mesStr) - 1; // 0-indexado solo para nombres/cálculo de grilla

  const primerDiaMes = new Date(Date.UTC(anio, mes, 1));
  const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const offsetInicio = primerDiaMes.getUTCDay(); // 0=domingo

  const nombreMes = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    primerDiaMes
  );

  const celdas: (string | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => {
      const dd = String(i + 1).padStart(2, '0');
      return `${mesVisible}-${dd}`;
    }),
  ];

  const cambiarMes = (delta: number) => {
    const d = new Date(Date.UTC(anio, mes + delta, 1));
    setMesVisible(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="bg-white rounded-xl border border-esperanza-200/80 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          className="w-9 h-9 rounded-lg hover:bg-esperanza-50 text-stone-500 flex items-center justify-center"
          aria-label="Mes anterior"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <h3 className="font-bold text-esperanza-700 first-letter:uppercase">{nombreMes}</h3>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          className="w-9 h-9 rounded-lg hover:bg-esperanza-50 text-stone-500 flex items-center justify-center"
          aria-label="Mes siguiente"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_CORTOS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-stone-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={i} />;
          const resumen = dias[fecha];
          const esHoy = fecha === hoy;
          const esSeleccionado = fecha === fechaSeleccionada;
          const esPasado = fecha < hoy;

          return (
            <button
              key={fecha}
              type="button"
              onClick={() => onSeleccionar(fecha)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                esSeleccionado
                  ? 'bg-esperanza-700 text-sand font-bold'
                  : esHoy
                  ? 'ring-1 ring-inset ring-brand-gold text-esperanza-700 font-bold'
                  : esPasado
                  ? 'text-stone-300 hover:bg-esperanza-50'
                  : 'text-esperanza-700 hover:bg-esperanza-50'
              }`}
            >
              {parseInt(fecha.slice(-2))}
              {resumen && (
                <span
                  className={`mt-0.5 text-[10px] leading-none px-1 rounded-full ${
                    esSeleccionado ? 'text-brand-gold' : 'text-esperanza-500 font-semibold'
                  }`}
                >
                  {resumen.personas}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          setMesVisible(hoy.slice(0, 7));
          onSeleccionar(hoy);
        }}
        className="w-full mt-3 pt-3 border-t border-esperanza-100 text-sm text-esperanza-600 hover:text-esperanza-700 font-semibold"
      >
        Ir a hoy
      </button>
    </div>
  );
}
