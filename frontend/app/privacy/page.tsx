'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
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
          {isRu ? 'Политика конфиденциальности (Privacy Policy)' : 'Privacy Policy'}
        </h1>
        <p className="text-xs text-zinc-500 mb-8">
          {isRu ? 'Последнее обновление: 2026 год' : 'Last updated: 2026'}
        </p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? '1. Сбор данных' : '1. Data Collection'}
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              {isRu
                ? 'Платформа обрабатывает базовую информацию учетной записи (имя, логин, email, ссылки на GitHub/соцсети) исключительно для обеспечения функционирования профиля разработчика.'
                : 'The platform processes basic account information (name, username, email, GitHub/social links) solely to enable developer profile functionality.'}
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">
              {isRu ? '2. Безопасность и хранение' : '2. Security and Storage'}
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              {isRu
                ? 'Пароли хранятся в защищенном виде с использованием хэширования Identity. Токены авторизации защищены шифрованием JWT. Мы не передаем ваши персональные данные третьим лицам.'
                : 'Passwords are stored securely using Identity hashing. Authorization tokens are protected by JWT encryption. We do not share your personal data with third parties.'}
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
