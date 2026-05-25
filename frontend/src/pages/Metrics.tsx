import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Metrics() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) loadHistory(selected);
  }, [selected]);

  const loadMetrics = async () => {
    try {
      const res = await metricsService.getAll();
      setMetrics(res.data.data);
      if (res.data.data.length > 0 && !selected) {
        setSelected(res.data.data[0].db_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (id: number) => {
    try {
      const res = await metricsService.getHistory(id, 20);
      setHistory(res.data.data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const healthColor: any = {
    Healthy: 'text-green-400 bg-green-900/30 border-green-800',
    Warning: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    Critical: 'text-red-400 bg-red-900/30 border-red-800',
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
          <h2 className="text-2xl font-bold text-white">Health Check Automatico</h2>
          <p className="text-gray-400">Modulo 2 — Metricas en tiempo real, actualiza cada minuto</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-16">Cargando metricas...</div>
        ) : metrics.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No hay metricas disponibles. El health check se ejecuta cada minuto automaticamente.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {metrics.map((m) => (
                <div key={m.db_id}
                  onClick={() => setSelected(m.db_id)}
                  className={`bg-card rounded-xl p-6 border cursor-pointer transition-all ${
                    selected === m.db_id ? 'border-primary' : 'border-gray-800 hover:border-gray-600'
                  }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{m.nombre}</h3>
                      <p className="text-gray-500 text-sm">{m.motor}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${healthColor[m.health_status]}`}>
                      {m.health_status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">CPU</span>
                        <span className="text-white">{parseFloat(m.cpu).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${parseFloat(m.cpu) > 85 ? 'bg-red-500' : parseFloat(m.cpu) > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(parseFloat(m.cpu), 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Memoria</span>
                        <span className="text-white">{parseFloat(m.memory).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${parseFloat(m.memory) > 85 ? 'bg-red-500' : parseFloat(m.memory) > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(parseFloat(m.memory), 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Disco</span>
                        <span className="text-white">{parseFloat(m.disk_usage).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${parseFloat(m.disk_usage) > 90 ? 'bg-red-500' : parseFloat(m.disk_usage) > 75 ? 'bg-yellow-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(parseFloat(m.disk_usage), 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center">
                        <p className="text-white font-semibold">{m.connections}</p>
                        <p className="text-gray-500 text-xs">Conexiones</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">{m.locks}</p>
                        <p className="text-gray-500 text-xs">Locks</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${m.deadlocks > 0 ? 'text-red-400' : 'text-white'}`}>{m.deadlocks}</p>
                        <p className="text-gray-500 text-xs">Deadlocks</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Historial de CPU y Memoria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="capture_time"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                      stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => `${parseFloat(value).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="cpu" stroke="#00f5d4" strokeWidth={2} name="CPU" dot={false} />
                    <Line type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} name="Memoria" dot={false} />
                    <Line type="monotone" dataKey="disk_usage" stroke="#ef4444" strokeWidth={2} name="Disco" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}