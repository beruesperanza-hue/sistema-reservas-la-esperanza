'use client';

import { useState } from 'react';
import { createReservationAdmin } from '@/app/actions/reservations';
import { UBICACIONES, UBICACIONES_ICONO, UBICACIONES_LABEL } from '@/lib/constants';
import { formatearFechaCorta } from '@/lib/fechas';

interface Props {
  /** Fecha y hora sugeridas (por ej. si se abre desde un turno del tablero). */
  fechaInicial?: string;
  horaInicial?: string;
  sectorInicial?: string;
  onClose: () => void;
  onCreada: () => void;
}

const PERSONAS_OPCIONES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20];

export default function NuevaReservaModal({
  fechaInicial,
  horaInicial,
  sectorInicial,
  onClose,
  onCreada,
}: Props) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    personas: '2',
    fecha: fechaInicial || '',
    hora: horaInicial || '20:00',
    ubicacion: sectorInicial || UBICACIONES.ADENTRO,
    comentarios: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createReservationAdmin({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email || undefined,
        telefono: form.telefono,
        personas: parseInt(form.personas),
        fecha: form.fecha,
        hora: form.hora,
        ubicacion: form.ubicacion,
        comentarios: form.comentarios,
      });

      if (res.success) {
        if (res.avisos && res.avisos.length > 0) {
          // Mostramos los avisos un instante antes de cerrar, para que el
          // admin sepa que se forzó algo (turno pasado, cupo superado, etc).
          setAvisos(res.avisos);
          setTimeout(() => {
            onCreada();
            onClose();
          }, 2200);
        } else {
          onCreada();
          onClose();
        }
      } else {
        setError(res.error || 'Error al crear la reserva');
      }
    } catch {
      setError('Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-esperanza-700">📝 Nueva reserva</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-500 -mt-2">
            Cargada desde el panel: no bloquea por turno pasado, cierre manual ni cupo — solo
            avisa si corresponde.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {avisos.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm space-y-1">
              {avisos.map((a, i) => (
                <p key={i}>⚠️ {a}</p>
              ))}
              <p className="font-semibold">Reserva creada igual.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="form-input"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email (opcional)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Si no tiene, no se manda mail"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hora *</label>
              <input
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Personas</label>
              <select
                name="personas"
                value={form.personas}
                onChange={handleChange}
                className="form-input"
              >
                {PERSONAS_OPCIONES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Sector</label>
            <div className="grid grid-cols-2 gap-3">
              {[UBICACIONES.ADENTRO, UBICACIONES.VEREDA].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, ubicacion: valor }))}
                  className={`py-2.5 px-4 rounded-lg font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                    form.ubicacion === valor
                      ? 'bg-esperanza-600 border-esperanza-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-esperanza-300'
                  }`}
                >
                  <span>{UBICACIONES_ICONO[valor]}</span>
                  {UBICACIONES_LABEL[valor]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comentarios (opcional)</label>
            <textarea
              name="comentarios"
              value={form.comentarios}
              onChange={handleChange}
              className="form-input"
              rows={2}
            />
          </div>

          {form.fecha && form.hora && (
            <p className="text-xs text-gray-500">
              {formatearFechaCorta(form.fecha)} · {form.hora}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Guardando...' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
