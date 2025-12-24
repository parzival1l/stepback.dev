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
    // Update the HTML element's data-theme attribute (for existing theme)
    document.documentElement.setAttribute('data-theme', theme);

    // Add/remove 'dark' class for shadcn theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Persist in localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, isDark };
}
