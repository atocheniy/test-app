'use client';

import { useTheme } from "@/context/ThemeContext";
import { LinearBlur } from "progressive-blur";
import React from "react";

interface ProgressiveBlurProps {
    side: "top" | "bottom";
    steps?: number;
    strength?: number;
    falloffPercentage?: number;
    tint?: string;
    style?: React.CSSProperties;
    className?: string;
}

export default function ProgressiveBlur({
    side,
    steps = 6,
    strength = 20,
    falloffPercentage = 100,
    tint,
    style,
    className
}: ProgressiveBlurProps) {
    const { blurEnabled, resolvedTheme } = useTheme();

    if (blurEnabled) {
        return (
            <LinearBlur
                className={className}
                side={side}
                steps={steps}
                strength={strength}
                falloffPercentage={falloffPercentage}
                tint={tint ?? (resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(2, 2, 2, 0.75)')}
                style={style}
            />
        );
    }

    const isLight = resolvedTheme === 'light';
    const baseRgb = isLight ? '255, 255, 255' : '2, 2, 2';
    const direction = side === 'top' ? 'to bottom' : 'to top';

    const progressiveShadow = `linear-gradient(${direction}, 
        rgba(${baseRgb}, ${isLight ? 0.98 : 0.95}) 0%, 
        rgba(${baseRgb}, ${isLight ? 0.92 : 0.88}) 19%, 
        rgba(${baseRgb}, ${isLight ? 0.82 : 0.76}) 34%, 
        rgba(${baseRgb}, ${isLight ? 0.68 : 0.61}) 47%, 
        rgba(${baseRgb}, ${isLight ? 0.50 : 0.44}) 59%, 
        rgba(${baseRgb}, ${isLight ? 0.32 : 0.28}) 70%, 
        rgba(${baseRgb}, ${isLight ? 0.16 : 0.14}) 81%, 
        rgba(${baseRgb}, ${isLight ? 0.05 : 0.04}) 91%, 
        transparent 100%)`;

    return (
        <div
            className={className}
            style={{
                ...style,
                background: progressiveShadow,
            }}
        />
    );
}
