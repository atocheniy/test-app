'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowRight,
  Zap,
  Layers,
  Code2,
  Briefcase,
  GitBranch,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Shield,
  Users,
  Cpu,
  Bell,
  FileCode2,
} from 'lucide-react';
import Link from 'next/link';

function Crosshair({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none font-mono text-sm leading-none text-zinc-500/90 ${className}`}
    >
      +
    </span>
  );
}

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const isRu = language === 'ru';

  const [dashView, setDashView] = useState<'overview' | 'projects' | 'devlogs' | 'vacancies'>('overview');
  const [chartTab, setChartTab] = useState<'commits' | 'views' | 'match'>('commits');
  const [featureTabA, setFeatureTabA] = useState<number>(0);
  const [featureTabB, setFeatureTabB] = useState<number>(0);
  const [hoveredBar, setHoveredBar] = useState<number>(4);
  const [starredRows, setStarredRows] = useState<Record<number, boolean>>({ 0: true, 2: true });

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureTabA((prev) => (prev + 1) % 3);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const toggleStarRow = (idx: number) => {
    setStarredRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const dashboardRows = [
    {
      date: '25.10.2026',
      statusRu: 'Релиз',
      statusEn: 'Released',
      metric: '+148 ★',
      project: 'Compile Core v2.5',
      stack: 'Next.js 15 • .NET 10',
      detailRu: 'Мини-профили и девлоги',
      detailEn: 'Mini-profiles & devlogs',
    },
    {
      date: '24.10.2026',
      statusRu: 'Девлог',
      statusEn: 'Devlog',
      metric: '98% Match',
      project: 'HyperFlow Engine',
      stack: 'C# 13 • SignalR',
      detailRu: 'Оркестратор пайплайнов',
      detailEn: 'Pipeline orchestrator',
    },
    {
      date: '23.10.2026',
      statusRu: 'Вакансия',
      statusEn: 'Vacancy',
      metric: '$6,800',
      project: 'VectorCore AI',
      stack: 'TypeScript • React 19',
      detailRu: 'Senior Fullstack (Remote)',
      detailEn: 'Senior Fullstack (Remote)',
    },
    {
      date: '22.10.2026',
      statusRu: 'Бета',
      statusEn: 'Beta',
      metric: '+84 ★',
      project: 'KubePulse TUI',
      stack: 'Go • Docker • gRPC',
      detailRu: 'Терминальный мониторинг',
      detailEn: 'Terminal cluster monitor',
    },
    {
      date: '21.10.2026',
      statusRu: 'Релиз',
      statusEn: 'Released',
      metric: '+219 ★',
      project: 'NeuralRAG Local',
      stack: 'Python • PostgreSQL',
      detailRu: 'Векторный индекс без облака',
      detailEn: 'Local vector search index',
    },
    {
      date: '20.10.2026',
      statusRu: 'Вакансия',
      statusEn: 'Vacancy',
      metric: '$7,400',
      project: 'CloudSpan Systems',
      stack: '.NET 10 • PostgreSQL',
      detailRu: 'Lead Backend Architect',
      detailEn: 'Lead Backend Architect',
    },
  ];

  const filteredRows =
    dashView === 'overview'
      ? dashboardRows
      : dashView === 'projects'
      ? dashboardRows.filter((r) => r.statusEn === 'Released' || r.statusEn === 'Beta')
      : dashView === 'devlogs'
      ? dashboardRows.filter((r) => r.statusEn === 'Devlog' || r.statusEn === 'Released')
      : dashboardRows.filter((r) => r.statusEn === 'Vacancy');

  return (
    <div className="min-h-screen bg-[#020203] text-zinc-100 font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(1.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.04); }
        }
        @keyframes dashFlow {
          to { stroke-dashoffset: -24; }
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 5s ease-in-out infinite;
        }
        .animate-dash-flow {
          animation: dashFlow 1.8s linear infinite;
        }
        .dot-matrix-bg {
          background-image: radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      <div className="w-full border-b border-white/[0.08] bg-[#020203]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-24 border-x border-white/[0.08] flex items-center justify-between relative">
          <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
          <Crosshair className="absolute -bottom-[8px] -right-[4.5px]" />

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-7 h-7 sm:w-9 sm:h-9 border border-white/20 rounded-xl bg-black transition-transform duration-300 group-hover:scale-105 shadow-[0_0_25px_rgba(255,255,255,0.12)] shrink-0"
            >
              <rect width="100" height="100" rx="26" fill="#000000" />
              <g fill="#FFFFFF">
                <path d="M 50,25 L 80,45 H 65 L 50,36 L 35,45 H 20 Z" />
                <path d="M 50,42 L 80,62 H 65 L 50,53 L 35,62 H 20 Z" />
                <path d="M 50,59 L 80,79 H 65 L 50,70 L 35,79 H 20 Z" />
              </g>
            </svg>
            <span className="font-bold text-sm sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase text-white">
              COMPILE
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-zinc-400">
            <Link href="/feed" className="hover:text-white transition">
              {isRu ? 'Лента' : 'Product'}
            </Link>
            <Link href="/other" className="hover:text-white transition">
              {isRu ? 'Проекты' : 'Projects'}
            </Link>
            <Link href="/vacancies" className="hover:text-white transition">
              {isRu ? 'Вакансии' : 'Vacancies'}
            </Link>
            <Link href="/search" className="hover:text-white transition">
              {isRu ? 'Сообщества' : 'Communities'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-xs font-mono flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`cursor-pointer transition ${
                  !isRu ? 'text-white font-semibold' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                EN
              </button>
              <span className="text-zinc-700">/</span>
              <button
                onClick={() => setLanguage('ru')}
                className={`cursor-pointer transition ${
                  isRu ? 'text-white font-semibold' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                RU
              </button>
            </div>

            <Link
              href="/register"
              className="text-xs sm:text-sm font-medium text-white px-3.5 py-2 sm:px-6 sm:py-3 rounded-full border border-white/25 hover:border-white hover:bg-white hover:text-black transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.08)] whitespace-nowrap"
            >
              {isRu ? 'Начать бесплатно' : 'Start for free'}
            </Link>
          </div>
        </div>
      </div>

      <section className="w-full border-b border-white/[0.08] relative overflow-hidden">
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 w-[230vw] sm:w-[185vw] h-[230vw] sm:h-[185vw] rounded-full border-t border-white/45 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_28%,transparent_60%)] shadow-[0_-30px_140px_rgba(255,255,255,0.18)]" />
        <div className="pointer-events-none absolute top-[380px] left-1/2 -translate-x-1/2 w-[680px] h-[220px] bg-white/[0.13] blur-[110px] rounded-full animate-pulse-glow" />

        <div className="max-w-[1380px] mx-auto border-x border-white/[0.08] relative pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 sm:px-14">
          <div className="relative z-10 text-center max-w-4xl mx-auto pt-8 sm:pt-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-300 mb-8 shadow-[0_0_25px_rgba(255,255,255,0.08)]">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              <span>
                {isRu
                  ? 'ПЛАТФОРМА ПОРТФОЛИО И КАРЬЕРЫ РАЗРАБОТЧИКОВ'
                  : 'DEVELOPER PORTFOLIO & CAREER PLATFORM'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-white leading-[1.08]">
              {isRu ? (
                <>
                  Собери свой Код и Карьеру
                  <br />в Одном Месте
                </>
              ) : (
                <>
                  Compile your Code &amp; Career
                  <br />
                  in One Place
                </>
              )}
            </h1>

            <p className="mt-7 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
              {isRu
                ? 'Единая платформа для демонстрации пет-проектов, ведения девлогов с подсветкой кода и прямого отклика на вакансии по совпадению стека.'
                : 'All-in-one platform to showcase engineering projects, publish syntax-highlighted devlogs, and match with tech teams.'}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/feed"
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition shadow-[0_0_35px_rgba(255,255,255,0.28)]"
              >
                <span>{isRu ? 'Открыть платформу' : 'Open Workspace'}</span>
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 bg-black/60 hover:border-white/35 text-xs sm:text-sm text-zinc-300 hover:text-white transition"
              >
                {isRu ? 'Войти в аккаунт' : 'Sign In'}
              </Link>
            </div>

            <div className="relative h-16 mt-8 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-8 opacity-80">
                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="w-2 h-2 rounded-full bg-white blur-[1px] animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-zinc-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-2 max-w-[1160px] mx-auto rounded-3xl border border-white/20 bg-[#070709]/95 shadow-[0_-25px_110px_rgba(255,255,255,0.13)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
              <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-6 flex flex-col justify-between bg-[#050507]">
                <div>
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] mb-7">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-white text-black font-mono text-xs font-bold flex items-center justify-center">
                        C
                      </div>
                      <span className="text-xs font-semibold text-white">Compile OS</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </div>

                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 px-2 mb-3">
                    {isRu ? 'Навигация' : 'Workspace'}
                  </div>

                  <div className="space-y-1.5">
                    {[
                      {
                        id: 'overview' as const,
                        labelRu: 'Дашборд профиля',
                        labelEn: 'Dashboard',
                        icon: Layers,
                      },
                      {
                        id: 'projects' as const,
                        labelRu: 'Мини-профили проектов',
                        labelEn: 'Projects',
                        icon: GitBranch,
                      },
                      {
                        id: 'devlogs' as const,
                        labelRu: 'Лента девлогов',
                        labelEn: 'Devlogs & Code',
                        icon: Code2,
                      },
                      {
                        id: 'vacancies' as const,
                        labelRu: 'Вакансии (% Match)',
                        labelEn: 'Job Matches',
                        icon: Briefcase,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = dashView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setDashView(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                            active
                              ? 'bg-white/[0.09] text-white font-medium border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{isRu ? item.labelRu : item.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden lg:block pt-5 border-t border-white/[0.06]">
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500">SIGNALR HUB</div>
                      <div className="text-xs font-medium text-white mt-0.5">
                        {isRu ? 'В сети • 12 мс' : 'Connected • 12 ms'}
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9 p-6 sm:p-8 flex flex-col justify-between bg-[#070709]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-200">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <span>
                      {dashView === 'overview'
                        ? isRu
                          ? 'Обзор инженерного профиля'
                          : 'Engineering Overview'
                        : dashView === 'projects'
                        ? isRu
                          ? 'Репозитории и релизы'
                          : 'Repositories & Releases'
                        : dashView === 'devlogs'
                        ? isRu
                          ? 'Хронология девлогов'
                          : 'Devlog Timeline'
                        : isRu
                        ? 'Подходящие вакансии'
                        : 'Matched Vacancies'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <Link
                      href="/profile"
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition"
                    >
                      + {isRu ? 'Новый проект' : 'New Project'}
                    </Link>
                    <Link
                      href="/feed"
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition"
                    >
                      &gt;_ {isRu ? 'Опубликовать код' : 'Post Snippet'}
                    </Link>
                    <Link
                      href="/vacancies"
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition"
                    >
                      {isRu ? 'Вакансии' : 'Jobs'}
                    </Link>
                  </div>
                </div>

                <div className="my-6 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0d] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="text-xs text-zinc-500">
                        {isRu ? 'Индекс профиля и охват' : 'Profile Index & Reach'}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-mono">
                          {chartTab === 'commits'
                            ? '98.4%'
                            : chartTab === 'views'
                            ? '14,820'
                            : '642 ★'}
                        </span>
                        <span className="w-6 h-6 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-zinc-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="inline-block mt-2.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                        {isRu ? 'Обновлено только что' : 'Updated 1 min ago'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href="/register"
                        className="px-3.5 py-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white hover:text-black text-xs font-medium transition"
                      >
                        + {isRu ? 'Добавить стек' : 'Add Stack'}
                      </Link>
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="inline-flex flex-wrap p-1 rounded-xl border border-white/10 bg-black text-xs">
                        {[
                          { id: 'commits' as const, ru: 'Совпадение стека', en: 'Stack Match' },
                          { id: 'views' as const, ru: 'Просмотры кода', en: 'Code Views' },
                          { id: 'match' as const, ru: 'Звёзды проектов', en: 'Project Stars' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setChartTab(t.id)}
                            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                              chartTab === t.id
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {isRu ? t.ru : t.en}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 border border-white/10 rounded-lg px-2.5 py-1">
                        {isRu ? 'За неделю' : 'This Week'}
                      </span>
                    </div>

                    <div className="relative h-36 w-full">
                      <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(255,255,255,0.05)" />
                        <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.05)" />
                        <line x1="0" y1="95" x2="500" y2="95" stroke="rgba(255,255,255,0.05)" />

                        <path
                          d={
                            chartTab === 'commits'
                              ? 'M 10,85 L 75,62 L 140,78 L 205,68 L 270,38 L 335,54 L 395,44 L 395,110 L 10,110 Z'
                              : chartTab === 'views'
                              ? 'M 10,90 L 75,75 L 140,55 L 205,62 L 270,30 L 335,42 L 395,28 L 395,110 L 10,110 Z'
                              : 'M 10,80 L 75,70 L 140,65 L 205,48 L 270,45 L 335,34 L 395,22 L 395,110 L 10,110 Z'
                          }
                          fill="url(#lineGlow)"
                        />

                        <path
                          d={
                            chartTab === 'commits'
                              ? 'M 10,85 L 75,62 L 140,78 L 205,68 L 270,38 L 335,54 L 395,44'
                              : chartTab === 'views'
                              ? 'M 10,90 L 75,75 L 140,55 L 205,62 L 270,30 L 335,42 L 395,28'
                              : 'M 10,80 L 75,70 L 140,65 L 205,48 L 270,45 L 335,34 L 395,22'
                          }
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        <path
                          d="M 395,44 L 445,34 L 490,48"
                          fill="none"
                          stroke="rgba(255,255,255,0.35)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="animate-dash-flow"
                        />

                        <line
                          x1="395"
                          y1="44"
                          x2="395"
                          y2="110"
                          stroke="rgba(255,255,255,0.4)"
                          strokeDasharray="3 3"
                        />
                        <circle cx="395" cy="44" r="4" fill="#ffffff" />
                        <circle
                          cx="395"
                          cy="44"
                          r="9"
                          fill="none"
                          stroke="rgba(255,255,255,0.4)"
                        />
                      </svg>

                      <div className="absolute top-1 right-12 px-3 py-1.5 rounded-xl border border-white/20 bg-black/90 backdrop-blur-md text-[11px] font-mono shadow-lg">
                        <div className="text-zinc-400">
                          {isRu ? 'Рейтинг стека' : 'Live Telemetry'}
                        </div>
                        <div className="text-white font-semibold">
                          •{' '}
                          {chartTab === 'commits'
                            ? '98.4% Match'
                            : chartTab === 'views'
                            ? '+2,410 views'
                            : '+148 stars'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <span className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {isRu ? 'Фильтры' : 'Filters'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {isRu ? 'Нажми ★ чтобы отметить' : 'Click ★ to bookmark'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] overflow-x-auto bg-[#050507]">
                    <div className="min-w-[540px]">
                      <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/[0.07] text-[10px] font-mono text-zinc-500 uppercase">
                        <div className="col-span-2">{isRu ? 'Дата' : 'Date'}</div>
                        <div className="col-span-3">{isRu ? 'Статус / Метрика' : 'Status / Metric'}</div>
                        <div className="col-span-3">{isRu ? 'Проект / Компания' : 'Project / Company'}</div>
                        <div className="col-span-2 hidden sm:block">{isRu ? 'Стек' : 'Tech Stack'}</div>
                        <div className="col-span-2 text-right">{isRu ? 'Детали' : 'Details'}</div>
                      </div>

                      <div className="divide-y divide-white/[0.05]">
                        {filteredRows.map((row, idx) => {
                          const isStarred = !!starredRows[idx];
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleStarRow(idx)}
                              className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-white/[0.03] transition cursor-pointer"
                            >
                              <div className="col-span-2 font-mono text-zinc-400 flex items-center gap-2.5">
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition text-[10px] ${
                                    isStarred
                                      ? 'bg-white border-white text-black'
                                      : 'border-white/15 text-transparent'
                                  }`}
                                >
                                  ★
                                </span>
                                <span>{row.date}</span>
                              </div>
                              <div className="col-span-3 flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-zinc-200">
                                  {isRu ? row.statusRu : row.statusEn}
                                </span>
                                <span className="font-mono text-white font-medium">{row.metric}</span>
                              </div>
                              <div className="col-span-3 font-medium text-zinc-200 truncate pr-2">
                                {row.project}
                              </div>
                              <div className="col-span-2 hidden sm:block font-mono text-[11px] text-zinc-400 truncate pr-2">
                                {row.stack}
                              </div>
                              <div className="col-span-4 sm:col-span-2 text-right text-zinc-500 truncate">
                                {isRu ? row.detailRu : row.detailEn}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-white/[0.08] relative">
        <div className="max-w-[1380px] mx-auto border-x border-white/[0.08] relative py-40 sm:py-56 px-8 flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 200 200"
            className="w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] absolute opacity-40 animate-float-slow pointer-events-none"
          >
            <defs>
              <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <g
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.4"
              filter="url(#glowFilter)"
              strokeLinejoin="round"
            >
              <path d="M 100,28 L 172,76 H 136 L 100,52 L 64,76 H 28 Z" />
              <path d="M 100,72 L 172,120 H 136 L 100,96 L 64,120 H 28 Z" />
              <path d="M 100,116 L 172,164 H 136 L 100,140 L 64,164 H 28 Z" />
            </g>
          </svg>

          <h2 className="relative z-10 max-w-4xl text-center text-2xl sm:text-4xl font-bold uppercase tracking-wider text-white leading-[1.45]">
            {isRu
              ? 'COMPILE ДАЁТ ПОЛНУЮ СИСТЕМУ ДЛЯ ДЕМОНСТРАЦИИ ПРОЕКТОВ, ВЕДЕНИЯ ДЕВЛОГОВ И ПОИСКА РАБОТЫ — ЧТОБЫ ТВОЙ КОД И ОПЫТ ГОВОРИЛИ САМИ ЗА СЕБЯ'
              : 'COMPILE GIVES YOU A COMPLETE SYSTEM TO SHOWCASE PROJECTS, PUBLISH DEVLOGS, AND MATCH WITH TECH TEAMS — SO YOUR CODE SPEAKS FOR ITSELF'}
          </h2>
        </div>
      </section>

      <section className="w-full border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto border-x border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] relative">
            <div className="p-9 sm:p-12 flex flex-col justify-between min-h-[440px] relative group">
              <Crosshair className="absolute -top-[8px] -left-[4.5px]" />
              <Crosshair className="absolute -top-[8px] -right-[4.5px] hidden md:block" />
              <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {isRu ? 'Мини-профили проектов' : 'Interactive Project Profiles'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                  {isRu
                    ? 'Единая витрина твоих репозиториев со статусом релиза, галереей скриншотов и хронологией девлогов.'
                    : 'A unified showcase bringing all your repositories, release stages, and devlog updates into one source of truth.'}
                </p>
              </div>

              <div className="mt-10 rounded-2xl border border-white/15 bg-[#08080b] p-5 shadow-[0_0_45px_rgba(255,255,255,0.04)] group-hover:border-white/30 transition">
                <div className="text-[11px] text-zinc-500 font-mono">
                  {isRu ? 'Суммарный рейтинг проектов' : 'Total Project Stars'}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
                  1,482 ★
                </div>
                <div className="text-[11px] font-mono text-zinc-300 mt-1">
                  ↑ 24.8% {isRu ? 'за последний месяц' : 'vs last month'}
                </div>

                <div className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-4">
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="w-7 h-7 rounded-full border border-white/15 bg-white/5 flex items-center justify-center font-mono text-[10px]">
                        01
                      </span>
                      <div>
                        <div className="text-zinc-200 font-medium text-xs">Compile Network</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Next.js • .NET 10</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-white">+640 ★ &rsaquo;</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="w-7 h-7 rounded-full border border-white/15 bg-white/5 flex items-center justify-center font-mono text-[10px]">
                        02
                      </span>
                      <div>
                        <div className="text-zinc-200 font-medium text-xs">HyperFlow Engine</div>
                        <div className="text-[10px] text-zinc-500 font-mono">C# 13 • SignalR</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-zinc-300">+842 ★ &rsaquo;</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-9 sm:p-12 flex flex-col justify-between min-h-[440px] relative group">
              <Crosshair className="absolute -top-[8px] -right-[4.5px] hidden md:block" />
              <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {isRu ? 'Синхронизация кода и девлогов' : 'Code & Devlog Integrations'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                  {isRu
                    ? 'Публикуй фрагменты кода с подсветкой 20+ языков, формулами и привязкой к конкретному проекту.'
                    : 'Publish syntax-highlighted code across 20+ languages with Markdown preview and direct project linking.'}
                </p>
              </div>

              <div className="mt-10 rounded-2xl border border-white/15 bg-[#08080b] p-5 shadow-[0_0_45px_rgba(255,255,255,0.04)] group-hover:border-white/30 transition">
                <div className="flex items-center gap-3 pb-3.5 border-b border-white/[0.07]">
                  <span className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-mono text-xs font-bold">
                    &gt;_
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {isRu ? 'Реалтайм компиляция стека' : 'Realtime Stack Telemetry'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {isRu ? 'Синхронизировано во всех разделах' : 'Synced across all modules'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {[
                    { name: 'GitHub Repositories', statusRu: 'Подключено', statusEn: 'Connected' },
                    { name: 'Monaco / Prism Syntax', statusRu: 'Активно', statusEn: 'Connected' },
                    { name: 'SignalR WebSockets', statusRu: 'Подключено', statusEn: 'Connected' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.06] bg-black text-xs"
                    >
                      <span className="text-zinc-200 font-medium">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        • {isRu ? item.statusRu : item.statusEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-9 sm:p-12 flex flex-col justify-between min-h-[440px] relative group">
              <Crosshair className="absolute -top-[8px] -right-[4.5px]" />
              <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
              <Crosshair className="absolute -bottom-[8px] -right-[4.5px]" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {isRu ? 'Аналитика совпадения вакансий' : 'Custom Career Match Reports'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                  {isRu
                    ? 'Алгоритм автоматически считает % совпадения твоего стека с открытыми вакансиями компаний.'
                    : 'Go beyond static resumes — see real-time stack match percentages against open engineering roles.'}
                </p>
              </div>

              <div className="mt-10 rounded-2xl border border-white/15 bg-[#08080b] p-5 shadow-[0_0_45px_rgba(255,255,255,0.04)] group-hover:border-white/30 transition">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {isRu ? 'Рейтинг откликов' : 'Offer Match Rate'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {isRu ? 'Наведи на столбец графика' : 'Hover bars to inspect'}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {[78, 82, 86, 91, 96, 99][hoveredBar]}% Match
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2.5 items-end h-32 pt-4 px-1">
                  {[
                    { m: 'Apr', h: '45%' },
                    { m: 'May', h: '60%' },
                    { m: 'Jun', h: '52%' },
                    { m: 'Jul', h: '75%' },
                    { m: 'Aug', h: '92%' },
                    { m: 'Sep', h: '100%' },
                  ].map((b, i) => (
                    <div
                      key={b.m}
                      onMouseEnter={() => setHoveredBar(i)}
                      className="flex flex-col items-center gap-2 h-full justify-end cursor-pointer"
                    >
                      <div className="w-full bg-white/[0.06] rounded-t-md h-full flex items-end overflow-hidden p-0.5">
                        <div
                          style={{ height: b.h }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            hoveredBar === i
                              ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                              : 'bg-zinc-600/70'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{b.m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-t border-white/[0.08]">
            <Link
              href="/other"
              className="px-9 sm:px-12 py-9 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <span className="text-sm font-semibold text-white">
                {isRu ? 'Сообщества и Компании' : 'Communities & Company Hubs'}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/15 text-zinc-400">
                /c/[slug]
              </span>
            </Link>
            <Link
              href="/messages"
              className="px-9 sm:px-12 py-9 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <span className="text-sm font-semibold text-white">
                {isRu ? 'Реалтайм Мессенджер SignalR' : 'SignalR Direct Messaging'}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-white">
                LIVE
              </span>
            </Link>
            <Link
              href="/settings"
              className="px-9 sm:px-12 py-9 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <span className="text-sm font-semibold text-white">
                {isRu ? 'Двуязычный интерфейс' : 'Full Bilingual Localization'}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/15 text-zinc-400">
                RU / EN
              </span>
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto h-28 sm:h-40 border-x border-white/[0.08] relative">
          <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
          <Crosshair className="absolute -bottom-[8px] -right-[4.5px]" />
        </div>
      </div>

      <section className="w-full border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto border-x border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            {[
              {
                id: 0,
                ru: 'Обзор девлогов и кода',
                en: 'Devlog & Code Overview',
              },
              {
                id: 1,
                ru: 'Мини-профили релизов',
                en: 'Project Release Profiles',
              },
              {
                id: 2,
                ru: 'Отклики по совпадению стека',
                en: 'Stack-Matched Applications',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFeatureTabA(tab.id)}
                className={`py-7 px-6 sm:px-10 text-left text-xs sm:text-sm font-medium transition relative cursor-pointer ${
                  featureTabA === tab.id
                    ? 'text-white bg-white/[0.02]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isRu ? tab.ru : tab.en}
                {featureTabA === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_12px_#ffffff]" />
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            <div className="lg:col-span-5 p-10 sm:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-[1.18]">
                {featureTabA === 0
                  ? isRu
                    ? 'Публикуй архитектуру и код без ожидания релиза'
                    : 'Share your engineering progress without waiting for release day'
                  : featureTabA === 1
                  ? isRu
                    ? 'Преврати каждый репозиторий в интерактивную презентацию'
                    : 'Turn every repository into an interactive product showcase'
                  : isRu
                  ? 'Откликайся на вакансии с прозрачным процентом совпадения'
                  : 'Apply to engineering roles with instant stack verification'}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 mt-5 leading-relaxed">
                {featureTabA === 0
                  ? isRu
                    ? 'Compile превращает твои рабочие заметки и сниппеты кода в структурированный девлог проекта, который видят подписчики, CTO и рекрутеры.'
                    : 'Compile turns your daily commits and code snippets into a structured devlog timeline—giving recruiters and peers verifiable proof of your expertise.'
                  : featureTabA === 1
                  ? isRu
                    ? 'Добавляй скриншоты с амбиентной подсветкой, ссылки на Live Demo и GitHub, технологический стек и стадию готовности проекта.'
                    : 'Attach ambient-lit galleries, live demo links, tech stack badges, and release milestones to every project in your profile.'
                  : isRu
                  ? 'Больше никаких слепых откликов: платформа сопоставляет твой стек из проектов и опыта работы с требованиями каждой вакансии.'
                  : 'No more blind applications: Compile automatically intersects your verified project stack with open job requirements.'}
              </p>

              <div className="mt-10">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-3.5 pl-6 pr-3 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>{isRu ? 'Попробовать' : 'Try it free'}</span>
                  <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 p-10 sm:p-16 dot-matrix-bg flex items-center justify-center">
              <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#060609]/95 p-8 shadow-[0_0_70px_rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {featureTabA === 0
                        ? isRu
                          ? 'Охват девлогов и сниппетов'
                          : 'Devlog & Code Engagement'
                        : featureTabA === 1
                        ? isRu
                          ? 'Динамика звёзд проекта'
                          : 'Project Star Velocity'
                        : isRu
                        ? 'Точность совпадения стека'
                        : 'Career Stack Alignment'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
                      {featureTabA === 0
                        ? '24,560 views'
                        : featureTabA === 1
                        ? '1,482 stars'
                        : '96.8% match'}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-1">
                      ↑ 18.4% {isRu ? 'к прошлой неделе' : 'vs last week'}
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-mono text-zinc-300">
                    Compile Analytics
                  </span>
                </div>

                <div className="relative h-52 w-full pt-4">
                  <svg viewBox="0 0 460 150" className="w-full h-full overflow-visible">
                    <line x1="0" y1="30" x2="460" y2="30" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="75" x2="460" y2="75" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="120" x2="460" y2="120" stroke="rgba(255,255,255,0.05)" />

                    <path
                      d={
                        featureTabA === 0
                          ? 'M 10,110 L 65,65 L 120,102 L 175,85 L 230,50 L 285,38 L 340,56 L 395,30 L 450,24'
                          : featureTabA === 1
                          ? 'M 10,115 L 65,95 L 120,82 L 175,68 L 230,58 L 285,42 L 340,35 L 395,25 L 450,18'
                          : 'M 10,95 L 65,88 L 120,70 L 175,64 L 230,45 L 285,48 L 340,30 L 395,28 L 450,20'
                      }
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <path
                      d="M 10,125 L 65,105 L 120,118 L 175,92 L 230,85 L 285,78 L 340,84 L 395,66 L 450,58"
                      fill="none"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1.5"
                    />

                    <line
                      x1="230"
                      y1="20"
                      x2="230"
                      y2="135"
                      stroke="rgba(255,255,255,0.3)"
                      strokeDasharray="3 3"
                    />
                    <circle cx="230" cy="50" r="4.5" fill="#ffffff" />
                    <circle cx="230" cy="85" r="4" fill="#71717a" stroke="#ffffff" />
                  </svg>

                  <div className="absolute top-14 left-1/2 -translate-x-2 rounded-xl border border-white/20 bg-black/95 px-4 py-3 text-[11px] font-mono shadow-2xl">
                    <div className="text-zinc-400">• {isRu ? 'Девлоги' : 'Devlogs'}: +82,400</div>
                    <div className="text-zinc-200 mt-1">
                      • {isRu ? 'Отклики' : 'Direct Offers'}: +57,840
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto h-28 sm:h-40 border-x border-white/[0.08] relative">
          <Crosshair className="absolute -bottom-[8px] -left-[4.5px]" />
          <Crosshair className="absolute -bottom-[8px] -right-[4.5px]" />
        </div>
      </div>

      <section className="w-full border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto border-x border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            {[
              {
                id: 0,
                ru: 'Единое ядро портфолио',
                en: 'Centralized Portfolio Core',
              },
              {
                id: 1,
                ru: 'Реактивный SignalR хаб',
                en: 'Real-Time SignalR Hub',
              },
              {
                id: 2,
                ru: 'Безопасность и JWT Identity',
                en: 'Role-Based Access & JWT',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFeatureTabB(tab.id)}
                className={`py-7 px-6 sm:px-10 text-left text-xs sm:text-sm font-medium transition relative cursor-pointer ${
                  featureTabB === tab.id
                    ? 'text-white bg-white/[0.02]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isRu ? tab.ru : tab.en}
                {featureTabB === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_12px_#ffffff]" />
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            <div className="lg:col-span-5 p-10 sm:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-[1.18]">
                {isRu
                  ? 'Построено на надёжной инженерной архитектуре'
                  : 'Built on high-performance engineering infrastructure'}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 mt-5 leading-relaxed">
                {isRu
                  ? 'Compile объединяет Next.js 15, ASP.NET Core 10, облачную базу PostgreSQL и постоянные WebSocket-соединения SignalR с ролевым контролем доступа в сообществах и компаниях.'
                  : 'Compile is engineered on Next.js 15, ASP.NET Core 10, serverless PostgreSQL, and persistent SignalR WebSockets with role-based permissions for communities and companies.'}
              </p>

              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-3.5 pl-6 pr-3 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>{isRu ? 'Попробовать' : 'Try it free'}</span>
                  <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 p-10 sm:p-16 dot-matrix-bg flex items-center justify-center">
              <div className="w-full max-w-2xl relative py-8">
                <div className="flex justify-center mb-7">
                  <div className="px-5 py-2.5 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5 shadow-lg">
                    <FileCode2 className="w-4 h-4 text-white" />
                    <span>{isRu ? 'Девлоги и Сниппеты' : 'Devlogs & Snippets'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
                  <div className="sm:col-span-3 space-y-4">
                    <div className="px-4 py-3 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5">
                      <GitBranch className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">{isRu ? 'Проекты' : 'Git Projects'}</span>
                    </div>
                    <div className="px-4 py-3 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">{isRu ? 'Сообщества' : 'Communities'}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <div className="rounded-2xl border border-white/35 bg-[#09090d] p-6 shadow-[0_0_55px_rgba(255,255,255,0.16)] relative">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-white">
                        <Cpu className="w-4 h-4 text-white" />
                        <span>Compile Core Ledger</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-3">
                        {isRu ? 'Индекс инженера' : 'Engineer Score'}
                      </div>
                      <div className="flex items-end justify-between gap-3 mt-1">
                        <div>
                          <div className="text-2xl font-bold text-white font-mono">98.4% Match</div>
                          <div className="text-[11px] font-mono text-zinc-300 mt-1">
                            ↑ 16.2% {isRu ? 'активность' : 'vs last month'}
                          </div>
                        </div>
                        <svg viewBox="0 0 90 36" className="w-24 h-10">
                          <path
                            d="M 2,30 L 18,22 L 34,26 L 50,14 L 68,18 L 88,6"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-4">
                    <div className="px-4 py-3 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">{isRu ? 'Вакансии' : 'Vacancies'}</span>
                    </div>
                    <div className="px-4 py-3 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">{isRu ? 'SignalR Чат' : 'SignalR Alerts'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-7">
                  <div className="px-5 py-2.5 rounded-xl border border-white/15 bg-[#08080c] text-xs font-mono text-zinc-200 flex items-center gap-2.5 shadow-lg">
                    <Shield className="w-4 h-4 text-white" />
                    <span>{isRu ? 'JWT & PostgreSQL Cloud' : 'JWT & PostgreSQL Cloud'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#020203]">
        <div className="max-w-[1380px] mx-auto px-8 sm:px-12 py-12 border-x border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono relative">
          <Crosshair className="absolute -top-[8px] -left-[4.5px]" />
          <Crosshair className="absolute -top-[8px] -right-[4.5px]" />

          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-widest uppercase font-sans">
              COMPILE
            </span>
            <span>&copy; 2026</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">compileapp.site</span>
          </div>

          <div className="flex flex-wrap items-center gap-7">
            <Link href="/feed" className="hover:text-white transition">
              {isRu ? 'Лента' : 'Feed'}
            </Link>
            <Link href="/other" className="hover:text-white transition">
              {isRu ? 'Проекты' : 'Projects'}
            </Link>
            <Link href="/vacancies" className="hover:text-white transition">
              {isRu ? 'Вакансии' : 'Vacancies'}
            </Link>
            <Link href="/about" className="hover:text-white transition">
              {isRu ? 'О платформе' : 'About'}
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              {isRu ? 'Условия' : 'Terms'}
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              {isRu ? 'Приватность' : 'Privacy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
