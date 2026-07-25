// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InspectionProvider } from './context/InspectionContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import UploadReference from './pages/UploadReference';
import VehicleInspection from './pages/VehicleInspection';
import InspectionHistory from './pages/InspectionHistory';

function App() {
  return (
    <AuthProvider>
      <InspectionProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-reference"
              element={
                <ProtectedRoute>
                  <UploadReference />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspection"
              element={
                <ProtectedRoute>
                  <VehicleInspection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <InspectionHistory />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<h1 className="text-center mt-20 text-4xl">Welcome to QualiCheck 🚀</h1>} />
          </Routes>
        </Router>
      </InspectionProvider>
    </AuthProvider>
  );
}

export default App;