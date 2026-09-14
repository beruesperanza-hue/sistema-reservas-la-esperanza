'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
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
  aceptaPedidosOnline: boolean;
  horarioPedidosDesde: string;
  horarioPedidosHasta: string;
  tiempoPreparacionMin: number;
  pedidoMinimo: number;
  aceptaEnvioDomicilio: boolean;
  costoEnvioCerca: number;
  costoEnvioLejos: number;
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
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner"></div>
            <p className="text-stone-500 text-sm mt-3">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mb-6">Configuración</h1>

        {/* Configuración General */}
        <div className="bg-white rounded-xl border border-esperanza-200/80 p-5 md:p-7 mb-5">
          <h2 className="text-lg font-bold text-esperanza-700 mb-5">Datos del restaurante</h2>

          {settings && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre del restaurante</label>
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
                  <label className="form-label">Días de reserva anticipada</label>
                  <input
                    type="number"
                    value={settings.diasAvanzados}
                    onChange={(e) => setSettings({ ...settings, diasAvanzados: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary">
                <Icon name="save" size={16} />
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          )}
        </div>

        {/* Pedidos online */}
        <div className="bg-white rounded-xl border border-esperanza-200/80 p-5 md:p-7 mb-5">
          <h2 className="text-lg font-bold text-esperanza-700 mb-5">Pedidos online</h2>

          {settings && (
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aceptaPedidosOnline}
                  onChange={(e) => setSettings({ ...settings, aceptaPedidosOnline: e.target.checked })}
                  className="w-5 h-5 accent-esperanza-700"
                />
                <span className="font-semibold text-esperanza-700">Aceptando pedidos online</span>
              </label>
              <p className="text-sm text-stone-500 -mt-4">
                Si lo desactivás, /pedidos deja de aceptar pedidos nuevos hasta que lo actives de nuevo.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Pedidos abren a las</label>
                  <input
                    type="time"
                    value={settings.horarioPedidosDesde}
                    onChange={(e) => setSettings({ ...settings, horarioPedidosDesde: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pedidos cierran a las</label>
                  <input
                    type="time"
                    value={settings.horarioPedidosHasta}
                    onChange={(e) => setSettings({ ...settings, horarioPedidosHasta: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tiempo de preparación (minutos)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.tiempoPreparacionMin}
                    onChange={(e) => setSettings({ ...settings, tiempoPreparacionMin: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pedido mínimo ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.pedidoMinimo}
                    onChange={(e) => setSettings({ ...settings, pedidoMinimo: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="border-t border-stone-100 pt-6 mt-2">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={settings.aceptaEnvioDomicilio}
                    onChange={(e) => setSettings({ ...settings, aceptaEnvioDomicilio: e.target.checked })}
                    className="w-5 h-5 accent-esperanza-700"
                  />
                  <span className="font-semibold text-esperanza-700">Ofrecer envío a domicilio</span>
                </label>
                <p className="text-sm text-stone-500 mb-4">
                  El cliente elige la zona en el checkout — no se calcula distancia automática.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Envío Villa Crespo y alrededores — $</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.costoEnvioCerca}
                      onChange={(e) => setSettings({ ...settings, costoEnvioCerca: parseInt(e.target.value) || 0 })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Envío Recoleta y alrededores — $</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.costoEnvioLejos}
                      onChange={(e) => setSettings({ ...settings, costoEnvioLejos: parseInt(e.target.value) || 0 })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary">
                <Icon name="save" size={16} />
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          )}
        </div>

        {/* Gestión de Horarios */}
        <div className="bg-white rounded-xl border border-esperanza-200/80 p-5 md:p-7">
          <h2 className="text-lg font-bold text-esperanza-700 mb-1">Horarios</h2>
          <p className="text-stone-500 text-sm mb-6">
            Qué turnos existen cada día y cuántas mesas hay en cada uno. La capacidad de salón y
            vereda se maneja por separado: si un turno no tiene mesas afuera, dejá la vereda en 0.
          </p>

          {/* Agregar nuevo horario */}
          <div className="bg-esperanza-50/70 border border-esperanza-200 rounded-xl p-4 md:p-5 mb-6">
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
                    className={`chip capitalize !text-sm ${nuevosDias.includes(dia) ? 'chip-on' : 'chip-off'}`}
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
              <Icon name="plus" size={16} strokeWidth={2.2} />
              {agregando ? 'Agregando...' : 'Agregar'}
            </button>
          </div>

          {/* Grilla semanal: horas x días */}
          {horas.length === 0 ? (
            <p className="text-center text-stone-500 py-8">Todavía no hay horarios cargados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 sticky left-0 bg-white text-[11px] uppercase tracking-[0.08em] text-stone-500 font-semibold">Hora</th>
                    {DIAS_SEMANA_ORDEN.map((dia) => (
                      <th key={dia} className="p-2 text-center text-[11px] uppercase tracking-[0.08em] font-semibold text-stone-500 min-w-[120px]">
                        {DIAS_SEMANA[dia as keyof typeof DIAS_SEMANA]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map((hora) => (
                    <tr key={hora} className="border-t border-esperanza-100">
                      <td className="p-2 font-extrabold text-esperanza-700 sticky left-0 bg-white tabular-nums">{hora}</td>
                      {DIAS_SEMANA_ORDEN.map((dia) => {
                        const h = celda(dia, hora);
                        if (!h) {
                          return (
                            <td key={dia} className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => agregarCelda(dia, hora)}
                                className="w-full h-full min-h-[64px] rounded-lg border border-dashed border-esperanza-200 text-esperanza-300 hover:border-esperanza-400 hover:text-esperanza-500 transition-all"
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
                                h.activo ? 'border-esperanza-200 bg-white' : 'border-stone-200 bg-stone-100/70 opacity-70'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-stone-400" title="Salón"><Icon name="home" size={13} /></span>
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={h.capacidad}
                                  onBlur={(e) => guardarCelda(h.id, { capacidad: parseInt(e.target.value) || 0 })}
                                  className="w-12 text-center text-xs font-semibold text-esperanza-700 border border-esperanza-200 rounded-md px-1 py-1"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-stone-400" title="Vereda"><Icon name="sun" size={13} /></span>
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={h.capacidadVereda}
                                  onBlur={(e) => guardarCelda(h.id, { capacidadVereda: parseInt(e.target.value) || 0 })}
                                  className="w-12 text-center text-xs font-semibold text-esperanza-700 border border-esperanza-200 rounded-md px-1 py-1"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => guardarCelda(h.id, { activo: !h.activo })}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    h.activo
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-stone-200 text-stone-600'
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
                                  className="text-stone-400 hover:text-red-700 p-1"
                                  title="Eliminar"
                                  aria-label="Eliminar turno"
                                >
                                  <Icon name="trash" size={13} />
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

          <p className="text-xs text-stone-500 mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Icon name="home" size={13} /> salón · <Icon name="sun" size={13} /> vereda (0 = sin mesas afuera ese turno).
            Para cerrar un turno puntual de una fecha, usá el interruptor del turno en Reservas.
          </p>
        </div>
      </main>
    </div>
  );
}
