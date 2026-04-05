import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tradition, setTradition] = useState('vedic_solar');

  useEffect(() => {
    document.documentElement.setAttribute('data-tradition', tradition);
  }, [tradition]);

  function applyTradition(newTradition) {
    if (newTradition && newTradition !== tradition) {
      setTradition(newTradition);
    }
  }

  return (
    <ThemeContext.Provider value={{ tradition, applyTradition }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
