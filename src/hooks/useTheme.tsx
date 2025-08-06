
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [userTheme, setUserTheme] = useState<Theme | null>(null);

  // Fetch user's theme preference from profile when user is available
  useEffect(() => {
    if (user && !userTheme) {
      const fetchUserTheme = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .single();
          
          if (data?.theme_preference) {
            setUserTheme(data.theme_preference as Theme);
            setTheme(data.theme_preference as Theme);
          }
        } catch (error) {
          console.warn('Error fetching user theme:', error);
        }
      };
      
      fetchUserTheme();
    }
  }, [user, userTheme]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: async (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
      setUserTheme(theme);
      
      // Update user's profile theme preference
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('id', user.id);
        } catch (error) {
          console.warn('Error updating user theme:', error);
        }
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
