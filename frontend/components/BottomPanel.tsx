'use client'

import clsx from "clsx";
import { MessageCircle, Newspaper, Search, UserPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinearBlur } from "progressive-blur";

const links = [
  { name: 'Feed', href: '/feed', icon: Newspaper },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: UserPen },
];

export default function BottomPanel() {
  const pathname = usePathname();

  return (
    <div className="hidden max-sm:block fixed inset-x-0 bottom-0 z-1000 pointer-events-none">
      <div className="relative h-32">
        <LinearBlur
                side="bottom"
                steps={6}
                strength={20}
                falloffPercentage={100}
                tint="rgba(2, 2, 2, 0.75)"
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 140,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div
        className="absolute inset-x-0 flex justify-center px-4 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
          {links.map((link) => {
            const LinkIcon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150",
                  active
                    ? "text-zinc-100 bg-white/10"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                )}
              >
                <LinkIcon className="w-4 h-4 stroke-[1.8]" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}