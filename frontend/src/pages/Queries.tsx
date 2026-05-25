import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { queriesService } from '../services/api';

export default function Queries() {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [topSlow, setTopSlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queries');
  const [simForm, setSimForm] = useState({
    db_id: '1', query_text: '', duration_ms: '', rows_returned: '', index_used: ''
  });
  const [concUsers, setConcUsers] = useState('100');
  const [concResult, setConcResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qRes, sRes, tRes] = await Promise.all([
        queriesService.getAll(),
        queriesService.getStats(),
        queriesService.getTopSlow(),
      ]);
      setQueries(qRes.data.data);
      setStats(sRes.data.data);
      setTopSlow(tRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await queriesService.simulate({
        ...simForm,
        db_id: parseInt(simForm.db_id),
        duration_ms: parseInt(simForm.duration_ms),
        rows_returned: parseInt(simForm.rows_returned) || 0,
      });
      setMessage(`Query clasificada como: ${res.data.data.classification}`);
      loadData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error simulando query');
    }
  };

  const handleConcurrency = async () => {
    try {
      const res = await queriesService.simulateConcurrency({
        db_id: 1,
        users: parseInt(concUsers)
      });
      setConcResult(res.data);
      setMessage(`Simulacion completada: ${res.data.summary.deadlocks_detected} deadlocks detectados`);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error en simulacion');
    }
  };

  const classColor: any = {
    Fast: 'text-green-400 bg-green-900/30',
    Medium: 'text-blue-400 bg-blue-900/30',
    Slow: 'text-yellow-400 bg-yellow-900/30',
    Critical: 'text-red-400 bg-red-900/30',
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
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                window.location.pathname === item.path
                  ? 'bg-primary text-dark font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            className="w-full px-4 py-2 text-gray-400 hover:text-red-400 text-sm">
            Cerrar Sesion
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Slow Query Analyzer y Concurrencia</h2>
          <p className="text-gray-400">Modulos 3 y 4 — Analisis de rendimiento y simulacion de concurrencia</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary text-primary rounded-lg">
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {['queries', 'simulate', 'concurrency', 'top-slow', 'stats'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-gray-800'
              }`}>
              {tab === 'queries' ? 'Todas las Queries' :
               tab === 'simulate' ? 'Simular Query' :
               tab === 'concurrency' ? 'Concurrencia' :
               tab === 'top-slow' ? 'Top 10 Lentas' : 'Estadisticas'}
            </button>
          ))}
        </div>

        {activeTab === 'queries' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Query</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Duracion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Filas</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Indice</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Clasificacion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">Cargando...</td></tr>
                ) : queries.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">No hay queries registradas</td></tr>
                ) : queries.map((q) => (
                  <tr key={q.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate">{q.query_text}</td>
                    <td className="px-6 py-4 text-white">{q.duration_ms} ms</td>
                    <td className="px-6 py-4 text-gray-400">{q.rows_returned}</td>
                    <td className="px-6 py-4 text-gray-400">{q.index_used || 'Sin indice'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classColor[q.classification]}`}>
                        {q.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-4">Simular Query</h3>
            <p className="text-gray-400 text-sm mb-6">
              Fast: menos de 100ms | Medium: 100-500ms | Slow: 500-2000ms | Critical: mas de 2000ms
            </p>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Texto de la Query</label>
                <textarea value={simForm.query_text}
                  onChange={e => setSimForm({...simForm, query_text: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary h-24"
                  placeholder="SELECT * FROM usuarios WHERE..." required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Duracion (ms)</label>
                  <input type="number" value={simForm.duration_ms}
                    onChange={e => setSimForm({...simForm, duration_ms: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="1500" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Filas devueltas</label>
                  <input type="number" value={simForm.rows_returned}
                    onChange={e => setSimForm({...simForm, rows_returned: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="1000" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Indice usado</label>
                  <input value={simForm.index_used}
                    onChange={e => setSimForm({...simForm, index_used: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="idx_usuarios_email" />
                </div>
              </div>
              <button type="submit"
                className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Simular y Clasificar
              </button>
            </form>
          </div>
        )}

        {activeTab === 'concurrency' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">Simulacion de Concurrencia</h3>
            <p className="text-gray-400 text-sm mb-6">
              Simula multiples usuarios concurrentes con operaciones mixtas y detecta deadlocks automaticamente.
            </p>
            <div className="flex gap-4 items-end mb-6">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Numero de usuarios</label>
                <input type="number" value={concUsers}
                  onChange={e => setConcUsers(e.target.value)}
                  className="bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary w-32"
                  min="10" max="500" />
              </div>
              <button onClick={handleConcurrency}
                className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Ejecutar Simulacion
              </button>
            </div>

            {concResult && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-gray-400 text-sm">Total Transacciones</p>
                  <p className="text-2xl font-bold text-white">{concResult.summary.total_transactions}</p>
                </div>
                <div className="bg-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-gray-400 text-sm">Deadlocks Detectados</p>
                  <p className="text-2xl font-bold text-red-400">{concResult.summary.deadlocks_detected}</p>
                </div>
                <div className="bg-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-gray-400 text-sm">Timeouts</p>
                  <p className="text-2xl font-bold text-yellow-400">{concResult.summary.timeouts}</p>
                </div>
                <div className="bg-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-gray-400 text-sm">Resolucion</p>
                  <p className="text-sm font-medium text-green-400">{concResult.summary.resolved}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'top-slow' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Top 10 Consultas mas Lentas</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">#</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Query</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Duracion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Clasificacion</th>
                </tr>
              </thead>
              <tbody>
                {topSlow.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-8">No hay datos</td></tr>
                ) : topSlow.map((q, i) => (
                  <tr key={q.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-primary font-bold">#{i + 1}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate">{q.query_text}</td>
                    <td className="px-6 py-4 text-white font-semibold">{q.duration_ms} ms</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classColor[q.classification]}`}>
                        {q.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.classification} className={`bg-card rounded-xl p-6 border ${
                s.classification === 'Critical' ? 'border-red-800' :
                s.classification === 'Slow' ? 'border-yellow-800' :
                s.classification === 'Medium' ? 'border-blue-800' : 'border-green-800'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classColor[s.classification]}`}>
                    {s.classification}
                  </span>
                  <span className="text-2xl font-bold text-white">{s.total}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Promedio</span>
                    <span className="text-white">{parseFloat(s.avg_duration).toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Maximo</span>
                    <span className="text-white">{s.max_duration} ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minimo</span>
                    <span className="text-white">{s.min_duration} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}