'use client';

import { useState } from 'react';
import { createReservation } from '@/app/actions/reservations';

interface AvailableSlot {
  hora: string;
  disponible: boolean;
  personas_disponibles: number;
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
    comentarios: '',
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
    setLoading(true);
    setError(null);

    try {
      const response = await createReservation({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        personas: parseInt(formData.personas),
        fecha: new Date(formData.fecha),
        hora: formData.hora,
        comentarios: formData.comentarios,
      });

      if (response.success) {
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
            comentarios: '',
          });
          setStep('fecha');
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.error || 'Error al crear la reserva');
      }
    } catch (err) {
      setError('Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];

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
          {(['fecha', 'horario', 'datos'] as const).map((s, i) => (
            <div key={s} className="flex-1">
              <button
                type="button"
                onClick={() => s === 'fecha' && setStep('fecha')}
                className={`w-full py-2 rounded-lg font-semibold transition-all ${
                  step === s
                    ? 'bg-esperanza-600 text-white'
                    : ['fecha', 'horario', 'datos'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1}
              </button>
            </div>
          ))}
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
                      setFormData((prev) => ({ ...prev, hora: slot.hora }));
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
                    {!slot.disponible && <div className="text-xs">Lleno</div>}
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
                <span className="font-semibold">{new Date(formData.fecha).toLocaleDateString('es-ES')}</span> a las{' '}
                <span className="font-semibold">{formData.hora}</span>
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
