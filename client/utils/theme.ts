const THEME_KEY = 'classly_theme';

export type ThemeMode = 'dark' | 'light';

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode): ThemeMode => {
  if (typeof window === 'undefined') {
    return theme;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent<ThemeMode>('classly-theme-change', { detail: theme }));
  return theme;
};

export const getCurrentTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : getPreferredTheme();
};

export const initializeTheme = (): ThemeMode => applyTheme(getPreferredTheme());

export const toggleTheme = (): ThemeMode => {
  const nextTheme: ThemeMode = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  return applyTheme(nextTheme);
};

