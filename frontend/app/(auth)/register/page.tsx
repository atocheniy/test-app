'use client';
import { useApplication } from '@/context/ApplicationContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuthService } from '@/services/authService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Register() {
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const isRu = language === 'ru';

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const { refreshUserData, refreshPostsData, refreshUserPostsData } = useApplication();

    const formatRegisterError = (err: any): string => {
        const data = err?.response?.data;
        const code = data?.code || (Array.isArray(data) ? data[0]?.code : undefined);

        if (code === 'DuplicateUserName') {
            return isRu ? 'Это имя пользователя уже занято' : 'This username is already taken';
        }
        if (code === 'DuplicateEmail') {
            return isRu ? 'Этот Email уже зарегистрирован' : 'This email is already registered';
        }
        if (code === 'InvalidUserName') {
            return isRu
                ? 'Имя пользователя (3–32 символа) может содержать только латинские буквы, цифры, точку, дефис или подчёркивание'
                : 'Username (3–32 chars) may only contain Latin letters, digits, dots, hyphens, or underscores';
        }
        if (code === 'InvalidEmail') {
            return isRu ? 'Укажите корректный Email' : 'Please enter a valid email address';
        }
        if (code === 'PasswordTooShort') {
            return isRu ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters long';
        }

        return (Array.isArray(data) ? data[0]?.description : undefined)
            || data?.message
            || (isRu ? 'Ошибка регистрации' : 'Registration error');
    };

    const handleRegister = async () => {
        setError('');

        const cleanName = fullName.trim();
        const cleanEmail = email.trim();
        const cleanUser = userName.trim().replace(/^@+/, '');

        if (!cleanEmail || !password || !cleanName || !cleanUser) {
            setError(isRu ? 'Заполните все поля' : 'Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            setError(isRu ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters long');
            return;
        }
        if (password !== confirmPass) {
            setError(isRu ? 'Пароли не совпадают' : 'Passwords do not match');
            return;
        }

        try 
        {
            await AuthService.register({ email: cleanEmail, userName: cleanUser, password, fullName: cleanName });
            await AuthService.login({ email: cleanEmail, password });
            
            await refreshUserData();
            await refreshPostsData();
            await refreshUserPostsData();
            
            router.push('/feed');  
        } 
        catch (err: any) 
        {
            console.error(err);
            setError(formatRegisterError(err));
        }
    };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 px-4 relative">
      <button
        type="button"
        onClick={() => setLanguage(isRu ? 'en' : 'ru')}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
      >
        {isRu ? 'RU / EN' : 'EN / RU'}
      </button>

      <div className="w-full max-w-[400px] mx-4 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
              <rect width="100" height="100" rx="40" fill="#000000" />
              <g fill="#FFFFFF">
                <path d="M 50,28 L 80,48 H 65 L 50,39 L 35,48 H 20 Z" />
                <path d="M 50,43 L 80,63 H 65 L 50,54 L 35,63 H 20 Z" />
                <path d="M 50,58 L 80,78 H 65 L 50,69 L 35,78 H 20 Z" />
              </g>
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            {isRu ? 'Создать аккаунт' : 'Create an account'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5">
            {isRu ? 'Введите данные для создания аккаунта' : 'Enter your details to create your account'}
          </p>
        </div>

        <form className="space-y-4 relative z-10" onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
        }}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {isRu ? 'Имя' : 'Name'}
            </label>
            <input
              type="text"
              value={fullName}
              placeholder={isRu ? 'Имя' : 'Name'}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {isRu ? 'Имя пользователя' : 'Username'}
            </label>
            <input
              type="text"
              value={userName}
              placeholder="@username"
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {isRu ? 'Пароль' : 'Password'}
              </label>
            </div>
            <input
              type="password"
              value={password}
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {isRu ? 'Подтвердите пароль' : 'Confirm Password'}
              </label>
            </div>
            <input
              type="password"
              value={confirmPass}
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-xl bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            {isRu ? 'Зарегистрироваться' : 'Sign Up'}
          </button>

          {error && (
            <div className="relative z-10 flex items-center justify-center pt-1">
              <p className="text-center text-red-500 text-xs">{error}</p>
            </div>
          )}
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6 relative z-10">
          {isRu ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
          <Link href="/login" className="text-zinc-300 hover:underline transition-all">
            {isRu ? 'Войти' : 'Sign in'}
          </Link>
        </p>

      </div>
    </div>
  );
}