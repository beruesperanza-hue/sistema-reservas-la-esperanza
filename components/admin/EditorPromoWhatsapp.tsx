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

// La vista previa de un link en WhatsApp recorta la foto a un recuadro que
// nunca es más alto que cuadrado. Para que una placa vertical se vea lo más
// alta posible y sin que le corten el texto, la encajamos entera en un lienzo
// 4:5 y rellenamos los costados con la misma foto ampliada y desenfocada.
const ANCHO_FOTO = 1080;
const ALTO_FOTO = 1350; // 4:5
const MAX_PESO_FOTO = 240 * 1024;

async function prepararFoto(archivo: File): Promise<{ base64: string; tipo: string; url: string }> {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO_FOTO;
  canvas.height = ALTO_FOTO;
  const ctx = canvas.getContext('2d')!;

  // Fondo: la foto ampliada hasta tapar todo el lienzo, desenfocada. Si el
  // navegador no soporta filtros en canvas, queda el negro de la marca.
  ctx.fillStyle = '#0e0d0b';
  ctx.fillRect(0, 0, ANCHO_FOTO, ALTO_FOTO);
  const cubrir = Math.max(ANCHO_FOTO / img.width, ALTO_FOTO / img.height);
  ctx.save();
  ctx.filter = 'blur(48px)';
  ctx.globalAlpha = 0.75;
  ctx.drawImage(
    img,
    (ANCHO_FOTO - img.width * cubrir) / 2,
    (ALTO_FOTO - img.height * cubrir) / 2,
    img.width * cubrir,
    img.height * cubrir
  );
  ctx.restore();

  // La foto completa, centrada y sin recortar.
  const entrar = Math.min(ANCHO_FOTO / img.width, ALTO_FOTO / img.height);
  const ancho = img.width * entrar;
  const alto = img.height * entrar;
  ctx.drawImage(img, (ANCHO_FOTO - ancho) / 2, (ALTO_FOTO - alto) / 2, ancho, alto);
  URL.revokeObjectURL(url);

  // WhatsApp no arma la vista previa con fotos pesadas: se baja la calidad
  // hasta que entre cómoda por debajo de los 300 KB.
  let dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  for (const calidad of [0.75, 0.65, 0.55, 0.45]) {
    if (dataUrl.length * 0.75 < MAX_PESO_FOTO) break;
    dataUrl = canvas.toDataURL('image/jpeg', calidad);
  }
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
                <img src={fotoVisible} alt="" className="w-28 h-[8.75rem] object-contain bg-esperanza-900 rounded-lg border border-esperanza-200" />
              ) : (
                <div className="w-28 h-[8.75rem] rounded-lg border border-dashed border-esperanza-300 flex items-center justify-center text-stone-400">
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
                  Se ve grande en el chat gracias al link de la promo. Podés subir la placa vertical de Instagram: se acomoda sola en formato 4:5 sin recortar nada.
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
            <img src={foto} alt="" className="w-full max-h-80 object-contain bg-esperanza-900" />
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
