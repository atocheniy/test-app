'use client';

import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import {
    ArrowUpRight,
    Briefcase,
    Code2,
    MessageSquare,
    Plus,
    Sparkles
} from "lucide-react";
import Link from "next/link";

export default function Home() {
    const { userData, onlineUsers } = useApplication();
    const isUserLoading = !userData?.id || userData.userName === '...';

    const quickActions = [
        {
            title: "Write a Post",
            desc: "Share your thoughts or code snippets with the community",
            icon: Code2,
            color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
            href: "/feed",
            btnText: "New Post"
        },
        {
            title: "Live Messenger",
            desc: `Chat in real-time with ${onlineUsers?.length || 0} active developers online`,
            icon: MessageSquare,
            color: "from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20",
            href: "/messages",
            btnText: "Open Chats"
        },
        {
            title: "Explore Vacancies",
            desc: "Discover new remote opportunities tailored for your stack",
            icon: Briefcase,
            color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
            href: "/vacancies",
            btnText: "Browse Jobs"
        },
        {
            title: "Complete Profile",
            desc: "Add your tech stack, GitHub links, and bio to stand out",
            icon: Sparkles,
            color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
            href: `/profile/${userData?.userName}`,
            btnText: "Edit Profile"
        }
    ];

    return (
        <div className="flex flex-col min-h-full pb-10 animate-fade-in">
            <Titlebar title="Dashboard" />

            <div className="p-6 max-w-5xl space-y-6">
                
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8 backdrop-blur-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Branch of Workspace
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span>Welcome back,</span>
                                {isUserLoading ? (
                                    <span className="inline-block h-7 md:h-8 w-36 bg-white/10 rounded-xl animate-pulse align-middle" />
                                ) : (
                                    <span className="text-zinc-100">{userData.fullName}</span>
                                )}!
                            </h1>
                            <p className="text-sm text-zinc-400 max-w-md">
                                Central hub for sharing code, chatting with colleagues, and exploring career opportunities.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link 
                                href="/feed"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition active:scale-95 shadow-lg shadow-white/10"
                            >
                                <Plus size={16} />
                                Create Post
                            </Link>
                        </div>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-1">
                        Recommended Actions
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link 
                                    key={index}
                                    href={action.href}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${action.color}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="p-2 rounded-full text-zinc-500 group-hover:text-white group-hover:bg-white/10 transition">
                                                <ArrowUpRight size={18} />
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition">
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                            {action.desc}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-medium text-zinc-300 group-hover:underline">
                                            {action.btnText}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}