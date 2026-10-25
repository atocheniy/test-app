'use client';

import Titlebar from "@/components/titlebar";
import { CommunityService } from "@/services/communityService";
import { isCompanyEntity } from "@/types/auth";
import {
    AlertCircle,
    ArrowUpRight,
    Bookmark,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Compass,
    Globe,
    Layers,
    Lock,
    MessageSquareHeart,
    Plus,
    ShieldCheck,
    Terminal,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function OtherPage() {
    const [mounted, setMounted] = useState(false);
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [communityDesc, setCommunityDesc] = useState("");
    const [createType, setCreateType] = useState<number>(0);
    const [createPostingPolicy, setCreatePostingPolicy] = useState<number>(0);
    const [createKind, setCreateKind] = useState<number>(0); // 0 Community, 1 Company
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");
    const [companyIndustry, setCompanyIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const [communities, setCommunities] = useState<any[]>([]);
    const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);

    const router = useRouter();
    const [communitySlug, setCommunitySlug] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadCommunities();
    }, []);

    const loadCommunities = async () => {
        try {
            const data = await CommunityService.getAll();
            setCommunities(data || []);
        } catch (err) {
            console.error("Ошибка загрузки сообществ:", err);
        } finally {
            setIsLoadingCommunities(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCommunityName(val);
        const autoSlug = val
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        setCommunitySlug(autoSlug);
    };

    const handleCreateCommunitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!communityName.trim()) {
            setFormError("Укажите название");
            return;
        }

        if (!communitySlug.trim()) {
            setFormError("Укажите URL (slug)");
            return;
        }

        setIsCreating(true);
        try {
            const res = await CommunityService.createCommunity({
                name: communityName.trim(),
                slug: communitySlug.trim().toLowerCase(),
                description: communityDesc.trim(),
                type: createType,
                postingPolicy: createPostingPolicy,
                kind: createKind,
                websiteUrl: createKind === 1 ? companyWebsite.trim() : undefined,
                location: createKind === 1 ? companyLocation.trim() : undefined,
                industry: createKind === 1 ? companyIndustry.trim() : undefined,
                companySize: createKind === 1 ? companySize.trim() : undefined,
            });

            setIsCreateCommunityOpen(false);
            setCommunityName("");
            setCommunitySlug("");
            setCommunityDesc("");
            setCreateType(0);
            setCreatePostingPolicy(0);
            setCreateKind(0);
            setCompanyWebsite("");
            setCompanyLocation("");
            setCompanyIndustry("");
            setCompanySize("");
            setFormError(null);

            router.push(`/c/${res.slug}`);
        } catch (error: any) {
            console.error("Ошибка создания сообщества:", error);
            const msg = error.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : null);
            setFormError(msg || "Не удалось создать. Возможно, этот URL уже занят.");
        } finally {
            setIsCreating(false);
        }
    };

    const hubServices = [
        {
            title: "Saved Bookmarks",
            desc: "Access your saved code snippets, architectural posts, and discussions",
            icon: Bookmark,
            color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
            href: "/bookmarks",
            btnText: "Open Saved"
        },
        {
            title: "Hackathons & Events",
            desc: "Participate in weekend coding jams, online meetups, and live talks",
            icon: Calendar,
            color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
            href: "/events",
            btnText: "Explore Events"
        },
        {
            title: "Developer API & Webhooks",
            desc: "Build custom bots, integrate SignalR feeds, and automate your workflow",
            icon: Terminal,
            color: "from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20",
            href: "/docs/api",
            btnText: "View Documentation"
        },
        {
            title: "Feature Requests & Ideas",
            desc: "Vote on upcoming platform features and suggest your improvements",
            icon: MessageSquareHeart,
            color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
            href: "/feedback",
            btnText: "Suggest Feature"
        }
    ];

    const sampleCommunities = [
        {
            id: 'dotnet-architects',
            name: ".NET Architecture & Highload",
            tag: "csharp",
            members: "1.4k members",
            desc: "Deep-dives into C# 13, ASP.NET Core, EF Core tuning, and distributed systems.",
            bannerColor: "from-purple-600/30 via-indigo-600/20 to-transparent",
            icon: Layers
        },
        {
            id: 'react-next-wizards',
            name: "Next.js & Frontend Lab",
            tag: "frontend",
            members: "2.1k members",
            desc: "Server Components, Turbopack, Tailwind CSS styling, and client-side performance.",
            bannerColor: "from-sky-600/30 via-cyan-600/20 to-transparent",
            icon: Compass
        },
        {
            id: 'opensource-contributors',
            name: "Open Source Builders",
            tag: "opensource",
            members: "850 members",
            desc: "Collaborate on pet projects, find co-founders, and review pull requests.",
            bannerColor: "from-emerald-600/30 via-teal-600/20 to-transparent",
            icon: Users
        }
    ];

    return (
        <div className="flex flex-col min-h-full pb-14 animate-fade-in">
            <Titlebar title="Explore Hub" />

            <div className="p-4 sm:p-6 max-w-5xl space-y-8">
                
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8 backdrop-blur-xl bg-white/[0.01]">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Community Ecosystem
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Guilds, Communities & Resources
                            </h1>
                            <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                                Join specialized developer circles, save important snippets, participate in hackathons, or launch your own community.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button 
                                onClick={() => setIsCreateCommunityOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
                            >
                                <Plus size={16} />
                                Create Community
                            </button>
                        </div>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-zinc-400" />
                            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                Featured Communities
                            </h2>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono">
                            {communities.length} total
                        </span>
                    </div>

                    {isLoadingCommunities ? (
                        <div className="p-8 text-center text-xs text-zinc-500">Загрузка сообществ...</div>
                    ) : communities.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                            Сообществ пока нет. Создай первое прямо сейчас!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {communities.map((club) => (
                                <Link
                                    key={club.id}
                                    href={`/c/${club.slug}`}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                                >
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl border border-white/10 bg-black/40 text-zinc-200 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                                {club.avatar ? (
                                                    <img src={club.avatar} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <span>{club.name[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isCompanyEntity(club.kind) && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <Building2 size={10} />
                                                        Компания
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-mono text-zinc-500">
                                                    {club.membersCount} {isCompanyEntity(club.kind) ? 'сотрудников' : 'участников'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition line-clamp-1">
                                                {club.name}
                                            </h3>
                                            {club.isVerified && (
                                                <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                                            )}
                                        </div>
                                        {club.location && (
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{club.location}</p>
                                        )}
                                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                                            {club.description || "No description provided"}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[11px] font-mono text-zinc-500">c/{club.slug}</span>
                                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/5 group-hover:bg-white text-zinc-300 group-hover:text-black transition">
                                            Open
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-2">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider px-1">
                        Ecosystem Tools & Shortcuts
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hubServices.map((service, index) => {
                            const Icon = service.icon;
                            return (
                                <Link 
                                    key={index}
                                    href={service.href}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${service.color}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="p-2 rounded-full text-zinc-500 group-hover:text-white group-hover:bg-white/10 transition">
                                                <ArrowUpRight size={18} />
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition">
                                            {service.title}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                            {service.desc}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-medium text-zinc-300 group-hover:underline">
                                            {service.btnText}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </div>

            {isCreateCommunityOpen && mounted && createPortal(
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Create Community</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Start a space for your tech stack or guild</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsCreateCommunityOpen(false);
                                    setFormError(null);
                                }}
                                className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    Тип пространства
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCreateKind(0)}
                                        className={`p-3 rounded-xl border text-left transition ${
                                            createKind === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <Users size={14} className="text-blue-400" />
                                            Сообщество
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">Клуб, гильдия, хаб по интересам</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateKind(1)}
                                        className={`p-3 rounded-xl border text-left transition ${
                                            createKind === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <Building2 size={14} className="text-emerald-400" />
                                            Компания
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">Работодатель, вакансии, команда</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    {createKind === 1 ? "Название компании" : "Название сообщества"}
                                </label>
                                <input
                                    type="text"
                                    value={communityName}
                                    onChange={handleNameChange}
                                    placeholder={createKind === 1 ? "e.g. Nexus Tech" : "e.g. Golang Highload Guild"}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    URL (Slug)
                                </label>
                                <div className="flex items-center rounded-xl bg-zinc-950 border border-white/5 px-3 focus-within:border-white/20">
                                    <span className="text-xs text-zinc-500 font-mono select-none shrink-0 whitespace-nowrap pr-1">/c/</span>
                                    <input
                                        type="text"
                                        value={communitySlug}
                                        onChange={(e) => setCommunitySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        placeholder={createKind === 1 ? "nexustech" : "golang-guild"}
                                        required
                                        className="w-full py-2.5 pl-1 text-zinc-100 text-sm bg-transparent focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    {createKind === 1 ? "О компании" : "Описание и темы"}
                                </label>
                                <textarea
                                    value={communityDesc}
                                    onChange={(e) => setCommunityDesc(e.target.value)}
                                    placeholder={createKind === 1 ? "Чем занимается компания, какие проекты разрабатывает..." : "О чем сообщество? Кому будет интересно?"}
                                    rows={3}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>

                            {createKind === 1 && (
                                <div className="space-y-3 pt-1 border-t border-white/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                                Сайт компании
                                            </label>
                                            <input
                                                type="url"
                                                value={companyWebsite}
                                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                                placeholder="https://company.com"
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                                Локация / Штаб-квартира
                                            </label>
                                            <input
                                                type="text"
                                                value={companyLocation}
                                                onChange={(e) => setCompanyLocation(e.target.value)}
                                                placeholder="Москва / Remote"
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                                Сфера / Индустрия
                                            </label>
                                            <input
                                                type="text"
                                                value={companyIndustry}
                                                onChange={(e) => setCompanyIndustry(e.target.value)}
                                                placeholder="IT, Финтех, AI"
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                                Размер компании
                                            </label>
                                            <select
                                                value={companySize}
                                                onChange={(e) => setCompanySize(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                            >
                                                <option value="">Не указано</option>
                                                <option value="1-10">1-10 сотрудников</option>
                                                <option value="11-50">11-50 сотрудников</option>
                                                <option value="51-200">51-200 сотрудников</option>
                                                <option value="201-1000">201-1000 сотрудников</option>
                                                <option value="1000+">1000+ сотрудников</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    Доступ
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCreateType(0)}
                                        className={`p-2.5 rounded-xl border text-left transition ${
                                            createType === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <Globe size={13} />
                                            Публичное
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">Вход без заявок</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateType(1)}
                                        className={`p-2.5 rounded-xl border text-left transition ${
                                            createType === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <Lock size={13} />
                                            Ограниченное
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">По заявкам</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    Публикация записей
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCreatePostingPolicy(0)}
                                        className={`p-2.5 rounded-xl border text-left transition ${
                                            createPostingPolicy === 0
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <Users size={13} />
                                            Все участники
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">Любой член группы</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreatePostingPolicy(1)}
                                        className={`p-2.5 rounded-xl border text-left transition ${
                                            createPostingPolicy === 1
                                                ? "border-white/30 bg-white/10 text-white"
                                                : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="text-xs font-semibold flex items-center gap-1.5">
                                            <ShieldCheck size={13} />
                                            Администрация
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">Админы и модеры</div>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition active:scale-98 disabled:opacity-50"
                            >
                                {isCreating ? "Создание..." : (createKind === 1 ? "Создать компанию" : "Создать сообщество")}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}