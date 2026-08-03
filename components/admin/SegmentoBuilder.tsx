'use client';

import { CAMPOS_SEGMENTO, type Condicion, type NodoFiltro, type OperadorCondicion } from '@/lib/segmentos';

const LABEL_OP: Record<OperadorCondicion, string> = {
  '=': 'es',
  '!=': 'no es',
  '>': 'mayor que',
  '>=': 'mayor o igual que',
  '<': 'menor que',
  '<=': 'menor o igual que',
  in: 'es alguno de',
  contiene: 'contiene',
};

function campoInfo(campo: string) {
  return CAMPOS_SEGMENTO.find((c) => c.campo === campo) ?? CAMPOS_SEGMENTO[0];
}

// Constructor de condiciones AND/OR. Primera versión: un solo nivel (todas
// las condiciones bajo un mismo operador) — el motor (lib/segmentos.ts) ya
// soporta anidar árboles, pero el UI de un solo nivel cubre el caso pedido
// ("clientes con más de 3 cancelaciones Y sin reserva próxima", etc.) sin la
// complejidad de un editor de árbol genérico.
export default function SegmentoBuilder({
  value,
  onChange,
}: {
  value: NodoFiltro;
  onChange: (filtro: NodoFiltro) => void;
}) {
  const condiciones = value.condiciones.filter((c): c is Condicion => !('operador' in c));

  const actualizarCondicion = (index: number, patch: Partial<Condicion>) => {
    const nuevas = condiciones.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ ...value, condiciones: nuevas });
  };

  const agregarCondicion = () => {
    const primerCampo = CAMPOS_SEGMENTO[0];
    onChange({
      ...value,
      condiciones: [
        ...condiciones,
        { campo: primerCampo.campo, op: primerCampo.ops[0], valor: valorPorDefecto(primerCampo.tipo) },
      ],
    });
  };

  const quitarCondicion = (index: number) => {
    onChange({ ...value, condiciones: condiciones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Combinar condiciones con</label>
        <div className="flex gap-2">
          {(['AND', 'OR'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onChange({ ...value, operador: op })}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                value.operador === op
                  ? 'bg-esperanza-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {op === 'AND' ? 'Todas (Y)' : 'Cualquiera (O)'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {condiciones.length === 0 && (
          <p className="text-gray-500 text-sm">Todavía no agregaste ninguna condición.</p>
        )}

        {condiciones.map((cond, index) => {
          const info = campoInfo(cond.campo);
          return (
            <div key={index} className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <select
                className="form-input w-auto"
                value={cond.campo}
                onChange={(e) => {
                  const nuevoInfo = campoInfo(e.target.value);
                  actualizarCondicion(index, {
                    campo: e.target.value,
                    op: nuevoInfo.ops[0],
                    valor: valorPorDefecto(nuevoInfo.tipo),
                  });
                }}
              >
                {CAMPOS_SEGMENTO.map((c) => (
                  <option key={c.campo} value={c.campo}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                className="form-input w-auto"
                value={cond.op}
                onChange={(e) => actualizarCondicion(index, { op: e.target.value as OperadorCondicion })}
              >
                {info.ops.map((op) => (
                  <option key={op} value={op}>
                    {LABEL_OP[op]}
                  </option>
                ))}
              </select>

              <ValorInput
                info={info}
                op={cond.op}
                valor={cond.valor}
                onChange={(valor) => actualizarCondicion(index, { valor })}
              />

              <button
                type="button"
                onClick={() => quitarCondicion(index)}
                className="btn btn-small btn-danger ml-auto"
                title="Quitar condición"
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={agregarCondicion} className="btn btn-secondary">
        + Agregar condición
      </button>
    </div>
  );
}

function valorPorDefecto(tipo: string): unknown {
  if (tipo === 'numero') return 0;
  if (tipo === 'booleano') return true;
  return '';
}

function ValorInput({
  info,
  op,
  valor,
  onChange,
}: {
  info: (typeof CAMPOS_SEGMENTO)[number];
  op: OperadorCondicion;
  valor: unknown;
  onChange: (valor: unknown) => void;
}) {
  if (info.tipo === 'numero') {
    return (
      <input
        type="number"
        className="form-input w-28"
        value={typeof valor === 'number' ? valor : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  if (info.tipo === 'booleano') {
    return (
      <select
        className="form-input w-auto"
        value={valor ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
      >
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (info.tipo === 'select' && info.opciones) {
    if (op === 'in') {
      const seleccionados = Array.isArray(valor) ? (valor as string[]) : [];
      return (
        <select
          multiple
          className="form-input w-auto min-w-[10rem]"
          value={seleccionados}
          onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
        >
          {info.opciones.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      );
    }
    return (
      <select
        className="form-input w-auto"
        value={typeof valor === 'string' ? valor : info.opciones[0]}
        onChange={(e) => onChange(e.target.value)}
      >
        {info.opciones.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    );
  }

  // tags / texto
  return (
    <input
      type="text"
      className="form-input w-40"
      value={typeof valor === 'string' ? valor : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={info.tipo === 'tags' ? 'ej: vip-cumpleaños' : ''}
    />
  );
}
