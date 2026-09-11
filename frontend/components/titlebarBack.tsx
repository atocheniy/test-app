"use client"

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LinearBlur } from "progressive-blur";

export default function Titlebar({ title }: { title: string }) {
    const router = useRouter();

  return (
    <div className="sticky top-0 shrink-0 z-1000 relative">
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
                    height: 120,
                }}
            />

      <div className="relative flex items-center gap-2 h-14 px-6">
        <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer shrink-0"
                title="Назад"
            >
            <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100">{title}</h1>
      </div>
    </div>
  )
}