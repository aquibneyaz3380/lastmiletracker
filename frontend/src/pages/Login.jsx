// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const dest = user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow border">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-brand-600 text-white py-2 rounded font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4 text-center">
        Don't have an account? <Link to="/register" className="text-brand-600 font-medium">Sign Up</Link>
      </p>
      <div className="mt-6 text-xs text-gray-400 border-t pt-4">
        <p>Demo accounts:</p>
        <p>Admin: admin@lastmile.com / Admin@123</p>
        <p>Agent: agent1@lastmile.com / Agent@123</p>
        <p>Customer: customer1@lastmile.com / Customer@123</p>
      </div>
    </div>
  );
};

export default Login;
