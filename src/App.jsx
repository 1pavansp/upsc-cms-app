// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Home from './Components/Home';
import ArticlePage from './Components/ArticlePage';
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import Footer from './Components/Footer';
import ErrorBoundary from './Components/ErrorBoundary';
import './App.css';

function App() {
  const location = useLocation();
  const showFooter = location.pathname !== '/admin/dashboard';

  return (
    <ErrorBoundary>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:articleId" element={<ArticlePage />} />
        <Route path="/current-affairs/:articleId" element={<ArticlePage />} />
        <Route path="/tags/:tagId" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
      {showFooter && <Footer />}
    </ErrorBoundary>
  );
}

export default App;