'use client';

import { useApplication } from '@/context/ApplicationContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatSalary } from '@/libs/format';
import { PostService } from '@/services/postService';
import { UserService } from '@/services/userService';
import { VacancyService } from '@/services/vacancyService';
import type { Vacancy } from '@/types/auth';
import { Briefcase, ExternalLink, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface RecommendedUser {
    id: string;
    userName: string;
    fullName?: string;
    avatar?: string;
    bio_FirstLine?: string;
    technologies?: string[];
    followers?: number;
    isWatching?: boolean;
    mutualCount?: number;
    sharedTechCount?: number;
}

interface TrendingTopic {
    tag: string;
    displayTag: string;
    category: string;
    postCount: number;
    postsFormatted: string;
    score?: number;
}

export default function RightSidebar() {
    const { onlineUsers } = useApplication();
    const { t } = useLanguage();
    const [liveVacancies, setLiveVacancies] = useState<Vacancy[]>([]);
    const [loadingVacancies, setLoadingVacancies] = useState<boolean>(true);
    const [vacancySkip, setVacancySkip] = useState<number>(0);
    const [isRefreshingVacancies, setIsRefreshingVacancies] = useState<boolean>(false);
    const [suggestedUsers, setSuggestedUsers] = useState<RecommendedUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [trends, setTrends] = useState<TrendingTopic[]>([]);
    const [loadingTrends, setLoadingTrends] = useState<boolean>(true);

    const handleRefreshVacancies = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRefreshingVacancies) return;
        setIsRefreshingVacancies(true);
        const nextSkip = vacancySkip + 3;
        try {
            const data = await VacancyService.getRecommended(3, nextSkip);
            if (data && data.length > 0) {
                setLiveVacancies(data);
                setVacancySkip(nextSkip);
            }
        } catch (err) {
            console.error("Error refreshing sidebar vacancies:", err);
        } finally {
            setTimeout(() => setIsRefreshingVacancies(false), 300);
        }
    };

    useEffect(() => {
        VacancyService.getRecommended(3)
            .then(data => {
                if (data && data.length > 0) {
                    setLiveVacancies(data);
                }
            })
            .catch(err => console.error("Error loading sidebar vacancies:", err))
            .finally(() => setLoadingVacancies(false));

        UserService.getRecommendedUsers(3)
            .then(data => {
                if (data && data.length > 0) {
                    setSuggestedUsers(data);
                }
            })
            .catch(err => console.error("Error loading recommended users:", err))
            .finally(() => setLoadingUsers(false));

        PostService.getTrendingTopics(4)
            .then(data => {
                if (data && data.length > 0) {
                    setTrends(data);
                }
            })
            .catch(err => console.error("Error loading trending topics:", err))
            .finally(() => setLoadingTrends(false));
    }, []);

    const handleToggleWatch = async (e: React.MouseEvent, userName: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await UserService.toggleWatchUser(userName);
            setSuggestedUsers(prev => prev.map(u => {
                if (u.userName.toLowerCase() === userName.toLowerCase()) {
                    return {
                        ...u,
                        isWatching: res.isWatching,
                        followers: res.watchersCount
                    };
                }
                return u;
            }));
        } catch (err) {
            console.error("Error toggling watch:", err);
        }
    };

    const fallbackTrends: TrendingTopic[] = [
        { tag: '#nextjs15', displayTag: '#Next.js 15', postsFormatted: '2.4k posts', category: 'Frontend', postCount: 2400 },
        { tag: '#dotnet9', displayTag: '#dotnet9', postsFormatted: '1.8k posts', category: 'Backend', postCount: 1800 },
        { tag: '#postgresql', displayTag: '#postgresql', postsFormatted: '940 posts', category: 'Database', postCount: 940 },
        { tag: '#signalr', displayTag: '#signalr', postsFormatted: '512 posts', category: 'Realtime', postCount: 512 },
    ];

    const displayTrends = trends.length > 0 ? trends : fallbackTrends;

    const fallbackVacancies = [
        { id: '1', title: 'Senior .NET / Next.js Dev', companyName: 'Nexus Tech', salaryFrom: 4500, salaryTo: 6000, currency: '$', format: 2 },
        { id: '2', title: 'Lead Frontend Engineer', companyName: 'CyberWave', salaryFrom: 5000, salaryTo: null, currency: '$', format: 1 },
    ];

    const displayVacancies = liveVacancies.length > 0 ? liveVacancies : fallbackVacancies;

    return (
        <aside className="hidden lg:block w-80 shrink-0 p-4 text-zinc-400">
            <div className="sticky space-y-4">
                
                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center gap-2 mb-3 text-zinc-100 font-bold text-sm">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span>{t.sidebarRight.trending}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {loadingTrends && trends.length === 0 ? (
                            <div className="flex flex-col gap-2.5 animate-pulse">
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} className="flex justify-between items-center py-1">
                                        <div className="space-y-1">
                                            <div className="w-16 h-2.5 rounded bg-zinc-800" />
                                            <div className="w-24 h-3.5 rounded bg-zinc-700" />
                                        </div>
                                        <div className="w-14 h-4 rounded-full bg-zinc-800" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            displayTrends.map((item, i) => (
                                <Link 
                                    key={item.tag || i} 
                                    href={`/search?q=${encodeURIComponent(item.tag.replace(/^#/, ''))}`}
                                    className="group flex justify-between items-center hover:bg-white/5 p-1.5 -mx-1.5 rounded-lg transition"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] text-zinc-500 truncate">{item.category}</span>
                                        <span className="text-sm font-medium text-zinc-200 group-hover:text-blue-400 transition truncate">
                                            {item.displayTag || item.tag}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full shrink-0 ml-2">
                                        {item.postsFormatted || `${item.postCount} ${t.sidebarRight.postsCount}`}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                            <Sparkles size={16} className="text-amber-400" />
                            <span>{t.sidebarRight.whoToWatch}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {loadingUsers && suggestedUsers.length === 0 ? (
                            <div className="flex flex-col gap-2.5 animate-pulse">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                                            <div className="flex-1 space-y-1">
                                                <div className="w-24 h-3 rounded bg-zinc-800" />
                                                <div className="w-16 h-2 rounded bg-zinc-900" />
                                            </div>
                                        </div>
                                        <div className="w-14 h-6 rounded-full bg-zinc-800/60 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : suggestedUsers.length === 0 ? (
                            <div className="text-xs text-zinc-500 py-2 text-center">
                                {t.sidebarRight.noSuggestions}
                            </div>
                        ) : (
                            suggestedUsers.map(user => {
                                const isOnline = onlineUsers?.includes(user.userName);
                                const displayName = user.fullName || user.userName;
                                const userInitial = (displayName || 'U')[0]?.toUpperCase();
                                const subtitle = user.bio_FirstLine || (user.technologies && user.technologies.length > 0 ? user.technologies.slice(0, 2).join(', ') : 'Developer');

                                return (
                                    <div key={user.id} className="flex items-center justify-between gap-2 group">
                                        <Link href={`/profile/${user.userName}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="relative w-9 h-9 shrink-0">
                                                {user.avatar ? (
                                                    <img 
                                                        src={user.avatar} 
                                                        className="w-full h-full rounded-full object-cover" 
                                                        alt={displayName} 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs text-zinc-200 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-white/10 select-none">
                                                        {userInitial}
                                                    </div>
                                                )}
                                                {isOnline && (
                                                    <span 
                                                        className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0e0e0e] rounded-full" 
                                                        title="Online"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                                                    {displayName}
                                                </span>
                                                <span className="text-[11px] text-zinc-500 truncate">
                                                    @{user.userName} · <span className="text-zinc-400">{subtitle}</span>
                                                </span>
                                            </div>
                                        </Link>

                                        <button 
                                            type="button"
                                            onClick={(e) => handleToggleWatch(e, user.userName)}
                                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition shrink-0 cursor-pointer ${
                                                user.isWatching 
                                                    ? 'bg-white/20 text-zinc-100 hover:bg-red-500/20 hover:text-red-300' 
                                                    : 'bg-white/10 hover:bg-white text-zinc-200 hover:text-black'
                                            }`}
                                        >
                                            {user.isWatching ? t.sidebarRight.watching : t.sidebarRight.watch}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <Link 
                            href="/vacancies" 
                            className="flex items-center gap-2 group min-w-0"
                            title={t.sidebarRight.liveVacancies}
                        >
                            <Briefcase size={16} className="text-emerald-400 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-sm font-bold text-zinc-100 group-hover:text-white transition whitespace-nowrap">
                                {t.sidebarRight.liveVacancies}
                            </span>
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {liveVacancies.some(v => v.matchPercent) && (
                                <span className="text-[10px] font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap leading-none">
                                    {t.sidebarRight.forYou || 'Для вас'}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleRefreshVacancies}
                                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                                title={t.sidebarRight.refresh}
                            >
                                <RotateCcw size={12} className={isRefreshingVacancies ? "animate-spin text-emerald-400" : ""} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {loadingVacancies && liveVacancies.length === 0 ? (
                            <div className="flex flex-col gap-2.5 animate-pulse">
                                {[1, 2, 3].map(n => (
                                    <div 
                                        key={n}
                                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="w-20 h-2.5 rounded bg-zinc-800" />
                                            <div className="w-10 h-3 rounded bg-zinc-900" />
                                        </div>
                                        <div className="w-36 h-3.5 rounded bg-zinc-700" />
                                        <div className="w-24 h-2.5 rounded bg-zinc-800" />
                                    </div>
                                ))}
                            </div>
                        ) : displayVacancies.length === 0 ? (
                            <div className="text-xs text-zinc-500 py-2 text-center">
                                No vacancies yet
                            </div>
                        ) : (
                            displayVacancies.map((job: any, idx: number) => {
                                const salaryText = formatSalary(job.salaryFrom, job.salaryTo, job.currency, job.salary);
                                const companyName = job.companyName || job.company;
                                const formatName = job.format === 0 ? 'Office' : job.format === 1 ? 'Hybrid' : job.format === 2 ? 'Remote' : undefined;

                                return (
                                    <Link 
                                        key={job.id || idx} 
                                        href="/vacancies"
                                        className="group p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition flex flex-col gap-1"
                                    >
                                        <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400">
                                            <span className="truncate font-medium text-zinc-300 group-hover:text-zinc-100 transition">
                                                {companyName}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {job.matchPercent && (
                                                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                        ✨ {job.matchPercent}%
                                                    </span>
                                                )}
                                                {formatName && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                                                        {formatName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition truncate">
                                                {job.title}
                                            </span>
                                            <ExternalLink size={12} className="text-zinc-500 group-hover:text-zinc-300 transition shrink-0 ml-1" />
                                        </div>

                                        {salaryText && (
                                            <div 
                                                suppressHydrationWarning 
                                                className="text-[11px] text-emerald-400 font-medium pt-0.5"
                                            >
                                                {salaryText}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    <Link 
                        href="/vacancies" 
                        className="mt-3 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition group"
                    >
                        <span>{t.sidebarRight.allVacancies}</span>
                        <span className="text-zinc-500 group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                </div>

                <div className="px-2 text-[11px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/terms" className="hover:underline">Terms</Link>
                    <Link href="/privacy" className="hover:underline">Privacy</Link>
                    <Link href="/about" className="hover:underline">About</Link>
                    <span>© 2026 DevLink</span>
                </div>

            </div>
        </aside>
    );
}