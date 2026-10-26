'use client';

import Modal from "@/components/Modal";
import Post from "@/components/post";
import { PROJECT_STATUS_MAP } from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProjectService } from "@/services/projectService";
import type { Post as PostType, ProjectDetails, ProjectStatus } from "@/types/auth";
import { upload } from "@vercel/blob/client";
import {
    ArrowLeft,
    BookOpen,
    Camera,
    ChevronLeft,
    ChevronRight,
    Code2,
    ExternalLink,
    FolderKanban,
    Globe,
    Layers,
    Loader2,
    Maximize2,
    Pencil,
    Plus,
    Star,
    Trash2,
    X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { userData, connection } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    const [mounted, setMounted] = useState(false);
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);

    const [posts, setPosts] = useState<PostType[]>([]);
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const [isStarred, setIsStarred] = useState(false);
    const [starsCount, setStarsCount] = useState(0);
    const [isStarring, setIsStarring] = useState(false);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStatus, setEditStatus] = useState<ProjectStatus>(0);
    const [editBannerUrl, setEditBannerUrl] = useState('');
    const [editImages, setEditImages] = useState<string[]>([]);
    const [editGithubUrl, setEditGithubUrl] = useState('');
    const [editLiveUrl, setEditLiveUrl] = useState('');
    const [editTechs, setEditTechs] = useState<string[]>([]);
    const [newTechInput, setNewTechInput] = useState('');
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const imagesInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadProject = async () => {
        if (!id) return;
        setIsLoadingProject(true);
        try {
            const data = await ProjectService.getProject(id);
            setProject(data);
            setIsStarred(data.isStarredByMe);
            setStarsCount(data.starsCount ?? 0);
            document.title = `${data.name} — ${isRu ? 'Проект' : 'Project'}`;
        } catch (err) {
            console.error("Ошибка загрузки проекта:", err);
        } finally {
            setIsLoadingProject(false);
        }
    };

    const loadPosts = async () => {
        if (!id) return;
        setIsPostsLoading(true);
        try {
            const res = await ProjectService.getProjectPosts(id, null, 15);
            setPosts(res.items || []);
            setCursor(res.nextCursor);
            setHasMore(res.hasMore);
        } catch (err) {
            console.error("Ошибка загрузки девлогов:", err);
        } finally {
            setIsPostsLoading(false);
        }
    };

    const loadMorePosts = async () => {
        if (!id || !cursor || !hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const res = await ProjectService.getProjectPosts(id, cursor, 15);
            setPosts(prev => [...prev, ...(res.items || [])]);
            setCursor(res.nextCursor);
            setHasMore(res.hasMore);
        } catch (err) {
            console.error("Ошибка подгрузки девлогов:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        loadProject();
        loadPosts();
    }, [id]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore || isLoadingMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                loadMorePosts();
            }
        }, { threshold: 0.1 });

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, cursor]);

    useEffect(() => {
        if (!connection || !id) return;

        const handlePostCreated = (newPost: any) => {
            if (newPost?.project?.id === id) {
                setPosts(prev => [newPost, ...prev]);
                setProject(prev => prev ? { ...prev, postsCount: (prev.postsCount ?? 0) + 1 } : prev);
            }
        };

        const handlePostDeleted = ({ id: deletedId }: { id: string }) => {
            setPosts(prev => prev.filter(p => p.id !== deletedId));
            setProject(prev => prev ? { ...prev, postsCount: Math.max(0, (prev.postsCount ?? 1) - 1) } : prev);
        };

        const handlePostPinChanged = () => {
            loadPosts();
        };

        connection.on("postCreated", handlePostCreated);
        connection.on("postDeleted", handlePostDeleted);
        connection.on("postPinChanged", handlePostPinChanged);

        return () => {
            connection.off("postCreated", handlePostCreated);
            connection.off("postDeleted", handlePostDeleted);
            connection.off("postPinChanged", handlePostPinChanged);
        };
    }, [connection, id]);

    const handleToggleStar = async () => {
        if (!id || isStarring) return;
        setIsStarring(true);
        const prevStarred = isStarred;
        const prevCount = starsCount;

        setIsStarred(!prevStarred);
        setStarsCount(prev => prevStarred ? Math.max(0, prev - 1) : prev + 1);

        try {
            const res = await ProjectService.toggleStar(id);
            setIsStarred(res.isStarred);
            setStarsCount(res.starsCount);
        } catch (err) {
            console.error("Star error:", err);
            setIsStarred(prevStarred);
            setStarsCount(prevCount);
        } finally {
            setIsStarring(false);
        }
    };

    const handleOpenEdit = () => {
        if (!project) return;
        setEditName(project.name);
        setEditDesc(project.description || '');
        setEditStatus(project.status ?? 0);
        setEditBannerUrl(project.bannerUrl || '');
        const imgs = project.images && project.images.length > 0 ? project.images : (project.imageUrl ? [project.imageUrl] : []);
        setEditImages(imgs);
        setEditGithubUrl(project.githubUrl || '');
        setEditLiveUrl(project.liveUrl || '');
        setEditTechs(project.technologies || []);
        setNewTechInput('');
        setIsEditOpen(true);
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingBanner(true);
        try {
            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/img/upload',
            });
            setEditBannerUrl(blob.url);
        } catch (err) {
            console.error("Ошибка загрузки баннера:", err);
            alert(isRu ? "Не удалось загрузить баннер" : "Failed to upload banner");
        } finally {
            setIsUploadingBanner(false);
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        setIsUploadingImages(true);
        try {
            const uploadPromises = files.map(file =>
                upload(file.name, file, {
                    access: 'public',
                    handleUploadUrl: '/api/img/upload',
                })
            );
            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(r => r.url);
            setEditImages(prev => [...prev, ...newUrls]);
        } catch (err) {
            console.error("Ошибка загрузки изображений:", err);
            alert(isRu ? "Не удалось загрузить изображения" : "Failed to upload images");
        } finally {
            setIsUploadingImages(false);
            if (imagesInputRef.current) imagesInputRef.current.value = '';
        }
    };

    const handleAddTech = () => {
        const val = newTechInput.trim();
        if (val && !editTechs.includes(val)) {
            setEditTechs(prev => [...prev, val]);
            setNewTechInput('');
        }
    };

    const handleRemoveTech = (tech: string) => {
        setEditTechs(prev => prev.filter(t => t !== tech));
    };

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) {
            alert(isRu ? "Введите название проекта" : "Please enter a project name");
            return;
        }

        setIsSaving(true);
        try {
            const updated = await ProjectService.updateProject(id, {
                name: editName.trim(),
                description: editDesc.trim() || undefined,
                bannerUrl: editBannerUrl.trim() || undefined,
                imageUrl: editImages[0] || undefined,
                images: editImages,
                githubUrl: editGithubUrl.trim() || undefined,
                liveUrl: editLiveUrl.trim() || undefined,
                technologies: editTechs,
                status: editStatus,
            });

            setProject(prev => prev ? {
                ...prev,
                name: updated.name,
                description: updated.description,
                bannerUrl: updated.bannerUrl,
                imageUrl: updated.imageUrl,
                images: updated.images,
                githubUrl: updated.githubUrl,
                liveUrl: updated.liveUrl,
                technologies: updated.technologies,
                status: updated.status,
            } : prev);

            setIsEditOpen(false);
        } catch (err) {
            console.error("Ошибка сохранения проекта:", err);
            alert(isRu ? "Не удалось сохранить проект" : "Failed to save project");
        } finally {
            setIsSaving(false);
        }
    };

    const allImages = project?.images && project.images.length > 0
        ? project.images
        : (project?.imageUrl ? [project.imageUrl] : []);

    const statusNumber = typeof project?.status === 'number' && PROJECT_STATUS_MAP[project.status]
        ? project.status
        : 0;
    const statusInfo = PROJECT_STATUS_MAP[statusNumber];

    const getStatusLabel = (statusVal: number) => {
        switch (statusVal) {
            case 0: return isRu ? "В разработке" : "In Progress";
            case 1: return isRu ? "Бета" : "Beta";
            case 2: return isRu ? "Релиз" : "Released";
            case 3: return isRu ? "Архив" : "Archived";
            default: return statusInfo?.label || (isRu ? "В разработке" : "In Progress");
        }
    };

    const isOwner = Boolean(project?.isMyProject);

    if (isLoadingProject) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="flex flex-col min-h-full pb-16 animate-fade-in">
            <Titlebar title={project?.name || (isRu ? "Проект" : "Project")}>
                <button
                    onClick={() => router.back()}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                    title={t.common.back}
                >
                    <ArrowLeft size={18} />
                </button>
            </Titlebar>

            {!project ? (
                <div className="p-12 text-center flex flex-col items-center justify-center animate-fade-in">
                    <FolderKanban className="w-12 h-12 text-zinc-600 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-200">{isRu ? "Проект не найден" : "Project not found"}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{isRu ? "Возможно, он был удалён или ссылка некорректна." : "It may have been deleted or the link is invalid."}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition"
                    >
                        {isRu ? "Вернуться назад" : "Go back"}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 px-4 sm:px-6 animate-fade-in">
                    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/40">
                        <div className="relative w-full h-44 sm:h-56 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black overflow-hidden select-none">
                            {project.bannerUrl ? (
                                <img
                                    src={project.bannerUrl}
                                    alt={`${project.name} cover`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center relative opacity-20">
                                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                                    <Code2 className="w-24 h-24 text-zinc-400" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        </div>

                        <div className="relative px-4 sm:px-6 pb-3 pt-3">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 min-w-0">
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-[#0a0a0a] bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center shrink-0 -mt-10 sm:-mt-14 relative z-10">
                                        {allImages.length > 0 ? (
                                            <img
                                                src={allImages[0]}
                                                alt={project.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                                                <Code2 size={36} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 pb-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
                                                {project.name}
                                            </h2>
                                            {statusInfo && (
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass} shrink-0`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                                                    {getStatusLabel(statusNumber)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                                            <span>{isRu ? "Создатель:" : "Creator:"}</span>
                                            <Link
                                                href={isOwner ? '/profile' : `/profile/${project.authorUsername}`}
                                                className="inline-flex items-center gap-1.5 text-zinc-200 hover:text-white font-medium hover:underline transition-colors"
                                            >
                                                {project.authorAvatar ? (
                                                    <img
                                                        src={project.authorAvatar}
                                                        alt={project.authorName || "Author"}
                                                        className="w-4 h-4 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-zinc-700" />
                                                )}
                                                <span>{project.authorName || project.authorUsername}</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap md:ml-auto pb-1">
                                    <button
                                        type="button"
                                        onClick={handleToggleStar}
                                        disabled={isStarring}
                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-3.5 rounded-xl border transition-all cursor-pointer ${
                                            isStarred
                                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 shadow-sm'
                                                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Star
                                            size={14}
                                            className={isStarred ? "fill-amber-400 text-amber-400" : "text-zinc-400"}
                                        />
                                        <span>{isStarred ? (isRu ? "В избранном" : "Starred") : (isRu ? "В избранное" : "Star")}</span>
                                        <span className="ml-1 px-1.5 py-0.2 rounded-md bg-white/10 text-[11px] font-mono">
                                            {starsCount}
                                        </span>
                                    </button>

                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <Code2 size={13} />
                                            <span>GitHub</span>
                                            <ExternalLink size={11} className="text-zinc-500" />
                                        </a>
                                    )}

                                    {project.liveUrl && (
                                        <a
                                            href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <Globe size={13} />
                                            <span>Demo</span>
                                            <ExternalLink size={11} className="text-zinc-500" />
                                        </a>
                                    )}

                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={handleOpenEdit}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 transition cursor-pointer shadow-sm"
                                        >
                                            <Pencil size={12} />
                                            <span>{t.post.edit}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {project.description && (
                                <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl whitespace-pre-wrap mt-2">
                                    {project.description}
                                </p>
                            )}

                            {project.technologies && project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/5">
                                    {project.technologies.map((tech, idx) => (
                                        <span
                                            key={`${tech}-${idx}`}
                                            className="text-xs font-medium bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-300"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {allImages.length > 0 && (
                        <div className="border border-white/5 rounded-2xl bg-zinc-950/30 p-5 space-y-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers size={16} className="text-zinc-400" />
                                    <h3 className="text-sm font-semibold text-zinc-200">{isRu ? "Галерея проекта" : "Project Gallery"}</h3>
                                    <span className="text-xs text-zinc-500">({allImages.length})</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
                                >
                                    <Maximize2 size={13} />
                                    <span>{isRu ? "Увеличить" : "Expand"}</span>
                                </button>
                            </div>

                            <div className="relative w-full h-64 sm:h-96 rounded-xl overflow-hidden border border-white/5 bg-black flex items-center justify-center group/showcase select-none">
                                <img
                                    src={allImages[activeImageIndex]}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none select-none transition-all duration-300"
                                />

                                <img
                                    src={allImages[activeImageIndex]}
                                    alt={`${project.name} screenshot ${activeImageIndex + 1}`}
                                    className="relative z-10 w-full h-full object-contain cursor-pointer"
                                    onClick={() => setIsLightboxOpen(true)}
                                />

                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black border border-white/15 text-white flex items-center justify-center opacity-0 group-hover/showcase:opacity-100 transition-all backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 z-20"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black border border-white/15 text-white flex items-center justify-center opacity-0 group-hover/showcase:opacity-100 transition-all backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 z-20"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs text-zinc-200 z-20">
                                            {activeImageIndex + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {allImages.length > 1 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-20 h-14 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                                                idx === activeImageIndex
                                                    ? 'border-white shadow-md scale-102'
                                                    : 'border-white/10 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`thumb-${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4 pt-2 flex flex-col gap-8">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} className="text-zinc-400" />
                                <h3 className="text-base font-semibold text-zinc-100">
                                    {isRu ? "Лента разработки" : "Devlog Feed"}
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                                    {posts.length}
                                </span>
                            </div>
                        </div>

                        {isOwner && (
                            <PublicBlock
                                ProjectId={id}
                                Avatar={userData?.avatar}
                                title={isRu ? "Новая запись" : "New Entry"}
                                subtitle={isRu ? "Поделитесь новостью, обновлением или релизом проекта" : "Share a news update, devlog, or project release"}
                                placeholder={isRu ? "Опубликуйте обновление для этого проекта..." : "Publish an update for this project..."}
                                className="m-0 border border-white/5 rounded-2xl bg-zinc-950/40"
                                onPostCreated={loadPosts}
                            />
                        )}

                        {isPostsLoading ? (
                            <div className="space-y-3">
                                <PostSkeleton />
                                <PostSkeleton />
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="p-10 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center">
                                <BookOpen className="w-10 h-10 text-zinc-600 mb-2.5" />
                                <h4 className="text-sm font-semibold text-zinc-300">{isRu ? "В ленте пока нет записей" : "No entries in the feed yet"}</h4>
                                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                                    {isOwner
                                        ? (isRu ? "Напишите первую заметку о ходе разработки, релизах или планах проекта выше!" : "Write your first note about development progress, releases, or project plans above!")
                                        : (isRu ? "Создатель проекта скоро опубликует первые новости и обновления." : "The project creator will publish the first news and updates soon.")}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                {posts.map((p) => (
                                    <div key={p.id} className="animate-fade-in">
                                        <Post
                                            Id={p.id}
                                            Name={p.authorName}
                                            UserName={p.authorUsername}
                                            Content={p.content}
                                            Time={p.created ? new Date(p.created).toLocaleDateString(isRu ? 'ru-RU' : 'en-US') : ""}
                                            Avatar={p.authorAvatar}
                                            Likes={p.likesCount}
                                            isLikedByMe={p.isLikedByMe}
                                            Comments={p.commentsCount}
                                            repostsCount={p.repostsCount}
                                            Attachments={p.attachments}
                                            commentsList={p.commentsList}
                                            community={p.community}
                                            project={p.project || { id: project.id, name: project.name, imageUrl: project.imageUrl, status: project.status }}
                                            repostOfPost={p.repostOfPost}
                                            isPinned={p.isPinned}
                                            canPin={isOwner}
                                            onPinToggle={loadPosts}
                                        />
                                    </div>
                                ))}

                                {hasMore && (
                                    <div ref={sentinelRef} className="py-4 flex justify-center">
                                        {isLoadingMore && <PostSkeleton />}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isLightboxOpen && allImages.length > 0}
                onClose={() => setIsLightboxOpen(false)}
                overlayClassName="bg-black/80 backdrop-blur-xl"
                className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-2xl"
            >
                <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-50 cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-2xl">
                    <img
                        src={allImages[activeImageIndex]}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none select-none"
                    />

                    <img
                        src={allImages[activeImageIndex]}
                        alt="Lightbox"
                        className="relative z-10 max-w-full max-h-[85vh] object-contain rounded-xl border border-white/10 shadow-2xl"
                    />

                    {allImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center backdrop-blur-md cursor-pointer z-20"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center backdrop-blur-md cursor-pointer z-20"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                className="w-full max-w-[880px] max-h-[90vh] bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 text-neutral-100 relative"
            >
                        <div className="md:col-span-5 bg-white/[0.015] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between gap-4 overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="space-y-4">
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                    {isRu ? "Обложка и медиа проекта" : "Project Cover & Media"}
                                </span>

                                <div className="space-y-2">
                                    <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#050505]/90">
                                        {editBannerUrl ? (
                                            <img src={editBannerUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black flex items-center justify-center text-xs text-neutral-500">
                                                {isRu ? "Нет обложки" : "No cover image"}
                                            </div>
                                        )}
                                        <input
                                            ref={bannerInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerUpload}
                                            className="hidden"
                                        />
                                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={isUploadingBanner}
                                                onClick={() => bannerInputRef.current?.click()}
                                                className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-medium text-neutral-100 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                            >
                                                {isUploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                                                <span>{editBannerUrl ? (isRu ? "Сменить" : "Replace") : (isRu ? "Обложка" : "Cover")}</span>
                                            </button>
                                            {editBannerUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditBannerUrl('')}
                                                    className="p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 border border-white/15 text-neutral-200 hover:text-white transition cursor-pointer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                            {isRu ? "Скриншоты" : "Screenshots"} ({editImages.length})
                                        </label>
                                        <input
                                            ref={imagesInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImagesUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            disabled={isUploadingImages}
                                            onClick={() => imagesInputRef.current?.click()}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                                        >
                                            {isUploadingImages ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            <span>{isRu ? "Добавить" : "Add"}</span>
                                        </button>
                                    </div>

                                    {editImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {editImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                                    <img src={img} alt={`Screenshot ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => imagesInputRef.current?.click()}
                                            className="w-full py-6 rounded-2xl border border-dashed border-white/15 hover:border-white/30 bg-[#050505]/90 text-xs text-neutral-400 hover:text-white transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                        >
                                            <Plus size={16} />
                                            <span>{isRu ? "Добавить скриншоты галереи" : "Add gallery screenshots"}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-[11px] text-neutral-500 hidden md:block leading-relaxed">
                                {isRu ? "Скриншоты отображаются в интерактивной галерее на странице проекта." : "Screenshots are showcased in the interactive gallery on the project page."}
                            </p>
                        </div>

                        <div className="md:col-span-7 p-6 sm:p-7 overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">{isRu ? "Редактирование проекта" : "Edit Project"}</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{isRu ? "Обновите информацию, статус, ссылки и стек" : "Update project info, status, links & tech stack"}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProject} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                                        {isRu ? "Название проекта *" : "Project Name *"}
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
                                        placeholder={isRu ? "Мой проект" : "My project"}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                                        {isRu ? "Статус проекта" : "Project Status"}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { val: 0, label: isRu ? "В разработке" : "In Progress" },
                                            { val: 1, label: isRu ? "Бета" : "Beta" },
                                            { val: 2, label: isRu ? "Релиз" : "Released" },
                                            { val: 3, label: isRu ? "Архив" : "Archived" }
                                        ].map((s) => (
                                            <button
                                                key={s.val}
                                                type="button"
                                                onClick={() => setEditStatus(s.val as ProjectStatus)}
                                                className={`py-2 px-2 text-xs font-medium rounded-xl border transition cursor-pointer text-center ${
                                                    editStatus === s.val
                                                        ? 'bg-white text-black border-white shadow-sm'
                                                        : 'bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                                        {isRu ? "Описание" : "Description"}
                                    </label>
                                    <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        rows={4}
                                        className="w-full min-h-[116px] px-3.5 py-2.5 text-sm leading-relaxed bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/25 custom-scrollbar resize-y"
                                        placeholder={isRu ? "О чем этот проект? Какую проблему решает?" : "What is this project about? What problem does it solve?"}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                                            GitHub URL
                                        </label>
                                        <input
                                            type="text"
                                            value={editGithubUrl}
                                            onChange={(e) => setEditGithubUrl(e.target.value)}
                                            className="w-full px-3.5 py-2 text-xs bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
                                            placeholder="https://github.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                                            Live Demo URL
                                        </label>
                                        <input
                                            type="text"
                                            value={editLiveUrl}
                                            onChange={(e) => setEditLiveUrl(e.target.value)}
                                            className="w-full px-3.5 py-2 text-xs bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
                                            placeholder="https://myproject.com"
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/5 space-y-2.5">
                                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                        {isRu ? "Стек технологий" : "Tech Stack"}
                                    </label>
                                    {editTechs.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {editTechs.map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="inline-flex items-center gap-1.5 text-xs bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-lg text-neutral-200"
                                                >
                                                    <span>{tech}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTech(tech)}
                                                        className="text-neutral-400 hover:text-red-400 cursor-pointer"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTechInput}
                                            onChange={(e) => setNewTechInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTech();
                                                }
                                            }}
                                            className="flex-1 px-3 py-1.5 text-xs bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
                                            placeholder="React, Next.js, C#, PostgreSQL..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTech}
                                            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-neutral-100 transition cursor-pointer"
                                        >
                                            {isRu ? "Добавить" : "Add"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        className="px-5 py-2.5 text-xs font-semibold text-neutral-300 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
                                    >
                                        {t.common.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSaving && <Loader2 size={13} className="animate-spin" />}
                                        <span>{t.common.save}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>
        </div>
    );
}
