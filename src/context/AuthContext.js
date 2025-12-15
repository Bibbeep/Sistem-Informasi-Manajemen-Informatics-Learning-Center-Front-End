import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // New state for full user profile
  const [loading, setLoading] = useState(true);

  // Function to fetch full user profile
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.data.user);
      return response.data.data.user;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setProfile(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        
        // Fetch profile and then set a combined user object
        fetchUserProfile(decodedUser.sub).then(profileData => {
          setUser({ ...decodedUser, ...profileData });
        });
        
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('accessToken');
        setUser(null);
        setProfile(null);
      }
    }
    setLoading(false);
  }, [fetchUserProfile]); // fetchUserProfile is a dependency

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      const decodedUser = jwtDecode(accessToken);
      
      // Fetch full user profile after successful login
      const fullProfile = await fetchUserProfile(decodedUser.sub);
      
      // Combine decoded token data with full profile data
      const combinedUser = { ...decodedUser, ...fullProfile };
      setUser(combinedUser);
      
      return { user: combinedUser }; // Return a single user object
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
