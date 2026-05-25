import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsService } from '../services/api';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('alertas');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [ruleForm, setRuleForm] = useState({
    nombre: '', condicion: '', umbral: '', severidad: 'Warning', accion: 'EMAIL'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [aRes, rRes, sRes] = await Promise.all([
        alertsService.getAll(),
        alertsService.getRules(),
        alertsService.getSummary(),
      ]);
      setAlerts(aRes.data.data);
      setRules(rRes.data.data);
      setSummary(sRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertsService.resolve(id);
      setMessage('Alerta resuelta exitosamente');
      loadData();
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await alertsService.createRule({ ...ruleForm, umbral: parseFloat(ruleForm.umbral) });
      setMessage('Regla creada exitosamente sin necesidad de redeploy');
      setRuleForm({ nombre: '', condicion: '', umbral: '', severidad: 'Warning', accion: 'EMAIL' });
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

  const severityColor: any = {
    Critical: 'text-red-400 bg-red-900/30 border-red-800',
    Warning: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  };

  const statusColor: any = {
    OPEN: 'text-red-400',
    RESOLVED: 'text-green-400',
    ACKNOWLEDGED: 'text-yellow-400',
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
          <h2 className="text-2xl font-bold text-white">Motor de Alertas</h2>
          <p className="text-gray-400">Modulo 9 — Alertas inteligentes configurables sin redeploy</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary text-primary rounded-lg">{message}</div>
        )}

        {summary && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Alertas Abiertas</p>
              <p className="text-3xl font-bold text-red-400">{summary.abiertas}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Criticas Abiertas</p>
              <p className="text-3xl font-bold text-red-600">{summary.criticas_abiertas}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Warnings Abiertos</p>
              <p className="text-3xl font-bold text-yellow-400">{summary.warnings_abiertos}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Resueltas</p>
              <p className="text-3xl font-bold text-green-400">{summary.resueltas}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {['alertas', 'reglas', 'nueva-regla'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-gray-800'}`}>
              {tab === 'alertas' ? 'Alertas Activas' : tab === 'reglas' ? 'Reglas Configuradas' : 'Nueva Regla'}
            </button>
          ))}
        </div>

        {activeTab === 'alertas' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Condicion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Motor</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Severidad</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Estado</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Mensaje</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">Cargando...</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">No hay alertas registradas</td></tr>
                ) : alerts.map((a) => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white font-medium">{a.condicion}</td>
                    <td className="px-6 py-4 text-gray-400">{a.motor_afectado}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${severityColor[a.severidad]}`}>
                        {a.severidad}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-semibold text-sm ${statusColor[a.estado]}`}>{a.estado}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">{a.mensaje}</td>
                    <td className="px-6 py-4">
                      {a.estado === 'OPEN' && (
                        <button onClick={() => handleResolve(a.id)}
                          className="text-primary hover:opacity-70 text-sm transition-opacity">
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reglas' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Nombre</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Condicion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Umbral</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Severidad</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Accion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Activa</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white font-medium">{r.nombre}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{r.condicion}</td>
                    <td className="px-6 py-4 text-primary font-semibold">{r.umbral}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${severityColor[r.severidad]}`}>
                        {r.severidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{r.accion}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${r.activa ? 'text-green-400' : 'text-gray-500'}`}>
                        {r.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'nueva-regla' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">Nueva Regla de Alerta</h3>
            <p className="text-gray-400 text-sm mb-6">Las reglas se aplican inmediatamente sin necesidad de reiniciar la aplicacion.</p>
            <form onSubmit={handleCreateRule} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
                <input value={ruleForm.nombre} onChange={e => setRuleForm({...ruleForm, nombre: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="CPU Critica" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Condicion</label>
                <input value={ruleForm.condicion} onChange={e => setRuleForm({...ruleForm, condicion: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="cpu > umbral" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Umbral</label>
                <input type="number" value={ruleForm.umbral} onChange={e => setRuleForm({...ruleForm, umbral: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="85" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Severidad</label>
                <select value={ruleForm.severidad} onChange={e => setRuleForm({...ruleForm, severidad: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary">
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm mb-1 block">Accion</label>
                <select value={ruleForm.accion} onChange={e => setRuleForm({...ruleForm, accion: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary">
                  <option value="EMAIL">Correo electronico</option>
                  <option value="DASHBOARD">Alerta en dashboard</option>
                  <option value="EMAIL_ALARM">Alarma roja + correo</option>
                  <option value="NOTIFICATION">Notificacion automatica</option>
                </select>
              </div>
              <div className="col-span-2">
                <button type="submit" className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                  Crear Regla
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}