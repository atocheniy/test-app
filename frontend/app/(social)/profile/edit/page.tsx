'use client';

import { useLanguage } from "@/context/LanguageContext";

export default function Edit() {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <div></div>
    );
}
