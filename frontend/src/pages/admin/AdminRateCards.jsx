// src/pages/admin/AdminRateCards.jsx
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminRateCards = () => {
  const [rateCards, setRateCards] = useState([]);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ orderType: 'B2C', fromZoneId: '', toZoneId: '', ratePerKg: '', codSurcharge: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rcRes, zRes] = await Promise.all([api.get('/rate-cards'), api.get('/zones')]);
      setRateCards(rcRes.data);
      setZones(zRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/rate-cards', form);
      setMsg('Rate card saved!');
      setForm({ orderType: 'B2C', fromZoneId: '', toZoneId: '', ratePerKg: '', codSurcharge: '' });
      fetchData();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const deleteRateCard = async (id) => {
    if (!window.confirm('Delete this rate card?')) return;
    try {
      await api.delete(`/rate-cards/${id}`);
      fetchData();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rate Cards</h2>
      {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{msg}</div>}

      <div className="bg-white border rounded-lg p-5 shadow mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Add / Update Rate Card</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select name="orderType" value={form.orderType} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Zone</label>
            <select name="fromZoneId" required value={form.fromZoneId} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Zone</label>
            <select name="toZoneId" required value={form.toZoneId} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate per kg (₹)</label>
            <input type="number" step="0.01" name="ratePerKg" required value={form.ratePerKg} onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">COD Surcharge (₹)</label>
            <input type="number" step="0.01" name="codSurcharge" value={form.codSurcharge} onChange={handleChange}
              placeholder="0"
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded font-medium hover:bg-brand-700 text-sm">
              Save Rate Card
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      <div className="bg-white border rounded-lg overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">From Zone</th>
              <th className="px-4 py-3">To Zone</th>
              <th className="px-4 py-3">Rate/kg</th>
              <th className="px-4 py-3">COD Surcharge</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rateCards.map(rc => (
              <tr key={rc.id} className="border-t">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${rc.orderType === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {rc.orderType}
                  </span>
                </td>
                <td className="px-4 py-3">{rc.fromZone.name}</td>
                <td className="px-4 py-3">{rc.toZone?.name}</td>
                <td className="px-4 py-3">₹{rc.ratePerKg}</td>
                <td className="px-4 py-3">₹{rc.codSurcharge}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteRateCard(rc.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rateCards.length === 0 && <p className="text-center text-gray-500 py-8">No rate cards yet</p>}
      </div>
    </div>
  );
};

export default AdminRateCards;
