// frontend/src/pages/LoginPage.js
import React, { useState, useContext, useEffect } from 'react';   // 👈 added useEffect
import AuthContext from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useInspection } from '../context/InspectionContext';    // 👈 added import
import axios from 'axios';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  const { login, googleLogin, user } = useContext(AuthContext);
  const { clearInspection } = useInspection();                   // 👈 get clear function
  const navigate = useNavigate();

  // ✅ Clear any leftover inspection data when login page is shown
useEffect(() => {
  clearInspection();
}, [clearInspection]);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back! 🚀');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.isNotVerified) {
        setResendEmail(form.email);
        setShowResend(true);
        toast.error('Please verify your email before logging in.');
      } else {
        toast.error(err.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`, { email: resendEmail });
      toast.success('Verification email resent! Please check your inbox.');
      setShowResend(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google sign‑in failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transform transition hover:scale-[1.01]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-700">Welcome Back 👋</h1>
          <p className="text-gray-500 mt-2">Log in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login with Email'}
          </button>
        </form>

        {/* Resend Verification Box */}
        {showResend && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">
              Your email <strong>{resendEmail}</strong> is not yet verified.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="mt-2 text-purple-600 font-semibold hover:underline text-sm disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-500">or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google sign‑in failed')}
            size="large"
            text="signin_with"
            shape="pill"
          />
        </div>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;