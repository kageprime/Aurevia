import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AccentOption = {
  id: string;
  label: string;
  hex: string;
  hsl: string;
};

type AccentThemeContextValue = {
  accent: string;
  accents: AccentOption[];
  setAccent: (id: string) => void;
};

const ACCENT_STORAGE_KEY = 'aurevia_accent';

const ACCENTS: AccentOption[] = [
  { id: 'pink', label: 'Pink', hex: '#FF2D8F', hsl: '328 100% 59%' },
  { id: 'violet', label: 'Violet', hex: '#8B5CF6', hsl: '258 90% 66%' },
  { id: 'teal', label: 'Teal', hex: '#14B8A6', hsl: '173 80% 40%' },
  { id: 'orange', label: 'Orange', hex: '#F97316', hsl: '24 95% 53%' },
];

const AccentThemeContext = createContext<AccentThemeContextValue | null>(null);

function resolveAccent(id: string | null) {
  return ACCENTS.find((item) => item.id === id) ?? ACCENTS[0];
}

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState(() => {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
    return resolveAccent(stored).id;
  });

  useEffect(() => {
    const selected = resolveAccent(accent);
    const root = document.documentElement;

    root.style.setProperty('--aurevia-accent', selected.hex);
    root.style.setProperty('--aurevia-pink', selected.hex);
    root.style.setProperty('--accent', selected.hsl);
    root.style.setProperty('--ring', selected.hsl);

    localStorage.setItem(ACCENT_STORAGE_KEY, selected.id);
  }, [accent]);

  const value = useMemo(
    () => ({
      accent,
      accents: ACCENTS,
      setAccent: (id: string) => setAccent(resolveAccent(id).id),
    }),
    [accent]
  );

  return <AccentThemeContext.Provider value={value}>{children}</AccentThemeContext.Provider>;
}

export function useAccentTheme() {
  const context = useContext(AccentThemeContext);
  if (!context) {
    throw new Error('useAccentTheme must be used within AccentThemeProvider.');
  }

  return context;
}
