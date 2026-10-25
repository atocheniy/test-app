'use client'

import clsx from "clsx";
import { Briefcase, LayoutGrid, MessageCircle, Newspaper, Search, UserPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinearBlur } from "progressive-blur";
import { useLanguage } from "@/context/LanguageContext";

export default function BottomPanel() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  const links = [
    { name: t.nav.feed, href: '/feed', icon: Newspaper },
    { name: t.nav.search, href: '/search', icon: Search },
    { name: isRu ? 'Хаб' : 'Hub', href: '/other', icon: LayoutGrid },
    { name: t.nav.vacancies, href: '/vacancies', icon: Briefcase },
    { name: isRu ? 'Чат' : 'Chat', href: '/messages', icon: MessageCircle },
    { name: t.nav.profile, href: '/profile', icon: UserPen },
  ];

  return (
    <div className="md:hidden block fixed inset-x-0 bottom-0 z-1000 pointer-events-none">
      <div className="relative h-28">
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
            height: 120,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      </div>

      <div
        className="absolute inset-x-0 flex justify-center px-2 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <nav className="pointer-events-auto flex items-center justify-between gap-1 px-2 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 max-w-[calc(100vw-16px)]">
          {links.map((link) => {
            const LinkIcon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.name}
                aria-label={link.name}
                className={clsx(
                  "flex items-center justify-center p-2.5 rounded-full transition-all duration-150 shrink-0",
                  active
                    ? "text-zinc-100 bg-white/10"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                )}
              >
                <LinkIcon className="w-5 h-5 stroke-[1.8]" />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
