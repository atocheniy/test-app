"use client"

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { useMemo } from "react";

function ProgressiveBlur({
  height = 96,
  maxBlur = 16,
  layers = 8,
}: {
  height?: number
  maxBlur?: number
  layers?: number
}) {
  const items = useMemo(() => {
    const pct = (n: number) =>
      `${Math.min(100, Math.max(0, (n / layers) * 100))}%`

    return Array.from({ length: layers }, (_, i) => {
      const blur = maxBlur / 2 ** i
      const mask = `linear-gradient(to bottom,
        transparent ${pct(i - 1)},
        black ${pct(i)},
        black ${pct(i + 1)},
        transparent ${pct(i + 2)})`

      return { blur, mask }
    })
  }, [height, maxBlur, layers])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{ height }}
    >
      {items.map(({ blur, mask }, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      ))}
    </div>
  )
}

export default function Titlebar({ title }: { title: string }) {
    const router = useRouter();

  return (
    <div className="sticky top-0 shrink-0 z-1000 relative">
      <ProgressiveBlur height={130} maxBlur={32} layers={8} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

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