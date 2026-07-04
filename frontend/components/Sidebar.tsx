'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {Menu, Settings, UserPen, Search, Newspaper, MessageSquareWarning, MessageCircle} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useApplication } from "@/context/ApplicationContext";

const links = [
  { name: 'Home', href: '/home', icon: Menu },
  { name: 'Feed', href: '/feed', icon: Newspaper},
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
];

export default function Sidebar() {
    const { userData, UserNameNormalized } = useApplication();
    const { refreshUserData } = useApplication();
    
    const pathname = usePathname();
    const router = useRouter();

    return (
         <aside className="w-78 text-white p-3 flex flex-col h-screen sticky top-0">
            <div>
                <div className="p-6 mb-4 border border-white/5 bg-white/5 rounded-2xl text-sm text-zinc-400"></div>
                <nav>
                    <ul className="space-y-1">
                        {links.map((link) => {
                            const LinkIcon = link.icon;
                            return (
                                <Link 
                                    key={link.name}
                                    href={link.href} 
                                    className={clsx(
                                        "block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all duration-150 flex flex-row gap-2 items-center",
                                        {
                                            'block py-1.5 px-3 text-sm font-medium text-zinc-100 bg-white/5 rounded-md transition-all duration-150': pathname === link.href,
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
                <h1 className="text-md font-semibold text-zinc-100 p-2">For applicants</h1>
                <nav>
                    <ul className="space-y-1">
                        <li>
                            <Link 
                                href="/vacancies"
                                className={clsx(
                                    "block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all duration-150 flex flex-row gap-2 items-center",
                                    {
                                        'block py-1.5 px-3 text-sm font-medium text-zinc-100 bg-white/5 rounded-md transition-all duration-150': pathname === '/vacancies',
                                    },
                                )}
                            >
                                <MessageSquareWarning className="w-4 h-4 stroke-[1.8]"/>
                                Vacancies
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
                            className="border border-white/5 block py-1.5 px-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-all duration-150 flex flex-row gap-2 items-center"
                        >
                            <Settings className="w-4 h-4 stroke-[1.8]"/>
                            Settings
                        </Link>
                    </li>
                </ul>
            </div>

            <div 
                onClick={(e) => {
                    router.push('/profile');
                }} 
                className="mt-4 p-3 bg-white/5 border rounded-2xl text-sm text-zinc-400 flex flex-row gap-3 items-center justify-start hover:bg-stone-950 hover:border border-white/5 cursor-pointer transition-all duration-150"
            >
                <div className="w-10 h-10 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                    {userData.avatar && (
                        <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer">
                        {userData.fullName}
                    </span>
                    <span className="text-zinc-500 text-sm">{UserNameNormalized}</span>
                </div>
            </div>
        </aside>
    )
}