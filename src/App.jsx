// src/App.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setMode('dark');
      document.documentElement.classList.add('dark');
    } else {
      setMode('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

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