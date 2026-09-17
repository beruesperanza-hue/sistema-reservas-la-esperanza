'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import {
  type DatosCampania,
  enviarPrueba,
  guardarCampania,
  listarSegmentos,
  previsualizarCampania,
} from '@/app/actions/marketing';

interface Props {
  inicial: DatosCampania & { id?: string };
}

export default function EditorCampania({ inicial }: Props) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosCampania & { id?: string }>(inicial);
  const [segmentos, setSegmentos] = useState<{ id: string; nombre: string }[]>([]);
  const [html, setHtml] = useState('');
  const [destinatarios, setDestinatarios] = useState<number | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [emailPrueba, setEmailPrueba] = useState('eventoslaesperanza@gmail.com');
  const [estadoPrueba, setEstadoPrueba] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);

  const esInvitacion = datos.tipo === 'invitacion';
  const cambiar = (campo: keyof DatosCampania, valor: string) => setDatos((d) => ({ ...d, [campo]: valor }));

  useEffect(() => {
    if (esInvitacion) return;
    listarSegmentos().then((r) => r.success && setSegmentos(r.segmentos));
  }, [esInvitacion]);

  // Vista previa: espera a que se deje de tipear para no consultar en cada letra.
  const pedido = useRef(0);
  useEffect(() => {
    const numero = ++pedido.current;
    setActualizando(true);
    const t = setTimeout(async () => {
      const r = await previsualizarCampania(datos);
      if (numero !== pedido.current) return;
      setActualizando(false);
      if (r.success) {
        setHtml(r.html);
        setDestinatarios(r.destinatarios);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [datos]);

  const guardar = async () => {
    setGuardando(true);
    setError('');
    const r = await guardarCampania(datos);
    setGuardando(false);
    if (!r.success) {
      setError(r.error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(`/admin/marketing/${r.id}`);
  };

  const probar = async () => {
    setEnviandoPrueba(true);
    setEstadoPrueba(null);
    const r = await enviarPrueba(datos, emailPrueba);
    setEnviandoPrueba(false);
    setEstadoPrueba(
      r.success
        ? { tipo: 'ok', texto: `Listo, mirá la casilla de ${emailPrueba}.` }
        : { tipo: 'error', texto: r.error }
    );
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {esInvitacion && (
          <div className="bg-esperanza-50 border border-esperanza-200 rounded-lg p-4 text-sm text-stone-700 space-y-2">
            <p className="font-semibold text-esperanza-700">Cómo funciona la invitación</p>
            <p>
              Le llega <strong>una sola vez</strong> a los clientes que nunca aceptaron recibir mails. El botón
              <em> “Sí, quiero recibir novedades”</em> se agrega solo al final.
            </p>
            <p>Quien lo toca queda suscripto con registro de la fecha. Al resto no se le vuelve a escribir.</p>
          </div>
        )}

        <div className="card space-y-4">
          <div>
            <label className="form-label" htmlFor="campania-nombre">Nombre de la campaña</label>
            <input
              id="campania-nombre"
              className="form-input"
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              placeholder="Ej: Vermut de octubre"
            />
            <p className="text-xs text-stone-400 mt-1">Para encontrarla vos. El cliente no lo ve.</p>
          </div>

          {!esInvitacion && (
            <div>
              <label className="form-label" htmlFor="campania-segmento">¿A quién le llega?</label>
              <select
                id="campania-segmento"
                className="form-input"
                value={datos.segmentId ?? ''}
                onChange={(e) => cambiar('segmentId', e.target.value)}
              >
                <option value="">Todos los suscriptos</option>
                {segmentos.map((s) => (
                  <option key={s.id} value={s.id}>
                    Segmento: {s.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-400 mt-1">
                Siempre solo a quien aceptó recibir mails.{' '}
                <Link href="/admin/clientes/segmentos/nuevo" className="underline hover:text-esperanza-600">
                  Crear un segmento
                </Link>
              </p>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="campania-asunto">Asunto</label>
            <input
              id="campania-asunto"
              className="form-input"
              value={datos.asunto}
              onChange={(e) => cambiar('asunto', e.target.value)}
              placeholder="Lo primero que se lee en la bandeja de entrada"
              maxLength={120}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="campania-texto">Texto del mail</label>
            <textarea
              id="campania-texto"
              className="form-input font-[inherit] leading-relaxed"
              rows={12}
              value={datos.cuerpoTexto}
              onChange={(e) => cambiar('cuerpoTexto', e.target.value)}
            />
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              <code className="bg-stone-100 px-1 rounded">{'{nombre}'}</code> pone el nombre de cada cliente ·{' '}
              <code className="bg-stone-100 px-1 rounded">**así**</code> va en negrita · los links se pegan tal cual ·
              una línea en blanco separa párrafos
            </p>
          </div>

          {!esInvitacion && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="campania-boton">Botón (opcional)</label>
                <input
                  id="campania-boton"
                  className="form-input"
                  value={datos.botonTexto ?? ''}
                  onChange={(e) => cambiar('botonTexto', e.target.value)}
                  placeholder="Reservá tu mesa"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="campania-link">Link del botón</label>
                <input
                  id="campania-link"
                  className="form-input"
                  value={datos.botonUrl ?? ''}
                  onChange={(e) => cambiar('botonUrl', e.target.value)}
                  placeholder="https://laesperanzadelosascurra.com/reservas"
                />
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <p className="font-semibold text-sm">Mandarte una prueba</p>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              aria-label="Email para la prueba"
              className="form-input flex-1"
              type="email"
              value={emailPrueba}
              onChange={(e) => setEmailPrueba(e.target.value)}
            />
            <button className="btn btn-secondary whitespace-nowrap" onClick={probar} disabled={enviandoPrueba}>
              <Icon name="mail" size={15} />
              {enviandoPrueba ? 'Enviando…' : 'Enviar prueba'}
            </button>
          </div>
          {estadoPrueba && (
            <p className={`text-sm ${estadoPrueba.tipo === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
              {estadoPrueba.texto}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            <Icon name="save" size={16} />
            {guardando ? 'Guardando…' : 'Guardar y seguir'}
          </button>
          <Link href="/admin/marketing" className="btn btn-secondary">
            Cancelar
          </Link>
          <p className="text-xs text-stone-400 basis-full">
            Guardar no manda nada: en la próxima pantalla revisás y confirmás el envío.
          </p>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-600">Vista previa</span>
          <span className="text-stone-500">
            {actualizando ? (
              'Actualizando…'
            ) : destinatarios === null ? (
              ''
            ) : (
              <>
                Le llega a <strong className="text-esperanza-700">{destinatarios.toLocaleString('es-AR')}</strong>{' '}
                {destinatarios === 1 ? 'persona' : 'personas'}
              </>
            )}
          </span>
        </div>
        <div className="rounded-xl overflow-hidden border border-esperanza-200/80 bg-[#f6f1e7]">
          <iframe
            title="Vista previa del mail"
            srcDoc={html}
            sandbox="allow-same-origin allow-popups"
            className="w-full h-[640px] lg:h-[calc(100vh-10rem)] bg-[#f6f1e7]"
          />
        </div>
        <p className="text-xs text-stone-400">
          Así lo ve un cliente llamado Martín. Los links de la vista previa no funcionan.
        </p>
      </div>
    </div>
  );
}
