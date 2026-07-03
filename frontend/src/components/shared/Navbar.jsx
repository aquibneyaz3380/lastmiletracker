// src/components/shared/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homeLink = user?.role === 'ADMIN' ? '/admin' : user?.role === 'AGENT' ? '/agent' : '/customer';

  return (
    <nav className="bg-brand-700 text-white px-6 py-4 flex justify-between items-center shadow">
      <Link to={user ? homeLink : '/'} className="text-xl font-bold">
        📦 LastMile
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {!user && (
          <>
            <Link to="/track" className="hover:underline">Track Order</Link>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-brand-700 px-3 py-1.5 rounded font-medium">Sign Up</Link>
          </>
        )}
        {user && (
          <>
            <span className="opacity-90">{user.name} ({user.role})</span>
            <Link to="/track" className="hover:underline">Track Order</Link>
            <button onClick={handleLogout} className="bg-white text-brand-700 px-3 py-1.5 rounded font-medium">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
