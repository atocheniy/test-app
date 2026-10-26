'use client'

import FeedVacanciesBlock from "@/components/feedVacanciesBlock";
import Post from "@/components/post";
import PublicBlock from "@/components/public_block";
import { PostSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPostTime } from "@/libs/format";
import { VacancyService } from "@/services/vacancyService";
import type { Vacancy } from "@/types/auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Feed() {

    const { userData, postsData, refreshPostsData, hasMorePosts, isLoadingMorePosts, loadMorePosts } = useApplication();
    const { t, language } = useLanguage();
    const isRu = language === 'ru';
    const [feedTab, setFeedTab] = useState<'all' | 'watching'>('all');
    const [isLoading, setIsLoading] = useState(postsData.length === 0);
    const [recommendedVacancies, setRecommendedVacancies] = useState<Vacancy[]>([]);
    const [isVacanciesDismissed, setIsVacanciesDismissed] = useState(false);
    const [vacancySkip, setVacancySkip] = useState(0);
    const [isRefreshingVacancies, setIsRefreshingVacancies] = useState(false);

    const handleRefreshVacancies = async () => {
        setIsRefreshingVacancies(true);
        try {
            const nextSkip = vacancySkip + 6;
            const data = await VacancyService.getRecommended(6, nextSkip);
            if (data && data.length > 0) {
                setRecommendedVacancies(data);
                setVacancySkip(nextSkip);
            }
        } catch (err) {
            console.error("Error refreshing feed vacancies:", err);
        } finally {
            setIsRefreshingVacancies(false);
        }
    };

    useEffect(() => {
        document.title = isRu ? 'Лента' : 'Feed';
        const load = async () => {
            if (postsData.length === 0) setIsLoading(true);
            await refreshPostsData();
            setIsLoading(false);
        };
        load();

        VacancyService.getRecommended(6, 0)
            .then(data => {
                if (data && data.length > 0) {
                    setRecommendedVacancies(data);
                }
            })
            .catch(err => console.error("Error loading feed vacancies:", err));
    }, []);

    const handleTabChange = async (tab: 'all' | 'watching') => {
        if (tab === feedTab) return;
        setFeedTab(tab);
        setIsLoading(true);
        await refreshPostsData(tab === 'watching' ? 'watching' : undefined);
        setIsLoading(false);
    };

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasMorePosts || isLoadingMorePosts) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMorePosts();
            }
        }, {
            rootMargin: '300px',
        });

        const el = sentinelRef.current;
        if (el) observer.observe(el);

        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMorePosts, isLoadingMorePosts, loadMorePosts]);

    return (
        <div className="flex flex-col min-h-full">
           
            <Titlebar title={t.feed.title}>
                <div className="flex items-center gap-3 sm:gap-5 flex-wrap overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => handleTabChange('all')}
                        className={`text-sm font-semibold transition relative py-1 ${
                            feedTab === 'all' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {isRu ? 'Все' : 'All'}
                        {feedTab === 'all' && (
                            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('watching')}
                        className={`text-sm font-semibold transition relative py-1 ${
                            feedTab === 'watching' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {isRu ? 'Подписки' : 'Watching'}
                        {feedTab === 'watching' && (
                            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                </div>
            </Titlebar>

            <PublicBlock floating Avatar={userData.avatar} onPostCreated={() => refreshPostsData(feedTab === 'watching' ? 'watching' : undefined)} />
            
            <div className="flex flex-col max-sm:mb-[60px] gap-4 p-6 py-6 max-sm:p-0 max-sm:py-6 min-w-0 w-full overflow-x-hidden" >
                {isLoading ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : postsData.length === 0 ? (
                    feedTab === 'watching' ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                            <p className="text-zinc-400 font-medium">
                                {isRu ? 'Ваша лента отслеживания пуста' : 'Your watching feed is empty'}
                            </p>
                            <p className="text-xs text-zinc-500 max-w-sm">
                                {isRu 
                                    ? 'Вы пока никого не читаете. Нажмите «Читать» в профиле интересных разработчиков, чтобы видеть их публикации здесь.'
                                    : 'You are not following anyone yet. Click "Watch" on profiles of developers you like to see their posts here.'}
                            </p>
                            <Link 
                                href="/search" 
                                className="mt-2 px-4 py-2 text-xs font-semibold rounded-2xl bg-white/10 hover:bg-white/15 text-white transition"
                            >
                                {isRu ? 'Найти разработчиков' : 'Discover developers'}
                            </Link>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-zinc-500">
                            {t.feed.noPosts}
                        </div>
                    )
                ) : (
                 postsData.map((p, idx) => {
                        const shouldShowVacancies = !isVacanciesDismissed && recommendedVacancies.length > 0 && (
                            postsData.length >= 4
                                ? (idx >= 3 && (idx - 3) % 15 === 0)
                                : idx === postsData.length - 1
                        );

                        return (
                            <div key={p.id} className="animate-fade-in flex flex-col gap-4 min-w-0">
                                <Post 
                                    Id={p.id} 
                                    Avatar={p.authorAvatar} 
                                    Name={p.authorName} 
                                    UserName={"@" + p.authorUsername} 
                                    Content={p.content} 
                                    Time={formatPostTime(p.created)}  
                                    Likes={p.likesCount} 
                                    isLikedByMe={p.isLikedByMe} 
                                    Comments={p.commentsCount} 
                                    Attachments={p.attachments} 
                                    commentsList={p.commentsList} 
                                    repostsCount={p.repostsCount} 
                                    repostOfPost={p.repostOfPost}
                                    community={p.community}
                                    project={p.project}
                                    recommendationReason={p.recommendationReason}
                                    canPin={false}
                                />

                                {shouldShowVacancies && (
                                    <FeedVacanciesBlock 
                                        vacancies={recommendedVacancies} 
                                        onDismiss={() => setIsVacanciesDismissed(true)}
                                        onRefresh={handleRefreshVacancies}
                                        isRefreshing={isRefreshingVacancies}
                                    />
                                )}
                            </div>
                        );
                    })
                )}

                {hasMorePosts && (
                    <div ref={sentinelRef} className="py-4 flex justify-center items-center">
                        {isLoadingMorePosts && (
                            <div className="flex flex-col gap-3 w-full">
                                <PostSkeleton />
                            </div>
                        )}
                    </div>
                )}

                {!hasMorePosts && postsData.length > 0 && (
                    <div className="py-8 text-center text-xs text-zinc-600 select-none">
                        {isRu ? 'Вы просмотрели все публикации' : 'You have viewed all posts'}
                    </div>
                )}
            </div>
        </div>
    )
}