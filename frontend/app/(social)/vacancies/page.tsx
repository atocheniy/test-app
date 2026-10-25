'use client';

import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatSalary } from "@/libs/format";
import { VacancyService } from "@/services/vacancyService";
import type { Vacancy } from "@/types/auth";
import {
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Sparkles,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VacanciesPage() {
    const { userData } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    const router = useRouter();

    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedStack, setSelectedStack] = useState<string>("");
    const [selectedSort, setSelectedSort] = useState<'recommended' | 'created' | 'salary'>('recommended');

    const [expandedVacancyId, setExpandedVacancyId] = useState<string | null>(null);
    const [isApplyingId, setIsApplyingId] = useState<string | null>(null);

    const popularStacks = [".NET", "C#", "React", "TypeScript", "Next.js", "Python", "Go", "PostgreSQL", "Docker"];

    useEffect(() => {
        document.title = t.nav.vacancies;
        const timer = setTimeout(() => {
            loadVacancies();
        }, 250);
        return () => clearTimeout(timer);
    }, [search, selectedFormat, selectedLevel, selectedStack, selectedSort, t.nav.vacancies]);

    const loadVacancies = async () => {
        setIsLoading(true);
        try {
            const data = await VacancyService.getVacancies({
                search: search.trim() || undefined,
                format: selectedFormat !== null ? selectedFormat : undefined,
                level: selectedLevel !== null ? selectedLevel : undefined,
                stack: selectedStack.trim() || undefined,
                sort: selectedSort,
            });
            setVacancies(data.items || []);
        } catch (error) {
            console.error("Ошибка загрузки вакансий:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (vacancyId: string) => {
        if (!userData?.userName || userData.userName === '...') {
            alert(isRu ? "Войдите в аккаунт, чтобы откликнуться на вакансию." : "Please sign in to apply for this vacancy.");
            return;
        }

        try {
            setIsApplyingId(vacancyId);
            const res = await VacancyService.apply(vacancyId);
            alert(res.message || (isRu ? "Отклик отправлен. Переходим в диалог." : "Application sent. Redirecting to chat."));
            router.push('/messages');
        } catch (error: any) {
            console.error("Ошибка отклика:", error);
            const msg = error?.response?.data?.message || (isRu ? "Не удалось отправить отклик" : "Failed to submit application");
            alert(msg);
        } finally {
            setIsApplyingId(null);
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
            case 0: case '0': case 'Remote': return t.vacancies.remote;
            case 1: case '1': case 'Hybrid': return t.vacancies.hybrid;
            case 2: case '2': case 'Office': return t.vacancies.office;
            default: return typeof fmt === 'string' ? fmt : t.vacancies.remote;
        }
    };

    return (
        <div className="flex flex-col min-h-full animate-fade-in min-w-0 w-full overflow-x-hidden">
            <Titlebar title={t.nav.vacancies}>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                        {isRu ? `${vacancies.length} предложений` : `${vacancies.length} offers`}
                    </span>
                    <Link
                        href="/other"
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
                    >
                        <Building2 size={13} className="shrink-0" />
                        <span>{isRu ? "Разместить вакансию" : "Post a Vacancy"}</span>
                    </Link>
                </div>
            </Titlebar>

            <div className="p-4 md:p-6 space-y-4 w-full">
                <div className="space-y-3">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t.vacancies.searchPlaceholder}
                            className="w-full h-12 pl-4 pr-10 rounded-2xl bg-white/[0.03] border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-md transition-all text-sm shadow-inner"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto no-scrollbar">
                            <span className="text-zinc-500 px-2 text-[11px] uppercase tracking-wider font-semibold">{isRu ? "Сортировка:" : "Sort by:"}</span>
                            <button
                                onClick={() => setSelectedSort('recommended')}
                                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                                    selectedSort === 'recommended'
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <Sparkles size={11} className={selectedSort === 'recommended' ? "text-amber-500" : "text-zinc-400"} />
                                {t.sidebarRight.forYou}
                            </button>
                            <button
                                onClick={() => setSelectedSort('created')}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedSort === 'created'
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {isRu ? "Свежие" : "Newest"}
                            </button>
                            <button
                                onClick={() => setSelectedSort('salary')}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedSort === 'salary'
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {isRu ? "По зарплате" : "By Salary"}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto no-scrollbar">
                            <span className="text-zinc-500 px-2 text-[11px] uppercase tracking-wider font-semibold">{isRu ? "Формат:" : "Format:"}</span>
                            <button
                                onClick={() => setSelectedFormat(null)}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedFormat === null
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {isRu ? "Все" : "All"}
                            </button>
                            <button
                                onClick={() => setSelectedFormat(0)}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedFormat === 0
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {t.vacancies.remote}
                            </button>
                            <button
                                onClick={() => setSelectedFormat(1)}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedFormat === 1
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {t.vacancies.hybrid}
                            </button>
                            <button
                                onClick={() => setSelectedFormat(2)}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedFormat === 2
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {t.vacancies.office}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto no-scrollbar">
                            <span className="text-zinc-500 px-2 text-[11px] uppercase tracking-wider font-semibold">{isRu ? "Уровень:" : "Level:"}</span>
                            <button
                                onClick={() => setSelectedLevel(null)}
                                className={`px-2.5 py-1 rounded-lg transition ${
                                    selectedLevel === null
                                        ? "bg-white text-black font-semibold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {isRu ? "Все" : "All"}
                            </button>
                            {[
                                { val: 1, label: "Junior" },
                                { val: 2, label: "Middle" },
                                { val: 3, label: "Senior" },
                                { val: 4, label: "Lead" },
                            ].map((lvl) => (
                                <button
                                    key={lvl.val}
                                    onClick={() => setSelectedLevel(lvl.val)}
                                    className={`px-2.5 py-1 rounded-lg transition ${
                                        selectedLevel === lvl.val
                                            ? "bg-white text-black font-semibold"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {lvl.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">{isRu ? "Стек:" : "Stack:"}</span>
                        {popularStacks.map((tech) => {
                            const isSelected = selectedStack.toLowerCase() === tech.toLowerCase();
                            return (
                                <button
                                    key={tech}
                                    onClick={() => setSelectedStack(isSelected ? "" : tech)}
                                    className={`px-2 py-0.5 text-xs rounded-lg border transition ${
                                        isSelected
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                                            : "bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/20 hover:text-zinc-200"
                                    }`}
                                >
                                    {tech}
                                </button>
                            );
                        })}
                        {selectedStack && (
                            <button
                                onClick={() => setSelectedStack("")}
                                className="px-2 py-0.5 text-[11px] rounded-lg text-zinc-500 hover:text-red-400 transition flex items-center gap-1"
                            >
                                <X size={12} />
                                {isRu ? "Сбросить" : "Reset"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse h-36" />
                            ))}
                        </div>
                    ) : vacancies.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500">
                                <Briefcase size={22} />
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-200">{t.vacancies.noVacancies}</h3>
                            <p className="text-xs text-zinc-500 max-w-sm">
                                {isRu ? "Попробуйте изменить параметры поиска или фильтры по уровню и технологиям." : "Try adjusting your search query or filters by level and technologies."}
                            </p>
                        </div>
                    ) : (
                        vacancies.map((v) => {
                            const isExpanded = expandedVacancyId === v.id;
                            const hasSalary = Boolean(v.salaryFrom || v.salaryTo);

                            return (
                                <div
                                    key={v.id}
                                    className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 backdrop-blur-md"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                                        <div className="flex items-start gap-3.5 min-w-0">
                                            <Link
                                                href={`/c/${v.companySlug}`}
                                                className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0 group block"
                                            >
                                                {v.companyAvatar ? (
                                                    <img src={v.companyAvatar} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-300">
                                                        {v.companyName?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Link
                                                        href={`/c/${v.companySlug}`}
                                                        className="text-xs font-semibold text-zinc-400 hover:text-white transition flex items-center gap-1"
                                                    >
                                                        <span>{v.companyName}</span>
                                                        {v.isCompanyVerified && (
                                                            <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                                                        )}
                                                    </Link>
                                                    {v.companyLocation && (
                                                        <>
                                                            <span className="text-zinc-600">•</span>
                                                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                                                <MapPin size={11} />
                                                                {v.companyLocation}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <h3 className="text-base font-bold text-zinc-100 mt-0.5 truncate">
                                                    {v.title}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {v.matchPercent && (
                                                        <span
                                                            title={v.matchReason || undefined}
                                                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                                                        >
                                                            <Sparkles size={11} className="text-emerald-400" />
                                                            {v.matchPercent}% {isRu ? "совпадение" : "match"}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {formatLevelText(v.level)}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                                                        {formatWorkTypeText(v.format)}
                                                    </span>

                                                    {hasSalary && (
                                                        <span 
                                                            suppressHydrationWarning
                                                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                        >
                                                            {formatSalary(v.salaryFrom, v.salaryTo, v.currency)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleApply(v.id)}
                                                disabled={isApplyingId === v.id}
                                                className="w-full sm:w-auto flex justify-center px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
                                            >
                                                {isApplyingId === v.id ? (isRu ? "Отправка..." : "Sending...") : t.vacancies.apply}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <p className={`text-xs text-zinc-300 whitespace-pre-line leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                            {v.description}
                                        </p>
                                        {v.description && v.description.length > 140 && (
                                            <button
                                                onClick={() => setExpandedVacancyId(isExpanded ? null : v.id)}
                                                className="mt-1 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
                                            >
                                                {isExpanded ? (
                                                    <>{isRu ? "Свернуть" : "Collapse"} <ChevronUp size={12} /></>
                                                ) : (
                                                    <>{isRu ? "Развернуть описание" : "Expand description"} <ChevronDown size={12} /></>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {v.stack?.map((tech, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedStack(tech)}
                                                    className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 transition"
                                                >
                                                    {tech}
                                                </button>
                                            ))}
                                        </div>

                                        <span className="text-[11px] text-zinc-500 font-mono shrink-0 pl-2">
                                            {new Date(v.created).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
