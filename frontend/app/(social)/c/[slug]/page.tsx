'use client';

import Post from "@/components/post";
import PublicBlock from "@/components/public_block";
import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { CommunityService } from "@/services/communityService";
import { PostService } from "@/services/postService";
import { formatPostTime, formatSalary } from "@/libs/format";
import { VacancyService } from "@/services/vacancyService";
import { type Post as PostType, type Vacancy, isCompanyEntity } from "@/types/auth";
import { upload } from "@vercel/blob/client";
import {
    AlertCircle,
    Briefcase,
    Building2,
    Check,
    CheckCircle2,
    ExternalLink,
    FileText,
    Globe,
    Lock,
    MapPin,
    Plus,
    ShieldAlert,
    Trash2,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Profile() {
    const { userData, connection, onlineUsers } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [mounted, setMounted] = useState(false);
    const [community, setCommunity] = useState<any>(null);
    const [communityPosts, setCommunityPosts] = useState<PostType[]>([]);
    const [communityPostsCursor, setCommunityPostsCursor] = useState<string | null>(null);
    const [hasMoreCommunityPosts, setHasMoreCommunityPosts] = useState<boolean>(true);
    const [isLoadingMorePosts, setIsLoadingMorePosts] = useState<boolean>(false);
    const communityPostsSentinelRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPostsLoading, setIsPostsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'posts' | 'vacancies' | 'about' | 'employees'>('posts');

    // Edit modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsUploading] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editRules, setEditRules] = useState('');
    const [editPostingPolicy, setEditPostingPolicy] = useState<number>(0);
    const [editType, setEditType] = useState<number>(0);
    const [editKind, setEditKind] = useState<number>(0);
    const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editIndustry, setEditIndustry] = useState('');
    const [editCompanySize, setEditCompanySize] = useState('');

    // Vacancies state
    const [companyVacancies, setCompanyVacancies] = useState<Vacancy[]>([]);
    const [isVacanciesLoading, setIsVacanciesLoading] = useState(false);
    const [isCreateVacancyOpen, setIsCreateVacancyOpen] = useState(false);
    const [vacancyTitle, setVacancyTitle] = useState('');
    const [vacancyDescription, setVacancyDescription] = useState('');
    const [vacancySalaryFrom, setVacancySalaryFrom] = useState('');
    const [vacancySalaryTo, setVacancySalaryTo] = useState('');
    const [vacancyCurrency, setVacancyCurrency] = useState('USD');
    const [vacancyFormat, setVacancyFormat] = useState<number>(0); // 0 Remote, 1 Hybrid, 2 Office
    const [vacancyLevel, setVacancyLevel] = useState<number>(2); // 0 Intern, 1 Junior, 2 Middle, 3 Senior, 4 Lead
    const [vacancyStack, setVacancyStack] = useState('');
    const [isSubmittingVacancy, setIsSubmittingVacancy] = useState(false);

    // Pending employee requests
    const [pendingEmployees, setPendingEmployees] = useState<any[]>([]);
    const [isApplyingVacancyId, setIsApplyingVacancyId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadVacancies = async () => {
        setIsVacanciesLoading(true);
        try {
            const data = await VacancyService.getVacancies({ companySlug: slug });
            setCompanyVacancies(data.items || []);
        } catch (e) {
            console.error("Ошибка загрузки вакансий:", e);
        } finally {
            setIsVacanciesLoading(false);
        }
    };

    const loadPendingEmployees = async () => {
        try {
            const pending = await CommunityService.getPendingEmployees(slug);
            setPendingEmployees(pending || []);
        } catch (e) {
            console.error("Ошибка загрузки заявок сотрудников:", e);
        }
    };

    useEffect(() => {
        if (!slug) return;
        document.title = isRu ? 'Сообщество' : 'Community';

        const load = async () => {
            setIsLoading(true);
            try {
                const [commData, postsData] = await Promise.all([
                    CommunityService.getCommunity(slug),
                    PostService.getCommunityPosts(slug, null, 15)
                ]);
                setCommunity(commData);
                setCommunityPosts(postsData.items || []);
                setCommunityPostsCursor(postsData.nextCursor || null);
                setHasMoreCommunityPosts(postsData.hasMore || false);
                setIsPostsLoading(false);
                document.title = commData?.name || (isRu ? 'Сообщество' : 'Community');

                if (isCompanyEntity(commData?.kind)) {
                    loadVacancies();
                    if (commData?.myRole === 'Owner' || commData?.myRole === 'Admin' || commData?.myRole === 3 || commData?.myRole === 2) {
                        loadPendingEmployees();
                    }
                }
            } catch (e) {
                console.error("Ошибка загрузки паблика:", e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [slug]);

    const loadMoreCommunityPosts = async () => {
        if (!hasMoreCommunityPosts || isLoadingMorePosts || !communityPostsCursor) return;
        try {
            setIsLoadingMorePosts(true);
            const data = await PostService.getCommunityPosts(slug, communityPostsCursor, 15);
            if (data.items && data.items.length > 0) {
                setCommunityPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newUnique = data.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newUnique];
                });
                setCommunityPostsCursor(data.nextCursor || null);
                setHasMoreCommunityPosts(data.hasMore || false);
            } else {
                setHasMoreCommunityPosts(false);
                setCommunityPostsCursor(null);
            }
        } catch (e) {
            console.error("Ошибка дозагрузки постов сообщества:", e);
        } finally {
            setIsLoadingMorePosts(false);
        }
    };

    useEffect(() => {
        if (!hasMoreCommunityPosts || isLoadingMorePosts || activeTab !== 'posts') return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreCommunityPosts();
            }
        }, {
            rootMargin: '300px',
        });

        const el = communityPostsSentinelRef.current;
        if (el) observer.observe(el);

        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMoreCommunityPosts, isLoadingMorePosts, communityPostsCursor, activeTab, slug]);

    useEffect(() => {
        if (!connection || !slug) return;

        const handleCommunityPostCreated = (newPost: any) => {
            if (newPost.community?.slug?.toLowerCase() === slug.toLowerCase()) {
                setCommunityPosts((prev) => {
                    if (prev.some((p) => p.id === newPost.id)) return prev;
                    return [newPost, ...prev];
                });
            }
        };

        const handleCommunityPostDeleted = (data: { id: string }) => {
            setCommunityPosts((prev) => prev.filter((p) => p.id !== data.id));
        };

        connection.on("postCreated", handleCommunityPostCreated);
        connection.on("postDeleted", handleCommunityPostDeleted);

        return () => {
            connection.off("postCreated", handleCommunityPostCreated);
            connection.off("postDeleted", handleCommunityPostDeleted);
        };
    }, [connection, slug]);

    const refreshCommunityPosts = async () => {
        try {
            const data = await PostService.getCommunityPosts(slug, null, 15);
            setCommunityPosts(data.items || []);
            setCommunityPostsCursor(data.nextCursor || null);
            setHasMoreCommunityPosts(data.hasMore || false);
            setCommunity((prev: any) => prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : prev);
        } catch (e) {
            console.error("Ошибка обновления постов сообщества:", e);
        }
    };

    const handleToggleJoin = async () => {
        try {
            const res = await CommunityService.toggleJoin(slug);
            setCommunity((prev: any) => ({
                ...prev,
                isMember: res.isMember,
                membersCount: res.membersCount,
                myRole: res.isMember ? (prev?.myRole ?? 0) : null
            }));
        } catch (error: any) {
            console.error("Ошибка вступления:", error);
            const msg = error?.response?.data?.message || (isRu ? "Не удалось изменить статус участия" : "Failed to update membership status");
            alert(msg);
        }
    };

    const handleToggleWatch = async () => {
        if (!isLoggedIn) {
            alert(isRu ? "Пожалуйста, войдите в систему, чтобы отслеживать сообщество" : "Please sign in to watch this community");
            return;
        }
        try {
            const res = await CommunityService.toggleWatch(slug);
            setCommunity((prev: any) => ({
                ...prev,
                isWatching: res.isWatching,
                watchersCount: res.watchersCount
            }));
        } catch (error: any) {
            console.error("Ошибка изменения статуса отслеживания:", error);
            const msg = error?.response?.data?.message || (isRu ? "Не удалось изменить статус отслеживания" : "Failed to update watch status");
            alert(msg);
        }
    };

    const handleRequestEmployee = async () => {
        if (!isLoggedIn) {
            alert(isRu ? "Войдите в аккаунт" : "Please sign in");
            return;
        }
        try {
            const res = await CommunityService.requestEmployee(slug);
            alert(res.message);
            setCommunity((prev: any) => ({ ...prev, myMemberStatus: 1 }));
        } catch (error: any) {
            const msg = error?.response?.data?.message || (isRu ? "Не удалось отправить заявку" : "Failed to submit request");
            alert(msg);
        }
    };

    const handleAcceptEmployee = async (userId: string) => {
        try {
            await CommunityService.acceptEmployee(slug, userId);
            setPendingEmployees(prev => prev.filter(p => p.id !== userId));
            const updated = await CommunityService.getCommunity(slug);
            setCommunity(updated);
        } catch (error: any) {
            alert(error?.response?.data?.message || (isRu ? "Ошибка подтверждения" : "Failed to approve"));
        }
    };

    const handleRejectEmployee = async (userId: string) => {
        try {
            await CommunityService.rejectEmployee(slug, userId);
            setPendingEmployees(prev => prev.filter(p => p.id !== userId));
        } catch (error: any) {
            alert(error?.response?.data?.message || (isRu ? "Ошибка отклонения" : "Failed to reject"));
        }
    };

    const handleCreateVacancy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vacancyTitle.trim()) return;

        setIsSubmittingVacancy(true);
        try {
            const stackArray = vacancyStack
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            await VacancyService.createVacancy(slug, {
                title: vacancyTitle.trim(),
                description: vacancyDescription.trim(),
                salaryFrom: vacancySalaryFrom ? parseInt(vacancySalaryFrom) : null,
                salaryTo: vacancySalaryTo ? parseInt(vacancySalaryTo) : null,
                currency: vacancyCurrency,
                format: vacancyFormat,
                level: vacancyLevel,
                stack: stackArray,
            });

            setIsCreateVacancyOpen(false);
            setVacancyTitle('');
            setVacancyDescription('');
            setVacancySalaryFrom('');
            setVacancySalaryTo('');
            setVacancyStack('');
            await loadVacancies();
        } catch (error) {
            console.error("Ошибка создания вакансии:", error);
            alert(isRu ? "Не удалось создать вакансию" : "Failed to create vacancy");
        } finally {
            setIsSubmittingVacancy(false);
        }
    };

    const handleDeleteVacancy = async (vacancyId: string) => {
        if (!confirm(isRu ? "Вы уверены, что хотите удалить эту вакансию?" : "Are you sure you want to delete this vacancy?")) return;
        try {
            await VacancyService.deleteVacancy(vacancyId);
            setCompanyVacancies(prev => prev.filter(v => v.id !== vacancyId));
        } catch (error) {
            console.error("Ошибка удаления вакансии:", error);
            alert(isRu ? "Не удалось удалить вакансию" : "Failed to delete vacancy");
        }
    };

    const handleApplyVacancy = async (vacancyId: string) => {
        if (!isLoggedIn) {
            alert(isRu ? "Войдите в аккаунт, чтобы откликнуться на вакансию" : "Please sign in to apply for this vacancy");
            return;
        }

        try {
            setIsApplyingVacancyId(vacancyId);
            const res = await VacancyService.apply(vacancyId);
            alert(res.message || (isRu ? "Отклик отправлен! Переходим в диалог с рекрутером." : "Application sent! Redirecting to recruiter chat."));
            router.push('/messages');
        } catch (error: any) {
            console.error("Ошибка отклика:", error);
            const msg = error?.response?.data?.message || (isRu ? "Не удалось отправить отклик" : "Failed to submit application");
            alert(msg);
        } finally {
            setIsApplyingVacancyId(null);
        }
    };

    const handleSaveCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            const res = await CommunityService.updateCommunity(slug, {
                name: editName,
                description: editDescription,
                rules: editRules,
                postingPolicy: editPostingPolicy,
                type: editType,
                kind: editKind,
                websiteUrl: editWebsiteUrl.trim(),
                location: editLocation.trim(),
                industry: editIndustry.trim(),
                companySize: editCompanySize.trim()
            });

            setCommunity((prev: any) => ({
                ...prev,
                name: res.name ?? editName,
                description: res.description ?? editDescription,
                rules: res.rules ?? editRules,
                postingPolicy: res.postingPolicy ?? editPostingPolicy,
                type: res.type ?? editType,
                kind: res.kind ?? editKind,
                websiteUrl: res.websiteUrl ?? editWebsiteUrl,
                location: res.location ?? editLocation,
                industry: res.industry ?? editIndustry,
                companySize: res.companySize ?? editCompanySize
            }));

            const isComp = editKind === 1 || isCompanyEntity(res?.kind);
            if (isComp) {
                loadVacancies();
                if (community?.myRole === 'Owner' || community?.myRole === 'Admin' || community?.myRole === 3 || community?.myRole === 2) {
                    loadPendingEmployees();
                }
            }

            setIsEditOpen(false);
        } catch (error) {
            console.error("Ошибка обновления сообщества:", error);
            alert(isRu ? "Не удалось сохранить изменения" : "Failed to save changes");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !community) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/avatar/upload',
            });
            await CommunityService.updateCommunity(slug, { avatar: newBlob.url });
            setCommunity((prev: any) => ({ ...prev, avatar: newBlob.url }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !community) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/banner/upload',
            });
            await CommunityService.updateCommunity(slug, { banner: newBlob.url });
            setCommunity((prev: any) => ({ ...prev, banner: newBlob.url }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!community) {
        return (
            <div className="p-12 text-center text-zinc-500">
                {isRu ? "Сообщество не найдено" : "Community not found"}
            </div>
        );
    }

    const isCompany = isCompanyEntity(community?.kind);
    const isOwner = community?.myRole === 'Owner' || community?.myRole === 3;
    const isCanEdit = community?.myRole === 'Owner' || community?.myRole === 'Admin' || community?.myRole === 3 || community?.myRole === 2;
    const isOwnerOrAdminOrMod = isCanEdit || community?.myRole === 'Moderator' || community?.myRole === 1;
    const isAdminsOnlyPolicy = community?.postingPolicy === 1 || community?.postingPolicy === 'AdminsAndModerators';
    const isMember = Boolean(community?.isMember);
    const isLoggedIn = Boolean(userData?.userName && userData.userName !== '...');
    const canPost = isLoggedIn && (isAdminsOnlyPolicy ? isOwnerOrAdminOrMod : isMember);

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
        <div className="animate-fade-in">
            <div>
                <Titlebar title={isCompany ? (isRu ? "Компания" : "Company") : (isRu ? "Сообщество" : "Community")} />

                <div className="w-full bg-zinc-900 h-48 border-y border-white/5 rounded-b-xl relative overflow-hidden">
                    {community.banner && (
                        <img src={community.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 pb-6 max-sm:px-5 relative">
                    {community.banner && (
                        <div
                            className="absolute -top-110 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-11110 select-none"
                            style={{
                                backgroundImage: `url(${community.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    {community.banner && (
                        <div 
                            className="absolute -top-30 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-0 select-none"
                            style={{
                                backgroundImage: `url(${community.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    <div className="flex flex-row items-end gap-6 relative z-10">
                        <div className="relative w-40 h-40 max-sm:w-30 max-sm:h-30 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] relative z-10 shadow-lg">
                            <div className="block w-full h-full rounded-full overflow-hidden cursor-pointer bg-zinc-800">
                                {community.avatar ? (
                                    <img src={community.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-zinc-400">
                                        {community.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-2 max-sm:mt-5 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-zinc-100 truncate">{community.name}</h2>
                                {community.isVerified && (
                                    <span title={isRu ? "Верифицировано" : "Verified"} className="flex items-center">
                                        <CheckCircle2 size={20} className="text-blue-400 shrink-0" />
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <p className="text-sm text-zinc-400 font-mono">c/{community.slug}</p>
                                <span className="text-sm text-zinc-600">•</span>
                                <p className="text-sm text-zinc-400">{community.watchersCount || 0} {t.profile.watchers}</p>
                                <span className="text-sm text-zinc-600">•</span>
                                <p className="text-sm text-zinc-400">
                                    {community.membersCount} {isCompany ? (isRu ? "Сотрудников" : "Employees") : (isRu ? "Участников" : "Members")}
                                </p>
                                <span className="text-sm text-zinc-600">•</span>
                                <p className="text-sm text-zinc-400">{community.postsCount || 0} {t.profile.postsTab}</p>

                                {isCompany ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Building2 size={11} />
                                        {isRu ? "Компания" : "Company"}
                                    </span>
                                ) : (community.type === 1 || community.type === 'Restricted') ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        <Lock size={10} />
                                        {isRu ? "Закрытое" : "Restricted"}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Globe size={10} />
                                        {isRu ? "Публичное" : "Public"}
                                    </span>
                                )}

                                {isAdminsOnlyPolicy && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        <ShieldAlert size={10} />
                                        {isRu ? "Только админы" : "Admins only"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="ml-auto mb-5 flex items-center gap-2 shrink-0">
                            {isCanEdit && (
                                <button
                                    className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition"
                                    onClick={() => {
                                        setEditName(community.name || '');
                                        setEditDescription(community.description || '');
                                        setEditRules(community.rules || '');
                                        setEditPostingPolicy(community.postingPolicy === 1 || community.postingPolicy === 'AdminsAndModerators' ? 1 : 0);
                                        setEditType(community.type === 1 || community.type === 'Restricted' ? 1 : 0);
                                        setEditKind(isCompanyEntity(community.kind) ? 1 : 0);
                                        setEditWebsiteUrl(community.websiteUrl || '');
                                        setEditLocation(community.location || '');
                                        setEditIndustry(community.industry || '');
                                        setEditCompanySize(community.companySize || '');
                                        setIsEditOpen(true);
                                    }}
                                >
                                    {t.post.edit}
                                </button>
                            )}

                            <button
                                onClick={handleToggleWatch}
                                className={`px-5 py-2 text-sm font-semibold rounded-3xl transition ${
                                    community?.isWatching
                                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                                        : "bg-white/10 text-zinc-200 border border-white/10 hover:bg-white/15 hover:text-white"
                                }`}
                            >
                                {community?.isWatching ? (isRu ? "Отслеживается" : "Watching") : t.profile.watchBtn}
                            </button>

                            {isCompany ? (
                                community.myMemberStatus === 0 ? (
                                    <span className="px-4 py-2 text-xs font-semibold rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        {isRu ? "В штате" : "Employee"}
                                    </span>
                                ) : community.myMemberStatus === 1 ? (
                                    <span className="px-4 py-2 text-xs font-semibold rounded-3xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                        {isRu ? "Заявка на рассмотрении" : "Request pending"}
                                    </span>
                                ) : !isOwner && (
                                    <button
                                        onClick={handleRequestEmployee}
                                        className="px-4 py-2 text-xs font-semibold rounded-3xl bg-white/10 hover:bg-white text-zinc-200 hover:text-black transition"
                                    >
                                        {isRu ? "Работаю здесь" : "I work here"}
                                    </button>
                                )
                            ) : (
                                !isOwner && (
                                    <button
                                        onClick={handleToggleJoin}
                                        className={`px-5 py-2 text-sm font-semibold rounded-3xl transition ${
                                            community?.isMember
                                                ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400"
                                                : "bg-white text-black hover:bg-zinc-200"
                                        }`}
                                    >
                                        {community?.isMember ? (isRu ? "Вы вступили" : "Joined") : (isRu ? "Вступить" : "Join")}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                            {community.description || ""}
                        </p>
                    </div>

                    {isCompany && (
                        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-5 pt-3 border-t border-white/5 text-xs text-zinc-400">
                            {community.websiteUrl && (
                                <a
                                    href={community.websiteUrl.startsWith('http') ? community.websiteUrl : `https://${community.websiteUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-blue-400 hover:underline"
                                >
                                    <Globe size={13} />
                                    <span>{community.websiteUrl.replace(/^https?:\/\//, '')}</span>
                                    <ExternalLink size={10} />
                                </a>
                            )}
                            {community.location && (
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                    <MapPin size={13} className="text-zinc-500" />
                                    {community.location}
                                </span>
                            )}
                            {community.industry && (
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                    <Briefcase size={13} className="text-zinc-500" />
                                    {community.industry}
                                </span>
                            )}
                            {community.companySize && (
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                    <Users size={13} className="text-zinc-500" />
                                    {community.companySize} {isRu ? "сотрудников" : "employees"}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-white/5 px-10 max-sm:px-5">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`pb-3 text-sm font-semibold transition relative cursor-pointer ${
                            activeTab === 'posts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {t.profile.postsTab}
                        {activeTab === 'posts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
                    </button>

                    {isCompany && (
                        <button
                            onClick={() => setActiveTab('vacancies')}
                            className={`pb-3 text-sm font-semibold transition relative flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'vacancies' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t.nav.vacancies}
                            {companyVacancies.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                                    {companyVacancies.length}
                                </span>
                            )}
                            {activeTab === 'vacancies' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('about')}
                        className={`pb-3 text-sm font-semibold transition relative cursor-pointer ${
                            activeTab === 'about' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {isCompany ? (isRu ? 'О компании' : 'About Company') : (isRu ? 'О сообществе' : 'About Community')}
                        {activeTab === 'about' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`pb-3 text-sm font-semibold transition relative flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'employees' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {isCompany ? (isRu ? 'Сотрудники' : 'Employees') : (isRu ? 'Участники' : 'Members')}
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-400 font-mono">
                            {community.membersCount}
                        </span>
                        {activeTab === 'employees' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
                    </button>
                </div>

                {/* Tab: POSTS */}
                {activeTab === 'posts' && (
                    <div>
                        {canPost ? (
                            <PublicBlock
                                Avatar={userData?.avatar}
                                CommunityId={community?.id}
                                onPostCreated={refreshCommunityPosts}
                                placeholder={isRu ? `Что нового в ${community.name}?` : `What's new in ${community.name}?`}
                            />
                        ) : !isLoggedIn ? (
                            <div className="m-4 lg:mx-8 md:mx-11 p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                        <Lock size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200">{isRu ? "Публикация записей" : "Posting"}</h4>
                                        <p className="text-xs text-zinc-400">{isRu ? "Войдите в аккаунт, чтобы писать в сообществе." : "Sign in to post in this community."}</p>
                                    </div>
                                </div>
                                <Link href="/login" className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition">
                                    {isRu ? "Войти" : "Sign In"}
                                </Link>
                            </div>
                        ) : !isMember ? (
                            <div className="m-4 lg:mx-8 md:mx-11 p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200">
                                            {isCompany ? (isRu ? "Публикации компании" : "Company Posts") : (isRu ? "Только для участников" : "Members Only")}
                                        </h4>
                                        <p className="text-xs text-zinc-400">
                                            {isCompany
                                                ? (isRu ? "Публиковать новости в профиле компании могут только сотрудники и руководство." : "Only employees and management can publish news on the company profile.")
                                                : (isRu ? "Вступите в сообщество, чтобы создавать публикации." : "Join the community to create posts.")}
                                        </p>
                                    </div>
                                </div>
                                {!isCompany && (
                                    <button
                                        onClick={handleToggleJoin}
                                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition shrink-0 cursor-pointer"
                                    >
                                        {isRu ? "Вступить в сообщество" : "Join Community"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="m-4 lg:mx-8 md:mx-11 p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-3 text-zinc-400 text-xs">
                                <ShieldAlert size={16} className="text-amber-400/80 shrink-0" />
                                <span>{isRu ? "Публикация записей в этом сообществе доступна только администраторам и модераторам." : "Posting in this community is restricted to administrators and moderators."}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                            {isPostsLoading ? (
                                <>
                                    <PostSkeleton />
                                    <PostSkeleton />
                                </>
                            ) : communityPosts.length === 0 ? (
                                <p className="text-xs text-zinc-500 text-center py-8 select-none">{isRu ? "Публикаций пока нет" : "No posts yet"}</p>
                            ) : (
                                communityPosts.map((p) => (
                                    <div key={p.id} className="animate-fade-in">
                                        <Post
                                            Id={p.id}
                                            Name={p.authorName}
                                            UserName={`@${p.authorUsername}`}
                                            Content={p.content || ""}
                                            Time={formatPostTime(p.created)}
                                            Avatar={p.authorAvatar}
                                            Likes={p.likesCount}
                                            isLikedByMe={p.isLikedByMe}
                                            Comments={p.commentsCount}
                                            Attachments={p.attachments}
                                            commentsList={p.commentsList}
                                            repostsCount={p.repostsCount}
                                            repostOfPost={p.repostOfPost}
                                            community={p.community}
                                        />
                                    </div>
                                ))
                            )}

                            {/* Progressive load sentinel & loading indicator */}
                            {hasMoreCommunityPosts && (
                                <div ref={communityPostsSentinelRef} className="py-4 flex justify-center items-center">
                                    {isLoadingMorePosts && (
                                        <div className="flex flex-col gap-3 w-full">
                                            <PostSkeleton />
                                        </div>
                                    )}
                                </div>
                            )}

                            {!hasMoreCommunityPosts && communityPosts.length > 0 && (
                                <div className="py-6 text-center text-xs text-zinc-600 select-none">
                                    {isRu ? "Вы просмотрели все публикации" : "You've viewed all posts"}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: VACANCIES (Company only) */}
                {activeTab === 'vacancies' && isCompany && (
                    <div className="p-6 md:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-zinc-100">{isRu ? "Открытые вакансии" : "Open Vacancies"}</h3>
                                <p className="text-xs text-zinc-400">{isRu ? `Карьерные возможности в ${community.name}` : `Career opportunities at ${community.name}`}</p>
                            </div>
                            {isCanEdit && (
                                <button
                                    onClick={() => setIsCreateVacancyOpen(true)}
                                    className="px-4 py-2 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus size={14} />
                                    {isRu ? "Опубликовать вакансию" : "Post a Vacancy"}
                                </button>
                            )}
                        </div>

                        {isVacanciesLoading ? (
                            <div className="p-8 text-center text-xs text-zinc-500">{isRu ? "Загрузка вакансий..." : "Loading vacancies..."}</div>
                        ) : companyVacancies.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col items-center gap-2">
                                <Briefcase size={24} className="text-zinc-600" />
                                <p className="text-sm font-medium text-zinc-300">{isRu ? "Сейчас нет открытых вакансий" : "No open vacancies right now"}</p>
                                <p className="text-xs text-zinc-500">{isRu ? "Следите за обновлениями компании или подпишитесь на уведомления" : "Follow the company updates or subscribe to notifications"}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {companyVacancies.map((v) => (
                                    <div
                                        key={v.id}
                                        className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {formatLevelText(v.level)}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                                                        {formatWorkTypeText(v.format)}
                                                    </span>
                                                    {(v.salaryFrom || v.salaryTo) && (
                                                        <span 
                                                            suppressHydrationWarning
                                                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                        >
                                                            {formatSalary(v.salaryFrom, v.salaryTo, v.currency)}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-bold text-zinc-100">{v.title}</h4>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isCanEdit && (
                                                    <button
                                                        onClick={() => handleDeleteVacancy(v.id)}
                                                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                                        title={isRu ? "Удалить вакансию" : "Delete vacancy"}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleApplyVacancy(v.id)}
                                                    disabled={isApplyingVacancyId === v.id}
                                                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isApplyingVacancyId === v.id ? (isRu ? "Отправка..." : "Sending...") : t.vacancies.apply}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                                            {v.description}
                                        </p>

                                        {v.stack && v.stack.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                                {v.stack.map((tech, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-white/5 text-zinc-400 border border-white/5"
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: ABOUT */}
                {activeTab === 'about' && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={13} className="text-zinc-400" />
                                {isCompany ? (isRu ? "Описание компании" : "Company Description") : (isRu ? "О сообществе" : "About Community")}
                            </h4>
                            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                                {community.description || (isRu ? "Описание отсутствует" : "No description provided")}
                            </p>
                        </div>

                        {community.rules && (
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldAlert size={13} className="text-amber-400" />
                                    {isCompany ? (isRu ? "Культура и регламент" : "Culture & Guidelines") : (isRu ? "Правила сообщества" : "Community Rules")}
                                </h4>
                                <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                                    {community.rules}
                                </p>
                            </div>
                        )}

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                {isRu ? "Информация" : "Information"}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-zinc-500">{isRu ? "Создатель: " : "Creator: "}</span>
                                    <Link href={`/profile/${community.creatorUsername}`} className="text-zinc-200 hover:underline font-medium">
                                        {community.creatorName || community.creatorUsername}
                                    </Link>
                                </div>
                                <div>
                                    <span className="text-zinc-500">{isRu ? "Дата основания: " : "Founded: "}</span>
                                    <span className="text-zinc-200">{new Date(community.created).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}</span>
                                </div>
                                {community.location && (
                                    <div>
                                        <span className="text-zinc-500">{isRu ? "Локация: " : "Location: "}</span>
                                        <span className="text-zinc-200">{community.location}</span>
                                    </div>
                                )}
                                {community.industry && (
                                    <div>
                                        <span className="text-zinc-500">{isRu ? "Сфера: " : "Industry: "}</span>
                                        <span className="text-zinc-200">{community.industry}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: EMPLOYEES / MEMBERS */}
                {activeTab === 'employees' && (
                    <div className="p-6 md:p-8 space-y-6">
                        {/* Pending approvals section for Owner/Admin */}
                        {isCanEdit && isCompany && pendingEmployees.length > 0 && (
                            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users size={14} />
                                        {isRu ? `Заявки на подтверждение работы (${pendingEmployees.length})` : `Employment Verification Requests (${pendingEmployees.length})`}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pendingEmployees.map((cand) => (
                                        <div
                                            key={cand.id}
                                            className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                                    {cand.avatar ? (
                                                        <img src={cand.avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-300">
                                                            {cand.name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-semibold text-zinc-100 truncate">{cand.name}</span>
                                                    <span className="text-[10px] text-zinc-500 truncate">@{cand.username}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleAcceptEmployee(cand.id)}
                                                    className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition text-xs font-semibold"
                                                    title={isRu ? "Принять в штат" : "Approve employee"}
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectEmployee(cand.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition text-xs font-semibold"
                                                    title={isRu ? "Отклонить" : "Reject"}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    {isCompany ? (isRu ? "Команда и руководство" : "Team & Leadership") : (isRu ? "Участники сообщества" : "Community Members")}
                                </h3>
                                <span className="text-xs text-zinc-500 font-mono">
                                    {community.membersCount} {isCompany ? (isRu ? "в штате" : "employees") : (isRu ? "участников" : "members")}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {community.membersList?.map((m: any) => {
                                    const isOnline = onlineUsers.some(
                                        (u) => u.toLowerCase() === m.username?.toLowerCase()
                                    );

                                    const isOwner = m.role === 3 || m.role === "Owner";
                                    const isAdmin = m.role === 2 || m.role === "Admin";
                                    const isMod = m.role === 1 || m.role === "Moderator";

                                    const isMe = Boolean(
                                        userData?.userName &&
                                        userData.userName !== '...' &&
                                        m.username?.replace("@", "").toLowerCase() === userData.userName.toLowerCase()
                                    );

                                    return (
                                        <Link
                                            key={m.id}
                                            href={isMe ? "/profile" : `/profile/${m.username?.replace("@", "")}`}
                                            className="flex items-center gap-2.5 p-2 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition group"
                                        >
                                            <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden bg-zinc-800">
                                                {m.avatar ? (
                                                    <img src={m.avatar} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300">
                                                        {m.name?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
                                                {isOnline && (
                                                    <span
                                                        className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full"
                                                        title={isRu ? "В сети" : "Online"}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex flex-col truncate">
                                                <span className="text-xs font-medium text-zinc-200 group-hover:text-sky-400 transition truncate">
                                                    {m.name || m.username}
                                                </span>

                                                {isOwner ? (
                                                    <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider">
                                                        {isCompany ? (isRu ? "Основатель" : "Founder") : (isRu ? "Владелец" : "Owner")}
                                                    </span>
                                                ) : isAdmin ? (
                                                    <span className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider">
                                                        {isCompany ? (isRu ? "Руководитель" : "Executive") : (isRu ? "Админ" : "Admin")}
                                                    </span>
                                                ) : isMod ? (
                                                    <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">
                                                        {isRu ? "Модератор" : "Moderator"}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-500 truncate">
                                                        {isCompany ? (isRu ? "Сотрудник" : "Employee") : `@${m.username}`}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Create Vacancy */}
            {isCreateVacancyOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">{isRu ? "Создать вакансию" : "Create Vacancy"}</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">{community.name}</p>
                            </div>
                            <button
                                onClick={() => setIsCreateVacancyOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVacancy} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    {isRu ? "Название должности" : "Job Title"}
                                </label>
                                <input
                                    type="text"
                                    value={vacancyTitle}
                                    onChange={(e) => setVacancyTitle(e.target.value)}
                                    placeholder="e.g. Senior Backend Engineer"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                        {isRu ? "Уровень" : "Level"}
                                    </label>
                                    <select
                                        value={vacancyLevel}
                                        onChange={(e) => setVacancyLevel(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                    >
                                        <option value={0}>Intern</option>
                                        <option value={1}>Junior</option>
                                        <option value={2}>Middle</option>
                                        <option value={3}>Senior</option>
                                        <option value={4}>Lead</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                        {isRu ? "Формат работы" : "Work Format"}
                                    </label>
                                    <select
                                        value={vacancyFormat}
                                        onChange={(e) => setVacancyFormat(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                    >
                                        <option value={0}>{isRu ? "Удаленно (Remote)" : "Remote"}</option>
                                        <option value={1}>{isRu ? "Гибрид (Hybrid)" : "Hybrid"}</option>
                                        <option value={2}>{isRu ? "Офис (Office)" : "Office"}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                        {isRu ? "Зарплата от" : "Salary from"}
                                    </label>
                                    <input
                                        type="number"
                                        value={vacancySalaryFrom}
                                        onChange={(e) => setVacancySalaryFrom(e.target.value)}
                                        placeholder="3000"
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                        {t.vacancies.salaryTo}
                                    </label>
                                    <input
                                        type="number"
                                        value={vacancySalaryTo}
                                        onChange={(e) => setVacancySalaryTo(e.target.value)}
                                        placeholder="5000"
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                        {isRu ? "Валюта" : "Currency"}
                                    </label>
                                    <select
                                        value={vacancyCurrency}
                                        onChange={(e) => setVacancyCurrency(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="RUB">RUB (₽)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    {isRu ? "Стек технологий (через запятую)" : "Tech Stack (comma-separated)"}
                                </label>
                                <input
                                    type="text"
                                    value={vacancyStack}
                                    onChange={(e) => setVacancyStack(e.target.value)}
                                    placeholder=".NET, C#, PostgreSQL, Docker"
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    {isRu ? "Описание вакансии и требования" : "Job Description & Requirements"}
                                </label>
                                <textarea
                                    value={vacancyDescription}
                                    onChange={(e) => setVacancyDescription(e.target.value)}
                                    placeholder={isRu ? "Обязанности, стек, условия работы, стек технологий..." : "Responsibilities, stack, working conditions, requirements..."}
                                    rows={5}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingVacancy}
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmittingVacancy ? (isRu ? "Публикация..." : "Publishing...") : (isRu ? "Опубликовать вакансию" : "Publish Vacancy")}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal: Edit Community / Company */}
            {isEditOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">
                                    {editKind === 1 ? (isRu ? "Редактировать компанию" : "Edit Company") : (isRu ? "Редактировать сообщество" : "Edit Community")}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">{isRu ? "Управление информацией и профилем" : "Manage information and profile"}</p>
                            </div>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300 text-xs transition cursor-pointer"
                            >
                                {t.common.cancel}
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6 pb-6 border-b border-white/5">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Аватар" : "Avatar"}</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6 pb-6 border-b border-white/5">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Баннер" : "Banner"}</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSaveCommunity} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Тип пространства" : "Space Type"}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditKind(0)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editKind === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Users size={14} />
                                            {isRu ? "Сообщество" : "Community"}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Публикации, обсуждения" : "Posts, discussions"}</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditKind(1)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editKind === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Building2 size={14} />
                                            {isRu ? "Компания" : "Company"}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Вакансии и сотрудники" : "Vacancies & employees"}</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                    {editKind === 1 ? (isRu ? "Название компании" : "Company Name") : (isRu ? "Название сообщества" : "Community Name")}
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Описание" : "Description"}</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10 resize-none"
                                />
                            </div>

                            {editKind === 1 && (
                                <div className="space-y-3 pt-1 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Сайт" : "Website"}</label>
                                            <input
                                                type="url"
                                                value={editWebsiteUrl}
                                                onChange={(e) => setEditWebsiteUrl(e.target.value)}
                                                placeholder="https://company.com"
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Локация" : "Location"}</label>
                                            <input
                                                type="text"
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                placeholder={isRu ? "Москва / Remote" : "Moscow / Remote"}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Сфера" : "Industry"}</label>
                                            <input
                                                type="text"
                                                value={editIndustry}
                                                onChange={(e) => setEditIndustry(e.target.value)}
                                                placeholder={isRu ? "IT, Финтех" : "IT, Fintech"}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Размер" : "Size"}</label>
                                            <select
                                                value={editCompanySize}
                                                onChange={(e) => setEditCompanySize(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                            >
                                                <option value="">{isRu ? "Не указано" : "Not specified"}</option>
                                                <option value="1-10">{isRu ? "1-10 сотрудников" : "1-10 employees"}</option>
                                                <option value="11-50">{isRu ? "11-50 сотрудников" : "11-50 employees"}</option>
                                                <option value="51-200">{isRu ? "51-200 сотрудников" : "51-200 employees"}</option>
                                                <option value="201-1000">{isRu ? "201-1000 сотрудников" : "201-1000 employees"}</option>
                                                <option value="1000+">{isRu ? "1000+ сотрудников" : "1000+ employees"}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                    {editKind === 1 ? (isRu ? "Культура и правила" : "Culture & Rules") : (isRu ? "Правила" : "Rules")}
                                </label>
                                <textarea
                                    value={editRules}
                                    onChange={(e) => setEditRules(e.target.value)}
                                    rows={3}
                                    placeholder={isRu ? "Правила сообщества, формат общения, требования..." : "Community rules, communication format, guidelines..."}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Кто может публиковать записи" : "Who can post"}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditPostingPolicy(0)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editPostingPolicy === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">{isRu ? "Все участники" : "All Members"}</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Любой член сообщества" : "Any community member"}</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditPostingPolicy(1)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editPostingPolicy === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">{isRu ? "Только администрация" : "Admins Only"}</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Админы и модераторы" : "Admins and moderators"}</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{isRu ? "Тип сообщества" : "Community Type"}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditType(0)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editType === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">{isRu ? "Публичное" : "Public"}</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Вход свободный" : "Open to join"}</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditType(1)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            editType === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">{isRu ? "Ограниченное" : "Restricted"}</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">{isRu ? "Вход по заявкам" : "Join by request"}</div>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? (isRu ? "Сохранение..." : "Saving...") : (isRu ? "Сохранить изменения" : "Save Changes")}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
