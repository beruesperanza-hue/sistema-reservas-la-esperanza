'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { contarDestinatariosEmailDeSegmento, enviarCampaniaEmail } from '@/app/actions/customers';
import { LIMITE_GMAIL_DIARIO } from '@/lib/constants';

interface Segmento {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export default function EnviarCampaniaPage() {
  const params = useParams<{ id: string }>();
  const [segmento, setSegmento] = useState<Segmento | null>(null);
  const [destinatarios, setDestinatarios] = useState<number | null>(null);
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ destinatarios: number; enviados: number; fallidos: number } | null>(
    null
  );
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const [resSegmento, resConteo] = await Promise.all([
      fetch(`/api/admin/segmentos/${params.id}`).then((r) => r.json()),
      contarDestinatariosEmailDeSegmento(params.id),
    ]);
    if (resSegmento.segmento) setSegmento(resSegmento.segmento);
    if (resConteo.success) setDestinatarios(resConteo.total);
  }, [params.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviar = async () => {
    if (!asunto.trim() || !cuerpo.trim()) {
      setError('Completá el asunto y el cuerpo del mensaje.');
      return;
    }
    if (!confirm(`¿Enviar este mail a ${destinatarios} clientes?`)) return;

    setEnviando(true);
    setError('');
    try {
      const res = await enviarCampaniaEmail({ segmentId: params.id, asunto, cuerpoTexto: cuerpo });
      if (!res.success) {
        setError(res.error || 'Error al enviar la campaña.');
        return;
      }
      setResultado({ destinatarios: res.destinatarios, enviados: res.enviados, fallidos: res.fallidos });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/admin/clientes/segmentos" className="text-esperanza-600 hover:underline text-sm">
          ← Volver a segmentos
        </Link>
        <h1 className="text-4xl font-bold text-esperanza-700 mt-2 mb-2">Enviar mail</h1>
        {segmento && <p className="text-gray-500 mb-8">Segmento: {segmento.nombre}</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
        )}

        {resultado ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Campaña enviada</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold">{resultado.destinatarios}</p>
                <p className="text-xs text-gray-500">Destinatarios</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">{resultado.enviados}</p>
                <p className="text-xs text-gray-500">Enviados</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-700">{resultado.fallidos}</p>
                <p className="text-xs text-gray-500">Fallidos</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card space-y-4">
            <div className="bg-esperanza-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Destinatarios elegibles (con consentimiento de email autorizado)</p>
              <p className="text-3xl font-bold text-esperanza-700">
                {destinatarios === null ? '...' : destinatarios}
              </p>
              {destinatarios !== null && destinatarios > LIMITE_GMAIL_DIARIO && (
                <p className="text-amber-600 text-sm mt-2">
                  ⚠️ Este segmento tiene más destinatarios ({destinatarios}) que el límite gratuito diario de
                  Gmail ({LIMITE_GMAIL_DIARIO}/día). Si enviás ahora, es probable que una parte de los mails
                  falle por superar el límite.
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Asunto</label>
              <input className="form-input" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Cuerpo del mensaje</label>
              <textarea
                className="form-input"
                rows={10}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Escribí el mensaje que van a recibir todos los clientes de este segmento..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Se manda con el mismo encabezado y pie de página que los mails de reserva.
              </p>
            </div>

            <button className="btn btn-primary" onClick={enviar} disabled={enviando || destinatarios === 0}>
              {enviando ? 'Enviando...' : `Enviar a ${destinatarios ?? '...'} clientes`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
