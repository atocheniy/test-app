'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
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
          {isRu ? 'Условия использования (Terms of Service)' : 'Terms of Service'}
        </h1>
        <p className="text-xs text-zinc-500 mb-8">
          {isRu ? 'Последнее обновление: 2026 год' : 'Last updated: 2026'}
        </p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? '1. Общие положения' : '1. General Terms'}
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              {isRu
                ? 'Используя платформу Compile, вы соглашаетесь соблюдать правила профессионального сообщества, уважать авторские права на исходный код и медиаматериалы, а также соблюдать правила безопасности.'
                : 'By using the Compile platform, you agree to follow professional community guidelines, respect copyrights on source code and media materials, and comply with security policies.'}
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? '2. Контент пользователя' : '2. User Content'}
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              {isRu
                ? 'Вы сохраняете авторские права на свои проекты, статьи и код, публикуемые в платформе. Запрещается публикация вредоносного кода, спама и материалов, нарушающих законодательство.'
                : 'You retain copyright ownership over your projects, articles, and code published on the platform. Publishing malicious code, spam, or materials that violate applicable laws is strictly prohibited.'}
            </p>
          </section>
        </div>

        <div className="mt-12 text-xs text-zinc-600 border-t border-white/5 pt-6">
          {isRu ? '© 2026 Compile. Все права защищены.' : '© 2026 Compile. All rights reserved.'}
        </div>
      </div>
    </div>
  );
}
