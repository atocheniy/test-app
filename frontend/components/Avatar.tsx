'use client';

import React, { useState, useEffect } from 'react';

export function getInitials(name?: string | null, fallback = 'U'): string {
    if (!name) return fallback;
    const clean = name.trim().replace(/^[@#]|^(p\/|c\/)/i, '').trim();
    if (!clean) return fallback;
    const words = clean.split(/[\s_\-]+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
}

export function getAvatarGradient(name?: string | null): string {
    const gradients = [
        'from-blue-600/35 to-indigo-600/25 text-blue-100 border-blue-400/20 light:from-blue-100 light:to-indigo-100 light:text-blue-800 light:border-blue-200',
        'from-purple-600/35 to-pink-600/25 text-purple-100 border-purple-400/20 light:from-purple-100 light:to-pink-100 light:text-purple-800 light:border-purple-200',
        'from-emerald-600/35 to-teal-600/25 text-emerald-100 border-emerald-400/20 light:from-emerald-100 light:to-teal-100 light:text-emerald-800 light:border-emerald-200',
        'from-amber-600/35 to-orange-600/25 text-amber-100 border-amber-400/20 light:from-amber-100 light:to-orange-100 light:text-amber-800 light:border-amber-200',
        'from-cyan-600/35 to-sky-600/25 text-cyan-100 border-cyan-400/20 light:from-cyan-100 light:to-sky-100 light:text-cyan-800 light:border-cyan-200',
        'from-rose-600/35 to-red-600/25 text-rose-100 border-rose-400/20 light:from-rose-100 light:to-red-100 light:text-rose-800 light:border-rose-200',
        'from-violet-600/35 to-fuchsia-600/25 text-violet-100 border-violet-400/20 light:from-violet-100 light:to-fuchsia-100 light:text-violet-800 light:border-violet-200',
    ];
    if (!name) return gradients[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

export interface AvatarProps {
    src?: string | null;
    name?: string | null;
    alt?: string;
    fallback?: string;
    className?: string;
    shape?: 'circle' | 'rounded';
    textClassName?: string;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
}

export default function Avatar({
    src,
    name,
    alt,
    fallback = 'U',
    className = 'w-10 h-10',
    shape = 'circle',
    textClassName,
    onClick,
    style,
}: AvatarProps) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    const resolvedName = name || alt || '';
    const initials = getInitials(resolvedName, fallback);
    const gradient = getAvatarGradient(resolvedName);
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

    if (src && !hasError) {
        return (
            <img
                src={src}
                alt={alt || name || 'Avatar'}
                onError={() => setHasError(true)}
                onClick={onClick}
                style={style}
                className={`object-cover shrink-0 select-none ${shapeClass} ${className}`}
            />
        );
    }

    return (
        <div
            onClick={onClick}
            style={style}
            className={`flex items-center justify-center font-bold shrink-0 select-none bg-gradient-to-br border ${gradient} ${shapeClass} ${className}`}
        >
            <span className={textClassName}>{initials}</span>
        </div>
    );
}
