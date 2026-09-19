'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import { type DatosPromo, guardarPromoWhatsapp } from '@/app/actions/whatsapp';
import { mensajeWhatsapp } from '@/lib/textoMarketing';

interface Props {
  inicial: Omit<DatosPromo, 'imagenBase64' | 'imagenTipo'>;
  /** URL de la foto ya guardada, si la hay. */
  imagenActual?: string | null;
  urlPromo?: string;
}

/**
 * Achica la foto antes de subirla: 1200 px de lado alcanzan para WhatsApp y la
 * página de la promo, y así queda liviana (la vista previa del link falla con
 * imágenes pesadas).
 */
async function prepararFoto(archivo: File): Promise<{ base64: string; tipo: string; url: string }> {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.src = url;
  await img.decode();

  const escala = Math.min(1, 1200 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.split(',')[1], tipo: 'image/jpeg', url: dataUrl };
}

export default function EditorPromoWhatsapp({ inicial, imagenActual = null, urlPromo }: Props) {
  const router = useRouter();
  const [datos, setDatos] = useState(inicial);
  const [foto, setFoto] = useState<{ base64: string | null; tipo: string | null; url: string | null } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const fotoVisible = foto ? foto.url : imagenActual;
  const cambiar = (campo: keyof typeof datos, valor: string) => setDatos((d) => ({ ...d, [campo]: valor }));

  const elegirFoto = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) return setError('Elegí una imagen (JPG o PNG).');
    setError('');
    const lista = await prepararFoto(archivo);
    setFoto(lista);
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    const r = await guardarPromoWhatsapp({
      ...datos,
      ...(foto ? { imagenBase64: foto.base64, imagenTipo: foto.tipo } : {}),
    });
    setGuardando(false);
    if (!r.success) {
      setError(r.error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(`/admin/marketing/whatsapp/${r.id}`);
  };

  const ejemplo = mensajeWhatsapp(datos.mensaje, 'Martín', urlPromo ?? 'https://laesperanzadelosascurra.com/p/…');

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      <div className="space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        <div className="card space-y-4">
          <div>
            <label className="form-label" htmlFor="promo-nombre">Nombre de la promo</label>
            <input
              id="promo-nombre"
              className="form-input"
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              placeholder="Ej: 2x1 en vermut — octubre"
            />
            <p className="text-xs text-stone-400 mt-1">Para encontrarla vos. El cliente no lo ve.</p>
          </div>

          <div>
            <label className="form-label" htmlFor="promo-foto">Foto</label>
            <div className="flex items-start gap-4 flex-wrap">
              {fotoVisible ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoVisible} alt="" className="w-28 h-28 object-cover rounded-lg border border-esperanza-200" />
              ) : (
                <div className="w-28 h-28 rounded-lg border border-dashed border-esperanza-300 flex items-center justify-center text-stone-400">
                  <Icon name="upload" size={22} />
                </div>
              )}
              <div className="space-y-2 text-sm">
                <input
                  id="promo-foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => elegirFoto(e.target.files?.[0])}
                  className="block text-sm"
                />
                {fotoVisible && (
                  <button
                    type="button"
                    className="text-xs text-red-700 underline"
                    onClick={() => setFoto({ base64: null, tipo: null, url: null })}
                  >
                    Sacar la foto
                  </button>
                )}
                <p className="text-xs text-stone-400 max-w-xs">
                  Se ve grande en el chat gracias al link de la promo. Mejor horizontal o cuadrada.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="promo-titulo">Título de la promo</label>
            <input
              id="promo-titulo"
              className="form-input"
              value={datos.titulo}
              onChange={(e) => cambiar('titulo', e.target.value)}
              placeholder="Ej: 2x1 en vermut los jueves"
              maxLength={80}
            />
            <p className="text-xs text-stone-400 mt-1">Aparece debajo de la foto en WhatsApp y en la página de la promo.</p>
          </div>

          <div>
            <label className="form-label" htmlFor="promo-mensaje">Mensaje</label>
            <textarea
              id="promo-mensaje"
              className="form-input leading-relaxed"
              rows={8}
              value={datos.mensaje}
              onChange={(e) => cambiar('mensaje', e.target.value)}
            />
            <p className="text-xs text-stone-400 mt-1">
              <code className="bg-stone-100 px-1 rounded">{'{nombre}'}</code> pone el nombre de cada cliente. El link de la promo y
              “respondé BAJA” se agregan solos al final. Para negrita en WhatsApp: <code className="bg-stone-100 px-1 rounded">*así*</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            <Icon name="save" size={16} />
            {guardando ? 'Guardando…' : 'Guardar y seguir'}
          </button>
          <Link href="/admin/marketing/whatsapp" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <p className="text-sm font-semibold text-stone-600 mb-2">Así le llega a un cliente</p>
        <VistaWhatsapp texto={ejemplo} foto={fotoVisible} titulo={datos.titulo} />
      </div>
    </div>
  );
}

/** Imitación de un chat de WhatsApp: burbuja verde con la tarjeta del link. */
export function VistaWhatsapp({ texto, foto, titulo }: { texto: string; foto: string | null; titulo: string }) {
  const [antes, ...resto] = texto.split(/(https?:\/\/\S+)/);
  return (
    <div className="rounded-xl p-4 bg-[#efe7dd] border border-esperanza-200/80">
      <div className="ml-auto max-w-[92%] bg-[#d9fdd3] rounded-lg rounded-tr-none p-1.5 shadow-sm text-[14px] text-stone-900">
        <div className="bg-[#c6ebc0] rounded-md overflow-hidden mb-1.5">
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="" className="w-full max-h-64 object-cover" />
          )}
          <div className="px-2.5 py-2">
            <p className="font-semibold text-[13px] leading-snug">{titulo || 'Título de la promo'}</p>
            <p className="text-[11px] text-stone-600">laesperanzadelosascurra.com</p>
          </div>
        </div>
        <p className="px-1.5 pb-1 whitespace-pre-wrap break-words leading-snug">
          {antes}
          {resto.map((parte, i) =>
            /^https?:\/\//.test(parte) ? (
              <span key={i} className="text-[#027eb5] underline break-all">
                {parte}
              </span>
            ) : (
              <span key={i}>{parte}</span>
            )
          )}
        </p>
        <p className="text-right text-[10px] text-stone-500 pr-1">12:30 ✓✓</p>
      </div>
    </div>
  );
}
