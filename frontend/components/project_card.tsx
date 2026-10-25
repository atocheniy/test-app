'use client';

import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, ChevronLeft, ChevronRight, Code2, ExternalLink, Pencil, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const PROJECT_STATUS_MAP: Record<number, { label: string; labelEn: string; badgeClass: string; dotClass: string }> = {
    0: { label: 'В разработке', labelEn: 'In Development', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dotClass: 'bg-amber-400' },
    1: { label: 'Бета', labelEn: 'Beta', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dotClass: 'bg-blue-400' },
    2: { label: 'Релиз', labelEn: 'Release', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotClass: 'bg-emerald-400' },
    3: { label: 'Архив', labelEn: 'Archived', badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', dotClass: 'bg-zinc-400' },
};

interface LinkItem {
    href: string;
    name: string;
}

interface ProjectCardProps {
    id?: string;
    name: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkItem[];
    description?: string;
    technologies?: string[];
    status?: number;
    starsCount?: number;
    postsCount?: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function ProjectCard({
    id,
    name,
    imageUrl,
    images,
    links,
    description,
    technologies,
    status,
    starsCount = 0,
    postsCount = 0,
    onEdit,
    onDelete,
}: ProjectCardProps) {
    const router = useRouter();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    const allImages = (images && images.length > 0) ? images : (imageUrl ? [imageUrl] : []);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleCardClick = () => {
        if (id) {
            router.push(`/project/${id}`);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    const statusInfo = typeof status === 'number' && PROJECT_STATUS_MAP[status] ? PROJECT_STATUS_MAP[status] : null;

    return (
        <div
            onClick={handleCardClick}
            className={`p-5 border border-white/5 rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/30 hover:border-white/15 transition-all duration-300 group flex flex-col justify-between h-full relative ${
                id ? 'cursor-pointer' : ''
            }`}
        >
            <div>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                                {name}
                            </h4>
                            {statusInfo && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                                    {isRu ? statusInfo.label : statusInfo.labelEn}
                                </span>
                            )}
                        </div>

                        {(starsCount > 0 || postsCount > 0) && (
                            <div className="flex items-center gap-2.5 text-[11px] text-zinc-400">
                                {starsCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium">
                                        <Star size={11} className="fill-amber-400 text-amber-400" />
                                        {starsCount}
                                    </span>
                                )}
                                {postsCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-zinc-400">
                                        <BookOpen size={11} />
                                        {postsCount} {isRu ? (postsCount === 1 ? 'девлог' : postsCount < 5 ? 'девлога' : 'девлогов') : (postsCount === 1 ? 'devlog' : 'devlogs')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        {links && links.length > 0 && (
                            <div className="flex flex-row items-center gap-1.5">
                                {links.map((link, idx) => (
                                    <a 
                                        key={`${link.name}-${idx}`} 
                                        href={link.href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md hover:bg-white/10"
                                    >
                                        <span>{link.name}</span>
                                        <ExternalLink size={10} />
                                    </a>
                                ))}
                            </div>
                        )}

                        {(onEdit || onDelete) && (
                            <div 
                                className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {onEdit && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit();
                                        }}
                                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
                                        title={isRu ? "Редактировать проект" : "Edit project"}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                        title={isRu ? "Удалить проект" : "Delete project"}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-zinc-900/60 border border-white/5 rounded-xl h-38 mt-3.5 flex flex-col items-center justify-center text-center select-none group/img">
                    {allImages.length > 0 ? (
                        <>
                            <img 
                                src={allImages[currentImageIndex]} 
                                alt={`${name} ${currentImageIndex + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            
                            {allImages.length > 1 && (
                                <>
                                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-200 pointer-events-none">
                                        {currentImageIndex + 1} / {allImages.length}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95 z-10"
                                        aria-label={isRu ? "Предыдущее изображение" : "Previous image"}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95 z-10"
                                        aria-label={isRu ? "Следующее изображение" : "Next image"}
                                    >
                                        <ChevronRight size={14} />
                                    </button>

                                    <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                                        {allImages.map((_, idx) => (
                                            <span
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === currentImageIndex 
                                                        ? 'w-4 bg-white shadow-sm' 
                                                        : 'w-1.5 bg-white/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="p-4 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 mb-2">
                                <Code2 size={20} />
                            </div>
                            <span className="text-xs font-medium text-zinc-400 line-clamp-1">{name}</span>
                        </div>
                    )}
                </div>

                {description && (
                    <p className="text-xs text-zinc-400 leading-relaxed mt-3 line-clamp-3">
                        {description}
                    </p>
                )}
            </div>

            {technologies && technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
                    {technologies.map((tech, idx) => (
                        <span key={`${tech}-${idx}`} className="text-[10px] font-medium bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-lg text-zinc-400">
                            {tech}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}