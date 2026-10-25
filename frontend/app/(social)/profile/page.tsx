'use client';

import ExperienceCard from "@/components/exp_card";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
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
    SlidersHorizontal,
    Sparkles,
    X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POPULAR_TECHS = [
    'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js',
    '.NET', 'C#', 'PostgreSQL', 'Docker', 'Python', 'Go',
    'Zustand', 'GraphQL', 'Git'
];

export default function Profile() {
    const { userData, UserNameNormalized, userPostsData, refreshUserPostsData, hasMoreUserPosts, isLoadingMoreUserPosts, loadMoreUserPosts, refreshUserData, onlineUsers } = useApplication();

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
        document.title = 'Profile';
        const load = async () => {
            if (userPostsData.length === 0) setIsPostsLoading(true);
            await refreshUserPostsData();
            setIsPostsLoading(false);
        };
        load();
    }, []);

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
            alert("Не удалось сохранить изменения");
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
            alert("Не удалось загрузить изображения проекта");
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
            alert("Не удалось сохранить проект");
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Вы уверены, что хотите удалить этот проект?")) return;
        try {
            await UserService.deleteProject(projectId);
            await refreshUserData();
        } catch (error) {
            console.error("Ошибка удаления проекта:", error);
            alert("Не удалось удалить проект");
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
            alert("Не удалось сохранить место работы");
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleDeleteExperience = async (expId: string) => {
        if (!confirm("Вы уверены, что хотите удалить эту запись об опыте работы?")) return;
        try {
            await UserService.deleteExperience(expId);
            await refreshUserData();
        } catch (error) {
            console.error("Ошибка удаления места работы:", error);
            alert("Не удалось удалить место работы");
        }
    };

    if (!userData?.id || userData.userName === '...') {
        return <ProfileSkeleton />;
    }

    const currentTechStack = (userData.technologies && userData.technologies.length > 0)
        ? userData.technologies
        : ["No Techs Skills"];

    const projectsList = userData.projects || [];
    const experiencesList = userData.experiences || [];

    return (
        <div className="animate-fade-in">
            <div>
                <Titlebar title="Profile" />

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

                    <div className="flex flex-row items-end gap-6 relative z-10">
                        <div className="relative w-40 h-40 max-sm:w-30 max-sm:h-30 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] shadow-lg">
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
                                    className="absolute bottom-2 right-2 w-5 h-5 bg-white border-2 border-[#0a0a0a] rounded-full" 
                                    title="Online"
                                />
                            )}
                        </div>
                        <div className="mb-2 max-sm:mt-5">
                            <h2 className="text-2xl font-bold text-zinc-100">{userData.fullName}</h2>
                            <div className="flex flex-row items-center gap-2">
                                <p className="text-sm text-zinc-400">{UserNameNormalized}</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">{userData.watchersCount ?? userData.followers ?? 0} Watchers</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">{userData.watchingCount ?? userData.followings ?? 0} Watching</p>
                            </div>
                        </div>
                        <div className="ml-auto mb-5">
                            <button 
                                className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition cursor-pointer"
                                onClick={handleOpenEditProfile}
                            >
                                Edit Profile
                            </button>
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
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tech Stack</h3>
                            <button
                                onClick={handleOpenEditProfile}
                                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                            >
                                Edit stack
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

                    <div className="mt-8 border-b border-white/5 flex items-center gap-4 sm:gap-6">
                        <button
                            type="button"
                            onClick={() => setProfileTab('details')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer ${
                                profileTab === 'details'
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Sparkles size={14} className={profileTab === 'details' ? 'text-blue-400' : 'text-zinc-500'} />
                            <span>Details & Links</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setProfileTab('projects')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer ${
                                profileTab === 'projects'
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Code2 size={14} className={profileTab === 'projects' ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span>Featured Projects</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                profileTab === 'projects' ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'
                            }`}>
                                {projectsList.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setProfileTab('experience')}
                            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer ${
                                profileTab === 'experience'
                                    ? 'border-white text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Briefcase size={14} className={profileTab === 'experience' ? 'text-purple-400' : 'text-zinc-500'} />
                            <span>Experience</span>
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
                                        Details
                                    </h4>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Location</span>
                                                <span className="text-xs text-zinc-200 font-medium">
                                                    {userData.location || "Not specified"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <Briefcase size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Status</span>
                                                <span className="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                                    </span>
                                                    {userData.workStatus || "Open to opportunities"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Sparkles size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Focus</span>
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
                                                display: 'VK Profile', 
                                                url: userData.vkUrl.startsWith('http') ? userData.vkUrl : `https://${userData.vkUrl}`, 
                                                icon: Globe 
                                            },
                                            userData.xUrl && { 
                                                label: 'X (Twitter)', 
                                                display: 'X Profile', 
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
                                                label: 'Portfolio', 
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
                                                        Links & Contacts
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                        {userLinks.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {userLinks.length === 0 ? (
                                                        <p className="text-xs text-zinc-500 py-3 text-center">
                                                            No links added yet
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
                                                            <span>{isLinksExpanded ? "Show less" : `Show all (+${userLinks.length - 3})`}</span>
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
                                            Featured Projects
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
                                                            title="Предыдущие проекты"
                                                        >
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleScrollProjects('right')}
                                                            disabled={!canScrollProjectsRight}
                                                            className="p-1 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
                                                            title="Следующие проекты"
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
                                                        title="Режим карусели"
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
                                                        title="Режим сетки"
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
                                            <span>Add Project</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {projectsList.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
                                            <Code2 size={20} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-zinc-300">Проекты ещё не добавлены</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">Добавьте ваши pet-проекты, open-source библиотеки или коммерческие кейсы</p>
                                        </div>
                                        <button
                                            onClick={handleOpenAddProject}
                                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
                                        >
                                            Добавить проект
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
                                            Work Experience
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
                                        <span>Add Experience</span>
                                    </button>
                                </div>
                                
                                {experiencesList.length === 0 ? (
                                    <div className="p-8 border border-white/5 rounded-2xl bg-zinc-950/20 text-center flex flex-col items-center justify-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
                                            <Briefcase size={20} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-zinc-300">Опыт работы не указан</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">Расскажите о компаниях, должностях и задачах, над которыми вы работали</p>
                                        </div>
                                        <button
                                            onClick={handleOpenAddExperience}
                                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
                                        >
                                            Добавить опыт
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
                <Titlebar title="Activity" />
                <div>
                    <PublicBlock Avatar={userData.avatar} />
                                
                    <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                        {isPostsLoading ? (
                            <>
                                <PostSkeleton />
                                <PostSkeleton />
                            </>
                        ) : userPostsData.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-8 select-none">No posts yet</p>
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
                                Вы просмотрели все публикации
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isEditOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Edit Profile</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Customize your information, focus & tech stack</p>
                            </div>
                            <button 
                                onClick={() => setIsEditOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Avatar & Banner upload */}
                        <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-white/5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Avatar</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Banner</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    placeholder="Your Full Name"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Username</label>
                                <input
                                    type="text"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    placeholder="username"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Bio Headline</label>
                                <input
                                    type="text"
                                    value={editBioFirstLine}
                                    onChange={(e) => setEditBioFirstLine(e.target.value)}
                                    placeholder="e.g. Senior Software Engineer"
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">About You</label>
                                <textarea
                                    value={editBioSecondLine}
                                    onChange={(e) => setEditBioSecondLine(e.target.value)}
                                    placeholder="Tell something about your experience, passions..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Location</label>
                                    <input
                                        type="text"
                                        value={editLocation}
                                        onChange={(e) => setEditLocation(e.target.value)}
                                        placeholder="e.g. Moscow / Remote"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Work Status</label>
                                    <input
                                        type="text"
                                        value={editWorkStatus}
                                        onChange={(e) => setEditWorkStatus(e.target.value)}
                                        placeholder="e.g. Open to opportunities"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Focus / Specialization</label>
                                <input
                                    type="text"
                                    value={editFocus}
                                    onChange={(e) => setEditFocus(e.target.value)}
                                    placeholder="e.g. Fullstack & Realtime Architecture"
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Tech Stack Tags</label>
                                
                                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-zinc-950 border border-white/5">
                                    {editTechnologies.map((tech) => (
                                        <span 
                                            key={tech}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-zinc-200 border border-white/10"
                                        >
                                            {tech}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTech(tech)}
                                                className="hover:text-red-400 transition"
                                            >
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                    {editTechnologies.length === 0 && (
                                        <span className="text-xs text-zinc-600 self-center">Стек пока пуст</span>
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
                                        placeholder="Add technology (e.g. Docker, Redis)..."
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddTech(techInput)}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 transition"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1 pt-1">
                                    <span className="text-[10px] text-zinc-500 self-center mr-1">Suggestions:</span>
                                    {POPULAR_TECHS.filter(t => !editTechnologies.includes(t)).slice(0, 7).map(t => (
                                        <button
                                            type="button"
                                            key={t}
                                            onClick={() => handleAddTech(t)}
                                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition"
                                        >
                                            + {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-white/5 rounded-2xl p-3.5 bg-zinc-950/40">
                                <button
                                    type="button"
                                    onClick={() => setIsEditLinksOpen(!isEditLinksOpen)}
                                    className="w-full flex items-center justify-between text-left transition"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                            Social Links & Contacts
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 font-mono">
                                            {[editGithub, editTelegram, editVk, editX, editDiscord, editWebsite].filter(Boolean).length}/6
                                        </span>
                                    </div>
                                    <ChevronDown 
                                        size={14} 
                                        className={`text-zinc-500 transition-transform duration-200 ${isEditLinksOpen ? "rotate-180" : ""}`} 
                                    />
                                </button>

                                {isEditLinksOpen && (
                                    <div className="space-y-2 mt-3 pt-3 border-t border-white/5">
                                        <input
                                            type="text"
                                            value={editGithub}
                                            onChange={(e) => setEditGithub(e.target.value)}
                                            placeholder="GitHub URL (https://github.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                        <input
                                            type="text"
                                            value={editTelegram}
                                            onChange={(e) => setEditTelegram(e.target.value)}
                                            placeholder="Telegram URL (https://t.me/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                        <input
                                            type="text"
                                            value={editVk}
                                            onChange={(e) => setEditVk(e.target.value)}
                                            placeholder="VK URL (https://vk.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                        <input
                                            type="text"
                                            value={editX}
                                            onChange={(e) => setEditX(e.target.value)}
                                            placeholder="X / Twitter URL (https://x.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                        <input
                                            type="text"
                                            value={editDiscord}
                                            onChange={(e) => setEditDiscord(e.target.value)}
                                            placeholder="Discord URL (https://discord.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                        <input
                                            type="text"
                                            value={editWebsite}
                                            onChange={(e) => setEditWebsite(e.target.value)}
                                            placeholder="Portfolio / Website URL"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {isProjectModalOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-base font-bold text-zinc-100">
                                    {editingProjectId ? "Edit Project" : "Add Featured Project"}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Showcase your best builds and open source work</p>
                            </div>
                            <button 
                                onClick={() => setIsProjectModalOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProject} className="space-y-3.5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                        Project Screenshots & Cover {projectImages.length > 0 && `(${projectImages.length})`}
                                    </label>
                                    {projectImages.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => projectImageInputRef.current?.click()}
                                            disabled={isUploadingProjectImages}
                                            className="text-[11px] text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus size={12} />
                                            <span>Добавить ещё</span>
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
                                    <div className="space-y-2">
                                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-40 bg-zinc-950 group/preview">
                                            <img 
                                                src={projectImages[projectActivePreviewIndex]} 
                                                alt={`Preview ${projectActivePreviewIndex + 1}`} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-200">
                                                {projectActivePreviewIndex === 0 ? "★ Главная обложка" : `Скриншот ${projectActivePreviewIndex + 1}`}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProjectImage(projectActivePreviewIndex)}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 border border-white/10 text-white transition-all cursor-pointer"
                                                title="Удалить это изображение"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                            {projectImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setProjectActivePreviewIndex(idx)}
                                                    className={`relative w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 transition-all cursor-pointer ${
                                                        idx === projectActivePreviewIndex
                                                            ? 'border-white ring-2 ring-white/20 scale-102'
                                                            : 'border-white/10 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                                    {idx === 0 && (
                                                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center font-bold text-white py-0.5">
                                                            Обложка
                                                        </span>
                                                    )}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => projectImageInputRef.current?.click()}
                                                disabled={isUploadingProjectImages}
                                                className="w-14 h-14 rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-all flex-shrink-0 cursor-pointer"
                                                title="Добавить изображение"
                                            >
                                                {isUploadingProjectImages ? (
                                                    <Loader2 size={16} className="animate-spin text-white" />
                                                ) : (
                                                    <>
                                                        <Plus size={16} />
                                                        <span className="text-[9px] mt-0.5">+фото</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => projectImageInputRef.current?.click()}
                                        disabled={isUploadingProjectImages}
                                        className="w-full h-26 border border-dashed border-white/10 hover:border-white/20 rounded-xl bg-zinc-950/40 hover:bg-zinc-950/80 transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                                    >
                                        {isUploadingProjectImages ? (
                                            <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                <Loader2 size={18} className="animate-spin text-white" />
                                                <span className="text-xs">Загрузка изображений...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition">
                                                    <ImageIcon size={15} />
                                                </div>
                                                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition">
                                                    Загрузить скриншоты или обложку
                                                </span>
                                                <span className="text-[10px] text-zinc-500">PNG, JPG, WebP — можно выбрать несколько файлов</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Project Name *</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g. CloudPulse Dashboard"
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={projectDesc}
                                    onChange={(e) => setProjectDesc(e.target.value)}
                                    placeholder="Brief overview of the project, architecture and features..."
                                    rows={3}
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">GitHub Link</label>
                                    <input
                                        type="text"
                                        value={projectGithub}
                                        onChange={(e) => setProjectGithub(e.target.value)}
                                        placeholder="https://github.com/..."
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Live / NPM Link</label>
                                    <input
                                        type="text"
                                        value={projectLive}
                                        onChange={(e) => setProjectLive(e.target.value)}
                                        placeholder="https://npm... or demo link"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Technologies Used</label>
                                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-950 border border-white/10 min-h-[36px]">
                                    {projectTechs.map((t, idx) => (
                                        <span key={`${t}-${idx}`} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-200">
                                            {t}
                                            <button 
                                                type="button" 
                                                onClick={() => setProjectTechs(prev => prev.filter((_, i) => i !== idx))}
                                                className="hover:text-red-400"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    {projectTechs.length === 0 && (
                                        <span className="text-[11px] text-zinc-600">No tags added yet</span>
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
                                        placeholder="Add tag (e.g. Next.js, Redis) and press Enter"
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (projectTechInput.trim() && !projectTechs.includes(projectTechInput.trim())) {
                                                setProjectTechs(prev => [...prev, projectTechInput.trim()]);
                                                setProjectTechInput('');
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingProject}
                                className="w-full py-2.5 mt-4 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isSavingProject ? "Saving..." : (editingProjectId ? "Update Project" : "Add Project")}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {isExpModalOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-base font-bold text-zinc-100">
                                    {editingExpId ? "Edit Experience" : "Add Work Experience"}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Share your previous engineering or design roles</p>
                            </div>
                            <button 
                                onClick={() => setIsExpModalOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExperience} className="space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Company Name *</label>
                                <input
                                    type="text"
                                    value={expCompanyName}
                                    onChange={(e) => setExpCompanyName(e.target.value)}
                                    placeholder="e.g. Yandex, Tinkoff, Acme Corp"
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Position / Role *</label>
                                <input
                                    type="text"
                                    value={expPosition}
                                    onChange={(e) => setExpPosition(e.target.value)}
                                    placeholder="e.g. Senior Backend Engineer"
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Mode</label>
                                    <select
                                        value={expMode}
                                        onChange={(e) => setExpMode(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Period / Years *</label>
                                    <input
                                        type="text"
                                        value={expPeriod}
                                        onChange={(e) => setExpPeriod(e.target.value)}
                                        placeholder="e.g. 2024 - Present"
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={expDesc}
                                    onChange={(e) => setExpDesc(e.target.value)}
                                    placeholder="What did you work on, key achievements, technologies..."
                                    rows={3}
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/25 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingExp}
                                className="w-full py-2.5 mt-4 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isSavingExp ? "Saving..." : (editingExpId ? "Update Experience" : "Add Experience")}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}