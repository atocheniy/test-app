'use client';

import { LinearBlur } from "progressive-blur";

export default function TitlebarMessages({ title }: { title: string }) {
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
                    height: 80,
                }}
            />

            <h1 className="text-lg font-bold text-zinc-100 relative z-10">{title}</h1>
        </div>
    );
}