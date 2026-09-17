'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { obtenerPanelMarketing } from '@/app/actions/marketing';

type Panel = Extract<Awaited<ReturnType<typeof obtenerPanelMarketing>>, { success: true }>;

const ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-stone-100 text-stone-600' },
  enviando: { texto: 'Enviando', clase: 'bg-amber-100 text-amber-800' },
  enviada: { texto: 'Enviada', clase: 'bg-green-100 text-green-800' },
};

const n = (x: number) => x.toLocaleString('es-AR');

export default function MarketingPage() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPanelMarketing().then((r) => (r.success ? setPanel(r) : setError(r.error)));
  }, []);

  const a = panel?.audiencia;
  const invitacionEnCurso = panel?.campanias.some((c) => c.tipo === 'invitacion' && c.estado !== 'enviada');

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">Marketing</h1>
            <p className="text-stone-500 text-sm mt-1">Mails a los clientes del CRM, siempre con su consentimiento.</p>
          </div>
          <Link href="/admin/marketing/nueva" className="btn btn-primary">
            <Icon name="plus" size={16} strokeWidth={2.2} />
            Nueva campaña
          </Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

        {!panel ? (
          !error && (
            <div className="text-center py-12">
              <div className="spinner" />
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Kpi valor={a!.suscriptos} etiqueta="Suscriptos" detalle="Pueden recibir campañas" destacado />
              <Kpi valor={a!.invitables} etiqueta="Sin responder" detalle="Nunca les preguntamos" />
              <Kpi valor={a!.dadosDeBaja} etiqueta="Dados de baja" detalle="No se les escribe más" />
              <Kpi
                valor={a!.enviadosHoy}
                etiqueta="Enviados hoy"
                detalle={`De ${n(panel.limiteDiario)} por día`}
              />
            </div>

            {a!.invitables > 0 && !invitacionEnCurso && (
              <div className="card mb-6 border-esperanza-300 bg-esperanza-50/60">
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  <div className="flex-1 min-w-[240px]">
                    <p className="font-bold text-esperanza-800">
                      Solo {n(a!.suscriptos)} de tus {n(a!.conEmail)} clientes con mail aceptaron recibir novedades
                    </p>
                    <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                      A los otros <strong>{n(a!.invitables)}</strong> nunca se les preguntó, así que no se les pueden mandar
                      campañas. Mandales <strong>una única invitación</strong> para que se suscriban: quien acepta entra a la
                      lista y al resto no se le vuelve a escribir.{' '}
                      {a!.invitables > panel.limiteDiario ? (
                        <>
                          Por el límite diario, el envío se completa en unos{' '}
                          <strong>{Math.ceil(a!.invitables / panel.limiteDiario)} días</strong>.
                        </>
                      ) : (
                        <>Entra completo en el cupo de un día.</>
                      )}
                    </p>
                  </div>
                  <Link href="/admin/marketing/nueva?tipo=invitacion" className="btn btn-primary whitespace-nowrap">
                    <Icon name="mail" size={16} />
                    Preparar invitación
                  </Link>
                </div>
              </div>
            )}

            <h2 className="font-bold text-lg mb-3">Campañas</h2>
            {panel.campanias.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl border border-dashed border-esperanza-200">
                <p className="text-stone-500">Todavía no hay campañas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {panel.campanias.map((c) => {
                  const estado = ESTADO[c.estado] ?? ESTADO.borrador;
                  return (
                    <Link
                      key={c.id}
                      href={`/admin/marketing/${c.id}`}
                      className="card !p-4 md:!p-5 flex items-center justify-between gap-4 flex-wrap hover:border-esperanza-400 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                          <span className="badge bg-esperanza-100 text-esperanza-700">
                            {c.tipo === 'invitacion' ? 'Invitación' : c.segmentNombre ?? 'Todos los suscriptos'}
                          </span>
                        </div>
                        <p className="font-bold mt-1.5 truncate">{c.nombre}</p>
                        <p className="text-sm text-stone-500 truncate">{c.asunto}</p>
                      </div>
                      <div className="text-right text-sm">
                        {c.estado === 'borrador' ? (
                          <p className="text-stone-400">Sin enviar</p>
                        ) : (
                          <>
                            <p className="font-semibold tabular-nums">
                              {n(c.enviados)} <span className="text-stone-400 font-normal">/ {n(c.destinatarios)}</span>
                            </p>
                            <p className="text-xs text-stone-400">
                              {c.fallidos ? `${n(c.fallidos)} fallidos · ` : ''}
                              {new Date(c.enviadaEn ?? c.createdAt).toLocaleDateString('es-AR')}
                            </p>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ valor, etiqueta, detalle, destacado }: { valor: number; etiqueta: string; detalle: string; destacado?: boolean }) {
  return (
    <div className={`card !p-4 ${destacado ? 'border-esperanza-300' : ''}`}>
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className={`text-2xl md:text-3xl font-extrabold tabular-nums mt-1 ${destacado ? 'text-esperanza-700' : 'text-stone-800'}`}>
        {n(valor)}
      </p>
      <p className="text-xs text-stone-400 mt-0.5">{detalle}</p>
    </div>
  );
}
