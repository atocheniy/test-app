'use client';


import Avatar from "@/components/Avatar";
import ExperienceCard from "@/components/exp_card";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import { formatPostTime } from "@/libs/format";
import { ChatService } from "@/services/chatService";
import { UserService } from "@/services/userService";
import {
    ArrowUpRight,
    Briefcase,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Code2,
    Globe,
    LayoutGrid,
    Lock,
    Mail,
    MapPin,
    Send,
    SlidersHorizontal,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';


export default function Profile() {
    const router = useRouter();
    const { userData, UserNameNormalized, userPostsData , refreshUserPostsData} = useApplication();
    const { refreshOtherUserPostsData, refreshOtherUserData, otherUserPostsData, otherUserData, hasMoreOtherUserPosts, isLoadingMoreOtherUserPosts, loadMoreOtherUserPosts } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    const params = useParams();
    const usernameFromUrl = params.username as string;

    const { onlineUsers } = useApplication();
    const cleanUsername = otherUserData.userName;

    const otherPostsSentinelRef = useRef<HTMLDivElement>(null);

    const isProfileLoading = !otherUserData?.id || otherUserData.userName.toLowerCase() !== usernameFromUrl?.toLowerCase();
    const [isPostsLoading, setIsPostsLoading] = useState(true);

    const isAuthorOnline = onlineUsers.some(
        (u) => u.toLowerCase() === cleanUsername.toLowerCase()
    );

    const [loadingChat, setLoadingChat] = useState(false);
    const [isWatchingUser, setIsWatchingUser] = useState(false);
    const [watchersCount, setWatchersCount] = useState<number>(0);
    const [isLinksExpanded, setIsLinksExpanded] = useState(false);
    const [profileTab, setProfileTab] = useState<'details' | 'projects' | 'experience'>('details');

    const [projectsViewMode, setProjectsViewMode] = useState<'carousel' | 'grid'>('carousel');
    const projectsCarouselRef = useRef<HTMLDivElement>(null);
    const [canScrollProjectsLeft, setCanScrollProjectsLeft] = useState(false);
    const [canScrollProjectsRight, setCanScrollProjectsRight] = useState(false);

    const checkProjectsScroll = () => {
        if (!projectsCarouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = projectsCarouselRef.current;
        setCanScrollProjectsLeft(scrollLeft > 10);
        setCanScrollProjectsRight(scrollLeft + clientWidth < scrollWidth - 10);
    };

    const handleScrollProjects = (direction: 'left' | 'right') => {
        if (!projectsCarouselRef.current) return;
        const { clientWidth } = projectsCarouselRef.current;
        const scrollDistance = clientWidth * 0.85;
        projectsCarouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollDistance : scrollDistance,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        if (otherUserData && otherUserData.userName?.toLowerCase() === usernameFromUrl?.toLowerCase()) {
            setIsWatchingUser(Boolean(otherUserData.isWatching));
            setWatchersCount(otherUserData.watchersCount ?? otherUserData.followers ?? 0);
        }
    }, [otherUserData, usernameFromUrl]);

    const handleToggleWatchUser = async () => {
        if (!userData?.userName || userData.userName === '...') {
            alert(isRu ? "Пожалуйста, войдите в систему, чтобы отслеживать пользователя" : "Please sign in to watch this user");
            return;
        }
        try {
            const res = await UserService.toggleWatchUser(usernameFromUrl);
            setIsWatchingUser(res.isWatching);
            setWatchersCount(res.watchersCount);
        } catch (e: any) {
            console.error("Ошибка изменения статуса отслеживания:", e);
            const msg = e?.response?.data?.message || (isRu ? "Не удалось изменить статус отслеживания" : "Failed to update watch status");
            alert(msg);
        }
    };

    const handleWriteMessage = async () => {
        if (!otherUserData?.id || loadingChat) return;

        if (otherUserData.allowDirectMessages === false) {
            alert(isRu ? "Пользователь ограничил отправку личных сообщений" : "User has disabled direct messages");
            return;
        }

        try {
            setLoadingChat(true);
            const data = await ChatService.startChat(otherUserData.id);
            router.push(`/messages?chatId=${data.chatId}`);
        } catch (error: any) {
            console.error("Не удалось начать чат:", error);
            const msg = error?.response?.data?.message || (isRu ? "Не удалось начать чат" : "Failed to start chat");
            alert(msg);
        } finally {
            setLoadingChat(false);
        }
    };

    const isOwnProfile = Boolean(
        userData?.userName &&
        userData.userName !== '...' &&
        usernameFromUrl &&
        usernameFromUrl.toLowerCase() === userData.userName.toLowerCase()
    );

    const isAccountLocked = !isOwnProfile && (Boolean(otherUserData.isLocked) || (Boolean(otherUserData.isPrivate) && !isWatchingUser));
    
    useEffect(() => {
        if (isOwnProfile) {
            router.replace('/profile');
            return;
        }

        if (!usernameFromUrl) return;

        document.title = `@${usernameFromUrl}`;
        setIsPostsLoading(true);

        Promise.all([
            refreshOtherUserData(usernameFromUrl),
            refreshOtherUserPostsData(usernameFromUrl)
        ]).finally(() => {
            setIsPostsLoading(false);
        });
    }, [usernameFromUrl, isOwnProfile, router]);

    useEffect(() => {
        if (!hasMoreOtherUserPosts || isLoadingMoreOtherUserPosts) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreOtherUserPosts(usernameFromUrl);
            }
        }, {
            rootMargin: '300px',
        });

        const el = otherPostsSentinelRef.current;
        if (el) observer.observe(el);

        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMoreOtherUserPosts, isLoadingMoreOtherUserPosts, loadMoreOtherUserPosts, usernameFromUrl]);

    if (isOwnProfile || isProfileLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="animate-fade-in">
            <div>
                <Titlebar title={t.nav.profile}></Titlebar>

                <div className="w-full bg-zinc-900 h-48 border-y border-white/5 rounded-b-xl relative overflow-hidden light:bg-zinc-100 light:border-zinc-200/80">
                    {otherUserData.banner && (
                        <img src={otherUserData.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 max-sm:px-5 pb-10 relative">
                    {otherUserData.banner && (
                        <div 
                            className="absolute -top-110 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-11110 select-none"
                            style={{
                                backgroundImage: `url(${otherUserData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    {otherUserData.banner && (
                        <div 
                            className="absolute -top-30 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-0 select-none"
                            style={{
                                backgroundImage: `url(${otherUserData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-10">
                        <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full shrink-0 -mt-14 sm:-mt-20 border-4 border-[#0a0a0a] z-10 shadow-lg light:border-white light:shadow-md">
                            <div className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                <Avatar
                                    src={otherUserData.avatar}
                                    name={otherUserData.fullName || otherUserData.userName}
                                    className="w-full h-full text-2xl sm:text-4xl"
                                />
                            </div>
                            {isAuthorOnline && (
                                <span 
                                    className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-[#0a0a0a] rounded-full light:bg-emerald-500 light:border-white" 
                                    title={isRu ? "В сети" : "Online"}
                                />
                            )}
                        </div>
                        <div className="mb-1 sm:mb-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 break-words light:text-zinc-900">{otherUserData.fullName}</h2>
                                {otherUserData.isPrivate && (
                                    <span title={isRu ? "Закрытый профиль" : "Private profile"} className="inline-flex items-center text-zinc-400 light:text-zinc-500">
                                        <Lock size={16} />
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                <p className="text-sm text-zinc-400 break-all light:text-zinc-500">@{otherUserData.userName}</p>
                                <span className="text-sm text-zinc-400 light:text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400 light:text-zinc-500">{watchersCount} {t.profile.watchers}</p>
                                <span className="text-sm text-zinc-400 light:text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400 light:text-zinc-500">{otherUserData.watchingCount ?? otherUserData.followings ?? 0} {t.profile.watching}</p>
                            </div>
                        </div>

                        <div className="sm:ml-auto sm:mb-5 flex items-center gap-2 shrink-0 flex-nowrap">
                            {isOwnProfile ? (
                                <Link 
                                    href="/profile"
                                    className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition whitespace-nowrap shrink-0 text-center light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                                >
                                    {t.profile.editProfile}
                                </Link>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleToggleWatchUser}
                                        className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-3xl transition active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 text-center min-w-[90px] sm:min-w-[100px] ${
                                            isWatchingUser 
                                                ? "bg-white/10 text-white border border-white/20 hover:bg-white/15 light:bg-zinc-100 light:text-zinc-900 light:border-zinc-300 light:hover:bg-zinc-200" 
                                                : "bg-white/10 text-zinc-200 border border-white/10 hover:bg-white/15 hover:text-white light:bg-zinc-100 light:text-zinc-700 light:border-zinc-200 light:hover:bg-zinc-200 light:hover:text-zinc-900"
                                        }`}
                                    >
                                        {isWatchingUser ? (isRu ? "Вы читаете" : "Following") : t.profile.watchBtn}
                                    </button>
                                    {otherUserData.allowDirectMessages === false ? (
                                        <button 
                                            disabled
                                            title={isRu ? "Пользователь ограничил входящие личные сообщения" : "User has disabled direct messages"}
                                            className="px-4 py-2 text-sm font-medium bg-white/5 text-zinc-500 rounded-3xl cursor-not-allowed whitespace-nowrap shrink-0 text-center border border-white/5 light:bg-zinc-100 light:text-zinc-400 light:border-zinc-200"
                                        >
                                            {isRu ? "ЛС закрыты" : "DMs disabled"}
                                        </button>
                                    ) : (
                                        <button 
                                            className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 text-center light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                                            onClick={handleWriteMessage}
                                        >
                                            {isRu ? "Написать сообщение" : "Write a message"}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mt-6">
                        <p className="text-md font-bold text-zinc-300 light:text-zinc-800">
                            {otherUserData.bio_FirstLine || ""}
                        </p>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <p className="text-sm text-zinc-300 leading-relaxed light:text-zinc-700">
                            {otherUserData.bio_SecondLine || ""}
                        </p>
                    </div>

                    <div className="space-y-3 mt-6">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider light:text-zinc-500">{t.profile.techStack}</h3>
                        {otherUserData.technologies && otherUserData.technologies.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {otherUserData.technologies.map((tech) => (
                                    <span 
                                        key={tech} 
                                        className="px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-200 cursor-default light:bg-zinc-100 light:border-zinc-200 light:text-zinc-700 light:hover:bg-zinc-200/70 light:hover:border-zinc-300"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500 py-1 light:text-zinc-500">{isRu ? "Навыки еще не указаны" : "No skills listed yet"}</p>
                        )}
                    </div>

                    {isAccountLocked ? (
                        <div className="mt-8 p-8 sm:p-12 rounded-3xl border border-white/5 bg-zinc-950/20 flex flex-col items-center justify-center text-center light:bg-zinc-50 light:border-zinc-200/80">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-zinc-300 border border-white/10 light:bg-zinc-200/80 light:text-zinc-700 light:border-zinc-300">
                                <Lock size={26} />
                            </div>
                            <h3 className="text-base font-bold text-zinc-100 light:text-zinc-900 mb-1.5">
                                {t.settings.privateAccountNoticeTitle}
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 light:text-zinc-600 max-w-md">
                                {t.settings.privateAccountNoticeDesc}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 border-b border-white/5 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar light:border-zinc-200/80">
                        <button
                            type="button"
                            onClick={() => setProfileTab('details')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer shrink-0 whitespace-nowrap ${
                                profileTab === 'details'
                                    ? 'border-white text-white light:border-zinc-900 light:text-zinc-950'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900'
                            }`}
                        >
                            <Sparkles size={14} className={profileTab === 'details' ? 'text-blue-400' : 'text-zinc-500'} />
                            <span>{t.profile.detailsAndLinks}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setProfileTab('projects')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer shrink-0 whitespace-nowrap ${
                                profileTab === 'projects'
                                    ? 'border-white text-white light:border-zinc-900 light:text-zinc-950'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900'
                            }`}
                        >
                            <Code2 size={14} className={profileTab === 'projects' ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span>{t.profile.featuredProjects}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                profileTab === 'projects' ? 'bg-white/20 text-white light:bg-zinc-900/10 light:text-zinc-900' : 'bg-white/5 text-zinc-500 light:bg-zinc-100 light:text-zinc-500'
                            }`}>
                                {otherUserData.projects?.length || 0}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setProfileTab('experience')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer shrink-0 whitespace-nowrap ${
                                profileTab === 'experience'
                                    ? 'border-white text-white light:border-zinc-900 light:text-zinc-950'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900'
                            }`}
                        >
                            <Briefcase size={14} className={profileTab === 'experience' ? 'text-purple-400' : 'text-zinc-500'} />
                            <span>{t.profile.experience}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                profileTab === 'experience' ? 'bg-white/20 text-white light:bg-zinc-900/10 light:text-zinc-900' : 'bg-white/5 text-zinc-500 light:bg-zinc-100 light:text-zinc-500'
                            }`}>
                                {otherUserData.experiences?.length || 0}
                            </span>
                        </button>
                    </div>

                    <div className="mt-6">
                        {profileTab === 'details' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start animate-fade-in">
                                <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl light:bg-white light:border-zinc-200/80 light:shadow-sm light:hover:border-zinc-300">
                                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4 light:text-zinc-500">
                                        {isRu ? "Детали" : "Details"}
                                    </h4>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0 light:bg-zinc-100 light:border-zinc-200 light:text-zinc-600">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium light:text-zinc-500">{t.profile.location}</span>
                                                <span className="text-xs text-zinc-200 font-medium light:text-zinc-800">
                                                    {otherUserData.location || (isRu ? "Не указано" : "Not specified")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-700">
                                                <Briefcase size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium light:text-zinc-500">{t.profile.workStatus}</span>
                                                <span className="text-xs text-zinc-200 font-medium flex items-center gap-1.5 light:text-zinc-800">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                                    </span>
                                                    {otherUserData.workStatus || (isRu ? "Открыт к предложениям" : "Open to opportunities")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0 light:bg-zinc-100 light:border-zinc-200 light:text-zinc-600">
                                                <Sparkles size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium light:text-zinc-500">{t.profile.focus}</span>
                                                <span className="text-xs text-zinc-200 font-medium light:text-zinc-800">
                                                    {otherUserData.focus || (isRu ? "Не указано" : "Not specified")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl light:bg-white light:border-zinc-200/80 light:shadow-sm light:hover:border-zinc-300">
                                    {(() => {
                                        const userLinks = [
                                            otherUserData.githubUrl && { 
                                                label: 'GitHub', 
                                                display: otherUserData.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\/?/, ''), 
                                                url: otherUserData.githubUrl.startsWith('http') ? otherUserData.githubUrl : `https://github.com/${otherUserData.githubUrl}`, 
                                                icon: Code2 
                                            },
                                            otherUserData.telegramUrl && { 
                                                label: 'Telegram', 
                                                display: `@${otherUserData.telegramUrl.replace(/^https?:\/\/t\.me\/?/, '').replace(/^@/, '')}`, 
                                                url: otherUserData.telegramUrl.startsWith('http') ? otherUserData.telegramUrl : `https://t.me/${otherUserData.telegramUrl.replace(/^@/, '')}`, 
                                                icon: Send 
                                            },
                                            otherUserData.vkUrl && { 
                                                label: 'VK', 
                                                display: isRu ? 'Профиль VK' : 'VK Profile', 
                                                url: otherUserData.vkUrl.startsWith('http') ? otherUserData.vkUrl : `https://${otherUserData.vkUrl}`, 
                                                icon: Globe 
                                            },
                                            otherUserData.xUrl && { 
                                                label: 'X (Twitter)', 
                                                display: isRu ? 'Профиль X' : 'X Profile', 
                                                url: otherUserData.xUrl.startsWith('http') ? otherUserData.xUrl : `https://${otherUserData.xUrl}`, 
                                                icon: Globe 
                                            },
                                            otherUserData.discordUrl && { 
                                                label: 'Discord', 
                                                display: otherUserData.discordUrl, 
                                                url: otherUserData.discordUrl.startsWith('http') ? otherUserData.discordUrl : `https://${otherUserData.discordUrl}`, 
                                                icon: Globe 
                                            },
                                            otherUserData.websiteUrl && { 
                                                label: isRu ? 'Портфолио' : 'Portfolio', 
                                                display: otherUserData.websiteUrl.replace(/^https?:\/\//, ''), 
                                                url: otherUserData.websiteUrl.startsWith('http') ? otherUserData.websiteUrl : `https://${otherUserData.websiteUrl}`, 
                                                icon: Globe 
                                            },
                                            otherUserData.email && { 
                                                label: 'Email', 
                                                display: otherUserData.email, 
                                                url: `mailto:${otherUserData.email}`, 
                                                icon: Mail 
                                            },
                                        ].filter(Boolean) as { label: string; display: string; url: string; icon: any }[];

                                        const visibleLinks = isLinksExpanded ? userLinks : userLinks.slice(0, 3);

                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider light:text-zinc-500">
                                                        {isRu ? "Ссылки и контакты" : "Links & Contacts"}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-500 font-mono light:text-zinc-500">
                                                        {userLinks.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {userLinks.length === 0 ? (
                                                        <p className="text-xs text-zinc-500 py-3 text-center light:text-zinc-500">
                                                            {isRu ? "Ссылки ещё не добавлены" : "No links added yet"}
                                                        </p>
                                                    ) : (
                                                        visibleLinks.map((link, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center justify-between p-2 px-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-150 group light:border-zinc-200/80 light:bg-zinc-50/60 light:hover:bg-zinc-100/80 light:hover:border-zinc-300"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <link.icon size={13} className="text-zinc-500 group-hover:text-zinc-200 transition-colors light:text-zinc-500 light:group-hover:text-zinc-800" />
                                                                    <span className="text-xs font-medium text-zinc-200 light:text-zinc-800 light:group-hover:text-blue-600">{link.label}</span>
                                                                    {link.display && (
                                                                        <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline truncate max-w-[150px] light:text-zinc-500">
                                                                            {link.display}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <ArrowUpRight 
                                                                    size={13} 
                                                                    className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0 light:text-zinc-400 light:group-hover:text-zinc-900" 
                                                                />
                                                            </a>
                                                        ))
                                                    )}

                                                    {userLinks.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                                                            className="w-full mt-1.5 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition cursor-pointer light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                                        >
                                                            <span>{isLinksExpanded ? (isRu ? "Свернуть" : "Show less") : (isRu ? `Показать все (+${userLinks.length - 3})` : `Show all (+${userLinks.length - 3})`)}</span>
                                                            <ChevronDown 
                                                                size={12} 
                                                                className={`transition-transform duration-200 ${isLinksExpanded ? "rotate-180" : ""}`} 
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {profileTab === 'projects' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider light:text-zinc-600">
                                            {t.profile.featuredProjects}
                                        </h4>
                                        <span className="text-[11px] text-zinc-500 font-mono light:text-zinc-500">
                                            {otherUserData.projects?.length || 0}
                                        </span>
                                    </div>

                                    {otherUserData.projects && otherUserData.projects.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {projectsViewMode === 'carousel' && otherUserData.projects.length > 2 && (
                                                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl light:bg-zinc-100 light:border-zinc-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleScrollProjects('left')}
                                                        disabled={!canScrollProjectsLeft}
                                                        className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer light:text-zinc-600 light:hover:text-zinc-900 light:disabled:opacity-30"
                                                        title={isRu ? "Предыдущие проекты" : "Previous projects"}
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleScrollProjects('right')}
                                                        disabled={!canScrollProjectsRight}
                                                        className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer light:text-zinc-600 light:hover:text-zinc-900 light:disabled:opacity-30"
                                                        title={isRu ? "Следующие проекты" : "Next projects"}
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-xl light:bg-zinc-100 light:border-zinc-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setProjectsViewMode('carousel')}
                                                    className={`p-1 rounded-lg transition cursor-pointer ${
                                                        projectsViewMode === 'carousel'
                                                            ? 'bg-white/15 text-white light:bg-white light:text-zinc-900 light:shadow-xs'
                                                            : 'text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900'
                                                    }`}
                                                    title={isRu ? "Режим карусели" : "Carousel view"}
                                                >
                                                    <SlidersHorizontal size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setProjectsViewMode('grid')}
                                                    className={`p-1 rounded-lg transition cursor-pointer ${
                                                        projectsViewMode === 'grid'
                                                            ? 'bg-white/15 text-white light:bg-white light:text-zinc-900 light:shadow-xs'
                                                            : 'text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900'
                                                    }`}
                                                    title={isRu ? "Режим сетки" : "Grid view"}
                                                >
                                                    <LayoutGrid size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!otherUserData.projects || otherUserData.projects.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                                        <Code2 size={24} className="text-zinc-600 light:text-zinc-400" />
                                        <p className="text-xs text-zinc-400 font-medium light:text-zinc-800">{t.profile.noProjects}</p>
                                        <p className="text-[11px] text-zinc-500 light:text-zinc-500">{isRu ? "Пользователь пока не добавил ни одного проекта" : "This user hasn't added any projects yet"}</p>
                                    </div>
                                ) : projectsViewMode === 'carousel' ? (
                                    <div className="relative group/carousel">
                                        <div 
                                            ref={projectsCarouselRef}
                                            onScroll={checkProjectsScroll}
                                            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1"
                                        >
                                            {otherUserData.projects.map((p, idx) => {
                                                const links = [
                                                    p.githubUrl && { name: "GitHub", href: p.githubUrl.startsWith('http') ? p.githubUrl : `https://${p.githubUrl}` },
                                                    p.liveUrl && { name: "Demo / Live", href: p.liveUrl.startsWith('http') ? p.liveUrl : `https://${p.liveUrl}` }
                                                ].filter(Boolean) as { name: string; href: string }[];

                                                return (
                                                    <div 
                                                        key={p.id || `public-proj-carousel-${idx}`} 
                                                        className="w-full sm:w-[calc(50%-8px)] flex-shrink-0 snap-start flex flex-col"
                                                    >
                                                        <ProjectCard 
                                                            id={p.id}
                                                            name={p.name}
                                                            imageUrl={p.imageUrl}
                                                            images={p.images}
                                                            description={p.description}
                                                            links={links}
                                                            technologies={p.technologies}
                                                            status={p.status}
                                                            starsCount={p.starsCount}
                                                            postsCount={p.postsCount}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {otherUserData.projects.map((p, idx) => {
                                            const links = [
                                                p.githubUrl && { name: "GitHub", href: p.githubUrl.startsWith('http') ? p.githubUrl : `https://${p.githubUrl}` },
                                                p.liveUrl && { name: "Demo / Live", href: p.liveUrl.startsWith('http') ? p.liveUrl : `https://${p.liveUrl}` }
                                            ].filter(Boolean) as { name: string; href: string }[];

                                            return (
                                                <ProjectCard 
                                                    key={p.id || `public-proj-grid-${idx}`} 
                                                    id={p.id}
                                                    name={p.name}
                                                    imageUrl={p.imageUrl}
                                                    images={p.images}
                                                    description={p.description}
                                                    links={links}
                                                    technologies={p.technologies}
                                                    status={p.status}
                                                    starsCount={p.starsCount}
                                                    postsCount={p.postsCount}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {profileTab === 'experience' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider light:text-zinc-600">
                                        {t.profile.experience}
                                    </h4>
                                    <span className="text-[11px] text-zinc-500 font-mono light:text-zinc-500">
                                        {otherUserData.experiences?.length || 0}
                                    </span>
                                </div>

                                {!otherUserData.experiences || otherUserData.experiences.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                                        <Briefcase size={24} className="text-zinc-600 light:text-zinc-400" />
                                        <p className="text-xs text-zinc-400 font-medium light:text-zinc-800">{t.profile.noExperience}</p>
                                        <p className="text-[11px] text-zinc-500 light:text-zinc-500">{isRu ? "Пользователь пока не указал опыт работы" : "This user hasn't listed any work experience yet"}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {otherUserData.experiences.map((exp) => (
                                            <ExperienceCard 
                                                key={exp.id}
                                                icon={exp.companyName ? exp.companyName.charAt(0).toUpperCase() : "C"}
                                                name={exp.companyName}
                                                post={exp.position}
                                                mode={exp.mode}
                                                time={exp.period}
                                                description={exp.description}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
                </div>
            </div>

            {!isAccountLocked && (
                <div>
                    <Titlebar title={isRu ? "Активность" : "Activity"}></Titlebar>
                <div>
                                
                    <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                        {isPostsLoading ? (
                            <>
                                <PostSkeleton />
                                <PostSkeleton />
                            </>
                        ) : otherUserPostsData.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-8 select-none light:text-zinc-500">{isRu ? "Публикаций пока нет" : "No posts yet"}</p>
                        ) : (
                            otherUserPostsData.map((p) => (
                                <div key={p.id} className="animate-fade-in">
                                    <Post 
                                        Id={p.id} 
                                        Name={otherUserData.fullName} 
                                        UserName={"@" + otherUserData.userName} 
                                        Content={p.content} 
                                        Time={formatPostTime(p.created)} 
                                        Avatar={otherUserData.avatar} 
                                        Likes={p.likesCount} 
                                        isLikedByMe={p.isLikedByMe} 
                                        Comments={p.commentsCount} 
                                        Attachments={p.attachments} 
                                        commentsList={p.commentsList} 
                                        repostsCount={p.repostsCount} 
                                        repostOfPost={p.repostOfPost}
                                        community={p.community}
                                        project={p.project}
                                        isPinned={p.isPinned}
                                        canPin={userData?.userName?.toLowerCase() === otherUserData?.userName?.toLowerCase()}
                                        onPinToggle={() => refreshOtherUserPostsData(usernameFromUrl)}
                                    />
                                </div>
                            ))
                        )}

                        {hasMoreOtherUserPosts && (
                            <div ref={otherPostsSentinelRef} className="py-4 flex justify-center items-center">
                                {isLoadingMoreOtherUserPosts && (
                                    <div className="flex flex-col gap-3 w-full">
                                        <PostSkeleton />
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasMoreOtherUserPosts && otherUserPostsData.length > 0 && (
                            <div className="py-6 text-center text-xs text-zinc-600 select-none light:text-zinc-400">
                                {isRu ? "Вы просмотрели все публикации" : "You've viewed all posts"}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    )
}
