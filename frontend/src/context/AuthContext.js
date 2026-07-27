import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
const API = process.env.REACT_APP_API_URL || '';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API}/api/auth/me`);
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const register = async (formData) => {
   const res = await axios.post(`${API}/api/auth/register`, formData);
    // No token returned – only message
    return res.data; // { message: '...' }
  };

  const login = async (formData) => {
    const res = await axios.post(`${API}/api/auth/login`, formData);
    const newToken = res.data?.token;
    if (!newToken) {
      throw new Error('No authentication token received');
    }
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(res.data);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await axios.post(`${API}/api/auth/google`, { credential });
    const newToken = res.data?.token;
    if (!newToken) {
      throw new Error('No authentication token received');
    }
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;