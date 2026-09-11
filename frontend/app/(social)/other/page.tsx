'use client';

import Titlebar from "@/components/titlebar";
import {
    ArrowUpRight,
    Bookmark,
    Calendar,
    Compass,
    Layers,
    MessageSquareHeart,
    Plus,
    Terminal,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function OtherPage() {
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [communityDesc, setCommunityDesc] = useState("");

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

    const handleCreateCommunitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Сообщество "${communityName}" будет создано!`);
        setIsCreateCommunityOpen(false);
        setCommunityName("");
        setCommunityDesc("");
    };

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
                        <span className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition">
                            View All
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sampleCommunities.map((club) => {
                            const IconComponent = club.icon;
                            return (
                                <div
                                    key={club.id}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                                >
                                    <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${club.bannerColor} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2.5 rounded-xl border border-white/10 bg-black/40 text-zinc-200">
                                                <IconComponent size={18} />
                                            </div>
                                            <span className="text-[11px] font-mono text-zinc-500">
                                                {club.members}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition">
                                            {club.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                                            {club.desc}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-zinc-500">#{club.tag}</span>
                                        <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white text-zinc-300 hover:text-black transition">
                                            Join
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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

            {isCreateCommunityOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
                    <div className="w-full max-w-[460px] bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Create Community</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Start a space for your tech stack or guild</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateCommunityOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    Community Name
                                </label>
                                <input
                                    type="text"
                                    value={communityName}
                                    onChange={(e) => setCommunityName(e.target.value)}
                                    placeholder="e.g. Golang Highload Guild"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                    Description & Topics
                                </label>
                                <textarea
                                    value={communityDesc}
                                    onChange={(e) => setCommunityDesc(e.target.value)}
                                    placeholder="What is this community about? Who should join?"
                                    rows={3}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition active:scale-98"
                            >
                                Launch Community
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}