import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // New state for full user profile
  const [loading, setLoading] = useState(true);
  const abortControllerRef = React.useRef(null);


  // Function to fetch full user profile
  const fetchUserProfile = useCallback(async (userId, signal) => {
    try {
      const response = await api.get(`/users/${userId}`, { signal });
      setProfile(response.data.data.user);
      return response.data.data.user;
    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log('Request to fetch user profile was canceled.');
        return;
      }
      console.error("Failed to fetch user profile:", error);
      setProfile(null);
      // Re-throwing is important if the caller needs to handle it (like in login)
      // but for the initial load, we might just want to fail gracefully.
      // throw error; 
    }
  }, []);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        fetchUserProfile(decodedUser.sub, signal).finally(() => {
          if (!signal.aborted) {
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('accessToken');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      const decodedUser = jwtDecode(accessToken);
      setUser(decodedUser);
      
      // Fetch full user profile after successful login
      const fullProfile = await fetchUserProfile(decodedUser.sub);
      return { user: decodedUser, profile: fullProfile };
    } catch (error) {
      // Clear any potential stale user data on login failure
      localStorage.removeItem('accessToken');
      setUser(null);
      setProfile(null);
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
      setProfile(null); // Clear profile on logout
    }
  };

  const authValue = {
    user,
    profile, // Expose profile
    setProfile, // Expose setProfile for updates
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
