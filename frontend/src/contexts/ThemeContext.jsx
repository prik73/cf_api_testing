import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      console.log('🎨 Theme from localStorage:', savedTheme);
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🎨 Using system dark theme');
      return 'dark';
    }
    
    console.log('🎨 Using default light theme');
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    console.log('🎨 Theme change effect triggered:', { 
      theme, 
      currentClasses: root.className,
      hasLightClass: root.classList.contains('light'),
      hasDarkClass: root.classList.contains('dark')
    });
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Debug: Check if class was added
    console.log('🎨 After theme change:', {
      theme,
      newClasses: root.className,
      hasLightClass: root.classList.contains('light'),
      hasDarkClass: root.classList.contains('dark')
    });
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Force a style recalculation
    root.style.colorScheme = theme;
    
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 Toggling theme:', theme, '→', newTheme);
    setTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};