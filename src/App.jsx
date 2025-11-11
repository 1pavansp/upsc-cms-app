// src/App.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import ErrorBoundary from './Components/ErrorBoundary';
import DarkModeToggle from './Components/DarkModeToggle';
import getTheme from './theme';
import './App.css';

function App() {
  const location = useLocation();
  const showFooter = location.pathname !== '/admin/dashboard';
  const [mode, setMode] = useState('light');
  const [user] = useAuthState(auth);

  useEffect(() => {
    // Set theme
    const savedTheme = localStorage.getItem('theme');
    const initialMode = savedTheme === 'dark' ? 'dark' : 'light';
    setMode(initialMode);
    if (initialMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (savedTheme !== 'light') {
        localStorage.setItem('theme', 'light');
      }
    }

    // Set admin role
    if (user) {
      document.body.setAttribute('data-user-role', 'admin');
    } else {
      document.body.removeAttribute('data-user-role');
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Navbar />
        <DarkModeToggle isDarkMode={mode === 'dark'} toggleDarkMode={toggleDarkMode} />
        <Outlet />
        {showFooter && <Footer />}
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
