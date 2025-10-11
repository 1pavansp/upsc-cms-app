import React from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="dark-mode-toggle"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun size={20} className="toggle-icon" />
      ) : (
        <Moon size={20} className="toggle-icon" />
      )}
    </button>
  );
};

export default DarkModeToggle;

