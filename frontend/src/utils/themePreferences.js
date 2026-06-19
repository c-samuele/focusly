const THEME_STORAGE_KEY = 'studyPlannerTheme';

const BRAND_ICON_PATHS = {
  light: '/Pittogramma/focusly-pictogram-light.svg',
  dark: '/Pittogramma/focusly-pictogram-dark.svg',
};

const THEME_COLORS = {
  light: '#247a6b',
  dark: '#6fd0bb',
};

const isSupportedTheme = (value) => value === 'light' || value === 'dark';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isSupportedTheme(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDocument = (nextTheme) => {
  if (typeof document === 'undefined') {
    return nextTheme;
  }

  const theme = isSupportedTheme(nextTheme) ? nextTheme : getInitialTheme();
  const iconPath = BRAND_ICON_PATHS[theme];

  document.documentElement.dataset.theme = theme;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
  }

  ['app-favicon', 'app-favicon-alt', 'app-apple-touch-icon'].forEach((id) => {
    const link = document.getElementById(id);

    if (link) {
      link.setAttribute('href', iconPath);
    }
  });

  return theme;
};

export {
  BRAND_ICON_PATHS,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getInitialTheme,
};
