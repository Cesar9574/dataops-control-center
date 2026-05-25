import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { replicationService } from '../services/api';

export default function Replication() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any[]>([]);
  const [capAnalysis, setCapAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        replicationService.getStatus(),
        replicationService.getCapAnalysis(),
      ]);
      setStatus(sRes.data.data);
      setCapAnalysis(cRes.data.cap_theorem);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSimulate = async (scenario: string) => {
    try {
      const res = await replicationService.simulate(scenario);
      setMessage(`Escenario ${scenario} simulado. Lag: ${res.data.data.lag_seconds}s | Estado: ${res.data.data.estado}`);
      loadData();
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

  const lagColor: any = {
    Aceptable: 'text-green-400 bg-green-900/30 border-green-800',
    Advertencia: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    Critico: 'text-red-400 bg-red-900/30 border-red-800',
  };

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
          <h2 className="text-2xl font-bold text-white">Replicacion Distribuida</h2>
          <p className="text-gray-400">Modulo 6 — Arquitectura Primario-Replica y Analisis del Teorema CAP</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary text-primary rounded-lg">{message}</div>
        )}

        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { scenario: 'normal', label: 'Carga Normal', lag: '2 seg', color: 'border-green-800 hover:border-green-600' },
            { scenario: 'medium', label: 'Carga Media', lag: '5 seg', color: 'border-yellow-800 hover:border-yellow-600' },
            { scenario: 'high', label: 'Carga Alta', lag: '20 seg', color: 'border-red-800 hover:border-red-600' },
          ].map((s) => (
            <button key={s.scenario} onClick={() => handleSimulate(s.scenario)}
              className={`bg-card rounded-xl p-6 border ${s.color} text-left transition-colors`}>
              <p className="text-white font-semibold mb-1">{s.label}</p>
              <p className="text-gray-400 text-sm mb-3">Lag esperado: {s.lag}</p>
              <span className="text-primary text-sm font-medium">Simular escenario</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {['status', 'cap'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-gray-800'}`}>
              {tab === 'status' ? 'Historial de Lag' : 'Analisis Teorema CAP'}
            </button>
          ))}
        </div>

        {activeTab === 'status' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Primario</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Replica</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Lag</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Estado</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">Cargando...</td></tr>
                ) : status.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">Simula un escenario para ver datos</td></tr>
                ) : status.map((s) => (
                  <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white">{s.primary_host}</td>
                    <td className="px-6 py-4 text-gray-400">{s.replica_host}</td>
                    <td className="px-6 py-4 text-primary font-semibold">{s.lag_seconds}s</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${lagColor[s.estado]}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(s.capture_time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cap' && capAnalysis && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-1">{capAnalysis.title}</h3>
              <p className="text-primary text-sm mb-4">Clasificacion: {capAnalysis.classification}</p>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(capAnalysis.properties).map(([key, val]: any) => (
                  <div key={key} className="bg-dark rounded-lg p-4 border border-gray-800">
                    <p className="text-primary font-semibold capitalize mb-2">{key}</p>
                    <p className="text-white text-sm font-medium mb-2">Nivel: {val.level}</p>
                    <p className="text-gray-400 text-xs">{val.description}</p>
                    <p className="text-gray-500 text-xs mt-2 italic">{val.tradeoff}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Justificacion de Diseno</h3>
              <p className="text-gray-400">{capAnalysis.justification}</p>
            </div>
            <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold">Escenarios de Lag</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 px-6 py-4 text-sm">Escenario</th>
                    <th className="text-left text-gray-400 px-6 py-4 text-sm">Lag</th>
                    <th className="text-left text-gray-400 px-6 py-4 text-sm">Estado</th>
                    <th className="text-left text-gray-400 px-6 py-4 text-sm">Impacto</th>
                  </tr>
                </thead>
                <tbody>
                  {capAnalysis.lag_scenarios.map((s: any) => (
                    <tr key={s.scenario} className="border-b border-gray-800">
                      <td className="px-6 py-4 text-white">{s.scenario}</td>
                      <td className="px-6 py-4 text-primary font-semibold">{s.lag}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${lagColor[s.estado] || 'text-gray-400 bg-gray-900/30 border-gray-800'}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{s.impacto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}