import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition mb-8 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <ArrowLeft size={14} /> Назад
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-4">Условия использования (Terms of Service)</h1>
        <p className="text-xs text-zinc-500 mb-8">Последнее обновление: 2026 год</p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">1. Общие положения</h2>
            <p className="text-zinc-400 leading-relaxed">
              Используя платформу DevLink, вы соглашаетесь соблюдать правила профессионального сообщества, уважать авторские права на исходный код и медиаматериалы, а также соблюдать правила безопасности.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">2. Контент пользователя</h2>
            <p className="text-zinc-400 leading-relaxed">
              Вы сохраняете авторские права на свои проекты, статьи и код, публикуемые в платформе. Запрещается публикация вредоносного кода, спама и материалов, нарушающих законодательство.
            </p>
          </section>
        </div>

        <div className="mt-12 text-xs text-zinc-600 border-t border-white/5 pt-6">
          © 2026 DevLink. Все права защищены.
        </div>
      </div>
    </div>
  );
}
