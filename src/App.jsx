// src/App.jsx

import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import ErrorBoundary from './Components/ErrorBoundary';
import DarkModeToggle from './Components/DarkModeToggle';
import './App.css';

function App() {
  const location = useLocation();
  const showFooter = location.pathname !== '/admin/dashboard';

  return (
    <ErrorBoundary>
      <Navbar />
      <DarkModeToggle />
      <Outlet />
      {showFooter && <Footer />}
    </ErrorBoundary>
  );
}

export default App;