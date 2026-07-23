'use client';

import { useRef, useState } from 'react';
import { createReservation } from '@/app/actions/reservations';
import { UBICACIONES, UBICACIONES_ICONO, UBICACIONES_LABEL } from '@/lib/constants';
import { formatearFechaLarga, hoyEnBA, sumarDias } from '@/lib/fechas';
import { trackEvent } from '@/lib/analytics';

interface SectorSlot {
  disponible: boolean;
  libres: number;
  cerrado: boolean;
  /** Solo vereda: si el turno directamente no tiene mesas afuera. */
  existe?: boolean;
}

interface AvailableSlot {
  hora: string;
  disponible: boolean;
  pasado?: boolean;
  salon: SectorSlot;
  vereda: SectorSlot;
}

export default function ReservationForm() {
  const [step, setStep] = useState<'fecha' | 'horario' | 'datos' | 'confirmacion'>('fecha');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    personas: '2',
    fecha: '',
    hora: '',
    ubicacion: UBICACIONES.ADENTRO as string,
    comentarios: '',
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Guard síncrono: el estado `loading` se aplica recién en el próximo render,
  // así que un doble-click puede disparar handleSubmit dos veces antes de que
  // el botón se deshabilite. Un ref se lee/escribe al instante y cierra esa
  // ventana de carrera.
  const submittingRef = useRef(false);

  // Slot elegido en el paso 2: permite mostrar cupos por sector en el paso 3.
  const selectedSlot = availableSlots.find((s) => s.hora === formData.hora);

  const handleDateSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value;
    setFormData((prev) => ({ ...prev, fecha, hora: '' }));
    setError(null);

    if (!fecha) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/disponibilidad?fecha=${fecha}&personas=${formData.personas}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cargar horarios disponibles');
        setAvailableSlots([]);
      } else {
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await createReservation({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        personas: parseInt(formData.personas),
        fecha: formData.fecha,
        hora: formData.hora,
        ubicacion: formData.ubicacion,
        comentarios: formData.comentarios,
      });

      if (response.success) {
        trackEvent('reserva_enviada', {
          personas: formData.personas,
          ubicacion: formData.ubicacion,
        });
        setSuccess(true);
        setStep('confirmacion');
        setTimeout(() => {
          setFormData({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            personas: '2',
            fecha: '',
            hora: '',
            ubicacion: UBICACIONES.ADENTRO as string,
            comentarios: '',
          });
          setStep('fecha');
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.error || 'Error al crear la reserva');
        // Puede que el cupo haya cambiado entre que se cargó la grilla y se
        // confirmó (otra persona reservó mientras tanto) — refrescamos.
        refrescarDisponibilidad();
      }
    } catch (err) {
      setError('Error al procesar la reserva');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const refrescarDisponibilidad = async () => {
    if (!formData.fecha) return;
    try {
      const response = await fetch(
        `/api/disponibilidad?fecha=${formData.fecha}&personas=${formData.personas}`
      );
      const data = await response.json();
      if (response.ok) setAvailableSlots(data.slots || []);
    } catch {
      // silencioso: si falla el refresco, el usuario igual ve el mensaje de error del submit
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hoy en Buenos Aires: si usáramos la fecha del navegador en UTC, después de
  // las 21 hs de acá el calendario ya no dejaría reservar para hoy.
  const today = hoyEnBA();
  const maxDateStr = sumarDias(today, 60);

  return (
    <div className="w-full">
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 animate-fade-in">
          <span className="text-2xl flex-shrink-0 mt-0.5">✅</span>
          <div>
            <h3 className="font-semibold text-green-900">¡Reserva Confirmada!</h3>
            <p className="text-green-700 text-sm">Te hemos enviado un email de confirmación.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 animate-fade-in">
          <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          {(['fecha', 'horario', 'datos'] as const).map((s, i) => {
            const labels = ['Fecha', 'Horario', 'Datos'];
            return (
              <div key={s} className="flex-1">
                <button
                  type="button"
                  onClick={() => s === 'fecha' && setStep('fecha')}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    step === s
                      ? 'bg-esperanza-600 text-white'
                      : ['fecha', 'horario', 'datos'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-lg">{i + 1}</span>
                  <span className="text-xs font-normal">{labels[i]}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Step 1: Date Selection */}
        {step === 'fecha' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-esperanza-700 flex gap-2 font-serif">
              📅 Selecciona una fecha
            </h3>

            <div>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleDateSelect}
                min={today}
                max={maxDateStr}
                className="form-input"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Puedes reservar hasta 60 días en avance</p>
            </div>

            {formData.fecha && (
              <button
                type="button"
                onClick={() => setStep('horario')}
                className="btn btn-primary w-full"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 'horario' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-esperanza-700 flex gap-2 font-serif">
              🕐 Selecciona un horario
            </h3>

            <div>
              <label className="form-label">Cantidad de personas</label>
              <select
                name="personas"
                value={formData.personas}
                onChange={handleInputChange}
                className="form-input"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </select>
            </div>

            {loadingSlots ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-2">Cargando horarios disponibles...</p>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => {
                      // Preferimos el salón si hay lugar; si no, vereda.
                      const ubicacion = slot.salon.disponible
                        ? UBICACIONES.ADENTRO
                        : UBICACIONES.VEREDA;
                      setFormData((prev) => ({ ...prev, hora: slot.hora, ubicacion }));
                      setStep('datos');
                    }}
                    disabled={!slot.disponible}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      slot.disponible
                        ? 'bg-esperanza-100 text-esperanza-700 hover:bg-esperanza-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.hora}
                    {!slot.disponible && (
                      <div className="text-xs">{slot.pasado ? 'Ya pasó' : 'Lleno'}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                No hay horarios disponibles para esta fecha
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('fecha')} className="btn btn-secondary flex-1">
                Atrás
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Personal Data */}
        {step === 'datos' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-esperanza-700 flex gap-2 font-serif">
              👤 Completa tus datos
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Tu nombre"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="+54-11-XXXX-XXXX"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">¿Dónde preferís sentarte?</label>
              <div className="grid grid-cols-2 gap-3">
                {[UBICACIONES.ADENTRO, UBICACIONES.VEREDA].map((valor) => {
                  const sector = valor === UBICACIONES.VEREDA ? selectedSlot?.vereda : selectedSlot?.salon;
                  // Sin datos de disponibilidad (no debería pasar en el flujo normal) → no bloqueamos.
                  const bloqueado = sector ? !sector.disponible : false;
                  const sinVereda = valor === UBICACIONES.VEREDA && sector?.existe === false;

                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, ubicacion: valor }))}
                      disabled={bloqueado}
                      className={`py-3 px-4 rounded-lg font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        bloqueado
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : formData.ubicacion === valor
                          ? 'bg-esperanza-600 border-esperanza-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-esperanza-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{UBICACIONES_ICONO[valor]}</span>
                        {UBICACIONES_LABEL[valor]}
                      </span>
                      {sector && (
                        <span className="text-xs font-normal opacity-80">
                          {sinVereda
                            ? 'No disponible'
                            : sector.cerrado
                            ? 'Cerrado'
                            : bloqueado
                            ? 'Completo'
                            : `${sector.libres} lugares`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {formData.ubicacion === UBICACIONES.VEREDA && (
                <p className="text-xs text-gray-500 mt-2">
                  Las mesas de la vereda están sujetas a disponibilidad y al clima. Si llueve
                  te reubicamos adentro.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Comentarios (opcional)</label>
              <textarea
                name="comentarios"
                value={formData.comentarios}
                onChange={handleInputChange}
                className="form-input"
                rows={3}
                placeholder="Alergias, preferencias, celebración especial, etc..."
              />
            </div>

            {/* Summary */}
            <div className="bg-esperanza-50 p-4 rounded-lg border border-esperanza-200">
              <p className="text-sm text-esperanza-700">
                <span className="font-semibold">{formData.personas} personas</span> el{' '}
                <span className="font-semibold">{formatearFechaLarga(formData.fecha)}</span> a las{' '}
                <span className="font-semibold">{formData.hora}</span>,{' '}
                <span className="font-semibold">{UBICACIONES_LABEL[formData.ubicacion]}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('horario')} className="btn btn-secondary flex-1">
                Atrás
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Confirmando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
