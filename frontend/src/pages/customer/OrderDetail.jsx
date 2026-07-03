// src/pages/customer/OrderDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [message, setMessage] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setRescheduling(true);
    setMessage('');
    try {
      await api.post(`/orders/${id}/reschedule`, { scheduledDate: rescheduleDate });
      setMessage('Order rescheduled successfully!');
      fetchOrder();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to reschedule');
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!order) return <p className="text-center mt-10 text-gray-500">Order not found</p>;

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 pb-12">
      <div className="bg-white border rounded-lg p-6 shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">Tracking ID</p>
            <p className="font-mono font-semibold">{order.trackingId}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><p className="text-gray-500">Pickup</p><p className="font-medium">{order.pickupAddress}</p></div>
          <div><p className="text-gray-500">Drop</p><p className="font-medium">{order.dropAddress}</p></div>
          <div><p className="text-gray-500">Order Type</p><p className="font-medium">{order.orderType}</p></div>
          <div><p className="text-gray-500">Payment</p><p className="font-medium">{order.paymentType}</p></div>
        </div>

        <div className="bg-gray-50 rounded p-4 text-sm space-y-1 mb-4">
          <p><span className="text-gray-500">Actual Weight:</span> {order.actualWeight} kg</p>
          <p><span className="text-gray-500">Volumetric Weight:</span> {order.volumetricWeight} kg</p>
          <p><span className="text-gray-500">Chargeable Weight:</span> {order.chargeableWeight} kg</p>
          <p className="pt-1 border-t"><span className="text-gray-500">Total Charge:</span>{' '}
            <strong>₹{order.totalCharge.toFixed(2)}</strong></p>
        </div>

        {order.agent && (
          <div className="text-sm mb-4 bg-blue-50 p-3 rounded">
            <p className="text-gray-500">Delivery Agent</p>
            <p className="font-medium">{order.agent.user.name} • {order.agent.user.phone}</p>
          </div>
        )}

        {order.status === 'FAILED' && (
          <form onSubmit={handleReschedule} className="border-t pt-4 mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Reschedule Delivery</p>
            <div className="flex gap-2">
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm" />
              <button type="submit" disabled={rescheduling}
                className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {rescheduling ? 'Saving...' : 'Reschedule'}
              </button>
            </div>
            {message && <p className="text-sm text-gray-600">{message}</p>}
          </form>
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
    </div>
  );
};

export default OrderDetail;
