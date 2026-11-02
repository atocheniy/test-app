'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import ProgressiveBlur from "@/components/ProgressiveBlur";

export default function TitlebarMessages({ title }: { title: string }) {
    const { language, t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isRu = language === 'ru';

    return (
        <div className="sticky top-0 shrink-0 z-50 flex items-center h-14 px-6 relative max-md:top-2 max-md:mx-3 max-md:mt-2 max-md:mb-1 max-md:h-12 max-md:px-4 max-md:rounded-full max-md:bg-black/85 max-md:border max-md:border-white/10 max-md:shadow-2xl max-md:shadow-black/60 light:max-md:bg-white/90 light:max-md:border-zinc-200/80 light:max-md:shadow-black/10">
            <ProgressiveBlur
                className="max-md:hidden"
                side="top"
                steps={6}
                strength={20}
                falloffPercentage={100}
                tint={resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(2, 2, 2, 0.75)'}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                    height: 80,
                }}
            />

            <h1 className="text-lg font-bold text-zinc-100 relative z-10 light:text-zinc-900">{title || (isRu ? 'Сообщения' : t.nav.messages)}</h1>
        </div>
    );
}