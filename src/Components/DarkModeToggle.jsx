import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = ({ isDarkMode: controlledIsDarkMode, toggleDarkMode: controlledToggle }) => {
  const isControlled = typeof controlledIsDarkMode !== 'undefined' && typeof controlledToggle === 'function';

  const [internalDark, setInternalDark] = useState(false);

  useEffect(() => {
    if (!isControlled) {
      const saved = localStorage.getItem('theme');
      const initial = saved === 'dark';
      setInternalDark(initial);
      if (initial) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [isControlled]);

  const toggleInternal = useCallback(() => {
    const next = !internalDark;
    setInternalDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      // debug log to inspect which localStorage.setItem is being called during tests
      // eslint-disable-next-line no-console
      console.log('DarkModeToggle: calling localStorage.setItem ->', typeof localStorage?.setItem);
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      // eslint-disable-next-line no-console
      console.log('DarkModeToggle: calling localStorage.setItem ->', typeof localStorage?.setItem);
      localStorage.setItem('theme', 'light');
    }
  }, [internalDark]);

  const isDark = isControlled ? controlledIsDarkMode : internalDark;
  const onToggle = isControlled ? controlledToggle : toggleInternal;

  return (
    <button
      onClick={onToggle}
      className="dark-mode-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={20} className="toggle-icon" data-testid="sun-icon" />
      ) : (
        <Moon size={20} className="toggle-icon" data-testid="moon-icon" />
      )}
    </button>
  );
};

export default DarkModeToggle;

