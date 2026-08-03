'use client';

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AdminHeader from '@/components/admin/AdminHeader';
import { importarClientes, type ImportarClientesInput } from '@/app/actions/customers';

const CAMPOS_DESTINO = [
  { valor: '', label: '— Ignorar esta columna —' },
  { valor: 'nombre', label: 'Nombre (completo)' },
  { valor: 'apellido', label: 'Apellido' },
  { valor: 'email', label: 'Email' },
  { valor: 'telefono', label: 'Teléfono' },
  { valor: 'telefonoPais', label: 'País del teléfono' },
  { valor: 'visitasHistoricas', label: 'Visitas históricas' },
  { valor: 'ultimaVisitaHistorica', label: 'Última visita' },
  { valor: 'primeraVisitaHistorica', label: 'Primera visita' },
  { valor: 'gastoPromedio', label: 'Gasto promedio' },
  { valor: 'gastoPromedioMoneda', label: 'Moneda del gasto promedio' },
  { valor: 'noShows', label: 'No-shows' },
  { valor: 'cancelacionesHistoricas', label: 'Cancelaciones' },
  { valor: 'eliminacionesHistoricas', label: 'Eliminaciones' },
  { valor: 'notasHistoricas', label: 'Notas / información libre' },
];

const ORIGENES = [
  { valor: 'importado_excel', label: 'Excel' },
  { valor: 'importado_woki', label: 'Woki' },
  { valor: 'importado_bigbox', label: 'Bigbox' },
  { valor: 'importado_mozrest', label: 'Mozrest' },
  { valor: 'instagram', label: 'Instagram' },
  { valor: 'facebook', label: 'Facebook' },
];

// Alias conocidos para auto-mapear columnas comunes (ej. el export de Bigbox)
// — el usuario puede corregir cualquier mapeo antes de confirmar.
const ALIAS: Record<string, string> = {
  nombre: 'nombre',
  'nombre completo': 'nombre',
  name: 'nombre',
  apellido: 'apellido',
  informacion: 'notasHistoricas',
  información: 'notasHistoricas',
  notas: 'notasHistoricas',
  email: 'email',
  mail: 'email',
  correo: 'email',
  telefono: 'telefono',
  teléfono: 'telefono',
  phone: 'telefono',
  telefono_pais: 'telefonoPais',
  cantidad_de_visitas: 'visitasHistoricas',
  visitas: 'visitasHistoricas',
  ultima_visita: 'ultimaVisitaHistorica',
  última_visita: 'ultimaVisitaHistorica',
  primera_visita: 'primeraVisitaHistorica',
  gasto_promedio: 'gastoPromedio',
  gasto_promedio_moneda: 'gastoPromedioMoneda',
  no_shows: 'noShows',
  noshows: 'noShows',
  cancelaciones: 'cancelacionesHistoricas',
  eliminaciones: 'eliminacionesHistoricas',
};

function normalizar(s: string): string {
  return s.trim().toLowerCase();
}

function autoMapear(columnas: string[]): Record<string, string> {
  const mapeo: Record<string, string> = {};
  for (const col of columnas) {
    mapeo[col] = ALIAS[normalizar(col)] || '';
  }
  return mapeo;
}

async function parsearArchivo(
  file: File
): Promise<{ columnas: string[]; filas: Record<string, string>[] }> {
  const esExcel = /\.xlsx?$/i.test(file.name);

  if (esExcel) {
    const buffer = await file.arrayBuffer();
    const libro = XLSX.read(buffer, { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filasCrudas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, { defval: '' });
    const columnas = filasCrudas.length > 0 ? Object.keys(filasCrudas[0]) : [];
    const filas = filasCrudas.map((fila) =>
      Object.fromEntries(Object.entries(fila).map(([k, v]) => [k, String(v ?? '')]))
    );
    return { columnas, filas };
  }

  let texto = await file.text();
  // Quita el BOM y la línea "sep=," que agrega Excel al exportar CSV.
  texto = texto.replace(/^﻿/, '');
  const primerSalto = texto.indexOf('\n');
  if (primerSalto !== -1 && /^sep=/i.test(texto.slice(0, primerSalto))) {
    texto = texto.slice(primerSalto + 1);
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(texto, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => resolve({ columnas: resultado.meta.fields || [], filas: resultado.data }),
      error: reject,
    });
  });
}

type ResultadoImportacion = Awaited<ReturnType<typeof importarClientes>>;

