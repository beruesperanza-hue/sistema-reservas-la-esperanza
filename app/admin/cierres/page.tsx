'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { crearCierre, eliminarCierre, listarCierres, type CierreListado } from '@/app/actions/cierres';
import { UBICACIONES, UBICACIONES_LABEL } from '@/lib/constants';
import { formatearFechaCorta, hoyEnBA } from '@/lib/fechas';

const VACIO = { desde: '', hasta: '', horaDesde: '', horaHasta: '', sector: '', motivo: '' };

/** "Del 2 al 9 de enero" / "El 25 de diciembre" */
function rango(desde: string, hasta: string): string {
  return desde === hasta ? formatearFechaCorta(desde) : `${formatearFechaCorta(desde)} → ${formatearFechaCorta(hasta)}`;
}

function franja(c: CierreListado): string {
  if (!c.horaDesde) return 'Todo el día';
  return c.horaHasta && c.horaHasta !== c.horaDesde ? `De ${c.horaDesde} a ${c.horaHasta}` : `Turno de ${c.horaDesde}`;
}

export default function CierresPage() {
  const [cierres, setCierres] = useState<CierreListado[] | null>(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    try {
      setCierres(await listarCierres());
    } catch {
      setError('Tu sesión venció. Volvé a entrar.');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo: keyof typeof VACIO, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = async () => {
    setGuardando(true);
    setError('');
    setAviso('');
    try {
      const res = await crearCierre(form);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setForm(VACIO);
      setAviso(
        res.afectadas > 0
          ? `Cierre guardado. Ojo: hay ${res.afectadas} ${res.afectadas === 1 ? 'reserva ya confirmada' : 'reservas ya confirmadas'} dentro de ese período. No se cancelan solas — avisales vos.`
          : 'Cierre guardado. Nadie va a poder reservar en ese período.'
      );
      cargar();
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (c: CierreListado) => {
    if (!confirm(`¿Reabrir ${rango(c.desde, c.hasta)}?`)) return;
    await eliminarCierre(c.id);
    setAviso('');
    cargar();
  };

  const hoy = hoyEnBA();
  const proximos = (cierres || []).filter((c) => !c.pasado);
  const viejos = (cierres || []).filter((c) => c.pasado);

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> Volver a configuración
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-1">Cierres programados</h1>
        <p className="text-stone-500 text-sm mb-6">
          Vacaciones, feriados o una noche privada. En esas fechas la web deja de aceptar reservas, sin tocar los
          horarios de siempre.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}
        {aviso && (
          <div className="bg-esperanza-50 border border-esperanza-200 text-esperanza-700 text-sm rounded-lg px-4 py-3 mb-4">
            {aviso}
          </div>
        )}

        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">Cerrar un período</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="desde">Desde *</label>
              <input
                id="desde"
                type="date"
                min={hoy}
                className="form-input"
                value={form.desde}
                onChange={(e) => cambiar('desde', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="hasta">Hasta</label>
              <input
                id="hasta"
                type="date"
                min={form.desde || hoy}
                className="form-input"
                value={form.hasta}
                onChange={(e) => cambiar('hasta', e.target.value)}
              />
              <p className="text-xs text-stone-500 mt-1">Vacío = un solo día.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="form-group">
              <label className="form-label" htmlFor="horaDesde">Desde la hora</label>
              <input
                id="horaDesde"
                type="time"
                className="form-input"
                value={form.horaDesde}
                onChange={(e) => cambiar('horaDesde', e.target.value)}
              />
              <p className="text-xs text-stone-500 mt-1">Vacío = todo el día.</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="horaHasta">Hasta la hora</label>
              <input
                id="horaHasta"
                type="time"
                className="form-input"
                value={form.horaHasta}
                onChange={(e) => cambiar('horaHasta', e.target.value)}
                disabled={!form.horaDesde}
              />
            </div>
          </div>

          <div className="mt-4">
            <span className="form-label">Sector</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { valor: '', label: 'Todo el local' },
                { valor: UBICACIONES.ADENTRO, label: UBICACIONES_LABEL[UBICACIONES.ADENTRO] },
                { valor: UBICACIONES.VEREDA, label: UBICACIONES_LABEL[UBICACIONES.VEREDA] },
              ].map((o) => (
                <button
                  key={o.valor || 'todo'}
                  type="button"
                  onClick={() => cambiar('sector', o.valor)}
                  className={`chip ${form.sector === o.valor ? 'chip-on' : 'chip-off'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label" htmlFor="motivo">Motivo (lo ven solo ustedes)</label>
            <input
              id="motivo"
              type="text"
              className="form-input"
              placeholder="Vacaciones, evento privado, feriado…"
              value={form.motivo}
              onChange={(e) => cambiar('motivo', e.target.value)}
            />
          </div>

          <button className="btn btn-primary mt-5" onClick={guardar} disabled={guardando || !form.desde}>
            <Icon name="ban" size={16} />
            {guardando ? 'Guardando...' : 'Cerrar este período'}
          </button>
        </div>

        <h2 className="text-lg font-bold mb-3">Cierres cargados</h2>

        {cierres === null ? (
          <div className="text-center py-10">
            <div className="spinner" />
          </div>
        ) : proximos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-esperanza-200">
            <Icon name="calendar" size={34} strokeWidth={1.4} className="mx-auto mb-3 text-esperanza-300" />
            <p className="text-stone-500">No hay cierres programados. El local toma reservas con normalidad.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((c) => (
              <div key={c.id} className="card !p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-bold text-esperanza-700">{rango(c.desde, c.hasta)}</p>
                  <p className="text-sm text-stone-500">
                    {franja(c)} ·{' '}
                    {c.sector ? UBICACIONES_LABEL[c.sector] || c.sector : 'Todo el local'}
                    {c.motivo ? ` · ${c.motivo}` : ''}
                  </p>
                  {c.afectadas > 0 && (
                    <p className="badge bg-amber-100 text-amber-800 mt-2">
                      {c.afectadas} {c.afectadas === 1 ? 'reserva confirmada adentro' : 'reservas confirmadas adentro'}
                    </p>
                  )}
                </div>
                <button className="btn btn-danger btn-small" onClick={() => borrar(c)}>
                  <Icon name="trash" size={14} />
                  Reabrir
                </button>
              </div>
            ))}
          </div>
        )}

        {viejos.length > 0 && (
          <details className="mt-6">
            <summary className="text-sm text-stone-500 cursor-pointer">Cierres que ya pasaron ({viejos.length})</summary>
            <div className="space-y-2 mt-3">
              {viejos.map((c) => (
                <div key={c.id} className="card !p-3 flex items-center justify-between gap-3 opacity-70">
                  <p className="text-sm">
                    {rango(c.desde, c.hasta)} · <span className="text-stone-500">{franja(c)}</span>
                  </p>
                  <button className="btn btn-secondary btn-small" onClick={() => borrar(c)}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
