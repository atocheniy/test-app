'use client';

import Titlebar from "@/components/titlebar";
import {
    ArrowUpRight,
    Sparkles,
    TrendingUp,
    X
} from 'lucide-react';
import { useState } from 'react';

export default function Search() {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts' | 'tags' | 'jobs'>('all');

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'people', label: 'People' },
        { id: 'posts', label: 'Posts & Code' },
        { id: 'tags', label: 'Tags' },
        { id: 'jobs', label: 'Jobs' },
    ];

    const trendingTopics = [
        { tag: '#dotnet9', category: 'Backend Architecture', count: '8.4k posts', isHot: true },
        { tag: '#nextjs15', category: 'Web Development', count: '12.1k posts', isHot: false },
        { tag: '#remotejobs', category: 'Careers & Hiring', count: '5.6k posts', isHot: false },
        { tag: '#signalr', category: 'Realtime Web', count: '3.1k posts', isHot: false },
    ];

    return (
        <div className="flex flex-col min-h-full pb-12">
            <Titlebar title="Search" />

            <div className="p-4 sm:p-6 max-w-4xl space-y-6">
                
                <div className="relative flex items-center">
                    
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search people, code snippets, tags, jobs..."
                        className="w-full h-13 pl-4 pr-10 rounded-2xl bg-white/[0.03] border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-md transition-all text-sm sm:text-base shadow-inner"
                    />
                    {query && (
                        <button 
                            onClick={() => setQuery('')}
                            className="absolute right-3 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5 pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-white text-black shadow-md'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {query.trim().length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400 font-medium">
                                Results for <span className="text-white font-bold">"{query}"</span>
                            </span>
                        </div>

                        {(activeTab === 'all' || activeTab === 'people') && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">People</h3>
                                </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-blue-400" />
                                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                    Trending Topics & Discussions
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {trendingTopics.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setQuery(item.tag)}
                                        className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-zinc-500">{item.category}</span>
                                            <span className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition mt-0.5">
                                                {item.tag}
                                            </span>
                                            <span className="text-xs text-zinc-500 mt-1">{item.count}</span>
                                        </div>
                                        <div className="p-2 rounded-full text-zinc-600 group-hover:text-white transition">
                                            <ArrowUpRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-amber-400" />
                                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                                    Explore by Ecosystem
                                </h2>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['Fullstack Development', 'AI & Machine Learning', 'UI/UX Design', '.NET & C#', 'Next.js & React', 'PostgreSQL', 'Startups & Founders', 'Remote Work'].map((category, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setQuery(category)}
                                        className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/5 text-xs font-medium text-zinc-300 transition active:scale-95"
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}