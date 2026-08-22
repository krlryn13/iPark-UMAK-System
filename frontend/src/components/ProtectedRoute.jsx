import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Route guard component
 * 
 * Usage:
 *   <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while auth state is being resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="fa-solid fa-shield-halved text-3xl text-umak-navy animate-pulse"></i>
          <p className="text-sm font-semibold text-slate-500">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role check — redirect if user doesn't have required role
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
