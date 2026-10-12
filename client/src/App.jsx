import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateGame from './pages/CreateGame'
import JoinGame from './pages/JoinGame'
import Lobby from './pages/Lobby'
import GamePage from './pages/GamePage'
import Result from './pages/Result'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'
import Profile from './pages/Profile'

const PublicOnly = ({ children }) => { const { isAuthenticated, loading } = useAuth(); if (loading) return <div className="loading-screen">Loading CHOR-SIPAHI…</div>; return isAuthenticated ? <Navigate to="/dashboard" replace /> : children; };

export default function App() {
  return (
    <AuthProvider><Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
      <Route path="/join-game" element={<ProtectedRoute><JoinGame /></ProtectedRoute>} />
      <Route path="/create" element={<Navigate to="/create-game" />} />
      <Route path="/join" element={<Navigate to="/join-game" />} />
      <Route path="/lobby/:gameCode" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/game/:gameCode" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/result/:gameCode" element={<ProtectedRoute><Result /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes></AuthProvider>
  )
}
