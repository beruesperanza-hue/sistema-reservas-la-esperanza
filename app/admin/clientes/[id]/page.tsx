'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import Icon from '@/components/admin/Icon';
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
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <div className="text-center py-24">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!cliente || !campos) {
    return (
      <div className="min-h-screen bg-paper">
        <AdminHeader />
        <div className="text-center py-24 text-stone-500">Cliente no encontrado.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        <Link href="/admin/clientes" className="inline-flex items-center gap-1 text-sm font-medium text-esperanza-600 hover:text-esperanza-700">
          <Icon name="arrowLeft" size={15} /> Volver a clientes
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-esperanza-700 mt-3 mb-6">
          {cliente.nombre} {cliente.apellido}
        </h1>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Datos del cliente */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Datos</h2>

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
                <p className="text-xs text-stone-400 mt-1">País del teléfono: {cliente.telefonoPais}</p>
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
            <label className="flex items-center gap-2.5 text-sm font-medium text-esperanza-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-esperanza-700" checked={vip} onChange={(e) => setVip(e.target.checked)} />
              Cliente VIP
            </label>

            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <p className="text-xs text-stone-400">
              Origen: {cliente.origen} · Creado como parte de{' '}
              {cliente.origen.startsWith('importado_') ? 'una importación' : 'alta directa'}
            </p>
          </div>

          {/* Consentimiento */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Consentimiento de marketing</h2>

            {(['email', 'whatsapp'] as const).map((canal) => (
              <div key={canal} className="border-b border-esperanza-100 pb-4">
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
              <h3 className="font-semibold text-sm text-stone-600 mb-2">Historial</h3>
              <div className="space-y-1 text-xs text-stone-500 max-h-40 overflow-y-auto">
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
        <div className="card mt-5">
          <h2 className="text-lg font-bold mb-4">Actividad histórica importada</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5 text-sm">
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
            <p className="text-sm text-stone-600 mt-4 italic">"{cliente.notasHistoricas}"</p>
          )}
        </div>

        {/* Reservas del sistema */}
        <div className="card mt-5">
          <h2 className="text-lg font-bold mb-4">Reservas en el sistema</h2>
          {cliente.reservas.length === 0 ? (
            <p className="text-stone-500 text-sm">Este cliente todavía no tiene reservas cargadas en el sistema.</p>
          ) : (
            <div className="divide-y divide-esperanza-100">
              {cliente.reservas.map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between items-center gap-3 text-sm text-esperanza-700">
                  <span>
                    {formatearFechaLarga(r.fecha)} · {r.hora} · {r.personas} personas
                  </span>
                  <span className={`badge ${r.estado === 'cancelada' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{r.estado}</span>
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
    nunca_solicitado: 'bg-stone-100 text-stone-600',
  };
  return (
    <span className={`badge py-1 capitalize ${estilos[estado] || estilos.nunca_solicitado}`}>
      {estado.replace('_', ' ')}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-stone-500 text-[11px] uppercase tracking-[0.06em] font-semibold">{label}</p>
      <p className="font-extrabold text-lg text-esperanza-700 mt-0.5">{value}</p>
    </div>
  );
}
