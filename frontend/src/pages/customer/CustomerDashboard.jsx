// src/pages/customer/CustomerDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        <Link to="/customer/new-order" className="bg-brand-600 text-white px-4 py-2 rounded font-medium hover:bg-brand-700">
          + New Order
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading orders...</p>}
      {!loading && orders.length === 0 && (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-500">
          No orders yet. Create your first order!
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} to={`/customer/orders/${order.id}`}
            className="block bg-white border rounded-lg p-4 hover:shadow transition">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm text-gray-500">#{order.trackingId.slice(0, 10)}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-gray-500">From:</span> {order.pickupZone.name}</p>
              <p><span className="text-gray-500">To:</span> {order.dropZone.name}</p>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-500">{order.orderType} • {order.paymentType}</span>
              <span className="font-semibold">₹{order.totalCharge.toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;
