'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function RegisterEmployer() {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">
                {isRu ? 'Регистрация для работодателей' : 'Register as an Employer'}
            </h1>
        </div>
    )
}