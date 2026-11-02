"use client"

import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LinearBlur } from "progressive-blur";

export default function Titlebar({ title }: { title: string }) {
    const router = useRouter();
    const { language, t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isRu = language === 'ru';

  return (
    <div className="sticky top-0 shrink-0 z-1000 relative max-md:top-2 max-md:mx-3 max-md:mt-2 max-md:mb-1 max-md:rounded-full max-md:bg-black/85 max-md:border max-md:border-white/10 max-md:shadow-2xl max-md:shadow-black/60 light:max-md:bg-white/90 light:max-md:border-zinc-200/80 light:max-md:shadow-black/10">
      <LinearBlur
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
                    height: 100,
                }}
            />

      <div className="relative flex items-center gap-2 h-14 px-6 max-md:h-12 max-md:px-3">
        <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer shrink-0 light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-zinc-100"
                title={isRu ? "Назад" : t.common.back}
            >
            <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100 light:text-zinc-900">{title}</h1>
      </div>
    </div>
  )
}