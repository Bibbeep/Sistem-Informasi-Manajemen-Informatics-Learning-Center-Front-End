import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // You might want to fetch the full user details from the /api/v1/users/{userId} endpoint
        // For now, we'll just use the decoded token
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      const decodedUser = jwtDecode(accessToken);
      setUser(decodedUser);
      return decodedUser;
    } catch (error) {
      // Clear any potential stale user data on login failure
      localStorage.removeItem('accessToken');
      setUser(null);
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if the backend logout fails, we want to log out the user on the client.
      console.error('Backend logout failed:', error);
    } finally {
      // Always clear client-side authentication data
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const authValue = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
