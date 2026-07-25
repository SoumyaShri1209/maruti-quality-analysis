import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Spinner from './Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;