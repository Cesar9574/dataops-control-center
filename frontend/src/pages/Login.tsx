import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(username, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="w-full max-w-md">

        {/* Logo y titulo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗄️</div>
          <h1 className="text-3xl font-bold text-white">DataOps</h1>
          <h2 className="text-xl text-primary">Control Center</h2>
          <p className="text-gray-400 mt-2">Plataforma Inteligente de Monitoreo</p>
        </div>

        {/* Formulario */}
        <div className="bg-card rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <h3 className="text-white text-xl font-semibold mb-6">Iniciar Sesión</h3>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-dark border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-dark rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs text-center">
              Demo: usuario <span className="text-primary">admin</span> / contraseña <span className="text-primary">admin123</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}