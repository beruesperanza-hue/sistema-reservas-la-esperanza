'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { DIAS_SEMANA_ORDEN } from '@/lib/constants';

interface Schedule {
  id: string;
  dia: string;
  hora: string;
  capacidad: number;
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
  const [newHora, setNewHora] = useState('20:00');
  const [newDia, setNewDia] = useState('lunes');

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

  const handleAddHorario = async () => {
    if (!newHora) return;

    try {
      const response = await fetch('/api/admin/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dia: newDia,
          hora: newHora,
          capacidad: settings?.capacidadPorTurno || 20,
        }),
      });

      if (response.ok) {
        await loadData();
        setNewHora('20:00');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const handleDeleteHorario = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;

    try {
      await fetch(`/api/admin/horarios/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
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
                    onChange={(e) =>
                      setSettings({ ...settings, nombreRestaurante: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={settings.emailRestaurante}
                    onChange={(e) =>
                      setSettings({ ...settings, emailRestaurante: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    value={settings.telefonoRestaurante}
                    onChange={(e) =>
                      setSettings({ ...settings, telefonoRestaurante: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    value={settings.direccionRestaurante}
                    onChange={(e) =>
                      setSettings({ ...settings, direccionRestaurante: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Capacidad por Turno</label>
                  <input
                    type="number"
                    value={settings.capacidadPorTurno}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        capacidadPorTurno: parseInt(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Días de Reserva Anticipada</label>
                  <input
                    type="number"
                    value={settings.diasAvanzados}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        diasAvanzados: parseInt(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary">
                <Save className="inline-block mr-2 w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}
        </div>

        {/* Gestión de Horarios */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-esperanza-700 mb-6">Horarios Disponibles</h2>

          {/* Agregar nuevo horario */}
          <div className="bg-esperanza-50 border border-esperanza-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-esperanza-700 mb-4">Agregar Nuevo Horario</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Día</label>
                <select
                  value={newDia}
                  onChange={(e) => setNewDia(e.target.value)}
                  className="form-input"
                >
                  {DIAS_SEMANA_ORDEN.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Hora</label>
                <input
                  type="time"
                  value={newHora}
                  onChange={(e) => setNewHora(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex items-end">
                <button onClick={handleAddHorario} className="btn btn-primary w-full">
                  <Plus className="inline-block mr-2 w-5 h-5" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de horarios por día */}
          <div className="space-y-6">
            {DIAS_SEMANA_ORDEN.map((dia) => {
              const horariosDelDia = horarios.filter((h) => h.dia === dia);
              if (horariosDelDia.length === 0) return null;

              return (
                <div key={dia} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{dia}</h3>
                  </div>
                  <div className="divide-y">
                    {horariosDelDia.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{h.hora}</p>
                          <p className="text-sm text-gray-600">Capacidad: {h.capacidad} personas</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteHorario(h.id)}
                            className="btn btn-small btn-danger flex gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
