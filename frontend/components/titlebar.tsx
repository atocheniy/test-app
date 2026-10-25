'use client';

import { useLanguage } from "@/context/LanguageContext";
import { LinearBlur } from "progressive-blur";

export default function Titlebar({ 
    title, 
    children 
}: { 
    title: string; 
    children?: React.ReactNode; 
}) {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <div className="sticky top-0 shrink-0 z-50 flex items-center h-14 px-6 relative">
            <LinearBlur
                side="top"
                steps={6}
                strength={20}
                falloffPercentage={100}
                tint="rgba(2, 2, 2, 0.75)"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                    height: 100,
                }}
            />

            <div className="flex items-center gap-6 relative z-10 w-full">
                <h1 className="text-lg font-bold text-zinc-100 shrink-0">{title || (isRu ? 'Лента' : t.feed.title)}</h1>
                {children}
            </div>
        </div>
    );
}
