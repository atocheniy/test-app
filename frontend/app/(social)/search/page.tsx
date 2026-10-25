'use client';

import Post1 from "@/components/post";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { CommunityService } from "@/services/communityService";
import { PostService } from "@/services/postService";
import { UserService } from "@/services/userService";
import { formatPostTime } from "@/libs/format";
import type { Post, User } from "@/types/auth";
import {
    ArrowUpRight,
    Sparkles,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from 'react';

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

function SearchContent() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [activeTab, setActiveTab] = useState<'all' | 'communities' | 'people' | 'posts' | 'tags' | 'jobs'>('all');

    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(true);

    const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
    const [loadingRecommendedUsers, setLoadingRecommendedUsers] = useState(true);

    const { onlineUsers, userData } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    
    const tabs = [
        { id: 'all', label: isRu ? 'Все' : 'All' },
        { id: 'communities', label: isRu ? 'Сообщества' : 'Communities' },
        { id: 'people', label: isRu ? 'Люди' : 'People' },
        { id: 'posts', label: isRu ? 'Публикации и код' : 'Posts & Code' },
    ];

    const fallbackTrends = [
        { tag: '#dotnet9', displayTag: '#dotnet9', category: isRu ? 'Бэкенд-архитектура' : 'Backend Architecture', count: isRu ? '8.4k постов' : '8.4k posts' },
        { tag: '#nextjs15', displayTag: '#Next.js 15', category: isRu ? 'Веб-разработка' : 'Web Development', count: isRu ? '12.1k постов' : '12.1k posts' },
        { tag: '#remotejobs', displayTag: '#remotejobs', category: isRu ? 'Карьера и найм' : 'Careers & Hiring', count: isRu ? '5.6k постов' : '5.6k posts' },
        { tag: '#signalr', displayTag: '#signalr', category: isRu ? 'Реальное время' : 'Realtime Web', count: isRu ? '3.1k постов' : '3.1k posts' },
    ];

    const displayTrends = trendingTopics.length > 0 ? trendingTopics : fallbackTrends;

    // Sync query when URL search param ?q= changes (e.g. clicked on Right_Sidebar or back/forward)
    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null && q !== undefined) {
            setQuery(q);
        }
    }, [searchParams]);

    // Load live trending topics
    useEffect(() => {
        PostService.getTrendingTopics(4)
            .then(data => {
                if (data && data.length > 0) {
                    setTrendingTopics(data);
                }
            })
            .catch(err => console.error("Error loading search trending topics:", err))
            .finally(() => setLoadingTrends(false));

        UserService.getRecommendedUsers(6)
            .then(data => {
                if (data && data.length > 0) {
                    setRecommendedUsers(data);
                }
            })
            .catch(err => console.error("Error loading search recommended users:", err))
            .finally(() => setLoadingRecommendedUsers(false));
    }, []);

    const handleToggleWatch = async (e: React.MouseEvent, targetUsername: string) => {
        e.preventDefault();
        e.stopPropagation();

        setRecommendedUsers(prev => prev.map(u => {
            if (u.userName.toLowerCase() === targetUsername.toLowerCase()) {
                const nextIsWatching = !u.isWatching;
                return {
                    ...u,
                    isWatching: nextIsWatching,
                    followers: Math.max(0, (u.followers || 0) + (nextIsWatching ? 1 : -1))
                };
            }
            return u;
        }));

        try {
            await UserService.toggleWatchUser(targetUsername);
        } catch (err) {
            console.error("Error toggling watch:", err);
            setRecommendedUsers(prev => prev.map(u => {
                if (u.userName.toLowerCase() === targetUsername.toLowerCase()) {
                    const revertIsWatching = !u.isWatching;
                    return {
                        ...u,
                        isWatching: revertIsWatching,
                        followers: Math.max(0, (u.followers || 0) + (revertIsWatching ? 1 : -1))
                    };
                }
                return u;
            }));
        }
    };

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setUsers([]);
            setPosts([]);
            setCommunities([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const timer = setTimeout(async () => {
            try {
                const [usersData, postsData, communitiesData] = await Promise.all([
                    UserService.searchUsers(trimmed),
                    PostService.searchPosts(trimmed),
                    CommunityService.searchCommunities(trimmed)
                ]);
                
                setUsers(usersData || []);
                setPosts(postsData || []);
                setCommunities(communitiesData || []);
            } catch (error) {
                console.error("Ошибка поиска:", error);
                setUsers([]);
                setPosts([]);
                setCommunities([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="flex flex-col min-h-full pb-12 animate-fade-in">
            <Titlebar title={isRu ? 'Поиск' : 'Search'} />

            <div className="p-4 sm:p-6 space-y-6">
                
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isRu ? 'Поиск людей, кода, тегов, вакансий...' : 'Search people, code snippets, tags, jobs...'}
                        className="w-full h-13 pl-4 pr-10 rounded-2xl bg-white/[0.03] border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-md transition-all text-sm sm:text-base shadow-inner"
                    />
                    {query && (
                        <button 
                            onClick={() => setQuery('')}
                            className="absolute right-3 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5 pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-white text-black shadow-md'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {query.trim().length > 0 ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400 font-medium">
                                {isRu ? 'Результаты для' : 'Results for'} <span className="text-white font-bold">"{query}"</span>
                            </span>
                        </div>

                        {(activeTab === 'all' || activeTab === 'communities') && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isRu ? 'Сообщества' : 'Communities'}</h3>

                                {isLoading && communities.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500">{isRu ? 'Поиск сообществ...' : 'Searching communities...'}</div>
                                ) : communities.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                                        {isRu ? 'Сообщества не найдены' : 'No communities found'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {communities.map((comm) => (
                                            <Link 
                                                key={comm.id} 
                                                href={`/c/${comm.slug}`}
                                                className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="relative w-11 h-11 shrink-0 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
                                                        {comm.avatar ? (
                                                            <img src={comm.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                                                {comm.name?.[0]?.toUpperCase() || "C"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col truncate">
                                                        <span className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition truncate">
                                                            {comm.name}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 truncate font-mono">
                                                            c/{comm.slug} · <span className="text-zinc-400 font-sans">{comm.membersCount} {isRu ? 'участников' : 'members'}</span>
                                                        </span>
                                                        {comm.description && (
                                                            <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                                                                {comm.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-2 rounded-full text-zinc-600 group-hover:text-white transition shrink-0">
                                                    <ArrowUpRight size={16} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'people') && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isRu ? 'Люди' : 'People'}</h3>

                                {isLoading && users.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500">{isRu ? 'Поиск людей...' : 'Searching people...'}</div>
                                ) : users.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                                        {isRu ? 'Пользователи не найдены' : 'No users found'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {users.map((user) => {
                                            const cleanUser = user.userName?.replace("@", "") || "";
                                            const isOnline = onlineUsers.some(
                                                (u) => u.toLowerCase() === cleanUser.toLowerCase()
                                            );

                                            return (
                                                <Link 
                                                    key={user.id} 
                                                    href={`/profile/${cleanUser}`}
                                                    className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition flex items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="relative w-11 h-11 shrink-0 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                                                            {user.avatar ? (
                                                                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                                                    {user.fullName?.[0]?.toUpperCase() || cleanUser[0]?.toUpperCase() || "U"}
                                                                </div>
                                                            )}
                                                            {isOnline && (
                                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col truncate">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition truncate">
                                                                    {user.fullName || cleanUser}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-zinc-500 truncate">
                                                                @{cleanUser} {user.followers ? `· ${user.followers} ${isRu ? 'подписчиков' : 'followers'}` : ''}
                                                            </span>
                                                            {user.bio_FirstLine && (
                                                                <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                                                                    {user.bio_FirstLine}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-2 rounded-full text-zinc-600 group-hover:text-white transition shrink-0">
                                                        <ArrowUpRight size={16} />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'posts') && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isRu ? 'Публикации и код' : 'Posts & Code'}</h3>

                                {isLoading && posts.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500">{isRu ? 'Поиск публикаций...' : 'Searching posts...'}</div>
                                ) : posts.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                                        {isRu ? 'Публикации не найдены' : 'No posts found'}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {posts.map((post: any) => (
                                            <Post1 
                                                key={post.id}
                                                Id={post.id}
                                                Name={post.authorName}
                                                UserName={post.authorUsername}
                                                Content={post.content}
                                                Time={formatPostTime(post.created)}
                                                Avatar={post.authorAvatar}
                                                Likes={post.likesCount}
                                                Comments={post.commentsCount}
                                                isLikedByMe={post.isLikedByMe}
                                                repostsCount={post.repostsCount}
                                                repostOfPost={post.repostOfPost}
                                                Attachments={post.attachments}
                                                commentsList={post.commentsList}
                                                community={post.community}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {(activeTab === 'all' || activeTab === 'communities' || activeTab === 'posts') && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={18} className="text-blue-400" />
                                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                        {isRu ? 'Актуальные темы и обсуждения' : 'Trending Topics & Discussions'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {displayTrends.map((item, idx) => (
                                        <div 
                                            key={item.tag || idx}
                                            onClick={() => setQuery(item.tag)}
                                            className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition cursor-pointer flex items-center justify-between"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-zinc-500">{item.category}</span>
                                                <span className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition mt-0.5">
                                                    {item.displayTag || item.tag}
                                                </span>
                                                <span className="text-xs text-zinc-500 mt-1">
                                                    {item.postsFormatted || item.count || `${item.postCount || 0} ${isRu ? 'постов' : 'posts'}`}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-full text-zinc-600 group-hover:text-white transition">
                                                <ArrowUpRight size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'posts') && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={18} className="text-amber-400" />
                                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                        {isRu ? 'Обзор по направлениям' : 'Explore by Ecosystem'}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(isRu
                                        ? ['Fullstack-разработка', 'ИИ и машинное обучение', 'UI/UX Дизайн', '.NET и C#', 'Next.js и React', 'PostgreSQL', 'Стартапы и основатели', 'Удаленная работа']
                                        : ['Fullstack Development', 'AI & Machine Learning', 'UI/UX Design', '.NET & C#', 'Next.js & React', 'PostgreSQL', 'Startups & Founders', 'Remote Work']
                                    ).map((category, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setQuery(category)}
                                            className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/5 text-xs font-medium text-zinc-300 transition active:scale-95 cursor-pointer"
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'people') && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-violet-400" />
                                        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                            {isRu ? 'Рекомендуемые разработчики' : 'Recommended Developers'}
                                        </h2>
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
                                        {isRu ? 'На основе вашего стека и активности' : 'Based on your tech stack & activity'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {loadingRecommendedUsers && recommendedUsers.length === 0 ? (
                                        [1, 2, 3, 4].map((n) => (
                                            <div key={n} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-zinc-800" />
                                                        <div className="space-y-1.5">
                                                            <div className="w-24 h-3.5 rounded bg-zinc-700" />
                                                            <div className="w-16 h-2.5 rounded bg-zinc-800" />
                                                        </div>
                                                    </div>
                                                    <div className="w-16 h-7 rounded-full bg-zinc-800" />
                                                </div>
                                                <div className="w-3/4 h-3 rounded bg-zinc-800/80" />
                                                <div className="flex gap-1.5 pt-1">
                                                    <div className="w-12 h-4 rounded bg-zinc-800" />
                                                    <div className="w-12 h-4 rounded bg-zinc-800" />
                                                </div>
                                            </div>
                                        ))
                                    ) : recommendedUsers.length === 0 ? (
                                        <div className="col-span-full p-6 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                                            {isRu ? 'Нет доступных рекомендаций разработчиков' : 'No recommended developers available'}
                                        </div>
                                    ) : (
                                        recommendedUsers.map((user) => {
                                            const isOnline = onlineUsers.some(u => u.toLowerCase() === user.userName.toLowerCase());
                                            const displayName = user.fullName || user.userName;
                                            const userInitial = (displayName?.[0] || user.userName?.[0] || 'U').toUpperCase();

                                            return (
                                                <div 
                                                    key={user.id}
                                                    className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition duration-200 flex flex-col justify-between group"
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-2.5">
                                                        <Link 
                                                            href={`/profile/${user.userName}`}
                                                            className="flex items-center gap-3 min-w-0 flex-1"
                                                        >
                                                            <div className="relative w-11 h-11 shrink-0 rounded-full">
                                                                {user.avatar ? (
                                                                    <img 
                                                                        src={user.avatar} 
                                                                        alt={user.userName}
                                                                        className="w-full h-full rounded-full object-cover border border-white/10"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-sm text-zinc-200 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-white/10 select-none">
                                                                        {userInitial}
                                                                    </div>
                                                                )}
                                                                {isOnline && (
                                                                    <span 
                                                                        className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" 
                                                                        title={isRu ? 'В сети' : 'Online'}
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition truncate">
                                                                    {displayName}
                                                                </span>
                                                                <span className="text-xs text-zinc-500 truncate font-mono">
                                                                    @{user.userName}
                                                                </span>
                                                            </div>
                                                        </Link>

                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleToggleWatch(e, user.userName)}
                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition shrink-0 cursor-pointer ${
                                                                user.isWatching 
                                                                    ? 'bg-white/20 text-zinc-100 hover:bg-red-500/20 hover:text-red-300' 
                                                                    : 'bg-white text-black hover:bg-zinc-200'
                                                            }`}
                                                        >
                                                            {user.isWatching
                                                                ? (isRu ? 'Читаю' : 'Watching')
                                                                : (isRu ? 'Читать' : 'Watch')}
                                                        </button>
                                                    </div>

                                                    {user.bio_FirstLine && (
                                                        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                                                            {user.bio_FirstLine}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 mt-auto">
                                                        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
                                                            {user.technologies && user.technologies.length > 0 ? (
                                                                user.technologies.slice(0, 3).map((tech, tIdx) => (
                                                                    <span 
                                                                        key={tIdx}
                                                                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5"
                                                                    >
                                                                        {tech}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[11px] text-zinc-500 font-sans">
                                                                    {user.followers || 0} {isRu ? 'подписчиков' : 'followers'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {user.sharedTechCount && user.sharedTechCount > 0 ? (
                                                            <span className="text-[10px] font-medium text-emerald-400 shrink-0">
                                                                ✨ {user.sharedTechCount} {isRu ? 'общ. тех.' : 'shared tech'}
                                                            </span>
                                                        ) : user.mutualCount && user.mutualCount > 0 ? (
                                                            <span className="text-[10px] font-medium text-blue-400 shrink-0">
                                                                🤝 {user.mutualCount} {isRu ? 'общ.' : 'mutual'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-zinc-500 shrink-0">
                                                                {user.followers || 0} {isRu ? 'подписчиков' : 'followers'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Search() {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-full pb-12 animate-fade-in">
                <Titlebar title={isRu ? 'Поиск' : 'Search'} />
                <div className="p-6 text-zinc-500 text-sm">{isRu ? 'Загрузка поиска...' : 'Loading search...'}</div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}