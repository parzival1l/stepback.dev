import { useState, useEffect } from 'react';

export function useDarkMode() {
  // Initialize theme state from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Keep both <html> and <body> in sync so every descendant (including portals)
    // picks up the correct CSS variables and system color-scheme.
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    body.style.colorScheme = theme;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    // Persist in localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, isDark };
}
