// src/pages/agent/AgentDashboard.jsx
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

const NEXT_STATUS = {
  ASSIGNED:         'PICKED_UP',
  PICKED_UP:        'IN_TRANSIT',
  IN_TRANSIT:       'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: null // special: DELIVERED or FAILED
};

const STATUS_LABELS = {
  PICKED_UP:        'Mark Picked Up',
  IN_TRANSIT:       'Mark In Transit',
  OUT_FOR_DELIVERY: 'Mark Out for Delivery'
};

const AgentDashboard = () => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [locationMsg, setLocationMsg] = useState('');
  const [locLoading, setLocLoading]   = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agent/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId + status);
    try {
      await api.patch(`/agent/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Update GPS location using browser Geolocation API
  const updateLocation = () => {
    if (!navigator.geolocation) {
      setLocationMsg('Geolocation not supported by this browser');
      return;
    }
    setLocLoading(true);
    setLocationMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.patch('/agent/location', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setLocationMsg(`Location updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        } catch (err) {
          setLocationMsg('Failed to update location on server');
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocationMsg('Location access denied or unavailable');
        setLocLoading(false);
      }
    );
  };

  const activeOrders    = orders.filter(o => !['DELIVERED', 'FAILED'].includes(o.status));
  const completedOrders = orders.filter(o =>  ['DELIVERED', 'FAILED'].includes(o.status));

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Deliveries</h2>
        {/* GPS location update for better auto-assignment */}
        <div className="text-right">
          <button
            onClick={updateLocation}
            disabled={locLoading}
            className="text-sm bg-white border px-3 py-2 rounded hover:bg-gray-50 disabled:opacity-50">
            {locLoading ? 'Updating...' : '📍 Update My Location'}
          </button>
          {locationMsg && <p className="text-xs text-gray-500 mt-1">{locationMsg}</p>}
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Active Deliveries ({activeOrders.length})
      </h3>
      <div className="space-y-4 mb-8">
        {activeOrders.length === 0 && !loading && (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            No active deliveries assigned to you.
          </div>
        )}
        {activeOrders.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-5 shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-xs text-gray-400">
                  #{order.trackingId.slice(0, 12).toUpperCase()}
                </span>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>{order.orderType} • {order.paymentType}</p>
                <p className="font-semibold text-gray-800">₹{order.totalCharge.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm mb-3">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500 font-medium">CUSTOMER</p>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-gray-600">{order.customer.phone || order.customer.email}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                <p>{order.pickupAddress}</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-gray-500 font-medium">DROP</p>
                <p>{order.dropAddress}</p>
              </div>
            </div>

            {/* Status action buttons */}
            <div className="flex gap-2 mt-3">
              {order.status === 'OUT_FOR_DELIVERY' ? (
                <>
                  <button
                    onClick={() => updateStatus(order.id, 'DELIVERED')}
                    disabled={!!updatingId}
                    className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {updatingId === order.id + 'DELIVERED' ? 'Updating...' : '✓ Mark Delivered'}
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, 'FAILED')}
                    disabled={!!updatingId}
                    className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    {updatingId === order.id + 'FAILED' ? 'Updating...' : '✗ Mark Failed'}
                  </button>
                </>
              ) : NEXT_STATUS[order.status] ? (
                <button
                  onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                  disabled={!!updatingId}
                  className="w-full bg-brand-600 text-white py-2 rounded text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                  {updatingId === order.id + NEXT_STATUS[order.status]
                    ? 'Updating...'
                    : STATUS_LABELS[NEXT_STATUS[order.status]]}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Completed ({completedOrders.length})
      </h3>
      <div className="space-y-2">
        {completedOrders.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-4 flex justify-between items-center opacity-70">
            <span className="font-mono text-xs text-gray-500">
              #{order.trackingId.slice(0, 12).toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{order.customer.name}</span>
            <StatusBadge status={order.status} />
          </div>
        ))}
        {completedOrders.length === 0 && !loading && (
          <p className="text-gray-400 text-sm text-center py-4">No completed deliveries yet</p>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
