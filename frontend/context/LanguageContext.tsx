'use client';

import { Language, Translations, translations } from '@/libs/i18n';
import { UserService } from '@/services/userService';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useApplication } from './ApplicationContext';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'devlink_language';
const LEGACY_STORAGE_KEY = 'devspace_language';

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const { userData } = useApplication();
    const [language, setLanguageState] = useState<Language>('ru');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as Language | null;
            if (saved === 'ru' || saved === 'en') {
                setLanguageState(saved);
                document.documentElement.lang = saved;
            }
        } catch (e) {
            console.error('Failed to read language from localStorage:', e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (!userData || !userData.id) return;
        const userPref = userData.preferredLanguage;
        if ((userPref === 'ru' || userPref === 'en') && userPref !== language && !localStorage.getItem(STORAGE_KEY)) {
            setLanguageState(userPref);
            document.documentElement.lang = userPref;
        }
    }, [userData?.id, userData?.preferredLanguage]);

    const setLanguage = async (newLang: Language) => {
        setLanguageState(newLang);
        try {
            localStorage.setItem(STORAGE_KEY, newLang);
            document.documentElement.lang = newLang;
        } catch (e) {
            console.error('Failed to persist language to localStorage:', e);
        }

        if (userData && userData.id) {
            try {
                userData.preferredLanguage = newLang;
                await UserService.updateLanguage(newLang);
            } catch (err) {
                console.error('Failed to save preferred language to DB:', err);
            }
        }
    };

    const t: Translations = useMemo(() => {
        return (translations[language] || translations.ru) as Translations;
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
    }), [language, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'ru',
            setLanguage: async () => {},
            t: translations.ru,
        };
    }
    return context;
};