export default function ImportarClientesPage() {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [columnas, setColumnas] = useState<string[]>([]);
  const [filas, setFilas] = useState<Record<string, string>[]>([]);
  const [mapeo, setMapeo] = useState<Record<string, string>>({});
  const [fuente, setFuente] = useState('importado_excel');
  const [duplicados, setDuplicados] = useState<ImportarClientesInput['duplicados']>('fusionar');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [error, setError] = useState('');

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const { columnas: cols, filas: filasParsed } = await parsearArchivo(file);
      if (filasParsed.length === 0) {
        setError('No se detectaron filas en el archivo.');
        return;
      }
      setNombreArchivo(file.name);
      setColumnas(cols);
      setFilas(filasParsed);
      setMapeo(autoMapear(cols));
      setPaso(2);
    } catch (err) {
      console.error(err);
      setError('No se pudo leer el archivo. Verificá que sea un CSV o Excel válido.');
    }
  };

  const confirmarImportacion = async () => {
    setProcesando(true);
    setError('');
    try {
      const res = await importarClientes({
        fuente,
        nombreArchivo,
        columnMapping: mapeo,
        filas,
        duplicados,
      });
      if (!res.success) {
        setError(res.error || 'Error al importar.');
        return;
      }
      setResultado(res);
      setPaso(3);
    } finally {
      setProcesando(false);
    }
  };

  const tieneNombreMapeado = Object.values(mapeo).includes('nombre');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/admin/clientes" className="text-esperanza-600 hover:underline text-sm">
          ← Volver a clientes
        </Link>
        <h1 className="text-4xl font-bold text-esperanza-700 mt-2 mb-8">Importar clientes</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
        )}

        {paso === 1 && (
          <div className="card">
            <p className="text-gray-600 mb-4">
              Subí un archivo CSV o Excel exportado de tu sistema anterior (Excel viejo, Woki, Bigbox,
              Mozrest) o de contactos de Instagram/Facebook.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileChange}
              className="form-input"
            />
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                {filas.length} filas detectadas en <span className="font-mono text-sm">{nombreArchivo}</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Origen de estos clientes</label>
                  <select className="form-input" value={fuente} onChange={(e) => setFuente(e.target.value)}>
                    {ORIGENES.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Si ya existe un cliente con el mismo email/teléfono</label>
                  <select
                    className="form-input"
                    value={duplicados}
                    onChange={(e) => setDuplicados(e.target.value as ImportarClientesInput['duplicados'])}
                  >
                    <option value="fusionar">Actualizar el existente (recomendado)</option>
                    <option value="crear_nuevo">Crear un cliente nuevo igual</option>
                  </select>
                </div>
              </div>

              <h3 className="font-semibold mb-2">Mapeo de columnas</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {columnas.map((col) => (
                  <div key={col} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="font-mono text-sm w-52 truncate" title={col}>
                      {col}
                    </span>
                    <span className="text-gray-400">→</span>
                    <select
                      className="form-input"
                      value={mapeo[col] || ''}
                      onChange={(e) => setMapeo((m) => ({ ...m, [col]: e.target.value }))}
                    >
                      {CAMPOS_DESTINO.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {!tieneNombreMapeado && (
                <p className="text-amber-600 text-sm mt-4">
                  ⚠️ No mapeaste ninguna columna a "Nombre". Las filas sin nombre solo se importarán si
                  tienen email o teléfono.
                </p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">Vista previa (primeras 5 filas)</h3>
              <div className="overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="text-left text-gray-500">
                      {columnas.map((col) => (
                        <th key={col} className="pr-4 py-1">
                          {mapeo[col] || col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 5).map((fila, i) => (
                      <tr key={i} className="border-t">
                        {columnas.map((col) => (
                          <td key={col} className="pr-4 py-1 text-gray-700">
                            {fila[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => setPaso(1)}>
                ← Elegir otro archivo
              </button>
              <button className="btn btn-primary" onClick={confirmarImportacion} disabled={procesando}>
                {procesando ? `Importando ${filas.length} filas...` : `Importar ${filas.length} clientes`}
              </button>
            </div>
          </div>
        )}

        {paso === 3 && resultado && resultado.success && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Importación completa</h2>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold">{resultado.filasTotales}</p>
                <p className="text-xs text-gray-500">Filas totales</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">{resultado.filasImportadas}</p>
                <p className="text-xs text-gray-500">Importadas</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-700">{resultado.filasConError}</p>
                <p className="text-xs text-gray-500">Con error</p>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Filas con error</h3>
                <div className="max-h-64 overflow-y-auto text-sm text-gray-600 space-y-1">
                  {resultado.errores.map((e, i) => (
                    <div key={i}>
                      Fila {e.fila}: {e.motivo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/admin/clientes" className="btn btn-primary mt-6 inline-block">
              Ver clientes
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
