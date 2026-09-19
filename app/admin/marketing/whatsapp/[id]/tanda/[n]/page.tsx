'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
import { marcarEnvioWhatsapp, obtenerTanda } from '@/app/actions/whatsapp';

type Tanda = Extract<Awaited<ReturnType<typeof obtenerTanda>>, { success: true }>;
type Estado = 'pendiente' | 'enviado' | 'salteado' | 'baja';

const ETIQUETA: Record<string, { texto: string; clase: string }> = {
  enviado: { texto: 'Enviado', clase: 'bg-green-100 text-green-800' },
  salteado: { texto: 'Salteado', clase: 'bg-stone-100 text-stone-600' },
  baja: { texto: 'Pidió baja', clase: 'bg-red-100 text-red-700' },
};

/** 5491123456789 -> +54 9 11 2345-6789 (solo para leerlo; el link usa el número crudo). */
function lindo(numero: string): string {
  const m = numero.match(/^549(11)(\d{4})(\d{4})$/);
  if (m) return `+54 9 ${m[1]} ${m[2]}-${m[3]}`;
  const a = numero.match(/^549(\d{3,4})(\d+)$/);
  if (a) return `+54 9 ${a[1]} ${a[2]}`;
  return `+${numero}`;
}

/**
 * Copia la foto al portapapeles como imagen, para pegarla con Cmd+V en el
 * chat. El portapapeles solo acepta PNG, así que se convierte al vuelo.
 */
async function copiarFoto(url: string) {
  const png = (async () => {
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    return new Promise<Blob>((ok) => canvas.toBlob((b) => ok(b!), 'image/png'));
  })();
  // El ClipboardItem se arma dentro del clic (con la promesa) para que Safari lo permita.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

export default function TandaPage() {
  const params = useParams<{ id: string; n: string }>();
  const numero = Number(params.n);
  const [t, setT] = useState<Tanda | null>(null);
  const [error, setError] = useState('');
  const [avisoFoto, setAvisoFoto] = useState('');

  const cargar = useCallback(async () => {
    const r = await obtenerTanda(params.id, numero);
    if (r.success) setT(r);
    else setError(r.error);
  }, [params.id, numero]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Actualiza en pantalla al instante y guarda por detrás.
  const marcar = async (envioId: string, estado: Estado) => {
    setT((prev) =>
      prev ? { ...prev, clientes: prev.clientes.map((c) => (c.id === envioId ? { ...c, estado } : c)) } : prev
    );
    const r = await marcarEnvioWhatsapp(envioId, estado);
    if (!r.success) {
      setError(r.error);
      cargar();
    }
  };

  const foto = async () => {
    if (!t) return;
    try {
      await copiarFoto(`/api/promo/${t.promo.slug}/imagen?v=${t.promo.version}`);
      setAvisoFoto('Foto copiada. En el chat, pegala con Cmd+V (o Ctrl+V) antes de enviar.');
    } catch {
      setAvisoFoto('Este navegador no deja copiar imágenes. Igual la foto aparece sola por el link de la promo.');
    }
  };

  if (!t) {
    return (
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <main className="container mx-auto px-4 py-10 max-w-3xl">
          {error ? <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div> : <div className="spinner" />}
        </main>
      </div>
    );
  }

  const pendientes = t.clientes.filter((c) => c.estado === 'pendiente');
  const hechos = t.clientes.length - pendientes.length;
  const siguienteId = pendientes[0]?.id;
  const avance = t.clientes.length ? Math.round((hechos / t.clientes.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        <Link
          href={`/admin/marketing/whatsapp/${t.promo.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700"
        >
          <Icon name="arrowLeft" size={15} /> {t.promo.nombre}
        </Link>

        <div className="flex items-end justify-between gap-3 mt-3 mb-4 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700">
            Tanda {t.tanda} <span className="text-stone-400 font-bold text-xl">de {t.totalTandas}</span>
          </h1>
          <p className="text-sm text-stone-500 tabular-nums">
            {hechos} de {t.clientes.length} listos
          </p>
        </div>

        <div className="h-2.5 rounded-full bg-esperanza-100 overflow-hidden mb-5">
          <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${avance}%` }} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

        <div className="card !p-4 mb-4 text-sm text-stone-600 space-y-2">
          <p>
            Tocá <strong>Abrir WhatsApp</strong>: se abre el chat con el mensaje escrito, solo tenés que enviarlo. La foto
            aparece sola por el link de la promo.
          </p>
          {t.promo.tieneImagen && (
            <div className="flex items-center gap-3 flex-wrap">
              <button className="btn btn-secondary btn-small" onClick={foto}>
                <Icon name="upload" size={14} />
                Copiar foto
              </button>
              <span className="text-xs text-stone-500">{avisoFoto || 'Opcional: para mandarla también como imagen.'}</span>
            </div>
          )}
          <p className="text-xs text-stone-400">
            Si alguien contesta “BAJA”, volvé acá y tocá <em>Pidió baja</em>: no entra en ninguna promo más.
          </p>
        </div>

        <ul className="space-y-2">
          {t.clientes.map((c) => {
            const esSiguiente = c.id === siguienteId;
            const etiqueta = ETIQUETA[c.estado];
            return (
              <li
                key={c.id}
                className={`card !p-3 md:!p-4 flex items-center gap-3 flex-wrap ${
                  esSiguiente ? 'ring-2 ring-esperanza-500' : c.estado !== 'pendiente' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold leading-tight">{c.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-stone-500 tabular-nums">{lindo(c.telefono)}</p>
                </div>

                {c.estado === 'pendiente' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => marcar(c.id, 'enviado')}
                      className="btn btn-primary btn-small !bg-[#1f9d55] !border-[#1f9d55] hover:!bg-[#198049]"
                    >
                      <Icon name="message" size={14} />
                      Abrir WhatsApp
                    </a>
                    <button className="btn btn-secondary btn-small" onClick={() => marcar(c.id, 'salteado')}>
                      Saltear
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${etiqueta.clase}`}>{etiqueta.texto}</span>
                    {c.estado !== 'baja' && (
                      <button className="text-xs text-red-700 underline" onClick={() => marcar(c.id, 'baja')}>
                        Pidió baja
                      </button>
                    )}
                    <button className="text-xs text-stone-500 underline" onClick={() => marcar(c.id, 'pendiente')}>
                      Deshacer
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-between gap-3 mt-6">
          {t.tanda > 1 ? (
            <Link href={`/admin/marketing/whatsapp/${t.promo.id}/tanda/${t.tanda - 1}`} className="btn btn-secondary btn-small">
              ← Tanda {t.tanda - 1}
            </Link>
          ) : (
            <span />
          )}
          {t.tanda < t.totalTandas && (
            <Link
              href={`/admin/marketing/whatsapp/${t.promo.id}/tanda/${t.tanda + 1}`}
              className={`btn btn-small ${pendientes.length === 0 ? 'btn-primary' : 'btn-secondary'}`}
            >
              Tanda {t.tanda + 1} →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
