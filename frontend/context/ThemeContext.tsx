'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'devlink_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

    const applyTheme = (targetTheme: Theme) => {
        let actual: ResolvedTheme = 'dark';
        if (targetTheme === 'system') {
            const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
            actual = prefersDark ? 'dark' : 'light';
        } else {
            actual = targetTheme;
        }

        setResolvedTheme(actual);

        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            if (actual === 'light') {
                root.classList.remove('dark');
                root.classList.add('light');
                root.setAttribute('data-theme', 'light');
                root.style.colorScheme = 'light';
            } else {
                root.classList.remove('light');
                root.classList.add('dark');
                root.setAttribute('data-theme', 'dark');
                root.style.colorScheme = 'dark';
            }
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
            if (saved === 'dark' || saved === 'light' || saved === 'system') {
                setThemeState(saved);
                applyTheme(saved);
            } else {
                applyTheme('dark');
            }
        } catch {
            applyTheme('dark');
        }

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'dark';
            if (current === 'system') {
                applyTheme('system');
            }
        };

        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);
        try {
            localStorage.setItem(STORAGE_KEY, newTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
