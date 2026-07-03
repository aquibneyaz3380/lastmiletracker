// src/pages/admin/AdminOrderDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
          <div><p className="text-gray-500">Customer</p><p className="font-medium">{order.customer.name}</p><p className="text-gray-400">{order.customer.email}</p></div>
          <div><p className="text-gray-500">Agent</p><p className="font-medium">{order.agent ? order.agent.user.name : 'Not assigned'}</p></div>
          <div><p className="text-gray-500">Pickup</p><p className="font-medium">{order.pickupAddress}</p><p className="text-gray-400">{order.pickupZone.name}</p></div>
          <div><p className="text-gray-500">Drop</p><p className="font-medium">{order.dropAddress}</p><p className="text-gray-400">{order.dropZone.name}</p></div>
          <div><p className="text-gray-500">Order Type</p><p className="font-medium">{order.orderType}</p></div>
          <div><p className="text-gray-500">Payment</p><p className="font-medium">{order.paymentType}</p></div>
        </div>
        <div className="bg-gray-50 rounded p-4 text-sm space-y-1 mb-4">
          <p><span className="text-gray-500">Dimensions:</span> {order.length}×{order.breadth}×{order.height} cm</p>
          <p><span className="text-gray-500">Actual Weight:</span> {order.actualWeight} kg</p>
          <p><span className="text-gray-500">Volumetric Weight:</span> {order.volumetricWeight} kg</p>
          <p><span className="text-gray-500">Chargeable Weight:</span> {order.chargeableWeight} kg</p>
          <p className="border-t pt-1"><span className="text-gray-500">Base Charge:</span> ₹{order.baseCharge.toFixed(2)}</p>
          <p><span className="text-gray-500">COD Surcharge:</span> ₹{order.codSurcharge.toFixed(2)}</p>
          <p><span className="font-medium">Total:</span> ₹{order.totalCharge.toFixed(2)}</p>
        </div>
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
                <p className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()} • {event.actorRole}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
