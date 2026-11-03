'use client'

import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import clsx from "clsx";
import { Briefcase, LayoutGrid, MessageCircle, Newspaper, Search, UserPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomPanel() {
  const pathname = usePathname();
  const { userData } = useApplication();
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent light:from-white/80 light:via-white/30 light:to-transparent" />
      </div>

      <div
        className="absolute inset-x-0 flex justify-center px-2 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <nav className="pointer-events-auto flex items-center justify-between backdrop-blur-2xl gap-1 px-2 py-1.5 rounded-full bg-[#0a0a0a]/90 border border-white/10 shadow-2xl shadow-black/60 max-w-[calc(100vw-16px)] light:bg-white/90 light:border-zinc-200/80 light:shadow-xl light:shadow-zinc-950/10">
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
                  "relative flex items-center justify-center p-2.5 rounded-full transition-all duration-150 shrink-0",
                  active
                    ? "text-zinc-100 bg-white/10 light:bg-zinc-100 light:text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-zinc-100"
                )}
              >
                <LinkIcon className="w-5 h-5 stroke-[1.8]" />
                {link.href === '/profile' && (userData.pendingWatchRequestsCount ?? 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0a0a0a] light:ring-white" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
