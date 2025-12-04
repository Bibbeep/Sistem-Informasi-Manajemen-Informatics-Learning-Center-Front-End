import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a loading spinner component
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    // Logged in but not an admin, redirect to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has the correct role, render the child route
  return <Outlet />;
};

export default PrivateRoute;
