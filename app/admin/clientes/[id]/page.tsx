'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { updateCustomer, actualizarConsentimiento } from '@/app/actions/customers';
import { formatearFechaLarga, dateAFechaISO } from '@/lib/fechas';
import type { CamposCliente } from '@/lib/segmentos';

interface ConsentRecordRow {
  id: string;
  canal: string;
  estado: string;
  fuente: string | null;
  createdAt: string;
}

interface ReservaRow {
  id: string;
  fecha: string;
  hora: string;
  personas: number;
  estado: string;
  ubicacion: string;
}

interface ClienteDetalle {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  telefonoPais: string | null;
  origen: string;
  vip: boolean;
  tags: string[];
  notas: string | null;
  fechaNacimiento: string | null;
  visitasHistoricas: number;
  ultimaVisitaHistorica: string | null;
  noShows: number;
  cancelacionesHistoricas: number;
  eliminacionesHistoricas: number;
  notasHistoricas: string | null;
  reservas: ReservaRow[];
  consentimientos: ConsentRecordRow[];
}

export default function FichaClientePage() {
  const params = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [campos, setCampos] = useState<CamposCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [vip, setVip] = useState(false);
  const [tags, setTags] = useState('');
  const [notas, setNotas] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clientes/${params.id}`);
      const data = await res.json();
      if (data.cliente) {
        setCliente(data.cliente);
        setCampos(data.campos);
        setNombre(data.cliente.nombre);
        setApellido(data.cliente.apellido || '');
        setEmail(data.cliente.email || '');
        setTelefono(data.cliente.telefono || '');
        setVip(data.cliente.vip);
        setTags((data.cliente.tags || []).join(', '));
        setNotas(data.cliente.notas || '');
      }
    } catch (error) {
      console.error('Error cargando cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async () => {
    if (!cliente) return;
    setGuardando(true);
    try {
      await updateCustomer(cliente.id, {
        nombre,
        apellido: apellido || null,
        email: email || null,
        telefono: telefono || null,
        vip,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notas: notas || null,
      });
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarConsentimiento = async (canal: 'email' | 'whatsapp', estado: 'autorizado' | 'revocado') => {
    if (!cliente) return;
    await actualizarConsentimiento({ customerId: cliente.id, canal, estado });
    await cargar();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="text-center py-24">
          <div className="inline-block w-8 h-8 border-4 border-esperanza-200 border-t-esperanza-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!cliente || !campos) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="text-center py-24 text-gray-600">Cliente no encontrado.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/admin/clientes" className="text-esperanza-600 hover:underline text-sm">
          ← Volver a clientes
        </Link>

        <h1 className="text-4xl font-bold text-esperanza-700 mt-2 mb-8">
          {cliente.nombre} {cliente.apellido}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Datos del cliente */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Datos</h2>

            <div>
              <label className="form-label">Nombre</label>
              <input className="form-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Apellido</label>
              <input className="form-input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              {cliente.telefonoPais && (
                <p className="text-xs text-gray-400 mt-1">País del teléfono: {cliente.telefonoPais}</p>
              )}
            </div>
            <div>
              <label className="form-label">Tags (separados por coma)</label>
              <input className="form-input" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Notas</label>
              <textarea className="form-input" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} />
              Cliente VIP
            </label>

            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <p className="text-xs text-gray-400">
              Origen: {cliente.origen} · Creado como parte de{' '}
              {cliente.origen.startsWith('importado_') ? 'una importación' : 'alta directa'}
            </p>
          </div>

          {/* Consentimiento */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Consentimiento de marketing</h2>

            {(['email', 'whatsapp'] as const).map((canal) => (
              <div key={canal} className="border-b pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{canal}</span>
                  <EstadoBadge estado={campos.consentimiento[canal]} />
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => cambiarConsentimiento(canal, 'autorizado')}
                  >
                    Marcar autorizado
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => cambiarConsentimiento(canal, 'revocado')}
                  >
                    Revocar
                  </button>
                </div>
              </div>
            ))}

            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Historial</h3>
              <div className="space-y-1 text-xs text-gray-500 max-h-40 overflow-y-auto">
                {cliente.consentimientos.length === 0 && <p>Sin registros todavía.</p>}
                {cliente.consentimientos.map((c) => (
                  <div key={c.id}>
                    {new Date(c.createdAt).toLocaleString('es-AR')} · {c.canal} → {c.estado}
                    {c.fuente ? ` (${c.fuente})` : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actividad histórica importada */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Actividad histórica importada</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="Visitas históricas" value={cliente.visitasHistoricas} />
            <Stat
              label="Última visita histórica"
              value={cliente.ultimaVisitaHistorica ? formatearFechaLarga(dateAFechaISO(new Date(cliente.ultimaVisitaHistorica))) : '—'}
            />
            <Stat label="No-shows" value={cliente.noShows} />
            <Stat label="Cancelaciones" value={cliente.cancelacionesHistoricas} />
            <Stat label="Eliminaciones" value={cliente.eliminacionesHistoricas} />
            <Stat label="Visitas totales (histórico + sistema)" value={campos.visitasTotales} />
            <Stat
              label="Días desde última visita"
              value={campos.diasDesdeUltimaVisita ?? '—'}
            />
          </div>
          {cliente.notasHistoricas && (
            <p className="text-sm text-gray-600 mt-4 italic">"{cliente.notasHistoricas}"</p>
          )}
        </div>

        {/* Reservas del sistema */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Reservas en el sistema</h2>
          {cliente.reservas.length === 0 ? (
            <p className="text-gray-500 text-sm">Este cliente todavía no tiene reservas cargadas en el sistema.</p>
          ) : (
            <div className="divide-y">
              {cliente.reservas.map((r) => (
                <div key={r.id} className="py-2 flex justify-between text-sm">
                  <span>
                    {formatearFechaLarga(r.fecha)} · {r.hora} · {r.personas} personas
                  </span>
                  <span className={r.estado === 'cancelada' ? 'text-red-600' : 'text-gray-600'}>{r.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    autorizado: 'bg-green-100 text-green-700',
    revocado: 'bg-red-100 text-red-700',
    nunca_solicitado: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${estilos[estado] || estilos.nunca_solicitado}`}>
      {estado.replace('_', ' ')}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}
