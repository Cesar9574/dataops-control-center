import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionsService } from '../services/api';

export default function Connections() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', motor: 'PostgreSQL', host: '',
    port: '', database_name: '', user_name: '', password: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    try {
      const res = await connectionsService.getAll();
      setConnections(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await connectionsService.create({ ...form, port: parseInt(form.port) });
      setMessage('Conexion registrada exitosamente');
      setShowForm(false);
      setForm({ nombre: '', motor: 'PostgreSQL', host: '', port: '', database_name: '', user_name: '', password: '' });
      loadConnections();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error registrando conexion');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await connectionsService.delete(id);
      loadConnections();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor: any = {
    ACTIVE: 'text-green-400 bg-green-900/30',
    INACTIVE: 'text-yellow-400 bg-yellow-900/30',
    ERROR: 'text-red-400 bg-red-900/30'
  };

  return (
    <div className="min-h-screen bg-dark flex">
      <div className="w-64 bg-card border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">DataOps</h1>
          <p className="text-primary text-sm">Control Center</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Conexiones', path: '/connections' },
            { label: 'Metricas', path: '/metrics' },
            { label: 'Queries', path: '/queries' },
            { label: 'Backups', path: '/backups' },
            { label: 'Alertas', path: '/alerts' },
            { label: 'Replicacion', path: '/replication' },
            { label: 'Cache', path: '/cache' },
          ].map((item) => (
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Registro de Motores</h2>
            <p className="text-gray-400">Modulo 1 — Gestiona las conexiones de bases de datos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary text-dark font-bold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
            {showForm ? 'Cancelar' : 'Nueva Conexion'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500 text-green-400 rounded-lg">
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-card rounded-xl p-6 border border-gray-800 mb-8">
            <h3 className="text-white font-semibold mb-4">Registrar Nueva Conexion</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Mi Base de Datos" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Motor</label>
                <select value={form.motor} onChange={e => setForm({...form, motor: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary">
                  <option>PostgreSQL</option>
                  <option>SQLServer</option>
                  <option>Oracle</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Host</label>
                <input value={form.host} onChange={e => setForm({...form, host: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="localhost" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Puerto</label>
                <input value={form.port} onChange={e => setForm({...form, port: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="5432" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Base de Datos</label>
                <input value={form.database_name} onChange={e => setForm({...form, database_name: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="mi_base" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Usuario</label>
                <input value={form.user_name} onChange={e => setForm({...form, user_name: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="admin" required />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm mb-1 block">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-dark border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="••••••••" required />
              </div>
              <div className="col-span-2">
                <button type="submit"
                  className="bg-primary text-dark font-bold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Registrar Conexion
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Nombre</th>
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Motor</th>
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Host</th>
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Base</th>
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Estado</th>
                <th className="text-left text-gray-400 px-6 py-4 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Cargando...</td></tr>
              ) : connections.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No hay conexiones registradas</td></tr>
              ) : connections.map((conn) => (
                <tr key={conn.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-white font-medium">{conn.nombre}</td>
                  <td className="px-6 py-4 text-primary">{conn.motor}</td>
                  <td className="px-6 py-4 text-gray-400">{conn.host}:{conn.port}</td>
                  <td className="px-6 py-4 text-gray-400">{conn.database_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[conn.status]}`}>
                      {conn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(conn.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}