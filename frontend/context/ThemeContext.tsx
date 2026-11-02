'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type CodeFontSize = 'sm' | 'md' | 'lg';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    codeFontSize: CodeFontSize;
    setCodeFontSize: (size: CodeFontSize) => void;
    blurEnabled: boolean;
    setBlurEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'devlink_theme';
const FONT_STORAGE_KEY = 'devlink_code_font_size';
const BLUR_STORAGE_KEY = 'devlink_blur_enabled';

const FONT_SIZE_MAP: Record<CodeFontSize, string> = {
    sm: '12px',
    md: '13.5px',
    lg: '15.5px'
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
    const [codeFontSize, setCodeFontSizeState] = useState<CodeFontSize>('md');
    const [blurEnabled, setBlurEnabledState] = useState<boolean>(true);

    const applyBlurEnabled = (enabled: boolean) => {
        if (typeof document !== 'undefined') {
            if (enabled) {
                document.documentElement.classList.remove('no-blur');
            } else {
                document.documentElement.classList.add('no-blur');
            }
        }
    };

    const applyCodeFontSize = (size: CodeFontSize) => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--code-font-size', FONT_SIZE_MAP[size] || '13.5px');
        }
    };

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

        try {
            const savedSize = localStorage.getItem(FONT_STORAGE_KEY) as CodeFontSize | null;
            if (savedSize === 'sm' || savedSize === 'md' || savedSize === 'lg') {
                setCodeFontSizeState(savedSize);
                applyCodeFontSize(savedSize);
            } else {
                applyCodeFontSize('md');
            }
        } catch {
            applyCodeFontSize('md');
        }

        try {
            const savedBlur = localStorage.getItem(BLUR_STORAGE_KEY);
            if (savedBlur !== null) {
                const isEnabled = savedBlur !== 'false';
                setBlurEnabledState(isEnabled);
                applyBlurEnabled(isEnabled);
            } else {
                applyBlurEnabled(true);
            }
        } catch {
            applyBlurEnabled(true);
        }

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

    const setCodeFontSize = (newSize: CodeFontSize) => {
        setCodeFontSizeState(newSize);
        applyCodeFontSize(newSize);
        try {
            localStorage.setItem(FONT_STORAGE_KEY, newSize);
        } catch (e) {
            console.error('Failed to save code font size:', e);
        }
    };

    const setBlurEnabled = (enabled: boolean) => {
        setBlurEnabledState(enabled);
        applyBlurEnabled(enabled);
        try {
            localStorage.setItem(BLUR_STORAGE_KEY, String(enabled));
        } catch (e) {
            console.error('Failed to save blur setting:', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, codeFontSize, setCodeFontSize, blurEnabled, setBlurEnabled }}>
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
