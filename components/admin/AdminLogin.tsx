'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

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
        router.push('/admin/reservas');
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
    <div className="min-h-screen bg-esperanza-900 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <svg viewBox="0 0 24 24" className="w-7 h-7 mb-4" fill="#c9a961" aria-hidden="true">
            <path d="M12 1 14.5 8.6 22.5 8.6 16 13.3 18.5 20.9 12 16.2 5.5 20.9 8 13.3 1.5 8.6 9.5 8.6Z" />
          </svg>
          <h1 className="!text-sand !text-2xl !font-extrabold tracking-wide">LA ESPERANZA</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold mt-2">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-7 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-sm">
              <Icon name="alert" size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="admin-user">Usuario</label>
            <input
              id="admin-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              autoComplete="username"
              autoCapitalize="none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="form-label" htmlFor="admin-pass">Contraseña</label>
            <input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full !py-3">
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
