import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService, alertsService, backupsService, queriesService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [alertSummary, setAlertSummary] = useState<any>(null);
  const [slaSummary, setSlaSummary] = useState<any>(null);
  const [queryStats, setQueryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [metricRes, alertRes, slaRes, queryRes] = await Promise.all([
        metricsService.getSummary(),
        alertsService.getSummary(),
        backupsService.getSLA(),
        queriesService.getStats(),
      ]);
      setSummary(metricRes.data.data);
      setAlertSummary(alertRes.data.data);
      setSlaSummary(slaRes.data.data);
      setQueryStats(queryRes.data.data);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Conexiones', icon: '🔌', path: '/connections' },
    { label: 'Métricas', icon: '📈', path: '/metrics' },
    { label: 'Queries', icon: '🔍', path: '/queries' },
    { label: 'Backups', icon: '💾', path: '/backups' },
    { label: 'Alertas', icon: '🚨', path: '/alerts' },
    { label: 'Replicación', icon: '🔄', path: '/replication' },
    { label: 'Caché', icon: '⚡', path: '/cache' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-primary text-2xl">⏳ Cargando DataOps...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex">

      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">🗄️ DataOps</h1>
          <p className="text-primary text-sm">Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                window.location.pathname === item.path
                  ? 'bg-primary text-dark font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
             Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Dashboard General</h2>
          <p className="text-gray-400">Monitoreo en tiempo real — actualiza cada 30 segundos</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Bases Saludables</p>
            <p className="text-3xl font-bold text-green-400">{summary?.healthy || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Estado: Healthy</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">En Advertencia</p>
            <p className="text-3xl font-bold text-yellow-400">{summary?.warning || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Estado: Warning</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Estado Crítico</p>
            <p className="text-3xl font-bold text-red-400">{summary?.critical || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Estado: Critical</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Alertas Abiertas</p>
            <p className="text-3xl font-bold text-primary">{alertSummary?.abiertas || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Requieren atención</p>
          </div>
        </div>

        {/* Segunda fila de KPIs */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">SLA Cumplido</p>
            <p className="text-3xl font-bold text-green-400">{slaSummary?.sla_cumplido || 0}</p>
            <p className="text-gray-500 text-xs mt-1">RPO ≤ 15min / RTO ≤ 45min</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Backups Exitosos</p>
            <p className="text-3xl font-bold text-blue-400">{slaSummary?.exitosos || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Total registrados</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Alertas Críticas</p>
            <p className="text-3xl font-bold text-red-400">{alertSummary?.criticas_abiertas || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Severidad Critical</p>
          </div>
        </div>

        {/* Query Stats */}
        <div className="bg-card rounded-xl p-6 border border-gray-800 mb-8">
          <h3 className="text-white font-semibold mb-4">📊 Clasificación de Consultas</h3>
          {queryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={queryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="classification" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="total" stroke="#00f5d4" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_duration" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay datos de queries aún. Simula algunas desde la sección Queries.
            </div>
          )}
        </div>

        {/* Estado general */}
        <div className="bg-card rounded-xl p-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">🔗 Accesos Rápidos</h3>
          <div className="grid grid-cols-4 gap-4">
            {navItems.slice(1).map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-4 bg-dark rounded-lg border border-gray-800 hover:border-primary transition-colors text-center"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}