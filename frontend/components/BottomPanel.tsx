'use client'
import clsx from "clsx";
import { LinkIcon, Menu, UserPen, MessageCircle, Newspaper, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { name: 'Feed', href: '/feed', icon: Newspaper },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Profile', href: '/profile', icon: UserPen },
];

export default function BottomPanel() {
    const pathname = usePathname();
    const router = useRouter();

    return(
        <div className="hidden max-sm:flex fixed bottom-0 z-1000 w-full h-15 bg-black/50 backdrop-blur-sm border border-white/5 p-5 items-center justify-around text-zinc-300">
            {links.map((link) => {
                const LinkIcon = link.icon;
                return (
                    <Link 
                        key={link.name}
                        href={link.href} 
                        className={clsx(
                            "flex flex-col items-center text-xs text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all duration-150 items-center",
                            {
                                'flex flex-col p-2 px-5 text-sm font-medium text-zinc-100 bg-white/5 rounded-xl transition-all duration-150 items-center': pathname === link.href,
                            },
                        )}
                    >
                        <LinkIcon className="w-4 h-4 stroke-[1.8]"/>{link.name}
                    </Link>
                );
            })}
        </div>
    )
}