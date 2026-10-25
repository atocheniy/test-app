'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const isRu = language === 'ru';

  const toggleLanguage = () => {
    setLanguage(isRu ? 'en' : 'ru');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col justify-between">
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center font-mono font-bold text-xs text-white">
              &gt;_
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Compile</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-xs text-zinc-400">
            <Link href="/feed" className="hover:text-white transition">
              {isRu ? 'Лента' : 'Feed'}
            </Link>
            <Link href="/other" className="hover:text-white transition">
              {isRu ? 'Проекты' : 'Projects'}
            </Link>
            <Link href="/vacancies" className="hover:text-white transition">
              {isRu ? 'Вакансии' : 'Vacancies'}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-zinc-400 hover:text-white transition"
              title={isRu ? 'Сменить язык' : 'Change language'}
            >
              {isRu ? 'EN' : 'RU'}
            </button>
            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-white transition px-2 py-1"
            >
              {isRu ? 'Войти' : 'Sign in'}
            </Link>
            <Link
              href="/register"
              className="text-xs font-medium px-3 py-1.5 rounded bg-white text-black hover:bg-zinc-200 transition"
            >
              {isRu ? 'Регистрация' : 'Register'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 sm:py-28 flex-1 w-full">
        <div className="max-w-2xl">
          <div className="inline-block text-[11px] font-mono uppercase tracking-wider text-zinc-500 border border-zinc-900 px-2 py-0.5 rounded mb-6">
            {isRu ? 'Платформа для разработчиков' : 'Developer Network'}
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
            {isRu
              ? 'Проекты, поиск работы и общение разработчиков.'
              : 'Projects, devlogs, and developer networking.'}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
            {isRu
              ? 'Единое пространство для публикации проектов с хронологией разработки, обмена опытом в ленте с подсветкой кода, обсуждений в сообществах и поиска работы.'
              : 'A platform to publish pet projects with progress devlogs, share syntax-highlighted code, discuss in technical communities, and find jobs.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-medium transition"
            >
              <span>{isRu ? 'Перейти в ленту' : 'Open feed'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 text-xs font-medium transition"
            >
              <span>{isRu ? 'Войти в аккаунт' : 'Log in'}</span>
            </Link>
          </div>
        </div>

        <div className="border-t border-zinc-900 my-16" />

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-6">
            {isRu ? 'Разделы платформы' : 'Platform Modules'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 rounded overflow-hidden">
            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">01</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'Мини-профили проектов' : 'Project Mini-Profiles'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Витрина проекта: описание, используемый стек, статус готовности (Released/Beta), ссылки на репозиторий и отдельный девлог разработки.'
                    : 'Showcase for your projects: description, tech stack, release status, GitHub links, and progress devlog.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/project/[id]</span>
                <Link href="/other" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">02</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'Лента и сниппеты кода' : 'Feed & Code Snippets'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Алгоритмическая лента с подсветкой синтаксиса для 20+ языков, поддержкой Markdown, формул, девлогов и фильтром подписок.'
                    : 'Algorithmic feed with syntax highlighting, Markdown formatting, devlog attachments, and subscription filters.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/feed</span>
                <Link href="/feed" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">03</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'Сообщества и компании' : 'Communities & Companies'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Тематические хабы (.NET, Frontend, AI/ML, DevOps) и официальные профили компаний с верификацией и ролями участников.'
                    : 'Technology hubs and verified company profiles with role-based member permissions.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/c/[slug]</span>
                <Link href="/search" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">04</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'IT-вакансии' : 'Job Board'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Прямой поиск работы без посредников: фильтрация по грейду (Junior/Middle/Senior), формату занятости и зарплатной вилке.'
                    : 'Direct job board with filtering by seniority, salary ranges, and remote/hybrid work modes.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/vacancies</span>
                <Link href="/vacancies" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">05</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'Чат на WebSockets' : 'WebSocket Chat'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Мгновенный обмен сообщениями на базе ASP.NET Core SignalR, индикаторы прочтения, онлайн-статусы и закрепление диалогов.'
                    : 'Real-time direct messaging built on ASP.NET Core SignalR with read receipts and pinned dialogs.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/messages</span>
                <Link href="/messages" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-black p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">06</span>
                <h3 className="text-sm font-medium text-white mt-2 mb-2">
                  {isRu ? 'Профиль и языки (RU/EN)' : 'Profile & Localization'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isRu
                    ? 'Карточки опыта работы (UserExperience), стек технологий, социальный граф подписчиков и сохранение языка в БД.'
                    : 'Work history cards, technology stack badges, follower graph, and language preference synced to DB.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>/settings</span>
                <Link href="/settings" className="text-zinc-400 hover:text-white transition">
                  {isRu ? 'Смотреть' : 'View'} &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 my-16" />

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-6">
            {isRu ? 'Технические характеристики' : 'Technical Specifications'}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-zinc-900 rounded p-4 bg-zinc-950">
              <div className="text-[11px] font-mono text-zinc-500">CLIENT</div>
              <div className="text-sm font-semibold text-white mt-1">Next.js 15</div>
              <div className="text-xs text-zinc-400 mt-1">React 19, TypeScript</div>
            </div>

            <div className="border border-zinc-900 rounded p-4 bg-zinc-950">
              <div className="text-[11px] font-mono text-zinc-500">SERVER</div>
              <div className="text-sm font-semibold text-white mt-1">.NET 10 / C# 13</div>
              <div className="text-xs text-zinc-400 mt-1">ASP.NET Core, SignalR</div>
            </div>

            <div className="border border-zinc-900 rounded p-4 bg-zinc-950">
              <div className="text-[11px] font-mono text-zinc-500">DATABASE</div>
              <div className="text-sm font-semibold text-white mt-1">PostgreSQL 16</div>
              <div className="text-xs text-zinc-400 mt-1">EF Core 9, 14 таблиц</div>
            </div>

            <div className="border border-zinc-900 rounded p-4 bg-zinc-950">
              <div className="text-[11px] font-mono text-zinc-500">AUTH & API</div>
              <div className="text-sm font-semibold text-white mt-1">JWT Bearer</div>
              <div className="text-xs text-zinc-400 mt-1">Identity, REST API</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 font-semibold font-sans">Compile</span>
            <span>&copy; 2026</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/feed" className="hover:text-zinc-300 transition">
              {isRu ? 'лента' : 'feed'}
            </Link>
            <Link href="/other" className="hover:text-zinc-300 transition">
              {isRu ? 'проекты' : 'projects'}
            </Link>
            <Link href="/vacancies" className="hover:text-zinc-300 transition">
              {isRu ? 'вакансии' : 'vacancies'}
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition">
              {isRu ? 'вход' : 'login'}
            </Link>
            <Link href="/register" className="hover:text-zinc-300 transition">
              {isRu ? 'регистрация' : 'register'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
