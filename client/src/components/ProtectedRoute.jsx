import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ children }) { const { isAuthenticated, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="loading-screen">Loading CHOR-SIPAHI…</div>; return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />; }
