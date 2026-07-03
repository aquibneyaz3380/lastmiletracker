// src/pages/Home.jsx
import { Link } from 'react-router-dom';

const Home = () => (
  <div className="max-w-3xl mx-auto mt-20 text-center px-4">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">📦 LastMile Delivery Tracker</h1>
    <p className="text-gray-600 mb-8">
      Smart logistics platform with auto-calculated charges, intelligent agent assignment, and real-time order tracking.
    </p>
    <div className="flex gap-4 justify-center">
      <Link to="/register" className="bg-brand-600 text-white px-6 py-3 rounded font-medium hover:bg-brand-700">
        Get Started
      </Link>
      <Link to="/track" className="bg-white border text-gray-700 px-6 py-3 rounded font-medium hover:bg-gray-50">
        Track an Order
      </Link>
    </div>
  </div>
);

export default Home;
