import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cacheService } from '../services/api';

export default function Cache() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [simForm, setSimForm] = useState({ query_key: '', use_cache: true });
  const [simResult, setSimResult] = useState<any>(null);
  const [invalidateKey, setInvalidateKey] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await cacheService.getStats();
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await cacheService.simulate(simForm);
      setSimResult(res.data);
      setMessage(res.data.message);
      loadStats();
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const handleInvalidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cacheService.invalidate(invalidateKey);
      setMessage(`Cache invalidado para: ${invalidateKey}`);
      setInvalidateKey('');
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const handleFlush = async () => {
    try {
      await cacheService.flush();
      setMessage('Cache Redis limpiado completamente');
      loadStats();
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Conexiones', path: '/connections' },
    { label: 'Metricas', path: '/metrics' },
    { label: 'Queries', path: '/queries' },
    { label: 'Backups', path: '/backups' },
    { label: 'Alertas', path: '/alerts' },
    { label: 'Replicacion', path: '/replication' },
    { label: 'Cache', path: '/cache' },
  ];

  return (
    <div className="min-h-screen bg-dark flex">
      <div className="w-64 bg-card border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">DataOps</h1>
          <p className="text-primary text-sm">Control Center</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${window.location.pathname === item.path ? 'bg-primary text-dark font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            className="w-full px-4 py-2 text-gray-400 hover:text-red-400 text-sm">Cerrar Sesion</button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Cache con Redis</h2>
          <p className="text-gray-400">Modulo 7 — Cache hit/miss, TTL e invalidacion manual</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary text-primary rounded-lg">{message}</div>
        )}

        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Hit Ratio</p>
              <p className="text-3xl font-bold text-green-400">{stats.data?.hit_ratio || 0}%</p>
              <p className="text-gray-500 text-xs mt-1">Tasa de aciertos</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Cache Hits</p>
              <p className="text-3xl font-bold text-primary">{stats.data?.hits || 0}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Cache Misses</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.data?.misses || 0}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Total Requests</p>
              <p className="text-3xl font-bold text-white">{stats.data?.total_requests || 0}</p>
            </div>
          </div>
        )}

        {stats?.benchmark && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-red-900">
              <p className="text-gray-400 text-sm mb-2">Sin Cache</p>
              <p className="text-2xl font-bold text-red-400">{stats.benchmark.sin_cache}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-green-900">
              <p className="text-gray-400 text-sm mb-2">Con Cache</p>
              <p className="text-2xl font-bold text-green-400">{stats.benchmark.con_cache}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-primary">
              <p className="text-gray-400 text-sm mb-2">Mejora</p>
              <p className="text-2xl font-bold text-primary">{stats.benchmark.mejora}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {['stats', 'simular', 'invalidar'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-gray-800'}`}>
              {tab === 'stats' ? 'Estadisticas' : tab === 'simular' ? 'Simular Consulta' : 'Invalidar Cache'}
            </button>
          ))}
        </div>

        {activeTab === 'simular' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">Simular Consulta con Cache</h3>
            <p className="text-gray-400 text-sm mb-6">La primera consulta genera un MISS y guarda en Redis con TTL de 5 minutos. Las siguientes generan HIT.</p>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Clave de consulta</label>
                <input value={simForm.query_key}
                  onChange={e => setSimForm({...simForm, query_key: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="usuarios_activos_2024" required />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={simForm.use_cache}
                  onChange={e => setSimForm({...simForm, use_cache: e.target.checked})}
                  className="w-4 h-4 accent-primary" id="use_cache" />
                <label htmlFor="use_cache" className="text-gray-400 text-sm">Usar cache Redis</label>
              </div>
              <button type="submit" className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Ejecutar Consulta
              </button>
            </form>

            {simResult && (
              <div className={`mt-6 p-4 rounded-lg border ${simResult.cache_hit ? 'bg-green-900/20 border-green-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
                <p className={`font-semibold mb-2 ${simResult.cache_hit ? 'text-green-400' : 'text-yellow-400'}`}>
                  {simResult.cache_hit ? 'CACHE HIT' : 'CACHE MISS'}
                </p>
                <p className="text-white text-sm">Duracion: <span className="text-primary font-bold">{simResult.duration_ms} ms</span></p>
                <p className="text-gray-400 text-xs mt-1">{simResult.cache_hit ? 'Datos obtenidos de Redis' : 'Datos obtenidos de BD y guardados en Redis'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invalidar' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-2">Invalidacion Manual por Evento</h3>
              <p className="text-gray-400 text-sm mb-4">Estrategia TTL: expiracion automatica en 5 minutos. Invalidacion manual: por evento de escritura.</p>
              <form onSubmit={handleInvalidate} className="flex gap-4">
                <input value={invalidateKey}
                  onChange={e => setInvalidateKey(e.target.value)}
                  className="flex-1 bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="clave_a_invalidar" required />
                <button type="submit" className="bg-primary text-dark font-bold px-6 py-2 rounded-lg hover:opacity-90">
                  Invalidar
                </button>
              </form>
            </div>
            <div className="bg-card rounded-xl p-6 border border-red-900">
              <h3 className="text-white font-semibold mb-2">Flush Total</h3>
              <p className="text-gray-400 text-sm mb-4">Limpia todo el cache Redis. Usar con precaucion en produccion.</p>
              <button onClick={handleFlush}
                className="bg-red-600 text-white font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Limpiar Todo el Cache
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}