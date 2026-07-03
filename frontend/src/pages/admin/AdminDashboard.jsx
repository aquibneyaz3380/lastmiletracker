// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

const STATUS_OPTIONS = ['PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'];

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ status: '', zoneId: '', agentId: '' });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filters.status)  params.status  = filters.status;
      if (filters.zoneId)  params.zoneId  = filters.zoneId;
      if (filters.agentId) params.agentId = filters.agentId;

      const [ordersRes, zonesRes, agentsRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/zones'),
        api.get('/admin/agents')
      ]);
      setOrders(ordersRes.data.orders);
      setTotal(ordersRes.data.total);
      setZones(zonesRes.data);
      setAgents(agentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters, page]);

  const handleAutoAssign = async (orderId) => {
    setActionId(orderId);
    try {
      const res = await api.post(`/admin/orders/${orderId}/auto-assign`);
      showToast(res.data.message || 'Agent auto-assigned');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Auto-assign failed');
    } finally {
      setActionId(null);
    }
  };

  const handleManualAssign = async (orderId, agentId) => {
    if (!agentId) return;
    setActionId(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/assign`, { agentId });
      showToast('Agent assigned successfully');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Assignment failed');
    } finally {
      setActionId(null);
    }
  };

  const handleOverrideStatus = async (orderId, status) => {
    if (!status) return;
    setActionId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      showToast('Status updated');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Status override failed');
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-12">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/zones"      className="bg-white border px-3 py-2 rounded text-sm font-medium hover:bg-gray-50">Zones</Link>
          <Link to="/admin/rate-cards" className="bg-white border px-3 py-2 rounded text-sm font-medium hover:bg-gray-50">Rate Cards</Link>
          <Link to="/admin/agents"     className="bg-white border px-3 py-2 rounded text-sm font-medium hover:bg-gray-50">Agents</Link>
          <Link to="/admin/new-order"  className="bg-brand-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-brand-700">+ New Order</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          className="border rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.zoneId} onChange={(e) => { setFilters({ ...filters, zoneId: e.target.value }); setPage(1); }}
          className="border rounded px-3 py-2 text-sm">
          <option value="">All Zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select value={filters.agentId} onChange={(e) => { setFilters({ ...filters, agentId: e.target.value }); setPage(1); }}
          className="border rounded px-3 py-2 text-sm">
          <option value="">All Agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.user.name}</option>)}
        </select>
        {(filters.status || filters.zoneId || filters.agentId) && (
          <button onClick={() => { setFilters({ status: '', zoneId: '', agentId: '' }); setPage(1); }}
            className="border rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            Clear Filters
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500 py-4">Loading orders...</p>}

      <div className="bg-white border rounded-lg overflow-x-auto shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Tracking ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Charge</th>
              <th className="px-4 py-3 min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link to={`/admin/orders/${order.id}`} className="text-brand-600 hover:underline">
                    {order.trackingId.slice(0, 10).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-xs text-gray-400">{order.customer.email}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  <p>{order.pickupZone.name}</p>
                  <p className="text-gray-400">↓ {order.dropZone.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.orderType === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.orderType}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{order.paymentType}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-xs">
                  {order.agent ? (
                    <span className="text-green-700 font-medium">{order.agent.user.name}</span>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">₹{order.totalCharge.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    {/* Auto-assign: show for PENDING and RESCHEDULED */}
                    {(order.status === 'PENDING' || order.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => handleAutoAssign(order.id)}
                        disabled={actionId === order.id}
                        className="text-xs bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-700 disabled:opacity-50">
                        {actionId === order.id ? '...' : 'Auto-Assign'}
                      </button>
                    )}
                    {/* Manual assign: show for PENDING and RESCHEDULED */}
                    {(order.status === 'PENDING' || order.status === 'RESCHEDULED') && (
                      <select
                        onChange={(e) => handleManualAssign(order.id, e.target.value)}
                        defaultValue=""
                        className="text-xs border rounded px-1 py-1">
                        <option value="" disabled>Assign agent...</option>
                        {agents.filter(a => a.isAvailable).map(a => (
                          <option key={a.id} value={a.id}>{a.user.name}</option>
                        ))}
                      </select>
                    )}
                    {/* Override status: always available */}
                    <select
                      onChange={(e) => handleOverrideStatus(order.id, e.target.value)}
                      defaultValue=""
                      className="text-xs border rounded px-1 py-1">
                      <option value="" disabled>Override status...</option>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="text-center text-gray-500 py-10">No orders found</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
