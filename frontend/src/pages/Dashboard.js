import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🏭 Quality Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome, <span className="text-purple-600 font-semibold">{user?.name}</span>!</p>
          <p className="text-gray-500 mt-2">Your quality analysis tools will appear here soon.</p>
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-purple-800">🎯 Ready to upload your first reference Excel? We're building that next!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;