'use client';

import Modal from "@/components/Modal";
import Titlebar from "@/components/titlebar";
import { useLanguage } from "@/context/LanguageContext";
import { CommunityService } from "@/services/communityService";
import { isCompanyEntity } from "@/types/auth";
import {
    AlertCircle,
    ArrowUpRight,
    Bookmark,
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

export default function OtherPage() {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    const [mounted, setMounted] = useState(false);
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [communityDesc, setCommunityDesc] = useState("");
    const [createType, setCreateType] = useState<number>(0);
    const [createPostingPolicy, setCreatePostingPolicy] = useState<number>(0);
    const [createKind, setCreateKind] = useState<number>(0);
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
            setFormError(isRu ? "Укажите название" : "Please enter a name");
            return;
        }

        if (!communitySlug.trim()) {
            setFormError(isRu ? "Укажите URL (slug)" : "Please enter a URL (slug)");
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
            setFormError(msg || (isRu ? "Не удалось создать. Возможно, этот URL уже занят." : "Failed to create. Perhaps this URL is already taken."));
        } finally {
            setIsCreating(false);
        }
    };

    const hubServices = [
        {
            title: isRu ? "Сохранённые закладки" : "Saved Bookmarks",
            desc: isRu ? "Доступ к вашим сохранённым сниппетам кода, архитектурным постам и обсуждениям" : "Access your saved code snippets, architectural posts, and discussions",
            icon: Bookmark,
            color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
            href: "/bookmarks",
            btnText: isRu ? "Открыть сохранённое" : "Open Saved"
        },
        {
            title: isRu ? "Хакатоны и события" : "Hackathons & Events",
            desc: isRu ? "Участвуйте в кодинг-джемах выходного дня, онлайн-митапах и лайв-докладах" : "Participate in weekend coding jams, online meetups, and live talks",
            icon: Calendar,
            color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
            href: "/events",
            btnText: isRu ? "Смотреть события" : "Explore Events"
        },
        {
            title: isRu ? "API разработчика и вебхуки" : "Developer API & Webhooks",
            desc: isRu ? "Создавайте собственных ботов, интегрируйте ленты SignalR и автоматизируйте рабочий процесс" : "Build custom bots, integrate SignalR feeds, and automate your workflow",
            icon: Terminal,
            color: "from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20",
            href: "/docs/api",
            btnText: isRu ? "Открыть документацию" : "View Documentation"
        },
        {
            title: isRu ? "Идеи и предложения" : "Feature Requests & Ideas",
            desc: isRu ? "Голосуйте за будущие функции платформы и предлагайте свои улучшения" : "Vote on upcoming platform features and suggest your improvements",
            icon: MessageSquareHeart,
            color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
            href: "/feedback",
            btnText: isRu ? "Предложить идею" : "Suggest Feature"
        }
    ];

    const sampleCommunities = [
        {
            id: 'dotnet-architects',
            name: ".NET Architecture & Highload",
            tag: "csharp",
            members: isRu ? "1.4k участников" : "1.4k members",
            desc: isRu ? "Глубокое погружение в C# 13, ASP.NET Core, тюнинг EF Core и распределённые системы." : "Deep-dives into C# 13, ASP.NET Core, EF Core tuning, and distributed systems.",
            bannerColor: "from-purple-600/30 via-indigo-600/20 to-transparent",
            icon: Layers
        },
        {
            id: 'react-next-wizards',
            name: "Next.js & Frontend Lab",
            tag: "frontend",
            members: isRu ? "2.1k участников" : "2.1k members",
            desc: isRu ? "Server Components, Turbopack, стилизация Tailwind CSS и клиентская производительность." : "Server Components, Turbopack, Tailwind CSS styling, and client-side performance.",
            bannerColor: "from-sky-600/30 via-cyan-600/20 to-transparent",
            icon: Compass
        },
        {
            id: 'opensource-contributors',
            name: "Open Source Builders",
            tag: "opensource",
            members: isRu ? "850 участников" : "850 members",
            desc: isRu ? "Совместная работа над pet-проектами, поиск кофаундеров и ревью пулл-реквестов." : "Collaborate on pet projects, find co-founders, and review pull requests.",
            bannerColor: "from-emerald-600/30 via-teal-600/20 to-transparent",
            icon: Users
        }
    ];

    return (
        <div className="flex flex-col min-h-full pb-14 animate-fade-in min-w-0 w-full overflow-x-hidden">
            <Titlebar title={t.explore.title} />

            <div className="p-4 sm:p-6 max-w-5xl space-y-8 min-w-0">
                
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-6 md:p-8 backdrop-blur-xl bg-white/[0.01]">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                {isRu ? "Экосистема сообществ" : "Community Ecosystem"}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                {isRu ? "Компании, сообщества и ресурсы" : "Companies, Communities & Resources"}
                            </h1>
                            <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                                {isRu ? "Присоединяйтесь к профильным кругам разработчиков, сохраняйте важные сниппеты, участвуйте в хакатонах или создайте своё сообщество." : "Join specialized developer circles, save important snippets, participate in hackathons, or launch your own community."}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button 
                                onClick={() => setIsCreateCommunityOpen(true)}
                                className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
                            >
                                <Plus size={16} />
                                {isRu ? "Создать сообщество" : "Create Community"}
                            </button>
                        </div>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap px-1">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-zinc-400" />
                            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                {isRu ? "Избранные сообщества" : "Featured Communities"}
                            </h2>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono">
                            {isRu ? `${communities.length} всего` : `${communities.length} total`}
                        </span>
                    </div>

                    {isLoadingCommunities ? (
                        <div className="p-8 text-center text-xs text-zinc-500">{isRu ? "Загрузка сообществ..." : "Loading communities..."}</div>
                    ) : communities.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.01]">
                            {isRu ? "Сообществ пока нет. Создай первое прямо сейчас!" : "No communities yet. Create the first one right now!"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {communities.map((club) => (
                                <Link
                                    key={club.id}
                                    href={`/c/${club.slug}`}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                                >
                                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                                    <div>
                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
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
                                                        {isRu ? "Компания" : "Company"}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-mono text-zinc-500">
                                                    {club.membersCount} {isCompanyEntity(club.kind) ? (isRu ? 'сотрудников' : 'employees') : (isRu ? 'участников' : 'members')}
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
                                            {club.description || (isRu ? "Описание отсутствует" : "No description provided")}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-mono text-zinc-500 truncate min-w-0">c/{club.slug}</span>
                                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/5 group-hover:bg-white text-zinc-300 group-hover:text-black transition shrink-0">
                                            {isRu ? "Открыть" : "Open"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-2">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider px-1">
                        {isRu ? "Инструменты и быстрые переходы" : "Ecosystem Tools & Shortcuts"}
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

            <Modal
                isOpen={isCreateCommunityOpen}
                onClose={() => {
                    setIsCreateCommunityOpen(false);
                    setFormError(null);
                }}
                className="w-full max-w-[900px] max-h-[90vh] bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 relative"
            >
                        <div className="md:col-span-4 bg-white/[0.015] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between gap-4">
                            <div className="space-y-4">
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                    {isRu ? "Превью карточки" : "Live Card Preview"}
                                </span>

                                <div className="rounded-2xl border border-white/10 bg-[#050505]/90 overflow-hidden shadow-xl">
                                    <div className="h-20 w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black relative" />
                                    <div className="p-4 pt-0">
                                        <div className="flex items-end justify-between gap-2 -mt-7 mb-2.5 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl ring-4 ring-[#050505] bg-neutral-800 flex items-center justify-center text-base font-bold text-neutral-200 shadow-lg">
                                                {communityName?.[0]?.toUpperCase() || (createKind === 1 ? "C" : "G")}
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300">
                                                {createKind === 1 ? (isRu ? "Компания" : "Company") : (isRu ? "Сообщество" : "Community")}
                                            </span>
                                        </div>

                                        <div className="text-sm font-bold text-neutral-100 truncate">
                                            {communityName || (createKind === 1 ? "Nexus Tech" : "Golang Guild")}
                                        </div>
                                        <div className="text-xs text-neutral-500 font-mono truncate">
                                            /c/{communitySlug || (createKind === 1 ? "nexustech" : "golang-guild")}
                                        </div>

                                        <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                                            {communityDesc || (createKind === 1 ? (isRu ? "Профиль компании, вакансии и команда" : "Company profile, jobs & team") : (isRu ? "Пространство для публикаций и обсуждений" : "Space for posts & discussions"))}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                        {isRu ? "Тип пространства" : "Space Type"}
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCreateKind(0)}
                                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                                createKind === 0
                                                    ? "border-white/30 bg-white/10 text-white"
                                                    : "border-white/10 bg-[#050505]/90 text-neutral-400 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <Users size={14} className="text-neutral-200" />
                                                {isRu ? "Сообщество" : "Community"}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "Клуб, гильдия, хаб по интересам" : "Club, guild, interest hub"}</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCreateKind(1)}
                                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                                createKind === 1
                                                    ? "border-white/30 bg-white/10 text-white"
                                                    : "border-white/10 bg-[#050505]/90 text-neutral-400 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <Building2 size={14} className="text-emerald-400" />
                                                {isRu ? "Компания" : "Company"}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "Работодатель, вакансии, команда" : "Employer, vacancies, team"}</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-neutral-500 hidden md:block leading-relaxed">
                                {isRu ? "Аватар и обложку можно будет загрузить сразу после создания." : "You can upload a custom avatar & banner right after creation."}
                            </p>
                        </div>

                        <div className="md:col-span-8 p-6 sm:p-7 overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="flex justify-between items-start gap-4 pb-4 mb-5 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-100 tracking-tight">{isRu ? "Создать сообщество или компанию" : "Create Community or Company"}</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{isRu ? "Настройте адрес, описание и права доступа" : "Configure URL slug, description and permissions"}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsCreateCommunityOpen(false);
                                        setFormError(null);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {formError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                            {createKind === 1 ? (isRu ? "Название компании" : "Company Name") : (isRu ? "Название сообщества" : "Community Name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={communityName}
                                            onChange={handleNameChange}
                                            placeholder={createKind === 1 ? "e.g. Nexus Tech" : "e.g. Golang Highload Guild"}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] text-neutral-100 text-sm border border-white/10 focus:outline-none focus:border-white/25"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                            URL (Slug)
                                        </label>
                                        <div className="flex items-center rounded-xl bg-white/[0.02] border border-white/10 px-3.5 focus-within:border-white/25">
                                            <span className="text-xs text-neutral-500 font-mono select-none shrink-0 whitespace-nowrap pr-1">/c/</span>
                                            <input
                                                type="text"
                                                value={communitySlug}
                                                onChange={(e) => setCommunitySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                placeholder={createKind === 1 ? "nexustech" : "golang-guild"}
                                                required
                                                className="w-full py-2.5 pl-1 text-neutral-100 text-sm bg-transparent focus:outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                        {createKind === 1 ? (isRu ? "О компании" : "About Company") : (isRu ? "Описание и темы" : "Description & Topics")}
                                    </label>
                                    <textarea
                                        value={communityDesc}
                                        onChange={(e) => setCommunityDesc(e.target.value)}
                                        placeholder={createKind === 1 ? (isRu ? "Чем занимается компания, какие проекты разрабатывает..." : "What does the company do, what projects does it build...") : (isRu ? "О чем сообщество? Кому будет интересно?" : "What is the community about? Who is it for?")}
                                        rows={4}
                                        required
                                        className="w-full min-h-[116px] px-3.5 py-2.5 rounded-xl bg-white/[0.02] text-neutral-100 text-sm leading-relaxed border border-white/10 focus:outline-none focus:border-white/25 resize-y"
                                    />
                                </div>

                                {createKind === 1 && (
                                    <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                                    {isRu ? "Сайт компании" : "Company Website"}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={companyWebsite}
                                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                                    placeholder="https://company.com"
                                                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                                    {isRu ? "Локация / Штаб-квартира" : "Location / HQ"}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={companyLocation}
                                                    onChange={(e) => setCompanyLocation(e.target.value)}
                                                    placeholder={isRu ? "Москва / Remote" : "Moscow / Remote"}
                                                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                                    {isRu ? "Сфера / Индустрия" : "Industry"}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={companyIndustry}
                                                    onChange={(e) => setCompanyIndustry(e.target.value)}
                                                    placeholder={isRu ? "IT, Финтех, AI" : "IT, Fintech, AI"}
                                                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                                    {isRu ? "Размер компании" : "Company Size"}
                                                </label>
                                                <select
                                                    value={companySize}
                                                    onChange={(e) => setCompanySize(e.target.value)}
                                                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505]/90 text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/25"
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                            {isRu ? "Доступ" : "Access"}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCreateType(0)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                    createType === 0
                                                        ? "border-white/30 bg-white/10 text-white"
                                                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                                    <Globe size={13} />
                                                    {isRu ? "Публичное" : "Public"}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "Вход без заявок" : "Open to join"}</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCreateType(1)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                    createType === 1
                                                        ? "border-white/30 bg-white/10 text-white"
                                                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                                    <Lock size={13} />
                                                    {isRu ? "Ограниченное" : "Restricted"}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "По заявкам" : "By request"}</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                                            {isRu ? "Публикация записей" : "Posting Policy"}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCreatePostingPolicy(0)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                    createPostingPolicy === 0
                                                        ? "border-white/30 bg-white/10 text-white"
                                                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                                    <Users size={13} />
                                                    {isRu ? "Все участники" : "All Members"}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "Любой участник" : "Any member"}</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCreatePostingPolicy(1)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                    createPostingPolicy === 1
                                                        ? "border-white/30 bg-white/10 text-white"
                                                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                                    <ShieldCheck size={13} />
                                                    {isRu ? "Администрация" : "Admins Only"}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-0.5">{isRu ? "Админы и модеры" : "Admins & mods"}</div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateCommunityOpen(false);
                                            setFormError(null);
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                                    >
                                        {t.common.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                    >
                                        {isCreating ? (isRu ? "Создание..." : "Creating...") : (createKind === 1 ? (isRu ? "Создать компанию" : "Create Company") : (isRu ? "Создать сообщество" : "Create Community"))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Modal>
        </div>
    );
}
