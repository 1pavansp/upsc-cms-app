import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DarkModeToggle from '../DarkModeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('DarkModeToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders dark mode toggle button', () => {
    render(<DarkModeToggle />);
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  test('shows moon icon in light mode', () => {
    render(<DarkModeToggle />);
    const moonIcon = screen.getByTestId('moon-icon') || screen.getByLabelText(/switch to dark mode/i);
    expect(moonIcon).toBeInTheDocument();
  });

  test('toggles to dark mode when clicked', () => {
    render(<DarkModeToggle />);
    const toggleButton = screen.getByRole('button');
    
    fireEvent.click(toggleButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  test('applies dark class to document element', () => {
    render(<DarkModeToggle />);
    const toggleButton = screen.getByRole('button');
    
    fireEvent.click(toggleButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
