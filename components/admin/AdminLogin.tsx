'use client';

import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token en cookie
        document.cookie = `admin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-esperanza-50 to-esperanza-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <Lock className="w-12 h-12 text-esperanza-600" />
          </div>
          <h1 className="text-4xl font-bold text-esperanza-700 italic mb-2">La Esperanza</h1>
          <p className="text-gray-600">Panel de Administración</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div>
            <label className="form-label">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>

          {/* Demo Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">Demo:</span> Usuario: <code className="bg-blue-100 px-2 py-1 rounded">admin</code> | Contraseña:{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">admin123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
