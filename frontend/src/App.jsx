import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import JobSearch from './pages/JobSearch';
import JobDetails from './pages/JobDetails';
import Recommendations from './pages/Recommendations';
import Applications from './pages/Applications';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// Wrap any route that requires login
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div>
        <Link to="/">JobRecommender</Link>
      </div>
      <div>
        {loggedIn ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/recommendations">Recommendations</Link>
            <Link to="/applications">Applications</Link>
            <Link to="/profile">Profile</Link>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
