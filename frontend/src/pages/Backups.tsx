import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backupsService } from '../services/api';

export default function Backups() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState<any[]>([]);
  const [sla, setSla] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historial');
  const [message, setMessage] = useState('');
  const [simForm, setSimForm] = useState({ db_id: '1', tipo: 'FULL' });
  const [snapForm, setSnapForm] = useState({ db_id: '1', snapshot_name: 'PRE_DEPLOY' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([backupsService.getAll(), backupsService.getSLA()]);
      setBackups(bRes.data.data);
      setSla(sRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await backupsService.simulate({ db_id: parseInt(simForm.db_id), tipo: simForm.tipo });
      setMessage(`Backup ${simForm.tipo} ejecutado y replicado a la nube exitosamente`);
      loadData();
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const handleSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await backupsService.createSnapshot({ db_id: parseInt(snapForm.db_id), snapshot_name: snapForm.snapshot_name });
      setMessage(`Snapshot ${snapForm.snapshot_name} creado exitosamente`);
      loadData();
    } catch (err: any) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await backupsService.restore(id);
      setMessage(`Restauracion completada. RPO: ${res.data.restore_details.rpo_minutes} min | RTO: ${res.data.restore_details.rto_minutes} min | SLA: ${res.data.restore_details.sla_cumplido ? 'CUMPLIDO' : 'INCUMPLIDO'}`);
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

  const statusColor: any = {
    SUCCESS: 'text-green-400 bg-green-900/30',
    FAILED: 'text-red-400 bg-red-900/30',
    RUNNING: 'text-yellow-400 bg-yellow-900/30',
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
          <h2 className="text-2xl font-bold text-white">Backup, Recovery y Replicacion a la Nube</h2>
          <p className="text-gray-400">Modulo 5 — Full, Diferencial, Incremental, Snapshots y AWS S3</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary text-primary rounded-lg">{message}</div>
        )}

        {sla && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">SLA Cumplido</p>
              <p className="text-3xl font-bold text-green-400">{sla.data?.sla_cumplido || 0}</p>
              <p className="text-gray-500 text-xs mt-1">RPO 15min / RTO 45min</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Total Backups</p>
              <p className="text-3xl font-bold text-white">{sla.data?.total_backups || 0}</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">RPO Promedio</p>
              <p className="text-3xl font-bold text-blue-400">{parseFloat(sla.data?.avg_rpo || 0).toFixed(0)} min</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">RTO Promedio</p>
              <p className="text-3xl font-bold text-yellow-400">{parseFloat(sla.data?.avg_rto || 0).toFixed(0)} min</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {['historial', 'simular', 'snapshot'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-gray-800'}`}>
              {tab === 'historial' ? 'Historial' : tab === 'simular' ? 'Ejecutar Backup' : 'Snapshots'}
            </button>
          ))}
        </div>

        {activeTab === 'historial' && (
          <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Base</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Tipo</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Tamano</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Duracion</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">SLA</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Estado</th>
                  <th className="text-left text-gray-400 px-6 py-4 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-8">Cargando...</td></tr>
                ) : backups.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-8">No hay backups registrados</td></tr>
                ) : backups.map((b) => (
                  <tr key={b.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white">{b.db_nombre}</td>
                    <td className="px-6 py-4 text-primary font-semibold">{b.tipo}</td>
                    <td className="px-6 py-4 text-gray-400">{parseFloat(b.size_mb).toFixed(0)} MB</td>
                    <td className="px-6 py-4 text-gray-400">{b.duration_seconds}s</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${b.sla_status === 'SLA_CUMPLIDO' ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
                        {b.sla_status === 'SLA_CUMPLIDO' ? 'Cumplido' : 'Incumplido'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleRestore(b.id)}
                        className="text-primary hover:opacity-70 text-sm transition-opacity">
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'simular' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">Ejecutar Backup</h3>
            <p className="text-gray-400 text-sm mb-6">El backup se replica automaticamente a AWS S3 con verificacion de integridad MD5.</p>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">ID de Conexion</label>
                  <input type="number" value={simForm.db_id}
                    onChange={e => setSimForm({...simForm, db_id: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Tipo de Backup</label>
                  <select value={simForm.tipo} onChange={e => setSimForm({...simForm, tipo: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary">
                    <option value="FULL">FULL — Copia completa</option>
                    <option value="DIFF">DIFF — Diferencial</option>
                    <option value="INC">INC — Incremental</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-dark rounded-lg border border-gray-800">
                <p className="text-gray-400 text-sm">Cadena de restauracion: <span className="text-primary">FULL → DIFF → INC</span></p>
                <p className="text-gray-500 text-xs mt-1">SLA objetivo: RPO = 15 minutos | RTO = 45 minutos</p>
              </div>
              <button type="submit" className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Ejecutar Backup
              </button>
            </form>
          </div>
        )}

        {activeTab === 'snapshot' && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">Crear Snapshot de Entorno</h3>
            <p className="text-gray-400 text-sm mb-6">Crea puntos de restauracion nombrados antes de operaciones criticas.</p>
            <form onSubmit={handleSnapshot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">ID de Conexion</label>
                  <input type="number" value={snapForm.db_id}
                    onChange={e => setSnapForm({...snapForm, db_id: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Tipo de Snapshot</label>
                  <select value={snapForm.snapshot_name} onChange={e => setSnapForm({...snapForm, snapshot_name: e.target.value})}
                    className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary">
                    <option value="PRE_DEPLOY">PRE_DEPLOY</option>
                    <option value="PRE_TEST">PRE_TEST</option>
                    <option value="PRE_IMPORT">PRE_IMPORT</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90">
                Crear Snapshot
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}