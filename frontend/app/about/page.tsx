import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition mb-8 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <ArrowLeft size={14} /> Назад
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-4">О платформе Compile</h1>
        <p className="text-zinc-400 leading-relaxed mb-6">
          Compile — это современная социальная сеть и платформа интерактивных портфолио для разработчиков программного обеспечения.
        </p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">Цель проекта</h2>
            <p className="text-zinc-400 leading-relaxed">
              Объединить демонстрацию реальных проектов с прозрачным процессом разработки. Вместо статичного резюме разработчики ведут интерактивные девлоги, делятся архитектурными решениями и находят единомышленников или работодателей.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">Технологический стек</h2>
            <ul className="list-disc list-inside text-zinc-400 space-y-1">
              <li>Фронтенд: Next.js 15, React 19, TypeScript, Tailwind CSS</li>
              <li>Бэкенд: ASP.NET Core 9 / 10, C#, Entity Framework Core</li>
              <li>База данных: PostgreSQL (Neon Serverless)</li>
              <li>Реальное время: WebSockets, SignalR</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-xs text-zinc-600 border-t border-white/5 pt-6">
          © 2026 Compile. Все права защищены.
        </div>
      </div>
    </div>
  );
}
