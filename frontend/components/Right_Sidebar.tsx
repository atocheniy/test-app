'use client';

import { useApplication } from '@/context/ApplicationContext';
import { Briefcase, ExternalLink, Sparkles, TrendingUp, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RightSidebar() {
    const { onlineUsers } = useApplication();

    const trends = [
        { tag: '#nextjs15', posts: '2.4k posts', category: 'Frontend' },
        { tag: '#dotnet9', posts: '1.8k posts', category: 'Backend' },
        { tag: '#postgresql', posts: '940 posts', category: 'Database' },
        { tag: '#signalr', posts: '512 posts', category: 'Realtime' },
    ];

    const suggestedUsers = [
        { id: '1', name: 'First User', userName: 'first', avatar: '', stack: 'Fullstack' },
        { id: '2', name: 'Second User', userName: 'second', avatar: '', stack: 'UI/UX Lead' },
        { id: '3', name: 'Third User', userName: 'third', avatar: '', stack: '.NET Core' },
    ];

    const vacancies = [
        { title: 'Senior .NET / Next.js Dev', company: 'Nexus Tech', salary: '$4,500 - $6,000', remote: true },
        { title: 'Lead Frontend Engineer', company: 'CyberWave', salary: '$5,000+', remote: true },
    ];

    return (
        <aside className="hidden lg:block w-80 p-4 text-zinc-400">
            <div className="sticky top-6 space-y-4">
                
                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center gap-2 mb-3 text-zinc-100 font-bold text-sm">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span>Trending Topics</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {trends.map((item, i) => (
                            <Link 
                                key={i} 
                                href={`/search?q=${item.tag.replace('#', '')}`}
                                className="group flex justify-between items-center hover:bg-white/5 p-1.5 -mx-1.5 rounded-lg transition"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-500">{item.category}</span>
                                    <span className="text-sm font-medium text-zinc-200 group-hover:text-blue-400 transition">
                                        {item.tag}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                                    {item.posts}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                            <Sparkles size={16} className="text-amber-400" />
                            <span>Who to follow</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {suggestedUsers.map(user => {
                            const isOnline = onlineUsers?.includes(user.userName);

                            return (
                                <div key={user.id} className="flex items-center justify-between gap-2">
                                    <Link href={`/profile/${user.userName}`} className="flex items-center gap-2.5 min-w-0 group">
                                        <div className="relative w-9 h-9 shrink-0">
                                            <div className="w-full h-full rounded-full object-cover bg-zinc-800">

                                            </div>
                                           
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0e0e0e] rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                                                {user.name}
                                            </span>
                                            <span className="text-[11px] text-zinc-500 truncate">
                                                @{user.userName} · <span className="text-zinc-400">{user.stack}</span>
                                            </span>
                                        </div>
                                    </Link>

                                    <button className="p-1.5 rounded-full bg-white/5 hover:bg-white text-zinc-300 hover:text-black transition active:scale-95 shrink-0">
                                        <UserPlus size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border border-white/5 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                            <Briefcase size={16} className="text-emerald-400" />
                            <span>Vacancies</span>
                        </div>
                        <Link href="/vacancies" className="text-[11px] text-zinc-500 hover:text-zinc-300 transition">
                            View all
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {vacancies.map((job, idx) => (
                            <Link 
                                key={idx} 
                                href="/vacancies"
                                className="group p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition flex flex-col gap-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition">
                                        {job.title}
                                    </span>
                                    <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-300 transition" />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                    <span>{job.company}</span>
                                    <span className="text-emerald-400 font-medium">{job.salary}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="px-2 text-[11px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/terms" className="hover:underline">Terms</Link>
                    <Link href="/privacy" className="hover:underline">Privacy</Link>
                    <Link href="/about" className="hover:underline">About</Link>
                    <span>© 2026 My site _____</span>
                </div>

            </div>
        </aside>
    );
}