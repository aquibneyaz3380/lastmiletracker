// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackOrder from './pages/TrackOrder';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateOrder from './pages/customer/CreateOrder';
import OrderDetail from './pages/customer/OrderDetail';

// Agent pages
import AgentDashboard from './pages/agent/AgentDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCreateOrder from './pages/admin/AdminCreateOrder';
import AdminZones from './pages/admin/AdminZones';
import AdminRateCards from './pages/admin/AdminRateCards';
import AdminAgents from './pages/admin/AdminAgents';

const App = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer'} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/customer" /> : <Register />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/track/:trackingId" element={<TrackOrder />} />

          {/* Customer */}
          <Route path="/customer" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/new-order" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CreateOrder /></ProtectedRoute>} />
          <Route path="/customer/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderDetail /></ProtectedRoute>} />

          {/* Agent */}
          <Route path="/agent" element={<ProtectedRoute allowedRoles={['AGENT']}><AgentDashboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminOrderDetail /></ProtectedRoute>} />
          <Route path="/admin/new-order" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCreateOrder /></ProtectedRoute>} />
          <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminZones /></ProtectedRoute>} />
          <Route path="/admin/rate-cards" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRateCards /></ProtectedRoute>} />
          <Route path="/admin/agents" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAgents /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
