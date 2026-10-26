'use client';

import ExperienceCard from "@/components/exp_card";
import Modal from "@/components/Modal";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { UserService } from "@/services/userService";
import { formatPostTime } from "@/libs/format";
import type { UserExperience, UserProject } from "@/types/auth";
import { upload } from "@vercel/blob/client";
import {
    ArrowUpRight,
    Briefcase,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Code2,
    Globe,
    Image as ImageIcon,
    LayoutGrid,
    Loader2,
    Mail,
    MapPin,
    Plus,
    Send,
    Settings,
    SlidersHorizontal,
    Sparkles,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POPULAR_TECHS = [
    'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js',
    '.NET', 'C#', 'PostgreSQL', 'Docker', 'Python', 'Go',
    'Zustand', 'GraphQL', 'Git'
];

export default function Profile() {
    const { userData, UserNameNormalized, userPostsData, refreshUserPostsData, hasMoreUserPosts, isLoadingMoreUserPosts, loadMoreUserPosts, refreshUserData, onlineUsers } = useApplication();
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    const [mounted, setMounted] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsUploading] = useState(false);

    const [editFullName, setEditFullName] = useState('');
    const [editUserName, setEditUserName] = useState('');
    const [editBioFirstLine, setEditBioFirstLine] = useState('');
    const [editBioSecondLine, setEditBioSecondLine] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editWorkStatus, setEditWorkStatus] = useState('');
    const [editFocus, setEditFocus] = useState('');
    const [editTechnologies, setEditTechnologies] = useState<string[]>([]);
    const [techInput, setTechInput] = useState('');

    const [editGithub, setEditGithub] = useState('');
    const [editTelegram, setEditTelegram] = useState('');
    const [editVk, setEditVk] = useState('');
    const [editX, setEditX] = useState('');
    const [editDiscord, setEditDiscord] = useState('');
    const [editWebsite, setEditWebsite] = useState('');

    const [isLinksExpanded, setIsLinksExpanded] = useState(false);
    const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);
    const [profileTab, setProfileTab] = useState<'details' | 'projects' | 'experience'>('details');

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [projectImages, setProjectImages] = useState<string[]>([]);
    const [isUploadingProjectImages, setIsUploadingProjectImages] = useState(false);
    const [projectActivePreviewIndex, setProjectActivePreviewIndex] = useState(0);
    const projectImageInputRef = useRef<HTMLInputElement>(null);

    const [projectsViewMode, setProjectsViewMode] = useState<'carousel' | 'grid'>('carousel');
    const projectsCarouselRef = useRef<HTMLDivElement>(null);
    const [canScrollProjectsLeft, setCanScrollProjectsLeft] = useState(false);
    const [canScrollProjectsRight, setCanScrollProjectsRight] = useState(false);

    const [projectGithub, setProjectGithub] = useState('');
    const [projectLive, setProjectLive] = useState('');
    const [projectTechs, setProjectTechs] = useState<string[]>([]);
    const [projectTechInput, setProjectTechInput] = useState('');
    const [isSavingProject, setIsSavingProject] = useState(false);

    const [isExpModalOpen, setIsExpModalOpen] = useState(false);
    const [editingExpId, setEditingExpId] = useState<string | null>(null);
    const [expCompanyName, setExpCompanyName] = useState('');
    const [expPosition, setExpPosition] = useState('');
    const [expMode, setExpMode] = useState('Full-time');
    const [expPeriod, setExpPeriod] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [isSavingExp, setIsSavingExp] = useState(false);

    const cleanUsername = userData.userName;
    const isAuthorOnline = onlineUsers.some(
        (u) => u.toLowerCase() === cleanUsername.toLowerCase()
    );

    const [isPostsLoading, setIsPostsLoading] = useState(userPostsData.length === 0);
    const userPostsSentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        document.title = t.nav.profile;
        const load = async () => {
            if (userPostsData.length === 0) setIsPostsLoading(true);
            await refreshUserPostsData();
            setIsPostsLoading(false);
        };
        load();
    }, [t.nav.profile]);

    useEffect(() => {
        if (!hasMoreUserPosts || isLoadingMoreUserPosts) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreUserPosts();
            }
        }, {
            rootMargin: '300px',
        });

        const el = userPostsSentinelRef.current;
        if (el) observer.observe(el);

        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMoreUserPosts, isLoadingMoreUserPosts, loadMoreUserPosts]);

    const handleOpenEditProfile = () => {
        setEditFullName(userData.fullName || '');
        setEditUserName(userData.userName || '');
        setEditBioFirstLine(userData.bio_FirstLine || '');
        setEditBioSecondLine(userData.bio_SecondLine || '');
        setEditLocation(userData.location || '');
        setEditWorkStatus(userData.workStatus || '');
        setEditFocus(userData.focus || '');
        setEditTechnologies(userData.technologies || []);
        setEditGithub(userData.githubUrl || '');
        setEditTelegram(userData.telegramUrl || '');
        setEditVk(userData.vkUrl || '');
        setEditX(userData.xUrl || '');
        setEditDiscord(userData.discordUrl || '');
        setEditWebsite(userData.websiteUrl || '');
        setIsEditOpen(true);
    };

    const handleAddTech = (tech: string) => {
        const trimmed = tech.trim();
        if (!trimmed) return;
        if (!editTechnologies.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            setEditTechnologies(prev => [...prev, trimmed]);
        }
        setTechInput('');
    };

    const handleRemoveTech = (tech: string) => {
        setEditTechnologies(prev => prev.filter(t => t !== tech));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            await UserService.changeBio({ firstLine: editBioFirstLine, secondLine: editBioSecondLine });
            await UserService.changeName({ fullName: editFullName });
            await UserService.changeUserName({ userName: editUserName });
            await UserService.changeDetails({
                location: editLocation,
                workStatus: editWorkStatus,
                focus: editFocus,
                technologies: editTechnologies,
                githubUrl: editGithub,
                telegramUrl: editTelegram,
                vkUrl: editVk,
                xUrl: editX,
                discordUrl: editDiscord,
                websiteUrl: editWebsite,
            });

            await refreshUserData();
            setIsEditOpen(false);
        } catch (error) {
            console.error("Ошибка обновления профиля:", error);
            alert(isRu ? "Не удалось сохранить изменения" : "Failed to save changes");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/avatar/upload',
            });
            await UserService.changeAvatar({ avatar: newBlob.url });
            await refreshUserData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/banner/upload',
            });
            await UserService.changeBanner({ banner: newBlob.url });
            await refreshUserData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

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

    const handleOpenAddProject = () => {
        setEditingProjectId(null);
        setProjectName('');
        setProjectDesc('');
        setProjectImages([]);
        setProjectActivePreviewIndex(0);
        setProjectGithub('');
        setProjectLive('');
        setProjectTechs([]);
        setProjectTechInput('');
        setIsProjectModalOpen(true);
    };

    const handleOpenEditProject = (proj: UserProject) => {
        setEditingProjectId(proj.id);
        setProjectName(proj.name);
        setProjectDesc(proj.description || '');
        const imgs = proj.images && proj.images.length > 0 ? proj.images : (proj.imageUrl ? [proj.imageUrl] : []);
        setProjectImages(imgs);
        setProjectActivePreviewIndex(0);
        setProjectGithub(proj.githubUrl || '');
        setProjectLive(proj.liveUrl || '');
        setProjectTechs(proj.technologies || []);
        setProjectTechInput('');
        setIsProjectModalOpen(true);
    };

    const handleProjectImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        setIsUploadingProjectImages(true);
        try {
            const uploadPromises = files.map(file =>
                upload(file.name, file, {
                    access: 'public',
                    handleUploadUrl: '/api/img/upload',
                })
            );
            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(r => r.url);
            setProjectImages(prev => [...prev, ...newUrls]);
        } catch (error) {
            console.error("Ошибка загрузки изображений проекта:", error);
            alert(isRu ? "Не удалось загрузить изображения проекта" : "Failed to upload project images");
        } finally {
            setIsUploadingProjectImages(false);
            if (projectImageInputRef.current) projectImageInputRef.current.value = '';
        }
    };

    const handleRemoveProjectImage = (indexToRemove: number) => {
        setProjectImages(prev => {
            const updated = prev.filter((_, idx) => idx !== indexToRemove);
            if (projectActivePreviewIndex >= updated.length) {
                setProjectActivePreviewIndex(Math.max(0, updated.length - 1));
            }
            return updated;
        });
    };

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) return;

        setIsSavingProject(true);
        try {
            const payload = {
                name: projectName.trim(),
                description: projectDesc.trim() || undefined,
                imageUrl: projectImages[0] || undefined,
                images: projectImages,
                githubUrl: projectGithub.trim() || undefined,
                liveUrl: projectLive.trim() || undefined,
                technologies: projectTechs
            };

            if (editingProjectId) {
                await UserService.updateProject(editingProjectId, payload);
            } else {
                await UserService.addProject(payload);
            }

            await refreshUserData();
            setIsProjectModalOpen(false);
        } catch (error) {
            console.error("Ошибка сохранения проекта:", error);
            alert(isRu ? "Не удалось сохранить проект" : "Failed to save project");
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm(isRu ? "Вы уверены, что хотите удалить этот проект?" : "Are you sure you want to delete this project?")) return;
        try {
            await UserService.deleteProject(projectId);
            await refreshUserData();
        } catch (error) {
            console.error("Ошибка удаления проекта:", error);
            alert(isRu ? "Не удалось удалить проект" : "Failed to delete project");
        }
    };

    const handleOpenAddExperience = () => {
        setEditingExpId(null);
        setExpCompanyName('');
        setExpPosition('');
        setExpMode('Full-time');
        setExpPeriod('');
        setExpDesc('');
        setIsExpModalOpen(true);
    };

    const handleOpenEditExperience = (exp: UserExperience) => {
        setEditingExpId(exp.id);
        setExpCompanyName(exp.companyName);
        setExpPosition(exp.position);
        setExpMode(exp.mode || 'Full-time');
        setExpPeriod(exp.period);
        setExpDesc(exp.description || '');
        setIsExpModalOpen(true);
    };

    const handleSaveExperience = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expCompanyName.trim() || !expPosition.trim() || !expPeriod.trim()) return;

        setIsSavingExp(true);
        try {
            const payload = {
                companyName: expCompanyName.trim(),
                position: expPosition.trim(),
                mode: expMode.trim() || undefined,
                period: expPeriod.trim(),
                description: expDesc.trim() || undefined
            };

            if (editingExpId) {
                await UserService.updateExperience(editingExpId, payload);
            } else {
                await UserService.addExperience(payload);
            }

            await refreshUserData();
            setIsExpModalOpen(false);
        } catch (error) {
            console.error("Ошибка сохранения места работы:", error);
            alert(isRu ? "Не удалось сохранить место работы" : "Failed to save work experience");
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleDeleteExperience = async (expId: string) => {
        if (!confirm(isRu ? "Вы уверены, что хотите удалить эту запись об опыте работы?" : "Are you sure you want to delete this work experience entry?")) return;
        try {
            await UserService.deleteExperience(expId);
            await refreshUserData();
        } catch (error) {
            console.error("Ошибка удаления места работы:", error);
            alert(isRu ? "Не удалось удалить место работы" : "Failed to delete work experience");
        }
    };

    if (!userData?.id || userData.userName === '...') {
        return <ProfileSkeleton />;
    }

    const currentTechStack = (userData.technologies && userData.technologies.length > 0)
        ? userData.technologies
        : [isRu ? "Навыки не указаны" : "No Techs Skills"];

    const projectsList = userData.projects || [];
    const experiencesList = userData.experiences || [];

    return (
        <div className="animate-fade-in">
            <div>
                <Titlebar title={t.nav.profile} />

                <div className="w-full bg-zinc-900 h-48 border-y border-white/5 rounded-b-xl relative overflow-hidden">
                    {userData.banner && (
                        <img src={userData.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 pb-10 max-sm:px-5 relative">
                    {userData.banner && (
                        <div 
                            className="absolute -top-110 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-11110 select-none"
                            style={{
                                backgroundImage: `url(${userData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    {userData.banner && (
                        <div 
                            className="absolute -top-30 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-0 select-none"
                            style={{
                                backgroundImage: `url(${userData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-10">
                        <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full shrink-0 -mt-14 sm:-mt-20 border-4 border-[#0a0a0a] shadow-lg">
                            <div className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                {userData.avatar ? (
                                    <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
                                        {userData.fullName?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            {isAuthorOnline && (
                                <span 
                                    className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-[#0a0a0a] rounded-full" 
                                    title={isRu ? "В сети" : "Online"}
                                />
                            )}
                        </div>
                        <div className="mb-1 sm:mb-2 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 break-words">{userData.fullName}</h2>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                <p className="text-sm text-zinc-400 break-all">{UserNameNormalized}</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">{userData.watchersCount ?? userData.followers ?? 0} {t.profile.watchers}</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">{userData.watchingCount ?? userData.followings ?? 0} {t.profile.watching}</p>
                            </div>
                        </div>
                        <div className="sm:ml-auto sm:mb-5 flex items-center gap-2 shrink-0 flex-nowrap">
                            <button 
                                className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 text-center"
                                onClick={handleOpenEditProfile}
                            >
                                {t.profile.editProfile}
                            </button>
                            <Link
                                href="/settings"
                                className="md:hidden inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white/10 text-zinc-200 border border-white/10 rounded-3xl hover:bg-white/15 hover:text-white transition whitespace-nowrap shrink-0"
                                title={t.nav.settings}
                            >
                                <Settings size={15} />
                                <span>{t.nav.settings}</span>
                            </Link>
                        </div>
                    </div>

                    {userData.bio_FirstLine && (
                        <div className="mt-6">
                            <p className="text-md font-bold text-zinc-300">
                                {userData.bio_FirstLine}
                            </p>
                        </div>
                    )}

                    {userData.bio_SecondLine && (
                        <div className="mt-3 max-w-2xl">
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                                {userData.bio_SecondLine}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 mt-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.profile.techStack}</h3>
                            <button
                                onClick={handleOpenEditProfile}
                                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                            >
                                {isRu ? "Изменить стек" : "Edit stack"}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {currentTechStack.map((tech) => (
                                <span 
                                    key={tech} 
                                    className="px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-200 cursor-default"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 border-b border-white/5 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setProfileTab('details')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer shrink-0 whitespace-nowrap ${
                                profileTab === 'details'
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
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
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Code2 size={14} className={profileTab === 'projects' ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span>{t.profile.featuredProjects}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                profileTab === 'projects' ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'
                            }`}>
                                {projectsList.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setProfileTab('experience')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer shrink-0 whitespace-nowrap ${
                                profileTab === 'experience'
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Briefcase size={14} className={profileTab === 'experience' ? 'text-purple-400' : 'text-zinc-500'} />
                            <span>{t.profile.experience}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                profileTab === 'experience' ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'
                            }`}>
                                {experiencesList.length}
                            </span>
                        </button>
                    </div>

                    <div className="mt-6">
                        {profileTab === 'details' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start animate-fade-in">
                                <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl">
                                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                                        {isRu ? "Детали" : "Details"}
                                    </h4>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{t.profile.location}</span>
                                                <span className="text-xs text-zinc-200 font-medium">
                                                    {userData.location || (isRu ? "Не указано" : "Not specified")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <Briefcase size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{t.profile.workStatus}</span>
                                                <span className="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                                    </span>
                                                    {userData.workStatus || (isRu ? "Открыт к предложениям" : "Open to opportunities")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Sparkles size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{t.profile.focus}</span>
                                                <span className="text-xs text-zinc-200 font-medium">
                                                    {userData.focus || "Fullstack & Realtime Architecture"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl">
                                    {(() => {
                                        const userLinks = [
                                            userData.githubUrl && { 
                                                label: 'GitHub', 
                                                display: userData.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\/?/, ''), 
                                                url: userData.githubUrl.startsWith('http') ? userData.githubUrl : `https://github.com/${userData.githubUrl}`, 
                                                icon: Code2 
                                            },
                                            userData.telegramUrl && { 
                                                label: 'Telegram', 
                                                display: `@${userData.telegramUrl.replace(/^https?:\/\/t\.me\/?/, '').replace(/^@/, '')}`, 
                                                url: userData.telegramUrl.startsWith('http') ? userData.telegramUrl : `https://t.me/${userData.telegramUrl.replace(/^@/, '')}`, 
                                                icon: Send 
                                            },
                                            userData.vkUrl && { 
                                                label: 'VK', 
                                                display: isRu ? 'Профиль VK' : 'VK Profile', 
                                                url: userData.vkUrl.startsWith('http') ? userData.vkUrl : `https://${userData.vkUrl}`, 
                                                icon: Globe 
                                            },
                                            userData.xUrl && { 
                                                label: 'X (Twitter)', 
                                                display: isRu ? 'Профиль X' : 'X Profile', 
                                                url: userData.xUrl.startsWith('http') ? userData.xUrl : `https://${userData.xUrl}`, 
                                                icon: Globe 
                                            },
                                            userData.discordUrl && { 
                                                label: 'Discord', 
                                                display: userData.discordUrl, 
                                                url: userData.discordUrl.startsWith('http') ? userData.discordUrl : `https://${userData.discordUrl}`, 
                                                icon: Globe 
                                            },
                                            userData.websiteUrl && { 
                                                label: isRu ? 'Портфолио' : 'Portfolio', 
                                                display: userData.websiteUrl.replace(/^https?:\/\//, ''), 
                                                url: userData.websiteUrl.startsWith('http') ? userData.websiteUrl : `https://${userData.websiteUrl}`, 
                                                icon: Globe 
                                            },
                                            userData.email && { 
                                                label: 'Email', 
                                                display: userData.email, 
                                                url: `mailto:${userData.email}`, 
                                                icon: Mail 
                                            },
                                        ].filter(Boolean) as { label: string; display: string; url: string; icon: any }[];

                                        const visibleLinks = isLinksExpanded ? userLinks : userLinks.slice(0, 3);

                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                                        {isRu ? "Ссылки и контакты" : "Links & Contacts"}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                        {userLinks.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {userLinks.length === 0 ? (
                                                        <p className="text-xs text-zinc-500 py-3 text-center">
                                                            {isRu ? "Ссылки ещё не добавлены" : "No links added yet"}
                                                        </p>
                                                    ) : (
                                                        visibleLinks.map((link, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center justify-between p-2 px-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-150 group"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <link.icon size={13} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                                                                    <span className="text-xs font-medium text-zinc-200">{link.label}</span>
                                                                    {link.display && (
                                                                        <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline truncate max-w-[150px]">
                                                                            {link.display}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <ArrowUpRight 
                                                                    size={13} 
                                                                    className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" 
                                                                />
                                                            </a>
                                                        ))
                                                    )}

                                                    {userLinks.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                                                            className="w-full mt-1.5 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition"
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
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                            {t.profile.featuredProjects}
                                        </h4>
                                        <span className="text-[11px] text-zinc-500 font-mono">
                                            {projectsList.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {projectsList.length > 0 && (
                                            <>
                                                {projectsViewMode === 'carousel' && projectsList.length > 2 && (
                                                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleScrollProjects('left')}
                                                            disabled={!canScrollProjectsLeft}
                                                            className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
                                                            title={isRu ? "Предыдущие проекты" : "Previous projects"}
                                                        >
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleScrollProjects('right')}
                                                            disabled={!canScrollProjectsRight}
                                                            className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
                                                            title={isRu ? "Следующие проекты" : "Next projects"}
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProjectsViewMode('carousel')}
                                                        className={`p-1 rounded-lg transition cursor-pointer ${
                                                            projectsViewMode === 'carousel'
                                                                ? 'bg-white/15 text-white'
                                                                : 'text-zinc-400 hover:text-zinc-200'
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
                                                                ? 'bg-white/15 text-white'
                                                                : 'text-zinc-400 hover:text-zinc-200'
                                                        }`}
                                                        title={isRu ? "Режим сетки" : "Grid view"}
                                                    >
                                                        <LayoutGrid size={13} />
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        <button
                                            onClick={handleOpenAddProject}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer"
                                        >
                                            <Plus size={13} />
                                            <span>{t.profile.addProject}</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {projectsList.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
                                            <Code2 size={20} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-zinc-300">{isRu ? "Проекты ещё не добавлены" : "No projects added yet"}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{isRu ? "Добавьте ваши pet-проекты, open-source библиотеки или коммерческие кейсы" : "Add your pet projects, open-source libraries, or commercial cases"}</p>
                                        </div>
                                        <button
                                            onClick={handleOpenAddProject}
                                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
                                        >
                                            {t.profile.addProject}
                                        </button>
                                    </div>
                                ) : projectsViewMode === 'carousel' ? (
                                    <div className="relative group/carousel">
                                        <div 
                                            ref={projectsCarouselRef}
                                            onScroll={checkProjectsScroll}
                                            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1"
                                        >
                                            {projectsList.map((p, idx) => {
                                                const links = [
                                                    p.githubUrl && { name: "GitHub", href: p.githubUrl.startsWith('http') ? p.githubUrl : `https://${p.githubUrl}` },
                                                    p.liveUrl && { name: "Demo / Live", href: p.liveUrl.startsWith('http') ? p.liveUrl : `https://${p.liveUrl}` }
                                                ].filter(Boolean) as { name: string; href: string }[];

                                                return (
                                                    <div 
                                                        key={p.id || `proj-carousel-${idx}`} 
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
                                                            onEdit={() => handleOpenEditProject(p)}
                                                            onDelete={() => handleDeleteProject(p.id)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {projectsList.map((p, idx) => {
                                            const links = [
                                                p.githubUrl && { name: "GitHub", href: p.githubUrl.startsWith('http') ? p.githubUrl : `https://${p.githubUrl}` },
                                                p.liveUrl && { name: "Demo / Live", href: p.liveUrl.startsWith('http') ? p.liveUrl : `https://${p.liveUrl}` }
                                            ].filter(Boolean) as { name: string; href: string }[];

                                            return (
                                                <ProjectCard 
                                                    key={p.id || `proj-grid-${idx}`} 
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
                                                    onEdit={() => handleOpenEditProject(p)}
                                                    onDelete={() => handleDeleteProject(p.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {profileTab === 'experience' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                            {t.profile.experience}
                                        </h4>
                                        <span className="text-[11px] text-zinc-500 font-mono">
                                            {experiencesList.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleOpenAddExperience}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer"
                                    >
                                        <Plus size={13} />
                                        <span>{t.profile.addExperience}</span>
                                    </button>
                                </div>
                                
                                {experiencesList.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
                                            <Briefcase size={20} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-zinc-300">{isRu ? "Опыт работы не указан" : "No work experience listed yet"}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{isRu ? "Расскажите о компаниях, должностях и задачах, над которыми вы работали" : "Share the companies, roles, and tasks you have worked on"}</p>
                                        </div>
                                        <button
                                            onClick={handleOpenAddExperience}
                                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
                                        >
                                            {t.profile.addExperience}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {experiencesList.map((exp) => (
                                            <ExperienceCard 
                                                key={exp.id}
                                                name={exp.companyName}
                                                post={exp.position}
                                                mode={exp.mode}
                                                time={exp.period}
                                                description={exp.description}
                                                onEdit={() => handleOpenEditExperience(exp)}
                                                onDelete={() => handleDeleteExperience(exp.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    </div>
                </div>

            <div>
                <Titlebar title={isRu ? "Активность" : "Activity"} />
                <div>
                    <PublicBlock Avatar={userData.avatar} />
                                
                    <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                        {isPostsLoading ? (
                            <>
                                <PostSkeleton />
                                <PostSkeleton />
                            </>
                        ) : userPostsData.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-8 select-none">{isRu ? "Публикаций пока нет" : "No posts yet"}</p>
                        ) : (
                            userPostsData.map((p) => (
                                <div key={p.id} className="animate-fade-in">
                                    <Post 
                                        Id={p.id} 
                                        Name={userData.fullName} 
                                        UserName={UserNameNormalized} 
                                        Content={p.content} 
                                        Time={formatPostTime(p.created)} 
                                        Avatar={userData.avatar} 
                                        Likes={p.likesCount} 
                                        isLikedByMe={p.isLikedByMe} 
                                        Comments={p.commentsCount} 
                                        repostsCount={p.repostsCount} 
                                        Attachments={p.attachments} 
                                        commentsList={p.commentsList} 
                                        repostOfPost={p.repostOfPost} 
                                        community={p.community}
                                        project={p.project}
                                        isPinned={p.isPinned}
                                        canPin={true}
                                        onPinToggle={() => refreshUserPostsData?.()}
                                    />
                                </div>
                            ))
                        )}

                        {/* Progressive load sentinel & loading indicator */}
                        {hasMoreUserPosts && (
                            <div ref={userPostsSentinelRef} className="py-4 flex justify-center items-center">
                                {isLoadingMoreUserPosts && (
                                    <div className="flex flex-col gap-3 w-full">
                                        <PostSkeleton />
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasMoreUserPosts && userPostsData.length > 0 && (
                            <div className="py-6 text-center text-xs text-zinc-600 select-none">
                                {isRu ? "Вы просмотрели все публикации" : "You've viewed all posts"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                className="w-full max-w-[1040px] max-h-[92vh] bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 relative"
            >
                        <div className="md:col-span-4 bg-white/[0.015] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between gap-5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                        {isRu ? "Превью карточки" : "Live Card Preview"}
                                    </span>
                                    {isSaving && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                                            <Loader2 size={12} className="animate-spin text-white" />
                                            <span>{isRu ? "Загрузка..." : "Saving..."}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-[#050505]/90 overflow-hidden shadow-xl">
                                    <div className="relative h-24 w-full bg-[#111111] overflow-hidden">
                                        {userData?.banner ? (
                                            <img src={userData.banner} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                                        <label className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-medium text-neutral-100 flex items-center gap-1 cursor-pointer transition">
                                            <ImageIcon size={12} />
                                            <span>{isRu ? "Баннер" : "Banner"}</span>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleBannerUpload}
                                                disabled={isSaving}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="p-4 pt-0">
                                        <div className="flex items-end justify-between gap-2 -mt-8 mb-3 relative z-10">
                                            <label className="relative w-16 h-16 rounded-full ring-4 ring-[#050505] bg-[#161616] overflow-hidden cursor-pointer group/avatar shrink-0 shadow-lg">
                                                {userData?.avatar ? (
                                                    <img src={userData.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-200">
                                                        {editFullName?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition flex items-center justify-center text-white">
                                                    <ImageIcon size={15} />
                                                </div>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    disabled={isSaving}
                                                    className="hidden"
                                                />
                                            </label>
                                            {editWorkStatus && (
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 truncate max-w-[150px]">
                                                    {editWorkStatus}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="text-sm font-bold text-neutral-100 truncate">
                                                {editFullName || (isRu ? "Ваше имя" : "Your Name")}
                                            </div>
                                            <div className="text-xs text-neutral-500 truncate">
                                                @{editUserName || "username"}
                                            </div>
                                        </div>

                                        {(editBioFirstLine || editFocus) && (
                                            <p className="text-xs text-neutral-300 mt-2 line-clamp-3 leading-relaxed">
                                                {editBioFirstLine || editFocus}
                                            </p>
                                        )}

                                        {editLocation && (
                                            <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-2">
                                                <MapPin size={11} />
                                                <span className="truncate">{editLocation}</span>
                                            </div>
                                        )}

                                        {editTechnologies.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
                                                {editTechnologies.slice(0, 6).map((tech) => (
                                                    <span key={tech} className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/5 text-[10px] text-neutral-300">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {editTechnologies.length > 6 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] text-neutral-500">
                                                        +{editTechnologies.length - 6}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <label className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-medium text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition text-center whitespace-nowrap">
                                        <ImageIcon size={13} className="text-neutral-400 shrink-0" />
                                        <span>{isRu ? "Сменить фото" : "Change Photo"}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={isSaving}
                                            className="hidden"
                                        />
                                    </label>
                                    <label className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-medium text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition text-center whitespace-nowrap">
                                        <ImageIcon size={13} className="text-neutral-400 shrink-0" />
                                        <span>{isRu ? "Сменить фон" : "Change Cover"}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleBannerUpload}
                                            disabled={isSaving}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <p className="text-[11px] text-neutral-500 leading-relaxed hidden md:block">
                                {isRu ? "Все изменения мгновенно отображаются на превью карточки слева перед сохранением." : "Changes are previewed live on the card above before saving."}
                            </p>
                        </div>

                        <div className="md:col-span-8 p-6 sm:p-8 overflow-y-auto no-scrollbar max-h-[92vh]">
                            <div className="flex justify-between items-start gap-4 pb-4 mb-5 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-100 tracking-tight">{t.profile.editProfile}</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{isRu ? "Основная информация, специализация, стек и контакты" : "Personal details, specialization, tech stack & social links"}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Отображаемое имя" : "Display Name"}</label>
                                        <input
                                            type="text"
                                            value={editFullName}
                                            onChange={(e) => setEditFullName(e.target.value)}
                                            placeholder={isRu ? "Ваше полное имя" : "Your Full Name"}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25 transition"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Имя пользователя" : "Username"}</label>
                                        <div className="flex items-center rounded-xl bg-[#050505]/90 border border-white/10 px-3.5 focus-within:border-white/25 transition">
                                            <span className="text-sm text-neutral-500 select-none mr-1">@</span>
                                            <input
                                                type="text"
                                                value={editUserName}
                                                onChange={(e) => setEditUserName(e.target.value)}
                                                placeholder="username"
                                                required
                                                className="w-full py-2.5 bg-transparent text-neutral-100 text-sm focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{t.profile.location}</label>
                                        <input
                                            type="text"
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            placeholder={isRu ? "напр. Москва / Удаленно" : "e.g. Moscow / Remote"}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25 transition"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{t.profile.workStatus}</label>
                                        <input
                                            type="text"
                                            value={editWorkStatus}
                                            onChange={(e) => setEditWorkStatus(e.target.value)}
                                            placeholder={isRu ? "напр. Открыт к предложениям" : "e.g. Open to opportunities"}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25 transition"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Кратко о себе (Заголовок)" : "Bio Headline"}</label>
                                        <textarea
                                            value={editBioFirstLine}
                                            onChange={(e) => setEditBioFirstLine(e.target.value)}
                                            placeholder={isRu ? "напр. Senior Software Engineer. Разрабатываю распределённые системы..." : "e.g. Senior Software Engineer building distributed systems..."}
                                            rows={4}
                                            className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y transition"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Фокус / Специализация" : "Focus / Specialization"}</label>
                                        <textarea
                                            value={editFocus}
                                            onChange={(e) => setEditFocus(e.target.value)}
                                            placeholder={isRu ? "напр. Fullstack Engineer & Software Architect" : "e.g. Fullstack Engineer & Software Architect"}
                                            rows={4}
                                            className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y transition"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "О себе (Подробно)" : "About You"}</label>
                                    <textarea
                                        value={editBioSecondLine}
                                        onChange={(e) => setEditBioSecondLine(e.target.value)}
                                        placeholder={isRu ? "Расскажите о своем опыте, проектах, архитектуре и интересах..." : "Tell something about your experience, projects, architecture and passions..."}
                                        rows={4}
                                        className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y transition"
                                    />
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Технологический стек" : "Tech Stack Tags"}</label>
                                        <span className="text-[11px] text-neutral-500 font-mono">{editTechnologies.length}</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-[#050505]/90 border border-white/10">
                                        {editTechnologies.map((tech) => (
                                            <span 
                                                key={tech}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 text-xs text-neutral-100 border border-white/10"
                                            >
                                                {tech}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTech(tech)}
                                                    className="text-neutral-400 hover:text-red-400 transition cursor-pointer"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </span>
                                        ))}
                                        {editTechnologies.length === 0 && (
                                            <span className="text-xs text-neutral-600 self-center">{isRu ? "Стек пока пуст" : "Stack is empty"}</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={techInput}
                                            onChange={(e) => setTechInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTech(techInput);
                                                }
                                            }}
                                            placeholder={isRu ? "Добавить технологию (напр. Docker, Redis)..." : "Add technology (e.g. Docker, Redis)..."}
                                            className="flex-1 px-3 py-1.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25 transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddTech(techInput)}
                                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-100 transition cursor-pointer"
                                        >
                                            {isRu ? "Добавить" : "Add"}
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {POPULAR_TECHS.filter(t => !editTechnologies.includes(t)).slice(0, 8).map(t => (
                                            <button
                                                type="button"
                                                key={t}
                                                onClick={() => handleAddTech(t)}
                                                className="text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
                                            >
                                                + {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border border-white/5 rounded-2xl p-3.5 bg-white/[0.02]">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditLinksOpen(!isEditLinksOpen)}
                                        className="w-full flex items-center justify-between text-left transition cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                                {isRu ? "Соцсети и контакты" : "Social Links & Contacts"}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-mono">
                                                {[editGithub, editTelegram, editVk, editX, editDiscord, editWebsite].filter(Boolean).length}/6
                                            </span>
                                        </div>
                                        <ChevronDown 
                                            size={15} 
                                            className={`text-neutral-500 transition-transform duration-200 ${isEditLinksOpen ? "rotate-180" : ""}`} 
                                        />
                                    </button>

                                    {isEditLinksOpen && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-white/5">
                                            <input
                                                type="text"
                                                value={editGithub}
                                                onChange={(e) => setEditGithub(e.target.value)}
                                                placeholder="GitHub (https://github.com/...)"
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                            <input
                                                type="text"
                                                value={editTelegram}
                                                onChange={(e) => setEditTelegram(e.target.value)}
                                                placeholder="Telegram (https://t.me/...)"
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                            <input
                                                type="text"
                                                value={editVk}
                                                onChange={(e) => setEditVk(e.target.value)}
                                                placeholder="VK (https://vk.com/...)"
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                            <input
                                                type="text"
                                                value={editX}
                                                onChange={(e) => setEditX(e.target.value)}
                                                placeholder="X / Twitter (https://x.com/...)"
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                            <input
                                                type="text"
                                                value={editDiscord}
                                                onChange={(e) => setEditDiscord(e.target.value)}
                                                placeholder="Discord (https://discord.com/...)"
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                            <input
                                                type="text"
                                                value={editWebsite}
                                                onChange={(e) => setEditWebsite(e.target.value)}
                                                placeholder={isRu ? "Портфолио / Сайт URL" : "Portfolio / Website URL"}
                                                className="w-full px-3 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                                    >
                                        {t.common.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSaving ? (isRu ? "Сохранение..." : "Saving...") : (isRu ? "Сохранить изменения" : "Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>

            <Modal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                className="w-full max-w-[880px] max-h-[90vh] bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 relative"
            >
                        <div className="md:col-span-5 bg-white/[0.015] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                        {isRu ? "Обложка и скриншоты" : "Cover & Screenshots"} {projectImages.length > 0 && `(${projectImages.length})`}
                                    </label>
                                    {projectImages.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => projectImageInputRef.current?.click()}
                                            disabled={isUploadingProjectImages}
                                            className="text-xs text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus size={13} />
                                            <span>{isRu ? "Добавить" : "Add"}</span>
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={projectImageInputRef}
                                    onChange={handleProjectImagesUpload}
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    multiple
                                    className="hidden"
                                />

                                {projectImages.length > 0 ? (
                                    <div className="space-y-2.5">
                                        <div className="relative rounded-2xl overflow-hidden border border-white/10 h-44 bg-[#050505] group/preview">
                                            <img 
                                                src={projectImages[projectActivePreviewIndex]} 
                                                alt={`Preview ${projectActivePreviewIndex + 1}`} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-medium text-neutral-200">
                                                {projectActivePreviewIndex === 0 ? (isRu ? "★ Главная обложка" : "★ Main cover") : (isRu ? `Скриншот ${projectActivePreviewIndex + 1}` : `Screenshot ${projectActivePreviewIndex + 1}`)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProjectImage(projectActivePreviewIndex)}
                                                className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/65 hover:bg-red-500/80 border border-white/10 text-white transition-all cursor-pointer"
                                                title={isRu ? "Удалить это изображение" : "Remove this image"}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                            {projectImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setProjectActivePreviewIndex(idx)}
                                                    className={`relative w-14 h-12 rounded-xl overflow-hidden border flex-shrink-0 transition-all cursor-pointer ${
                                                        idx === projectActivePreviewIndex
                                                            ? 'border-white ring-2 ring-white/20 scale-102'
                                                            : 'border-white/10 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => projectImageInputRef.current?.click()}
                                                disabled={isUploadingProjectImages}
                                                className="w-14 h-12 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-[#050505] flex flex-col items-center justify-center text-neutral-400 hover:text-white transition-all flex-shrink-0 cursor-pointer"
                                            >
                                                {isUploadingProjectImages ? (
                                                    <Loader2 size={14} className="animate-spin text-white" />
                                                ) : (
                                                    <Plus size={15} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => projectImageInputRef.current?.click()}
                                        disabled={isUploadingProjectImages}
                                        className="w-full h-44 border border-dashed border-white/15 hover:border-white/30 rounded-2xl bg-[#050505]/90 hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer p-4 text-center"
                                    >
                                        {isUploadingProjectImages ? (
                                            <div className="flex flex-col items-center gap-2 text-neutral-400">
                                                <Loader2 size={20} className="animate-spin text-white" />
                                                <span className="text-xs">{isRu ? "Загрузка..." : "Uploading..."}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white transition">
                                                    <ImageIcon size={18} />
                                                </div>
                                                <span className="text-xs font-medium text-neutral-200 group-hover:text-white transition">
                                                    {isRu ? "Загрузить скриншоты или обложку" : "Upload screenshots or cover"}
                                                </span>
                                                <span className="text-[11px] text-neutral-500">{isRu ? "PNG, JPG, WebP — можно несколько файлов" : "PNG, JPG, WebP — multiple files allowed"}</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                <div className="p-3.5 rounded-2xl border border-white/5 bg-[#050505]/90 space-y-1.5">
                                    <div className="text-xs font-bold text-neutral-100 truncate">
                                        {projectName || (isRu ? "Название вашего проекта" : "Your Project Title")}
                                    </div>
                                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                                        {projectDesc || (isRu ? "Краткое описание архитектуры и возможностей..." : "Brief description of architecture & features...")}
                                    </p>
                                </div>
                            </div>

                            <p className="text-[11px] text-neutral-500 hidden md:block">
                                {isRu ? "Первое изображение станет главной обложкой карточки проекта в профиле." : "The first image is used as the main project cover."}
                            </p>
                        </div>

                        <div className="md:col-span-7 p-6 sm:p-7 overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="flex justify-between items-start gap-4 pb-4 mb-5 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-100 tracking-tight">
                                        {editingProjectId ? (isRu ? "Редактировать проект" : "Edit Project") : (isRu ? "Добавить проект" : "Add Featured Project")}
                                    </h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{isRu ? "Покажите свои лучшие разработки и open-source проекты" : "Showcase your best builds and open source work"}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsProjectModalOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProject} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Название проекта *" : "Project Name *"}</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="e.g. CloudPulse Dashboard"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Описание" : "Description"}</label>
                                    <textarea
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                        placeholder={isRu ? "Краткий обзор проекта, архитектуры и возможностей..." : "Brief overview of the project, architecture and features..."}
                                        rows={4}
                                        className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Ссылка на GitHub" : "GitHub Link"}</label>
                                        <input
                                            type="text"
                                            value={projectGithub}
                                            onChange={(e) => setProjectGithub(e.target.value)}
                                            placeholder="https://github.com/..."
                                            className="w-full px-3.5 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Ссылка на Demo / NPM" : "Live / NPM Link"}</label>
                                        <input
                                            type="text"
                                            value={projectLive}
                                            onChange={(e) => setProjectLive(e.target.value)}
                                            placeholder={isRu ? "https://npm... или ссылка на демо" : "https://npm... or demo link"}
                                            className="w-full px-3.5 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Используемые технологии" : "Technologies Used"}</label>
                                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#050505]/90 border border-white/10 min-h-[36px]">
                                        {projectTechs.map((t, idx) => (
                                            <span key={`${t}-${idx}`} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-neutral-100 border border-white/10">
                                                {t}
                                                <button 
                                                    type="button" 
                                                    onClick={() => setProjectTechs(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-neutral-400 hover:text-red-400 cursor-pointer"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </span>
                                        ))}
                                        {projectTechs.length === 0 && (
                                            <span className="text-xs text-neutral-600 self-center">{isRu ? "Теги ещё не добавлены" : "No tags added yet"}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={projectTechInput}
                                            onChange={(e) => setProjectTechInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (projectTechInput.trim() && !projectTechs.includes(projectTechInput.trim())) {
                                                        setProjectTechs(prev => [...prev, projectTechInput.trim()]);
                                                        setProjectTechInput('');
                                                    }
                                                }
                                            }}
                                            placeholder={isRu ? "Добавьте тег (напр. Next.js, Redis) и нажмите Enter" : "Add tag (e.g. Next.js, Redis) and press Enter"}
                                            className="flex-1 px-3 py-1.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (projectTechInput.trim() && !projectTechs.includes(projectTechInput.trim())) {
                                                    setProjectTechs(prev => [...prev, projectTechInput.trim()]);
                                                    setProjectTechInput('');
                                                }
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-100 transition cursor-pointer"
                                        >
                                            {isRu ? "Добавить" : "Add"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsProjectModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                                    >
                                        {t.common.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingProject}
                                        className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingProject ? (isRu ? "Сохранение..." : "Saving...") : (editingProjectId ? (isRu ? "Обновить проект" : "Update Project") : t.profile.addProject)}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>

            <Modal
                isOpen={isExpModalOpen}
                onClose={() => setIsExpModalOpen(false)}
                className="w-full max-w-[820px] max-h-[90vh] bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 relative"
            >
                        <div className="md:col-span-4 bg-white/[0.015] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                    {isRu ? "Превью записи" : "Experience Preview"}
                                </span>
                                <div className="p-4 rounded-2xl border border-white/10 bg-[#050505]/90 space-y-3 shadow-xl">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                                            <Briefcase size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-neutral-100 truncate">
                                                {expPosition || (isRu ? "Должность / Роль" : "Position / Role")}
                                            </div>
                                            <div className="text-xs text-neutral-400 truncate mt-0.5">
                                                {expCompanyName || (isRu ? "Название компании" : "Company Name")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-neutral-300">
                                            {expMode}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-neutral-400 font-mono">
                                            {expPeriod || (isRu ? "2024 - Наст. время" : "2024 - Present")}
                                        </span>
                                    </div>
                                    {expDesc && (
                                        <p className="text-[11px] text-neutral-400 line-clamp-3 pt-2 border-t border-white/5 leading-relaxed">
                                            {expDesc}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-neutral-500 hidden md:block leading-relaxed">
                                {isRu ? "Если компания зарегистрирована на платформе, она сможет подтвердить ваш опыт работы." : "Registered companies on Compile can verify your employment."}
                            </p>
                        </div>

                        <div className="md:col-span-8 p-6 sm:p-7 overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="flex justify-between items-start gap-4 pb-4 mb-5 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-100 tracking-tight">
                                        {editingExpId ? (isRu ? "Редактировать опыт работы" : "Edit Experience") : (isRu ? "Добавить опыт работы" : "Add Work Experience")}
                                    </h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{isRu ? "Расскажите о предыдущих местах работы и ролях" : "Share your previous engineering or design roles"}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsExpModalOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveExperience} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Название компании *" : "Company Name *"}</label>
                                        <input
                                            type="text"
                                            value={expCompanyName}
                                            onChange={(e) => setExpCompanyName(e.target.value)}
                                            placeholder={isRu ? "напр. Яндекс, Т-Банк, Acme Corp" : "e.g. Yandex, Tinkoff, Acme Corp"}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Должность / Роль *" : "Position / Role *"}</label>
                                        <input
                                            type="text"
                                            value={expPosition}
                                            onChange={(e) => setExpPosition(e.target.value)}
                                            placeholder="e.g. Senior Backend Engineer"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Формат" : "Mode"}</label>
                                        <select
                                            value={expMode}
                                            onChange={(e) => setExpMode(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505] text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                        >
                                            <option value="Full-time">{isRu ? "Полная занятость (Full-time)" : "Full-time"}</option>
                                            <option value="Remote">{isRu ? "Удаленно (Remote)" : "Remote"}</option>
                                            <option value="Hybrid">{isRu ? "Гибрид (Hybrid)" : "Hybrid"}</option>
                                            <option value="Part-time">{isRu ? "Частичная (Part-time)" : "Part-time"}</option>
                                            <option value="Contract">{isRu ? "Контракт (Contract)" : "Contract"}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Период / Годы *" : "Period / Years *"}</label>
                                        <input
                                            type="text"
                                            value={expPeriod}
                                            onChange={(e) => setExpPeriod(e.target.value)}
                                            placeholder={isRu ? "напр. 2024 - Наст. время" : "e.g. 2024 - Present"}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{isRu ? "Описание" : "Description"}</label>
                                    <textarea
                                        value={expDesc}
                                        onChange={(e) => setExpDesc(e.target.value)}
                                        placeholder={isRu ? "Над чем вы работали, ключевые достижения, стек..." : "What did you work on, key achievements, technologies..."}
                                        rows={4}
                                        className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-[#050505]/90 text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsExpModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                                    >
                                        {t.common.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingExp}
                                        className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingExp ? (isRu ? "Сохранение..." : "Saving...") : (editingExpId ? (isRu ? "Обновить опыт" : "Update Experience") : t.profile.addExperience)}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>
        </div>
    );
}