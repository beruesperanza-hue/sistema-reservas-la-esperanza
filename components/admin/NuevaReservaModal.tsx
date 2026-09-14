'use client';

import { useState } from 'react';
import { createReservationAdmin } from '@/app/actions/reservations';
import { PERSONAS_OPCIONES, UBICACIONES, UBICACIONES_LABEL } from '@/lib/constants';
import Icon from './Icon';
import { formatearFechaCorta } from '@/lib/fechas';

interface Props {
  /** Fecha y hora sugeridas (por ej. si se abre desde un turno del tablero). */
  fechaInicial?: string;
  horaInicial?: string;
  sectorInicial?: string;
  onClose: () => void;
  onCreada: () => void;
}

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
    <div className="fixed inset-0 bg-esperanza-900/60 backdrop-blur-[2px] z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-esperanza-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-esperanza-700">Nueva reserva</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center text-stone-400 hover:text-esperanza-700 hover:bg-esperanza-50"
            aria-label="Cerrar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-500 bg-esperanza-50 rounded-lg px-3 py-2">
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
                <p key={i} className="flex items-start gap-2"><Icon name="alert" size={15} className="mt-0.5" />{a}</p>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
                    form.ubicacion === valor
                      ? 'bg-esperanza-700 border-esperanza-700 text-sand'
                      : 'bg-white border-esperanza-200 text-esperanza-700 hover:border-esperanza-300'
                  }`}
                >
                  <Icon name={valor === UBICACIONES.VEREDA ? 'sun' : 'home'} size={16} />
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
            <p className="text-xs text-stone-500">
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
