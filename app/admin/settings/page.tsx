'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { DIAS_SEMANA, DIAS_SEMANA_ORDEN } from '@/lib/constants';

interface Schedule {
  id: string;
  dia: string;
  hora: string;
  capacidad: number; // salón
  capacidadVereda: number;
  activo: boolean;
}

interface Settings {
  capacidadPorTurno: number;
  diasAvanzados: number;
  nombreRestaurante: string;
  emailRestaurante: string;
  telefonoRestaurante: string;
  direccionRestaurante: string;
}

export default function SettingsPage() {
  const [horarios, setHorarios] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form para agregar un horario nuevo (a uno o varios días a la vez)
  const [nuevaHora, setNuevaHora] = useState('20:00');
  const [nuevosDias, setNuevosDias] = useState<string[]>([]);
  const [nuevaCapSalon, setNuevaCapSalon] = useState(20);
  const [nuevaCapVereda, setNuevaCapVereda] = useState(0);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [horariosRes, settingsRes] = await Promise.all([
        fetch('/api/admin/horarios'),
        fetch('/api/admin/configuracion'),
      ]);

      const horariosData = await horariosRes.json();
      const settingsData = await settingsRes.json();

      setHorarios(horariosData.horarios || []);
      setSettings(settingsData.settings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filas de la grilla: todas las horas que existan en algún día, ordenadas.
  const horas = useMemo(
    () => Array.from(new Set(horarios.map((h) => h.hora))).sort(),
    [horarios]
  );

  const celda = (dia: string, hora: string) => horarios.find((h) => h.dia === dia && h.hora === hora);

  const guardarCelda = async (id: string, cambios: Partial<Schedule>) => {
    // Actualización optimista para que se sienta instantáneo.
    setHorarios((prev) => prev.map((h) => (h.id === id ? { ...h, ...cambios } : h)));
    await fetch(`/api/admin/horarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });
  };

  const eliminarCelda = async (id: string) => {
    setHorarios((prev) => prev.filter((h) => h.id !== id));
    await fetch(`/api/admin/horarios/${id}`, { method: 'DELETE' });
  };

  const agregarCelda = async (dia: string, hora: string) => {
    const res = await fetch('/api/admin/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia,
        hora,
        capacidad: settings?.capacidadPorTurno || 20,
        capacidadVereda: 0,
      }),
    });
    const data = await res.json();
    if (data.horario) setHorarios((prev) => [...prev, data.horario]);
  };

  const handleAgregarHorario = async () => {
    if (!nuevaHora || nuevosDias.length === 0) return;
    setAgregando(true);
    try {
      for (const dia of nuevosDias) {
        const res = await fetch('/api/admin/horarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dia,
            hora: nuevaHora,
            capacidad: nuevaCapSalon,
            capacidadVereda: nuevaCapVereda,
          }),
        });
        const data = await res.json();
        if (data.horario) setHorarios((prev) => [...prev.filter((h) => h.id !== data.horario.id), data.horario]);
      }
      setNuevosDias([]);
    } finally {
      setAgregando(false);
    }
  };

  const toggleDia = (dia: string) => {
    setNuevosDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const response = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Configuración guardada');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-bold text-esperanza-700 mb-8">Configuración</h1>

        {/* Configuración General */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-esperanza-700 mb-6">Configuración del Restaurante</h2>

          {settings && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre del Restaurante</label>
                  <input
                    type="text"
                    value={settings.nombreRestaurante}
                    onChange={(e) => setSettings({ ...settings, nombreRestaurante: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={settings.emailRestaurante}
                    onChange={(e) => setSettings({ ...settings, emailRestaurante: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    value={settings.telefonoRestaurante}
                    onChange={(e) => setSettings({ ...settings, telefonoRestaurante: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    value={settings.direccionRestaurante}
                    onChange={(e) => setSettings({ ...settings, direccionRestaurante: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Días de Reserva Anticipada</label>
                  <input
                    type="number"
                    value={settings.diasAvanzados}
                    onChange={(e) => setSettings({ ...settings, diasAvanzados: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary">
                💾 {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}
        </div>

        {/* Gestión de Horarios */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-esperanza-700 mb-2">Horarios</h2>
          <p className="text-gray-500 text-sm mb-6">
            Qué turnos existen cada día y cuántas mesas hay en cada uno. La capacidad de salón y
            vereda se maneja por separado: si un turno no tiene mesas afuera, dejá la vereda en 0.
          </p>

          {/* Agregar nuevo horario */}
          <div className="bg-esperanza-50 border border-esperanza-200 rounded-lg p-5 mb-8">
            <h3 className="font-semibold text-esperanza-700 mb-3 text-sm">Agregar horario nuevo</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="form-label text-xs">Hora</label>
                <input
                  type="time"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label text-xs">Capacidad salón</label>
                <input
                  type="number"
                  min={0}
                  value={nuevaCapSalon}
                  onChange={(e) => setNuevaCapSalon(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label text-xs">Capacidad vereda</label>
                <input
                  type="number"
                  min={0}
                  value={nuevaCapVereda}
                  onChange={(e) => setNuevaCapVereda(parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label text-xs">Días</label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA_ORDEN.map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(dia)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
                      nuevosDias.includes(dia)
                        ? 'bg-esperanza-600 border-esperanza-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-esperanza-300'
                    }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAgregarHorario}
              disabled={agregando || nuevosDias.length === 0}
              className="btn btn-primary"
            >
              ➕ {agregando ? 'Agregando...' : 'Agregar'}
            </button>
          </div>

          {/* Grilla semanal: horas x días */}
          {horas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Todavía no hay horarios cargados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 sticky left-0 bg-white">Hora</th>
                    {DIAS_SEMANA_ORDEN.map((dia) => (
                      <th key={dia} className="p-2 text-center font-semibold text-gray-600 capitalize min-w-[130px]">
                        {DIAS_SEMANA[dia as keyof typeof DIAS_SEMANA]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map((hora) => (
                    <tr key={hora} className="border-t border-gray-100">
                      <td className="p-2 font-semibold text-esperanza-700 sticky left-0 bg-white">{hora}</td>
                      {DIAS_SEMANA_ORDEN.map((dia) => {
                        const h = celda(dia, hora);
                        if (!h) {
                          return (
                            <td key={dia} className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => agregarCelda(dia, hora)}
                                className="w-full h-full min-h-[64px] rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-esperanza-300 hover:text-esperanza-400 transition-all"
                                title="Agregar este turno para este día"
                              >
                                +
                              </button>
                            </td>
                          );
                        }
                        return (
                          <td key={dia} className="p-1">
                            <div
                              className={`rounded-lg border p-2 ${
                                h.activo ? 'border-esperanza-200 bg-esperanza-50/40' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] text-gray-500">🏠</span>
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={h.capacidad}
                                  onBlur={(e) => guardarCelda(h.id, { capacidad: parseInt(e.target.value) || 0 })}
                                  className="w-12 text-center text-xs border border-gray-200 rounded px-1 py-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] text-gray-500">☀️</span>
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={h.capacidadVereda}
                                  onBlur={(e) => guardarCelda(h.id, { capacidadVereda: parseInt(e.target.value) || 0 })}
                                  className="w-12 text-center text-xs border border-gray-200 rounded px-1 py-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => guardarCelda(h.id, { activo: !h.activo })}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    h.activo
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-500'
                                  }`}
                                  title={h.activo ? 'Click para desactivar' : 'Click para activar'}
                                >
                                  {h.activo ? 'Activo' : 'Inactivo'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('¿Eliminar este turno de este día?')) eliminarCelda(h.id);
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-700 px-1"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            🏠 = capacidad de salón · ☀️ = capacidad de vereda (0 = sin mesas afuera ese turno).
            Para bloquear un turno puntual (una fecha específica, no todos los días), usá el botón
            &quot;Cerrar&quot; desde el Dashboard del día correspondiente.
          </p>
        </div>
      </main>
    </div>
  );
}
