// src/pages/admin/AdminZones.jsx
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminZones = () => {
  const [zones, setZones] = useState([]);
  const [zoneName, setZoneName] = useState('');
  const [areaForms, setAreaForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/zones');
      setZones(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchZones(); }, []);

  const createZone = async (e) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    try {
      await api.post('/zones', { name: zoneName.trim() });
      setZoneName('');
      setMsg('Zone created!');
      fetchZones();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const addArea = async (e, zoneId) => {
    e.preventDefault();
    const form = areaForms[zoneId] || {};
    if (!form.name || !form.pincode) return;
    try {
      await api.post(`/zones/${zoneId}/areas`, { name: form.name, pincode: form.pincode });
      setAreaForms(prev => ({ ...prev, [zoneId]: {} }));
      setMsg('Area added!');
      fetchZones();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const deleteZone = async (zoneId) => {
    if (!window.confirm('Delete this zone? This may affect existing orders.')) return;
    try {
      await api.delete(`/zones/${zoneId}`);
      fetchZones();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const updateAreaForm = (zoneId, field, value) => {
    setAreaForms(prev => ({ ...prev, [zoneId]: { ...(prev[zoneId] || {}), [field]: value } }));
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 pb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Zones & Areas</h2>
      {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{msg}</div>}

      <div className="bg-white border rounded-lg p-5 shadow mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Create Zone</h3>
        <form onSubmit={createZone} className="flex gap-2">
          <input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Zone name"
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700">
            Add Zone
          </button>
        </form>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      <div className="space-y-4">
        {zones.map(zone => (
          <div key={zone.id} className="bg-white border rounded-lg p-5 shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">{zone.name}</h3>
              <button onClick={() => deleteZone(zone.id)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded">
                Delete
              </button>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Areas ({zone.areas.length})</p>
              <div className="flex flex-wrap gap-2">
                {zone.areas.map(area => (
                  <span key={area.id} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                    {area.name} ({area.pincode})
                  </span>
                ))}
              </div>
            </div>
            <form onSubmit={e => addArea(e, zone.id)} className="flex gap-2 mt-2">
              <input value={areaForms[zone.id]?.name || ''} onChange={e => updateAreaForm(zone.id, 'name', e.target.value)}
                placeholder="Area name" className="flex-1 border rounded px-2 py-1.5 text-xs" />
              <input value={areaForms[zone.id]?.pincode || ''} onChange={e => updateAreaForm(zone.id, 'pincode', e.target.value)}
                placeholder="Pincode" className="w-28 border rounded px-2 py-1.5 text-xs" />
              <button type="submit"
                className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-800">
                + Area
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminZones;
