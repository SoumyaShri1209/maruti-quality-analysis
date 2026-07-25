import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useInspection } from '../context/InspectionContext';  // 👈 import
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { clearInspection } = useInspection();                // 👈 get clear function
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearInspection();             // 👈 wipe manual entries & result
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:scale-105 transform transition duration-200">
          <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm shadow-sm flex items-center justify-center">
            <img
              src="https://imgs.search.brave.com/EHOEnl4vEuHtveP0IzyKOWpeEYg7sqCPn-dqX7o_nWk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2YxLzA0/LzE2L2YxMDQxNjk4/YTkwYWVhMTIxZjhk/YTUzYWNmMWE4Zjky/LmpwZw"
              alt="Maruti Suzuki"
              className="h-7 w-auto object-contain block"
            />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Quality Analysis</span>
        </Link>

        {/* Navigation links */}
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:underline">Dashboard</Link>
              <Link to="/upload-reference" className="hover:underline">Upload Reference</Link>
              <Link to="/inspection" className="hover:underline">Inspection</Link>
              <Link to="/history" className="hover:underline">History</Link>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-white text-purple-700 px-4 py-1 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link
                to="/register"
                className="bg-white text-purple-700 px-4 py-1 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;