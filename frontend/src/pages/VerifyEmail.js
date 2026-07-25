// frontend/src/pages/VerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/verify/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        toast.error(err.response?.data?.message || 'Verification failed');
      }
    };
    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {status === 'success' ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
            <p className="text-gray-500 mt-2">
              Your email has been successfully verified. You can now log in.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-600 transition"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-gray-500 mt-2">
              The verification link is invalid or has expired.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-600 transition"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;