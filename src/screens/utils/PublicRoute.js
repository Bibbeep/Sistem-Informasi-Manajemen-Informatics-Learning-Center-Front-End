import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a loading spinner component
    return <div>Loading...</div>;
  }

  if (user) {
    // User is logged in, redirect to their dashboard
    const redirectPath = user.admin ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // User is not logged in, render the public child route
  return <Outlet />;
};

export default PublicRoute;
