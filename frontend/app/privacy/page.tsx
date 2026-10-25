import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition mb-8 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <ArrowLeft size={14} /> Назад
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-4">Политика конфиденциальности (Privacy Policy)</h1>
        <p className="text-xs text-zinc-500 mb-8">Последнее обновление: 2026 год</p>

        <div className="space-y-6 text-sm text-zinc-300">
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">1. Сбор данных</h2>
            <p className="text-zinc-400 leading-relaxed">
              Платформа обрабатывает базовую информацию учетной записи (имя, логин, email, ссылки на GitHub/соцсети) исключительно для обеспечения функционирования профиля разработчика.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-base font-semibold text-white mb-2">2. Безопасность и хранение</h2>
            <p className="text-zinc-400 leading-relaxed">
              Пароли хранятся в защищенном виде с использованием хэширования Identity. Токены авторизации защищены шифрованием JWT. Мы не передаем ваши персональные данные третьим лицам.
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
