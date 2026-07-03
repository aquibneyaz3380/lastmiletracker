// src/pages/admin/AdminAgents.jsx
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', zoneId: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agRes, zRes] = await Promise.all([api.get('/admin/agents'), api.get('/zones')]);
      setAgents(agRes.data);
      setZones(zRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.post('/admin/agents', form);
      setMsg('Agent created successfully!');
      setForm({ name: '', email: '', password: '', phone: '', zoneId: '', latitude: '', longitude: '' });
      fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create agent'); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Agents</h2>
      {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{msg}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>}

      <div className="bg-white border rounded-lg p-5 shadow mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Add New Agent</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select name="zoneId" required value={form.zoneId} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange}
                placeholder="Optional" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange}
                placeholder="Optional" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="col-span-2">
            <button type="submit"
              className="bg-brand-600 text-white px-5 py-2 rounded font-medium hover:bg-brand-700 text-sm">
              Create Agent
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      <div className="bg-white border rounded-lg overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 font-medium">{a.user.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.user.email}</td>
                <td className="px-4 py-3">{a.zone.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {a.latitude && a.longitude ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && agents.length === 0 && <p className="text-center text-gray-500 py-8">No agents yet</p>}
      </div>
    </div>
  );
};

export default AdminAgents;
