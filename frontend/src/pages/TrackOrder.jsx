// src/pages/TrackOrder.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/shared/StatusBadge';

const TrackOrder = () => {
  const { trackingId: paramId } = useParams();
  const [trackingId, setTrackingId] = useState(paramId || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (id) => {
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await api.get(`/tracking/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) handleTrack(paramId);
    // eslint-disable-next-line
  }, [paramId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) handleTrack(trackingId.trim());
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Track Your Order</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={trackingId} onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Enter tracking ID"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded font-medium hover:bg-brand-700">
          Track
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>}

      {order && (
        <div className="bg-white border rounded-lg p-6 shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Tracking ID</p>
              <p className="font-mono font-semibold">{order.trackingId}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Pickup</p>
              <p className="font-medium">{order.pickupAddress}</p>
            </div>
            <div>
              <p className="text-gray-500">Drop</p>
              <p className="font-medium">{order.dropAddress}</p>
            </div>
          </div>
          {order.agent && (
            <div className="text-sm mb-4 bg-gray-50 p-3 rounded">
              <p className="text-gray-500">Delivery Agent</p>
              <p className="font-medium">{order.agent.name} • {order.agent.phone}</p>
            </div>
          )}
          {order.scheduledDate && (
            <p className="text-sm mb-4">
              <span className="text-gray-500">Scheduled:</span>{' '}
              {new Date(order.scheduledDate).toLocaleDateString()}
            </p>
          )}

          <h3 className="font-semibold text-gray-800 mb-2 mt-6">Tracking Timeline</h3>
          <div className="space-y-3">
            {order.trackingHistory.map((event, idx) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                  {idx < order.trackingHistory.length - 1 && <div className="w-px flex-1 bg-gray-200"></div>}
                </div>
                <div className="pb-3">
                  <p className="font-medium text-sm">{event.status.replace(/_/g, ' ')}</p>
                  {event.note && <p className="text-xs text-gray-500">{event.note}</p>}
                  <p className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
