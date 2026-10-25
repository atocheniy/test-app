'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition mb-8 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <ArrowLeft size={14} /> {isRu ? 'Назад' : 'Back'}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {isRu ? 'О платформе Compile' : 'About Compile'}
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-6">
          {isRu
            ? 'Compile — это современная социальная сеть и платформа интерактивных портфолио для разработчиков программного обеспечения.'
            : 'Compile is a modern social network and interactive portfolio platform for software developers.'}
        </p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? 'Цель проекта' : 'Project Goal'}
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              {isRu
                ? 'Объединить демонстрацию реальных проектов с прозрачным процессом разработки. Вместо статичного резюме разработчики ведут интерактивные девлоги, делятся архитектурными решениями и находят единомышленников или работодателей.'
                : 'To combine showcasing real projects with a transparent development process. Instead of a static resume, developers maintain interactive devlogs, share architectural decisions, and connect with like-minded peers or employers.'}
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? 'Технологический стек' : 'Tech Stack'}
            </h2>
            <ul className="list-disc list-inside text-zinc-400 space-y-1">
              <li>{isRu ? 'Фронтенд: Next.js 15, React 19, TypeScript, Tailwind CSS' : 'Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS'}</li>
              <li>{isRu ? 'Бэкенд: ASP.NET Core 9 / 10, C#, Entity Framework Core' : 'Backend: ASP.NET Core 9 / 10, C#, Entity Framework Core'}</li>
              <li>{isRu ? 'База данных: PostgreSQL (Neon Serverless)' : 'Database: PostgreSQL (Neon Serverless)'}</li>
              <li>{isRu ? 'Реальное время: WebSockets, SignalR' : 'Real-time: WebSockets, SignalR'}</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-xs text-zinc-600 border-t border-white/5 pt-6">
          {isRu ? '© 2026 Compile. Все права защищены.' : '© 2026 Compile. All rights reserved.'}
        </div>
      </div>
    </div>
  );
}
