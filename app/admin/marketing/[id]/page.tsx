'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import {
  eliminarBorrador,
  enviarTanda,
  iniciarEnvio,
  obtenerCampania,
  reintentarFallidos,
} from '@/app/actions/marketing';

type Detalle = Extract<Awaited<ReturnType<typeof obtenerCampania>>, { success: true }>;

const ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-stone-100 text-stone-600' },
  enviando: { texto: 'Enviando', clase: 'bg-amber-100 text-amber-800' },
  enviada: { texto: 'Enviada', clase: 'bg-green-100 text-green-800' },
};

const n = (x: number) => x.toLocaleString('es-AR');

export default function CampaniaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<Detalle | null>(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const pausar = useRef(false);

  const cargar = useCallback(async () => {
    const r = await obtenerCampania(id);
    if (r.success) setD(r);
    else setError(r.error);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si se cierra o recarga la pestaña en pleno envío, avisar: el envío queda pausado.
  useEffect(() => {
    if (!enviando) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [enviando]);

  const enviar = async () => {
    if (!d) return;
    setError('');
    setAviso('');

    if (d.campania.estado === 'borrador') {
      const cantidad = d.destinatariosPrevistos;
      const texto =
        d.campania.tipo === 'invitacion'
          ? `¿Mandar la invitación a ${n(cantidad)} clientes? Cada uno la recibe una sola vez.`
          : `¿Mandar esta campaña a ${n(cantidad)} personas?`;
      if (!confirm(texto)) return;

      const inicio = await iniciarEnvio(id);
      if (!inicio.success) return setError(inicio.error);
    }

    pausar.current = false;
    setEnviando(true);

    try {
      // Tandas cortas en loop: si una request se corta, lo ya enviado quedó
      // registrado y se sigue desde el siguiente pendiente.
      for (;;) {
        const r = await enviarTanda(id);
        if (!r.success) {
          setError(r.error);
          break;
        }
        await cargar();
        if (r.terminado) {
          setAviso('¡Listo! La campaña terminó de enviarse.');
          break;
        }
        if (r.frenadoPorCupo) {
          setAviso(
            `Se alcanzó el límite de hoy (${d.limiteDiario} mails). Quedan ${n(r.pendientes)} pendientes: mañana entrá acá y tocá “Continuar envío”.`
          );
          break;
        }
        if (pausar.current) {
          setAviso(`Envío pausado. Quedan ${n(r.pendientes)} pendientes.`);
          break;
        }
      }
    } finally {
      setEnviando(false);
      await cargar();
    }
  };

  const borrar = async () => {
    if (!confirm('¿Borrar este borrador? No se envió a nadie.')) return;
    const r = await eliminarBorrador(id);
    if (!r.success) return setError(r.error);
    router.push('/admin/marketing');
  };

  const reintentar = async () => {
    const r = await reintentarFallidos(id);
    if (!r.success) return setError(r.error);
    setAviso(r.reencolados ? `${n(r.reencolados)} vuelven a la cola. Tocá “Continuar envío”.` : 'No hay fallidos para reintentar.');
    await cargar();
  };

  if (!d) {
    return (
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <main className="container mx-auto px-4 py-10 max-w-5xl">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          ) : (
            <div className="spinner" />
          )}
        </main>
      </div>
    );
  }

  const c = d.campania;
  const total = c.estado === 'borrador' ? d.destinatariosPrevistos : c.destinatarios;
  const procesados = d.enviados + d.fallidos + d.omitidos;
  const avance = total ? Math.round((procesados / total) * 100) : 0;
  const estado = ESTADO[c.estado] ?? ESTADO.borrador;
  const diasRestantes = d.pendientes ? Math.ceil(d.pendientes / d.limiteDiario) : 0;

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
        <Link href="/admin/marketing" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a marketing
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mt-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`badge ${estado.clase}`}>{estado.texto}</span>
              <span className="badge bg-esperanza-100 text-esperanza-700">
                {c.tipo === 'invitacion' ? 'Invitación' : c.segmentNombre ? `Segmento: ${c.segmentNombre}` : 'Todos los suscriptos'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">{c.nombre}</h1>
            <p className="text-stone-500 mt-1">Asunto: {c.asunto}</p>
          </div>

          {c.estado === 'borrador' && !enviando && (
            <div className="flex gap-2">
              <Link href={`/admin/marketing/${id}/editar`} className="btn btn-secondary btn-small">
                Editar
              </Link>
              <button className="btn btn-danger btn-small" onClick={borrar} aria-label="Borrar borrador">
                <Icon name="trash" size={14} />
              </button>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
        {aviso && <div className="bg-esperanza-50 border border-esperanza-200 text-esperanza-800 text-sm rounded-lg px-4 py-3 mb-5">{aviso}</div>}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
          <div className="space-y-5">
            <div className="card">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <Numero valor={total} etiqueta={c.estado === 'borrador' ? 'Le llega a' : 'Destinatarios'} />
                <Numero valor={d.enviados} etiqueta="Enviados" tono="text-green-700" />
                <Numero valor={d.pendientes} etiqueta="Pendientes" tono="text-amber-700" />
                <Numero valor={d.fallidos} etiqueta="Fallidos" tono={d.fallidos ? 'text-red-700' : undefined} />
              </div>

              {c.estado !== 'borrador' && (
                <div className="mt-5">
                  <div className="h-2.5 rounded-full bg-esperanza-100 overflow-hidden">
                    <div className="h-full bg-esperanza-500 transition-all duration-500" style={{ width: `${avance}%` }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    {avance}% procesado
                    {d.omitidos > 0 && (
                      <>
                        {' · '}
                        {n(d.omitidos)} no {d.omitidos === 1 ? 'lo recibió porque se dio' : 'lo recibieron porque se dieron'} de
                        baja antes
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            {c.estado !== 'enviada' && (
              <div className="card space-y-3">
                <p className="text-sm text-stone-600">
                  Hoy podés mandar <strong>{n(d.cupoRestanteHoy)}</strong> mails más (límite {d.limiteDiario} por día, para no
                  trabar las confirmaciones de reservas).
                  {total > d.cupoRestanteHoy && c.estado === 'borrador' && (
                    <> Esta campaña se va a completar en unos <strong>{Math.ceil(total / d.limiteDiario)} días</strong>.</>
                  )}
                  {c.estado === 'enviando' && diasRestantes > 1 && (
                    <> Faltan unos <strong>{diasRestantes} días</strong> para terminar.</>
                  )}
                </p>

                {total === 0 && c.estado === 'borrador' ? (
                  <p className="text-sm text-amber-800">No hay a quién mandarle esta campaña.</p>
                ) : enviando ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="spinner !w-5 !h-5" />
                    <span className="text-sm font-semibold text-esperanza-700">Enviando… no cierres esta pantalla</span>
                    <button className="btn btn-secondary btn-small ml-auto" onClick={() => (pausar.current = true)}>
                      Pausar
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={enviar} disabled={d.cupoRestanteHoy === 0}>
                    <Icon name="mail" size={16} />
                    {c.estado === 'borrador' ? `Enviar a ${n(total)} ${total === 1 ? 'persona' : 'personas'}` : 'Continuar envío'}
                  </button>
                )}
                {d.cupoRestanteHoy === 0 && !enviando && (
                  <p className="text-xs text-stone-500">Ya se usó el cupo de hoy. Mañana se habilita de nuevo.</p>
                )}
              </div>
            )}

            {d.fallidos > 0 && !enviando && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-sm">Fallidos</p>
                  <button className="btn btn-secondary btn-small" onClick={reintentar}>
                    Reintentar
                  </button>
                </div>
                <ul className="divide-y divide-esperanza-100 text-sm max-h-72 overflow-auto">
                  {d.fallidosDetalle.map((f, i) => (
                    <li key={i} className="py-2">
                      <p className="font-medium break-all">{f.email}</p>
                      <p className="text-xs text-stone-500 break-words">{f.error}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.enviadaEn && (
              <p className="text-xs text-stone-400">
                Terminó de enviarse el {new Date(c.enviadaEn).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-600">Así le llega a un cliente</p>
            <div className="rounded-xl overflow-hidden border border-esperanza-200/80 bg-[#f6f1e7]">
              <iframe title="Vista previa del mail" srcDoc={d.vistaPrevia} sandbox="allow-same-origin allow-popups" className="w-full h-[640px] bg-[#f6f1e7]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Numero({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono?: string }) {
  return (
    <div className="bg-stone-50 rounded-lg px-2 py-3">
      <p className={`text-2xl font-bold tabular-nums ${tono ?? 'text-stone-800'}`}>{n(valor)}</p>
      <p className="text-[11px] uppercase tracking-wide text-stone-500 mt-0.5">{etiqueta}</p>
    </div>
  );
}
