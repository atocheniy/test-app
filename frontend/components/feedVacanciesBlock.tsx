'use client';

import { useLanguage } from "@/context/LanguageContext";
import { formatSalary } from "@/libs/format";
import type { Vacancy } from "@/types/auth";
import {
    Briefcase,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    RotateCcw,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface FeedVacanciesBlockProps {
    vacancies: Vacancy[];
    onDismiss?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export default function FeedVacanciesBlock({ vacancies, onDismiss, onRefresh, isRefreshing }: FeedVacanciesBlockProps) {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        updateScrollButtons();
    }, [vacancies]);

    if (!vacancies || vacancies.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth;
            const scrollAmount = direction === 'left' ? -containerWidth : containerWidth;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(updateScrollButtons, 350);
        }
    };

    const formatLevelText = (lvl: any) => {
        switch (lvl) {
            case 0: case '0': case 'Intern': return 'Intern';
            case 1: case '1': case 'Junior': return 'Junior';
            case 2: case '2': case 'Middle': return 'Middle';
            case 3: case '3': case 'Senior': return 'Senior';
            case 4: case '4': case 'Lead': return 'Lead';
            default: return typeof lvl === 'string' ? lvl : 'Middle';
        }
    };

    const formatWorkTypeText = (fmt: any) => {
        switch (fmt) {
            case 0: case '0': case 'Remote': return isRu ? 'Удаленно' : t.vacancies.remote;
            case 1: case '1': case 'Hybrid': return isRu ? 'Гибрид' : t.vacancies.hybrid;
            case 2: case '2': case 'Office': return isRu ? 'Офис' : t.vacancies.office;
            default: return typeof fmt === 'string' ? fmt : (isRu ? 'Удаленно' : t.vacancies.remote);
        }
    };

    return (
        <div className="py-4 px-4 mx-2 border border-white/5 rounded-xl bg-white/[0.02] text-zinc-100 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Briefcase size={15} className="text-zinc-400" />
                    <span className="font-semibold text-sm text-zinc-200">
                        {isRu ? 'Рекомендуемые вакансии' : 'Recommended vacancies'}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                        · {vacancies.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                            title={isRu ? "Обновить рекомендации" : "Refresh recommendations"}
                        >
                            <RotateCcw size={13} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
                        </button>
                    )}

                    <Link
                        href="/vacancies"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                    >
                        {isRu ? 'Все вакансии →' : 'All vacancies →'}
                    </Link>

                    {vacancies.length > 2 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={!canScrollLeft}
                                onClick={() => scroll('left')}
                                className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                title={isRu ? "Назад" : "Previous"}
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                type="button"
                                disabled={!canScrollRight}
                                onClick={() => scroll('right')}
                                className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                title={isRu ? "Вперед" : "Next"}
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    )}

                    {onDismiss && (
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="p-1 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                            title={isRu ? "Скрыть блок" : "Dismiss"}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={updateScrollButtons}
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-0.5"
            >
                {vacancies.map((v) => {
                    const hasSalary = Boolean(v.salaryFrom || v.salaryTo);

                    return (
                        <div
                            key={v.id}
                            className="w-full sm:w-[calc(50%-6px)] shrink-0 snap-start p-3.5 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-950/70 hover:border-white/10 transition flex flex-col justify-between gap-3 group"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Link
                                            href={`/c/${v.companySlug}`}
                                            className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden shrink-0 block"
                                        >
                                            {v.companyAvatar ? (
                                                <img
                                                    src={v.companyAvatar}
                                                    className="w-full h-full object-cover"
                                                    alt={v.companyName}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-400">
                                                    {v.companyName?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </Link>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/c/${v.companySlug}`}
                                                className="text-xs font-semibold text-zinc-300 hover:underline transition truncate flex items-center gap-1"
                                            >
                                                <span className="truncate">{v.companyName}</span>
                                                {v.isCompanyVerified && (
                                                    <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
                                                )}
                                            </Link>
                                            {v.companyLocation && (
                                                <span className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
                                                    <MapPin size={10} />
                                                    {v.companyLocation}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {v.matchPercent && (
                                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                ✨ {v.matchPercent}%
                                            </span>
                                        )}
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                                            {formatWorkTypeText(v.format)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <Link
                                        href={`/vacancies?search=${encodeURIComponent(v.title)}`}
                                        className="text-sm font-semibold text-zinc-100 hover:text-white transition line-clamp-1"
                                    >
                                        {v.title}
                                    </Link>

                                    {v.matchReason && (
                                        <div className="text-[11px] text-emerald-400/90 font-medium truncate">
                                            {v.matchReason}
                                        </div>
                                    )}

                                    {hasSalary ? (
                                        <span
                                            suppressHydrationWarning
                                            className="text-xs font-medium text-emerald-400"
                                        >
                                            {formatSalary(v.salaryFrom, v.salaryTo, v.currency)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-zinc-500">
                                            {isRu ? 'Зарплата не указана' : 'Salary not specified'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                                        {formatLevelText(v.level)}
                                    </span>

                                    {v.stack && v.stack.slice(0, 3).map((tech, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-400 border border-white/5 truncate max-w-[90px]"
                                        >
                                            {tech}
                                        </span>
                                    ))}

                                    {v.stack && v.stack.length > 3 && (
                                        <span className="text-[10px] text-zinc-500">
                                            +{v.stack.length - 3}
                                        </span>
                                    )}
                                </div>

                                {v.description && (
                                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                        {v.description}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <Link
                                    href={`/vacancies?search=${encodeURIComponent(v.title)}`}
                                    className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-xs text-center transition block"
                                >
                                    {isRu ? 'Смотреть вакансию' : 'View vacancy'}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
