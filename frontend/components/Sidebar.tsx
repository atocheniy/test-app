'use client';

import clsx from 'clsx';
import Avatar from '@/components/Avatar';
import { LayoutGrid, Menu, MessageCircle, MessageSquareWarning, Newspaper, Search, Settings } from 'lucide-react';
import Link from "next/link";
import { usePathname } from 'next/navigation';

import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from 'next/navigation';

export default function Sidebar() {
    const { userData, UserNameNormalized } = useApplication();
    const { t } = useLanguage();
    
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { name: t.nav.home, href: '/home', icon: Menu },
        { name: t.nav.feed, href: '/feed', icon: Newspaper },
        { name: t.nav.search, href: '/search', icon: Search },
        { name: t.nav.messages, href: '/messages', icon: MessageCircle },
        { name: t.nav.explore, href: '/other', icon: LayoutGrid }
    ];

    return (
         <aside className="w-64 shrink-0 hidden md:flex text-white p-3 flex flex-col h-screen sticky top-0 light:text-zinc-900">
            <div>
                <div className="p-3 mb-4 border border-white/5 bg-white/[0.02]  rounded-2xl text-sm font-bold text-white flex flex-row items-center gap-2 light:bg-white light:border-zinc-200/80 light:shadow-sm light:text-zinc-900">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40px" height="34px" className="border border-white/15 rounded-xl light:border-zinc-200">
                        <rect width="100" height="100" rx="40" fill="#000000" />
                        <g fill="#FFFFFF">
                            <path d="M 50,28 L 80,48 H 65 L 50,39 L 35,48 H 20 Z" />
                            <path d="M 50,43 L 80,63 H 65 L 50,54 L 35,63 H 20 Z" />
                            <path d="M 50,58 L 80,78 H 65 L 50,69 L 35,78 H 20 Z" />
                        </g>
                    </svg>
                    {t.nav.site}
                </div>
                <nav>
                    <ul className="space-y-1">
                        {links.map((link) => {
                            const LinkIcon = link.icon;
                            return (
                                <Link 
                                    key={link.href}
                                    href={link.href} 
                                    className={clsx(
                                        "block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all duration-150 flex flex-row gap-2 items-center light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-zinc-100",
                                        {
                                            'block py-1.5 px-3 text-sm font-medium text-zinc-100 bg-white/5 rounded-md transition-all duration-150 light:bg-zinc-100 light:text-zinc-950': pathname === link.href,
                                        },
                                    )}
                                >
                                    <LinkIcon className="w-4 h-4 stroke-[1.8]"/>{link.name}
                                </Link>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <div className="mt-8">
                <h1 className="text-md font-semibold text-zinc-100 p-2 light:text-zinc-900">{t.nav.forApplicants}</h1>
                <nav>
                    <ul className="space-y-1">
                        <li>
                            <Link 
                                href="/vacancies"
                                className={clsx(
                                    "block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all duration-150 flex flex-row gap-2 items-center light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-zinc-100",
                                    {
                                        'block py-1.5 px-3 text-sm font-medium text-zinc-100 bg-white/5 rounded-md transition-all duration-150 light:bg-zinc-100 light:text-zinc-950': pathname === '/vacancies',
                                    },
                                )}
                            >
                                <MessageSquareWarning className="w-4 h-4 stroke-[1.8]"/>
                                {t.nav.vacancies}
                            </Link>
                        </li>    
                    </ul>
                </nav>
            </div>

            <div className="mt-auto">
                <ul className="space-y-1">
                    <li>
                        <Link 
                            href="/settings"
                            className="border border-white/5 block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-all duration-150 flex flex-row gap-2 items-center light:border-zinc-200/80 light:bg-white light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-zinc-100 light:shadow-sm"
                        >
                            <Settings className="w-4 h-4 stroke-[1.8]"/>
                            {t.nav.settings}
                        </Link>
                    </li>
                </ul>
            </div>

            <div 
                onClick={(e) => {
                    router.push('/profile');
                }} 
                className="mt-4 p-3 bg-white/[0.02] border rounded-2xl text-sm text-zinc-400 flex flex-row gap-3 items-center justify-start hover:bg-stone-950 hover:border border-white/5 cursor-pointer transition-all duration-150 light:bg-white light:border-zinc-200/80 light:shadow-sm light:hover:bg-zinc-50 light:text-zinc-600"
            >
                <Avatar
                    src={userData.avatar}
                    name={userData.fullName || UserNameNormalized}
                    className="w-10 h-10 text-xs"
                />
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer light:text-zinc-900">
                        {userData.fullName}
                    </span>
                    <span className="text-zinc-500 text-sm light:text-zinc-500">{UserNameNormalized}</span>
                </div>
            </div>
        </aside>
    )
}